import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <h1 className="font-display text-4xl text-yale">That page is not on Yiverr.</h1>
      <Link href="/" className="btn-primary mt-6">
        Back to browse
      </Link>
    </div>
  );
}
