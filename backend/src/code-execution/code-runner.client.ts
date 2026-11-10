import {
  Injectable,
  HttpException,
  HttpStatus,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { request } from 'node:http';
import type { ExecuteCodeDto } from './dto/execute-code.dto.js';

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  timedOut: boolean;
  outputTruncated: boolean;
  durationMs: number;
}

@Injectable()
export class CodeRunnerClient {
  private readonly logger = new Logger(CodeRunnerClient.name);
  private readonly socketPath =
    process.env.RUNNER_SOCKET_PATH ?? '/run/code-runner/runner.sock';

  execute(input: ExecuteCodeDto): Promise<ExecutionResult> {
    const body = JSON.stringify(input);

    return new Promise((resolve, reject) => {
      let settled = false;
      const fail = (): void => {
        if (settled) return;
        settled = true;
        reject(
          new ServiceUnavailableException(
            'The code execution service is unavailable.',
          ),
        );
      };

      const req = request(
        {
          socketPath: this.socketPath,
          path: '/execute',
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'content-length': Buffer.byteLength(body),
          },
        },
        (response) => {
          const chunks: Buffer[] = [];
          let size = 0;
          response.on('data', (chunk: Buffer | string) => {
            const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
            size += buffer.length;
            if (size > 512 * 1024) {
              response.destroy();
              fail();
              return;
            }
            chunks.push(buffer);
          });
          response.on('end', () => {
            if (settled) return;
            if (response.statusCode !== 200) {
              if (response.statusCode === 429) {
                settled = true;
                reject(
                  new HttpException(
                    'The code runner is busy. Please try again shortly.',
                    HttpStatus.TOO_MANY_REQUESTS,
                  ),
                );
                return;
              }
              fail();
              return;
            }
            try {
              const result = JSON.parse(
                Buffer.concat(chunks).toString('utf8'),
              ) as ExecutionResult;
              settled = true;
              resolve(
                result,
              );
            } catch (error) {
              this.logger.error(
                'Runner returned an invalid response.',
                error instanceof Error ? error.stack : undefined,
              );
              fail();
            }
          });
          response.on('error', fail);
        },
      );

      req.setTimeout(7_000, () => req.destroy(new Error('Runner timeout')));
      req.on('error', (error: Error) => {
        this.logger.warn(`Code runner request failed: ${error.message}`);
        fail();
      });
      req.end(body);
    });
  }
}
