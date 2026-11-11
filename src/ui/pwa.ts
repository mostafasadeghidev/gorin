import { signal } from "@preact/signals";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/** Set while the browser allows installing the site as an app (Chromium only) */
export const InstallPrompt = signal<BeforeInstallPromptEvent | null>(null);

addEventListener("beforeinstallprompt", (ev) => {
  // Show our own install button instead of the browser's mini-infobar
  ev.preventDefault();
  InstallPrompt.value = ev as BeforeInstallPromptEvent;
});

addEventListener("appinstalled", () => {
  InstallPrompt.value = null;
});

export async function installApp() {
  const prompt = InstallPrompt.value;
  if (!prompt) return;
  await prompt.prompt();
  // A prompt can only be used once
  InstallPrompt.value = null;
}
