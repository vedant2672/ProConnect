import bcrypt from "bcrypt";
import User from "../models/user.model.js";
import Profile from "../models/profile.model.js";
import ConnectionRequest from "../models/connections.model.js";
import crypto from "crypto";
import PDFDocument from "pdfkit";
import fs from "fs";
import https from "https";
import cloudinary from "../config/cloudinary.js";

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

  const primary = '#1f4e79';
  const lightGray = '#444';

  // Header with name & avatar (circular) positioned dynamically
  const pageWidth = doc.page.width;
  const marginLeft = doc.page.margins.left;
  const marginRight = doc.page.margins.right;
  const contentRightX = pageWidth - marginRight;
  const AVATAR_SIZE = 110; // diameter
  const AVATAR_X = contentRightX - AVATAR_SIZE; // right aligned
  const AVATAR_Y = doc.y; // top current y
  let avatarBottom = AVATAR_Y;

  const drawCircularImage = (bufferOrPath) => {
    try {
      doc.save();
      // Circle clipping path
      doc.circle(AVATAR_X + AVATAR_SIZE / 2, AVATAR_Y + AVATAR_SIZE / 2, AVATAR_SIZE / 2).clip();
      doc.image(bufferOrPath, AVATAR_X, AVATAR_Y, { width: AVATAR_SIZE, height: AVATAR_SIZE, fit: [AVATAR_SIZE, AVATAR_SIZE] });
      doc.restore();
      avatarBottom = AVATAR_Y + AVATAR_SIZE;
    } catch {}
  };

  try {
    const pic = userData.userId.profilePicture;
    let placed = false;
    if (pic) {
      if (/^https?:\/\//i.test(pic)) {
        try { const buf = await fetchRemoteBuffer(pic); drawCircularImage(buf); placed = true; } catch {}
      } else {
        const localPath = `${outDir}/${pic}`;
        if (fs.existsSync(localPath)) { drawCircularImage(localPath); placed = true; }
      }
    }
    if (!placed) {
      const fallback = 'uploads/default.jpg';
      if (fs.existsSync(fallback)) drawCircularImage(fallback);
    }
  } catch {}

  // Text block left of avatar
  const textWidthLimit = AVATAR_X - marginLeft - 15; // leave gap before avatar
  const startY = AVATAR_Y;
  doc.fillColor(primary).fontSize(26).text(userData.userId.name || 'Unnamed User', marginLeft, startY, { width: textWidthLimit, continued: false });
  doc.moveDown(0.3).fillColor(lightGray).fontSize(12).text(`${userData.userId.username || ''} | ${userData.userId.email || ''}`, { width: textWidthLimit });

  // After header ensure cursor is below avatar
  const headerBottom = Math.max(doc.y, avatarBottom);
  doc.y = headerBottom + 12; // push below avatar area

  // Separator line across full content width
  doc.moveTo(marginLeft, doc.y).lineTo(contentRightX, doc.y).strokeColor(primary).lineWidth(2).stroke();
  doc.moveDown();

  const sectionTitle = (title) => {
    doc
      .moveDown(0.6)
      .fillColor(primary)
      .fontSize(16)
      .text(title.toUpperCase(), { underline: false });
    doc.fillColor('black').moveDown(0.2);
  };

  // Summary / Bio
  if (userData.bio) {
    sectionTitle('Summary');
    doc.fontSize(12).text(userData.bio, { lineGap: 3 });
  }

  // Current Position
  if (userData.currentPost) {
    sectionTitle('Current Position');
    doc.fontSize(12).text(userData.currentPost, { lineGap: 3 });
  }

  // Work Experience
  if (userData.pastWork && userData.pastWork.length) {
    sectionTitle('Work Experience');
    userData.pastWork.forEach((work) => {
      doc
        .fontSize(13)
        .fillColor('#000')
        .text(work.position || 'Role', { continued: true })
        .fillColor(lightGray)
        .fontSize(11)
        .text(`  @ ${work.company || 'Company'}`);
      if (work.years) {
        doc.fontSize(10).fillColor('#666').text(work.years);
      }
      doc.moveDown(0.3);
    });
  }

  // Education
  if (userData.education && userData.education.length) {
    sectionTitle('Education');
    userData.education.forEach((edu) => {
      doc
        .fontSize(13)
        .fillColor('#000')
        .text(edu.school || 'School', { continued: true })
        .fillColor(lightGray)
        .fontSize(11)
        .text(`  - ${edu.degree || ''} ${edu.fieldOfStudy ? '(' + edu.fieldOfStudy + ')' : ''}`);
      doc.moveDown(0.3);
    });
  }

  // Footer
  doc.moveDown();
  doc.strokeColor('#ccc').lineWidth(1).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
  doc
    .fontSize(9)
    .fillColor('#666')
    .text('Generated by ProConnect', 50, doc.y + 4, { align: 'center' });

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

    // Quick sanity check for Cloudinary credentials
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

    user.profilePicture = result.secure_url; // store full URL
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

    return res.json({ profile: userProfile });
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
    return res.json({ profiles });
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
    const outputPath = await convertUserDataToPDF(userProfile);
    return res.json({ message: outputPath });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Failed to generate PDF" });
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
    return res.json({ profile: userProfile });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
