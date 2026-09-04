"use client";

import { useEffect, useState } from "react";

interface WhatsAppShareProps {
  url: string;
  text: string;
  label: string;
}

export function WhatsAppShare({ url, text, label }: WhatsAppShareProps) {
  const [fullUrl, setFullUrl] = useState(url);

  useEffect(() => {
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      const origin = window.location.origin;
      const cleanPath = url.startsWith("/") ? url : `/${url}`;
      setFullUrl(`${origin}${cleanPath}`);
    } else {
      setFullUrl(url);
    }
  }, [url]);

  const shareUrl = `https://wa.me/?text=${encodeURIComponent(`${text}\n${fullUrl}`)}`;

  return (
    <a
      href={shareUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-full bg-[#25D366] px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-[#1EBE5D] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#25D366]/40"
    >
      <svg
        className="h-4 w-4 fill-current shrink-0"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.073-2.125-.521-1.636-.68-2.684-2.348-2.766-2.457-.082-.11-1.008-1.341-1.008-2.557 0-1.216.636-1.815.862-2.06.226-.245.493-.306.657-.306.164 0 .329.002.473.01.154.008.358-.058.558.425.207.502.709 1.727.771 1.851.062.123.103.27.021.433-.082.164-.123.266-.246.41-.123.144-.26.321-.37.431-.123.123-.252.257-.109.503.144.246.638 1.052 1.371 1.705.944.842 1.74 1.103 1.986 1.226.246.123.391.103.535-.062.144-.164.617-.719.781-.965.164-.246.329-.205.555-.123.226.082 1.438.678 1.685.801.247.123.411.184.472.287.062.103.062.595-.082 1.001z"/>
      </svg>
      <span>{label}</span>
    </a>
  );
}
