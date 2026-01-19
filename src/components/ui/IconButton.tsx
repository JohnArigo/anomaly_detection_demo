import { type ReactNode, type Ref } from "react";

type IconButtonProps = {
  label: string;
  icon: ReactNode;
  onClick?: () => void;
  buttonRef?: Ref<HTMLButtonElement>;
};

export const IconButton = ({ label, icon, onClick, buttonRef }: IconButtonProps) => {
  return (
    <button
      type="button"
      className="icon-button"
      aria-label={label}
      onClick={onClick}
      ref={buttonRef}
    >
      {icon}
    </button>
  );
};
