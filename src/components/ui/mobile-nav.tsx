/**
 * @file components/ui/mobile-nav.tsx
 * @description Floating bottom navigation for mobile
 */

"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Vote } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/governance", label: "Governance", icon: Vote },
];

export function MobileNav() {
  const pathname = usePathname();

  // Remove locale prefix for comparison
  const cleanPath = pathname.replace(/^\/[a-z]{2}(?=\/|$)/, "") || "/";

  return (
    <motion.nav
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.3, type: "spring", stiffness: 300, damping: 30 }}
      className="fixed bottom-4 left-4 right-4 z-50 md:hidden"
    >
      <div className="glass-card-solid rounded-2xl px-2 py-2 flex items-center justify-around shadow-elevated">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = cleanPath === item.href ||
            (item.href !== "/" && cleanPath.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-col items-center gap-1 px-6 py-2 rounded-xl transition-colors",
                isActive
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="mobile-nav-indicator"
                  className="absolute inset-0 bg-gradient-to-br from-[var(--gradient-start)] to-[var(--gradient-end)] opacity-15 rounded-xl"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <Icon className={cn(
                "h-5 w-5 relative z-10 transition-transform",
                isActive && "scale-110"
              )} />
              <span className="text-xs font-medium relative z-10">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </motion.nav>
  );
}
