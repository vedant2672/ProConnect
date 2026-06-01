import bcrypt from "bcrypt";
import User from "../models/user.model.js";
import Profile from "../models/profile.model.js";
import Specialisation from "../models/specialisation.model.js";
import Contact from "../models/contact.model.js";
import ConnectionRequest from "../models/connections.model.js";
import crypto from "crypto";
import PDFDocument from "pdfkit";
import fs from "fs";
import https from "https";
import cloudinary from "../config/cloudinary.js";
import { OAuth2Client } from "google-auth-library";

const fetchRemoteBuffer = (url) =>
  new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode !== 200) {
          return reject(new Error("Failed to fetch image: " + res.statusCode));
        }
        const data = [];
        res
          .on("data", (d) => data.push(d))
          .on("end", () => resolve(Buffer.concat(data)))
          .on("error", reject);
      })
      .on("error", reject);
  });

const convertUserDataToPDF = async (userData) => {
  const doc = new PDFDocument({ margin: 50 });

  const outputPath = crypto.randomBytes(16).toString("hex") + ".pdf";
  const outDir = "uploads";
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const stream = fs.createWriteStream(`${outDir}/${outputPath}`);
  doc.pipe(stream);

  const primary = "#1f4e79";
  const lightGray = "#444";

  const pageWidth = doc.page.width;
  const marginLeft = doc.page.margins.left;
  const marginRight = doc.page.margins.right;
  const contentRightX = pageWidth - marginRight;
  const AVATAR_SIZE = 110;
  const AVATAR_X = contentRightX - AVATAR_SIZE;
  const AVATAR_Y = doc.y;
  let avatarBottom = AVATAR_Y;

  const drawCircularImage = (bufferOrPath) => {
    try {
      doc.save();
      doc
        .circle(
          AVATAR_X + AVATAR_SIZE / 2,
          AVATAR_Y + AVATAR_SIZE / 2,
          AVATAR_SIZE / 2
        )
        .clip();
      doc.image(bufferOrPath, AVATAR_X, AVATAR_Y, {
        width: AVATAR_SIZE,
        height: AVATAR_SIZE,
        fit: [AVATAR_SIZE, AVATAR_SIZE],
      });
      doc.restore();
      avatarBottom = AVATAR_Y + AVATAR_SIZE;
    } catch {}
  };

  try {
    const pic = userData.userId.profilePicture;
    let placed = false;
    if (pic) {
      if (/^https?:\/\//i.test(pic)) {
        try {
          const buf = await fetchRemoteBuffer(pic);
          drawCircularImage(buf);
          placed = true;
        } catch {}
      } else {
        const localPath = `${outDir}/${pic}`;
        if (fs.existsSync(localPath)) {
          drawCircularImage(localPath);
          placed = true;
        }
      }
    }
    if (!placed) {
      const fallback = "uploads/default.jpg";
      if (fs.existsSync(fallback)) drawCircularImage(fallback);
    }
  } catch {}

  const textWidthLimit = AVATAR_X - marginLeft - 15;
  const startY = AVATAR_Y;
  doc
    .fillColor(primary)
    .fontSize(26)
    .text(userData.userId.name || "Unnamed User", marginLeft, startY, {
      width: textWidthLimit,
      continued: false,
    });
  doc
    .moveDown(0.3)
    .fillColor(lightGray)
    .fontSize(12)
    .text(
      `${userData.userId.username || ""} | ${userData.userId.email || ""}`,
      { width: textWidthLimit }
    );

  const headerBottom = Math.max(doc.y, avatarBottom);
  doc.y = headerBottom + 12;

  doc
    .moveTo(marginLeft, doc.y)
    .lineTo(contentRightX, doc.y)
    .strokeColor(primary)
    .lineWidth(2)
    .stroke();
  doc.moveDown();

  const sectionTitle = (title) => {
    doc
      .moveDown(0.6)
      .fillColor(primary)
      .fontSize(16)
      .text(title.toUpperCase(), { underline: false });
    doc.fillColor("black").moveDown(0.2);
  };

  if (userData.bio) {
    sectionTitle("Summary");
    doc.fontSize(12).text(userData.bio, { lineGap: 3 });
  }

  if (userData.currentPost) {
    sectionTitle("Current Position");
    doc.fontSize(12).text(userData.currentPost, { lineGap: 3 });
  }

  // Specialisations
  if (userData.specialisations && userData.specialisations.length) {
    sectionTitle("Specialisations");
    const specNames = userData.specialisations.map((s) => s.name).join(", ");
    doc.fontSize(12).text(specNames, { lineGap: 3 });
  }

  if (userData.pastWork && userData.pastWork.length) {
    sectionTitle("Work Experience");
    userData.pastWork.forEach((work) => {
      doc
        .fontSize(13)
        .fillColor("#000")
        .text(work.position || "Role", { continued: true })
        .fillColor(lightGray)
        .fontSize(11)
        .text(`  @ ${work.company || "Company"}`);
      if (work.years) {
        doc.fontSize(10).fillColor("#666").text(work.years);
      }
      doc.moveDown(0.3);
    });
  }

  if (userData.education && userData.education.length) {
    sectionTitle("Education");
    userData.education.forEach((edu) => {
      doc
        .fontSize(13)
        .fillColor("#000")
        .text(edu.school || "School", { continued: true })
        .fillColor(lightGray)
        .fontSize(11)
        .text(
          `  - ${edu.degree || ""} ${
            edu.fieldOfStudy ? "(" + edu.fieldOfStudy + ")" : ""
          }`
        );
      doc.moveDown(0.3);
    });
  }

  doc.moveDown();
  doc
    .strokeColor("#ccc")
    .lineWidth(1)
    .moveTo(50, doc.y)
    .lineTo(545, doc.y)
    .stroke();
  doc
    .fontSize(9)
    .fillColor("#666")
    .text("Generated by ProConnect", 50, doc.y + 4, { align: "center" });

  doc.end();
  return outputPath;
};

export const register = async (req, res) => {
  try {
    const { name, email, password, username } = req.body;
    if (!name || !email || !password || !username) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const user = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (user) {
      return res
        .status(400)
        .json({ message: "User with this email or username already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      username,
    });
    await newUser.save();

    const profile = new Profile({ userId: newUser._id });
    await profile.save();

    return res.json({ message: "User Created!" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Google-only users have no password set
    if (!user.password) {
      return res.status(400).json({
        message: "This account uses Google sign-in. Please use the Google button to log in.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }

    const token = crypto.randomBytes(16).toString("hex");

    await User.updateOne({ _id: user._id }, { token });

    return res.json({ token: token });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const uploadProfilePicture = async (req, res) => {
  const { token } = req.body;
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    const user = await User.findOne({ token });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      return res.status(500).json({
        message:
          "Cloudinary credentials missing on server. Ask admin to set environment variables.",
      });
    }

    const result = await new Promise((resolve, reject) => {
      try {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "profile_pics",
            resource_type: "image",
            transformation: [{ width: 400, height: 400, crop: "limit" }],
            overwrite: false,
          },
          (err, uploaded) => {
            if (err) return reject(err);
            resolve(uploaded);
          }
        );
        stream.end(req.file.buffer);
      } catch (e) {
        reject(e);
      }
    });

    user.profilePicture = result.secure_url;
    await user.save();
    return res.json({
      message: "Profile picture uploaded",
      url: result.secure_url,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Upload failed" });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const { token, ...newUserData } = req.body;

    const user = await User.findOne({ token: token });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { username, email } = newUserData;

    const existingUser = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (existingUser) {
      if (existingUser || String(existingUser._id) !== String(user._id)) {
        return res
          .status(400)
          .json({ message: "Username or email already exists" });
      }
    }

    Object.assign(user, newUserData);
    await user.save();
    return res.json({ message: "User updated successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getUserAndProfile = async (req, res) => {
  try {
    const { token } = req.query;

    const user = await User.findOne({ token: token });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const userProfile = await Profile.findOne({ userId: user._id }).populate(
      "userId",
      "name email username profilePicture"
    );

    const specialisations = await Specialisation.find({ userId: user._id });

    return res.json({
      profile: {
        ...userProfile.toObject(),
        specialisations,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const updateProfileData = async (req, res) => {
  try {
    const { token, ...newProfileData } = req.body;

    const userProfile = await User.findOne({ token: token });
    if (!userProfile) {
      return res.status(404).json({ message: "User not found" });
    }

    const profile_to_update = await Profile.findOne({
      userId: userProfile._id,
    });

    Object.assign(profile_to_update, newProfileData);
    await profile_to_update.save();
    return res.json({ message: "Profile updated successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getAllUserProfile = async (req, res) => {
  try {
    const profiles = await Profile.find().populate(
      "userId",
      "name email username profilePicture"
    );

    const allSpecialisations = await Specialisation.find();

    const specMap = {};
    allSpecialisations.forEach((s) => {
      const uid = s.userId.toString();
      if (!specMap[uid]) specMap[uid] = [];
      specMap[uid].push(s);
    });

    const profilesWithSpecs = profiles
      .filter((p) => p.userId != null)
      .map((p) => {
        const obj = p.toObject();
        obj.specialisations = specMap[obj.userId._id.toString()] || [];
        return obj;
      });

    return res.json({ profiles: profilesWithSpecs });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const downloadProfile = async (req, res) => {
  try {
    const user_id = req.query.id;
    const userProfile = await Profile.findOne({ userId: user_id }).populate(
      "userId",
      "name email username profilePicture"
    );
    if (!userProfile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    const specialisations = await Specialisation.find({ userId: user_id });
    const profileData = {
      ...userProfile.toObject(),
      specialisations,
    };

    const outputPath = await convertUserDataToPDF(profileData);
    return res.json({ message: outputPath });
  } catch (err) {
    return res
      .status(500)
      .json({ message: err.message || "Failed to generate PDF" });
  }
};

export const addSpecialisation = async (req, res) => {
  try {
    const { token, name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Specialisation name is required" });
    }

    const user = await User.findOne({ token });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const existing = await Specialisation.findOne({
      userId: user._id,
      name: name.trim(),
    });
    if (existing) {
      return res.status(400).json({ message: "Specialisation already exists" });
    }

    const spec = new Specialisation({
      userId: user._id,
      name: name.trim(),
    });
    await spec.save();

    return res.json({ message: "Specialisation added", specialisation: spec });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const removeSpecialisation = async (req, res) => {
  try {
    const { token, specialisationId } = req.body;

    const user = await User.findOne({ token });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const spec = await Specialisation.findOne({
      _id: specialisationId,
      userId: user._id,
    });
    if (!spec) {
      return res.status(404).json({ message: "Specialisation not found" });
    }

    await Specialisation.deleteOne({ _id: specialisationId });

    return res.json({ message: "Specialisation removed" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const sendConnectionRequest = async (req, res) => {
  const { token, connectionId } = req.body;

  try {
    const user = await User.findOne({ token: token });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const connectionUser = await User.findOne({ _id: connectionId });

    if (!connectionUser) {
      return res.status(404).json({ message: "Connection user not found" });
    }

    const existingRequest = await ConnectionRequest.findOne({
      userId: user._id,
      connectionId: connectionUser._id,
    });

    if (existingRequest) {
      return res
        .status(400)
        .json({ message: "Connection request already sent" });
    }

    const request = new ConnectionRequest({
      userId: user._id,
      connectionId: connectionUser._id,
    });

    await request.save();

    return res.json({ message: "Connection request sent successfully" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const getMyConnections = async (req, res) => {
  const { token } = req.query;

  try {
    const user = await User.findOne({ token: token });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const connections = await ConnectionRequest.find({
      userId: user._id,
    }).populate("connectionId", "name  username email profilePicture");

    return res.json({ connections });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const whatAreMyConnectionRequests = async (req, res) => {
  const { token } = req.query;

  try {
    const user = await User.findOne({ token: token });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const connections = await ConnectionRequest.find({
      connectionId: user._id,
    }).populate("userId", "name username email profilePicture");

    return res.json(connections);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const acceptConnectionRequest = async (req, res) => {
  const { token, requestId, action_type } = req.body;

  try {
    const user = await User.findOne({ token: token });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const connection = await ConnectionRequest.findOne({
      _id: requestId,
    });

    if (!connection) {
      return res.status(404).json({ message: "Connection request not found" });
    }

    if (action_type === "accept") {
      connection.status_accepted = true;
    } else {
      connection.status_accepted = false;
    }

    await connection.save();
    return res.json({ message: "Connection request updated successfully" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const getUserProfileAndUserBasedOnUsername = async (req, res) => {
  const { username } = req.query;

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const userProfile = await Profile.findOne({ userId: user._id }).populate(
      "userId",
      "name username email profilePicture"
    );

    const specialisations = await Specialisation.find({ userId: user._id });

    return res.json({
      profile: {
        ...userProfile.toObject(),
        specialisations,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const googleLogin = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ message: "Authorization code is required" });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000/auth/google/callback";

    if (!clientId || !clientSecret) {
      return res.status(500).json({ message: "Google OAuth credentials not configured on server" });
    }

    const oAuth2Client = new OAuth2Client(clientId, clientSecret, redirectUri);

    // Exchange authorization code for tokens
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);

    // Verify the ID token to get user info
    const ticket = await oAuth2Client.verifyIdToken({
      idToken: tokens.id_token,
      audience: clientId,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    if (!email) {
      return res.status(400).json({ message: "Could not retrieve email from Google" });
    }

    // Check if user exists by googleId or email
    let user = await User.findOne({ $or: [{ googleId }, { email }] });
    const token = crypto.randomBytes(16).toString("hex");

    if (user) {
      // Update googleId if not set (e.g. user previously registered with email/password)
      if (!user.googleId) {
        user.googleId = googleId;
      }
      if (picture && user.profilePicture === "default.jpg") {
        user.profilePicture = picture;
      }
      user.token = token;
      await user.save();
    } else {
      // Create new user + profile
      const username = email.split("@")[0] + "_" + crypto.randomBytes(3).toString("hex");
      user = new User({
        name: name || email.split("@")[0],
        email,
        username,
        googleId,
        profilePicture: picture || "default.jpg",
        token,
        password: "",
      });
      await user.save();

      const profile = new Profile({ userId: user._id });
      await profile.save();
    }

    return res.json({ token });
  } catch (error) {
    console.error("Google OAuth error:", error);
    return res.status(500).json({ message: error.message || "Google authentication failed" });
  }
};
export const updateContact = async (req, res) => {
  try {
    const { token, phone, alternateEmail, address, linkedin, github, twitter, website } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Token is required" });
    }

    const user = await User.findOne({ token });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let contact = await Contact.findOne({ userId: user._id });
    
    if (!contact) {
      contact = new Contact({ userId: user._id });
    }

    if (phone !== undefined) contact.phone = phone;
    if (alternateEmail !== undefined) contact.alternateEmail = alternateEmail;
    if (address !== undefined) contact.address = address;
    if (linkedin !== undefined) contact.linkedin = linkedin;
    if (github !== undefined) contact.github = github;
    if (twitter !== undefined) contact.twitter = twitter;
    if (website !== undefined) contact.website = website;

    await contact.save();
    return res.json({ message: "Contact updated", contact });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getMyContact = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ message: "Token is required" });
    }

    const user = await User.findOne({ token });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const contact = await Contact.findOne({ userId: user._id });
    return res.json({ contact: contact || {} });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getContactForUser = async (req, res) => {
  try {
    const { token, userId } = req.query;

    if (!token || !userId) {
      return res.status(400).json({ message: "Token and userId are required" });
    }

    const currentUser = await User.findOne({ token });
    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if they are connected (either direction, status_accepted = true)
    const connection = await ConnectionRequest.findOne({
      $or: [
        { userId: currentUser._id, connectionId: userId, status_accepted: true },
        { userId: userId, connectionId: currentUser._id, status_accepted: true },
      ],
    });

    if (!connection) {
      return res.status(403).json({ message: "You must be connected to view contact details" });
    }

    const contact = await Contact.findOne({ userId });
    return res.json({ contact: contact || {} });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
