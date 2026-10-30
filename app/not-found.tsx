import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-16 text-center">
      <h1 className="font-display text-5xl text-maroon-deep">This page is not in the planner</h1>
      <p className="mt-3 text-sm text-muted">Use the menu, or return to the dashboard.</p>
      <Link href="/" className="mt-5 inline-flex min-h-11 items-center font-semibold text-maroon underline">
        Dashboard
      </Link>
    </div>
  );
}
