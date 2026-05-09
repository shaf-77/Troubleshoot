const path = require("path");
const http = require("http");
const express = require("express");
const { Server } = require("socket.io");

const PORT = process.env.PORT || 3000;
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: true },
});

app.use(express.json({ limit: "12mb" }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "operator.html"));
});

app.get("/smartband", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "smartband.html"));
});

io.on("connection", (socket) => {
  socket.on("assign_task", (payload) => {
    const id = payload.id || `task-${Date.now()}`;
    io.emit("task_assigned", {
      ...payload,
      id,
      assignedAt: Date.now(),
    });
  });

  socket.on("emergency_alert", (payload) => {
    io.emit("emergency", {
      message: payload.message || "Emergency alert from bridge",
      at: Date.now(),
    });
  });

  socket.on("voice_message", (payload) => {
    io.emit("voice_message_received", {
      mimeType: payload.mimeType || "audio/webm",
      data: payload.data,
      label: payload.label || "Voice message from operator",
      at: Date.now(),
    });
  });

  socket.on("lora_message", (payload) => {
    io.emit("lora_to_crew", {
      kind: payload.kind || "text",
      label: payload.label || "LoRa",
      at: Date.now(),
    });
  });

  socket.on("task_complete", (payload) => {
    io.emit("task_completed", {
      taskId: payload.taskId,
      taskKey: payload.taskKey,
      label: payload.label,
      at: Date.now(),
    });
  });

  socket.on("sos", (payload) => {
    io.emit("sos_alert", {
      message: payload.message || "SOS from crew",
      at: Date.now(),
    });
  });

  socket.on("crew_voice_snippet", (payload) => {
    io.emit("crew_voice_to_operator", {
      mimeType: payload.mimeType || "audio/webm",
      data: payload.data,
      label: payload.label || "Voice from crew",
      at: Date.now(),
    });
  });
});

server.listen(PORT, () => {
  console.log(`Smart Crew Coordination running at http://localhost:${PORT}`);
  console.log(`  Operator:  http://localhost:${PORT}/`);
  console.log(`  Smartband: http://localhost:${PORT}/smartband`);
});
