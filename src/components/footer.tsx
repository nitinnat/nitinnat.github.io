export function Footer() {
  return (
    <footer className="border-t border-border py-6 mt-auto">
      <div className="container mx-auto px-4 max-w-3xl text-center text-muted-foreground text-sm">
        <p>&copy; {new Date().getFullYear()} My Blog. All rights reserved.</p>
      </div>
    </footer>
  );
}
