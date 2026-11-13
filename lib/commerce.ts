export const fragrances = [
  'Miel', 'Café y chocolate', 'Eucalipto y limón', 'Té verde y fresias',
  'Limón y té verde', 'Café', 'Miel y vainilla', 'Frutos del bosque y miel',
  'Eucalipto y frutos del bosque', 'Chocolate y caramelo', 'Lavanda',
  'Miel y frutos del bosque', 'Lavanda y eucalipto', 'Gardenia y frutos del bosque',
  'Eucalipto', 'Miel y limón', 'Café caramelo', 'Vainilla y café',
  'Lavanda y gardenia', 'Vainilla y caramelo', 'Fresias y limón', 'Caramelo',
];
export function paymentRate(payment: string, settings: any) {
  return payment === 'Efectivo' ? Number(settings.cashDiscount || 0)
    : payment === 'Transferencia' ? Number(settings.transferDiscount || 0) : 0;
}
export function totals(subtotal: number, refillDiscount: number, payment: string, delivery: string, settings: any) {
  const paymentDiscount = Math.round((subtotal - refillDiscount) * paymentRate(payment, settings) / 100);
  const discount = refillDiscount + paymentDiscount;
  const shipping = delivery === 'Retiro' || subtotal - discount > settings.freeAbove ? 0 : settings.shipping;
  return {subtotal, refillDiscount, paymentDiscount, discount, shipping, total: subtotal - discount + shipping};
}
export function lineKey(x: any) { return JSON.stringify([x.id, x.aroma || '', !!x.refill]); }
export function hasFragranceStock(p: any) {
  return !!p.fragranceStock && typeof p.fragranceStock === 'object' && !Array.isArray(p.fragranceStock);
}
export function aromaStock(p: any, aroma: string) {
  return hasFragranceStock(p) ? Math.max(0, Number(p.fragranceStock[aroma] || 0)) : p.stock;
}
export function normalizeFragranceStock(p: any) {
  if (p.fragranceStock == null) return;
  if (!hasFragranceStock(p)) throw new Error('Revisá el stock por aroma.');
  if (!p.fragrances?.length) { delete p.fragranceStock; return; }
  const pairs = p.fragrances.map((aroma: string) => {
    const qty = Object.hasOwn(p.fragranceStock, aroma) ? p.fragranceStock[aroma] : 0;
    if (!Number.isSafeInteger(qty) || qty < 0 || qty > 1000000) throw new Error('Cada aroma debe tener un stock entero entre 0 y 1.000.000.');
    return [aroma, qty];
  });
  p.fragranceStock = Object.fromEntries(pairs);
  p.stock = pairs.reduce((sum: number, pair: any[]) => sum + pair[1], 0);
}
export function resolveBundles(entries:any[]) {
  return entries.map(p=>{
    if(!p.bundleComponents?.length)return p;
    const parts=p.bundleComponents.map((id:string)=>entries.find(x=>x.id===id&&x.kind==='product'));
    const candle=parts[0];
    const available=parts.every((x:any)=>x?.active&&!x.bundleComponents);
    const stock=available?Math.min(...parts.map((x:any)=>x.stock)):0;
    const fragrances=candle?.fragrances||[];
    const fragranceStock=hasFragranceStock(candle||{})?Object.fromEntries(fragrances.map((aroma:string)=>[aroma,available?Math.min(aromaStock(candle,aroma),...parts.slice(1).map((x:any)=>x.stock)):0])):undefined;
    return {...p,stock,fragrances,fragranceStock};
  });
}
export function orderItems(products: any[], requested: any[], settings: any) {
  if (!Array.isArray(requested) || !requested.length || requested.length > 50) throw new Error('Agregá productos al pedido.');
  const used = new Map<string, number>();
  const seen = new Set<string>();
  const usedAromas = new Map<string, number>();
  return requested.map(x => {
    const p = products.find(p => p.id === x.id && p.active);
    if (!p || !Number.isInteger(x.qty) || x.qty < 1 || x.qty > 99) throw new Error('Revisá las cantidades del pedido.');
    const aroma = p.fragrances?.length ? x.aroma : p.aroma;
    if (p.fragrances?.length && !p.fragrances.includes(aroma)) throw new Error('Elegí una fragancia válida para tu vela.');
    const key = lineKey({id: p.id, aroma, refill: x.refill});
    if (seen.has(key)) throw new Error('Hay una variante duplicada en el pedido.');
    seen.add(key);
    const parts=p.bundleComponents?.length?p.bundleComponents.map((id:string)=>products.find(x=>x.id===id&&x.active&&!x.bundleComponents)):[p];
    if(parts.some((part:any)=>!part))throw new Error('No hay stock disponible para este conjunto.');
    const inventoryItems=parts.map((part:any)=>({id:part.id,aroma:part.fragrances?.length?aroma:part.aroma,qty:x.qty}));
    inventoryItems.forEach((item:any,index:number)=>{
      const part=parts[index];
      used.set(part.id,(used.get(part.id)||0)+x.qty);
      if(used.get(part.id)!>part.stock)throw new Error('No hay stock suficiente de '+part.name+'.');
      const aromaKey=JSON.stringify([part.id,item.aroma]);
      usedAromas.set(aromaKey,(usedAromas.get(aromaKey)||0)+x.qty);
      if(usedAromas.get(aromaKey)!>aromaStock(part,item.aroma))throw new Error('No hay stock suficiente de '+item.aroma+'.');
    });
    if (x.refill && !p.refill) throw new Error('Este producto no tiene refill.');
    const price = p.promo > 0 ? p.promo : p.price;
    if (!Number.isFinite(price) || price <= 0) throw new Error('Precio pendiente de confirmar.');
    const refillDiscount = x.refill ? Math.round(price * x.qty * (p.refillPercent ?? settings.refillPercent) / 100) : 0;
    return {id: p.id, name: p.name, aroma, brief: p.brief, image: p.images[0], qty: x.qty, price, refill: !!x.refill, refillDiscount, subtotal: price * x.qty - refillDiscount, inventoryItems};
  });
}
