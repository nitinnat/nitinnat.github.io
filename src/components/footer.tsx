import Link from "next/link";

const links = [
  { href: "/about", label: "About" },
  { href: "/blog", label: "Writing" },
  { href: "/photography", label: "Photography" },
  { href: "https://github.com/nitinnat", label: "GitHub" },
];

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border py-8">
      <div className="container mx-auto flex max-w-6xl flex-col gap-4 px-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>&copy; {new Date().getFullYear()} Nitin Nataraj</p>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-2">
          {links.map(({ href, label }) => (
            <Link key={href} href={href} className="transition-colors hover:text-foreground">
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
