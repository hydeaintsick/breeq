import type { Metadata } from "next";
import { ContactForm } from "@/components/contact-form";
import { VaultShell } from "@/components/vault-shell";

export const metadata: Metadata = {
  title: "Contact",
  description: "Reach the Breeq team.",
};

export default function ContactPage() {
  return (
    <VaultShell
      kicker="Contact"
      title="Leave a note at the gate."
      lede="Press, partners, or a wall you already see in your head. We are not taking levels yet — only messages."
    >
      <ContactForm />
    </VaultShell>
  );
}
