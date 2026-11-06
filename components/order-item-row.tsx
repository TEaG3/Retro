import Image from "next/image";

export type OrderItemRowProps = {
  name: string;
  imageUrl: string;
  quantity: number;
  unitPriceIqd: number;
  sortOrder: number;
};

const formatIQD = (value: number) =>
  new Intl.NumberFormat("ar-IQ", { maximumFractionDigits: 0 }).format(value) + " د.ع";

/** Order line with an enlarged product thumbnail and IQD-only amounts. */
export function OrderItemRow({ name, imageUrl, quantity, unitPriceIqd, sortOrder }: OrderItemRowProps) {
  const lineTotal = unitPriceIqd * quantity;

  return (
    <article data-sort-order={sortOrder} className="grid grid-cols-[104px_minmax(0,1fr)] items-center gap-4 border-b border-white/10 py-5 sm:grid-cols-[120px_minmax(0,1fr)_auto] sm:gap-5">
      <div className="relative h-[104px] w-[104px] overflow-hidden rounded-2xl border border-white/10 bg-white/[.04] sm:h-[120px] sm:w-[120px]">
        <Image src={imageUrl} alt={name} fill sizes="(max-width: 640px) 104px, 120px" className="object-contain p-2" />
      </div>
      <div className="min-w-0">
        <h3 className="truncate text-base font-bold sm:text-lg">{name}</h3>
        <p className="mt-2 text-sm text-white/50">سعر الوحدة: {formatIQD(unitPriceIqd)}</p>
        <p className="mt-1 text-xs text-white/40">الكمية: {quantity}</p>
      </div>
      <strong className="col-span-2 text-left text-base text-retro-cyan sm:col-span-1">{formatIQD(lineTotal)}</strong>
    </article>
  );
}
