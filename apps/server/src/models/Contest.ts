import { Schema, model, Document } from "mongoose";

export interface IContest extends Document {
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  problems: Schema.Types.ObjectId[];
  participants: Schema.Types.ObjectId[];
  createdBy: Schema.Types.ObjectId;
  status: "upcoming" | "live" | "ended";
  createdAt: Date;
}

const contestSchema = new Schema<IContest>({
  title: { type: String, required: true },
  description: { type: String, default: "" },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  problems: [{ type: Schema.Types.ObjectId, ref: "Problem" }],
  participants: [{ type: Schema.Types.ObjectId, ref: "User" }],
  createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  status: {
    type: String,
    enum: ["upcoming", "live", "ended"],
    default: "upcoming",
  },
  createdAt: { type: Date, default: Date.now },
});

export const Contest = model<IContest>("Contest", contestSchema);