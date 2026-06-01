import mongoose from "mongoose";

const contactSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  phone: {
    type: String,
    default: "",
  },
  alternateEmail: {
    type: String,
    default: "",
  },
  address: {
    type: String,
    default: "",
  },
  linkedin: {
    type: String,
    default: "",
  },
  github: {
    type: String,
    default: "",
  },
  twitter: {
    type: String,
    default: "",
  },
  website: {
    type: String,
    default: "",
  },
});

const Contact = mongoose.model("Contact", contactSchema);
export default Contact;
