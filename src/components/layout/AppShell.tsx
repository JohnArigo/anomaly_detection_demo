import { type ReactNode } from "react";

type AppShellProps = {
  topBar: ReactNode;
  children: ReactNode;
};

export const AppShell = ({ topBar, children }: AppShellProps) => {
  return (
    <div className="app">
      {topBar}
      <main className="app__main">{children}</main>
    </div>
  );
};
