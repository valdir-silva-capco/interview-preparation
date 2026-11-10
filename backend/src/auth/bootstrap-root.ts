import dataSource from '../database/data-source.js';
import { hashPassword } from './auth.service.js';
import { User } from '../users/user.entity.js';

function readLine(prompt: string, hidden = false): Promise<string> {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new Error('Root setup must be run in an interactive terminal.');
  }
  process.stdout.write(prompt);
  if (hidden) process.stdin.setRawMode(true);
  process.stdin.resume();

  return new Promise((resolve, reject) => {
    let value = '';
    const cleanup = () => {
      process.stdin.off('data', onData);
      if (hidden) process.stdin.setRawMode(false);
    };
    const onData = (chunk: Buffer) => {
      for (const character of chunk.toString('utf8')) {
        if (character === '\u0003') {
          cleanup();
          reject(new Error('Root setup cancelled.'));
          return;
        }
        if (character === '\r' || character === '\n') {
          cleanup();
          process.stdout.write('\n');
          resolve(value);
          return;
        }
        if (character === '\u007f' || character === '\b') {
          value = value.slice(0, -1);
          if (hidden) process.stdout.write('\b \b');
          continue;
        }
        value += character;
        process.stdout.write(hidden ? '*' : character);
      }
    };
    process.stdin.on('data', onData);
  });
}

async function bootstrapRoot(): Promise<void> {
  const email = (
    process.env.ROOT_EMAIL ?? 'valdir.silva@capco.com'
  ).trim().toLowerCase();
  await dataSource.initialize();
  try {
    const users = dataSource.getRepository(User);
    if (await users.findOneBy({ role: 'root' })) {
      throw new Error('A root account already exists.');
    }

    process.stdout.write(`Creating the initial root account for ${email}.\n`);
    const name = (await readLine('Name: ')).trim();
    const password = await readLine('Password (8+ characters): ', true);
    const confirmation = await readLine('Confirm password: ', true);
    if (name.length < 1 || name.length > 120) {
      throw new Error('Name must contain 1 to 120 characters.');
    }
    if (password.length < 8 || password.length > 200) {
      throw new Error('Password must contain 8 to 200 characters.');
    }
    if (password !== confirmation) {
      throw new Error('Passwords do not match.');
    }

    const user = users.create({
      name,
      email,
      passwordHash: await hashPassword(password),
      role: 'root',
      avatarUrl: null,
      isActive: true,
      tokenVersion: 0,
      companies: [],
      specialties: [],
    });
    await users.save(user);
    process.stdout.write('Root account created successfully.\n');
  } finally {
    await dataSource.destroy();
  }
}

void bootstrapRoot().catch((error: unknown) => {
  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error('Root account setup failed.');
  }
  process.exitCode = 1;
});
