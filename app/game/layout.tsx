import { BalancesProvider } from "@/components/balances-provider";
import { EnergyProvider } from "@/components/energy-provider";
import { GameHeader } from "@/components/game-header";
import { GemShopProvider } from "@/components/gem-shop";
import { StoryChromeProvider } from "@/components/story-chrome";
import { requireProgress } from "@/lib/auth/session";
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
  const [balances, settings, economy, energy] = await Promise.all([
    getBalances(user.id),
    getSiteSettings(),
    getEconomy(),
    getEnergy(user.id),
  ]);
  const earn = canPlayEarn(user.role, progress.level, settings.earnEnabled);

  return (
    <StoryChromeProvider>
      <BalancesProvider initial={balances}>
        <GemShopProvider
          economy={economy}
          publishableKey={stripeReady() ? stripePublishableKey() : null}
          sandbox={earnSandbox()}
        >
          <EnergyProvider initial={energy}>
            <GameHeader progress={progress} stars={stars} isAdmin={user.role === "ADMIN"} earn={earn} />
            <div className="flex min-h-0 flex-1 flex-col overflow-x-clip">
              {children}
            </div>
          </EnergyProvider>
        </GemShopProvider>
      </BalancesProvider>
    </StoryChromeProvider>
  );
}
