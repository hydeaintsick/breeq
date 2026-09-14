"use client";

import { useEffect, useRef } from "react";
import type { StoryZone } from "@/components/story-chrome";
import { StoryPanel } from "@/components/story-panel";
import { mountGalaxy, type GalaxyHandle } from "@/game/journey";

/**
 * The galaxy map sheet: the whole, with the route as the lit corner of it.
 * Tapping a reached zone travels the route there and closes the map.
 */
export function GalaxyMap({
  zones,
  onClose,
  onTravel,
}: {
  zones: readonly StoryZone[];
  onClose: () => void;
  onTravel: (index: number) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handleRef = useRef<GalaxyHandle | null>(null);
  const onTravelRef = useRef(onTravel);
  useEffect(() => {
    onTravelRef.current = onTravel;
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handle = mountGalaxy(canvas, zones, { onTap: (index) => onTravelRef.current(index) });
    handleRef.current = handle;
    return () => {
      handle.destroy();
      handleRef.current = null;
    };
    // Mounted once; zones are pushed below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    handleRef.current?.setZones(zones);
  }, [zones]);

  const reached = zones.filter((zone) => zone.state !== "locked").length;
  const cleared = zones.filter((zone) => zone.state === "cleared").length;
  const current = zones.find((zone) => zone.state === "current");

  return (
    <StoryPanel
      title="Galaxy map"
      subtitle={zones.length > 0 ? `${reached} of ${zones.length} zones reached · ${cleared} cleared` : "No route yet"}
      closeLabel="Put the map away"
      onClose={onClose}
    >
      <div className="galaxy-stage">
        <canvas
          ref={canvasRef}
          className="galaxy-canvas"
          role="img"
          aria-label={
            current
              ? `A spiral galaxy under a dust veil. Kal's route is a short lit thread on the rim of one arm, at zone ${current.kicker}, ${current.title}. The veil thins only around it.`
              : "A spiral galaxy under a dust veil. Kal's route is a short lit thread on the rim of one arm."
          }
        />
      </div>
      <div className="galaxy-foot">
        <p className="text-sm leading-6 text-white/70">
          The road so far runs along the rim of one arm. The dust has not lifted anywhere else yet.
        </p>
        <p className="text-xs text-white/45">Tap a lit zone to travel there.</p>
      </div>
    </StoryPanel>
  );
}
