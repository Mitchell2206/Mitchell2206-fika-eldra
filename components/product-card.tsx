'use client';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, Plus } from 'lucide-react';
import { money } from '@/lib/data';
import { unitPrice, useShop } from './shop-provider';

export function tagFor(p: any) {
  if (p.bundleComponents?.length) return 'Ritual completo';
  if (p.category === 'Velas con runas') return 'Vela con runa';
  if (p.category === 'Brumas textiles') return 'Bruma textil';
  return p.category;
}

export function ProductCard({ p, priority = false }: { p: any; priority?: boolean }) {
  const { add } = useShop();
  const needsChoice = p.fragrances?.length > 0;
  const soldOut = !p.stock;
  return (
    <article className="card">
      <Link href={`/productos/${p.id}`} className="card-media" aria-label={p.name}>
        <span className="card-tag">{tagFor(p)}</span>
        {soldOut ? <span className="card-tag low">Agotado</span> : p.stock <= 5 && <span className="card-tag low">Últimas {p.stock}</span>}
        <Image src={p.images[0]} alt={p.name} fill sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 92vw" priority={priority} />
        {p.images[1] && <Image className="alt" src={p.images[1]} alt="" fill sizes="(min-width: 1024px) 30vw, 45vw" />}
      </Link>
      <div className="card-quick">
        {needsChoice ? (
          <Link href={`/productos/${p.id}`} className="btn btn-block btn-sm">Elegir fragancia <ArrowUpRight size={16} /></Link>
        ) : (
          <button className="btn btn-block btn-sm" disabled={soldOut} onClick={() => add(p, undefined)}>{soldOut ? 'Sin stock' : <>Agregar al pedido <Plus size={16} /></>}</button>
        )}
      </div>
      <div className="card-body">
        <p className="card-meta">{needsChoice ? `${p.fragrances.length} fragancias para elegir` : p.aroma}</p>
        <Link href={`/productos/${p.id}`}><h3 className="card-title">{p.name}</h3></Link>
        <p className="line-clamp-2 text-[14px]">{p.brief}</p>
        <div className="mt-auto flex items-center justify-between pt-3">
          <span className="price">{money(unitPrice(p))}{p.promo > 0 && <del>{money(p.price)}</del>}</span>
          <Link href={`/productos/${p.id}`} className="link text-[13px]">Ver más <ArrowUpRight size={14} /></Link>
        </div>
      </div>
    </article>
  );
}
