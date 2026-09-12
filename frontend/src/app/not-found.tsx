import Link from "next/link";
import { Search, Home, ArrowLeft } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex-1 flex items-center justify-center py-16">
      <Container size="sm" className="text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground mx-auto mb-6">
          <Search className="h-8 w-8" />
        </div>

        <div className="inline-flex items-center rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground mb-4">
          Status 404
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Page Not Found
        </h1>

        <p className="mt-3 text-base text-muted-foreground max-w-sm mx-auto">
          The skilled service or portal route you requested could not be located. It may have been moved or does not exist yet.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/">
            <Button leftIcon={<Home className="h-4 w-4" />}>
              Back to Home
            </Button>
          </Link>
          <Link href="/customer">
            <Button variant="outline" leftIcon={<ArrowLeft className="h-4 w-4" />}>
              Customer Portal
            </Button>
          </Link>
        </div>
      </Container>
    </div>
  );
}
