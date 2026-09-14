"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { loadEarnPage } from "@/app/actions/earn";
import { EthGlyph } from "@/components/currency-glyphs";
import { usePublishBalances } from "@/components/balances-provider";
import { EarnManual } from "@/components/earn-manual";
import { EarnMapCard } from "@/components/earn-map-card";
import { EarnRun } from "@/components/earn-run";
import { useTheme } from "@/components/use-story-theme";
import { arcade } from "@/game/breakout/audio";
import { EARN_CREATE_PATH, EARN_WALLET_PATH } from "@/lib/auth/paths";
import { EARN_SORTS, type Balances, type EarnMapCard as Card, type EarnSort, type EarnStore as Store } from "@/lib/earn";
import { formatEth } from "@/lib/economy";

/**
 * The Earn store. A sticky strip with both balances and the create button,
 * then the shelves: the admins' featured picks, the most played, and every
 * wall in a grid that keeps loading as the player scrolls.
 */
export function EarnStore({ store, sort }: { store: Store; sort: EarnSort }) {
  const router = useRouter();
  const pathname = usePathname();
  const [balances, setBalances] = useState<Balances>(store.balances);
  usePublishBalances(balances);
  const [items, setItems] = useState<Card[]>(store.page.items);
  const [cursor, setCursor] = useState<string | null>(store.page.nextCursor);
  const [loading, setLoading] = useState(false);
  const [won, setWon] = useState<Set<string>>(() => new Set());
  const [selected, setSelected] = useState<Card | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  // The store's theme. A live run stacks its own music on top and hands back here.
  useTheme(arcade, false);

  // A fresh server render (after a run, a refresh) resets the grid and balances.
  const [seenStore, setSeenStore] = useState(store);
  if (store !== seenStore) {
    setSeenStore(store);
    setItems(store.page.items);
    setCursor(store.page.nextCursor);
    setBalances(store.balances);
  }

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !cursor) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const page = await loadEarnPage({ sort, cursor });
      setItems((current) => {
        const seen = new Set(current.map((item) => item.id));
        return [...current, ...page.items.filter((item) => !seen.has(item.id))];
      });
      setCursor(page.nextCursor);
    } catch {
      // Leave the sentinel; the next scroll tries again.
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [cursor, sort]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !cursor) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) void loadMore();
      },
      { rootMargin: "600px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [cursor, loadMore]);

  const decorate = (card: Card): Card => (won.has(card.id) && !card.won ? { ...card, won: true } : card);
  const onWon = useCallback((mapId: string) => {
    setWon((current) => new Set(current).add(mapId));
  }, []);
  const onCloseRun = useCallback(() => {
    setSelected(null);
    router.refresh();
  }, [router]);

  const setSort = (next: EarnSort) => {
    const params = new URLSearchParams();
    if (next !== "plays") params.set("sort", next);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const empty = store.total === 0;

  return (
    <section className="mx-auto w-full max-w-6xl px-4 pb-24 pt-24 sm:px-6">
      <div className="earn-bar">
        <div className="earn-bar-inner glass">
          {/* Balances live in the header's bag pill; the strip is the two doors: the wallet and the editor. */}
          <Link href={EARN_WALLET_PATH} className="earn-bar-wallet" aria-label={`Wallet: ${formatEth(balances.eth)} won. Withdrawals and history.`}>
            <EthGlyph />
            <span>Wallet</span>
            <small>{formatEth(balances.eth, { unit: false })} ETH</small>
          </Link>
          <Link href={EARN_CREATE_PATH} className="btn-play earn-bar-cta">
            Create my map
          </Link>
        </div>
      </div>

      <header className="mt-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">Earn</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
            Walls built by <span className="text-neon">players</span>
          </h1>
        </div>
        <EarnManual economy={store.economy} />
      </header>

      {empty ? (
        <div className="earn-empty glass mt-10">
          <p className="text-lg font-semibold text-ink">No walls on sale yet.</p>
          <p className="mt-2 max-w-sm text-sm leading-6 text-ink-muted">
            The first map published here sets the pace. Build one, price the ticket, and let the others try.
          </p>
          <Link href={EARN_CREATE_PATH} className="btn-play mt-6 min-h-11">
            Create the first map
          </Link>
        </div>
      ) : null}

      {store.featured.length > 0 ? (
        <Shelf title="Featured" kicker="Picked by Breeq">
          <div className="earn-row" data-size="lg">
            {store.featured.map((card, index) => (
              <EarnMapCard key={card.id} card={decorate(card)} featured seed={11 + index} onPlay={setSelected} />
            ))}
          </div>
        </Shelf>
      ) : null}

      {store.mostPlayed.length > 0 ? (
        <Shelf title="Most played" kicker="Where the crowd is">
          <div className="earn-row">
            {store.mostPlayed.map((card, index) => (
              <EarnMapCard key={card.id} card={decorate(card)} seed={31 + index} onPlay={setSelected} />
            ))}
          </div>
        </Shelf>
      ) : null}

      {!empty ? (
        <Shelf title="All walls" kicker={`${store.total.toLocaleString("en-US")} on sale`}>
          <div className="earn-sort" role="tablist" aria-label="Sort walls">
            {EARN_SORTS.map((option) => (
              <button
                key={option.id}
                type="button"
                role="tab"
                aria-selected={sort === option.id}
                className="editor-chip"
                data-active={sort === option.id}
                onClick={() => setSort(option.id)}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className="earn-grid mt-4">
            {items.map((card, index) => (
              <EarnMapCard key={card.id} card={decorate(card)} seed={53 + index} onPlay={setSelected} />
            ))}
          </div>
          <div ref={sentinelRef} className="h-px" aria-hidden="true" />
          <p className="mt-8 text-center text-sm text-ink-muted" aria-live="polite">
            {cursor ? (loading ? "Loading more walls…" : "") : items.length > 0 ? "That is every wall on sale." : ""}
          </p>
        </Shelf>
      ) : null}

      {selected ? (
        <EarnRun
          key={selected.id}
          card={decorate(selected)}
          balances={balances}
          onBalances={setBalances}
          onWon={onWon}
          onClose={onCloseRun}
        />
      ) : null}
    </section>
  );
}

function Shelf({ title, kicker, children }: { title: string; kicker?: string; children: React.ReactNode }) {
  return (
    <section className="mt-12">
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <h2 className="text-2xl font-semibold tracking-tight text-ink">{title}</h2>
        {kicker ? <p className="text-xs text-ink-muted">{kicker}</p> : null}
      </div>
      {children}
    </section>
  );
}
