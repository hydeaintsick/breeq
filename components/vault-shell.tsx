export function VaultShell({
  kicker,
  title,
  lede,
  children,
}: {
  kicker: string;
  title: string;
  lede: string;
  children: React.ReactNode;
}) {
  return (
    <article className="mx-auto w-full max-w-3xl px-6 pb-24 pt-32">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-accent">
        {kicker}
      </p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
        {title}
      </h1>
      <p className="mt-5 max-w-2xl text-lg leading-8 text-ink-muted">{lede}</p>
      <div className="glass mt-10 px-6 py-8 sm:px-8">{children}</div>
    </article>
  );
}
