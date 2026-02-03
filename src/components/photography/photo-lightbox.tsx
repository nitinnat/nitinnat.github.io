"use client";

import Lightbox, { type Slide } from "yet-another-react-lightbox";
import Captions from "yet-another-react-lightbox/plugins/captions";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/captions.css";

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
      plugins={[Captions]}
      controller={{ closeOnBackdropClick: true }}
    />
  );
}
