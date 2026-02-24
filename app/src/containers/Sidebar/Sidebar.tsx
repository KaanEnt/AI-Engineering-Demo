"use client";

import { useState } from "react";
import { Separator } from "@/components/ui/separator";

const navSections = [
  {
    label: "Overview",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: "grid" },
      { name: "Analytics", href: "/analytics", icon: "chart" },
      { name: "Reports", href: "/reports", icon: "file" },
    ],
  },
  {
    label: "Management",
    items: [
      { name: "Users", href: "/users", icon: "users" },
      { name: "Projects", href: "/projects", icon: "folder" },
      { name: "Tasks", href: "/tasks", icon: "check" },
    ],
  },
  {
    label: "System",
    items: [
      { name: "Settings", href: "/settings", icon: "gear" },
      { name: "Integrations", href: "/integrations", icon: "plug" },
    ],
  },
];

const iconMap: Record<string, string> = {
  grid: "⊞",
  chart: "⊟",
  file: "⊡",
  users: "⊕",
  folder: "⊖",
  check: "⊗",
  gear: "⊘",
  plug: "⊙",
};

export function Sidebar() {
  const [activeItem, setActiveItem] = useState("/dashboard");

  return (
    <aside className="flex h-full flex-col gap-1 p-4">
      {navSections.map((section, idx) => (
        <div key={section.label}>
          {idx > 0 && <Separator className="my-3" />}
          <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60">
            {section.label}
          </p>
          <ul className="space-y-0.5">
            {section.items.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveItem(item.href);
                  }}
                  className={`flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors ${
                    activeItem === item.href
                      ? "bg-accent text-accent-foreground font-medium"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                  }`}
                >
                  <span className="text-xs opacity-60">{iconMap[item.icon]}</span>
                  {item.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </aside>
  );
}
