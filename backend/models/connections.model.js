import mongoose from "mongoose";

const connectionSchema = new mongoose.Schema({
  userId: {
    //kisne
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  connectionId: {
    //kiske ko
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  status_accepted: {
    type: Boolean,
    default: null,
  },
});

const ConnectionRequest = mongoose.model("ConnectionRequest", connectionSchema);
export default ConnectionRequest;
