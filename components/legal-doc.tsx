import Link from "next/link";

export const LEGAL_UPDATED = "15 September 2026";
export const SITE_URL = "https://breeq.space";

export function LegalBody({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-8 text-base leading-8 text-ink-muted [&_a]:text-ink [&_a]:underline [&_a]:underline-offset-4 [&_h3]:pt-2 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-ink [&_li]:pl-1 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-5 [&_p+p]:mt-3 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
      {children}
    </div>
  );
}

export function LegalSection({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  const id = `s${n}`;
  return (
    <section aria-labelledby={id}>
      <h2 id={id} className="text-xl font-semibold text-ink">
        {n}. {title}
      </h2>
      <div className="mt-2 space-y-3">{children}</div>
    </section>
  );
}

export function LegalUpdated() {
  return <p>Last updated: {LEGAL_UPDATED}.</p>;
}

export function LegalCrossLinks({ current }: { current: "terms" | "privacy" }) {
  return (
    <p>
      {current === "terms" ? (
        <>
          Our collection and use of personal data is described in the{" "}
          <Link href="/privacy">Privacy Policy</Link>.
        </>
      ) : (
        <>
          Use of Breeq is also governed by the <Link href="/terms">Terms of Service</Link>.
        </>
      )}{" "}
      Questions: <Link href="/contact">Contact</Link>.
    </p>
  );
}
