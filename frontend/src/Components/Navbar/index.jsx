import React, { useState } from "react";
import styles from "./styles.module.css";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import { reset } from "@/config/redux/reducer/authReducer";
import { BASE_URL, resolveImageUrl } from "@/config";

function NavbarComponent() {
  const router = useRouter();
  const authState = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const displayName = authState?.user?.userId?.name || authState?.user?.name;
  const profilePicture = authState?.user?.userId?.profilePicture;
  const initial = displayName?.charAt(0)?.toUpperCase() || "P";

  // No center navigation links required (connections & dashboard removed)
  const authedLinks = [];
  const publicLinks = [];

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
    dispatch(reset());
    setDropdownOpen(false);
  };

  // LinkSet removed since no links are displayed currently

  return (
    <header className={styles.wrapper}>
      <nav className={styles.navbar} aria-label="Main navigation">
        <div className={styles.leftGroup}>
          <button
            className={styles.brand}
            onClick={() => router.push("/")}
            aria-label="Go to home page"
          >
            <span className={styles.brandBadge}>Pro</span>
            <span className={styles.brandText}>Connect</span>
          </button>
        </div>

        {/* Center navigation removed intentionally */}

        <div className={styles.rightGroup}>
          {authState.profileFetched ? (
            <div className={styles.userArea}>
              <button
                className={styles.avatarButton}
                aria-label="User menu"
                aria-haspopup="true"
                aria-expanded={dropdownOpen}
                onClick={() => setDropdownOpen((p) => !p)}
              >
                <span className={styles.avatar}>
                  {profilePicture ? (
                    <img
                      src={resolveImageUrl(profilePicture)}
                      alt={displayName || "User avatar"}
                      className={styles.avatarImg}
                      loading="lazy"
                    />
                  ) : (
                    initial
                  )}
                </span>
                {displayName && (
                  <span className={styles.displayName}>{displayName}</span>
                )}
                <svg
                  className={styles.caretIcon}
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
              {dropdownOpen && (
                <div className={styles.dropdown} role="menu">
                  <p className={styles.dropdownHeader}>
                    {displayName || "Profile"}
                  </p>
                  <button
                    role="menuitem"
                    onClick={() => {
                      router.push("/profile");
                      setDropdownOpen(false);
                    }}
                  >
                    Profile
                  </button>
                  <button
                    role="menuitem"
                    onClick={handleLogout}
                    className={styles.logoutBtn}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              className={styles.primaryCta}
              onClick={() => router.push("/login")}
            >
              Join Now
            </button>
          )}
          <button
            className={styles.mobileToggle}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </nav>
      {/* Mobile Panel */}
      <div
        className={
          menuOpen
            ? `${styles.mobilePanel} ${styles.mobilePanelOpen}`
            : styles.mobilePanel
        }
      >
        {authState.profileFetched ? (
          <div className={styles.mobileActions}>
            <button onClick={() => router.push("/profile")}>Profile</button>
            <button onClick={handleLogout} className={styles.logoutBtn}>
              Logout
            </button>
          </div>
        ) : (
          <div className={styles.mobileActions}>
            <button onClick={() => router.push("/login")}>Login</button>
            <button
              onClick={() => router.push("/login")}
              className={styles.primaryCta}
            >
              Create Account
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

export default NavbarComponent;
