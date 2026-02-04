"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { ChevronLeft, ChevronRight, MapPin, Calendar, X } from "lucide-react";
import type { PhotoItem } from "@/components/photography/photo-gallery";

type FilterType = "all" | "untagged" | "has-location" | "has-date" | "fully-tagged";
type LocationFilter = string | null | "untagged";

interface PhotoTaggerClientProps {
  photos?: PhotoItem[];
}

interface FormState {
  location: string;
  date: string;
}

export function PhotoTaggerClient({ photos: initialPhotos }: PhotoTaggerClientProps) {
  const [photos, setPhotos] = useState<PhotoItem[]>(initialPhotos || []);
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(!initialPhotos);
  // Check if there are untagged photos (missing location OR date)
  const hasUntagged = photos.some(photo => {
    const hasLocation = !!photo.location;
    const hasDate = !!photo.date;
    return !hasLocation || !hasDate;
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [filter, setFilter] = useState<FilterType>(hasUntagged ? "untagged" : "all");
  const [locationFilter, setLocationFilter] = useState<LocationFilter>(null);
  const [formState, setFormState] = useState<FormState>({ location: "", date: "" });
  const [originalFormState, setOriginalFormState] = useState<FormState>({ location: "", date: "" });
  const [localMetadata, setLocalMetadata] = useState<Record<string, FormState>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string>("");

  // Fetch photos on mount if not provided
  useEffect(() => {
    if (!initialPhotos) {
      fetchPhotos();
    }
  }, [initialPhotos]);

  const fetchPhotos = async () => {
    setIsLoadingPhotos(true);
    try {
      const response = await fetch("/api/get-photos/");
      const data = await response.json();
      if (data.success) {
        setPhotos(data.photos);
      } else {
        console.error("Failed to fetch photos:", data.error);
      }
    } catch (error) {
      console.error("Error fetching photos:", error);
    } finally {
      setIsLoadingPhotos(false);
    }
  };

  // Extract unique locations
  const uniqueLocations = useMemo(() => {
    const locations = new Set<string>();
    photos.forEach((photo) => {
      const meta = localMetadata[photo.id] || {
        location: photo.location || "",
        date: photo.date || "",
      };
      if (meta.location) {
        // Extract primary location (e.g., "Colorado" from "Denver, Colorado")
        const parts = meta.location.split(",").map((p) => p.trim());
        const primary = parts[parts.length - 1];
        if (primary) locations.add(primary);
      }
    });
    return Array.from(locations).sort();
  }, [photos, localMetadata]);

  // Filter photos based on selected filter and location
  const filteredPhotos = useMemo(() => {
    return photos.filter((photo) => {
      const meta = localMetadata[photo.id] || {
        location: photo.location || "",
        date: photo.date || "",
      };
      const hasLocation = !!meta.location;
      const hasDate = !!meta.date;

      // Apply status filter
      let passesStatusFilter = false;
      switch (filter) {
        case "all":
          passesStatusFilter = true;
          break;
        case "untagged":
          passesStatusFilter = !hasLocation || !hasDate;
          break;
        case "has-location":
          passesStatusFilter = hasLocation;
          break;
        case "has-date":
          passesStatusFilter = hasDate;
          break;
        case "fully-tagged":
          passesStatusFilter = hasLocation && hasDate;
          break;
        default:
          passesStatusFilter = true;
      }

      if (!passesStatusFilter) return false;

      // Apply location filter
      if (locationFilter === "untagged") {
        // Show only photos without location
        return !meta.location;
      } else if (locationFilter && meta.location) {
        // Filter by specific location
        const parts = meta.location.split(",").map((p) => p.trim());
        const primary = parts[parts.length - 1];
        if (primary !== locationFilter) return false;
      } else if (locationFilter) {
        // Location filter is set but photo has no location
        return false;
      }

      return true;
    });
  }, [photos, filter, locationFilter, localMetadata]);

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

      if (!hasLocation || !hasDate) counts.untagged++;
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

  // Load form state when photo changes (NOT when localMetadata changes)
  useEffect(() => {
    if (!currentPhoto) {
      setFormState({ location: "", date: "" });
      setOriginalFormState({ location: "", date: "" });
      return;
    }

    // Use a ref to get the latest localMetadata without adding it as a dependency
    const meta = localMetadata[currentPhoto.id] || {
      location: currentPhoto.location || "",
      date: currentPhoto.date || "",
    };
    console.log("[FORM] Setting form state for photo:", currentPhoto.id);
    console.log("[FORM] Meta from localMetadata:", localMetadata[currentPhoto.id]);
    console.log("[FORM] Meta from currentPhoto:", {
      location: currentPhoto.location,
      date: currentPhoto.date,
    });
    console.log("[FORM] Final meta being set:", meta);
    setFormState(meta);
    setOriginalFormState(meta); // Store original values to compare against later
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPhoto]);

  // Save current photo metadata
  const saveCurrentPhoto = useCallback(async () => {
    if (!currentPhoto) return;

    // Compare against the original form state when we loaded this photo
    console.log("[SAVE] Photo ID:", currentPhoto.id);
    console.log("[SAVE] Current form state:", formState);
    console.log("[SAVE] Original form state:", originalFormState);

    const hasChanges =
      formState.location !== originalFormState.location ||
      formState.date !== originalFormState.date;

    console.log("[SAVE] Has changes:", hasChanges);

    if (!hasChanges) {
      console.log("[SAVE] No changes detected, skipping save");
      return;
    }

    // Update local state
    setLocalMetadata((prev) => ({
      ...prev,
      [currentPhoto.id]: { ...formState },
    }));

    console.log("[SAVE] Calling API with:", {
      photoId: currentPhoto.id,
      location: formState.location || undefined,
      date: formState.date || undefined,
    });

    // Save to backend
    setIsSaving(true);
    try {
      const response = await fetch("/api/save-photo-metadata/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photoId: currentPhoto.id,
          location: formState.location || undefined,
          date: formState.date || undefined,
        }),
      });
      const result = await response.json();
      console.log("[SAVE] API response:", result);

      // Update originalFormState after successful save
      setOriginalFormState({ ...formState });
      console.log("[SAVE] Updated originalFormState to:", formState);
    } catch (error) {
      console.error("[SAVE] Failed to save metadata:", error);
    } finally {
      setIsSaving(false);
    }
  }, [currentPhoto, formState, originalFormState]);

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

  const handleLocationFilterChange = (location: LocationFilter) => {
    setLocationFilter(location);
    setCurrentIndex(0);
  };

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncMessage("Syncing new photos...");

    try {
      const response = await fetch("/api/auto-tag-photos/", {
        method: "POST",
      });

      const data = await response.json();

      if (data.success) {
        setSyncMessage("✅ Sync complete! Refreshing photos...");
        // Fetch updated photo list
        await fetchPhotos();
        setSyncMessage("✅ Photos refreshed!");
        setTimeout(() => {
          setSyncMessage("");
        }, 2000);
      } else {
        setSyncMessage(`❌ Sync failed: ${data.error}`);
      }
    } catch (error) {
      console.error("Sync error:", error);
      setSyncMessage("❌ Sync failed. Check console for details.");
    } finally {
      setTimeout(() => {
        setIsSyncing(false);
      }, 2000);
    }
  };

  if (isLoadingPhotos) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <p className="text-lg font-semibold text-foreground mb-2">Loading photos...</p>
          <p className="text-muted-foreground">Please wait</p>
        </div>
      </div>
    );
  }

  if (filteredPhotos.length === 0 || !currentPhoto) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background gap-6">
        <div className="text-center">
          <p className="text-lg font-semibold text-foreground mb-2">All done!</p>
          <p className="text-muted-foreground mb-6">
            {filter === "untagged"
              ? "No untagged photos remaining."
              : `No photos match the "${filter.replace(/-/g, " ")}" filter.`}
          </p>

          {/* Filter buttons in empty state */}
          <div className="flex flex-wrap justify-center gap-2 max-w-md">
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
                className={`px-3 py-2 rounded text-sm flex items-center gap-2 font-medium transition-colors ${
                  filter === f
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80"
                }`}
              >
                <span className="capitalize">{f.replace(/-/g, " ")}</span>
                <span className="text-xs font-semibold">
                  {filterCounts[f]}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[300px_1fr] h-screen bg-background overflow-hidden">
      {/* LEFT SIDEBAR: Filters + Thumbnails */}
      <aside className="border-r border-border bg-card/40 overflow-y-auto h-full">
        <div className="p-4">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Photo Tagger
          </h2>

          {/* Sync Button */}
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="w-full mb-4 px-4 py-2 rounded bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
          >
            {isSyncing ? "Syncing..." : "🔄 Sync New Photos"}
          </button>

          {syncMessage && (
            <div className="mb-4 p-3 rounded bg-muted text-sm">
              {syncMessage}
            </div>
          )}

          {/* Status Filter buttons */}
          <div className="space-y-2 mb-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
              Status
            </h3>
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

          {/* Location Filter buttons */}
          <div className="space-y-2 mb-6">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
              Location
            </h3>
            <button
              onClick={() => handleLocationFilterChange(null)}
              className={`w-full px-3 py-2 rounded text-sm flex items-center justify-between font-medium transition-colors ${
                locationFilter === null
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-foreground hover:bg-muted"
              }`}
            >
              <span>All Locations</span>
            </button>
            <button
              onClick={() => handleLocationFilterChange("untagged")}
              className={`w-full px-3 py-2 rounded text-sm flex items-center justify-between font-medium transition-colors ${
                locationFilter === "untagged"
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-foreground hover:bg-muted"
              }`}
            >
              <span>Untagged</span>
            </button>
            {uniqueLocations.map((loc) => (
              <button
                key={loc}
                onClick={() => handleLocationFilterChange(loc)}
                className={`w-full px-3 py-2 rounded text-sm flex items-center justify-between font-medium transition-colors ${
                  locationFilter === loc
                    ? "bg-primary text-primary-foreground"
                    : "bg-background text-foreground hover:bg-muted"
                }`}
              >
                <span className="truncate">{loc}</span>
              </button>
            ))}
          </div>

          {/* Thumbnail grid */}
          <div className="grid grid-cols-2 gap-2 pb-4">
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
      <main className="flex flex-col h-screen overflow-hidden">
        {/* Photo preview */}
        <div className="flex-shrink bg-black flex items-center justify-center p-4 overflow-auto" style={{ maxHeight: 'calc(100vh - 350px)' }}>
          <img
            src={currentPhoto.full || currentPhoto.thumb}
            alt={currentPhoto.alt || ""}
            className="max-h-full max-w-full object-contain"
          />
        </div>

        {/* Form area - fixed height at bottom */}
        <div className="border-t border-border bg-card p-6 flex-shrink-0 overflow-y-auto">
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
                  onChange={(e) => {
                    console.log("[INPUT] Location changed to:", e.target.value);
                    setFormState({ ...formState, location: e.target.value });
                  }}
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
                  onChange={(e) => {
                    console.log("[INPUT] Date changed to:", e.target.value);
                    setFormState({ ...formState, date: e.target.value });
                  }}
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
