import type { ReactNode } from "react";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return <div className="flex-1 flex flex-col">{children}</div>;
}
