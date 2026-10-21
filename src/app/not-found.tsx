import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-start justify-center px-5">
      <h1 className="text-3xl font-extrabold">No encontramos esa página.</h1>
      <Link href="/inicio" className="mt-6 font-bold underline">
        Volver al inicio
      </Link>
    </main>
  );
}
