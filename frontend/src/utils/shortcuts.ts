// Simple shortcuts system
export interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  description: string;
  action: () => void;
}

class ShortcutManager {
  private shortcuts: Map<string, ShortcutConfig> = new Map();

  constructor() {
    this.setupGlobalListener();
  }

  private setupGlobalListener() {
    document.addEventListener("keydown", (e) => {
      // Don't trigger shortcuts when typing in input fields
      if (this.isInputElement(e.target as HTMLElement)) {
        return;
      }

      const key = this.getKeyString(e);
      console.log("Key pressed:", key, "Event:", e); // Debug log

      const shortcut = this.shortcuts.get(key);
      console.log("Available shortcuts:", Array.from(this.shortcuts.keys())); // Debug log

      if (shortcut) {
        console.log("Shortcut found:", shortcut.description); // Debug log
        e.preventDefault();
        shortcut.action();
      }
    });
  }

  private isInputElement(element: HTMLElement): boolean {
    if (!element) return false;

    const inputTypes = ["input", "textarea", "select"];
    const contentEditable = element.getAttribute("contenteditable") === "true";

    return (
      inputTypes.includes(element.tagName.toLowerCase()) ||
      contentEditable ||
      element.closest('input, textarea, select, [contenteditable="true"]') !==
        null
    );
  }

  private getKeyString(e: KeyboardEvent): string {
    const parts: string[] = [];

    // Handle cross-platform modifier keys
    if (isMac) {
      // On Mac: Cmd (meta) is primary, Ctrl is secondary
      if (e.metaKey) parts.push("meta");
      if (e.ctrlKey) parts.push("ctrl");
      if (e.shiftKey) parts.push("shift");
      if (e.altKey) parts.push("alt");
    } else {
      // On Windows/Linux: Ctrl is primary
      if (e.ctrlKey) parts.push("ctrl");
      if (e.shiftKey) parts.push("shift");
      if (e.altKey) parts.push("alt");
      if (e.metaKey) parts.push("meta");
    }

    parts.push(e.key.toLowerCase());

    return parts.join("+");
  }

  registerShortcut(shortcut: ShortcutConfig) {
    const key = this.getShortcutKey(shortcut);
    this.shortcuts.set(key, shortcut);
  }

  unregisterShortcut(key: string) {
    this.shortcuts.delete(key);
  }

  private getShortcutKey(shortcut: ShortcutConfig): string {
    const parts: string[] = [];

    if (shortcut.ctrl) parts.push("ctrl");
    if (shortcut.shift) parts.push("shift");
    if (shortcut.alt) parts.push("alt");
    if (shortcut.meta) parts.push("meta");

    parts.push(shortcut.key.toLowerCase());

    return parts.join("+");
  }

  // Get all shortcuts for display in help
  getAllShortcuts(): ShortcutConfig[] {
    return Array.from(this.shortcuts.values());
  }

  // Clear all shortcuts
  clearAll() {
    this.shortcuts.clear();
  }
}

// Global shortcut manager instance
export const shortcutManager = new ShortcutManager();

// Detect platform
const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;

// Predefined shortcut configurations with cross-platform support
export const SHORTCUTS = {
  HELP: {
    key: "/",
    ...(isMac ? { meta: true } : { ctrl: true }),
    description: `Show keyboard shortcuts help (${isMac ? "⌘" : "Ctrl"}+/)`,
  },
  SALES_INVOICE: {
    key: "i",
    ...(isMac ? { meta: true } : { ctrl: true }),
    description: `Open Sales Invoice page (${isMac ? "⌘" : "Ctrl"}+I)`,
  },
  PURCHASE_INVOICE: {
    key: "p",
    ...(isMac ? { meta: true } : { ctrl: true }),
    description: `Open Purchase Invoice page (${isMac ? "⌘" : "Ctrl"}+P)`,
  },
  SALES_RETURN: {
    key: "r",
    alt: true,
    description: `Open Sales Invoice with CA-SR-BS (Return) bill type (${
      isMac ? "⌥" : "Alt"
    }+R)`,
  },
  // Alternative for Mac users who don't have Alt key
  SALES_RETURN_ALT: isMac
    ? {
        key: "r",
        ctrl: true,
        description:
          "Open Sales Invoice with CA-SR-BS (Return) bill type (Ctrl+R)",
      }
    : null,
} as const;
