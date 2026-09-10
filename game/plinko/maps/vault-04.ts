/**
 * Vault 04 — the showcase board.
 *
 * A full Plinko lattice with one of each trap from the kit: a fan on the right
 * rail, a trampoline on the left, a nail cluster under the fan, and a fake
 * portal right above the chest. Three bins: void, chest, void.
 */
import { createBoard } from "../engine/builder";

export const VAULT_04 = createBoard({ id: "vault-04", name: "Vault 04" })
  .pegLattice({
    top: 112,
    rows: 8,
    pitchY: 34,
    even: [70, 110, 150, 190, 230],
    odd: [50, 90, 130, 170, 210, 250],
  })
  // Fan: right rail, blows left across the third row.
  .fan({ y: 178, dir: "left", reach: 110, spread: 36, force: 3000 })
  .clearPegsIn({ x: 216, y: 160, w: 60, h: 40 })
  // Trampoline: left side, between rows 5 and 6.
  .trampoline({ x: 70, y: 300, width: 56 })
  .clearPegsIn({ x: 36, y: 262, w: 72, h: 60 })
  // Nails: right rail, just above the bins.
  .nails({ y: 352, dir: "left", count: 3, pitch: 16, length: 22 })
  .clearPegsIn({ x: 236, y: 330, w: 40, h: 44 })
  // Fake portal: looks like an exit, sits right above the chest, does nothing.
  .portal({ x: 150, y: 412, r: 17 })
  .bins(["void", "chest", "void"])
  .build();
