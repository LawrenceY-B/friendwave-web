import { BackButton } from "@/components/back-button";
import { PageTitle } from "@/components/page-title";
import { PostDetail } from "@/components/post-detail";
import { PostSkeleton } from "@/components/post-skeleton";
import { Suspense } from "react";

// A post opened directly (shared link, refresh). Opened from inside the app, the
// same post shows as an overlay instead: see app/@modal/(.)posts/[id].
export default function PostPage({ params }: PageProps<"/posts/[id]">) {
  return (
    <div className="space-y-4">
      <PageTitle title="Post" back />
      <div className="hidden items-center gap-2 sm:flex">
        <BackButton />
        <h1 className="font-semibold">Post</h1>
      </div>
      <Suspense fallback={<PostSkeleton />}>
        <Post params={params} />
      </Suspense>
    </div>
  );
}

async function Post({ params }: { params: PageProps<"/posts/[id]">["params"] }) {
  const { id } = await params;
  return <PostDetail id={id} variant="page" />;
}
