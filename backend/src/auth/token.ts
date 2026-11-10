import {
  createHmac,
  timingSafeEqual,
} from 'node:crypto';
import type { TokenPayload } from './auth.types.js';

const TOKEN_LIFETIME_SECONDS = 20 * 60 * 60;

function getSecret(): string {
  const secret = process.env.AUTH_TOKEN_SECRET;
  if (!secret || Buffer.byteLength(secret) < 32) {
    throw new Error('AUTH_TOKEN_SECRET must contain at least 32 bytes.');
  }
  return secret;
}

function sign(input: string): string {
  return createHmac('sha256', getSecret()).update(input).digest('base64url');
}

export function createAccessToken(userId: string, tokenVersion: number): string {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(
    JSON.stringify({ alg: 'HS256', typ: 'JWT' }),
  ).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({
      sub: userId,
      ver: tokenVersion,
      iat: now,
      exp: now + TOKEN_LIFETIME_SECONDS,
    } satisfies TokenPayload),
  ).toString('base64url');
  const unsignedToken = `${header}.${payload}`;
  return `${unsignedToken}.${sign(unsignedToken)}`;
}

export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    const [headerPart, payloadPart, signature, extra] = token.split('.');
    if (!headerPart || !payloadPart || !signature || extra !== undefined) {
      return null;
    }
    const header = JSON.parse(
      Buffer.from(headerPart, 'base64url').toString('utf8'),
    ) as { alg?: string };
    if (header.alg !== 'HS256') return null;

    const unsignedToken = `${headerPart}.${payloadPart}`;
    const expected = Buffer.from(sign(unsignedToken));
    const received = Buffer.from(signature);
    if (
      expected.length !== received.length ||
      !timingSafeEqual(expected, received)
    ) {
      return null;
    }

    const payload = JSON.parse(
      Buffer.from(payloadPart, 'base64url').toString('utf8'),
    ) as TokenPayload;
    if (
      typeof payload.sub !== 'string' ||
      !Number.isInteger(payload.ver) ||
      !Number.isInteger(payload.exp) ||
      payload.exp <= Math.floor(Date.now() / 1000)
    ) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}
