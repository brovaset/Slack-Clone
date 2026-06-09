export function showToast(message: string) {
  document.dispatchEvent(
    new CustomEvent("slack:toast", { detail: message })
  );
}
