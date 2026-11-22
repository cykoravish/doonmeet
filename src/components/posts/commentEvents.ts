// PostComments → PostDetailView: the post's comment total changed
// (detail: { postId, count }). Keeps the 💬 count in the action row live.
export const COMMENT_COUNT_EVENT = "doonmeet:post-comment-count";

export function announceCommentCount(postId: string, count: number) {
  window.dispatchEvent(new CustomEvent(COMMENT_COUNT_EVENT, { detail: { postId, count } }));
}
