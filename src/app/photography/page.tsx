import { compileMDX } from "@/lib/mdx";
import { getPageBySlug } from "@/lib/content";
import { PhotoHero } from "@/components/photography/photo-hero";
import {
  PhotoGallery,
  type PhotoItem,
} from "@/components/photography/photo-gallery";
import fs from "fs";
import path from "path";

const PHOTO_ASSETS_PATH = path.join(process.cwd(), "content/assets/photos");
const IMAGE_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".heic",
  ".heif",
  ".PNG"
]);

function isImageFile(filename: string) {
  return IMAGE_EXTENSIONS.has(path.extname(filename).toLowerCase());
}

function isExcludedImage(filename: string) {
  const base = path.basename(filename, path.extname(filename)).toLowerCase();
  return base === "heroimage";
}

function isHeroImage(filename: string) {
  const base = path.basename(filename, path.extname(filename)).toLowerCase();
  return base === "001";
}

function toSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildAltText(folder: string | null, filename: string) {
  const base = path.basename(filename, path.extname(filename));
  const cleaned = base.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  if (folder) {
    return cleaned ? `${folder} ${cleaned}` : `${folder} photo`;
  }
  return cleaned || "Landscape photograph";
}

function getBasenameFromUrl(url: string) {
  const cleaned = decodeURI(url).split("?")[0]?.split("#")[0] || url;
  const base = path.posix.basename(cleaned);
  return base.replace(/\.[^/.]+$/, "").toLowerCase();
}

function findHeroFromGallery(gallery: PhotoItem[]) {
  return gallery.find((item) => {
    const src = item.full || item.thumb;
    if (!src) return false;
    return getBasenameFromUrl(src) === "001";
  });
}

function findHeroFromAssets(): PhotoItem | null {
  if (!fs.existsSync(PHOTO_ASSETS_PATH)) return null;

  const entries = fs
    .readdirSync(PHOTO_ASSETS_PATH, { withFileTypes: true })
    .filter((entry) => !entry.name.startsWith("."))
    .sort((a, b) => a.name.localeCompare(b.name));

  for (const entry of entries) {
    if (entry.isFile() && isImageFile(entry.name) && isHeroImage(entry.name)) {
      const imageUrl = encodeURI(`/assets/photos/${entry.name}`);
      return {
        id: "hero-001",
        full: imageUrl,
        thumb: imageUrl,
        alt: buildAltText(null, entry.name),
      };
    }

    if (entry.isDirectory()) {
      const folderPath = path.join(PHOTO_ASSETS_PATH, entry.name);
      const files = fs
        .readdirSync(folderPath, { withFileTypes: true })
        .filter((file) => file.isFile() && isImageFile(file.name))
        .sort((a, b) => a.name.localeCompare(b.name));

      for (const file of files) {
        if (!isHeroImage(file.name)) continue;
        const relativePath = `${entry.name}/${file.name}`;
        const imageUrl = encodeURI(`/assets/photos/${relativePath}`);
        return {
          id: "hero-001",
          full: imageUrl,
          thumb: imageUrl,
          alt: buildAltText(entry.name, file.name),
          tags: [entry.name],
        };
      }
    }
  }

  return null;
}

function getGalleryFromAssets(): PhotoItem[] {
  if (!fs.existsSync(PHOTO_ASSETS_PATH)) return [];

  const entries = fs
    .readdirSync(PHOTO_ASSETS_PATH, { withFileTypes: true })
    .filter((entry) => !entry.name.startsWith("."))
    .sort((a, b) => a.name.localeCompare(b.name));

  const items: PhotoItem[] = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const folderName = entry.name;
      const folderPath = path.join(PHOTO_ASSETS_PATH, folderName);
      const files = fs
        .readdirSync(folderPath, { withFileTypes: true })
        .filter(
          (file) =>
            file.isFile() &&
            isImageFile(file.name) &&
            !isExcludedImage(file.name) &&
            !isHeroImage(file.name)
        )
        .sort((a, b) => a.name.localeCompare(b.name));

      for (const file of files) {
        const relativePath = `${folderName}/${file.name}`;
        const imageUrl = encodeURI(`/assets/photos/${relativePath}`);
        const slug = toSlug(`${folderName}-${file.name}`);
        items.push({
          id: slug || `${folderName}-${file.name}`,
          full: imageUrl,
          thumb: imageUrl,
          alt: buildAltText(folderName, file.name),
          tags: [folderName],
        });
      }
    } else if (entry.isFile() && isImageFile(entry.name)) {
      if (isExcludedImage(entry.name) || isHeroImage(entry.name)) continue;
      const imageUrl = encodeURI(`/assets/photos/${entry.name}`);
      const slug = toSlug(entry.name);
      items.push({
        id: slug || entry.name,
        full: imageUrl,
        thumb: imageUrl,
        alt: buildAltText(null, entry.name),
      });
    }
  }

  return items;
}

function parseGallery(value: unknown): PhotoItem[] {
  if (!Array.isArray(value)) return [];

  const items: PhotoItem[] = [];

  value.forEach((entry, index) => {
    if (!entry || typeof entry !== "object") return;
    const raw = entry as Record<string, unknown>;
    const image = typeof raw.image === "string" ? raw.image : undefined;
    const thumb =
      typeof raw.thumb === "string" ? raw.thumb : image || undefined;
    const full =
      typeof raw.full === "string" ? raw.full : image || thumb || undefined;
    const tags = Array.isArray(raw.tags)
      ? raw.tags.filter((tag) => typeof tag === "string")
      : undefined;

    if (!thumb && !full) return;
    if (full && getBasenameFromUrl(full) === "001") return;
    if (thumb && getBasenameFromUrl(thumb) === "001") return;

    items.push({
      id:
        typeof raw.id === "string"
          ? raw.id
          : `${full || thumb}-photo-${index}`,
      thumb,
      full,
      width: typeof raw.width === "number" ? raw.width : undefined,
      height: typeof raw.height === "number" ? raw.height : undefined,
      alt: typeof raw.alt === "string" ? raw.alt : undefined,
      title: typeof raw.title === "string" ? raw.title : undefined,
      tags: tags && tags.length > 0 ? tags : undefined,
    });
  });

  return items;
}

function shuffleArray(array: PhotoItem[]): PhotoItem[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}


export async function generateMetadata() {
  const page = getPageBySlug("photography");

  if (!page) {
    return {
      title: "Photography",
      description: "Landscape portfolio",
    };
  }

  return {
    title: page.meta.title || "Photography",
    description: page.meta.description || "Landscape portfolio",
  };
}

export default async function PhotographyPage() {
  const page = getPageBySlug("photography");

  if (!page) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-3xl font-bold text-foreground">Photography</h1>
        <p className="mt-3 text-muted-foreground">
          Create a{" "}
          <code className="bg-muted px-1.5 py-0.5 rounded text-sm">
            photography.mdx
          </code>{" "}
          file in{" "}
          <code className="bg-muted px-1.5 py-0.5 rounded text-sm">
            content/pages/
          </code>{" "}
          to populate this page.
        </p>
      </div>
    );
  }

  const MDXContent = await compileMDX(page.content);
  const heroSubtitle =
    typeof page.meta.heroSubtitle === "string"
      ? page.meta.heroSubtitle
      : undefined;
  const galleryFromMeta = parseGallery(page.meta.gallery);
  const baseGallery =
    galleryFromMeta.length > 0 ? galleryFromMeta : getGalleryFromAssets();
  const gallery = shuffleArray(baseGallery);
  const heroFromAssets = findHeroFromAssets();
  const heroByName = findHeroFromGallery(gallery);
  const heroFallback = gallery[0];
  const heroImageUrl =
    heroFromAssets?.full ||
    heroFromAssets?.thumb ||
    heroByName?.full ||
    heroByName?.thumb ||
    heroFallback?.full ||
    heroFallback?.thumb ||
    undefined;
  const heroAltText =
    heroFromAssets?.alt || heroByName?.alt || heroFallback?.alt;

  return (
    <div className="pb-16">
      <PhotoHero
        title={page.meta.title || "Photography"}
        subtitle={heroSubtitle || page.meta.description}
        imageUrl={heroImageUrl}
        imageAlt={heroAltText}
      />
      <div className="container mx-auto px-4 pt-10 max-w-6xl">
        <div className="prose prose-neutral dark:prose-invert max-w-none">
          <MDXContent />
        </div>

        {gallery.length === 0 ? (
          <div className="mt-10 rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
            Add photos under{" "}
            <code>content/assets/photos/</code> to render the grid.
          </div>
        ) : (
          <PhotoGallery items={gallery} />
        )}

      </div>
    </div>
  );
}
