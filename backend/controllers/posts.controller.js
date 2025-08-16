import Profile from "../models/profile.model.js";
import User from "../models/user.model.js";
import multer from "multer";
import cloudinary from "../config/cloudinary.js";
import Post from "../models/post.model.js";
import Comment from "../models/comments.model.js";

export const activeCheck = async (req, res) => {
  return res.status(200).json({ message: "Posts route is working" });
};

export const createPost = async (req, res) => {
  const { token } = req.body;

  try {
    const user = await User.findOne({ token: token });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let mediaUrl = "";
    let fileType = "";
    if (req.file) {
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
      try {
        const uploadResult = await new Promise((resolve, reject) => {
          try {
            const stream = cloudinary.uploader.upload_stream(
              {
                folder: "post_media",
                resource_type: "image",
                transformation: [
                  { width: 1280, crop: "limit" },
                  { quality: "auto" },
                ],
                overwrite: false,
              },
              (err, uploaded) => {
                if (err) return reject(err);
                resolve(uploaded);
              }
            );
            stream.end(req.file.buffer);
          } catch (err) {
            reject(err);
          }
        });
        mediaUrl = uploadResult.secure_url;
        fileType = uploadResult.format || req.file.mimetype.split("/")[1] || "";
      } catch (e) {
        return res
          .status(500)
          .json({ message: "Media upload failed: " + (e.message || e) });
      }
    }

    const post = new Post({
      userId: user._id,
      body: req.body.body,
      media: mediaUrl,
      fileType: fileType,
    });

    await post.save();
    return res.status(200).json({ message: "Post created successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find().populate(
      "userId",
      "name username email profilePicture"
    );
    return res.json({ posts });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const deletePost = async (req, res) => {
  const { token, post_id } = req.body;

  try {
    const user = await User.findOne({ token: token }).select("_id");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const post = await Post.findOne({ _id: post_id });

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (post.userId.toString() !== user._id.toString()) {
      return res
        .status(401)
        .json({ message: "You are not authorized to delete this post" });
    }

    await Post.deleteOne({ _id: post_id });
    return res.json({ message: "Post deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const commentPost = async (req, res) => {
  const { token, post_id, commentBody } = req.body;

  try {
    const user = await User.findOne({ token: token }).select("_id");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const post = await Post.findOne({ _id: post_id });
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const comment = new Comment({
      userId: user._id,
      postId: post._id,
      body: commentBody,
    });

    await comment.save();

    return res.status(200).json({ message: "Comment added successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const delete_comment_of_user = async (req, res) => {
  const { token, comment_id } = req.body;

  try {
    const user = await User.findOne({ token: token }).select("_id");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const comment = await Comment.findOne({ _id: comment_id });

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    if (comment.userId.toString() !== user._id.toString()) {
      return res
        .status(401)
        .json({ message: "You are not authorized to delete this comment" });
    }

    await Comment.deleteOne({ _id: comment_id });
    return res.json({ message: "Comment deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const increment_likes = async (req, res) => {
  const { post_id } = req.body;

  try {
    const post = await Post.findOne({ _id: post_id });
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    post.likes += 1;

    await post.save();
    return res.json({ message: "Post liked successfully" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const get_comments_by_post = async (req, res) => {
  const { post_id } = req.query;

  try {
    const post = await Post.findOne({ _id: post_id });

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const comments = await Comment.find({ postId: post._id }).populate(
      "userId",
      "username name"
    );

    return res.json(comments.reverse());
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
