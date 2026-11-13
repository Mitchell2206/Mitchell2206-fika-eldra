'use client';
import { useShop } from './shop-provider';

export function ConsentLink({ className = '' }: { className?: string }) {
  const { setConsent } = useShop();
  return <button className={'bg-transparent p-0 text-left text-sm text-[#cfccbf] hover:text-[var(--gold-soft)] ' + className} onClick={() => setConsent(null)}>Cookies</button>;
}
