"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function BalanceDetailRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/school/finance/student-balances");
  }, [router]);
  return null;
}
