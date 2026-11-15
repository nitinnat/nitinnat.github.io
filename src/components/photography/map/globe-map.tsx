"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import createGlobe from "cobe";
import { useTheme } from "next-themes";
import type { Place } from "@/lib/photo-geo";
import { PhotoBloom, PlaceStrip, placeDates, usePhotoLightbox } from "./map-shared";

// cobe's convention for the rotation that centres a location.
function anglesFor(place: Place): [number, number] {
  return [Math.PI - ((place.lng * Math.PI) / 180 - Math.PI / 2), (place.lat * Math.PI) / 180];
}

const TAU = Math.PI * 2;

interface Rotation {
  phi: number;
  theta: number;
  target: [number, number] | null;
  paused: boolean;
  dragX: number | null;
}

interface GlobeMapProps {
  places: Place[];
  showArcs?: boolean;
  onSelect?: (place: Place) => void;
}

export function GlobeMap({ places, showArcs = false, onSelect }: GlobeMapProps) {
  const { resolvedTheme } = useTheme();
  const hostRef = useRef<HTMLDivElement>(null);
  const rotation = useRef<Rotation>({ phi: 0.6, theta: 0.3, target: null, paused: false, dragX: null });
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<Place | null>(null);
  const lightbox = usePhotoLightbox();

  useEffect(() => {
    const host = hostRef.current!;
    const canvas = document.createElement("canvas");
    canvas.className = "block h-full w-full cursor-grab active:cursor-grabbing";
    host.append(canvas);

    const dark = resolvedTheme === "dark";
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const size = () => host.getBoundingClientRect().width * 2;
    const state = rotation.current;

    const globe = createGlobe(canvas, {
      devicePixelRatio: 2,
      width: size(),
      height: size(),
      phi: state.phi,
      theta: state.theta,
      dark: dark ? 1 : 0,
      diffuse: dark ? 1.4 : 1.1,
      mapSamples: 20000,
      mapBrightness: dark ? 5 : 8,
      mapBaseBrightness: dark ? 0 : 0.05,
      baseColor: dark ? [0.22, 0.24, 0.25] : [0.98, 0.96, 0.92],
      markerColor: dark ? [0.4, 0.9, 1] : [0.03, 0.5, 0.6],
      glowColor: dark ? [0.1, 0.12, 0.13] : [0.93, 0.91, 0.86],
      markers: places.map((place) => ({
        location: [place.lat, place.lng],
        size: 0.03 + Math.min(place.photos.length, 10) * 0.004,
        id: place.id,
      })),
      arcs: showArcs
        ? places.slice(1).map((place, index) => ({
            from: [places[index].lat, places[index].lng],
            to: [place.lat, place.lng],
            id: `${places[index].id}-${place.id}`,
          }))
        : [],
      arcColor: dark ? [0.4, 0.9, 1] : [0.03, 0.5, 0.6],
      arcWidth: 0.6,
      arcHeight: 0.25,
      markerElevation: 0.01,
    });

    let frame = 0;
    const tick = () => {
      if (state.target) {
        const ease = reduceMotion ? 1 : 0.08;
        state.phi += (state.target[0] - state.phi) * ease;
        state.theta += (state.target[1] - state.theta) * ease;
      } else if (!state.paused && state.dragX === null && !reduceMotion) {
        state.phi += 0.0022;
      }
      globe.update({ phi: state.phi, theta: state.theta, width: size(), height: size() });
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    const down = (event: PointerEvent) => {
      state.dragX = event.clientX;
      state.target = null;
    };
    const move = (event: PointerEvent) => {
      if (state.dragX === null) return;
      state.phi += (event.clientX - state.dragX) * 0.006;
      state.dragX = event.clientX;
    };
    const up = () => {
      state.dragX = null;
    };
    canvas.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);

    return () => {
      cancelAnimationFrame(frame);
      canvas.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      globe.destroy();
      host.replaceChildren();
    };
  }, [resolvedTheme, places, showArcs]);

  const focus = (place: Place) => {
    const state = rotation.current;
    const [phi, theta] = anglesFor(place);
    // Turn the short way round.
    const delta = ((((phi - state.phi) % TAU) + TAU * 1.5) % TAU) - Math.PI;
    state.target = [state.phi + delta, theta];
    setHovered(null);
    if (onSelect) window.setTimeout(() => onSelect(place), 650);
    else setSelected(place);
  };

  const pinStyles = places
    .map(
      ({ id }) =>
        `.globe-pin-${id}{position-anchor:--cobe-${id};opacity:var(--cobe-visible-${id},0);scale:var(--cobe-visible-${id},0)}`,
    )
    .join("");

  return (
    <div>
      <div className="relative mx-auto aspect-square w-full max-w-[560px]">
        <div ref={hostRef} className="absolute inset-0" />
        <style>{`.globe-pin{position:absolute;left:anchor(center);top:anchor(center);translate:-50% -50%;transition:opacity .3s,scale .3s}${pinStyles}`}</style>
        {places.map((place) => (
          <div key={place.id} className={`globe-pin globe-pin-${place.id} z-20 size-7`}>
            <button
              type="button"
              aria-label={`${place.name}, ${place.photos.length} photos`}
              className="block size-7 rounded-full ring-cyan-700 transition-shadow hover:ring-2 focus-visible:ring-2 dark:ring-cyan-300"
              onPointerEnter={() => {
                rotation.current.paused = true;
                setHovered(place.id);
              }}
              onPointerLeave={() => {
                rotation.current.paused = false;
                setHovered((current) => (current === place.id ? null : current));
              }}
              onClick={() => focus(place)}
            />
            <div
              className="absolute left-1/2 top-1/2"
              onPointerEnter={() => {
                rotation.current.paused = true;
                setHovered(place.id);
              }}
              onPointerLeave={() => {
                rotation.current.paused = false;
                setHovered(null);
              }}
            >
              <AnimatePresence>
                {hovered === place.id && (
                  <PhotoBloom
                    photos={place.photos}
                    caption={`${place.name} · ${placeDates(place)}`}
                    onOpen={(photo) => lightbox.open(place.photos, photo)}
                  />
                )}
              </AnimatePresence>
            </div>
          </div>
        ))}
      </div>
      {!onSelect && <PlaceStrip place={selected} onOpen={(photo) => selected && lightbox.open(selected.photos, photo)} />}
      {lightbox.element}
    </div>
  );
}
