"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Nav() {
  const path = usePathname();
  const items = [
    { href: "/admin", label: "Propostas", on: path === "/admin" || path.startsWith("/admin/propostas") },
    { href: "/admin/links", label: "Links curtos", on: path.startsWith("/admin/links") },
  ];
  return (
    <nav>
      {items.map((i) => (
        <Link key={i.href} href={i.href} aria-current={i.on ? "page" : undefined}>
          {i.label}
        </Link>
      ))}
    </nav>
  );
}
