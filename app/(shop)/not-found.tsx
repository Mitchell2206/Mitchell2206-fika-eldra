import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="wrap grid min-h-[60vh] place-items-center py-24 text-center">
      <div>
        <span className="font-serif text-7xl text-[var(--gold)]">ᛈ</span>
        <h1 className="h2 mt-6">Este camino no lleva a ningún lado.</h1>
        <p className="mt-4">La página que buscás no existe o cambió de lugar.</p>
        <Link href="/" className="btn mt-9">Volver al inicio</Link>
      </div>
    </section>
  );
}
