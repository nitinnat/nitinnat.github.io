import fs from "fs";
import path from "path";
import matter from "gray-matter";

const POSTS_PATH = path.join(process.cwd(), "content/posts");
const PAGES_PATH = path.join(process.cwd(), "content/pages");

export interface PostMeta {
  slug: string;
  title: string;
  date: string;
  description: string;
  tags?: string[];
  categories?: string[];
  cover?: string;
  draft?: boolean;
}

export interface Post {
  meta: PostMeta;
  content: string;
}

export interface PageMeta extends Record<string, unknown> {
  slug: string;
  title: string;
  description?: string;
  date?: string;
}

export interface Page {
  meta: PageMeta;
  content: string;
}

export function getAllPostSlugs(): string[] {
  if (!fs.existsSync(POSTS_PATH)) return [];

  return fs
    .readdirSync(POSTS_PATH)
    .filter((file) => /\.mdx?$/.test(file))
    .map((file) => file.replace(/\.mdx?$/, ""));
}

export function getPostBySlug(slug: string): Post | null {
  const mdxPath = path.join(POSTS_PATH, `${slug}.mdx`);
  const mdPath = path.join(POSTS_PATH, `${slug}.md`);

  const filePath = fs.existsSync(mdxPath) ? mdxPath : mdPath;

  if (!fs.existsSync(filePath)) return null;

  const fileContents = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(fileContents);

  // Handle date formatting
  let dateString = "";
  if (data.date) {
    if (data.date instanceof Date) {
      dateString = data.date.toISOString();
    } else if (typeof data.date === "string") {
      dateString = data.date;
    }
  }

  return {
    meta: {
      slug,
      title: data.title || "Untitled",
      date: dateString,
      description: data.description || "",
      tags: data.tags || [],
      categories: data.categories || [],
      cover: data.cover,
      draft: data.draft || false,
    },
    content,
  };
}

export function getAllPosts(): Post[] {
  const slugs = getAllPostSlugs();
  const posts = slugs
    .map((slug) => getPostBySlug(slug))
    .filter((post): post is Post => post !== null && !post.meta.draft)
    .sort(
      (a, b) =>
        new Date(b.meta.date).getTime() - new Date(a.meta.date).getTime()
    );

  return posts;
}

export function getPageBySlug(slug: string): Page | null {
  const mdxPath = path.join(PAGES_PATH, `${slug}.mdx`);
  const mdPath = path.join(PAGES_PATH, `${slug}.md`);

  const filePath = fs.existsSync(mdxPath) ? mdxPath : mdPath;

  if (!fs.existsSync(filePath)) return null;

  const fileContents = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(fileContents);

  const rawData = data as Record<string, unknown>;
  const title =
    typeof rawData.title === "string" ? rawData.title : "Untitled";
  const description =
    typeof rawData.description === "string" ? rawData.description : "";
  const dateValue = rawData.date;
  const date =
    dateValue instanceof Date
      ? dateValue.toISOString()
      : typeof dateValue === "string"
      ? dateValue
      : undefined;

  return {
    meta: {
      ...rawData,
      slug,
      title,
      description,
      ...(date ? { date } : {}),
    },
    content,
  };
}
