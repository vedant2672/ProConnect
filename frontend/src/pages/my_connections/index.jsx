import { BASE_URL } from "@/config";
import {
  AcceptConnection,
  getMyConnectionRequests,
} from "@/config/redux/action/authAction";
import DashboardLayout from "@/layout/DashboardLayout";
import UserLayout from "@/layout/UserLayout";
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import styles from "./index.module.css";
import { useRouter } from "next/router";

export default function MyConnectionsPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const authState = useSelector((state) => state.auth);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Fetch connection requests on mount
  useEffect(() => {
    setLoading(true);
    const promise = dispatch(
      getMyConnectionRequests({ token: localStorage.getItem("token") })
    );
    Promise.resolve(promise).finally(() => setLoading(false));
  }, [dispatch]);

  const pendingRequests = useMemo(
    () => authState.connectionRequest.filter((c) => c.status_accepted === null),
    [authState.connectionRequest]
  );
  const acceptedConnections = useMemo(
    () => authState.connectionRequest.filter((c) => c.status_accepted !== null),
    [authState.connectionRequest]
  );

  const filteredConnections = useMemo(() => {
    if (!search.trim()) return acceptedConnections;
    const q = search.toLowerCase();
    return acceptedConnections.filter(
      (c) =>
        c.userId.name?.toLowerCase().includes(q) ||
        c.userId.username?.toLowerCase().includes(q)
    );
  }, [acceptedConnections, search]);

  return (
    <UserLayout>
      <DashboardLayout>
        <div className={styles.container}>
          <div className={styles.headerRow}>
            <div className={styles.titleGroup}>
              <h2 className={styles.title}>My Connections</h2>
              <span className={styles.badge}>{acceptedConnections.length}</span>
            </div>
            <div className={styles.searchWrapper}>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search your network..."
                className={styles.searchInput}
                aria-label="Search connections"
              />
              {search && (
                <button
                  type="button"
                  className={styles.clearSearch}
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Pending Requests Section */}
          <section className={styles.section} aria-labelledby="pending-heading">
            <div className={styles.sectionHeader}>
              <h3 id="pending-heading">Pending Requests</h3>
              <span className={styles.subBadge}>{pendingRequests.length}</span>
            </div>
            {loading && pendingRequests.length === 0 && (
              <div className={styles.skeletonList}>
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className={styles.skeletonCard} />
                ))}
              </div>
            )}
            {!loading && pendingRequests.length === 0 && (
              <p className={styles.emptyText}>No pending requests 🎉</p>
            )}
            <div className={styles.list}>
              {pendingRequests.map((req) => (
                <div
                  key={req._id}
                  className={styles.userCard}
                  role="button"
                  tabIndex={0}
                  onClick={() =>
                    router.push(`/view_profile/${req.userId.username}`)
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter")
                      router.push(`/view_profile/${req.userId.username}`);
                  }}
                >
                  <div className={styles.avatarWrapper}>
                    <img
                      src={`${BASE_URL}/${req.userId.profilePicture}`}
                      alt={req.userId.name + " profile picture"}
                      className={styles.avatarImg}
                    />
                  </div>
                  <div className={styles.userInfo}>
                    <h4>{req.userId.name}</h4>
                    <p>@{req.userId.username}</p>
                  </div>
                  <div className={styles.requestActions}>
                    <button
                      type="button"
                      className={styles.acceptBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        dispatch(
                          AcceptConnection({
                            connectionId: req._id,
                            token: localStorage.getItem("token"),
                            action: "accept",
                          })
                        );
                      }}
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      className={styles.declineBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        dispatch(
                          AcceptConnection({
                            connectionId: req._id,
                            token: localStorage.getItem("token"),
                            action: "reject",
                          })
                        );
                      }}
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Network Section */}
          <section className={styles.section} aria-labelledby="network-heading">
            <div className={styles.sectionHeader}>
              <h3 id="network-heading">Your Network</h3>
              <span className={styles.subBadge}>
                {filteredConnections.length}
              </span>
            </div>
            {loading && acceptedConnections.length === 0 && (
              <div className={styles.skeletonList}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className={styles.skeletonCard} />
                ))}
              </div>
            )}
            {!loading && filteredConnections.length === 0 && (
              <p className={styles.emptyText}>No matches found.</p>
            )}
            <div className={styles.grid}>
              {filteredConnections.map((conn) => (
                <div
                  key={conn._id}
                  className={styles.networkCard}
                  onClick={() =>
                    router.push(`/view_profile/${conn.userId.username}`)
                  }
                >
                  <div className={styles.networkAvatar}>
                    <img
                      src={`${BASE_URL}/${conn.userId.profilePicture}`}
                      alt={conn.userId.name + " profile"}
                    />
                  </div>
                  <h5 className={styles.networkName}>{conn.userId.name}</h5>
                  <p className={styles.networkUsername}>
                    @{conn.userId.username}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </DashboardLayout>
    </UserLayout>
  );
}
