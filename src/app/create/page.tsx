import { NewPostForm } from "@/components/new-post-form";
import { PageTitle } from "@/components/page-title";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export default function NewPostPage() {
  return (
    <div className="space-y-4">
      {/* A bottom tab: title in the phone header, no Back */}
      <PageTitle title="New post" />
      <h1 className="hidden text-xl font-semibold sm:block">New post</h1>
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
  const session = await getSession();
  if (!session) redirect("/auth/login?returnTo=/create");
  return children;
}
