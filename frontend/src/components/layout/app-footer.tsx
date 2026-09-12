import Link from "next/link";
import { Container } from "./container";
import { BrandLogo } from "@/components/shared/brand-logo";

export function AppFooter() {
  return (
    <footer className="mt-auto border-t bg-muted/30 py-8 text-xs text-muted-foreground">
      <Container className="flex flex-col items-center justify-between gap-4 sm:flex-row">
        <div className="flex flex-col items-center gap-1.5 sm:items-start">
          <BrandLogo height={32} />
          <p className="text-[11px] text-muted-foreground">Next-Gen Hyperlocal Trade Platform</p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link href="/" className="hover:text-foreground transition-colors">
            Home
          </Link>
          <Link href="/customer" className="hover:text-foreground transition-colors">
            Customer
          </Link>
          <Link href="/worker" className="hover:text-foreground transition-colors">
            Worker
          </Link>
          <Link href="/admin" className="hover:text-foreground transition-colors">
            Admin
          </Link>
          <span>•</span>
          <span>Next.js 16 • React 19 • Tailwind CSS</span>
        </div>
      </Container>
    </footer>
  );
}
