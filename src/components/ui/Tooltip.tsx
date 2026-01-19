import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";

type TooltipProps = {
  label: string;
  content: ReactNode;
};

type Placement = "top" | "bottom";

const GAP = 8;
const PADDING = 8;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export const Tooltip = ({ label, content }: TooltipProps) => {
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [placement, setPlacement] = useState<Placement>("top");
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const id = useId();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const bubbleRef = useRef<HTMLDivElement | null>(null);

  const close = () => {
    setOpen(false);
    setPinned(false);
  };

  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        triggerRef.current &&
        bubbleRef.current &&
        !triggerRef.current.contains(target) &&
        !bubbleRef.current.contains(target)
      ) {
        close();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  useLayoutEffect(() => {
    if (!open) return;
    if (!triggerRef.current || !bubbleRef.current) return;

    const updatePosition = () => {
      const triggerRect = triggerRef.current?.getBoundingClientRect();
      const bubbleRect = bubbleRef.current?.getBoundingClientRect();
      if (!triggerRect || !bubbleRect) return;

      const centerX = triggerRect.left + triggerRect.width / 2;
      let nextPlacement: Placement = "top";

      const spaceTop = triggerRect.top - bubbleRect.height - GAP;
      const spaceBottom = triggerRect.bottom + bubbleRect.height + GAP;

      if (spaceTop < PADDING && spaceBottom <= window.innerHeight - PADDING) {
        nextPlacement = "bottom";
      } else if (spaceBottom > window.innerHeight - PADDING && spaceTop >= PADDING) {
        nextPlacement = "top";
      }

      const left = clamp(
        centerX - bubbleRect.width / 2,
        PADDING,
        window.innerWidth - PADDING - bubbleRect.width,
      );

      const topRaw =
        nextPlacement === "top"
          ? triggerRect.top - bubbleRect.height - GAP
          : triggerRect.bottom + GAP;
      const top = clamp(
        topRaw,
        PADDING,
        window.innerHeight - PADDING - bubbleRect.height,
      );

      setPlacement(nextPlacement);
      setCoords({ top, left });
    };

    updatePosition();

    const onScroll = () => updatePosition();
    const onResize = () => updatePosition();

    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open, content]);

  return (
    <span className="tooltip">
      <button
        type="button"
        className="tooltip__trigger"
        aria-label={label}
        aria-describedby={open ? id : undefined}
        aria-expanded={open}
        ref={triggerRef}
        onMouseEnter={() => {
          setHovered(true);
          if (!open) setOpen(true);
        }}
        onMouseLeave={() => {
          setHovered(false);
          if (!pinned && !focused) setOpen(false);
        }}
        onFocus={() => {
          setFocused(true);
          setOpen(true);
        }}
        onBlur={() => {
          setFocused(false);
          if (!pinned && !hovered) setOpen(false);
        }}
        onClick={() => {
          setPinned((prev) => {
            const next = !prev;
            setOpen(next);
            return next;
          });
        }}
      >
        i
      </button>
      {open &&
        createPortal(
          <div className="tooltip-overlay" aria-hidden={false}>
            <div
              id={id}
              role="tooltip"
              ref={bubbleRef}
              className="tooltip__bubble"
              data-placement={placement}
              style={{ top: `${coords.top}px`, left: `${coords.left}px` }}
              onPointerEnter={() => setHovered(true)}
              onPointerLeave={() => {
                setHovered(false);
                if (!pinned && !focused) setOpen(false);
              }}
            >
              <span className="tooltip__caret" aria-hidden="true" />
              {content}
            </div>
          </div>,
          document.body,
        )}
    </span>
  );
};
