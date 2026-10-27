import { Schema, model, Document, Types } from "mongoose";

export interface ISubmission extends Document {
  userId: Schema.Types.ObjectId;
  contestId: Schema.Types.ObjectId;
  problemId: Schema.Types.ObjectId;
  code: string;
  language: string;
  status: "pending" | "accepted" | "wrong_answer" | "runtime_error" | "tle";
  runtimeMs?: number;
  score: number;
  penalty: number;
  submittedAt: Date;
}

const submissionSchema = new Schema<ISubmission>({
  userId: {
     type: Schema.Types.ObjectId,
     ref: "User",
     required: true
   },
  contestId: {
     type: Schema.Types.ObjectId,
     ref: "Contest",
     required: true
   },
  problemId: {
     type: Schema.Types.ObjectId,
     ref: "Problem",
     required: true
   },
  code: {
     type: String,
     required: true
   },
  language: {
     type: String,
     required: true
   },
  status: {
    type: String,
    enum: ["pending", "accepted", "wrong_answer", "runtime_error", "tle"],
    default: "pending",
   },
  runtimeMs: {
    type: Number
   },
  score: {
    type: Number,
    default: 0
   },
  penalty: {
    type: Number,
    default: 0
   },
  submittedAt: {
    type: Date,
    default: Date.now
   },
});

submissionSchema.index({ contestId: 1, userId: 1 });

export const Submission = model<ISubmission>("Submission", submissionSchema);