import type { Metadata } from 'next';
import { Checkout } from './checkout';

export const metadata: Metadata = { title: 'Tu pedido', robots: { index: false } };

export default function Page() {
  return <Checkout />;
}
