"use client";

import { useCallback, useRef, useState } from "react";

interface IssueMediaItem {
  id: string;
  url: string;
  kind: string;
}

export function IssueMediaStrip({ media }: { media: IssueMediaItem[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const hasMultiple = media.length > 1;

  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || el.clientWidth === 0) return;

    const next = Math.round(el.scrollLeft / el.clientWidth);
    setIndex((current) => (current === next ? current : next));
  }, []);

  if (media.length === 0) return null;

  return (
    <div className="relative mt-3 overflow-hidden rounded-lg border border-[#c7deec] bg-black/5 dark:border-neutral-700 dark:bg-black">
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="flex overflow-x-auto overscroll-x-contain scroll-smooth snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {media.map((item) => (
          <div
            key={item.id}
            className="flex w-full shrink-0 snap-center snap-always items-center justify-center"
          >
            {item.kind === "video" ? (
              <video
                src={item.url}
                controls
                preload="none"
                className="aspect-video max-h-72 w-full bg-black object-contain"
              />
            ) : (
              <img
                src={item.url}
                alt=""
                loading="lazy"
                decoding="async"
                className="aspect-video max-h-72 w-full object-contain"
              />
            )}
          </div>
        ))}
      </div>

      {hasMultiple && (
        <div className="pointer-events-none absolute inset-x-0 bottom-3 z-20 flex justify-center gap-1.5">
          {media.map((item, i) => (
            <span
              key={item.id}
              className={`rounded-full transition-all ${
                i === index ? "h-1.5 w-4 bg-white" : "h-1.5 w-1.5 bg-white/50"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
