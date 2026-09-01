interface Props {
  stock: number;
  minStock: number;
}

export function StockBar({ stock, minStock }: Props) {
  const ratio = minStock > 0 ? stock / (minStock * 2) : stock > 0 ? 1 : 0;
  const pct = Math.max(4, Math.min(100, Math.round(ratio * 100)));

  let color = "#3FA66A"; // vert — anfòm
  let label = "Anfòm";
  if (stock <= 0) {
    color = "#E14F64"; // wouj — rupti
    label = "Rupti";
  } else if (stock <= minStock) {
    color = "#F2A93B"; // dorè — fèb
    label = "Fèb";
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs" style={{ color }}>
          {label}
        </span>
        <span className="text-xs text-ink/40">
          {stock} / min {minStock}
        </span>
      </div>
      <div className="h-1.5 bg-ink/8 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
