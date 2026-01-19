import { useEffect, useId, useMemo, useRef, useState } from "react";

type GlobalSearchProps = {
  options: Array<{ value: string; label: string }>;
  onSelect: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
};

const filterOptions = (options: Array<{ value: string; label: string }>, query: string) => {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return options;
  return options.filter((option) => option.label.toLowerCase().includes(trimmed));
};

export const GlobalSearch = ({
  options,
  onSelect,
  placeholder = "Search roster…",
  ariaLabel = "Global search",
}: GlobalSearchProps) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const listId = useId();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const filtered = useMemo(() => filterOptions(options, query), [options, query]);
  const visibleOptions = filtered.slice(0, 8);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (rootRef.current && !rootRef.current.contains(target)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setActiveIndex(0);
  }, [open, query]);

  const onOpen = () => {
    setOpen(true);
    window.requestAnimationFrame(() => inputRef.current?.select());
  };

  const onClose = () => {
    setOpen(false);
    setQuery("");
  };

  const selectOption = (option: { value: string; label: string }) => {
    onSelect(option.value);
    setQuery("");
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
    <div className="typeahead" ref={rootRef}>
      <input
        ref={inputRef}
        type="search"
        role="combobox"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-controls={listId}
        placeholder={placeholder}
        value={query}
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
        <div className="typeahead__list" role="listbox" id={listId}>
          {visibleOptions.length === 0 && (
            <div className="typeahead__empty">No matches</div>
          )}
          {visibleOptions.map((option, index) => {
            const isActive = index === activeIndex;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isActive}
                className={`typeahead__option ${isActive ? "typeahead__option--active" : ""}`.trim()}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectOption(option)}
              >
                <span className="typeahead__indicator" aria-hidden="true" />
                <span className="typeahead__label">{option.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
