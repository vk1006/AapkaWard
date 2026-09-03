/** Remove Google's floating reCAPTCHA badge and leftover DOM nodes. */
export function removeRecaptchaArtifacts(): void {
  if (typeof document === "undefined") return;

  document.querySelectorAll(".grecaptcha-badge").forEach((node) => node.remove());

  document
    .querySelectorAll('iframe[src*="recaptcha"], iframe[title*="reCAPTCHA"]')
    .forEach((iframe) => {
      const parent = iframe.parentElement;
      if (parent?.classList.contains("grecaptcha-badge")) {
        parent.remove();
      }
    });

  document.body.style.removeProperty("padding-bottom");
}
