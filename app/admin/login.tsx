'use client';
import Image from 'next/image';
import { useState } from 'react';
import { ArrowRight, Lock } from 'lucide-react';

export function Login({ configured }: { configured: boolean }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const r = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) });
    if (r.ok) location.reload();
    else { setError((await r.json().catch(() => ({}))).error || 'No pudimos ingresar.'); setBusy(false); }
  }
  return (
    <main className="grid min-h-screen place-items-center px-5">
      <form onSubmit={submit} className="panel w-full max-w-sm space-y-6">
        <Image src="/images/fika-eldra-logo.webp" alt="FIKA ELDRA" width={920} height={120} className="h-5 w-auto" />
        <div>
          <h1 className="font-serif text-4xl">Administración</h1>
          <p className="mt-2 text-sm">{configured ? 'Ingresá la contraseña del panel.' : 'Falta configurar ADMIN_PASSWORD en las variables de entorno de Vercel.'}</p>
        </div>
        <label className="field">
          <span className="flex items-center gap-2"><Lock size={14} /> Contraseña</span>
          <input className="input" type="password" autoComplete="current-password" autoFocus value={password} onChange={(e) => setPassword(e.target.value)} disabled={!configured} aria-invalid={!!error} />
          {error && <span className="field-error">{error}</span>}
        </label>
        <button className="btn btn-block" disabled={busy || !configured || !password}>{busy ? 'Ingresando…' : <>Ingresar <ArrowRight size={17} /></>}</button>
      </form>
    </main>
  );
}
