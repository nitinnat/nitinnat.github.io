"use client";

import Lightbox, { type Slide } from "yet-another-react-lightbox";

interface PhotoLightboxProps {
  slides: Slide[];
  index: number;
  onClose: () => void;
}

export function PhotoLightbox({ slides, index, onClose }: PhotoLightboxProps) {
  if (slides.length === 0) return null;

  return (
    <Lightbox
      open={index >= 0}
      close={onClose}
      index={index}
      slides={slides}
      controller={{ closeOnBackdropClick: true }}
    />
  );
}
