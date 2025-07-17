import React from "react";
import { shortcutManager } from "../utils/shortcuts";

interface ShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsHelp: React.FC<ShortcutsHelpProps> = ({
  isOpen,
  onClose,
}) => {
  console.log("ShortcutsHelp render:", { isOpen }); // Debug log

  if (!isOpen) return null;

  const shortcuts = shortcutManager.getAllShortcuts();

  const renderShortcutKey = (shortcut: any) => {
    const parts: string[] = [];
    if (shortcut.ctrl) parts.push("Ctrl");
    if (shortcut.shift) parts.push("Shift");
    if (shortcut.alt) parts.push("Alt");
    if (shortcut.meta) parts.push("⌘");
    parts.push(shortcut.key.toUpperCase());
    return parts.join(" + ");
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            Keyboard Shortcuts
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="p-6">
          <div className="space-y-3">
            {shortcuts.map((shortcut, index) => (
              <div
                key={index}
                className="flex justify-between items-center py-2"
              >
                <span className="text-gray-700">{shortcut.description}</span>
                <kbd className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-sm font-mono">
                  {renderShortcutKey(shortcut)}
                </kbd>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <p className="text-sm text-gray-600">
            Shortcuts are disabled when typing in input fields. Press{" "}
            <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">
              {navigator.platform.toUpperCase().indexOf("MAC") >= 0
                ? "⌘"
                : "Ctrl"}
              +/
            </kbd>{" "}
            anytime to show this help.
          </p>
        </div>
      </div>
    </div>
  );
};

// Hook to easily show shortcuts help
export const useShortcutsHelp = () => {
  const [isOpen, setIsOpen] = React.useState(false);

  const openHelp = React.useCallback(() => {
    console.log("openHelp called, setting isOpen to true"); // Debug log
    setIsOpen(true);
  }, []);

  const closeHelp = React.useCallback(() => {
    console.log("closeHelp called, setting isOpen to false"); // Debug log
    setIsOpen(false);
  }, []);

  const ShortcutsHelpComponent = React.useCallback(
    () => <ShortcutsHelp isOpen={isOpen} onClose={closeHelp} />,
    [isOpen, closeHelp]
  );

  console.log("useShortcutsHelp state:", { isOpen }); // Debug log

  return {
    isOpen,
    setIsOpen,
    openHelp,
    closeHelp,
    ShortcutsHelpComponent,
  };
};
