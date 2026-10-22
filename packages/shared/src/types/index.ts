export interface User {
  _id: string;
  username: string;
  email: string;
  createdAt: Date;
}

export interface TestCase {
  input: string;
  expectedOutput: string;
  isHidden: boolean;
}

export interface Problem {
  _id: string;
  title: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  constraints: string;
  testCases: TestCase[];
  timeLimitMs: number;
  memoryLimitMb: number;
  createdBy: string; 
  createdAt: Date;
}

export interface Contest {
  _id: string;
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  problems: string[]; 
  participants: string[]; 
  createdBy: string; 
  status: "upcoming" | "live" | "ended";
  createdAt: Date;
}

export interface Submission {
  _id: string;
  userId: string;
  contestId: string;
  problemId: string;
  code: string;
  language: string;
  status: "pending" | "accepted" | "wrong_answer" | "runtime_error" | "tle";
  runtimeMs?: number;
  score: number;
  penalty: number;
  submittedAt: Date;
}