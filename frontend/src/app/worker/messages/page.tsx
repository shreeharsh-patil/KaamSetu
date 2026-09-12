"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function WorkerMessagesPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/messages");
  }, [router]);

  return null;
}
