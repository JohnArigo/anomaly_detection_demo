import { type ReactNode } from "react";

type IconButtonProps = {
  label: string;
  icon: ReactNode;
  onClick?: () => void;
};

export const IconButton = ({ label, icon, onClick }: IconButtonProps) => {
  return (
    <button
      type="button"
      className="icon-button"
      aria-label={label}
      onClick={onClick}
    >
      {icon}
    </button>
  );
};
