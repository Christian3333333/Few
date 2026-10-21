import Link from "next/link";

export function TabBar({ current }: { current: "inicio" | "actividad" }) {
  return (
    <nav className="grid grid-cols-2 border-t border-track bg-paper px-4 py-3 text-sm font-bold" aria-label="Principal">
      <Link href="/inicio" className={current === "inicio" ? "text-center text-ink" : "text-center text-muted"} aria-current={current === "inicio" ? "page" : undefined}>
        Inicio
      </Link>
      <Link href="/actividad" className={current === "actividad" ? "text-center text-ink" : "text-center text-muted"} aria-current={current === "actividad" ? "page" : undefined}>
        Actividad
      </Link>
    </nav>
  );
}
