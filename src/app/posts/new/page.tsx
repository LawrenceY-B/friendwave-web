import { NewPostForm } from "@/components/new-post-form";
import { auth0 } from "@/lib/auth0";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export default function NewPostPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">New post</h1>
      <Suspense fallback={<div className="h-48 animate-pulse rounded-xl bg-neutral-200 dark:bg-neutral-900" />}>
        <RequireLogin>
          <NewPostForm />
        </RequireLogin>
      </Suspense>
    </div>
  );
}

// Sends logged-out visitors to log in, then back here
async function RequireLogin({ children }: { children: React.ReactNode }) {
  const session = await auth0.getSession();
  if (!session) redirect("/auth/login?returnTo=/posts/new");
  return children;
}
