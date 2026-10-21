import Link from "next/link";
import { MenuSheet } from "@/components/menu-sheet";

export function Header(props: {
  email: string | null;
  senderName: string | null;
  dni: string | null;
  phone: string | null;
}) {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between bg-ink px-5 text-white">
      <Link href={props.email ? "/inicio" : "/entrar"} className="text-xl font-extrabold tracking-tight">
        Few
      </Link>
      <MenuSheet {...props} />
    </header>
  );
}
