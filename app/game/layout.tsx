import { GameHeader } from "@/components/game-header";
import { requireProgress } from "@/lib/auth/session";

export default async function GameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, progress, stars } = await requireProgress();

  return (
    <>
      <GameHeader progress={progress} stars={stars} isAdmin={user.role === "ADMIN"} />
      <div className="flex min-h-0 flex-1 flex-col overflow-x-clip">
        {children}
      </div>
    </>
  );
}
