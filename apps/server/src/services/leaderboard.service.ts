import { redis } from "../config/redis";

const K = 10_000_000;
const WRONG_PENALTY_MIN = 20;

const lbKey = (c: string) => `contest:${c}:leaderboard`;
const solvedKey = (c: string, u: string) => `contest:${c}:solved:${u}`;
const wrongKey = (c: string, u: string) => `contest:${c}:wrong:${u}`;

export const registerParticipant = (contestId: string, userId: string) =>
  redis.zadd(lbKey(contestId), "NX", 0, userId); 

export const recordWrongAttempt = async (contestId: string, userId: string, problemId: string) => {
  
    
  if (await redis.sismember(solvedKey(contestId, userId), problemId)) return;
  await redis.hincrby(wrongKey(contestId, userId), problemId, 1);
};

export const recordAccepted = async (
  contestId: string,
  userId: string,
  problemId: string,
  minutesFromStart: number
) => {
  
  const isFirstSolve = await redis.sadd(solvedKey(contestId, userId), problemId);
  if (!isFirstSolve) return null;

  const wrong = Number(await redis.hget(wrongKey(contestId, userId), problemId)) || 0;
  const penalty = Math.floor(minutesFromStart) + wrong * WRONG_PENALTY_MIN;

  return redis.zincrby(lbKey(contestId), K - penalty, userId);
};

export const getTop = async (contestId: string, n = 50) => {
  const raw = await redis.zrevrange(lbKey(contestId), 0, n - 1, "WITHSCORES");
  const rows = [];
  for (let i = 0; i < raw.length; i += 2) {
    const score = Number(raw[i + 1]);
    const solved = Math.ceil(score / K);
    rows.push({
      rank: i / 2 + 1,
      userId: raw[i],
      solved,
      penalty: solved * K - score,
    });
  }
  return rows;
};

export const getUserRank = async (contestId: string, userId: string) => {
  const rank = await redis.zrevrank(lbKey(contestId), userId);
  return rank === null ? null : rank + 1;
};