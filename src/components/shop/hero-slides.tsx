"use client";

import { useEffect, useState } from "react";

/** Imaj background hero a: yon sèl imaj fiks, oswa plizyè ki chanje ansanm (fondi) chak X segonn. */
export function HeroSlides({ covers, seconds }: { covers: string[]; seconds: number }) {
  const [i, setI] = useState(0);

  useEffect(() => {
    if (covers.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => {
      if (document.visibilityState === "visible") setI((n) => (n + 1) % covers.length);
    }, seconds * 1000);
    return () => clearInterval(id);
  }, [covers.length, seconds]);

  if (covers.length === 0) return null;

  return (
    <>
      {covers.map((src, idx) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={src}
          src={src}
          alt=""
          loading={idx === 0 ? "eager" : "lazy"}
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
          style={{ opacity: idx === i ? 1 : 0 }}
        />
      ))}
      {covers.length > 1 && (
        <div className="absolute bottom-3 left-0 right-0 z-10 flex justify-center gap-1.5">
          {covers.map((_, idx) => (
            <button
              key={idx}
              type="button"
              aria-label={`Imaj ${idx + 1}`}
              onClick={() => setI(idx)}
              className="h-1.5 rounded-full transition-all"
              style={{ width: idx === i ? 20 : 6, background: idx === i ? "#fff" : "rgba(255,255,255,.5)" }}
            />
          ))}
        </div>
      )}
    </>
  );
}
