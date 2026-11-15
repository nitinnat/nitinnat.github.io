"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { geoCentroid, geoContains, geoDistance } from "d3-geo";
import { select } from "d3-selection";
import "d3-transition";
import { easeCubicInOut } from "d3-ease";
import { zoom, zoomIdentity, type ZoomBehavior, type ZoomTransform } from "d3-zoom";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GeoPhoto, Place } from "@/lib/photo-geo";
import type { Region } from "./flat-map";
import {
  EASE_OUT,
  MAP_HEIGHT,
  MAP_WIDTH,
  PhotoBloom,
  PlaceStrip,
  pathFor,
  placeDates,
  project,
  usePhotoLightbox,
  useHydrology,
  useTerrainBands,
  useVisitedRegions,
  useWorldShapes,
} from "./map-shared";
import { Forest, Hill, Mountain, Town, selectSpaced, usePeaks } from "./terrain";
import { landmarks } from "./landmarks";

interface Bloom {
  key: string;
  // A point on the map, or a fixed position in the map container (for regions without photos).
  anchor: [number, number] | { x: number; y: number };
  photos: GeoPhoto[];
  caption: string;
}

type Bounds = [[number, number], [number, number]];
type Point = { x: number; y: number };

const EARTH_KM = 6371;
// Beyond this, the "nearest" photos aren't meaningfully nearby, so none are suggested.
const NEARBY_KM = 1000;
const MAX_ZOOM = 48;
const TOWN_ZOOM = 2;
const MAX_ROAD_KM = 1500;
const SOUTHERN_LIMIT_Y = project({ lat: -56, lng: 0 })[1];

// Deterministic jitter so the scattered forests stay put between renders.
const jitter = (a: number, b: number) => {
  const n = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453;
  return n - Math.floor(n);
};

export function AtlasMap({ places, initialFocus = null }: { places: Place[]; initialFocus?: Place | null }) {
  const shapes = useWorldShapes();
  const peaks = usePeaks();
  const bands = useTerrainBands();
  const water = useHydrology();
  const visited = useVisitedRegions(places, shapes);
  const lightbox = usePhotoLightbox();

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const worldRef = useRef<SVGGElement>(null);
  const symbolsRef = useRef<SVGGElement>(null);
  const zoomRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const hintTimer = useRef<number | undefined>(undefined);
  const closeTimer = useRef<number | undefined>(undefined);

  // The live transform is written to the DOM while zooming; React only sees it once at rest.
  const [settled, setSettled] = useState<ZoomTransform>(zoomIdentity);
  const [width, setWidth] = useState(0);
  const [selected, setSelected] = useState<Place | null>(initialFocus);
  const [highlighted, setHighlighted] = useState<string | null>(null);
  const [bloom, setBloom] = useState<Bloom | null>(null);
  const [hint, setHint] = useState(false);

  const zoomTo = ([[x0, y0], [x1, y1]]: Bounds, maxZoom: number) => {
    const k = Math.min(maxZoom, 0.8 / Math.max((x1 - x0) / MAP_WIDTH, (y1 - y0) / MAP_HEIGHT, 1e-6));
    const target = zoomIdentity.translate(MAP_WIDTH / 2 - (k * (x0 + x1)) / 2, MAP_HEIGHT / 2 - (k * (y0 + y1)) / 2).scale(k);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    select(svgRef.current!).transition().duration(reduce ? 0 : 1100).ease(easeCubicInOut).call(zoomRef.current!.transform, target);
  };
  const zoomBy = (factor: number) =>
    select(svgRef.current!).transition().duration(350).ease(easeCubicInOut).call(zoomRef.current!.scaleBy, factor);

  useEffect(() => {
    if (!shapes) return;
    const svg = select(svgRef.current!);
    const behavior = zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, MAX_ZOOM])
      .translateExtent([[0, 0], [MAP_WIDTH, MAP_HEIGHT]])
      // Plain scrolling keeps scrolling the page; pinch (ctrl+wheel) or ⌘/Ctrl+scroll zooms.
      // On touch, one finger scrolls the page and two fingers pan/zoom the map.
      .filter((event) => {
        if (event.type === "wheel") return event.ctrlKey || event.metaKey;
        if (event.type.startsWith("touch")) return event.touches.length > 1;
        return !event.button;
      })
      .on("start", () => setBloom(null))
      .on("zoom", ({ transform }) => {
        worldRef.current!.setAttribute("transform", transform.toString());
        // Only the symbol layer reads --k, so zooming restyles symbols, not every region path.
        symbolsRef.current!.style.setProperty("--k", String(transform.k));
      })
      .on("end", ({ transform }) => setSettled(transform));
    svg.call(behavior).style("touch-action", "pan-y");
    zoomRef.current = behavior;

    // A pinch that starts over an overlay (photos, controls) must not zoom the whole page.
    const container = containerRef.current!;
    const blockPageZoom = (event: WheelEvent) => {
      if (event.ctrlKey) event.preventDefault();
    };
    container.addEventListener("wheel", blockPageZoom, { passive: false });

    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(container);

    if (initialFocus) {
      const [x, y] = project(initialFocus);
      const k = 10;
      svg
        .transition()
        .delay(150)
        .duration(1300)
        .ease(easeCubicInOut)
        .call(behavior.transform, zoomIdentity.translate(MAP_WIDTH / 2 - k * x, MAP_HEIGHT / 2 - k * y).scale(k));
    }

    return () => {
      container.removeEventListener("wheel", blockPageZoom);
      observer.disconnect();
      svg.on(".zoom", null);
    };
  }, [shapes, initialFocus]);

  const k = settled.k;
  const pixel = width / MAP_WIDTH;
  const view = { x0: settled.invertX(0), y0: settled.invertY(0), x1: settled.invertX(MAP_WIDTH), y1: settled.invertY(MAP_HEIGHT) };
  const inView = ({ x, y }: Point, margin = 0) =>
    x >= view.x0 - margin && x <= view.x1 + margin && y >= view.y0 - margin && y <= view.y1 + margin;

  // Coastlines only: the land outline has no internal borders.
  const coastline = useMemo(() => shapes?.land.map((l) => pathFor(l)).join(" ") ?? "", [shapes]);

  const placePoints = useMemo(
    () =>
      places.map((place) => {
        const [x, y] = project(place);
        return { place, x, y };
      }),
    [places],
  );
  const landmarkPoints = useMemo(
    () =>
      landmarks.map((landmark) => {
        const [x, y] = project(landmark);
        return { ...landmark, x, y };
      }),
    [],
  );

  // Roads link nearby towns like a game map: the shortest connections that join separate
  // groups of towns (a minimum spanning tree), skipping anything too far to drive.
  const routes = useMemo(() => {
    const edges = places.flatMap((a, i) =>
      places.slice(i + 1).map((b, offset) => ({
        a: i,
        b: i + 1 + offset,
        km: geoDistance([a.lng, a.lat], [b.lng, b.lat]) * EARTH_KM,
      })),
    );
    const group = places.map((_, i) => i);
    const root = (i: number): number => (group[i] === i ? i : (group[i] = root(group[i])));
    return edges
      .filter((edge) => edge.km <= MAX_ROAD_KM)
      .sort((x, y) => x.km - y.km)
      .flatMap(({ a, b }) => {
        if (root(a) === root(b)) return [];
        group[root(a)] = root(b);
        // A gentle, deterministic bend so roads meander like a game map's routes.
        const [x1, y1] = project(places[a]);
        const [x2, y2] = project(places[b]);
        const bend = (jitter(x1 + x2, y1 + y2) - 0.5) * 0.5;
        const cx = (x1 + x2) / 2 - (y2 - y1) * bend;
        const cy = (y1 + y2) / 2 + (x2 - x1) * bend;
        return [{ id: `${places[a].id}-${places[b].id}`, d: `M${x1} ${y1} Q${cx} ${cy} ${x2} ${y2}` }];
      });
  }, [places]);

  const { highPeaks, lowPeaks } = useMemo(() => {
    const onMap = peaks.filter((p) => p.y < SOUTHERN_LIMIT_Y);
    return {
      highPeaks: onMap.filter((p) => p.elevation >= 2500),
      lowPeaks: onMap.filter((p) => p.elevation < 2500),
    };
  }, [peaks]);

  // Forest spots: a jittered grid of map points that fall on land (native path hit-testing).
  const forests = useMemo(() => {
    if (!coastline) return [];
    const context = document.createElement("canvas").getContext("2d")!;
    const land = new Path2D(coastline);
    const points: { id: number; x: number; y: number }[] = [];
    for (let y = 30; y < SOUTHERN_LIMIT_Y; y += 5) {
      for (let x = 0; x < MAP_WIDTH; x += 5) {
        const px = x + jitter(x, y) * 4;
        const py = y + jitter(y, x) * 4;
        if (context.isPointInPath(land, px, py)) points.push({ id: points.length, x: px, y: py });
      }
    }
    return points.sort((a, b) => jitter(a.x, a.y) - jitter(b.x, b.y));
  }, [coastline]);

  // A landmark right on top of one of the towns is lifted to sit just above it.
  const shownLandmarks = landmarkPoints
    .filter((l) => k >= l.minZoom && inView(l, 20 / k))
    .map((l) => ({
      ...l,
      lifted: k >= TOWN_ZOOM && placePoints.some((p) => Math.hypot(p.x - l.x, p.y - l.y) * k * pixel < 36),
    }));

  // Terrain keeps a constant on-screen spacing, so more of it appears as you zoom in.
  const terrain = useMemo(() => {
    if (pixel === 0) return [];
    const spacing = (px: number) => px / (k * pixel);
    const bounds = { x0: settled.invertX(0), y0: settled.invertY(0), x1: settled.invertX(MAP_WIDTH), y1: settled.invertY(MAP_HEIGHT) };
    const close = k >= TOWN_ZOOM;
    // Towns only reserve space once they're drawn as towns.
    const occupied = [...landmarkPoints.filter((l) => k >= l.minZoom), ...(close ? placePoints : [])];
    // Spacing below a mountain's width lets dense ranges overlap into one painted mass.
    const mountains = selectSpaced(highPeaks, bounds, spacing(close ? 30 : 22), occupied, close ? 140 : 110);
    const hills = close ? selectSpaced(lowPeaks, bounds, spacing(40), [...occupied, ...mountains], 80) : [];
    const trees = close ? selectSpaced(forests, bounds, spacing(32), [...occupied, ...mountains, ...hills], 110) : [];
    return [
      ...mountains.map((peak) => ({ ...peak, kind: "mountain" as const })),
      ...hills.map((peak) => ({ ...peak, kind: "hill" as const })),
      ...trees.map((spot) => ({ ...spot, elevation: 0, kind: "trees" as const })),
    ].sort((a, b) => a.y - b.y);
  }, [highPeaks, lowPeaks, forests, landmarkPoints, placePoints, settled, k, pixel]);

  // Town names that would overlap a busier town's name are left out.
  const labelledTowns = useMemo(() => {
    const boxes: { x0: number; x1: number; y0: number; y1: number }[] = [];
    const shown = new Set<string>();
    [...placePoints]
      .sort((a, b) => b.place.photos.length - a.place.photos.length)
      .forEach(({ place, x, y }) => {
        const sx = settled.applyX(x) * pixel;
        const sy = settled.applyY(y) * pixel + 18;
        const half = (place.name.length * 6.6) / 2 + 4;
        const box = { x0: sx - half, x1: sx + half, y0: sy - 12, y1: sy + 4 };
        if (boxes.some((b) => box.x0 < b.x1 && box.x1 > b.x0 && box.y0 < b.y1 && box.y1 > b.y0)) return;
        boxes.push(box);
        shown.add(place.id);
      });
    return shown;
  }, [placePoints, settled, pixel]);

  const toScreen = ([x, y]: [number, number]) => ({ x: settled.applyX(x) * pixel, y: settled.applyY(y) * pixel });

  const keepOpen = () => window.clearTimeout(closeTimer.current);
  const scheduleClose = () => {
    keepOpen();
    closeTimer.current = window.setTimeout(() => {
      setBloom(null);
      setHighlighted(null);
    }, 220);
  };
  const placesIn = (region: Region) => places.filter((p) => geoContains(region, [p.lng, p.lat]));
  const largest = (list: Place[]) => list.reduce((a, b) => (b.photos.length > a.photos.length ? b : a));

  const showPlace = (place: Place) => {
    keepOpen();
    setBloom({ key: place.id, anchor: project(place), photos: place.photos, caption: `${place.name} · ${placeDates(place)}` });
  };

  const showRegion = (region: Region, event: PointerEvent) => {
    keepOpen();
    setHighlighted(region.properties.name);
    const inside = placesIn(region);
    if (inside.length > 0) {
      const photos = inside.flatMap((p) => p.photos);
      setBloom({ key: region.properties.name, anchor: project(largest(inside)), photos, caption: `${region.properties.name} · ${photos.length} photos` });
      return;
    }
    const centre = geoCentroid(region);
    const nearest = places.reduce((a, b) => (geoDistance(centre, [b.lng, b.lat]) < geoDistance(centre, [a.lng, a.lat]) ? b : a));
    const km = Math.round(geoDistance(centre, [nearest.lng, nearest.lat]) * EARTH_KM);
    const box = containerRef.current!.getBoundingClientRect();
    const nearby = km <= NEARBY_KM;
    setBloom({
      key: region.properties.name,
      anchor: { x: event.clientX - box.left, y: event.clientY - box.top },
      photos: nearby ? nearest.photos.slice(0, 3) : [],
      caption: nearby ? `Nearest: ${nearest.name} · ${km.toLocaleString()} km` : `No photos from ${region.properties.name} yet`,
    });
  };

  const focusPlace = (place: Place) => {
    setSelected(place);
    setBloom(null);
    zoomTo([project(place), project(place)], 10);
  };

  const focusRegion = (region: Region) => {
    const inside = placesIn(region);
    if (inside.length === 0) return;
    setSelected(largest(inside));
    setBloom(null);
    zoomTo(pathFor.bounds(region), 14);
  };

  const showHint = () => {
    setHint(true);
    window.clearTimeout(hintTimer.current);
    hintTimer.current = window.setTimeout(() => setHint(false), 1600);
  };

  if (!shapes) return <div className="aspect-[960/500] w-full animate-pulse rounded-xl bg-muted/40" />;

  const region = (feature: Region, isVisited: boolean, borders: boolean) => (
    <path
      key={feature.id ?? feature.properties.name}
      data-region={feature.properties.name}
      d={pathFor(feature) ?? undefined}
      vectorEffect="non-scaling-stroke"
      strokeWidth={0.8}
      strokeDasharray="2 3"
      strokeOpacity={borders ? 0.75 : 0}
      className={cn(
        "gm-border cursor-pointer",
        highlighted === feature.properties.name ? "gm-land-hover" : isVisited ? "gm-land-visited" : "gm-land",
      )}
      onPointerEnter={(event) => showRegion(feature, event)}
      onPointerLeave={scheduleClose}
      onClick={() => focusRegion(feature)}
    />
  );

  const rise = (index: number) => ({ animationDelay: `${Math.min(index * 10, 280)}ms` });

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">
          {places.length} places · pinch or ⌘/Ctrl + scroll to zoom · drag to pan
        </p>
      </div>
      <div
        ref={containerRef}
        className="relative w-full overflow-hidden rounded-xl border border-border"
        onWheel={(event) => {
          if (!event.ctrlKey && !event.metaKey) showHint();
        }}
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
          className="block h-auto w-full cursor-grab bg-[#a6d3e4] active:cursor-grabbing"
          role="img"
          aria-label="Illustrated world map of photo locations"
        >
          <g ref={worldRef}>
            <path d={coastline} fill="none" className="gm-shallows pointer-events-none" strokeWidth={14} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
            {/* The land sits on an earthy edge, like a raised diorama. */}
            <path d={coastline} transform={`translate(0 ${4 / (k * pixel || 1)})`} className="gm-cliff-shadow pointer-events-none" fillRule="evenodd" />
            <path d={coastline} transform={`translate(0 ${2.2 / (k * pixel || 1)})`} className="gm-cliff pointer-events-none" fillRule="evenodd" />
            {/* Lakes are gaps between country shapes, not holes in the coastline, so they read as water. */}
            <path d={coastline} className="gm-lake pointer-events-none" />
            {shapes.countries.filter((c) => c.properties.name !== "United States of America").map((c) => region(c, visited.countries.has(c.properties.name), true))}
            {shapes.states.map((s) => region(s, visited.states.has(s.properties.name), k >= 3))}
            <g className="pointer-events-none" aria-hidden="true">
              {bands.map(({ level, d }, index) => (
                <path key={level} d={d} fillRule="evenodd" className={`gm-band-${index}`} />
              ))}
            </g>
            <g className="pointer-events-none" aria-hidden="true">
              <path d={water.lakes} fillRule="evenodd" className="gm-lake gm-foam" strokeWidth={1} vectorEffect="non-scaling-stroke" />
              {water.rivers
                .filter((river) => river.rank <= (k >= TOWN_ZOOM ? 5 : 3))
                .map(({ rank, d }, index) => (
                  <g key={index}>
                    <path d={d} fill="none" className="gm-river-edge" strokeWidth={rank <= 2 ? 4 : rank <= 4 ? 3 : 2} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                    <path d={d} fill="none" className="gm-river" strokeWidth={rank <= 2 ? 2.2 : rank <= 4 ? 1.5 : 1} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                  </g>
                ))}
            </g>
            <path d={coastline} fill="none" className="gm-foam pointer-events-none" strokeWidth={1.4} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />

            {k >= 1.5 && (
              <g className="pointer-events-none" aria-hidden="true">
                {routes.map(({ id, d }) => (
                  <g key={id}>
                    <path d={d} fill="none" className="gm-route-edge" strokeWidth={5} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                    <path d={d} fill="none" className="gm-route" strokeWidth={3} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                  </g>
                ))}
              </g>
            )}

            <g ref={symbolsRef}>
              <g className="pointer-events-none" aria-hidden="true">
                {terrain.map((item, index) => (
                  <g key={`${item.kind}-${item.id}`} transform={`translate(${item.x} ${item.y})`}>
                    <g className="map-counter">
                      <g className="map-rise" style={rise(index)}>
                        {item.kind === "mountain" ? (
                          <Mountain elevation={item.elevation} size={k >= TOWN_ZOOM ? 1 : 0.6} variant={item.id % 3} />
                        ) : item.kind === "trees" ? (
                          <Forest seed={item.id} />
                        ) : (
                          <Hill variant={item.id % 3} />
                        )}
                      </g>
                    </g>
                  </g>
                ))}
                {shownLandmarks.map(({ id, name, x, y, lifted, Art }) => (
                  <g key={id} transform={`translate(${x} ${y})`}>
                    <g className="map-counter">
                      <g transform={lifted ? "translate(0 -24)" : undefined}>
                        <g className="map-rise">
                          <title>{name}</title>
                          <Art />
                        </g>
                      </g>
                    </g>
                  </g>
                ))}
              </g>

              {placePoints.map(({ place, x, y }) => {
                const isTown = k >= TOWN_ZOOM;
                return (
                  <g
                    key={place.id}
                    data-place={place.name}
                    transform={`translate(${x} ${y})`}
                    className="cursor-pointer"
                    onPointerEnter={() => showPlace(place)}
                    onPointerLeave={scheduleClose}
                    onClick={(event) => {
                      event.stopPropagation();
                      focusPlace(place);
                    }}
                  >
                    <g className="map-counter">
                      <circle r={isTown ? 16 : 10} className="fill-transparent" />
                      {isTown ? (
                        <g className="map-rise">
                          {selected?.id === place.id && <ellipse cx={0} cy={1} rx={18} ry={5} fill="none" className="stroke-[#3b2f25]" strokeWidth={1.2} strokeDasharray="2 2" />}
                          <Town size={place.photos.length >= 3 ? "large" : "small"} seed={Number(place.id.replace("place-", ""))} />
                          {labelledTowns.has(place.id) && (
                            <text
                              y={18}
                              textAnchor="middle"
                              className="gm-label pointer-events-none font-serif text-[12px] font-medium [paint-order:stroke]"
                              strokeWidth={3.5}
                            >
                              {place.name}
                            </text>
                          )}
                        </g>
                      ) : (
                        <circle r={selected?.id === place.id ? 5 : 4} className="fill-[#c45a40] stroke-[#fbf6e8]" strokeWidth={1.5} />
                      )}
                    </g>
                  </g>
                );
              })}
            </g>
          </g>
        </svg>

        <div className="absolute right-3 top-3 flex flex-col overflow-hidden rounded-lg border border-border bg-background/90 shadow-sm backdrop-blur">
          <button type="button" aria-label="Zoom in" onClick={() => zoomBy(2)} className="grid size-9 place-items-center hover:bg-muted">
            <Plus className="size-4" />
          </button>
          <button type="button" aria-label="Zoom out" onClick={() => zoomBy(0.5)} className="grid size-9 place-items-center border-t border-border hover:bg-muted">
            <Minus className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              setSelected(null);
              zoomTo([[0, 0], [MAP_WIDTH, MAP_HEIGHT]], 1);
            }}
            className="border-t border-border px-2 py-2 font-mono text-[10px] uppercase tracking-[0.12em] hover:bg-muted"
          >
            World
          </button>
        </div>

        <AnimatePresence>
          {hint && (
            <motion.p
              className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-foreground px-4 py-2 text-sm text-background shadow-lg"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: EASE_OUT }}
            >
              Pinch, or hold ⌘/Ctrl and scroll, to zoom the map
            </motion.p>
          )}
        </AnimatePresence>

        <div onPointerEnter={keepOpen} onPointerLeave={scheduleClose}>
          <AnimatePresence>
            {bloom && width > 0 && (() => {
              const { x, y } = Array.isArray(bloom.anchor) ? toScreen(bloom.anchor) : bloom.anchor;
              return (
                <motion.div key={bloom.key} className="absolute" style={{ left: x, top: y }} exit={{ opacity: 1 }}>
                  <PhotoBloom
                    photos={bloom.photos}
                    caption={bloom.caption}
                    direction={y < 180 ? "down" : "up"}
                    onOpen={(photo) => lightbox.open(bloom.photos, photo)}
                  />
                </motion.div>
              );
            })()}
          </AnimatePresence>
        </div>
      </div>
      <PlaceStrip place={selected} onOpen={(photo) => selected && lightbox.open(selected.photos, photo)} />
      {lightbox.element}
    </div>
  );
}
