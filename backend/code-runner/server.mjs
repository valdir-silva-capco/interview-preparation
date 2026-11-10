import { randomUUID } from 'node:crypto';
import { createServer } from 'node:http';
import {
  chmod,
  chown,
  mkdir,
  mkdtemp,
  readdir,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { performance } from 'node:perf_hooks';

const socketPath =
  process.env.RUNNER_SOCKET_PATH ?? '/run/code-runner/runner.sock';
const socketGroup = Number(process.env.RUNNER_SOCKET_GID ?? 1000);
const maxSourceBytes = 20_000;
const maxOutputBytes = 32_768;
const maxConcurrentRuns = 2;
const wallTimeMs = 3_000;
const activeUids = new Set();
const uidPool = [20_001, 20_002];

function sendJson(response, statusCode, data) {
  const body = JSON.stringify(data);
  response.writeHead(statusCode, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(body),
    'cache-control': 'no-store',
  });
  response.end(body);
}

async function readJson(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > maxSourceBytes + 1_024) {
      throw new RangeError('Request body is too large.');
    }
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function collectOutput(stream, state, kill) {
  stream.on('data', (chunk) => {
    const remaining = maxOutputBytes - state.bytes;
    if (remaining > 0) {
      state.chunks.push(chunk.subarray(0, remaining));
      state.bytes += Math.min(chunk.length, remaining);
    }
    if (chunk.length > remaining) {
      state.truncated = true;
      kill();
    }
  });
}

function terminateGroup(child) {
  if (!child.pid) return;
  try {
    process.kill(-child.pid, 'SIGKILL');
  } catch (error) {
    if (error.code !== 'ESRCH') {
      child.kill('SIGKILL');
    }
  }
}

async function killProcessesForUid(uid) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    let foundProcess = false;
    const processIds = (await readdir('/proc')).filter((entry) =>
      /^\d+$/.test(entry),
    );
    for (const processId of processIds) {
      try {
        const processInfo = await stat(`/proc/${processId}`);
        if (processInfo.uid === uid) {
          foundProcess = true;
          process.kill(Number(processId), 'SIGKILL');
        }
      } catch (error) {
        if (error.code !== 'ENOENT' && error.code !== 'ESRCH') {
          throw error;
        }
      }
    }
    if (!foundProcess) return;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
}

async function runSnippet(language, source, uid) {
  const startedAt = performance.now();
  const workDir = await mkdtemp(path.join(tmpdir(), 'snippet-work-'));
  const sourcePath = path.join(tmpdir(), `snippet-${randomUUID()}.${language === 'python' ? 'py' : 'mjs'}`);
  const result = {
    stdout: '',
    stderr: '',
    exitCode: null,
    timedOut: false,
    outputTruncated: false,
    durationMs: 0,
  };

  try {
    // The launcher enters cwd before dropping privileges, so keep it searchable by root.
    await chmod(workDir, 0o711);
    await chown(workDir, uid, uid);
    await writeFile(sourcePath, source, { mode: 0o400, flag: 'wx' });
    await chmod(sourcePath, 0o400);
    await chown(sourcePath, uid, uid);

    const executable = '/usr/bin/prlimit';
    const resourceLimits = [
      '--cpu=2',
      '--nproc=16',
      '--fsize=1048576',
      '--',
    ];
    let command;
    let args;

    if (language === 'python') {
      command = executable;
      args = [
        '--as=268435456',
        ...resourceLimits,
        '/usr/local/bin/python3',
        '-I',
        '-S',
        '-B',
        sourcePath,
      ];
    } else {
      command = executable;
      args = [
        ...resourceLimits,
        '/usr/local/bin/node',
        '--permission',
        `--allow-fs-read=${sourcePath}`,
        '--max-old-space-size=96',
        '--max-semi-space-size=8',
        sourcePath,
      ];
    }

    const child = spawn(command, args, {
      cwd: workDir,
      detached: true,
      env: {
        HOME: workDir,
        LANG: 'C.UTF-8',
        PATH: '/usr/local/bin:/usr/bin:/bin',
        TMPDIR: workDir,
        TZ: 'UTC',
      },
      gid: uid,
      uid,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const stdout = { bytes: 0, chunks: [], truncated: false };
    const stderr = { bytes: 0, chunks: [], truncated: false };
    let outputLimitReached = false;
    const kill = () => {
      outputLimitReached = true;
      terminateGroup(child);
      void killProcessesForUid(uid).catch((error) =>
        console.error('Unable to stop snippet processes:', error),
      );
    };
    collectOutput(child.stdout, stdout, kill);
    collectOutput(child.stderr, stderr, kill);

    const timer = setTimeout(() => {
      result.timedOut = true;
      terminateGroup(child);
      void killProcessesForUid(uid).catch((error) =>
        console.error('Unable to stop timed-out snippet processes:', error),
      );
    }, wallTimeMs);

    await new Promise((resolve, reject) => {
      child.once('error', reject);
      child.once('close', (code) => {
        result.exitCode = code;
        resolve();
      });
    }).finally(() => clearTimeout(timer));

    result.stdout = Buffer.concat(stdout.chunks).toString('utf8');
    result.stderr = Buffer.concat(stderr.chunks).toString('utf8');
    result.outputTruncated =
      outputLimitReached || stdout.truncated || stderr.truncated;
    result.durationMs = Math.round(performance.now() - startedAt);
    return result;
  } finally {
    await Promise.all([
      killProcessesForUid(uid),
      rm(workDir, { recursive: true, force: true }),
      rm(sourcePath, { force: true }),
    ]);
  }
}

const server = createServer(async (request, response) => {
  if (request.method === 'GET' && request.url === '/health') {
    sendJson(response, 200, { status: 'ok' });
    return;
  }

  if (request.method !== 'POST' || request.url !== '/execute') {
    sendJson(response, 404, { message: 'Not found.' });
    return;
  }

  let input;
  try {
    input = await readJson(request);
  } catch (error) {
    const tooLarge = error instanceof RangeError;
    sendJson(response, tooLarge ? 413 : 400, {
      message: tooLarge ? 'Source code is too large.' : 'Invalid JSON body.',
    });
    return;
  }

  if (
    !input ||
    !['python', 'node'].includes(input.language) ||
    typeof input.source !== 'string' ||
    input.source.length === 0 ||
    Buffer.byteLength(input.source, 'utf8') > maxSourceBytes
  ) {
    sendJson(response, 400, { message: 'Invalid code execution request.' });
    return;
  }
  if (activeUids.size >= maxConcurrentRuns) {
    sendJson(response, 429, { message: 'Runner is at capacity.' });
    return;
  }

  const uid = uidPool.find((candidate) => !activeUids.has(candidate));
  if (uid === undefined) {
    sendJson(response, 429, { message: 'Runner is at capacity.' });
    return;
  }

  activeUids.add(uid);
  try {
    const result = await runSnippet(input.language, input.source, uid);
    sendJson(response, 200, result);
  } catch (error) {
    console.error('Snippet execution failed:', error);
    sendJson(response, 500, { message: 'Snippet execution failed.' });
  } finally {
    activeUids.delete(uid);
  }
});

await mkdir(path.dirname(socketPath), { recursive: true });
await rm(socketPath, { force: true });

server.listen(socketPath, async () => {
  await chown(socketPath, 0, socketGroup);
  await chmod(socketPath, 0o660);
  console.log('Code runner is listening on its Unix socket.');
});

function shutdown() {
  server.close(() => {
    void rm(socketPath, { force: true });
  });
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
