import { getAboutUser, getAllUsers } from "@/config/redux/action/authAction";
import {
  createPost,
  deletePost,
  getAllComments,
  getAllPosts,
  incrementPostLike,
  postComment,
} from "@/config/redux/action/postAction";
import DashboardLayout from "@/layout/DashboardLayout";
import UserLayout from "@/layout/UserLayout";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import styles from "./index.module.css";
import { BASE_URL, resolveImageUrl } from "@/config";
import { resetPostId } from "@/config/redux/reducer/postReducer";

function dashboard() {
  const dispatch = useDispatch();
  const authState = useSelector((state) => state.auth);
  const postState = useSelector((state) => state.postReducer);

  useEffect(() => {
    if (authState.isTokenThere) {
      dispatch(getAllPosts());
      dispatch(getAboutUser({ token: localStorage.getItem("token") }));
    }
    if (!authState.all_profiles_fetched) {
      dispatch(getAllUsers());
    }
  }, [authState.isTokenThere]);

  const [postContent, setPostContent] = useState("");
  const [fileContent, setFileContent] = useState(null);
  const [commentText, setCommentText] = useState("");

  const handleUpload = async () => {
    await dispatch(createPost({ file: fileContent, body: postContent }));
    setPostContent("");
    setFileContent(null);
    dispatch(getAllPosts());
  };

  if (!authState.user) {
    return (
      <UserLayout>
        <DashboardLayout>
          <div className={styles.feedWrapper}>
            <div
              className={styles.loadingState}
              role="status"
              aria-live="polite"
            >
              Loading your feed...
            </div>
          </div>
        </DashboardLayout>
      </UserLayout>
    );
  }

  return (
    <UserLayout>
      <DashboardLayout>
        <div className={styles.feedWrapper}>
          <div className={styles.composeCard}>
            <div className={styles.composeAvatarSection}>
              <img
                className={styles.composeAvatar}
                src={resolveImageUrl(authState.user?.userId?.profilePicture)}
                alt="Your profile picture"
              />
            </div>
            <div className={styles.composeBody}>
              <textarea
                onChange={(e) => setPostContent(e.target.value)}
                value={postContent}
                className={styles.composeTextarea}
                placeholder="Share something insightful..."
                rows={3}
              />
              <div className={styles.composeActions}>
                <div className={styles.leftActions}>
                  <label htmlFor="fileUpload" className={styles.attachBtn}>
                    <input
                      onChange={(e) => setFileContent(e.target.files[0])}
                      id="fileUpload"
                      type="file"
                      hidden
                    />
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 4.5v15m7.5-7.5h-15"
                      />
                    </svg>
                    <span>Media</span>
                  </label>
                  {fileContent && (
                    <span className={styles.fileBadge}>{fileContent.name}</span>
                  )}
                </div>
                <button
                  disabled={postContent.length === 0}
                  onClick={handleUpload}
                  className={styles.postBtn}
                  aria-disabled={postContent.length === 0}
                >
                  Post
                </button>
              </div>
            </div>
          </div>

          <div className={styles.postsList}>
            {postState.isLoading && (
              <div className={styles.skeletonStack} aria-hidden>
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className={styles.postSkeleton} />
                ))}
              </div>
            )}

            {!postState.isLoading && postState.posts.length === 0 && (
              <div className={styles.emptyState}>
                No posts yet. Be the first!
              </div>
            )}

            {!postState.isLoading &&
              postState.posts.map((post) => (
                <article key={post._id} className={styles.postCard}>
                  <header className={styles.postHeader}>
                    <img
                      className={styles.postAvatar}
                      src={resolveImageUrl(post.userId?.profilePicture)}
                      alt={`${post.userId?.name} avatar`}
                    />
                    <div className={styles.postMeta}>
                      <p className={styles.postAuthor}>{post.userId?.name}</p>
                      <p className={styles.postHandle}>
                        @{post.userId?.username}
                      </p>
                    </div>
                    {post.userId?._id === authState.user?.userId?._id && (
                      <button
                        className={styles.deleteBtn}
                        aria-label="Delete post"
                        onClick={async () => {
                          await dispatch(deletePost({ post_id: post._id }));
                          await dispatch(getAllPosts());
                        }}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                          />
                        </svg>
                      </button>
                    )}
                  </header>
                  <div className={styles.postBody}>{post.body}</div>
                  {post.media && post.media !== "" && (
                    <div className={styles.postMedia}>
                      <img src={resolveImageUrl(post.media)} alt="Post media" />
                    </div>
                  )}
                  <footer className={styles.postActions}>
                    <button
                      className={styles.iconAction}
                      onClick={async () => {
                        await dispatch(
                          incrementPostLike({ post_id: post._id })
                        );
                        dispatch(getAllPosts());
                      }}
                      aria-label="Like post"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6.633 10.25c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 0 1 2.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 0 0 .322-1.672V2.75a.75.75 0 0 1 .75-.75 2.25 2.25 0 0 1 2.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282m0 0h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 0 1-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 0 0-1.423-.23H5.904m10.598-9.75H14.25M5.904 18.5c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 0 1-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 9.953 4.167 9.5 5 9.5h1.053c.472 0 .745.556.5.96a8.958 8.958 0 0 0-1.302 4.665c0 1.194.232 2.333.654 3.375Z"
                        />
                      </svg>
                      <span>{post.likes}</span>
                    </button>
                    <button
                      className={styles.iconAction}
                      onClick={() =>
                        dispatch(getAllComments({ post_id: post._id }))
                      }
                      aria-label="Open comments"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 0 1-.923 1.785A5.969 5.969 0 0 0 6 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337Z"
                        />
                      </svg>
                    </button>
                    <button
                      className={styles.iconAction}
                      onClick={() => {
                        const text = encodeURIComponent(post.body);
                        const url = encodeURIComponent("proconnect.in");
                        const twitterUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
                        window.open(twitterUrl, "_blank");
                      }}
                      aria-label="Share to X"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z"
                        />
                      </svg>
                    </button>
                  </footer>
                </article>
              ))}
          </div>
        </div>

        {postState.postId !== "" && (
          <div
            onClick={() => dispatch(resetPostId())}
            className={styles.modalOverlay}
            role="dialog"
            aria-modal="true"
          >
            <div
              className={styles.commentsModal}
              onClick={(e) => e.stopPropagation()}
            >
              <header className={styles.commentsHeader}>
                <h3>Comments</h3>
                <button
                  className={styles.closeModalBtn}
                  aria-label="Close comments"
                  onClick={() => dispatch(resetPostId())}
                >
                  ×
                </button>
              </header>
              <div className={styles.commentsScroll}>
                {postState.comments.length === 0 && (
                  <p className={styles.emptyComments}>No comments yet.</p>
                )}
                {postState.comments.length !== 0 && (
                  <ul className={styles.commentsList}>
                    {postState.comments.map((comment) => (
                      <li key={comment._id} className={styles.commentItem}>
                        <div className={styles.commentBody}>
                          <p className={styles.commentAuthor}>
                            {comment.userId?.name}
                          </p>
                          <p className={styles.commentHandle}>
                            @{comment.userId?.username}
                          </p>
                          <p className={styles.commentText}>{comment.body}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <form
                className={styles.commentComposer}
                onSubmit={async (e) => {
                  e.preventDefault();
                  await dispatch(
                    postComment({
                      post_id: postState.postId,
                      body: commentText,
                    })
                  );
                  setCommentText("");
                  await dispatch(getAllComments({ post_id: postState.postId }));
                }}
              >
                <input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add a comment"
                  className={styles.commentInput}
                />
                <button
                  type="submit"
                  disabled={commentText.trim().length === 0}
                  className={styles.commentSubmit}
                >
                  Comment
                </button>
              </form>
            </div>
          </div>
        )}
      </DashboardLayout>
    </UserLayout>
  );
}

export default dashboard;
