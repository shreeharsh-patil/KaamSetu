import Link from "next/link";
import { Phone, ArrowLeft } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function LoginPage() {
  return (
    <Card className="max-w-md mx-auto shadow-md">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-2">
          <Badge variant="secondary">Phase 0 Shell</Badge>
        </div>
        <CardTitle className="text-2xl">Authentication Shell</CardTitle>
        <CardDescription>
          Phone OTP authentication workflow will be implemented in Phase 3.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground bg-muted/30">
          <Phone className="h-6 w-6 mx-auto mb-2 text-primary" />
          <p className="font-medium text-foreground">Phone + OTP Flow</p>
          <p className="text-xs mt-1">
            Standard India-focused login: 10-digit mobile number, instant SMS OTP, and auto-detection.
          </p>
        </div>
      </CardContent>

      <CardFooter className="flex justify-between">
        <Link href="/" className="w-full">
          <Button variant="outline" className="w-full" leftIcon={<ArrowLeft className="h-4 w-4" />}>
            Back to Home
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
