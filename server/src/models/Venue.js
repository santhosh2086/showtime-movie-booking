import mongoose from "mongoose";

const venueSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    loc: { type: String, trim: true },
    order: { type: Number, default: 0 }
  },
  { timestamps: true }
);

venueSchema.methods.toClient = function () {
  return { name: this.name, loc: this.loc };
};

export default mongoose.model("Venue", venueSchema);
