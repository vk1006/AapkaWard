type CandidatePortraitPlaceholderProps = { label: string; hint: string };

/** Replace this visual with the final candidate photograph when it is available. */
export function CandidatePortraitPlaceholder({ label, hint }: CandidatePortraitPlaceholderProps) {
  return (
    <div className="candidate-portrait-placeholder" aria-label={label} role="img">
      <div className="candidate-portrait-glow" />
      <div className="candidate-portrait-head" />
      <div className="candidate-portrait-body" />
      <p className="candidate-portrait-label">{hint}</p>
    </div>
  );
}
