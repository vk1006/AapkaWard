type SiteLogoProps = {
  className?: string;
  title?: string;
};

/**
 * A neighbourhood roof shelters a shared speech bubble: the ward exists to
 * listen to residents and turn their voices into local action.
 */
export function SiteLogo({ className = "", title }: SiteLogoProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      fill="none"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M8 29.5 32 10l24 19.5v21A5.5 5.5 0 0 1 50.5 56h-37A5.5 5.5 0 0 1 8 50.5v-21Z"
        fill="currentColor"
      />
      <path d="M15 27.5 32 14l17 13.5" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M19 31.5c0-3.04 2.46-5.5 5.5-5.5h15c3.04 0 5.5 2.46 5.5 5.5v8c0 3.04-2.46 5.5-5.5 5.5H31l-7.5 5v-5c-2.49-.45-4.5-2.63-4.5-5.5v-8Z"
        fill="white"
      />
      <circle cx="27" cy="35.5" r="2" fill="currentColor" />
      <circle cx="32" cy="35.5" r="2" fill="currentColor" />
      <circle cx="37" cy="35.5" r="2" fill="currentColor" />
    </svg>
  );
}
