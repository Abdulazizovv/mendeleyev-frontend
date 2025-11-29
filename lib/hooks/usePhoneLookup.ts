import * as React from "react";
import { schoolApi } from "@/lib/api";
import type { StudentPhoneCheckResponse, StudentProfileSummary } from "@/types/school";

export type PhoneLookupStatus = "idle" | "checking" | "available" | "exists-in-branch" | "exists-in-other" | "error";

export function usePhoneLookup(
  phoneNumber: string,
  branchId: string | undefined,
  onProfileFound?: (profile?: StudentProfileSummary | null) => void
) {
  const [status, setStatus] = React.useState<PhoneLookupStatus>("idle");
  const [result, setResult] = React.useState<StudentPhoneCheckResponse | null>(null);

  React.useEffect(() => {
    if (!phoneNumber || !/^\+998\d{9}$/.test(phoneNumber)) {
      setStatus("idle");
      setResult(null);
      return;
    }

    let isActive = true;
    setStatus("checking");

    const timeoutId = setTimeout(async () => {
      try {
        const lookupResult = await schoolApi.checkStudentByPhone(phoneNumber, branchId);
        
        if (!isActive) return;

        setResult(lookupResult);

        if (lookupResult.exists_in_branch) {
          setStatus("exists-in-branch");
        } else if (lookupResult.exists_globally) {
          setStatus("exists-in-other");
          const profile = 
            lookupResult.branch_data?.student_profile ?? 
            lookupResult.all_branches_data?.[0]?.student_profile;
          onProfileFound?.(profile);
        } else {
          setStatus("available");
        }
      } catch (error) {
        if (!isActive) return;
        setStatus("error");
        setResult(null);
      }
    }, 600);

    return () => {
      isActive = false;
      clearTimeout(timeoutId);
    };
  }, [phoneNumber, branchId, onProfileFound]);

  return { status, result };
}
