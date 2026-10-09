import Link from "next/link";

export default function NotFound() {
  return (
    <div className="space-y-4 py-20 text-center">
      <p className="font-medium">This page doesn&apos;t exist.</p>
      <Link href="/" className="text-sm text-blue-600 hover:underline">
        Back to your feed
      </Link>
    </div>
  );
}
