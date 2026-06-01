import { BASE_URL, clientServer, resolveImageUrl } from "@/config";
import DashboardLayout from "@/layout/DashboardLayout";
import UserLayout from "@/layout/UserLayout";
import React, { useEffect, useMemo, useState } from "react";
import styles from "./index.module.css";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import {
  getConnectionsRequest,
  getMyConnectionRequests,
  sendConnectionRequest,
} from "@/config/redux/action/authAction";
import { getAllPosts } from "@/config/redux/action/postAction";

export default function ViewProfilePage({ userProfile }) {
  const router = useRouter();
  const dispatch = useDispatch();
  const postReducer = useSelector((s) => s.postReducer);
  const authState = useSelector((s) => s.auth);

  const [userPosts, setUserPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [isCurrentUserInConnection, setIsCurrentUserInConnection] =
    useState(false);
  const [isConnectionAccepted, setIsConnectionAccepted] = useState(false);
  const [contactInfo, setContactInfo] = useState(null);

  // Load posts + connection context
  useEffect(() => {
    (async () => {
      setLoadingPosts(true);
      await dispatch(getAllPosts());
      await dispatch(
        getConnectionsRequest({ token: localStorage.getItem("token") })
      );
      await dispatch(
        getMyConnectionRequests({ token: localStorage.getItem("token") })
      );
      setLoadingPosts(false);
    })();
  }, [dispatch]);

  // Filter posts belonging to viewed user
  useEffect(() => {
    const posts = postReducer.posts.filter(
      (p) => p.userId.username === router.query.username
    );
    setUserPosts(posts);
  }, [postReducer.posts, router.query.username]);

  // Determine connection state
  useEffect(() => {
    const targetId = userProfile?.userId?._id;
    if (!targetId) return;

    const connections = authState.connections || [];
    const requests = authState.connectionRequest || [];

    const acceptedFromConnections = connections.find(
      (u) => u?.connectionId?._id === targetId
    );
    const acceptedFromRequests = requests.find(
      (u) => u?.userId?._id === targetId
    );

    if (acceptedFromConnections) {
      setIsCurrentUserInConnection(true);
      if (acceptedFromConnections.status_accepted === true)
        setIsConnectionAccepted(true);
    }
    if (acceptedFromRequests) {
      setIsCurrentUserInConnection(true);
      if (acceptedFromRequests.status_accepted === true)
        setIsConnectionAccepted(true);
    }
  }, [
    authState.connections,
    authState.connectionRequest,
    userProfile?.userId?._id,
  ]);

  // Fetch contact info if connected
  useEffect(() => {
    const targetId = userProfile?.userId?._id;
    if (!isConnectionAccepted || !targetId) return;
    (async () => {
      try {
        const res = await clientServer.get("/user/get_contact", {
          params: {
            token: localStorage.getItem("token"),
            userId: targetId,
          },
        });
        setContactInfo(res.data.contact);
      } catch (e) {
        // 403 expected if not connected; ignore silently
      }
    })();
  }, [isConnectionAccepted, userProfile?.userId?._id]);

  const workItems = userProfile.pastWork || [];
  const educationItems = userProfile.education || [];
  const specialisationItems = userProfile.specialisations || [];

  const stats = useMemo(
    () => [
      { label: "Posts", value: userPosts.length },
      { label: "Work Roles", value: workItems.length },
      { label: "Education", value: educationItems.length },
    ],
    [userPosts.length, workItems.length, educationItems.length]
  );

  return (
    <UserLayout>
      <DashboardLayout>
        <div className={styles.profileView}>
          {/* Banner */}
          <div className={styles.banner}>
            <div className={styles.bannerOverlay} />
            <div className={styles.avatarWrapper}>
              <img
                src={resolveImageUrl(userProfile.userId.profilePicture)}
                alt={`${userProfile.userId.name} avatar`}
                className={styles.avatarImg}
              />
            </div>
          </div>

          {/* Header / Identity */}
          <header className={styles.headerBlock}>
            <div className={styles.nameRow}>
              <h1 className={styles.name}>{userProfile.userId.name}</h1>
              <span className={styles.username}>
                @{userProfile.userId.username}
              </span>
              {isCurrentUserInConnection && (
                <span
                  className={
                    isConnectionAccepted
                      ? styles.connectedPill
                      : styles.pendingPill
                  }
                >
                  {isConnectionAccepted ? "Connected" : "Pending"}
                </span>
              )}
            </div>

            {specialisationItems.length > 0 && (
              <div className={styles.specRow}>
                {specialisationItems.map((spec) => (
                  <span key={spec._id} className={styles.specPill}>
                    {spec.name}
                  </span>
                ))}
              </div>
            )}

            <div className={styles.actionsRow}>
              {!isCurrentUserInConnection && (
                <button
                  className={styles.connectBtn}
                  onClick={() =>
                    dispatch(
                      sendConnectionRequest({
                        token: localStorage.getItem("token"),
                        userId: userProfile.userId._id,
                      })
                    )
                  }
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  Connect
                </button>
              )}
              <button
                className={styles.resumeBtn}
                onClick={async () => {
                  const response = await clientServer.get(
                    `/user/download_resume?id=${userProfile.userId._id}`
                  );
                  window.open(`${BASE_URL}/${response.data.message}`, "_blank");
                }}
                aria-label="Download resume"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <path d="M7 10l5 5 5-5" />
                  <path d="M12 15V3" />
                </svg>
                Resume
              </button>
            </div>
            <p className={styles.bio}>
              {userProfile.bio || "No bio provided."}
            </p>
            <div className={styles.statsRow}>
              {stats.map((s) => (
                <div key={s.label} className={styles.statCard}>
                  <span className={styles.statValue}>{s.value}</span>
                  <span className={styles.statLabel}>{s.label}</span>
                </div>
              ))}
            </div>
          </header>

          {/* Main Columns */}
          <div className={styles.columns}>
            <section
              className={styles.leftCol}
              aria-labelledby="activity-heading"
            >
              <h2 id="activity-heading" className={styles.sectionTitle}>
                Recent Activity
              </h2>
              {loadingPosts && (
                <div className={styles.skeletonStack}>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className={styles.postSkeleton} />
                  ))}
                </div>
              )}
              {!loadingPosts && userPosts.length === 0 && (
                <p className={styles.emptyText}>No posts yet.</p>
              )}
              <div className={styles.postsList}>
                {userPosts.map((post) => (
                  <article key={post._id} className={styles.postCard}>
                    {post.media && (
                      <div className={styles.postMediaWrapper}>
                        <img
                          src={resolveImageUrl(post.media)}
                          alt="Post media"
                          className={styles.postMedia}
                        />
                      </div>
                    )}
                    <p className={styles.postBody}>{post.body}</p>
                  </article>
                ))}
              </div>
            </section>

            <aside className={styles.rightCol} aria-labelledby="work-heading">
              <div className={styles.infoSection}>
                <h2 id="work-heading" className={styles.sectionTitle}>
                  Work History
                </h2>
                {workItems.length === 0 && (
                  <p className={styles.emptyText}>No work history added.</p>
                )}
                <ol className={styles.timeline}>
                  {workItems.map((work, idx) => (
                    <li key={idx} className={styles.timelineItem}>
                      <div className={styles.timelineDot} />
                      <div className={styles.workCard}>
                        <p className={styles.workRole}>{work.position}</p>
                        <p className={styles.workCompany}>{work.company}</p>
                        <p className={styles.workYears}>{work.years}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
              <div className={styles.infoSection} aria-labelledby="edu-heading">
                <h2 id="edu-heading" className={styles.sectionTitle}>
                  Education
                </h2>
                {educationItems.length === 0 && (
                  <p className={styles.emptyText}>No education added.</p>
                )}
                <ol className={styles.timeline}>
                  {educationItems.map((edu, idx) => (
                    <li key={idx} className={styles.timelineItem}>
                      <div className={styles.timelineDotAlt} />
                      <div className={styles.workCard}>
                        <p className={styles.workRole}>
                          {edu.degree || edu.fieldOfStudy || "Program"}
                        </p>
                        <p className={styles.workCompany}>{edu.school}</p>
                        {edu.fieldOfStudy && edu.degree && (
                          <p className={styles.workYears}>{edu.fieldOfStudy}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
              {isConnectionAccepted && contactInfo && (
                <div className={styles.infoSection} aria-labelledby="contact-heading">
                  <h2 id="contact-heading" className={styles.sectionTitle}>
                    Contact Info
                  </h2>
                  <ul className={styles.contactList}>
                    {contactInfo.phone && (
                      <li><strong>Phone:</strong> {contactInfo.phone}</li>
                    )}
                    {contactInfo.alternateEmail && (
                      <li><strong>Email:</strong> {contactInfo.alternateEmail}</li>
                    )}
                    {contactInfo.address && (
                      <li><strong>Address:</strong> {contactInfo.address}</li>
                    )}
                    {contactInfo.linkedin && (
                      <li><strong>LinkedIn:</strong> <a href={contactInfo.linkedin} target="_blank" rel="noreferrer">{contactInfo.linkedin}</a></li>
                    )}
                    {contactInfo.github && (
                      <li><strong>GitHub:</strong> <a href={contactInfo.github} target="_blank" rel="noreferrer">{contactInfo.github}</a></li>
                    )}
                    {contactInfo.twitter && (
                      <li><strong>Twitter:</strong> <a href={contactInfo.twitter} target="_blank" rel="noreferrer">{contactInfo.twitter}</a></li>
                    )}
                    {contactInfo.website && (
                      <li><strong>Website:</strong> <a href={contactInfo.website} target="_blank" rel="noreferrer">{contactInfo.website}</a></li>
                    )}
                  </ul>
                </div>
              )}
            </aside>
          </div>
        </div>
      </DashboardLayout>
    </UserLayout>
  );
}

export async function getServerSideProps(context) {
  console.log("From View ");
  console.log(context.query.username);

  const request = await clientServer.get(
    "/user/get_profile_based_on_username",
    {
      params: {
        username: context.query.username,
      },
    }
  );

  const response = await request.data;
  console.log(response);

  return { props: { userProfile: request.data.profile } };
}
