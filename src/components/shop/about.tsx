"use client";

import { Clock, MapPin, MessageCircle, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import { useShop, useT } from "./shop-context";
import { C } from "./ui";
import { deliveryEta } from "@/lib/delivery-eta";

export function About() {
  const t = useT();
  const { shop, money } = useShop();
  const wa = shop.whatsapp ? `https://wa.me/${shop.whatsapp}` : null;
  return (
    <main className="max-w-3xl mx-auto px-4 py-6 pb-16">
      <h1 className="text-2xl font-bold mb-1">{shop.name}</h1>
      <p className="mb-6" style={{ color: C.muted }}>{shop.tagline}</p>

      <div className="space-y-4">
        <Block icon={<Truck size={20} />} title={t("Livrezon ak ranmase")}>
          <ul className="list-disc pl-5 space-y-1">
            {shop.deliveryEnabled ? (
              <li>
                {t("Livrezon:")} <b>{shop.deliveryFee > 0 ? money(shop.deliveryFee) : t("gratis")}</b>
                {shop.freeShippingMin > 0 && shop.deliveryFee > 0 ? t(" (gratis pou kòmand {amount} oswa plis)", { amount: money(shop.freeShippingMin) }) : ""}
              </li>
            ) : (
              <li>{t("Pa gen livrezon pou kounye a.")}</li>
            )}
            {shop.deliveryEnabled && deliveryEta(shop.deliveryMinDays, shop.deliveryMaxDays, t) && (
              <li>{t("Tan livrezon:")} <b>{deliveryEta(shop.deliveryMinDays, shop.deliveryMaxDays, t)}</b> {t("apre ou fin kòmande")}</li>
            )}
            {shop.pickupEnabled && <li>{t("Ranmase nan boutik la:")} <b>{t("gratis")}</b></li>}
          </ul>
        </Block>

        <Block icon={<ShieldCheck size={20} />} title={t("Peman")}>
          {shop.paymentInfo ? <p className="whitespace-pre-line">{shop.paymentInfo}</p> : <p>{t("Kach lè w resevwa, MonCash, NatCash oswa transfè bank. Boutik la ap kontakte w apre kòmand lan.")}</p>}
        </Block>

        {shop.policies && (
          <Block icon={<RotateCcw size={20} />} title={t("Retou ak garanti")}><p className="whitespace-pre-line">{shop.policies}</p></Block>
        )}

        <Block icon={<MapPin size={20} />} title={t("Kontak")}>
          <ul className="space-y-1.5">
            {shop.address && <li className="flex gap-2"><MapPin size={16} className="mt-0.5 shrink-0" /> {shop.address}</li>}
            {shop.hours && <li className="flex gap-2"><Clock size={16} className="mt-0.5 shrink-0" /> {shop.hours}</li>}
            {wa && <li><a href={wa} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 font-semibold underline underline-offset-2"><MessageCircle size={16} /> WhatsApp</a></li>}
          </ul>
        </Block>
      </div>
    </main>
  );
}

function Block({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border p-5 bg-white text-sm leading-relaxed" style={{ borderColor: C.line }}>
      <h2 className="flex items-center gap-2 font-bold text-base mb-2">{icon} {title}</h2>
      {children}
    </section>
  );
}
