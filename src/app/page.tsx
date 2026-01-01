import Link from "next/link";
import { getAllPosts } from "@/lib/content";

export default function HomePage() {
  const posts = getAllPosts();

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="space-y-8">
        <h1 className="text-3xl font-bold text-foreground">Recent Posts</h1>

        {posts.length === 0 ? (
          <div className="text-muted-foreground space-y-4">
            <p>No posts yet.</p>
            <p className="text-sm">
              Create your first post by adding an MDX file to{" "}
              <code className="bg-muted px-1.5 py-0.5 rounded text-sm">
                content/posts/
              </code>
            </p>
            <div className="bg-muted p-4 rounded-lg text-sm">
              <p className="font-medium mb-2">Example front matter:</p>
              <pre className="text-xs">
                {`---
title: "My First Post"
date: 2025-01-01
description: "A brief description"
---

Your content here...`}
              </pre>
            </div>
          </div>
        ) : (
          <ul className="space-y-6">
            {posts.map((post) => (
              <li
                key={post.meta.slug}
                className="border-b border-border pb-6 last:border-0"
              >
                <Link href={`/posts/${post.meta.slug}`} className="block group">
                  <h2 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                    {post.meta.title}
                  </h2>
                  <time className="text-sm text-muted-foreground">
                    {new Date(post.meta.date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </time>
                  {post.meta.description && (
                    <p className="mt-2 text-muted-foreground">
                      {post.meta.description}
                    </p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
