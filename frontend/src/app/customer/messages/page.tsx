"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CustomerMessagesPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/messages");
  }, [router]);

  return null;
}
