/**
 * The Journey's sound: heavy, slow, mysterious space under the story theme.
 *
 * Three layers, all procedural on the shared bus and in the theme's key of D:
 * - a bed of sub-rumble and wind that swells with the camera's speed, so a
 *   drag across the map is heard as passage;
 * - distant pings, a low glass bell every several seconds far back in the
 *   hall, sparse and seeded, so the map never falls silent;
 * - moments: a settle when the camera lands on a zone, a soft rise when an
 *   episode opens, a dull knock on a locked one, and a long shimmer when a
 *   shroud lifts.
 * Every pitch is taken from the chord the theme is on at that moment
 * (`storyThemeChord`), never from the bare scale: a random scale note over a
 * moving chord is where the dissonance used to come from. Nothing above 5 kHz;
 * the theme keeps the melody, this keeps the room.
 */
import { unlockSound } from "../breakout/audio/bus";
import { Layer } from "../breakout/audio/synth";
import { storyThemeChord } from "../breakout/audio/theme";
import { createRng } from "../shared/random";

const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);
const ROOT = 50; // D3

const WIND_MAX = 0.05;
const RUMBLE_LEVEL = 0.024;
const PING_EVERY: readonly [number, number] = [7, 14];

interface Bed {
  wind: GainNode;
  windFilter: BiquadFilterNode;
  sources: AudioScheduledSourceNode[];
  close: () => void;
}

export class JourneySfx {
  private layer: Layer | null = null;
  private bed: Bed | null = null;
  private active = true;
  private speed = 0;
  private nextPing = 0;
  private lastSettle = -1;
  private readonly rng = createRng(0x1e5);

  /** Call from a pointer gesture: the context can only start inside one. */
  unlock(): void {
    unlockSound();
    this.ensure();
  }

  /** False while covered by a sheet, off-screen, or in a hidden tab. */
  setActive(on: boolean): void {
    this.active = on;
    this.layer?.setActive(on);
  }

  /** Camera speed in nodes per second; drives the wind. */
  setSpeed(v: number): void {
    this.speed = Math.min(1, Math.abs(v) / 2.5);
  }

  /** Once per frame: wind follows the camera, pings come and go. */
  update(): void {
    const L = this.layer;
    const bed = this.bed;
    if (!L || !bed || !this.active || !L.ready) return;
    const now = L.now;
    const target = WIND_MAX * (0.12 + 0.88 * this.speed * this.speed);
    bed.wind.gain.setTargetAtTime(target, now, 0.18);
    bed.windFilter.frequency.setTargetAtTime(320 + 900 * this.speed, now, 0.25);
    if (now >= this.nextPing) {
      this.nextPing = now + this.rng.range(PING_EVERY[0], PING_EVERY[1]);
      const degree = this.chordTone(this.rng.chance(0.75));
      const octave = this.rng.chance(0.3) ? 12 : 0;
      const pan = this.rng.range(-0.7, 0.7);
      L.bell({ freq: hz(ROOT + degree + octave - 12), gain: 0.045, decay: 3.6, pan, send: 0.98 });
      // A faint answer, further away.
      L.bell({ freq: hz(ROOT + degree + octave), gain: 0.02, decay: 2.8, at: now + 0.9, pan: -pan, send: 1 });
    }
  }

  /** A pitch (semitones above D) inside the chord sounding now: a triad note, or a safe extension. */
  private chordTone(triadOnly: boolean, pick?: number): number {
    const chord = storyThemeChord();
    if (triadOnly || chord.extras.length === 0) {
      return chord.triad[(pick ?? this.rng.int(0, 2)) % 3];
    }
    return chord.extras[(pick ?? this.rng.int(0, chord.extras.length - 1)) % chord.extras.length];
  }

  /** The camera came to rest on zone `index`. */
  settle(index: number, locked: boolean): void {
    const L = this.ensure();
    if (!L || !this.active) return;
    if (this.lastSettle === index) return;
    this.lastSettle = index;
    if (locked) {
      this.knock(L, 0.6);
      return;
    }
    // Each zone has its own place in the chord; further zones ring higher.
    const degree = this.chordTone(true, index);
    const octave = 12 * (1 + Math.floor(index / 3) % 2);
    L.bell({ freq: hz(ROOT + degree + octave), gain: 0.07, decay: 1.6, pan: 0, send: 0.85 });
    L.tone({ freq: hz(ROOT + degree + 12), gain: 0.025, attack: 0.05, decay: 0.9, lowpass: 900, send: 0.8 });
  }

  /** The player let go and the map is gliding to a zone. */
  fling(): void {
    const L = this.ensure();
    if (!L || !this.active) return;
    L.noise({ gain: 0.035, attack: 0.04, decay: 0.5, filter: "bandpass", freq: 700, to: 260, q: 0.9, send: 0.7 });
  }

  /** An episode opens: two glass notes rising out of the hall. */
  open(): void {
    const L = this.ensure();
    if (!L || !this.active) return;
    const at = L.now + 0.01;
    const chord = storyThemeChord();
    L.bell({ freq: hz(ROOT + 12 + chord.triad[0]), gain: 0.09, decay: 1.4, at, pan: -0.2, send: 0.85 });
    L.bell({ freq: hz(ROOT + 12 + chord.triad[2]), gain: 0.07, decay: 1.8, at: at + 0.11, pan: 0.2, send: 0.9 });
    L.noise({ gain: 0.03, attack: 0.02, decay: 0.7, filter: "bandpass", freq: 900, to: 2600, q: 1.1, send: 0.8, at });
  }

  /** A tap on a shrouded zone. */
  locked(): void {
    const L = this.ensure();
    if (!L || !this.active) return;
    this.knock(L, 1);
  }

  /** A shroud lifts: debris scatters, a long shimmer. */
  reveal(): void {
    const L = this.ensure();
    if (!L || !this.active) return;
    const at = L.now + 0.02;
    L.noise({ gain: 0.06, attack: 0.3, hold: 0.4, decay: 1.6, filter: "bandpass", freq: 400, to: 1800, q: 0.7, send: 0.9, at });
    const chord = storyThemeChord();
    for (let i = 0; i < 4; i++) {
      // Up the chord and over the top: root, third, fifth, root.
      const degree = chord.triad[i % 3] + (i === 3 ? 12 : 0);
      L.bell({ freq: hz(ROOT + 12 + degree), gain: 0.05, decay: 2.2, at: at + 0.35 + i * 0.16, pan: -0.4 + i * 0.27, send: 0.95 });
    }
  }

  destroy(): void {
    this.stopBed();
    this.layer?.destroy();
    this.layer = null;
  }

  // ---------------------------------------------------------------------------

  private knock(L: Layer, gain: number): void {
    L.tone({ freq: 120, to: 78, glide: 0.14, gain: 0.11 * gain, attack: 0.006, decay: 0.32, lowpass: 500, send: 0.5 });
    L.noise({ gain: 0.035 * gain, decay: 0.09, filter: "lowpass", freq: 360, q: 0.8, send: 0.4 });
  }

  private ensure(): Layer | null {
    if (this.layer) return this.layer;
    const bus = unlockSound();
    if (!bus) return null;
    const layer = new Layer(bus, 0x10e7);
    layer.setActive(this.active);
    this.layer = layer;
    this.bed = this.buildBed(layer);
    this.nextPing = layer.now + this.rng.range(2.5, 5);
    return layer;
  }

  /** Rumble and wind: seeded noise through two filters, the wind's gain live. */
  private buildBed(L: Layer): Bed | null {
    const ch = L.channel({ pan: 0, send: 0.75 });
    if (!ch) return null;
    const ctx = L.ctx;
    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 2.5), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    const rng = createRng(0x9b0d);
    for (let i = 0; i < data.length; i++) data[i] = rng.next() * 2 - 1;

    const sources: AudioScheduledSourceNode[] = [];
    const source = () => {
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.loop = true;
      src.start(0, rng.range(0, 2));
      sources.push(src);
      return src;
    };

    // Sub-rumble: what a very large, very quiet place sounds like.
    const rumbleFilter = ctx.createBiquadFilter();
    rumbleFilter.type = "lowpass";
    rumbleFilter.frequency.value = 70;
    rumbleFilter.Q.value = 0.6;
    const rumble = ctx.createGain();
    rumble.gain.value = RUMBLE_LEVEL;
    source().connect(rumbleFilter).connect(rumble).connect(ch.input);
    const breathe = ctx.createOscillator();
    breathe.frequency.value = 0.07;
    const depth = ctx.createGain();
    depth.gain.value = RUMBLE_LEVEL * 0.5;
    breathe.connect(depth).connect(rumble.gain);
    breathe.start();
    sources.push(breathe);

    // Wind: a band that opens with the camera's speed.
    const windFilter = ctx.createBiquadFilter();
    windFilter.type = "bandpass";
    windFilter.frequency.value = 320;
    windFilter.Q.value = 0.6;
    const wind = ctx.createGain();
    wind.gain.value = 0;
    source().connect(windFilter).connect(wind).connect(ch.input);

    return {
      wind,
      windFilter,
      sources,
      close: () => {
        for (const src of sources) {
          try {
            src.stop();
          } catch {
            // Already stopped.
          }
        }
        ch.close();
      },
    };
  }

  private stopBed(): void {
    this.bed?.close();
    this.bed = null;
  }
}
