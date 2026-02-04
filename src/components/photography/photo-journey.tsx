"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import type { PositionedCluster } from "@/lib/photo-positioning";
import { getCameraTarget, getCameraPosition } from "@/lib/photo-positioning";
import { ChevronDown, ChevronLeft } from "lucide-react";
import { PhotoLightbox } from "./photo-lightbox";
import type { Slide } from "yet-another-react-lightbox";

interface PhotoJourneyProps {
  clusters: PositionedCluster[];
}

interface CameraState {
  x: number;
  y: number;
  z: number;
}

interface TransformState {
  x: number;
  y: number;
  z: number;
  opacity: number;
  scale: number;
}

const SCROLL_SENSITIVITY = 0.001;
const MIN_CAMERA_Z = 2;
const MAX_CAMERA_Z = 15;
const ZOOM_IN_DISTANCE = 1.5;

function calculateTransform(
  clusterPos: { x: number; y: number; z: number },
  cameraPos: CameraState,
  viewportWidth: number,
  viewportHeight: number
): TransformState {
  // Calculate distance from camera to cluster
  const dx = clusterPos.x - cameraPos.x;
  const dy = clusterPos.y - cameraPos.y;
  const dz = clusterPos.z - cameraPos.z;
  const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

  // Perspective projection: closer objects are larger and offset more
  const perspective = Math.max(0.1, Math.min(1, (distance - 2) / 8));
  const perspectiveScale = 1 / (0.5 + distance / 10);

  // Calculate screen position
  const scale3d = (distance - MIN_CAMERA_Z) / (MAX_CAMERA_Z - MIN_CAMERA_Z);
  const scale = Math.max(0.3, 1 - scale3d * 0.7);

  // Position on screen
  const x = (dx / (distance + 1)) * (viewportWidth * 0.3);
  const y = (dy / (distance + 1)) * (viewportHeight * 0.3);

  // Opacity: fade out distant clusters
  const opacity = Math.max(0.2, 1 - scale3d * 0.8);

  return { x, y, z: distance, opacity, scale: scale * perspectiveScale };
}

export function PhotoJourney({ clusters }: PhotoJourneyProps) {
  const reduceMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [camera, setCamera] = useState<CameraState>({ x: 0, y: 0, z: 8 });
  const [zoomedClusterId, setZoomedClusterId] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState(-1);

  const cameraTarget = useMemo(() => getCameraTarget(clusters), [clusters]);
  const zoomedCluster = useMemo(
    () => clusters.find((c) => c.id === zoomedClusterId),
    [clusters, zoomedClusterId]
  );

  // Update viewport size on mount and resize
  useEffect(() => {
    if (!containerRef.current) return;

    const updateSize = () => {
      const width = containerRef.current?.clientWidth || 0;
      const height = containerRef.current?.clientHeight || 0;
      setViewportSize({ width, height });
      setIsMobile(width < 768); // md breakpoint
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // Handle scroll for camera movement (desktop)
  useEffect(() => {
    if (isMobile || reduceMotion) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      setScrollProgress((prev) => {
        const newProgress = Math.max(0, Math.min(1, prev + e.deltaY * SCROLL_SENSITIVITY));
        return newProgress;
      });
    };

    containerRef.current?.addEventListener("wheel", handleWheel, { passive: false });
    return () => containerRef.current?.removeEventListener("wheel", handleWheel);
  }, [isMobile, reduceMotion]);

  // Handle touch for mobile
  const touchStartX = useRef(0);
  useEffect(() => {
    if (!isMobile) return;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0]?.clientX || 0;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const touchEndX = e.changedTouches[0]?.clientX || 0;
      const diff = touchStartX.current - touchEndX;

      if (Math.abs(diff) > 50) {
        // Swipe threshold
        setScrollProgress((prev) => {
          const step = 1 / clusters.length;
          const newProgress = diff > 0 ? prev + step : prev - step;
          return Math.max(0, Math.min(1, newProgress));
        });
      }
    };

    containerRef.current?.addEventListener("touchstart", handleTouchStart);
    containerRef.current?.addEventListener("touchend", handleTouchEnd);

    return () => {
      containerRef.current?.removeEventListener("touchstart", handleTouchStart);
      containerRef.current?.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isMobile, clusters.length]);

  // Update camera position based on scroll progress or zoomed cluster
  useEffect(() => {
    if (clusters.length === 0) return;

    if (zoomedCluster) {
      // Camera rushed into the cluster
      setCamera({
        x: zoomedCluster.position.x,
        y: zoomedCluster.position.y,
        z: zoomedCluster.position.z + ZOOM_IN_DISTANCE,
      });
    } else {
      // Interpolate camera position: from top-down view to within clusters
      const minZ = MIN_CAMERA_Z;
      const maxZ = MAX_CAMERA_Z;
      const targetZ = maxZ - scrollProgress * (maxZ - minZ);

      setCamera({
        x: cameraTarget.x + Math.sin(scrollProgress * Math.PI * 2) * 0.5,
        y: cameraTarget.y + (1 - scrollProgress) * 3,
        z: Math.max(minZ, targetZ),
      });
    }
  }, [scrollProgress, cameraTarget, clusters.length, zoomedCluster]);

  if (clusters.length === 0) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gradient-to-b from-background to-background/50">
        <p className="text-muted-foreground">No tagged photos yet</p>
      </div>
    );
  }

  // Mobile timeline view
  if (isMobile) {
    return (
      <div
        ref={containerRef}
        className="relative w-full h-screen overflow-hidden bg-gradient-to-b from-background via-background to-background/80"
      >
        <AnimatePresence mode="wait">
          {!zoomedCluster && (
            <motion.div
              key="mobile-timeline"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full overflow-y-auto"
            >
              <div className="px-4 py-8">
                <h1 className="text-2xl font-bold text-white mb-8">Photo Timeline</h1>
                {clusters.map((cluster, index) => (
                  <motion.button
                    key={cluster.id}
                    className="w-full mb-6 rounded-lg overflow-hidden bg-white/5 hover:bg-white/10 transition-colors text-left"
                    onClick={() => setZoomedClusterId(cluster.id)}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="flex gap-4">
                      {cluster.heroPhoto.full && (
                        <img
                          src={cluster.heroPhoto.full}
                          alt={cluster.heroPhoto.alt}
                          className="w-32 h-24 object-cover rounded-lg"
                          loading="lazy"
                        />
                      )}
                      <div className="flex-1 p-4 flex flex-col justify-center">
                        <h3 className="font-semibold text-white">{cluster.name}</h3>
                        <p className="text-sm text-white/80">{cluster.startDate}</p>
                        <p className="text-xs text-white/60 mt-1">{cluster.photoCount} photos</p>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Zoomed view for mobile */}
          {zoomedCluster && (
            <motion.div
              key="mobile-zoomed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full flex flex-col"
            >
              <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => setZoomedClusterId(null)}
                className="sticky top-4 left-4 z-10 flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors backdrop-blur-sm w-fit"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="text-sm">Back</span>
              </motion.button>

              <div className="flex-1 overflow-y-auto px-4 py-8">
                <h2 className="text-2xl font-bold text-white mb-2">{zoomedCluster.name}</h2>
                <p className="text-white/80 mb-6">{zoomedCluster.startDate}</p>

                <div className="grid grid-cols-2 gap-4">
                  {zoomedCluster.photos.map((photo, index) => (
                    <motion.button
                      key={photo.id}
                      className="relative aspect-square rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
                      onClick={() => {
                        const photoIndex = zoomedCluster.photos.indexOf(photo);
                        setLightboxIndex(photoIndex);
                      }}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      {photo.full && (
                        <img
                          src={photo.full}
                          alt={photo.alt}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      )}
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
                    </motion.button>
                  ))}
                </div>

                {/* Lightbox */}
                <AnimatePresence>
                  {lightboxIndex >= 0 && (
                    <PhotoLightbox
                      slides={zoomedCluster.photos.map((photo) => ({
                        src: photo.full || photo.thumb || "",
                        width: photo.width,
                        height: photo.height,
                        alt: photo.alt,
                        description: [photo.location, photo.date]
                          .filter(Boolean)
                          .join(" • "),
                      }))}
                      index={lightboxIndex}
                      onClose={() => setLightboxIndex(-1)}
                    />
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Desktop 3D view
  return (
    <div
      ref={containerRef}
      className="relative w-full h-screen overflow-hidden bg-gradient-to-b from-background via-background to-background/80"
    >
      {/* 3D Perspective Container */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          perspective: "1200px",
          transformStyle: "preserve-3d",
        }}
      >
        {/* Clusters in 3D Space */}
        {/* Overview Mode: Show all clusters */}
        <AnimatePresence mode="wait">
          {!zoomedCluster && (
            <motion.div
              key="overview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              {clusters.map((cluster) => {
                const transform = calculateTransform(
                  cluster.position,
                  camera,
                  viewportSize.width,
                  viewportSize.height
                );

                const isActive = transform.opacity > 0.7;

                return (
                  <motion.div
                    key={cluster.id}
                    className="absolute"
                    animate={
                      reduceMotion
                        ? {}
                        : {
                            x: transform.x,
                            y: transform.y,
                            opacity: transform.opacity,
                          }
                    }
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  >
                    <motion.button
                      className="relative rounded-lg overflow-hidden shadow-lg cursor-pointer group hover:shadow-xl transition-shadow"
                      onClick={() => setZoomedClusterId(cluster.id)}
                      animate={
                        reduceMotion
                          ? { scale: transform.scale }
                          : {
                              scale: isActive ? transform.scale * 1.05 : transform.scale,
                            }
                      }
                      whileHover={{ scale: isActive ? transform.scale * 1.1 : transform.scale }}
                      transition={{ duration: 0.2 }}
                    >
                      {/* Hero Image */}
                      <div
                        className="relative overflow-hidden"
                        style={{
                          width: `${200 * transform.scale}px`,
                          height: `${150 * transform.scale}px`,
                        }}
                      >
                        {cluster.heroPhoto.full && (
                          <motion.img
                            src={cluster.heroPhoto.full}
                            alt={cluster.heroPhoto.alt}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        )}

                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      </div>

                      {/* Cluster Info */}
                      <motion.div
                        className="absolute inset-x-0 bottom-0 p-3 text-white"
                        initial={{ opacity: 0 }}
                        animate={isActive ? { opacity: 1 } : { opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <h3 className="font-semibold text-sm line-clamp-1">{cluster.name}</h3>
                        <p className="text-xs text-white/80 line-clamp-1">{cluster.startDate}</p>
                        <p className="text-xs text-white/70">{cluster.photoCount} photos</p>
                      </motion.div>
                    </motion.button>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {/* Zoomed-in Mode: Show cluster photos in arc layout */}
          {zoomedCluster && (
            <motion.div
              key="zoomed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="w-full h-full flex flex-col items-center justify-center"
            >
              <h2 className="text-2xl font-bold text-white mb-2">{zoomedCluster.name}</h2>
              <p className="text-white/80 mb-8">{zoomedCluster.startDate}</p>

              {/* Photos in Arc Layout */}
              <div className="relative w-80 h-80">
                {zoomedCluster.photos.map((photo, index) => {
                  const angle = (index / zoomedCluster.photos.length) * Math.PI * 2;
                  const radius = 120;
                  const x = Math.cos(angle) * radius;
                  const y = Math.sin(angle) * radius;

                  return (
                    <motion.button
                      key={photo.id}
                      className="absolute w-20 h-16 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
                      style={{
                        left: "50%",
                        top: "50%",
                        transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                      }}
                      onClick={() => {
                        const photoIndex = zoomedCluster.photos.indexOf(photo);
                        setLightboxIndex(photoIndex);
                      }}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{
                        delay: index * 0.05,
                        duration: 0.3,
                      }}
                      whileHover={{ scale: 1.1 }}
                    >
                      {photo.full && (
                        <img
                          src={photo.full}
                          alt={photo.alt}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      )}
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
                    </motion.button>
                  );
                })}
              </div>

              {/* Lightbox */}
              <AnimatePresence>
                {lightboxIndex >= 0 && (
                  <PhotoLightbox
                    slides={zoomedCluster.photos.map((photo) => ({
                      src: photo.full || photo.thumb || "",
                      width: photo.width,
                      height: photo.height,
                      alt: photo.alt,
                      description: [photo.location, photo.date]
                        .filter(Boolean)
                        .join(" • "),
                    }))}
                    index={lightboxIndex}
                    onClose={() => setLightboxIndex(-1)}
                  />
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Back Button */}
      <AnimatePresence>
        {zoomedCluster && (
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            onClick={() => setZoomedClusterId(null)}
            className="absolute top-4 left-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors backdrop-blur-sm"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Scroll Indicator */}
      <AnimatePresence>
        {!zoomedCluster && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-x-0 bottom-8 flex flex-col items-center gap-2"
          >
            <p className="text-xs text-muted-foreground">Scroll to explore</p>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-muted-foreground"
            >
              <ChevronDown className="w-4 h-4" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress Indicator */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2">
        {clusters.map((cluster, index) => (
          <motion.button
            key={cluster.id}
            className="w-2 h-2 rounded-full bg-muted-foreground/30 transition-colors"
            animate={{
              backgroundColor:
                Math.abs(scrollProgress - index / clusters.length) < 0.1
                  ? "rgb(255, 255, 255)"
                  : "rgba(120, 113, 108, 0.3)",
            }}
            onClick={() => {
              setScrollProgress(index / clusters.length);
            }}
          />
        ))}
      </div>
    </div>
  );
}
