export function Footer() {
  return (
    <footer className="flex h-14 items-center justify-between border-t border-border bg-card px-6">
      <p className="text-xs text-muted-foreground">
        &copy; 2026 Double Down Inc. All rights reserved.
      </p>
      <div className="flex items-center gap-4">
        <a href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
          Privacy
        </a>
        <a href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
          Terms
        </a>
        <a href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
          Docs
        </a>
      </div>
    </footer>
  );
}
