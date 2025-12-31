import { notFound } from "next/navigation";
import { getAllPostSlugs, getPostBySlug } from "@/lib/content";
import { compileMDX } from "@/lib/mdx";
import { Mermaid } from "@/components/mdx/mermaid";
import { CodeBlock } from "@/components/mdx/code-block";

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

  return (
    <article className="prose prose-neutral dark:prose-invert max-w-none">
      <header className="mb-8 not-prose">
        <h1 className="text-3xl font-bold mb-2 text-foreground">
          {post.meta.title}
        </h1>
        <time className="text-muted-foreground">
          {new Date(post.meta.date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </time>
        {post.meta.tags && post.meta.tags.length > 0 && (
          <div className="flex gap-2 mt-3">
            {post.meta.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs bg-muted px-2 py-1 rounded text-muted-foreground"
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
  );
}

export const dynamicParams = false;
