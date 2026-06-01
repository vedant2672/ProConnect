import React, { useEffect } from "react";
import styles from "./index.module.css";
import { useRouter } from "next/router";
import { setTokenIsThere } from "@/config/redux/reducer/authReducer";
import { useDispatch, useSelector } from "react-redux";
import { BASE_URL, resolveImageUrl } from "@/config";

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const dispatch = useDispatch();
  const authState = useSelector((state) => state.auth);

  // Only run once on mount
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      localStorage.getItem("token") === null
    ) {
      router.push("/login");
    }
    dispatch(setTokenIsThere());
  }, [router, dispatch]);

  const navItems = [
    {
      label: "Feed",
      route: "/dashboard",
      icon: (
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
            d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
          />
        </svg>
      ),
    },
    {
      label: "Discover",
      route: "/discover",
      icon: (
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
            d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
          />
        </svg>
      ),
    },
    {
      label: "Connections",
      route: "/my_connections",
      icon: (
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
            d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
          />
        </svg>
      ),
    },
    {
      label: "Specialisations",
      route: "/specialisations",
      icon: (
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
            d="M9.813 15.904 9 18.75l-1.313-3.844A4.5 4.5 0 0 1 4.5 12.75V6a4.5 4.5 0 0 1 4.5-4.5h6a4.5 4.5 0 0 1 4.5 4.5v6.75a4.5 4.5 0 0 1-3.188 4.156L15 18.75l-.813-2.846m-4.374 0h4.374"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className={styles.layoutRoot}>
      <aside className={styles.sidebar} aria-label="Sidebar navigation">
        <nav>
          <ul className={styles.navList}>
            {navItems.map((item) => {
              const active = router.pathname === item.route;
              return (
                <li key={item.route}>
                  <button
                    type="button"
                    onClick={() => router.push(item.route)}
                    className={`${styles.navItem} ${
                      active ? styles.navItemActive : ""
                    }`}
                    aria-current={active ? "page" : undefined}
                  >
                    <span className={styles.navIcon}>{item.icon}</span>
                    <span className={styles.navLabel}>{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      <main className={styles.feedArea} id="main-content">
        {children}
      </main>

      <aside className={styles.rightRail} aria-label="Top profiles">
        <div className={styles.topProfilesHeader}>Top Profiles</div>
        {!authState.all_profiles_fetched && (
          <div className={styles.rightRailLoading}>Loading profiles…</div>
        )}
        {authState.all_profiles_fetched &&
          authState.all_users.slice(0, 8).map((profile) => (
            <button
              key={profile._id}
              className={styles.profileCard}
              type="button"
              onClick={() =>
                router.push(`/view_profile/${profile.userId?.username}`)
              }
            >
              <img
                src={resolveImageUrl(profile.userId?.profilePicture)}
                alt=""
                className={styles.profileAvatar}
                loading="lazy"
              />
              <div className={styles.profileMeta}>
                <p className={styles.profileName}>{profile.userId?.name}</p>
                <p className={styles.profileHandle}>
                  @{profile.userId?.username}
                </p>
              </div>
            </button>
          ))}
      </aside>

      <div
        className={styles.mobileNavBar}
        role="navigation"
        aria-label="Bottom navigation"
      >
        {navItems.map((item) => {
          const active = router.pathname === item.route;
          return (
            <button
              key={item.route}
              type="button"
              onClick={() => router.push(item.route)}
              className={`${styles.mobileNavItem} ${
                active ? styles.mobileNavItemActive : ""
              }`}
              aria-current={active ? "page" : undefined}
            >
              {item.icon}
              <span className="sr-only">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
