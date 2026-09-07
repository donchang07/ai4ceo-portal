"use client";

import { CalendarClock, CreditCard, Info } from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/core/cn";
import { formatKRW } from "@/lib/core/constants";
import { ProductArtwork } from "@/components/product-artwork";
import type { PublicProduct } from "@/lib/billing/products";

interface ProductCardProps {
  product: PublicProduct;
  /** 선택형 카드(/pay)에서 현재 선택 여부 */
  selected?: boolean;
  onSelect?: () => void;
  /** 카드 안에서 바로 결제하는 경우(첫페이지)에만 전달 */
  onPay?: () => void;
  paying?: boolean;
  disabled?: boolean;
}

export function ProductCard({ product, selected, onSelect, onPay, paying, disabled }: ProductCardProps) {
  const clickable = !!onSelect;

  return (
    <div
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={onSelect}
      onKeyDown={
        clickable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect?.();
              }
            }
          : undefined
      }
      className={cn(
        "flex h-full flex-col rounded-[15px] border bg-surface p-5 text-left transition-colors",
        clickable && "cursor-pointer",
        selected ? "border-primary ring-1 ring-primary/30" : "border-hairline",
        clickable && !selected && "hover:border-cardline",
      )}
    >
      <ProductArtwork artwork={product.artwork} className="h-auto w-full rounded-[10px]" />

      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-base font-bold text-ink">{product.name}</p>
          <p className="mt-1 text-[13px] text-muted">{product.summary}</p>
        </div>
        <span className="tnum shrink-0 text-base font-bold text-ink">{formatKRW(product.amount)}</span>
      </div>

      <ul className="mt-3 space-y-1 text-[13px] text-muted">
        {product.details.map((d) => (
          <li key={d}>· {d}</li>
        ))}
      </ul>

      {/* 토스페이먼츠 심사 요건 — 서비스 제공기간을 구매자가 결제 전에 볼 수 있어야 한다 */}
      <p className="mt-3 flex gap-2 text-[13px] text-muted">
        <CalendarClock size={15} className="mt-0.5 shrink-0 text-primary" />
        <span>
          <span className="font-semibold text-ink">서비스 제공기간</span> · {product.period}
        </span>
      </p>

      {product.notice && (
        <div className="mt-4 flex gap-2 rounded-[12px] border border-cardline bg-info-surface px-4 py-3">
          <Info size={15} className="mt-0.5 shrink-0 text-primary" />
          <p className="text-[13px] leading-relaxed text-ink">{product.notice}</p>
        </div>
      )}

      {onPay && (
        <div className="mt-auto pt-4">
          <Button
            variant="primary"
            full
            disabled={paying || disabled}
            onClick={(e) => {
              e.stopPropagation();
              onPay();
            }}
          >
            <CreditCard size={16} /> {paying ? "결제창 여는 중…" : "결제하기"}
          </Button>
        </div>
      )}
    </div>
  );
}
