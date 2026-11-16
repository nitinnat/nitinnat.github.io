import { ArrowRight, ArrowUpRight, Camera, Cpu } from "lucide-react";
import Link from "next/link";
import { preload } from "react-dom";
import { getAllPosts } from "@/lib/content";

const HERO_IMAGE = "/assets/photos/001.jpg";

export default function HomePage() {
  const posts = getAllPosts();
  preload(HERO_IMAGE, { as: "image", fetchPriority: "high" });

  return (
    <div className="bg-background text-foreground">
      <section className="relative min-h-[72vh] overflow-hidden">
        <div
          role="img"
          aria-label="Nitin Nataraj looking across a mountain landscape at sunset"
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${HERO_IMAGE})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/25 to-background" />
        <div className="relative mx-auto flex min-h-[72vh] max-w-6xl flex-col justify-end px-5 py-16 md:px-10 md:py-24">
          <p className="mb-5 font-mono text-xs uppercase tracking-[0.22em] text-white/70">Engineering · Writing · Seeing</p>
          <h1 className="max-w-5xl text-5xl font-semibold leading-[0.95] tracking-[-0.05em] text-white sm:text-7xl md:text-8xl">
            Building dependable AI systems. Documenting what I learn.
          </h1>
          <p className="mt-7 max-w-2xl text-base leading-relaxed text-white/75 md:text-lg">
            I’m Nitin, a senior software engineer working on agentic AI, retrieval, memory, and the infrastructure that turns ambitious demos into reliable products.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-5 py-16 md:grid-cols-3 md:px-10 md:py-24">
        <Link href="/about" className="group rounded-2xl border border-border bg-card/60 p-6 hover:bg-card">
          <Cpu className="size-5 text-cyan-700 dark:text-cyan-300" aria-hidden="true" />
          <p className="mt-10 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">Engineering</p>
          <h2 className="mt-3 text-2xl tracking-tight">How I build and where I’ve worked.</h2>
          <ArrowRight className="mt-8 size-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
        </Link>
        <Link href="/blog" className="group rounded-2xl border border-border bg-card/60 p-6 hover:bg-card">
          <ArrowUpRight className="size-5 text-emerald-700 dark:text-emerald-300" aria-hidden="true" />
          <p className="mt-10 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">Writing</p>
          <h2 className="mt-3 text-2xl tracking-tight">Notes on production AI and software systems.</h2>
          <ArrowRight className="mt-8 size-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
        </Link>
        <Link href="/photography" className="group rounded-2xl border border-border bg-card/60 p-6 hover:bg-card">
          <Camera className="size-5 text-amber-700 dark:text-amber-200" aria-hidden="true" />
          <p className="mt-10 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">Photography</p>
          <h2 className="mt-3 text-2xl tracking-tight">Landscapes, travel, and quiet observations.</h2>
          <ArrowRight className="mt-8 size-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
        </Link>
      </section>

      {posts[0] && (
        <section className="mx-auto max-w-6xl px-5 pb-20 md:px-10">
          <Link href={`/posts/${posts[0].meta.slug}`} className="group flex flex-col justify-between gap-8 border-t border-border py-10 md:flex-row md:items-end">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">Latest essay</p>
              <h2 className="mt-4 max-w-3xl font-serif text-3xl tracking-tight group-hover:text-amber-700 dark:group-hover:text-amber-200 md:text-5xl">{posts[0].meta.title}</h2>
            </div>
            <ArrowUpRight className="size-8 shrink-0" aria-hidden="true" />
          </Link>
        </section>
      )}
    </div>
  );
}
