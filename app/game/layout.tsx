import { GameHeader } from "@/components/game-header";

export default function GameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <GameHeader />
      {children}
    </>
  );
}
