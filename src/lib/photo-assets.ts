// Published URLs for a photo under content/assets/photos; mirrors scripts/optimize-photos.js.
export function photoUrls(relativePath: string) {
  const published = /\.(jpe?g|webp)$/i.test(relativePath)
    ? relativePath
    : relativePath.replace(/\.[^.]+$/, ".jpg");
  return {
    full: encodeURI(`/assets/photos/${published}`),
    thumb: encodeURI(`/assets/photos/thumbs/${published}`),
  };
}
