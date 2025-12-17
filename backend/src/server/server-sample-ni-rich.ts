import express from "express";
import cors from "cors";

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// GET endpoint to check server
app.get("/", (req, res) => {
  res.send("Backend is running!");
});

// POST endpoint to receive code
app.post("/analyze", (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ success: false, message: "No code provided" });
  }

  console.log("=== Received code ===");
  console.log(code);
  console.log("===================");

  res.json({
    success: true,
    message: "Code received successfully!",
    receivedCode: code,
    length: code.length,
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
