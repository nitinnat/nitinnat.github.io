import { notFound } from "next/navigation";
import { getAllPostSlugs, getPostBySlug } from "@/lib/content";
import { compileMDX } from "@/lib/mdx";
import { Mermaid } from "@/components/mdx/mermaid";
import { CodeBlock } from "@/components/mdx/code-block";
import Link from "next/link";

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = getAllPostSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PostPageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) return { title: "Post Not Found" };

  return {
    title: post.meta.title,
    description: post.meta.description,
  };
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const MDXContent = await compileMDX(post.content);
  const readingMinutes = Math.max(1, Math.ceil(post.content.trim().split(/\s+/).length / 220));

  return (
    <div className="min-h-screen bg-background text-foreground">
      <article className="prose prose-neutral mx-auto max-w-3xl px-5 py-12 prose-headings:font-serif prose-headings:tracking-tight dark:prose-invert md:px-8 md:py-20">
        <header className="mb-8 not-prose">
          <Link href="/blog" className="mb-10 inline-block font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:text-foreground">← Back to writing</Link>
          <h1 className="mb-6 font-serif text-4xl font-medium leading-[1.02] tracking-[-0.035em] text-foreground sm:text-5xl md:text-6xl">
            {post.meta.title}
          </h1>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          <time>
            {new Date(post.meta.date).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </time>
          <span aria-hidden="true">·</span><span>{readingMinutes} min read</span>
          </div>
          {post.meta.tags && post.meta.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {post.meta.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-border px-3 py-1 font-mono text-xs text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </header>

        <div className="mdx-content">
          <MDXContent components={{ pre: CodeBlock, Mermaid }} />
        </div>
      </article>
    </div>
  );
}

export const dynamicParams = false;
