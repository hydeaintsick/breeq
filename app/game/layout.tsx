import { BalancesProvider } from "@/components/balances-provider";
import { CosmeticsProvider } from "@/components/cosmetics-provider";
import { EnergyProvider } from "@/components/energy-provider";
import { GameHeader } from "@/components/game-header";
import { GameShell } from "@/components/game-shell";
import { GemShopProvider } from "@/components/gem-shop";
import { StoryChromeProvider } from "@/components/story-chrome";
import { requireProgress } from "@/lib/auth/session";
import { getWardrobe } from "@/lib/cosmetics-store";
import { getBalances, getEconomy } from "@/lib/earn";
import { getEnergy } from "@/lib/energy-store";
import { canPlayEarn } from "@/lib/progress";
import { earnSandbox, stripePublishableKey, stripeReady } from "@/lib/stripe";
import { getSiteSettings } from "@/lib/tutorial";

export default async function GameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, progress, stars } = await requireProgress();
  const [balances, settings, economy, energy, wardrobe] = await Promise.all([
    getBalances(user.id),
    getSiteSettings(),
    getEconomy(),
    getEnergy(user.id),
    getWardrobe(user.id),
  ]);
  const earn = canPlayEarn(user.role, progress.level, settings.earnEnabled);

  return (
    <StoryChromeProvider>
      <BalancesProvider initial={balances}>
        <CosmeticsProvider initial={wardrobe}>
          <GemShopProvider
            economy={economy}
            publishableKey={stripeReady() ? stripePublishableKey() : null}
            sandbox={earnSandbox()}
          >
            <EnergyProvider initial={energy}>
              <GameHeader progress={progress} stars={stars} isAdmin={user.role === "ADMIN"} earn={earn} />
              <GameShell>{children}</GameShell>
            </EnergyProvider>
          </GemShopProvider>
        </CosmeticsProvider>
      </BalancesProvider>
    </StoryChromeProvider>
  );
}
