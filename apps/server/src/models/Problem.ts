import { Schema, model, Document, Types } from "mongoose";

export interface ITestCase {
  input: string;
  expectedOutput: string;
  isHidden: boolean;
}

export interface IProblem extends Document {
  title: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  constraints: string;
  testCases: ITestCase[];
  timeLimitMs: number;
  memoryLimitMb: number;
  createdBy: Types.ObjectId;
  createdAt: Date;
}

const testCaseSchema = new Schema<ITestCase>(
  {
    input: { type: String, required: true },
    expectedOutput: { type: String, required: true },
    isHidden: { type: Boolean, default: false },
  },
  { _id: false }
);

const problemSchema = new Schema<IProblem>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  difficulty: {
    type: String,
    enum: ["easy", "medium", "hard"],
    required: true,
  },
  constraints: { type: String, default: "" },
  testCases: { type: [testCaseSchema], required: true },
  timeLimitMs: { type: Number, default: 2000 },
  memoryLimitMb: { type: Number, default: 256 },
  createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now },
});

export const Problem = model<IProblem>("Problem", problemSchema);