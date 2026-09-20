"use client";

import { useBalances } from "@/components/balances-provider";
import { GemGlyph } from "@/components/currency-glyphs";
import { EnergyGauge } from "@/components/energy-gauge";
import { useEnergy } from "@/components/energy-provider";
import { EnergyClock, EnergyPackArt } from "@/components/energy-sheet";
import { playSheetBuy } from "@/game/breakout/audio";
import { pulseUi } from "@/game/breakout/haptics";
import { formatGems } from "@/lib/economy";
import { ENERGY_PACKS, ENERGY_PLAY_COST, runsLeft, type EnergyPack } from "@/lib/energy";

const runsLabel = (n: number) => (n === 1 ? "1 run" : `${n} runs`);

/**
 * The energy shelf on the shop page: the gauge as it stands, when the free
 * recharge lands, and the three recharges. Picking one hands it to the
 * recharge sheet already buying it — gems if the bag can pay, the card
 * checkout if it cannot — so the page never has a second checkout of its own.
 */
export function EnergyShelf() {
  const energy = useEnergy();
  const balances = useBalances();
  const gems = balances?.balances.gems ?? 0;
  if (!energy) return null;
  const { state } = energy;
  const runs = runsLeft(state.energy);

  function pick(pack: EnergyPack) {
    playSheetBuy();
    pulseUi(6);
    energy?.open({ reason: "browse", pack: pack.id });
  }

  return (
    <div className="energy-shelf">
      <section className="energy-shelf-head glass" aria-label="Your energy">
        <EnergyGauge energy={state.energy} max={state.max} size="lg" className="energy-shelf-gauge" />
        <p className="energy-shelf-runs">
          {runs === 0 ? "No run left today" : runs === 1 ? "One run left" : `${runs} runs left`}
          <span className="energy-shelf-cost"> · a run costs {ENERGY_PLAY_COST}</span>
        </p>
        <p className="energy-shelf-clock">
          Free recharge in <EnergyClock resetAt={state.resetAt} />
        </p>
      </section>

      <ul className="energy-shelf-packs" aria-label="Recharges">
        {ENERGY_PACKS.map((pack, index) => {
          const short = pack.gems > gems;
          return (
            <li key={pack.id} style={{ "--i": index } as React.CSSProperties}>
              <button
                type="button"
                className="energy-shelf-pack glass"
                data-tag={pack.tag || undefined}
                data-short={short ? "true" : undefined}
                aria-label={`${pack.name}: ${pack.cells} cells, ${runsLabel(runsLeft(pack.cells))}, for ${formatGems(pack.gems)} gems.${short ? " Not enough gems: opens the checkout." : ""}`}
                onClick={() => pick(pack)}
              >
                {pack.tag ? <span className="pack-tag">{pack.tag}</span> : null}
                <EnergyPackArt pack={pack} />
                <span className="energy-shelf-copy">
                  <span className="energy-shelf-name">{pack.name}</span>
                  <span className="energy-shelf-cells">
                    +{pack.cells} cells · {runsLabel(runsLeft(pack.cells))}
                  </span>
                  <span className="energy-shelf-line">{pack.line}</span>
                </span>
                <span className="energy-shelf-cta btn-play">
                  <GemGlyph /> {formatGems(pack.gems)}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <p className="shop-fine">
        Cells past the gauge are banked and never lost. The gauge refills for free at midnight UTC; bought cells stay.
      </p>
    </div>
  );
}
