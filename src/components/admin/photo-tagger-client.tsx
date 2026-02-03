"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { ChevronLeft, ChevronRight, MapPin, Calendar, X } from "lucide-react";
import type { PhotoItem } from "@/components/photography/photo-gallery";

type FilterType = "all" | "untagged" | "has-location" | "has-date" | "fully-tagged";

interface PhotoTaggerClientProps {
  photos: PhotoItem[];
}

interface FormState {
  location: string;
  date: string;
}

export function PhotoTaggerClient({ photos }: PhotoTaggerClientProps) {
  // Check if there are untagged photos
  const hasUntagged = photos.some(photo => {
    const hasLocation = !!photo.location;
    const hasDate = !!photo.date;
    return !hasLocation && !hasDate;
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [filter, setFilter] = useState<FilterType>(hasUntagged ? "untagged" : "all");
  const [formState, setFormState] = useState<FormState>({ location: "", date: "" });
  const [localMetadata, setLocalMetadata] = useState<Record<string, FormState>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Filter photos based on selected filter
  const filteredPhotos = useMemo(() => {
    return photos.filter((photo) => {
      const meta = localMetadata[photo.id] || {
        location: photo.location || "",
        date: photo.date || "",
      };
      const hasLocation = !!meta.location;
      const hasDate = !!meta.date;

      switch (filter) {
        case "all":
          return true;
        case "untagged":
          return !hasLocation && !hasDate;
        case "has-location":
          return hasLocation;
        case "has-date":
          return hasDate;
        case "fully-tagged":
          return hasLocation && hasDate;
        default:
          return true;
      }
    });
  }, [photos, filter, localMetadata]);

  // Compute filter counts
  const filterCounts = useMemo(() => {
    const counts = {
      all: photos.length,
      untagged: 0,
      "has-location": 0,
      "has-date": 0,
      "fully-tagged": 0,
    };

    photos.forEach((photo) => {
      const meta = localMetadata[photo.id] || {
        location: photo.location || "",
        date: photo.date || "",
      };
      const hasLocation = !!meta.location;
      const hasDate = !!meta.date;

      if (!hasLocation && !hasDate) counts.untagged++;
      if (hasLocation) counts["has-location"]++;
      if (hasDate) counts["has-date"]++;
      if (hasLocation && hasDate) counts["fully-tagged"]++;
    });

    return counts;
  }, [photos, localMetadata]);

  const currentPhoto = filteredPhotos[currentIndex];

  // Adjust index if out of bounds
  useEffect(() => {
    if (filteredPhotos.length > 0 && currentIndex >= filteredPhotos.length) {
      setCurrentIndex(filteredPhotos.length - 1);
    }
  }, [filteredPhotos.length, currentIndex]);

  // Load form state when photo changes
  useEffect(() => {
    if (!currentPhoto) {
      setFormState({ location: "", date: "" });
      return;
    }

    const meta = localMetadata[currentPhoto.id] || {
      location: currentPhoto.location || "",
      date: currentPhoto.date || "",
    };
    setFormState(meta);
  }, [currentPhoto, localMetadata]);

  // Save current photo metadata
  const saveCurrentPhoto = useCallback(async () => {
    if (!currentPhoto) return;

    const hasChanges =
      formState.location !== (currentPhoto.location || "") ||
      formState.date !== (currentPhoto.date || "");

    if (!hasChanges) return;

    // Update local state
    setLocalMetadata((prev) => ({
      ...prev,
      [currentPhoto.id]: { ...formState },
    }));

    // Save to backend
    setIsSaving(true);
    try {
      await fetch("/api/save-photo-metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photoId: currentPhoto.id,
          location: formState.location || undefined,
          date: formState.date || undefined,
        }),
      });
    } catch (error) {
      console.error("Failed to save metadata:", error);
    } finally {
      setIsSaving(false);
    }
  }, [currentPhoto, formState]);

  const handleNext = useCallback(async () => {
    await saveCurrentPhoto();
    setCurrentIndex((prev) => Math.min(prev + 1, filteredPhotos.length - 1));
  }, [saveCurrentPhoto, filteredPhotos.length]);

  const handlePrevious = useCallback(async () => {
    await saveCurrentPhoto();
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  }, [saveCurrentPhoto]);

  const handleSkip = useCallback(() => {
    setCurrentIndex((prev) => Math.min(prev + 1, filteredPhotos.length - 1));
  }, [filteredPhotos.length]);

  // Keyboard shortcut for Enter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNext]);

  const handlePhotoSelect = (index: number) => {
    setCurrentIndex(index);
  };

  const handleFilterChange = (newFilter: FilterType) => {
    setFilter(newFilter);
    setCurrentIndex(0);
  };

  if (filteredPhotos.length === 0 || !currentPhoto) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <p className="text-lg font-semibold text-foreground mb-2">All done!</p>
          <p className="text-muted-foreground">
            {filter === "untagged"
              ? "No untagged photos remaining."
              : `No photos match the "${filter.replace(/-/g, " ")}" filter.`}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[300px_1fr] h-screen bg-background">
      {/* LEFT SIDEBAR: Filters + Thumbnails */}
      <aside className="border-r border-border bg-card/40 overflow-y-auto">
        <div className="p-4">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Photo Tagger
          </h2>

          {/* Filter buttons */}
          <div className="space-y-2 mb-6">
            {(
              [
                "all",
                "untagged",
                "has-location",
                "has-date",
                "fully-tagged",
              ] as FilterType[]
            ).map((f) => (
              <button
                key={f}
                onClick={() => handleFilterChange(f)}
                className={`w-full px-3 py-2 rounded text-sm flex items-center justify-between font-medium transition-colors ${
                  filter === f
                    ? "bg-primary text-primary-foreground"
                    : "bg-background text-foreground hover:bg-muted"
                }`}
              >
                <span className="capitalize">{f.replace(/-/g, " ")}</span>
                <span className="text-xs font-semibold">
                  {filterCounts[f]}
                </span>
              </button>
            ))}
          </div>

          {/* Thumbnail grid */}
          <div className="grid grid-cols-2 gap-2">
            {filteredPhotos.map((photo, idx) => (
              <button
                key={photo.id}
                onClick={() => handlePhotoSelect(idx)}
                className={`aspect-square rounded overflow-hidden border-2 transition-colors ${
                  idx === currentIndex
                    ? "border-primary"
                    : "border-transparent hover:border-muted-foreground"
                }`}
                title={`Photo ${idx + 1}`}
              >
                <img
                  src={photo.thumb || photo.full}
                  alt={photo.alt || ""}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* RIGHT MAIN AREA: Photo preview + form */}
      <main className="flex flex-col">
        {/* Photo preview */}
        <div className="flex-1 bg-black flex items-center justify-center p-8 overflow-auto">
          <img
            src={currentPhoto.full || currentPhoto.thumb}
            alt={currentPhoto.alt || ""}
            className="max-h-full max-w-full object-contain"
          />
        </div>

        {/* Form area */}
        <div className="border-t border-border bg-card p-6">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-muted-foreground">
                Photo {currentIndex + 1} of {filteredPhotos.length}
              </h3>
              {isSaving && (
                <span className="text-xs text-muted-foreground animate-pulse">
                  Saving...
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                  <MapPin className="w-4 h-4" />
                  Location
                </label>
                <input
                  type="text"
                  value={formState.location}
                  onChange={(e) =>
                    setFormState({ ...formState, location: e.target.value })
                  }
                  placeholder="e.g., Rocky Mountain National Park"
                  className="w-full px-3 py-2 rounded border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                  <Calendar className="w-4 h-4" />
                  Date
                </label>
                <input
                  type="text"
                  value={formState.date}
                  onChange={(e) =>
                    setFormState({ ...formState, date: e.target.value })
                  }
                  placeholder="e.g., December 2020"
                  className="w-full px-3 py-2 rounded border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <button
                onClick={handlePrevious}
                disabled={currentIndex === 0}
                className="flex items-center gap-2 px-4 py-2 rounded bg-muted text-muted-foreground hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>

              <button
                onClick={handleSkip}
                className="px-4 py-2 rounded border border-border text-foreground hover:bg-muted transition-colors font-medium text-sm"
              >
                Skip
              </button>

              <button
                onClick={handleNext}
                disabled={currentIndex === filteredPhotos.length - 1}
                className="flex items-center gap-2 px-4 py-2 rounded bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground text-center mt-4">
              Enter to save and go next
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
