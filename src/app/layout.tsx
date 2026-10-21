import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Space_Mono } from "next/font/google";
import { getSession } from "@/auth/session";
import { Header } from "@/components/header";
import { getStore } from "@/infra/get-store";
import "./globals.css";

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-sans",
});

const mono = Space_Mono({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Few",
  description: "Envía soles de Perú a Europa.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  const profile = session ? await (await getStore()).getProfile(session.userId) : null;
  return (
    <html lang="es" className={`${sans.variable} ${mono.variable} h-full`}>
      <body className="min-h-dvh antialiased">
        <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-paper shadow-[0_0_40px_rgba(10,10,10,0.06)]">
          <Header
            email={session?.email ?? null}
            senderName={profile?.senderName ?? null}
            dni={profile?.dni ?? null}
            phone={profile?.phone ?? null}
          />
          <div className="flex flex-1 flex-col">{children}</div>
        </div>
      </body>
    </html>
  );
}
