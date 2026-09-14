import { BalancesProvider } from "@/components/balances-provider";
import { GameHeader } from "@/components/game-header";
import { GemShopProvider } from "@/components/gem-shop";
import { StoryChromeProvider } from "@/components/story-chrome";
import { requireProgress } from "@/lib/auth/session";
import { getBalances, getEconomy } from "@/lib/earn";
import { canPlayEarn } from "@/lib/progress";
import { earnSandbox, stripeConfigured } from "@/lib/stripe";
import { getSiteSettings } from "@/lib/tutorial";

export default async function GameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, progress, stars } = await requireProgress();
  const [balances, settings, economy] = await Promise.all([getBalances(user.id), getSiteSettings(), getEconomy()]);
  const earn = canPlayEarn(user.role, progress.level, settings.earnEnabled);

  return (
    <StoryChromeProvider>
      <BalancesProvider initial={balances}>
        <GemShopProvider economy={economy} stripeReady={stripeConfigured()} sandbox={earnSandbox()}>
          <GameHeader progress={progress} stars={stars} isAdmin={user.role === "ADMIN"} earn={earn} />
          <div className="flex min-h-0 flex-1 flex-col overflow-x-clip">
            {children}
          </div>
        </GemShopProvider>
      </BalancesProvider>
    </StoryChromeProvider>
  );
}
