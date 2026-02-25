import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export function Header() {
  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-bold">
          A
        </div>
        <span className="text-lg font-semibold tracking-tight text-foreground">
          Double Down Dashboard
        </span>
        <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">
          Beta
        </Badge>
      </div>

      <div className="flex items-center gap-4">
        <nav className="hidden md:flex items-center gap-1">
          <a href="/" className="px-3 py-1.5 text-sm font-medium text-foreground/70 hover:text-foreground transition-colors rounded-md hover:bg-accent">
            Home
          </a>
          <a href="/dashboard" className="px-3 py-1.5 text-sm font-medium text-foreground/70 hover:text-foreground transition-colors rounded-md hover:bg-accent">
            Dashboard
          </a>
          <a href="/settings" className="px-3 py-1.5 text-sm font-medium text-foreground/70 hover:text-foreground transition-colors rounded-md hover:bg-accent">
            Settings
          </a>
        </nav>
        <Avatar className="h-8 w-8">
          <AvatarFallback className="text-xs bg-muted">JD</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
