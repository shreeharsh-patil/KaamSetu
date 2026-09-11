import type { ReactNode } from "react";

export default function WorkerLayout({ children }: { children: ReactNode }) {
  return <div className="flex-1 flex flex-col">{children}</div>;
}
