import { io } from "socket.io-client";

const [token, contestId] = process.argv.slice(2);
const socket = io("http://localhost:5001", { auth: { token } });

socket.on("connect", () => {
  console.log("connected");
  socket.emit("contest:join", { contestId }, (res: unknown) => console.log("join:", res));
});

socket.on("connect_error", (e) => console.log("connect_error:", e.message));

["contest:state", "leaderboard:update", "room:presence", "contest:started", "contest:ended"].forEach((ev) =>
  socket.on(ev, (data) => console.log(ev, data))
);
