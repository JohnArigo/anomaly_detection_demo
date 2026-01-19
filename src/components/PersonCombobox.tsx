import { useEffect, useId, useMemo, useRef, useState } from "react";

type ComboboxOption = {
  value: string;
  label: string;
};

type PersonComboboxProps = {
  options: ComboboxOption[];
  selectedValue: string | null;
  selectedLabel: string | null;
  onSelect: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  isProfile: boolean;
};

const filterOptions = (options: ComboboxOption[], query: string) => {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return options;
  return options.filter((option) => option.label.toLowerCase().includes(trimmed));
};

export const PersonCombobox = ({
  options,
  selectedValue,
  selectedLabel,
  onSelect,
  placeholder = "Find personnel…",
  ariaLabel = "Personnel quick search",
  isProfile,
}: PersonComboboxProps) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const listId = useId();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const filtered = useMemo(() => filterOptions(options, query), [options, query]);
  const visibleOptions = filtered;

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (rootRef.current && !rootRef.current.contains(target)) {
        setOpen(false);
        if (isProfile) {
          setQuery(selectedLabel ?? "");
        } else {
          setQuery("");
        }
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open, isProfile, selectedLabel]);

  useEffect(() => {
    if (!open) return;
    setActiveIndex(0);
  }, [open, query]);

  const displayValue = open ? query : selectedLabel ?? "";

  const onOpen = () => {
    setOpen(true);
    setQuery(isProfile ? selectedLabel ?? "" : "");
    window.requestAnimationFrame(() => inputRef.current?.select());
  };

  const onClose = () => {
    setOpen(false);
    if (isProfile) {
      setQuery(selectedLabel ?? "");
    } else {
      setQuery("");
    }
  };

  const selectOption = (option: ComboboxOption) => {
    onSelect(option.value);
    setQuery(option.label);
    setOpen(false);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!open) {
        onOpen();
        return;
      }
      setActiveIndex((prev) => (prev + 1) % Math.max(visibleOptions.length, 1));
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        onOpen();
        return;
      }
      setActiveIndex((prev) => {
        const total = Math.max(visibleOptions.length, 1);
        return (prev - 1 + total) % total;
      });
    }
    if (event.key === "Enter") {
      if (!open) return;
      event.preventDefault();
      const option = visibleOptions[activeIndex];
      if (option) selectOption(option);
    }
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
    }
  };

  return (
    <div className="combobox" ref={rootRef}>
      <input
        ref={inputRef}
        type="search"
        role="combobox"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-controls={listId}
        placeholder={placeholder}
        value={displayValue}
        onFocus={onOpen}
        onChange={(event) => {
          if (!open) setOpen(true);
          setQuery(event.target.value);
        }}
        onKeyDown={onKeyDown}
        onBlur={(event) => {
          if (rootRef.current && !rootRef.current.contains(event.relatedTarget as Node | null)) {
            onClose();
          }
        }}
      />
      {open && (
        <div className="combobox__list" role="listbox" id={listId}>
          {visibleOptions.length === 0 && (
            <div className="combobox__empty">No matches</div>
          )}
          {visibleOptions.map((option, index) => {
            const isActive = index === activeIndex;
            const isSelected = option.value === selectedValue;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isActive}
                className={`combobox__option ${isActive ? "combobox__option--active" : ""}`.trim()}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectOption(option)}
              >
                <span className="combobox__indicator" aria-hidden="true" />
                <span className="combobox__label">{option.label}</span>
                {isSelected && <span className="combobox__selected">Selected</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
