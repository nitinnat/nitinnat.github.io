"use client";

import { useState, useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { PositionedCluster } from "@/lib/photo-positioning";
import { MapPin, Calendar } from "lucide-react";
import { PhotoLightbox } from "./photo-lightbox";
import type { Slide } from "yet-another-react-lightbox";
import type { PhotoItem } from "./photo-gallery";

interface ClusteredGalleryProps {
  clusters: PositionedCluster[];
}

export function ClusteredGallery({ clusters }: ClusteredGalleryProps) {
  const reduceMotion = useReducedMotion();
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  const [lightboxPhotos, setLightboxPhotos] = useState<PhotoItem[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(-1);

  // Extract unique locations for filter
  const locations = useMemo(() => {
    const locs = new Set(clusters.map((c) => {
      const parts = c.location.split(",").map((p) => p.trim());
      return parts[parts.length - 1]; // Primary location (e.g., "Colorado")
    }));
    return Array.from(locs).sort();
  }, [clusters]);

  // Filter clusters by location
  const filteredClusters = useMemo(() => {
    if (selectedLocation === "all") return clusters;
    return clusters.filter((c) => c.location.endsWith(selectedLocation));
  }, [clusters, selectedLocation]);

  const openLightbox = (cluster: PositionedCluster, photoIndex: number) => {
    setLightboxPhotos(cluster.photos);
    setLightboxIndex(photoIndex);
  };

  if (clusters.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground">No tagged photos yet. Tag photos to see them organized by location and date.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Filter Bar */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground mr-2">Filter:</span>
            <button
              onClick={() => setSelectedLocation("all")}
              className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                selectedLocation === "all"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80"
              }`}
            >
              All Locations
            </button>
            {locations.map((location) => (
              <button
                key={location}
                onClick={() => setSelectedLocation(location)}
                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                  selectedLocation === location
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80"
                }`}
              >
                {location}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Clustered Sections */}
      <div className="container mx-auto px-4 py-8 space-y-16">
        {filteredClusters.map((cluster, clusterIndex) => (
          <motion.section
            key={cluster.id}
            initial={reduceMotion ? {} : { opacity: 0, y: 20 }}
            whileInView={reduceMotion ? {} : { opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: clusterIndex * 0.1 }}
          >
            {/* Section Header */}
            <div className="mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                {cluster.name}
              </h2>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  <span>{cluster.location}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {cluster.startDate === cluster.endDate
                      ? cluster.startDate
                      : `${cluster.startDate} - ${cluster.endDate}`}
                  </span>
                </div>
                <span>{cluster.photoCount} photos</span>
              </div>
            </div>

            {/* Masonry Grid */}
            <div className="columns-1 sm:columns-2 lg:columns-3 gap-4">
              {cluster.photos.map((photo, photoIndex) => {
                const src = photo.full || photo.thumb;
                if (!src) return null;

                return (
                  <motion.button
                    key={photo.id}
                    type="button"
                    onClick={() => openLightbox(cluster, photoIndex)}
                    className="relative mb-4 w-full break-inside-avoid group cursor-pointer"
                    initial={reduceMotion ? {} : { opacity: 0, scale: 0.95 }}
                    whileInView={reduceMotion ? {} : { opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: photoIndex * 0.05 }}
                    whileHover={reduceMotion ? {} : { scale: 1.02 }}
                  >
                    <div className="relative rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow">
                      <img
                        src={src}
                        alt={photo.alt}
                        className="w-full h-auto"
                        loading="lazy"
                      />

                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200" />

                      {/* Optional: Show location/date on hover */}
                      {(photo.location || photo.date) && (
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          {photo.location && photo.location !== cluster.location && (
                            <div className="flex items-start gap-1.5 text-white text-xs mb-1">
                              <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                              <span className="line-clamp-1">{photo.location}</span>
                            </div>
                          )}
                          {photo.date && photo.date !== cluster.startDate && (
                            <div className="flex items-start gap-1.5 text-white text-xs">
                              <Calendar className="w-3 h-3 mt-0.5 flex-shrink-0" />
                              <span className="line-clamp-1">{photo.date}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.section>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxIndex >= 0 && lightboxPhotos.length > 0 && (
        <PhotoLightbox
          slides={lightboxPhotos.map((photo) => ({
            src: photo.full || photo.thumb || "",
            width: photo.width,
            height: photo.height,
            alt: photo.alt,
            description: [photo.location, photo.date]
              .filter(Boolean)
              .join(" • "),
          }))}
          index={lightboxIndex}
          onClose={() => {
            setLightboxIndex(-1);
            setLightboxPhotos([]);
          }}
        />
      )}
    </div>
  );
}
