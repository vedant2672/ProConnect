import { Router } from "express";
import {
  login,
  register,
  uploadProfilePicture,
  updateUserProfile,
  getUserAndProfile,
  updateProfileData,
  getAllUserProfile,
  downloadProfile,
  sendConnectionRequest,
  whatAreMyConnectionRequests,
  acceptConnectionRequest,
  getMyConnections,
  getUserProfileAndUserBasedOnUsername,
  addSpecialisation,
  removeSpecialisation,
  googleLogin,
  updateContact,
  getMyContact,
  getContactForUser,
} from "../controllers/user.controller.js";
import multer from "multer";

const router = Router();

// Use memory storage so file buffer can be sent directly to Cloudinary
const upload = multer({ storage: multer.memoryStorage() });

router
  .route("/update_profile_picture")
  .post(upload.single("profile_picture"), uploadProfilePicture);

router.route("/register").post(register);
router.route("/login").post(login);

router.route("/user_update").post(updateUserProfile);
router.route("/get_user_and_profile").get(getUserAndProfile);
router.route("/update_profile_data").post(updateProfileData);
router.route("/user/get_all_users").get(getAllUserProfile);
router.route("/user/download_resume").get(downloadProfile);
router.route("/user/send_connection_request").post(sendConnectionRequest);
router.route("/user/getConnectionsRequest").get(getMyConnections);
router.route("/user/user_connection_request").get(whatAreMyConnectionRequests);
router.route("/user/accept_connection_request").post(acceptConnectionRequest);
router
  .route("/user/get_profile_based_on_username")
  .get(getUserProfileAndUserBasedOnUsername);
router.route("/user/add_specialisation").post(addSpecialisation);
router.route("/user/remove_specialisation").post(removeSpecialisation);

router.route("/auth/google").post(googleLogin);

router.route("/user/update_contact").post(updateContact);
router.route("/user/get_my_contact").get(getMyContact);
router.route("/user/get_contact").get(getContactForUser);
export default router;