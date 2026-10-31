import "dotenv/config";
import { redis } from "../config/redis";
import * as lb from "../services/leaderboard.service";

(async () => {
  const c = "test-contest";
  await redis.del(`contest:${c}:leaderboard`);
  for (const u of ["alice", "bob", "carol"]) await lb.registerParticipant(c, u);

  await lb.recordAccepted(c, "alice", "p1", 10);
  await lb.recordWrongAttempt(c, "bob", "p1");
  await lb.recordAccepted(c, "bob", "p1", 5);  // penalty 25
  await lb.recordAccepted(c, "alice", "p2", 40); // alice: 2 solved
  await lb.recordAccepted(c, "alice", "p2", 45); // ignored (duplicate)

  console.log(await lb.getTop(c));
  console.log("bob rank:", await lb.getUserRank(c, "bob"));
  await redis.quit();
})();