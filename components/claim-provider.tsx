"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ClaimSheet } from "@/components/claim-sheet";
import { peekClaimView, type ClaimView } from "@/lib/claim-view";

type Reason = "clear" | "pay";
type Notice = "taken" | "linked" | null;

type ClaimApi = {
  needed: boolean;
  active: boolean;
  reason: Reason;
  open: (reason: Reason, view?: ClaimView | null) => void;
  close: () => void;
};

const ClaimContext = createContext<ClaimApi | null>(null);

export function useClaim() {
  const value = useContext(ClaimContext);
  if (!value) {
    throw new Error("useClaim must be used under ClaimProvider");
  }
  return value;
}

export function isClaimBlock(result: { claim?: boolean }) {
  return result.claim === true;
}

export function ClaimProvider({
  needed,
  google,
  children,
}: {
  needed: boolean;
  google: boolean;
  children: ReactNode;
}) {
  const [stillNeeded, setStillNeeded] = useState(needed);
  const [active, setActive] = useState(false);
  const [reason, setReason] = useState<Reason>("clear");
  const [notice, setNotice] = useState<Notice>(null);
  const [view, setView] = useState<ClaimView | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setStillNeeded(needed);
  }, [needed]);

  const open = useCallback((next: Reason, nextView?: ClaimView | null) => {
    setReason(next);
    setView(nextView ?? null);
    setNotice(null);
    setActive(true);
  }, []);

  const close = useCallback(() => {
    setActive(false);
  }, []);

  const api: ClaimApi = {
    needed: stillNeeded,
    active,
    reason,
    open,
    close,
  };

  return (
    <ClaimContext.Provider value={api}>
      <Suspense fallback={null}>
        <ClaimFromQuery
          onNotice={(flag, held) => {
            setReason("clear");
            setView(held);
            setNotice(flag);
            setActive(true);
            if (flag === "linked") setStillNeeded(false);
          }}
        />
      </Suspense>
      {children}
      {mounted && active
        ? createPortal(
            <ClaimSheet
              reason={reason}
              google={google}
              notice={notice}
              view={view}
              onClose={close}
              onSaved={() => setStillNeeded(false)}
            />,
            document.body,
          )
        : null}
    </ClaimContext.Provider>
  );
}

function ClaimFromQuery({ onNotice }: { onNotice: (flag: "taken" | "linked", view: ClaimView | null) => void }) {
  const params = useSearchParams();
  const router = useRouter();
  const flag = params.get("claim");
  const seen = useRef(false);
  const onNoticeRef = useRef(onNotice);
  onNoticeRef.current = onNotice;

  useEffect(() => {
    if (seen.current) return;
    if (flag !== "linked" && flag !== "taken") return;
    seen.current = true;
    onNoticeRef.current(flag, peekClaimView());
    const url = new URL(window.location.href);
    url.searchParams.delete("claim");
    const next = `${url.pathname}${url.search}`;
    router.replace(next, { scroll: false });
  }, [flag, router]);

  return null;
}
