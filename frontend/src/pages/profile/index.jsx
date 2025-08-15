import { getAboutUser } from "@/config/redux/action/authAction";
import DashboardLayout from "@/layout/DashboardLayout";
import UserLayout from "@/layout/UserLayout";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import styles from "./index.module.css";
import { BASE_URL, clientServer } from "@/config";
import { getAllPosts } from "@/config/redux/action/postAction";

export default function ProfilePage() {
  const authState = useSelector((state) => state.auth);
  const postReducer = useSelector((state) => state.postReducer);

  const [userProfile, setUserProfile] = useState({});

  const [userPosts, setUserPosts] = useState([]);

  const dispatch = useDispatch();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState(null); // 'work' | 'education' | null

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

  useEffect(() => {
    dispatch(getAboutUser({ token: localStorage.getItem("token") }));
    dispatch(getAllPosts());
  }, []);

  useEffect(() => {
    if (authState.user != undefined) {
      setUserProfile(authState.user);

      let post = postReducer.posts.filter((post) => {
        return post.userId.username === authState.user.userId.username;
      });

      setUserPosts(post);
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

  const updateProfileData = async () => {
    const request = await clientServer.post("/user_update", {
      token: localStorage.getItem("token"),
      name: userProfile.userId.name,
    });

    const response = await clientServer.post("/update_profile_data", {
      token: localStorage.getItem("token"),
      bio: userProfile.bio,
      currentPost: userProfile.currentPost,
      pastWork: userProfile.pastWork,
      education: userProfile.education,
    });

    dispatch(getAboutUser({ token: localStorage.getItem("token") }));
  };

  return (
    <UserLayout>
      <DashboardLayout>
        {authState.user && userProfile.userId && (
          <div className={styles.container}>
            <div className={styles.backDropContainer}>
              <label
                htmlFor="profilePictureUpload"
                className={styles.backDrop__overlay}
              >
                <p>Edit</p>
              </label>
              <input
                onChange={(e) => {
                  updateProfilePicture(e.target.files[0]);
                }}
                hidden
                type="file"
                id="profilePictureUpload"
              />
              <img
                src={`${BASE_URL}/${userProfile.userId.profilePicture}`}
                alt="backdrop"
              />
            </div>

            <div className={styles.profileContainer__details}>
              <div style={{ display: "flex", gap: "0.7rem" }}>
                <div style={{ flex: "0.8" }}>
                  <div
                    style={{
                      display: "flex",
                      width: "fit-content",
                      alignItems: "center",
                      gap: "1.2rem",
                    }}
                  >
                    <input
                      className={styles.nameEdit}
                      type="text"
                      value={userProfile.userId.name}
                      onChange={(e) => {
                        setUserProfile({
                          ...userProfile,
                          userId: {
                            ...userProfile.userId,
                            name: e.target.value,
                          },
                        });
                      }}
                    />
                    <p style={{ color: "grey" }}>
                      @{userProfile.userId.username}
                    </p>
                  </div>
                  <div>
                    <textarea
                      value={userProfile.bio}
                      onChange={(e) => {
                        setUserProfile({
                          ...userProfile,
                          bio: e.target.value,
                        });
                      }}
                      rows={Math.max(3, Math.ceil(userProfile.bio.length / 80))}
                      style={{ width: "100%" }}
                    />
                  </div>
                </div>
                <div style={{ flex: "0.2" }}>
                  <h3>Recent Activity</h3>
                  {userPosts.map((post) => {
                    return (
                      <div key={post._id} className={styles.postCard}>
                        <div className={styles.card}>
                          <div className={styles.card__profileContainer}>
                            {post.media !== "" ? (
                              <img
                                src={`${BASE_URL}/${post.media}`}
                                alt="post media"
                              />
                            ) : (
                              <div style={{ width: "3.4em", height: "3.4em" }}>
                                {" "}
                              </div>
                            )}
                          </div>
                          <p>{post.body}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="workHistory">
              <h4>Work History</h4>

              <div className={styles.workHistoryContainer}>
                {(userProfile.pastWork || []).map((work, index) => {
                  return (
                    <div key={index} className={styles.workHistoryCard}>
                      <p
                        style={{
                          fontWeight: "bold",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.8rem",
                        }}
                      >
                        {work.company} - {work.position}
                      </p>
                      <p>{work.years}</p>
                    </div>
                  );
                })}
                <button
                  className={styles.addWorkBtn}
                  onClick={() => openModal("work")}
                >
                  Add Work
                </button>
              </div>
            </div>
            <div className="education">
              <h4>Education</h4>

              <div className={styles.workHistoryContainer}>
                {(userProfile.education || []).map((education, index) => {
                  return (
                    <div key={index} className={styles.workHistoryCard}>
                      <p
                        style={{
                          fontWeight: "bold",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.8rem",
                        }}
                      >
                        {education.degree} - {education.fieldOfStudy}
                      </p>
                      <p>{education.school}</p>
                    </div>
                  );
                })}
                <button
                  className={styles.addWorkBtn}
                  onClick={() => openModal("education")}
                >
                  Add Education
                </button>
              </div>
            </div>

            {userProfile != authState.user && (
              <div
                onClick={() => {
                  updateProfileData();
                }}
                className={styles.updateProfileBtn}
              >
                Update Profile{" "}
              </div>
            )}
          </div>
        )}

        {isModalOpen && (
          <div onClick={closeModal} className={styles.commentsContainer}>
            <div
              onClick={(e) => e.stopPropagation()}
              className={styles.allCommentsContainer}
            >
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
                    type="number"
                    placeholder="Years"
                  />
                  <div onClick={addWork} className={styles.updateProfileBtn}>
                    Add Work
                  </div>
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

                  <div
                    onClick={addEducation}
                    className={styles.updateProfileBtn}
                  >
                    Add Education
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </DashboardLayout>
    </UserLayout>
  );
}
