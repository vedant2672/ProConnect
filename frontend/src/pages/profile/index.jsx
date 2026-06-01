import { getAboutUser } from "@/config/redux/action/authAction";
import DashboardLayout from "@/layout/DashboardLayout";
import UserLayout from "@/layout/UserLayout";
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import styles from "./index.module.css";
import { BASE_URL, clientServer, resolveImageUrl } from "@/config";
import { getAllPosts } from "@/config/redux/action/postAction";

export default function ProfilePage() {
  const authState = useSelector((state) => state.auth);
  const postReducer = useSelector((state) => state.postReducer);

  const [userProfile, setUserProfile] = useState({});
  const [userPosts, setUserPosts] = useState([]);
  const [initialSnapshot, setInitialSnapshot] = useState(null);
  const [saving, setSaving] = useState(false);

  const dispatch = useDispatch();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState(null); // 'work' | 'education' | 'specialisation' | null

  const [workInput, setWorkInput] = useState({
    company: "",
    position: "",
    years: "",
  });

  const [educationInput, setEducationInput] = useState({
    school: "",
    degree: "",
    fieldOfStudy: "",
    years: "",
  });

  const [specInput, setSpecInput] = useState("");

  const [contact, setContact] = useState({
    phone: "", alternateEmail: "", address: "",
    linkedin: "", github: "", twitter: "", website: "",
  });
  const [contactSaving, setContactSaving] = useState(false);

  const handleWorkChange = (e) => {
    const { name, value } = e.target;
    setWorkInput((prev) => ({ ...prev, [name]: value }));
  };

  const handleEducationChange = (e) => {
    const { name, value } = e.target;
    setEducationInput((prev) => ({ ...prev, [name]: value }));
  };

  const openModal = (type) => {
    setModalType(type);
    setIsModalOpen(true);
  };
  const closeModal = () => {
    setIsModalOpen(false);
    setModalType(null);
  };

  const addWork = () => {
    setUserProfile((prev) => ({
      ...prev,
      pastWork: [...(prev.pastWork || []), workInput],
    }));
    setWorkInput({ company: "", position: "", years: "" });
    closeModal();
  };

  const addEducation = () => {
    setUserProfile((prev) => ({
      ...prev,
      education: [...(prev.education || []), educationInput],
    }));
    setEducationInput({ school: "", degree: "", fieldOfStudy: "", years: "" });
    closeModal();
  };

  const addSpecialisation = async () => {
    if (!specInput.trim()) return;
    try {
      const res = await clientServer.post("/user/add_specialisation", {
        token: localStorage.getItem("token"),
        name: specInput.trim(),
      });
      setSpecInput("");
      closeModal();
      dispatch(getAboutUser({ token: localStorage.getItem("token") }));

    } catch (e) {
      console.error("Failed to add specialisation", e);
    }
  };

  const removeSpecialisation = async (specId) => {
    try {
      await clientServer.post("/user/remove_specialisation", {
        token: localStorage.getItem("token"),
        specialisationId: specId,
      });
      dispatch(getAboutUser({ token: localStorage.getItem("token") }));

    } catch (e) {
      console.error("Failed to remove specialisation", e);
    }
  };

  useEffect(() => {
    dispatch(getAboutUser({ token: localStorage.getItem("token") }));

    dispatch(getAllPosts());

    // Fetch contact
    (async () => {
      try {
        const res = await clientServer.get("/user/get_my_contact", {
          params: { token: localStorage.getItem("token") },
        });
        if (res.data.contact) setContact(res.data.contact);
      } catch (e) {}
    })();
  }, [dispatch]);

  useEffect(() => {
    if (authState.user) {
      setUserProfile(authState.user);
      setInitialSnapshot(authState.user);
      const postsForUser = postReducer.posts.filter(
        (post) => post.userId.username === authState.user.userId.username
      );
      setUserPosts(postsForUser);
    }
  }, [authState.user, postReducer.posts]);

  const updateProfilePicture = async (file) => {
    const formData = new FormData();
    formData.append("profile_picture", file);
    formData.append("token", localStorage.getItem("token"));

    const response = await clientServer.post(
      "/update_profile_picture",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    dispatch(getAboutUser({ token: localStorage.getItem("token") }));

  };

  const hasChanges = useMemo(() => {
    if (!initialSnapshot || !userProfile.userId) return false;
    try {
      const orig = initialSnapshot;
      if (orig.userId.name !== userProfile.userId.name) return true;
      if ((orig.bio || "") !== (userProfile.bio || "")) return true;
      const pwChanged =
        JSON.stringify(orig.pastWork || []) !==
        JSON.stringify(userProfile.pastWork || []);
      if (pwChanged) return true;
      const eduChanged =
        JSON.stringify(orig.education || []) !==
        JSON.stringify(userProfile.education || []);
      if (eduChanged) return true;
      return false;
    } catch (e) {
      return true;
    }
  }, [initialSnapshot, userProfile]);

  const updateProfileData = async () => {
    if (!userProfile.userId) return;
    setSaving(true);
    try {
      await clientServer.post("/user_update", {
        token: localStorage.getItem("token"),
        name: userProfile.userId.name,
      });
      await clientServer.post("/update_profile_data", {
        token: localStorage.getItem("token"),
        bio: userProfile.bio,
        currentPost: userProfile.currentPost,
        pastWork: userProfile.pastWork,
        education: userProfile.education,
      });
      await dispatch(getAboutUser({ token: localStorage.getItem("token") }));

    } finally {
      setSaving(false);
    }
  };

  const downloadResume = async () => {
    if (!userProfile.userId?._id) return;
    try {
      const res = await clientServer.get(
        `/user/download_resume?id=${userProfile.userId._id}`
      );
      const filename = res.data?.message;
      if (!filename) return;
      const url = `${BASE_URL}/${filename}`;
      const a = document.createElement("a");
      a.href = url;
      a.download = `resume_${userProfile.userId.username}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      console.error("Resume download failed", e);
    }
  };


  const saveContact = async () => {
    setContactSaving(true);
    try {
      await clientServer.post("/user/update_contact", {
        token: localStorage.getItem("token"),
        ...contact,
      });
    } catch (e) {
      console.error("Failed to save contact", e);
    } finally {
      setContactSaving(false);
    }
  };
  return (
    <UserLayout>
      <DashboardLayout>
        {authState.user && userProfile.userId && (
          <div className={styles.container}>
            {/* Banner & Avatar */}
            <div className={styles.banner}>
              <div className={styles.bannerInner}>
                <label
                  htmlFor="profilePictureUpload"
                  className={styles.avatarEdit}
                >
                  <span className={styles.avatarEditText}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={styles.avatarEditIcon}
                      aria-hidden="true"
                    >
                      <path d="M12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
                      <path d="M16.5 6h-1.38a2 2 0 0 1-1.788-1.106l-.764-1.528A1 1 0 0 0 11.69 3h-.38a1 1 0 0 0-.89.366L9.656 4.894A2 2 0 0 1 7.868 6H6.5A2.5 2.5 0 0 0 4 8.5v7A2.5 2.5 0 0 0 6.5 18h10A2.5 2.5 0 0 0 19 15.5v-7A2.5 2.5 0 0 0 16.5 6Z" />
                    </svg>
                    <span>Change</span>
                  </span>
                  <input
                    onChange={(e) => {
                      if (e.target.files?.[0])
                        updateProfilePicture(e.target.files[0]);
                    }}
                    hidden
                    type="file"
                    id="profilePictureUpload"
                    accept="image/*"
                  />
                  <img
                    src={resolveImageUrl(userProfile.userId.profilePicture)}
                    alt="Profile avatar"
                    className={styles.avatarImg}
                  />
                </label>
                <div className={styles.bannerGradient} />
              </div>
            </div>

            {/* Header Content */}
            <section className={styles.headerSection}>
              <div className={styles.headerGrid}>
                <div className={styles.primaryCol}>
                  <div className={styles.nameRow}>
                    <input
                      className={styles.nameInput}
                      type="text"
                      value={userProfile.userId.name}
                      onChange={(e) =>
                        setUserProfile({
                          ...userProfile,
                          userId: {
                            ...userProfile.userId,
                            name: e.target.value,
                          },
                        })
                      }
                      aria-label="Edit your name"
                    />
                    <span className={styles.handle}>
                      @{userProfile.userId.username}
                    </span>
                  </div>
                  <div className={styles.bioBlock}>
                    <textarea
                      className={styles.bioTextarea}
                      value={userProfile.bio || ""}
                      placeholder="Add a short bio about yourself..."
                      onChange={(e) =>
                        setUserProfile({ ...userProfile, bio: e.target.value })
                      }
                      rows={Math.max(
                        3,
                        Math.ceil((userProfile.bio || "").length / 80)
                      )}
                      aria-label="Edit your bio"
                    />
                  </div>
                  <div className={styles.statsRow}>
                    <div className={styles.statCard}>
                      <span className={styles.statNumber}>
                        {userPosts.length}
                      </span>
                      <span className={styles.statLabel}>Posts</span>
                    </div>
                    <div className={styles.statCard}>
                      <span className={styles.statNumber}>
                        {(userProfile.pastWork || []).length}
                      </span>
                      <span className={styles.statLabel}>Work</span>
                    </div>
                    <div className={styles.statCard}>
                      <span className={styles.statNumber}>
                        {(userProfile.education || []).length}
                      </span>
                      <span className={styles.statLabel}>Education</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={downloadResume}
                    className={styles.downloadResumeBtn}
                    aria-label="Download resume PDF"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={styles.downloadIcon}
                      aria-hidden="true"
                    >
                      <path d="M12 3v14" />
                      <path d="m6 11 6 6 6-6" />
                      <path d="M5 21h14" />
                    </svg>
                    <span>Download Resume</span>
                  </button>
                </div>
                <aside className={styles.activityCol}>
                  <h3 className={styles.sectionHeading}>Recent Activity</h3>
                  <ul className={styles.activityList}>
                    {userPosts.slice(0, 6).map((post) => (
                      <li key={post._id} className={styles.activityItem}>
                        {post.media && (
                          <span className={styles.activityMediaWrap}>
                            <img src={resolveImageUrl(post.media)} alt="" />
                          </span>
                        )}
                        <p className={styles.activityBody}>{post.body}</p>
                      </li>
                    ))}
                    {userPosts.length === 0 && (
                      <li className={styles.activityEmpty}>No posts yet.</li>
                    )}
                  </ul>
                </aside>
              </div>
            </section>

            {/* Specialisations */}
            <section className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <h4 className={styles.sectionTitle}>Specialisations</h4>
                <button
                  type="button"
                  onClick={() => openModal("specialisation")}
                  className={styles.sectionAddBtn}
                >
                  Add
                </button>
              </div>
              <div className={styles.specTagsWrap}>
                {(userProfile.specialisations || []).map((spec) => (
                  <div key={spec._id} className={styles.specTag}>
                    <span>{spec.name}</span>
                    <button
                      type="button"
                      className={styles.specRemoveBtn}
                      onClick={() => removeSpecialisation(spec._id)}
                      aria-label={`Remove ${spec.name}`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        width="14"
                        height="14"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4.22 4.22a.75.75 0 0 1 1.06 0L10 8.94l4.72-4.72a.75.75 0 1 1 1.06 1.06L11.06 10l4.72 4.72a.75.75 0 1 1-1.06 1.06L10 11.06l-4.72 4.72a.75.75 0 1 1-1.06-1.06L8.94 10 4.22 5.28a.75.75 0 0 1 0-1.06Z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
                {(userProfile.specialisations || []).length === 0 && (
                  <p className={styles.emptyInline}>
                    No specialisations added yet.
                  </p>
                )}
              </div>
            </section>

            {/* Work History */}
            <section className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <h4 className={styles.sectionTitle}>Work History</h4>
                <button
                  type="button"
                  onClick={() => openModal("work")}
                  className={styles.sectionAddBtn}
                >
                  Add
                </button>
              </div>
              <div className={styles.tagsWrap}>
                {(userProfile.pastWork || []).map((work, i) => (
                  <div key={i} className={styles.tagCard}>
                    <strong>{work.company}</strong>
                    <span className={styles.tagSub}>{work.position}</span>
                    <span className={styles.tagMeta}>{work.years}</span>
                  </div>
                ))}
                {(userProfile.pastWork || []).length === 0 && (
                  <p className={styles.emptyInline}>No work added yet.</p>
                )}
              </div>
            </section>

            {/* Education */}
            <section className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <h4 className={styles.sectionTitle}>Education</h4>
                <button
                  type="button"
                  onClick={() => openModal("education")}
                  className={styles.sectionAddBtn}
                >
                  Add
                </button>
              </div>
              <div className={styles.tagsWrap}>
                {(userProfile.education || []).map((ed, i) => (
                  <div key={i} className={styles.tagCard}>
                    <strong>{ed.degree}</strong>
                    <span className={styles.tagSub}>{ed.fieldOfStudy}</span>
                    <span className={styles.tagMeta}>{ed.school}</span>
                  </div>
                ))}
                {(userProfile.education || []).length === 0 && (
                  <p className={styles.emptyInline}>No education added yet.</p>
                )}
              </div>
            </section>

            {/* Contact Details */}
            <section className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <h4 className={styles.sectionTitle}>Contact Details</h4>
                <span className={styles.contactNote}>(Visible only to connections)</span>
              </div>
              <div className={styles.contactGrid}>
                <div className={styles.contactField}>
                  <label className={styles.contactLabel}>Phone</label>
                  <input
                    className={styles.inputField}
                    type="tel"
                    placeholder="+1 234 567 8900"
                    value={contact.phone || ""}
                    onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                  />
                </div>
                <div className={styles.contactField}>
                  <label className={styles.contactLabel}>Alternate Email</label>
                  <input
                    className={styles.inputField}
                    type="email"
                    placeholder="alternate@email.com"
                    value={contact.alternateEmail || ""}
                    onChange={(e) => setContact({ ...contact, alternateEmail: e.target.value })}
                  />
                </div>
                <div className={styles.contactField}>
                  <label className={styles.contactLabel}>Address</label>
                  <input
                    className={styles.inputField}
                    type="text"
                    placeholder="City, Country"
                    value={contact.address || ""}
                    onChange={(e) => setContact({ ...contact, address: e.target.value })}
                  />
                </div>
                <div className={styles.contactField}>
                  <label className={styles.contactLabel}>LinkedIn</label>
                  <input
                    className={styles.inputField}
                    type="url"
                    placeholder="https://linkedin.com/in/username"
                    value={contact.linkedin || ""}
                    onChange={(e) => setContact({ ...contact, linkedin: e.target.value })}
                  />
                </div>
                <div className={styles.contactField}>
                  <label className={styles.contactLabel}>GitHub</label>
                  <input
                    className={styles.inputField}
                    type="url"
                    placeholder="https://github.com/username"
                    value={contact.github || ""}
                    onChange={(e) => setContact({ ...contact, github: e.target.value })}
                  />
                </div>
                <div className={styles.contactField}>
                  <label className={styles.contactLabel}>Twitter / X</label>
                  <input
                    className={styles.inputField}
                    type="url"
                    placeholder="https://twitter.com/username"
                    value={contact.twitter || ""}
                    onChange={(e) => setContact({ ...contact, twitter: e.target.value })}
                  />
                </div>
                <div className={styles.contactField}>
                  <label className={styles.contactLabel}>Website</label>
                  <input
                    className={styles.inputField}
                    type="url"
                    placeholder="https://yourwebsite.com"
                    value={contact.website || ""}
                    onChange={(e) => setContact({ ...contact, website: e.target.value })}
                  />
                </div>
              </div>
              <button
                type="button"
                className={styles.saveContactBtn}
                onClick={saveContact}
                disabled={contactSaving}
              >
                {contactSaving ? "Saving..." : "Save Contact Info"}
              </button>
            </section>
            {hasChanges && (
              <div className={styles.bottomActions}>
                <button
                  type="button"
                  className={styles.saveChangesBtn}
                  disabled={saving}
                  onClick={updateProfileData}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            )}
          </div>
        )}

        {isModalOpen && (
          <div
            className={styles.modalOverlay}
            role="dialog"
            aria-modal="true"
            onClick={closeModal}
          >
            <div
              className={styles.modalCard}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <h3 className={styles.modalTitle}>
                  {modalType === "work"
                    ? "Add Work"
                    : modalType === "education"
                    ? "Add Education"
                    : "Add Specialisation"}
                </h3>
                <button
                  type="button"
                  className={styles.modalClose}
                  onClick={closeModal}
                  aria-label="Close"
                >
                  Ã—
                </button>
              </div>
              <div className={styles.modalBody}>
                {modalType === "work" && (
                  <>
                    <input
                      onChange={handleWorkChange}
                      name="company"
                      value={workInput.company}
                      className={styles.inputField}
                      type="text"
                      placeholder="Company"
                    />
                    <input
                      onChange={handleWorkChange}
                      name="position"
                      value={workInput.position}
                      className={styles.inputField}
                      type="text"
                      placeholder="Position"
                    />
                    <input
                      onChange={handleWorkChange}
                      name="years"
                      value={workInput.years}
                      className={styles.inputField}
                      type="text"
                      placeholder="Years (e.g. 2021-2024)"
                    />
                  </>
                )}
                {modalType === "education" && (
                  <>
                    <input
                      onChange={handleEducationChange}
                      name="school"
                      value={educationInput.school}
                      className={styles.inputField}
                      type="text"
                      placeholder="School"
                    />
                    <input
                      onChange={handleEducationChange}
                      name="degree"
                      value={educationInput.degree}
                      className={styles.inputField}
                      type="text"
                      placeholder="Degree"
                    />
                    <input
                      onChange={handleEducationChange}
                      name="fieldOfStudy"
                      value={educationInput.fieldOfStudy}
                      className={styles.inputField}
                      type="text"
                      placeholder="Field of Study"
                    />
                    <input
                      onChange={handleEducationChange}
                      name="years"
                      value={educationInput.years}
                      className={styles.inputField}
                      type="text"
                      placeholder="Years (e.g. 2019-2023)"
                    />
                  </>
                )}
                {modalType === "specialisation" && (
                  <input
                    value={specInput}
                    onChange={(e) => setSpecInput(e.target.value)}
                    className={styles.inputField}
                    type="text"
                    placeholder="e.g. Machine Learning, UI/UX Design"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") addSpecialisation();
                    }}
                  />
                )}
              </div>
              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  onClick={closeModal}
                >
                  Cancel
                </button>
                {modalType === "work" && (
                  <button
                    type="button"
                    className={styles.primaryBtn}
                    onClick={addWork}
                  >
                    Add Work
                  </button>
                )}
                {modalType === "education" && (
                  <button
                    type="button"
                    className={styles.primaryBtn}
                    onClick={addEducation}
                  >
                    Add Education
                  </button>
                )}
                {modalType === "specialisation" && (
                  <button
                    type="button"
                    className={styles.primaryBtn}
                    onClick={addSpecialisation}
                  >
                    Add Specialisation
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </DashboardLayout>
    </UserLayout>
  );
}
