import { PostDetail } from "@/components/post-detail";
import { PostOverlay } from "@/components/post-overlay";
import { Suspense } from "react";

// Intercepts links to /posts/:id made from inside the app and shows the post on
// top of the current page. The URL still changes, so it can be shared, and a
// refresh shows the full page (app/posts/[id]).
export default function PostOverlayPage({ params }: PageProps<"/posts/[id]">) {
  return (
    <PostOverlay>
      <Suspense fallback={<div className="h-full animate-pulse bg-neutral-200 dark:bg-neutral-900" />}>
        <Post params={params} />
      </Suspense>
    </PostOverlay>
  );
}

async function Post({ params }: { params: PageProps<"/posts/[id]">["params"] }) {
  const { id } = await params;
  return <PostDetail id={id} variant="overlay" />;
}
