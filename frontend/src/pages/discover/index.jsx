import UserLayout from "@/layout/UserLayout";
import DashboardLayout from "@/layout/DashboardLayout";
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllUsers } from "@/config/redux/action/authAction";
import { BASE_URL, resolveImageUrl } from "@/config";
import styles from "./index.module.css";
import { useRouter } from "next/router";

export default function discover() {
  const dispatch = useDispatch();
  const router = useRouter();
  const authState = useSelector((state) => state.auth);

  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!authState.all_profiles_fetched) {
      dispatch(getAllUsers());
    }
  }, [authState.all_profiles_fetched, dispatch]);

  const filteredUsers = useMemo(() => {
    let list = authState.all_users || [];
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((u) =>
        [u.userId.name, u.userId.username].some((v) =>
          v?.toLowerCase().includes(q)
        )
      );
    }
    return list;
  }, [authState.all_users, query]);

  return (
    <UserLayout>
      <DashboardLayout>
        <div className={styles.pageWrapper}>
          <header className={styles.pageHeader}>
            <h1 className={styles.title}>Discover Talent</h1>
            <p className={styles.subtitle}>
              Find professionals, explore new connections, and grow your
              network.
            </p>
            <div className={styles.controlsRow}>
              <div className={styles.searchBoxWrapper}>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by name or username"
                  className={styles.searchInput}
                  aria-label="Search profiles"
                />
                {query && (
                  <button
                    type="button"
                    className={styles.clearSearchBtn}
                    onClick={() => setQuery("")}
                    aria-label="Clear search"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className={styles.clearIcon}
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.22 4.22a.75.75 0 0 1 1.06 0L10 8.94l4.72-4.72a.75.75 0 1 1 1.06 1.06L11.06 10l4.72 4.72a.75.75 0 1 1-1.06 1.06L10 11.06l-4.72 4.72a.75.75 0 1 1-1.06-1.06L8.94 10 4.22 5.28a.75.75 0 0 1 0-1.06Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </header>

          {!authState.all_profiles_fetched && (
            <div className={styles.skeletonGrid} aria-hidden>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className={styles.userSkeleton} />
              ))}
            </div>
          )}

          {authState.all_profiles_fetched && (
            <>
              {filteredUsers.length === 0 && (
                <div className={styles.emptyState}>
                  No profiles match your search.
                </div>
              )}
              <ul className={styles.usersGrid}>
                {filteredUsers.map((user) => (
                  <li key={user._id} className={styles.userCard}>
                    <button
                      type="button"
                      className={styles.userCardBtn}
                      onClick={() =>
                        router.push(`/view_profile/${user.userId.username}`)
                      }
                      aria-label={`View profile of ${user.userId.name}`}
                    >
                      <span className={styles.avatarWrap}>
                        <img
                          src={resolveImageUrl(user.userId.profilePicture)}
                          alt=""
                          loading="lazy"
                        />
                      </span>
                      <span className={styles.userMeta}>
                        <span className={styles.userName}>
                          {user.userId.name}
                        </span>
                        <span className={styles.userHandle}>
                          @{user.userId.username}
                        </span>
                      </span>
                      <span className={styles.viewChevron} aria-hidden>
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
                            d="M8.25 4.5 15.75 12l-7.5 7.5"
                          />
                        </svg>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </DashboardLayout>
    </UserLayout>
  );
}
