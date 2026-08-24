export interface Problem {
  _id: string;
  title: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  testCases: { input: string; expectedOutput: string }[];
}

export interface Contest {
  _id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  problems: Problem[];
  participants: string[];
}

export interface Submission {
  _id: string;
  userId: string;
  contestId: string;
  problemId: string;
  code: string;
  language: string;
  status: "pending" | "accepted" | "wrong_answer" | "runtime_error" | "tle";
  score: number;
  submittedAt: Date;
}