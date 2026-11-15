import Link from "next/link";
import { getAllPosts } from "@/lib/content";

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-5 py-16 md:px-10 md:py-24">
        <header className="grid gap-8 border-b border-border pb-14 md:grid-cols-[1.2fr_.8fr] md:items-end md:pb-20">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">Field notes on building</p>
            <h1 className="mt-5 max-w-4xl font-serif text-6xl leading-[0.95] tracking-[-0.04em] sm:text-7xl md:text-8xl">Writing</h1>
          </div>
          <p className="font-serif text-xl leading-relaxed text-muted-foreground">
            Practical essays on production AI, software architecture, and the workflows that make complex systems easier to operate.
          </p>
        </header>

        {posts.length === 0 ? (
          <p className="py-16 text-muted-foreground">No posts yet.</p>
        ) : (
          <div className="grid border-t border-border md:grid-cols-2">
            {posts.map((post, index) => (
              <Link
                key={post.meta.slug}
                href={`/posts/${post.meta.slug}`}
                className="group border-b border-border py-9 md:border-r md:px-9 md:odd:pl-0 md:even:border-r-0"
              >
                <p className="font-mono text-xs text-muted-foreground">
                  {String(index + 1).padStart(2, "0")} · {new Date(post.meta.date).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                </p>
                <h2 className="mt-5 font-serif text-3xl leading-tight tracking-tight group-hover:underline group-hover:underline-offset-4">{post.meta.title}</h2>
                {post.meta.description && <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{post.meta.description}</p>}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
