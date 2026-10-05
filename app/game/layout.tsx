import { PlayAdminProvider } from "@/components/admin-autopilot";
import { ClaimProvider } from "@/components/claim-provider";
import { PushPromptProvider } from "@/components/push-prompt";
import { BalancesProvider } from "@/components/balances-provider";
import { CosmeticsProvider } from "@/components/cosmetics-provider";
import { EnergyProvider } from "@/components/energy-provider";
import { GameHeader } from "@/components/game-header";
import { GameShell } from "@/components/game-shell";
import { GemShopProvider } from "@/components/gem-shop";
import { PlayerBeacon } from "@/components/player-beacon";
import { StoryChromeProvider } from "@/components/story-chrome";
import { ReviewPromptProvider } from "@/components/review-prompt";
import { requireProgress } from "@/lib/auth/session";
import { getWardrobe } from "@/lib/cosmetics-store";
import { getBalances, getEconomy } from "@/lib/earn";
import { ENERGY_MAX, toEnergyState } from "@/lib/energy";
import { getEnergy } from "@/lib/energy-store";
import { getLeaderboard } from "@/lib/leaderboard";
import { canPlayEarn } from "@/lib/progress";
import { earnSandbox, stripePublishableKey, stripeReady } from "@/lib/stripe";
import { isGoogleEnabled } from "@/lib/auth/google";
import { isUnclaimed } from "@/lib/guest";
import { reviewDue } from "@/lib/review";
import { getSiteSettings } from "@/lib/tutorial";
import { prisma } from "@/lib/prisma";

export default async function GameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, progress, stars } = await requireProgress();
  const settings = await getSiteSettings();
  const [balances, economy, energy, wardrobe, board, unclaimed, pushRow, storyClears] = await Promise.all([
    getBalances(user.id),
    getEconomy(),
    settings.energyEnabled ? getEnergy(user.id) : Promise.resolve(toEnergyState(ENERGY_MAX)),
    getWardrobe(user.id),
    getLeaderboard(user.id),
    isUnclaimed(user.id),
    prisma.user.findUnique({
      where: { id: user.id },
      select: { pushPromptedAt: true, pushOptIn: true, reviewStatus: true, reviewAnchor: true },
    }),
    prisma.chapterClear.count({ where: { userId: user.id } }),
  ]);
  const earn = canPlayEarn(user.role, progress.level, settings.earnEnabled);
  const reviewIsDue = reviewDue({
    clears: storyClears,
    every: settings.reviewEvery,
    status: pushRow?.reviewStatus ?? null,
    anchor: pushRow?.reviewAnchor ?? 0,
  });

  return (
    <PlayAdminProvider admin={user.role === "ADMIN"}>
    <ClaimProvider needed={unclaimed} google={isGoogleEnabled()}>
    <PushPromptProvider
      userId={user.id}
      prompted={pushRow?.pushPromptedAt != null}
      optedIn={pushRow?.pushOptIn === true}
      storyClears={storyClears}
    >
    <StoryChromeProvider>
      <BalancesProvider initial={balances}>
        <ReviewPromptProvider due={reviewIsDue} gems={settings.reviewGems}>
        <CosmeticsProvider initial={wardrobe}>
          <GemShopProvider
            economy={economy}
            publishableKey={stripeReady() ? stripePublishableKey() : null}
            sandbox={earnSandbox()}
          >
            <EnergyProvider initial={energy} enabled={settings.energyEnabled}>
              <PlayerBeacon userId={user.id} username={user.username} />
              <GameHeader progress={progress} stars={stars} board={board} isAdmin={user.role === "ADMIN"} earn={earn} />
              <GameShell>{children}</GameShell>
            </EnergyProvider>
          </GemShopProvider>
        </CosmeticsProvider>
        </ReviewPromptProvider>
      </BalancesProvider>
    </StoryChromeProvider>
    </PushPromptProvider>
    </ClaimProvider>
    </PlayAdminProvider>
  );
}
