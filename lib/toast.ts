import { AppEvents, dispatchAppEvent } from "@/lib/security/events";
import { truncate } from "@/lib/security/sanitize";

export function showToast(message: string) {
  dispatchAppEvent(AppEvents.toast, truncate(message, 200));
}
