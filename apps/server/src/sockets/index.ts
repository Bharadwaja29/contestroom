import { Server } from "socket.io";
import { Server as HttpServer } from "http";
import jwt from "jsonwebtoken";
import { isValidObjectId } from "mongoose";
import { Contest } from "../models/Contest";
import { User } from "../models/User";
import { getTop } from "../services/leaderboard.service";

let io: Server;
const timers = new Map<string, NodeJS.Timeout[]>();

const roomName = (contestId: string) => `contest:${contestId}`;

const getStatus = (start: Date, end: Date) => {
  const now = Date.now();
  if (now < start.getTime()) return "upcoming";
  if (now >= end.getTime()) return "ended";
  return "live";
};

const buildLeaderboard = async (contestId: string) => {
  const top = await getTop(contestId);
  const users = await User.find({ _id: { $in: top.map((r) => r.userId) } }).select("username");
  const userMap = new Map(users.map((u) => [u.id, u.username]));
  return top.map((r) => ({ ...r, username: userMap.get(r.userId) || "unknown" }));
};

export const broadcastLeaderboard = async (contestId: string) => {
  io.to(roomName(contestId)).emit("leaderboard:update", await buildLeaderboard(contestId));
};

const emitPresence = async (contestId: string, excludeSocketId?: string) => {
  const sockets = await io.in(roomName(contestId)).fetchSockets();
  const users = new Set(
    sockets.filter((s) => s.id !== excludeSocketId).map((s) => s.data.userId)
  );
  io.to(roomName(contestId)).emit("room:presence", { count: users.size });
};

const scheduleEvents = (contestId: string, start: Date, end: Date) => {
  if (timers.has(contestId)) return;
  const now = Date.now();
  const list: NodeJS.Timeout[] = [];

  if (start.getTime() > now) {
    list.push(setTimeout(() => io.to(roomName(contestId)).emit("contest:started"), start.getTime() - now));
  }
  if (end.getTime() > now) {
    list.push(
      setTimeout(() => {
        io.to(roomName(contestId)).emit("contest:ended");
        timers.delete(contestId);
      }, end.getTime() - now)
    );
  }
  timers.set(contestId, list);
};

export const initSocket = (httpServer: HttpServer) => {
  io = new Server(httpServer, {
    cors: { origin: process.env.CLIENT_URL || "http://localhost:5173" },
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Not authenticated"));
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN as string) as { id: string };
      socket.data.userId = decoded.id;
      next();
    } catch (error) {
      console.log("SOCKET TOKEN ERROR:", error);
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    socket.on("contest:join", async (payload, ack) => {
      const reply = typeof ack === "function" ? ack : () => {};
      try {
        const contestId = payload?.contestId;
        if (!isValidObjectId(contestId)) return reply({ ok: false, error: "Invalid contest id" });

        const contest = await Contest.findById(contestId);
        if (!contest) return reply({ ok: false, error: "Contest not found" });

        const registered = contest.participants.some((p) => p.toString() === socket.data.userId);
        if (!registered) return reply({ ok: false, error: "Register for this contest first" });

        await socket.join(roomName(contestId));
        scheduleEvents(contestId, contest.startTime, contest.endTime);

        socket.emit("contest:state", {
          status: getStatus(contest.startTime, contest.endTime),
          startTime: contest.startTime,
          endTime: contest.endTime,
          serverTime: Date.now(),
        });
        socket.emit("leaderboard:update", await buildLeaderboard(contestId));
        await emitPresence(contestId);

        reply({ ok: true });
      } catch (err) {
        console.error(err);
        reply({ ok: false, error: "Server error" });
      }
    });

    socket.on("disconnecting", () => {
      for (const r of socket.rooms) {
        if (r.startsWith("contest:")) emitPresence(r.replace("contest:", ""), socket.id);
      }
    });
  });

  return io;
};