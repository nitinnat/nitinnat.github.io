import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";

export function Header() {
  return (
    <header className="border-b border-border">
      <div className="container mx-auto px-4 py-4 max-w-3xl flex justify-between items-center">
        <Link
          href="/"
          className="text-xl font-bold text-foreground hover:text-primary transition-colors"
        >
          Nitin Nataraj
        </Link>
        <nav className="flex items-center gap-6">
          <Link
            href="/about"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            About
          </Link>
          <Link
            href="/blog"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Blog
          </Link>
          <Link
            href="/photography"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Photography
          </Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
