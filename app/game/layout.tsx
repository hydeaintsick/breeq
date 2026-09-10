import { GameHeader } from "@/components/game-header";

export default function GameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <GameHeader />
      <div className="flex min-h-0 flex-1 flex-col overflow-x-clip">
        {children}
      </div>
    </>
  );
}
