'use client';
import { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { ProductCard } from '@/components/product-card';
import { unitPrice, useShop } from '@/components/shop-provider';

const SORTS = [['featured', 'Destacados'], ['asc', 'Menor precio'], ['desc', 'Mayor precio']] as const;

export function Catalog() {
  const { products } = useShop();
  const [cat, setCat] = useState('Todos');
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<string>('featured');
  const [onlyStock, setOnlyStock] = useState(false);
  const cats = useMemo(() => ['Todos', ...new Set(products.map((p) => p.category))], [products]);
  const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const shown = useMemo(() => {
    const list = products.filter((p) =>
      (cat === 'Todos' || p.category === cat) &&
      (!onlyStock || p.stock > 0) &&
      norm(`${p.name} ${p.aroma} ${(p.fragrances || []).join(' ')} ${p.brief} ${p.category}`).includes(norm(q.trim())),
    );
    if (sort === 'asc') list.sort((a, b) => unitPrice(a) - unitPrice(b));
    if (sort === 'desc') list.sort((a, b) => unitPrice(b) - unitPrice(a));
    return list;
  }, [products, cat, q, sort, onlyStock]);
  const matchAroma = q.trim().length > 2 ? products.find((p) => p.fragrances?.some((f: string) => norm(f).includes(norm(q.trim())))) : null;

  return (
    <div className="mt-12">
      <div className="sticky top-[74px] z-20 -mx-5 mb-10 flex flex-col gap-4 border-y border-[var(--line)] bg-[rgba(14,17,14,.9)] px-5 py-4 backdrop-blur md:mx-0 md:rounded-2xl md:border md:px-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="pills -mx-1 flex-nowrap overflow-x-auto px-1 pb-1 lg:pb-0">
          {cats.map((c) => (
            <button key={c} className="pill flex-none" aria-pressed={cat === c} onClick={() => setCat(c)}>{c}</button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="relative min-w-0 flex-1 lg:w-64 lg:flex-none">
            <Search size={16} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <input className="input !min-h-[42px] !rounded-full !pl-10 !text-sm" placeholder="Buscá un aroma: lavanda, café…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar" />
            {q && <button aria-label="Borrar búsqueda" className="absolute top-1/2 right-3 -translate-y-1/2 text-[var(--muted-foreground)]" onClick={() => setQ('')}><X size={15} /></button>}
          </label>
          <select aria-label="Ordenar" className="input !min-h-[42px] !w-auto !rounded-full !py-0 !text-sm" value={sort} onChange={(e) => setSort(e.target.value)}>
            {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <button className="pill" aria-pressed={onlyStock} onClick={() => setOnlyStock(!onlyStock)}>Con stock</button>
        </div>
      </div>
      {matchAroma && <p className="mb-6 text-sm text-[#9fd4cb]">“{q}” está disponible como fragancia de <strong>{matchAroma.name}</strong>.</p>}
      <p className="muted mb-6">{shown.length} {shown.length === 1 ? 'experiencia' : 'experiencias'}</p>
      {shown.length ? (
        <div className="grid-products">{shown.map((p, i) => <ProductCard key={p.id} p={p} priority={i < 3} />)}</div>
      ) : (
        <div className="panel py-16 text-center">
          <p className="font-serif text-3xl text-[var(--foreground)]">Nada por acá todavía.</p>
          <p className="mt-3">Probá con otro aroma o mirá toda la colección.</p>
          <button className="btn mt-8" onClick={() => { setCat('Todos'); setQ(''); setOnlyStock(false); }}>Ver todo</button>
        </div>
      )}
    </div>
  );
}
