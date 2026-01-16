import { type ReactNode } from "react";

type BadgePillProps = {
  label: ReactNode;
  variant: "approved" | "denied" | "after-hours" | "flag" | "neutral";
};

export const BadgePill = ({ label, variant }: BadgePillProps) => {
  return <span className={`pill pill--${variant}`}>{label}</span>;
};
