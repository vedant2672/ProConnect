import mongoose from "mongoose";

const specialisationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
});

const Specialisation = mongoose.model("Specialisation", specialisationSchema);
export default Specialisation;