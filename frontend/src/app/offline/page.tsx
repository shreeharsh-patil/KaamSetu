"use client";

import { WifiOff, RotateCcw, Home } from "lucide-react";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

export default function OfflinePage() {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <Container className="py-16 max-w-md text-center">
      <Card className="border-border shadow-md">
        <CardHeader className="space-y-3 pb-3">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
            <WifiOff className="h-8 w-8" />
          </div>
          <CardTitle className="text-xl font-bold">You&apos;re Currently Offline</CardTitle>
          <CardDescription className="text-xs">
            We couldn&apos;t connect to KaamSetu servers. Please check your mobile data or Wi-Fi.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3 text-xs text-muted-foreground">
          <p className="bg-muted/40 p-3 rounded-xl text-left">
            <strong>Draft safety notice:</strong> Any forms you were filling out have been preserved in local device memory. However, critical transactions like accepting job offers, confirming payments, and generating OTP codes require an active internet connection.
          </p>
        </CardContent>

        <CardFooter className="flex flex-col gap-2 pt-0">
          <Button onClick={handleRetry} className="w-full gap-2">
            <RotateCcw className="h-4 w-4" /> Retry Connection
          </Button>
          <Button asChild variant="outline" className="w-full gap-2">
            <Link href="/">
              <Home className="h-4 w-4" /> Return to Home
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </Container>
  );
}
