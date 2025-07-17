import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";

interface SuggestionDropdownProps<T> {
  value: string;
  onChange: (value: string, item?: T) => void;
  fetchSuggestions?: (prefix: string) => Promise<T[]>;
  staticOptions?: T[];
  placeholder?: string;
  onAddNew?: (input: string) => void;
  label?: string;
  disabled?: boolean;
  getLabel: (item: T) => string;
  renderItem?: (item: T, highlighted: boolean) => React.ReactNode;
  noResultsRender?: () => React.ReactNode;
  inputClassName?: string;
  inputId?: string;
}

function SuggestionDropdown<T extends { [key: string]: any }>({
  value,
  onChange,
  fetchSuggestions,
  staticOptions,
  placeholder,
  onAddNew,
  label,
  disabled,
  getLabel,
  renderItem,
  noResultsRender,
  inputClassName,
  inputId,
}: SuggestionDropdownProps<T>) {
  const [input, setInput] = useState(value);
  const [suggestions, setSuggestions] = useState<T[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    setInput(value);
  }, [value]);

  useEffect(() => {
    if (!showDropdown) return;

    if (staticOptions) {
      // Filter static options based on input
      const filtered = staticOptions.filter((option) =>
        getLabel(option).toLowerCase().includes(input.toLowerCase())
      );
      setSuggestions(filtered);
      setHighlighted(0);
      setLoading(false);
      return;
    }

    if (!fetchSuggestions) return;

    let active = true;
    setLoading(true);
    const handler = setTimeout(() => {
      fetchSuggestions(input).then((results) => {
        if (active) {
          setSuggestions(results);
          setHighlighted(0);
          setLoading(false);
        }
      });
    }, 200);
    return () => {
      active = false;
      clearTimeout(handler);
    };
  }, [input, fetchSuggestions, staticOptions, showDropdown, getLabel]);

  useEffect(() => {
    if (showDropdown && inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownStyle({
        position: "absolute",
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
        zIndex: 1000,
      });
    }
  }, [showDropdown, inputRef.current, input]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    setShowDropdown(true);
  };

  const handleSelect = (item: T) => {
    onChange(getLabel(item), item);
    setInput(getLabel(item));
    setShowDropdown(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown) return;
    if (e.key === "ArrowDown") {
      setHighlighted((h) => Math.min(h + 1, suggestions.length - 1));
      e.preventDefault();
    } else if (e.key === "ArrowUp") {
      setHighlighted((h) => Math.max(h - 1, 0));
      e.preventDefault();
    } else if (e.key === "Enter") {
      if (suggestions[highlighted]) {
        handleSelect(suggestions[highlighted]);
      } else if (onAddNew && input.trim()) {
        onAddNew(input.trim());
      }
      e.preventDefault();
    } else if (e.key === "Tab") {
      if (suggestions[highlighted]) {
        handleSelect(suggestions[highlighted]);
        e.preventDefault();
      }
    } else if (e.key === "Escape") {
      setShowDropdown(false);
    }
  };

  // Render dropdown in portal
  const dropdown = showDropdown && (
    <div
      style={dropdownStyle}
      className="bg-white border rounded shadow mt-1 max-h-60 overflow-y-auto"
    >
      {loading ? (
        <div className="px-4 py-2 text-gray-500">Loading...</div>
      ) : suggestions.length > 0 ? (
        suggestions.map((item, idx) => (
          <div
            key={getLabel(item) + idx}
            className={`px-4 py-2 cursor-pointer ${
              idx === highlighted ? "bg-teal-100" : ""
            }`}
            onMouseDown={() => handleSelect(item)}
            onMouseEnter={() => setHighlighted(idx)}
          >
            {renderItem
              ? renderItem(item, idx === highlighted)
              : getLabel(item)}
          </div>
        ))
      ) : noResultsRender ? (
        noResultsRender()
      ) : (
        <div className="px-4 py-2 text-gray-500">
          {onAddNew && input.trim() && (
            <button
              className="mt-2 bg-teal-600 text-white px-2 py-1 rounded font-semibold hover:bg-teal-700 transition self-start text-sm"
              onMouseDown={() => onAddNew(input.trim())}
            >
              Create new
            </button>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="relative w-full">
      {label && (
        <label className="block text-gray-700 font-semibold mb-1">
          {label}
        </label>
      )}
      <input
        ref={inputRef}
        className={
          inputClassName
            ? inputClassName
            : "border rounded px-3 py-2 min-w-[16rem] max-w-[16rem]"
        }
        value={input}
        onChange={handleInputChange}
        onFocus={() => setShowDropdown(true)}
        onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
        placeholder={placeholder}
        disabled={disabled}
        onKeyDown={handleKeyDown}
        autoComplete="off"
        id={inputId}
      />
      {showDropdown && ReactDOM.createPortal(dropdown, document.body)}
    </div>
  );
}

export default SuggestionDropdown;
