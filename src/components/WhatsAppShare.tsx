"use client";

interface WhatsAppShareProps {
  url: string;
  text: string;
  label: string;
}

export function WhatsAppShare({ url, text, label }: WhatsAppShareProps) {
  const shareUrl = `https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`;

  return (
    <a
      href={shareUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center rounded bg-green-600 px-3 py-1 text-sm text-white hover:bg-green-700"
    >
      {label}
    </a>
  );
}
