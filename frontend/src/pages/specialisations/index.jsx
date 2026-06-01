import UserLayout from "@/layout/UserLayout";
import DashboardLayout from "@/layout/DashboardLayout";
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/router";
import { getAllUsers } from "@/config/redux/action/authAction";
import { resolveImageUrl } from "@/config";
import styles from "./index.module.css";

const TECH_SPECIALISATIONS = [
  "Frontend",
  "Backend",
  "Java",
  ".NET",
  "Node.js",
  "React",
  "Angular",
  "Vue",
  "TypeScript",
  "Python",
  "Go",
  "PHP",
  "Spring Boot",
  "ASP.NET Core",
  "Django",
  "Flask",
  "MongoDB",
  "PostgreSQL",
  "MySQL",
  "Redis",
  "GraphQL",
  "DevOps",
  "AWS",
  "Azure",
  "Kubernetes",
];

export default function specialisations() {
  const dispatch = useDispatch();
  const router = useRouter();
  const authState = useSelector((state) => state.auth);

  const [expanded, setExpanded] = useState(false);
  const [selectedSpec, setSelectedSpec] = useState("Frontend");

  useEffect(() => {
    if (!authState.all_profiles_fetched) {
      dispatch(getAllUsers());
    }
  }, [authState.all_profiles_fetched, dispatch]);

  const visibleItems = useMemo(() => {
    return expanded ? TECH_SPECIALISATIONS : TECH_SPECIALISATIONS.slice(0, 5);
  }, [expanded]);

  const mySpecs = useMemo(() => {
    return (authState.user?.specialisations || [])
      .map((s) => s?.name)
      .filter(Boolean);
  }, [authState.user]);

  const matchingProfiles = useMemo(() => {
    return (authState.all_users || []).filter((profile) =>
      (profile.specialisations || []).some(
        (s) => s?.name?.toLowerCase() === selectedSpec.toLowerCase()
      )
    );
  }, [authState.all_users, selectedSpec]);

  return (
    <UserLayout>
      <DashboardLayout>
        <div className={styles.pageWrapper}>
          <header className={styles.pageHeader}>
            <h1 className={styles.title}>Specialisations</h1>
            <p className={styles.subtitle}>
              Browse popular tech fields. Showing 5 by default, then expand to
              explore more.
            </p>
          </header>

          <section className={styles.sectionCard} aria-labelledby="tech-fields">
            <div className={styles.sectionTopRow}>
              <h2 id="tech-fields" className={styles.sectionTitle}>
                Common Tech Fields
              </h2>
              <button
                type="button"
                className={styles.toggleBtn}
                onClick={() => setExpanded((v) => !v)}
              >
                {expanded ? "Show less" : "See more"}
              </button>
            </div>

            <div className={styles.chipsWrap}>
              {visibleItems.map((item) => {
                const isMine = mySpecs.some(
                  (my) => my.toLowerCase() === item.toLowerCase()
                );
                const isSelected = selectedSpec.toLowerCase() === item.toLowerCase();

                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setSelectedSpec(item)}
                    className={`${styles.techChip} ${isMine ? styles.chipActive : ""} ${
                      isSelected ? styles.chipSelected : ""
                    }`}
                  >
                    {item}
                    {isMine && <em className={styles.mineTag}>Added</em>}
                  </button>
                );
              })}
            </div>
          </section>

          <section className={styles.sectionCard} aria-labelledby="profiles-by-spec">
            <div className={styles.sectionTopRow}>
              <h2 id="profiles-by-spec" className={styles.sectionTitle}>
                Profiles in {selectedSpec}
              </h2>
              <span className={styles.countBadge}>{matchingProfiles.length}</span>
            </div>

            {!authState.all_profiles_fetched && (
              <div className={styles.emptyState}>Loading profiles...</div>
            )}

            {authState.all_profiles_fetched && matchingProfiles.length === 0 && (
              <div className={styles.emptyState}>
                No profiles found with {selectedSpec} specialisation.
              </div>
            )}

            {authState.all_profiles_fetched && matchingProfiles.length > 0 && (
              <ul className={styles.profileGrid}>
                {matchingProfiles.map((profile) => (
                  <li key={profile._id} className={styles.profileCardItem}>
                    <button
                      type="button"
                      className={styles.profileCardBtn}
                      onClick={() =>
                        router.push(`/view_profile/${profile.userId.username}`)
                      }
                    >
                      <img
                        src={resolveImageUrl(profile.userId.profilePicture)}
                        alt=""
                        className={styles.avatar}
                        loading="lazy"
                      />
                      <span className={styles.meta}>
                        <span className={styles.name}>{profile.userId.name}</span>
                        <span className={styles.handle}>@{profile.userId.username}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </DashboardLayout>
    </UserLayout>
  );
}
