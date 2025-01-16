"use client";

import { Flame, Droplets, Users, BarChart2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function MainNav() {
  const pathname = usePathname();

  const links = [
    {
      name: "Token Burns",
      href: "/",
      icon: Flame,
      color: "text-orange-500",
      gradient: "from-purple-400 to-pink-600"
    },
    {
      name: "Liquidity",
      href: "/liquidity",
      icon: Droplets,
      color: "text-cyan-500",
      gradient: "from-cyan-400 to-blue-600"
    },
    {
      name: "Holders",
      href: "/holders",
      icon: Users,
      color: "text-emerald-500",
      gradient: "from-emerald-400 to-teal-600"
    },
    {
      name: "Volume",
      href: "/volume",
      icon: BarChart2,
      color: "text-amber-500",
      gradient: "from-amber-400 to-orange-600"
    }
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-lg border-b border-purple-500/20">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-2 text-sm transition-colors hover:text-white",
                    isActive
                      ? "text-white"
                      : "text-gray-400 hover:text-gray-200"
                  )}
                >
                  <Icon className={cn("h-4 w-4", link.color)} />
                  <span className={cn(
                    "font-medium",
                    isActive && "text-transparent bg-clip-text bg-gradient-to-r",
                    isActive && link.gradient
                  )}>
                    {link.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}