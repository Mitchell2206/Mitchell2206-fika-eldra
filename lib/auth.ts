import 'server-only';
import { cookies } from 'next/headers';

const COOKIE = 'fika_admin';
const DAYS = 14;

function secret() {
  const pass = process.env.ADMIN_PASSWORD;
  if (!pass) return null;
  return pass + '|' + (process.env.AUTH_SECRET || 'fika-eldra');
}

async function sign(value: string, key: string) {
  const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', k, new TextEncoder().encode(value));
  return Buffer.from(sig).toString('base64url');
}

function same(a: string, b: string) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

export async function isAdmin() {
  const key = secret();
  if (!key) return false;
  const raw = (await cookies()).get(COOKIE)?.value || '';
  const [exp, sig] = raw.split('.');
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  return same(sig, await sign(exp, key));
}

export async function login(password: string) {
  const key = secret();
  if (!key || typeof password !== 'string' || !same(password, process.env.ADMIN_PASSWORD!)) return false;
  const exp = String(Date.now() + DAYS * 864e5);
  (await cookies()).set(COOKIE, `${exp}.${await sign(exp, key)}`, {
    httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: DAYS * 86400,
  });
  return true;
}

export async function logout() {
  (await cookies()).delete(COOKIE);
}

export function sameOrigin(r: Request) {
  const origin = r.headers.get('origin');
  return !!origin && origin === new URL(r.url).origin;
}

export const fail = (message: string, status = 400) => Response.json({ error: message }, { status });
