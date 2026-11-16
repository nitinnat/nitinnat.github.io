"use client";

import { useEffect, useId, useMemo, useRef, useState, type PointerEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { geoArea, geoCentroid, geoContains, geoDistance } from "d3-geo";
import { select } from "d3-selection";
import "d3-transition";
import { easeCubicInOut } from "d3-ease";
import { zoom, zoomIdentity, type ZoomBehavior, type ZoomTransform } from "d3-zoom";
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
  projection,
  usePhotoLightbox,
  useClimate,
  useHydrology,
  useMapFeatures,
  useTerrainBands,
  useWorldShapes,
  type ClimateGroup,
} from "./map-shared";
import { Acacia, Cactus, Cerrado, Dunes, Eucalypt, Hump, Massif, Mesa, Tufts, selectSpaced, usePeaks } from "./terrain";
import { CityModel, cityTier, type CityTier } from "./cities";
import {
  Brackets,
  Bridge,
  CloudFrame,
  HeaderPlate,
  InfoPanel,
  LandmarkPlate,
  MapControls,
  MapPatterns,
  NamePlate,
  Player,
  RouteBadge,
  regionName,
  screenPatterns,
} from "./galar";
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
type Box = { x0: number; x1: number; y0: number; y1: number };

const EARTH_KM = 6371;
// Photos are only suggested when this close to the point under the cursor.
const NEARBY_KM = 100;
const MAX_ZOOM = 48;
const TOWN_ZOOM = 2;
const ROUTE_ZOOM = 1.5;
const MAX_ROAD_KM = 1500;
// Towns closer than this on screen merge into one stop.
const CLUSTER_PX = 34;
// Symbols never shrink below this many screen pixels per unit, so phones still get legible art.
const MIN_SYMBOL_PX = 0.7;
// Islands smaller than ~15,000 km² carry no relief or ground symbols.
const MIN_ISLAND_SR = 15000 / EARTH_KM ** 2;
// Hit-test bitmap pixels per map unit.
const HIT_RES = 2;
const SOUTHERN_LIMIT_Y = project({ lat: -56, lng: 0 })[1];

// Plaza footprints of the city models, for the cursor, labels and collisions.
const TOWN_SIZE: Record<CityTier, { w: number; h: number }> = { spot: { w: 30, h: 28 }, town: { w: 44, h: 36 }, city: { w: 60, h: 46 } };

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const overlaps = (a: Box, b: Box) => a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;

// Permanent snow starts around 5,000 m in the tropics and falls to ~2,000 m near the Arctic. Dry
// surroundings lift it by up to 2,000 m below 35° (to ~6,000 m over the Atacama), fading out by 45°.
// Cold, dry plateau surroundings (Tibet, the Puna) lift it up to 1,500 m more, so only peaks well
// above the plateau keep snow. Sampled peak elevations average ~10 km of terrain and read 15–25% low.
const isSnowy = (lat: number, elevation: number, aridity: number, surrounding: number) => {
  const dry = clamp01((aridity - 0.25) / 0.4);
  const dryLift = 2000 * dry * clamp01((45 - Math.abs(lat)) / 10) + 1500 * dry * clamp01((surrounding - 2500) / 1000);
  return elevation * 1.15 >= 5000 - 60 * Math.max(0, Math.abs(lat) - 15) + dryLift;
};

// Tundra on a high plateau is cold desert, unless the summit rises well above the plateau and
// catches the moisture itself (the Himalayan crest, not the Tibetan interior).
const coldIsDry = ({ elevation, surrounding }: { elevation: number; surrounding: number }) =>
  clamp01((surrounding - 3000) / 1000) * clamp01((1500 - (elevation - surrounding)) / 1000);

type GroundKind = "dunes" | "cactus" | "steppe" | "hump" | "acacia" | "cerrado" | "eucalypt" | "tufts";

// What dots open ground in each climate, and on what share of it (the rest stays bare). Forest
// climates are mostly covered by the forest blobs; their open meadows get the odd hump.
const GROUND: Record<ClimateGroup, { kind: GroundKind; share: number } | null> = {
  D: { kind: "dunes", share: 0.75 },
  S: { kind: "steppe", share: 0.2 },
  P: { kind: "hump", share: 0.14 },
  V: { kind: "acacia", share: 0.95 },
  T: { kind: "hump", share: 0.08 },
  M: { kind: "hump", share: 0.1 },
  B: { kind: "hump", share: 0.06 },
  N: { kind: "tufts", share: 0.35 },
  I: null,
};

// Savanna trees by continent: cerrado shrubs in the Americas, eucalypts in Australia and New Guinea,
// acacias in Africa, Madagascar and South Asia. Cacti only grow wild in the Americas.
const savannaAt = (lng: number, lat: number): GroundKind => (lng < -30 ? "cerrado" : lng > 110 && lat < -5 ? "eucalypt" : "acacia");

function Ground({ kind, seed }: { kind: GroundKind; seed: number }) {
  switch (kind) {
    case "dunes":
      return <Dunes seed={seed} />;
    case "cactus":
      return <Cactus />;
    case "steppe":
      return <Hump size={18} dry />;
    case "hump":
      return <Hump size={16 + (seed % 3) * 3} dry={false} />;
    case "acacia":
      return <Acacia seed={seed} />;
    case "cerrado":
      return <Cerrado seed={seed} />;
    case "eucalypt":
      return <Eucalypt seed={seed} />;
    case "tufts":
      return <Tufts seed={seed} />;
  }
}

// Deterministic jitter so the scattered terrain stays put between renders.
const jitter = (a: number, b: number) => {
  const n = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453;
  return n - Math.floor(n);
};

const lengthOf = (points: [number, number][]) => points.slice(1).reduce((sum, [x, y], i) => sum + Math.hypot(x - points[i][0], y - points[i][1]), 0);

function pointAt(points: [number, number][], fraction: number): [number, number] {
  let remaining = lengthOf(points) * fraction;
  for (let i = 1; i < points.length; i += 1) {
    const [[x0, y0], [x1, y1]] = [points[i - 1], points[i]];
    const length = Math.hypot(x1 - x0, y1 - y0);
    if (remaining <= length) return [x0 + ((x1 - x0) * remaining) / length, y0 + ((y1 - y0) * remaining) / length];
    remaining -= length;
  }
  return points[points.length - 1];
}

function crossing([ax, ay]: [number, number], [bx, by]: [number, number], [cx, cy]: [number, number], [dx, dy]: [number, number]) {
  const denominator = (bx - ax) * (dy - cy) - (by - ay) * (dx - cx);
  if (denominator === 0) return null;
  const t = ((cx - ax) * (dy - cy) - (cy - ay) * (dx - cx)) / denominator;
  const u = ((cx - ax) * (by - ay) - (cy - ay) * (bx - ax)) / denominator;
  return t > 0 && t < 1 && u >= 0 && u <= 1 ? { x: ax + t * (bx - ax), y: ay + t * (by - ay) } : null;
}

// A town or a cluster of nearby towns, merged into one place.
interface Stop extends Point {
  place: Place;
  members: Place[];
  tier: CityTier;
}

export function AtlasMap({ places, initialFocus = null }: { places: Place[]; initialFocus?: Place | null }) {
  const shapes = useWorldShapes();
  const peaks = usePeaks();
  const bands = useTerrainBands();
  const water = useHydrology();
  const climate = useClimate();
  const features = useMapFeatures();
  const clipId = useId();
  const lightbox = usePhotoLightbox();

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const worldRef = useRef<SVGGElement>(null);
  const symbolsRef = useRef<SVGGElement>(null);
  const zoomRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const pixelRef = useRef(1);
  const symbolRef = useRef(1);
  const hintTimer = useRef<number | undefined>(undefined);
  const closeTimer = useRef<number | undefined>(undefined);

  // The live transform is written to the DOM while zooming; React only sees it once at rest.
  const [settled, setSettled] = useState<ZoomTransform>(zoomIdentity);
  const [width, setWidth] = useState(0);
  const [selected, setSelected] = useState<Place | null>(initialFocus);
  const [hovered, setHovered] = useState<Place | null>(null);
  const [highlighted, setHighlighted] = useState<Region | null>(null);
  const [bloom, setBloom] = useState<Bloom | null>(null);
  const [hint, setHint] = useState(false);

  const zoomTo = ([[x0, y0], [x1, y1]]: Bounds, maxZoom: number) => {
    const k = Math.max(1, Math.min(maxZoom, 0.8 / Math.max((x1 - x0) / MAP_WIDTH, (y1 - y0) / MAP_HEIGHT, 1e-6)));
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
        symbolsRef.current!.style.setProperty("--k", String(transform.k / symbolRef.current));
        screenPatterns(svgRef.current!, 1 / (transform.k * pixelRef.current));
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

    const observer = new ResizeObserver(([entry]) => {
      pixelRef.current = entry.contentRect.width / MAP_WIDTH;
      symbolRef.current = Math.max(1, (MIN_SYMBOL_PX * MAP_WIDTH) / entry.contentRect.width);
      setWidth(entry.contentRect.width);
    });
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
  const pixel = width / MAP_WIDTH || 1;
  // How much larger symbols are drawn than the map's own scale would make them (1 on wide screens).
  const symbol = Math.max(1, MIN_SYMBOL_PX / pixel);
  useEffect(() => {
    symbolsRef.current?.style.setProperty("--k", String(k / symbol));
  }, [k, symbol]);
  const view = { x0: settled.invertX(0), y0: settled.invertY(0), x1: settled.invertX(MAP_WIDTH), y1: settled.invertY(MAP_HEIGHT) };
  const inView = ({ x, y }: Point, margin = 0) =>
    x >= view.x0 - margin && x <= view.x1 + margin && y >= view.y0 - margin && y <= view.y1 + margin;
  const toScreen = ([x, y]: [number, number]) => ({ x: settled.applyX(x) * pixel, y: settled.applyY(y) * pixel });

  // Coastlines only: the land outline has no internal borders.
  const coastline = useMemo(() => shapes?.land.map((l) => pathFor(l)).join(" ") ?? "", [shapes]);
  // Countries (the US as states) as invisible hover and click targets, projected once.
  const regions = useMemo(
    () =>
      shapes
        ? [...shapes.countries.filter((c) => c.properties.name !== "United States of America"), ...shapes.states].map((feature) => ({ feature, d: pathFor(feature) ?? "" }))
        : [],
    [shapes],
  );

  // Hit-testing against land big enough for relief (no peaks on specks or in the sea), the forest
  // blobs and the highland patches, rasterized once into the channels of one bitmap so each lookup is
  // a pixel read rather than a path test.
  const hitTest = useMemo(() => {
    if (!shapes || !features) return null;
    const [width, height] = [MAP_WIDTH * HIT_RES, MAP_HEIGHT * HIT_RES];
    const canvas = Object.assign(document.createElement("canvas"), { width, height });
    const context = canvas.getContext("2d", { willReadFrequently: true })!;
    context.scale(HIT_RES, HIT_RES);
    context.globalCompositeOperation = "lighter";
    const mainland = shapes.land
      .flatMap(({ geometry }) => (geometry.type === "MultiPolygon" ? geometry.coordinates : geometry.type === "Polygon" ? [geometry.coordinates] : []))
      .filter((coordinates) => {
        const area = geoArea({ type: "Polygon", coordinates });
        return Math.min(area, 4 * Math.PI - area) >= MIN_ISLAND_SR;
      })
      .map((coordinates) => pathFor({ type: "Polygon", coordinates }) ?? "")
      .join("");
    [
      { d: mainland, color: "#f00" },
      { d: features.forests.map(({ d }) => d).join(""), color: "#0f0" },
      { d: features.highlands.map(({ d }) => d).join(""), color: "#00f" },
    ].forEach(({ d, color }) => {
      context.fillStyle = color;
      context.fill(new Path2D(d), "evenodd");
    });
    const pixels = context.getImageData(0, 0, width, height).data;
    const at = (channel: number) => ({ x, y }: Point) =>
      x >= 0 && x < MAP_WIDTH && y >= 0 && y < MAP_HEIGHT && pixels[(Math.floor(y * HIT_RES) * width + Math.floor(x * HIT_RES)) * 4 + channel] > 127;
    return { land: at(0), forest: at(1), highland: at(2) };
  }, [shapes, features]);

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
  const visitOf = useMemo(() => new Map(places.map((place, i) => [place.id, i + 1])), [places]);
  const latest = useMemo(
    () => places.reduce<Place | null>((a, b) => (!a || (b.end ?? b.start ?? "") >= (a.end ?? a.start ?? "") ? b : a), null),
    [places],
  );

  // Routes link nearby towns like a game map: the shortest connections that join separate groups
  // of towns (a minimum spanning tree), skipping anything too far to drive. They're numbered in visit
  // order and drawn as metro-style lines, bending on whichever side keeps the elbow on land. Trips
  // between the groups become dashed flight arcs, bowed northwards on the flat map.
  const { routes, hops } = useMemo(() => {
    const edges = places.flatMap((a, i) =>
      places.slice(i + 1).map((b, offset) => ({ a: i, b: i + 1 + offset, km: geoDistance([a.lng, a.lat], [b.lng, b.lat]) * EARTH_KM })),
    );
    const group = places.map((_, i) => i);
    const root = (i: number): number => (group[i] === i ? i : (group[i] = root(group[i])));
    const tree = edges
      .filter((edge) => edge.km <= MAX_ROAD_KM)
      .sort((x, y) => x.km - y.km)
      .filter(({ a, b }) => {
        if (root(a) === root(b)) return false;
        group[root(a)] = root(b);
        return true;
      })
      .sort((x, y) => x.a - y.a || x.b - y.b);
    const routes = tree.map(({ a, b }, index) => {
      const [x1, y1] = project(places[a]);
      const [x2, y2] = project(places[b]);
      const diagonal = Math.min(Math.abs(x2 - x1), Math.abs(y2 - y1));
      const [sx, sy] = [Math.sign(x2 - x1), Math.sign(y2 - y1)];
      const straight: [number, number] = Math.abs(x2 - x1) > Math.abs(y2 - y1) ? [x2 - diagonal * sx, y1] : [x1, y2 - diagonal * sy];
      const elbows: [number, number][] = [straight, [x1 + diagonal * sx, y1 + diagonal * sy]];
      const elbow = elbows.find(([x, y]) => hitTest?.land({ x, y })) ?? elbows[0];
      const points: [number, number][] = [[x1, y1], elbow, [x2, y2]];
      return {
        id: `${places[a].id}-${places[b].id}`,
        n: index + 1,
        ends: [places[a].id, places[b].id],
        points,
        d: `M${points.map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`).join("L")}`,
        mid: pointAt(points, 0.5),
      };
    });
    const seen = new Set<string>();
    const hops = places.slice(1).flatMap((b, i) => {
      const a = places[i];
      const key = [root(i), root(i + 1)].sort().join("-");
      if (root(i) === root(i + 1) || seen.has(key)) return [];
      seen.add(key);
      const [[x1, y1], [x2, y2]] = [project(a), project(b)];
      const bow = Math.sign(x2 - x1 || 1) * 0.2;
      return [{ id: key, d: `M${x1} ${y1} Q${(x1 + x2) / 2 + (y2 - y1) * bow} ${(y1 + y2) / 2 - (x2 - x1) * bow} ${x2} ${y2}` }];
    });
    return { routes, hops };
  }, [places, hitTest]);

  const bridges = useMemo(
    () =>
      routes.flatMap(({ id, points }) =>
        points.slice(1).flatMap((end, i) => {
          const start = points[i];
          const angle = (Math.atan2(end[1] - start[1], end[0] - start[0]) * 180) / Math.PI;
          return water.rivers.flatMap(({ lines }) =>
            lines.flatMap((line) =>
              line.slice(1).flatMap((point, j) => {
                const hit = crossing(start, end, line[j], point);
                return hit ? [{ id: `${id}-${hit.x.toFixed(2)}`, ...hit, angle }] : [];
              }),
            ),
          );
        }),
      ),
    [routes, water],
  );

  // Relief and hills, classified by Köppen climate once rather than on every zoom.
  const climateAware = useMemo(() => {
    if (!climate || !features || !hitTest) return { mountains: [], hills: [] };
    return {
      mountains: features.peaks
        .filter((peak) => peak.y < SOUTHERN_LIMIT_Y && hitTest.land(peak))
        .map((peak) => {
          const group = climate.climateAt(peak.lng, peak.lat);
          const snowy = group === "I" || (group !== "D" && isSnowy(peak.lat, peak.elevation, climate.aridityAt(peak.lng, peak.lat, coldIsDry(peak)), peak.surrounding));
          return { ...peak, arid: group === "D", snowy };
        }),
      hills: peaks
        .filter((peak) => peak.elevation < 2500 && peak.y < SOUTHERN_LIMIT_Y && hitTest.land(peak) && !hitTest.forest(peak))
        .flatMap((peak) => {
          const group = climate.climateAt(...(projection.invert?.([peak.x, peak.y]) ?? [0, 0]));
          return group === "D" || group === "I" ? [] : [{ ...peak, dry: group === "S" || group === "P" }];
        }),
    };
  }, [climate, features, hitTest, peaks]);

  // Nearby towns merge into one stop, busiest first, so the world view isn't a pile of models.
  const stops = useMemo(() => {
    const radius = (CLUSTER_PX * symbol) / (k * pixel);
    const groups: { x: number; y: number; members: Place[] }[] = [];
    [...placePoints]
      .sort((a, b) => b.place.photos.length - a.place.photos.length)
      .forEach(({ place, x, y }) => {
        const near = groups.find((g) => Math.hypot(g.x - x, g.y - y) < radius);
        if (near) near.members.push(place);
        else groups.push({ x, y, members: [place] });
      });
    return groups.map(({ x, y, members }): Stop => {
      const dates = members.flatMap((m) => [m.start, m.end]).filter((d) => d !== null).sort();
      const place = members.length === 1 ? members[0] : { ...members[0], start: dates[0] ?? null, end: dates[dates.length - 1] ?? null, photos: members.flatMap((m) => m.photos) };
      return { x, y, place, members, tier: cityTier(place.photos.length) };
    });
  }, [placePoints, k, pixel, symbol]);
  const stopOf = (place: Place | null) => place && stops.find((stop) => stop.members.some((m) => m.id === place.id));

  // Terrain keeps a constant on-screen spacing within a per-view budget, so more appears as you zoom
  // in but open ground always remains. At world view each highland shows at most a few massifs for its
  // size, so long ranges don't become columns of cones.
  const terrain = useMemo(() => {
    const scale = (k * pixel) / symbol;
    const spacing = (px: number) => px / scale;
    const bounds = { x0: settled.invertX(0), y0: settled.invertY(0), x1: settled.invertX(MAP_WIDTH), y1: settled.invertY(MAP_HEIGHT) };
    const close = k >= TOWN_ZOOM;
    const occupied = [...landmarkPoints.filter((l) => k >= l.minZoom), ...stops];
    const shown = new Map<number, number>();
    const mountains = selectSpaced(climateAware.mountains, bounds, spacing(close ? 52 : 46), [], close ? 32 : 36).filter(({ patch }) => {
      if (close || patch < 0 || !features) return true;
      const count = shown.get(patch) ?? 0;
      if (count >= Math.max(1, Math.round((features.highlands[patch].area * scale * scale) / 5000))) return false;
      shown.set(patch, count + 1);
      return true;
    });
    const hills = selectSpaced(climateAware.hills, bounds, spacing(46), [...occupied, ...mountains], close ? 24 : 12);
    // Ground spots sit on a jittered grid at a fixed on-screen pitch over the view, so open ground
    // gets detail at every zoom; Köppen climate picks what grows on each.
    const step = spacing(close ? 26 : 30);
    const spots: (Point & { id: number; kind: GroundKind | null })[] = [];
    for (let gy = Math.floor(bounds.y0 / step); gy * step < Math.min(bounds.y1, SOUTHERN_LIMIT_Y); gy += 1) {
      for (let gx = Math.floor(bounds.x0 / step); gx * step < bounds.x1; gx += 1) {
        const spot = { x: (gx + jitter(gx, gy) * 0.8) * step, y: (gy + jitter(gy, gx) * 0.8) * step };
        if (!climate || !hitTest || !hitTest.land(spot) || hitTest.forest(spot) || hitTest.highland(spot)) continue;
        const [lng, lat] = projection.invert?.([spot.x, spot.y]) ?? [0, 0];
        const group = climate.climateAt(lng, lat) ?? "I";
        const growth = GROUND[group];
        const roll = jitter(gy * 3, gx);
        const kind = !growth || roll >= growth.share ? null : group === "V" ? savannaAt(lng, lat) : group === "D" && lng < -30 && roll < 0.25 ? "cactus" : growth.kind;
        spots.push({ ...spot, id: Math.abs((gx * 73856093) ^ (gy * 19349663)), kind });
      }
    }
    spots.sort((a, b) => jitter(a.x, a.y) - jitter(b.x, b.y));
    const ground = selectSpaced(spots, bounds, spacing(close ? 26 : 30), [...occupied, ...mountains, ...hills], close ? 90 : 45, (spot) => spot.kind !== null);
    return [
      ...mountains.map((peak) => ({ ...peak, kind: "mountain" as const })),
      ...hills.map((peak) => ({ ...peak, kind: "hill" as const })),
      ...ground.flatMap(({ kind, ...spot }) => (kind ? [{ ...spot, kind }] : [])),
    ].sort((a, b) => a.y - b.y);
  }, [climate, climateAware, hitTest, landmarkPoints, stops, features, settled, k, pixel, symbol]);

  // Name plates, landmark plates and route badges are culled where they would overlap a busier town
  // or each other. A landmark right on top of a town is lifted to sit just above it.
  const { labelled, badges, shownLandmarks } = useMemo(() => {
    const toScreen = ([x, y]: [number, number]) => ({ x: settled.applyX(x) * pixel, y: settled.applyY(y) * pixel });
    const boxes: Box[] = stops.map(({ x, y, tier }) => {
      const s = toScreen([x, y]);
      const [w, h] = [TOWN_SIZE[tier].w * symbol, TOWN_SIZE[tier].h * symbol];
      return { x0: s.x - w / 2, x1: s.x + w / 2, y0: s.y - h, y1: s.y + 6 * symbol };
    });
    const labelled = new Set<string>();
    [...stops]
      .sort((a, b) => b.place.photos.length - a.place.photos.length)
      .forEach(({ x, y, place }) => {
        const s = toScreen([x, y]);
        const half = ((place.name.length * 6.3 + 16) * symbol) / 2;
        const box = { x0: s.x - half, x1: s.x + half, y0: s.y + 6 * symbol, y1: s.y + 24 * symbol };
        if (boxes.some((b) => overlaps(box, b))) return;
        boxes.push(box);
        labelled.add(place.id);
      });
    const shownLandmarks = landmarkPoints
      .map((l) => ({ ...l, s: toScreen([l.x, l.y]) }))
      .filter(({ minZoom, s }) => k >= minZoom && s.x > -30 && s.x < MAP_WIDTH * pixel + 30 && s.y > -30 && s.y < MAP_HEIGHT * pixel + 30)
      .map(({ s, ...l }) => {
        const lifted = stops.some((stop) => Math.hypot(stop.x - l.x, stop.y - l.y) * k * pixel < 40 * symbol);
        const top = s.y + ((lifted ? -30 : 0) + 5) * symbol;
        const half = ((l.name.length * 5.4 + 20) * symbol) / 2;
        const box = { x0: s.x - half, x1: s.x + half, y0: top, y1: top + 17 * symbol };
        const plated = !boxes.some((b) => overlaps(box, b));
        if (plated) boxes.push(box);
        return { ...l, lifted, plated };
      });
    const badges = new Set<number>();
    if (k >= ROUTE_ZOOM) {
      routes.forEach(({ n, mid }) => {
        const s = toScreen(mid);
        const r = 11 * symbol;
        const box = { x0: s.x - r, x1: s.x + r, y0: s.y - r, y1: s.y + r };
        if (boxes.some((b) => overlaps(box, b))) return;
        boxes.push(box);
        badges.add(n);
      });
    }
    return { labelled, badges, shownLandmarks };
  }, [stops, routes, landmarkPoints, settled, k, pixel, symbol]);

  const keepOpen = () => window.clearTimeout(closeTimer.current);
  const scheduleClose = () => {
    keepOpen();
    closeTimer.current = window.setTimeout(() => {
      setBloom(null);
      setHighlighted(null);
      setHovered(null);
    }, 220);
  };
  const placesIn = (region: Region) => places.filter((p) => geoContains(region, [p.lng, p.lat]));
  const largest = (list: Place[]) => list.reduce((a, b) => (b.photos.length > a.photos.length ? b : a));

  const showStop = ({ place, x, y }: Stop) => {
    keepOpen();
    setHighlighted(null);
    setHovered(place);
    setBloom({ key: place.id, anchor: [x, y], photos: place.photos, caption: `${place.name} · ${placeDates(place)}` });
  };

  const showRegion = (region: Region, event: PointerEvent) => {
    keepOpen();
    setHighlighted(region);
    const inside = placesIn(region);
    if (inside.length > 0) {
      const photos = inside.flatMap((p) => p.photos);
      setBloom({ key: region.properties.name, anchor: project(largest(inside)), photos, caption: `${region.properties.name} · ${photos.length} photos` });
      return;
    }
    const box = containerRef.current!.getBoundingClientRect();
    const [mapX, mapY] = settled.invert([(event.clientX - box.left) / pixel, (event.clientY - box.top) / pixel]);
    const cursor = projection.invert?.([mapX, mapY]) ?? geoCentroid(region);
    const nearest = places.reduce((a, b) => (geoDistance(cursor, [b.lng, b.lat]) < geoDistance(cursor, [a.lng, a.lat]) ? b : a));
    const km = Math.round(geoDistance(cursor, [nearest.lng, nearest.lat]) * EARTH_KM);
    setBloom(
      km <= NEARBY_KM
        ? {
            key: region.properties.name,
            anchor: { x: event.clientX - box.left, y: event.clientY - box.top },
            photos: nearest.photos.slice(0, 3),
            caption: `Nearest: ${nearest.name} · ${km.toLocaleString()} km`,
          }
        : null,
    );
  };

  const focusStop = ({ place, members }: Stop) => {
    setSelected(place);
    setBloom(null);
    const points = members.map(project);
    const xs = points.map(([x]) => x);
    const ys = points.map(([, y]) => y);
    zoomTo([[Math.min(...xs), Math.min(...ys)], [Math.max(...xs), Math.max(...ys)]], 10);
  };

  const focusRegion = (region: Region) => {
    const inside = placesIn(region);
    if (inside.length > 0) setSelected(largest(inside));
    setBloom(null);
    zoomTo(pathFor.bounds(region), 14);
  };

  const showHint = () => {
    setHint(true);
    window.clearTimeout(hintTimer.current);
    hintTimer.current = window.setTimeout(() => setHint(false), 1600);
  };

  if (!shapes) return <div className="aspect-[960/500] w-full animate-pulse rounded-xl bg-muted/40" />;

  const regionPath = ({ feature, d }: { feature: Region; d: string }) => (
    <path
      key={`${feature.id ?? ""}${feature.properties.name}`}
      data-region={feature.properties.name}
      d={d}
      className="cursor-pointer fill-transparent"
      onPointerEnter={(event) => showRegion(feature, event)}
      onPointerLeave={scheduleClose}
      onClick={() => focusRegion(feature)}
    />
  );

  const rise = (index: number) => ({ animationDelay: `${Math.min(index * 10, 280)}ms` });
  const panel = hovered ?? selected;
  const panelStop = stopOf(panel);
  const selectedStop = stopOf(selected);
  const playerStop = stopOf(latest);
  const visible = placePoints.filter((p) => inView(p));
  const [centreLng, centreLat] = projection.invert?.(settled.invert([MAP_WIDTH / 2, MAP_HEIGHT / 2])) ?? [0, 0];

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">
          {places.length} places · pinch or ⌘/Ctrl + scroll to zoom · drag to pan
        </p>
      </div>
      <div
        ref={containerRef}
        className="relative w-full overflow-hidden rounded-xl border-[3px] border-[#2b3250]"
        onWheel={(event) => {
          if (!event.ctrlKey && !event.metaKey) showHint();
        }}
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
          className="gm-sea block h-auto w-full cursor-grab font-[family-name:var(--font-map)] active:cursor-grabbing"
          role="img"
          aria-label="Illustrated world map of photo locations"
        >
          <MapPatterns scale={1 / (k * pixel)} />
          <g ref={worldRef}>
            <rect width={MAP_WIDTH} height={MAP_HEIGHT} fill="url(#gm-waves)" className="pointer-events-none" />
            {/* A dark teal ring offshore, then open water, then a pale shallow band along the coast. */}
            <g className="pointer-events-none" fill="none" strokeLinejoin="round">
              <path d={coastline} className="gm-sea-ring" strokeWidth={24} vectorEffect="non-scaling-stroke" />
              <path d={coastline} className="gm-sea-stroke" strokeWidth={19} vectorEffect="non-scaling-stroke" />
              <path d={coastline} className="gm-shallows" strokeWidth={9} vectorEffect="non-scaling-stroke" />
            </g>
            {/* The land sits on an earthy edge, like a raised diorama. */}
            <path d={coastline} transform={`translate(0 ${3 / (k * pixel)})`} className="gm-cliff pointer-events-none" fillRule="evenodd" />
            <path d={coastline} className="gm-land pointer-events-none" fillRule="evenodd" />
            <g className="pointer-events-none" clipPath={`url(#${clipId})`} aria-hidden="true">
              <clipPath id={clipId}>
                <path d={coastline} />
              </clipPath>
              {bands.slice(1, 3).map(({ level, d }, index) => (
                <path key={level} d={d} fillRule="evenodd" className={`gm-band-${index + 1}`} />
              ))}
              {climate?.tints
                .filter(({ level }) => level === 1)
                .map(({ group, d }) => (
                  <path key={group} d={d} fillRule="evenodd" className={`gm-climate-${group}`} strokeWidth={2} vectorEffect="non-scaling-stroke" />
                ))}
              {features?.highlands.map(({ d, dry }, index) => (
                <path key={index} d={d} fillRule="evenodd" className={dry ? "gm-highland-dry" : "gm-highland"} strokeWidth={2} vectorEffect="non-scaling-stroke" />
              ))}
              {features?.forests.map(({ biome, d }) => (
                <g key={biome}>
                  <path d={d} fillRule="evenodd" className={`gm-forest gm-forest-${biome}`} strokeWidth={2} vectorEffect="non-scaling-stroke" />
                  <path d={d} fillRule="evenodd" fill={`url(#gm-${biome})`} />
                </g>
              ))}
            </g>
            <g className="pointer-events-none" aria-hidden="true">
              {water.rivers
                .filter((river) => river.rank <= (k >= TOWN_ZOOM ? 5 : 3))
                .map(({ rank, d }, index) => (
                  <g key={index}>
                    <path d={d} fill="none" className="gm-river-edge" strokeWidth={rank <= 2 ? 5 : rank <= 4 ? 4 : 3} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                    <path d={d} fill="none" className="gm-river" strokeWidth={rank <= 2 ? 3 : rank <= 4 ? 2.2 : 1.4} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                  </g>
                ))}
              <path d={water.lakes} fillRule="evenodd" className="gm-lake" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
            </g>
            <path d={coastline} fill="none" className="gm-foam pointer-events-none" strokeWidth={1.6} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />

            {/* Invisible hit areas; only the hovered region is outlined, above the climate tints. */}
            <g>
              {regions.map(regionPath)}
            </g>
            {highlighted && (
              <path d={regions.find(({ feature }) => feature === highlighted)?.d} className="gm-region-hover pointer-events-none" strokeWidth={1.6} strokeDasharray="5 4" vectorEffect="non-scaling-stroke" />
            )}

            <g className="pointer-events-none" fill="none" strokeLinecap="round" aria-hidden="true">
              {k < TOWN_ZOOM && hops.map(({ id, d }) => (
                <g key={id}>
                  <path d={d} className="gm-hop-halo" strokeWidth={5} vectorEffect="non-scaling-stroke" />
                  <path d={d} className="gm-route" strokeWidth={2.6} strokeDasharray="1.5 6" vectorEffect="non-scaling-stroke" />
                </g>
              ))}
              {k >= ROUTE_ZOOM &&
                routes.map(({ id, d }) => (
                  <g key={id} strokeLinejoin="round">
                    <path d={d} className="gm-route-edge" strokeWidth={8} vectorEffect="non-scaling-stroke" />
                    <path d={d} className="gm-route" strokeWidth={5} vectorEffect="non-scaling-stroke" />
                  </g>
                ))}
            </g>

            <g ref={symbolsRef}>
              <g className="pointer-events-none" aria-hidden="true">
                {terrain.map((item, index) => (
                  <g key={`${item.kind}-${item.id}`} transform={`translate(${item.x} ${item.y})`}>
                    <g className="map-counter">
                      <g className="map-rise" style={rise(index)}>
                        {item.kind === "mountain" ? (
                          item.arid ? (
                            <Mesa seed={item.id} scale={k >= TOWN_ZOOM ? 1 : 0.7} />
                          ) : (
                            <Massif elevation={item.elevation} scale={k >= TOWN_ZOOM ? 1 : 0.55} snowy={item.snowy} flip={item.id % 2 === 1} lone={item.patch < 0} />
                          )
                        ) : item.kind === "hill" ? (
                          <Hump size={(22 + (item.id % 3) * 4) * (k >= TOWN_ZOOM ? 1 : 0.7)} dry={item.dry} />
                        ) : (
                          <Ground kind={item.kind} seed={item.id} />
                        )}
                      </g>
                    </g>
                  </g>
                ))}
                {k >= TOWN_ZOOM &&
                  bridges.filter((b) => inView(b)).map(({ id, x, y, angle }) => (
                    <g key={id} transform={`translate(${x} ${y})`}>
                      <g className="map-counter">
                        <Bridge angle={angle} />
                      </g>
                    </g>
                  ))}
                {shownLandmarks.map(({ id, name, x, y, lifted, plated, Art }) => (
                  <g key={id} transform={`translate(${x} ${y})`}>
                    <g className="map-counter">
                      <g transform={lifted ? "translate(0 -30)" : undefined}>
                        <g className="map-rise">
                          <title>{name}</title>
                          <g transform="scale(1.3)">
                            <Art />
                          </g>
                          {plated && <LandmarkPlate name={name} y={13} />}
                        </g>
                      </g>
                    </g>
                  </g>
                ))}
                {routes
                  .filter(({ n }) => badges.has(n))
                  .map(({ n, mid: [x, y] }) => (
                    <g key={n} transform={`translate(${x} ${y})`}>
                      <g className="map-counter">
                        <RouteBadge n={n} />
                      </g>
                    </g>
                  ))}
              </g>

              {[...stops]
                .sort((a, b) => a.y - b.y)
                .map((stop) => (
                  <g
                    key={stop.place.id}
                    data-place={stop.place.name}
                    transform={`translate(${stop.x} ${stop.y})`}
                    className="cursor-pointer"
                    onPointerEnter={() => showStop(stop)}
                    onPointerLeave={scheduleClose}
                    onClick={(event) => {
                      event.stopPropagation();
                      focusStop(stop);
                    }}
                  >
                    <g className="map-counter">
                      <rect x={-TOWN_SIZE[stop.tier].w / 2} y={-TOWN_SIZE[stop.tier].h} width={TOWN_SIZE[stop.tier].w} height={TOWN_SIZE[stop.tier].h + 8} className="fill-transparent" />
                      <g className="map-rise">
                        <CityModel place={stop.place} tier={stop.tier} />
                        {stop.members.length > 1 && (
                          <g transform={`translate(${TOWN_SIZE[stop.tier].w / 2} ${-TOWN_SIZE[stop.tier].h + 4})`}>
                            <circle r={8} className="gm-count" strokeWidth={1.6} />
                            <text y={3.5} textAnchor="middle" className="gm-count-text text-[10px] font-black">
                              {stop.members.length}
                            </text>
                          </g>
                        )}
                        {labelled.has(stop.place.id) && <NamePlate name={stop.place.name} y={15} />}
                      </g>
                    </g>
                  </g>
                ))}

              {selectedStop && (
                <g transform={`translate(${selectedStop.x} ${selectedStop.y})`} className="pointer-events-none">
                  <g className="map-counter">
                    <g transform={`translate(0 ${-TOWN_SIZE[selectedStop.tier].h / 2 + 2})`}>
                      <Brackets w={TOWN_SIZE[selectedStop.tier].w + 14} h={TOWN_SIZE[selectedStop.tier].h + 12} />
                    </g>
                  </g>
                </g>
              )}
              {playerStop && (
                <g transform={`translate(${playerStop.x} ${playerStop.y})`} className="pointer-events-none" aria-hidden="true">
                  <g className="map-counter">
                    <g transform={`translate(${TOWN_SIZE[playerStop.tier].w / 2 + 14} ${-TOWN_SIZE[playerStop.tier].h - 6}) scale(0.62)`}>
                      <Player />
                    </g>
                  </g>
                </g>
              )}
            </g>
          </g>
        </svg>

        <div className="gm-grain pointer-events-none absolute inset-0 z-[4]" aria-hidden="true" />
        <CloudFrame width={width} height={(width * MAP_HEIGHT) / MAP_WIDTH} />
        <HeaderPlate
          title={regionName([centreLng, centreLat], k)}
          summary={`${visible.length} towns · ${routes.filter(({ mid: [x, y] }) => inView({ x, y })).length} routes · ${visible.reduce((sum, p) => sum + p.place.photos.length, 0)} photos`}
        />
        <MapControls
          onZoomIn={() => zoomBy(2)}
          onZoomOut={() => zoomBy(0.5)}
          onWorld={() => {
            setSelected(null);
            zoomTo([[0, 0], [MAP_WIDTH, MAP_HEIGHT]], 1);
          }}
        />
        {panel && (
          <div className="hidden sm:block" onPointerEnter={keepOpen} onPointerLeave={scheduleClose}>
            <InfoPanel
              place={panel}
              visit={panelStop && panelStop.members.length > 1 ? null : (visitOf.get(panel.id) ?? null)}
              routes={routes.filter(({ ends }) => (panelStop?.members ?? [panel]).some((m) => ends.includes(m.id))).map(({ n }) => n)}
              onOpen={() => lightbox.open(panel.photos, panel.photos[0])}
            />
          </div>
        )}

        <AnimatePresence>
          {hint && (
            <motion.p
              className="pointer-events-none absolute left-1/2 top-4 z-30 -translate-x-1/2 rounded-full bg-[#2b3250] px-4 py-2 font-[family-name:var(--font-map)] text-sm font-bold text-white shadow-lg"
              initial={{ opacity: 0, y: -6 }}
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
                <motion.div key={bloom.key} className="absolute z-30" style={{ left: x, top: y }} exit={{ opacity: 1 }}>
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
      <p className="mt-2 font-mono text-[10px] leading-relaxed tracking-[0.06em] text-muted-foreground/80">
        Terrain: AWS Terrain Tiles (SRTM, ETOPO1 and others) · Rivers, lakes &amp; coastlines: Natural Earth · Climate: Köppen–Geiger,{" "}
        <a
          href="https://doi.org/10.1127/0941-2948/2006/0130"
          target="_blank"
          rel="noopener noreferrer"
          title="Kottek, M., Grieser, J., Beck, C., Rudolf, B., and Rubel, F. (2006). World Map of the Köppen-Geiger climate classification updated. Meteorol. Z., 15, 259–263."
          className="underline decoration-dotted underline-offset-2 hover:text-foreground"
        >
          Kottek et al. (2006)
        </a>
      </p>
      <PlaceStrip place={selected} onOpen={(photo) => selected && lightbox.open(selected.photos, photo)} />
      {lightbox.element}
    </div>
  );
}
