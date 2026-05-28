"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PaymentDetailRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/branch-admin/finance/payments");
  }, [router]);
  return null;
}
