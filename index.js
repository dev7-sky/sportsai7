const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

// MongoDB connect
mongoose
	.connect("mongodb://127.0.0.1:27017/sports-app")
	.then(() => console.log("✅ MongoDB connected successfully"))
	.catch((err) => console.log("❌ MongoDB connection error:", err));

// Schemas
const playerSchema = new mongoose.Schema({
	fullName: String,
	username: String,
	dob: String,
	gender: String,
	sport: String,
	position: String,
	goals: String,
	age: Number,
	ageGroup: String,
	password: String,
});

const coachSchema = new mongoose.Schema({
	fullName: String,
	username: String,
	gender: String,
	age: Number,
	sport: String,
	experience: String,
	goals: String,
	password: String,
});

const Player = mongoose.model("Player", playerSchema);
const Coach = mongoose.model("Coach", coachSchema);

// ==================== SIGNUP ====================
app.post("/api/player/signup", async (req, res) => {
	console.log("Player signup body:", req.body);
	try {
		const {
			fullName,
			username,
			dob,
			gender,
			sport,
			position,
			goals,
			age,
			ageGroup,
			password,
		} = req.body;

		const existing = await Player.findOne({ username });
		if (existing)
			return res.status(400).json({ error: "Username already exists" });

		const hashed = await bcrypt.hash(password, 10);
		const player = new Player({
			fullName,
			username,
			dob,
			gender,
			sport,
			position,
			goals,
			age,
			ageGroup,
			password: hashed,
		});
		await player.save();
		console.log("✅ Player saved:", player.username);
		res.json({ message: "Player registered successfully", player });
	} catch (err) {
		console.error("❌ Player signup error:", err);
		res.status(500).json({ error: "Server error during player signup" });
	}
});

app.post("/api/coach/signup", async (req, res) => {
	console.log("Coach signup body:", req.body);
	try {
		const {
			fullName,
			username,
			gender,
			age,
			sport,
			experience,
			goals,
			password,
		} = req.body;

		const existing = await Coach.findOne({ username });
		if (existing)
			return res.status(400).json({ error: "Username already exists" });

		const hashed = await bcrypt.hash(password, 10);
		const coach = new Coach({
			fullName,
			username,
			gender,
			age,
			sport,
			experience,
			goals,
			password: hashed,
		});
		await coach.save();
		console.log("✅ Coach saved:", coach.username);
		res.json({ message: "Coach registered successfully", coach });
	} catch (err) {
		console.error("❌ Coach signup error:", err);
		res.status(500).json({ error: "Server error during coach signup" });
	}
});

// ==================== LOGIN ====================
app.post("/api/login", async (req, res) => {
	console.log("Login attempt body:", req.body);
	try {
		const { username, password, role } = req.body;

		if (!username || !password || !role) {
			return res.status(400).json({ error: "Missing credentials or role" });
		}

		const Model = role === "player" ? Player : Coach;
		const user = await Model.findOne({ username });
		console.log("Found user:", user ? user.username : null);

		if (!user) return res.status(400).json({ error: "User not found" });

		const valid = await bcrypt.compare(password, user.password);
		if (!valid) return res.status(400).json({ error: "Invalid credentials" });

		const token = jwt.sign({ id: user._id, role }, "SECRET123");
		res.json({ token, user });
	} catch (err) {
		console.error("❌ Login error:", err);
		res.status(500).json({ error: "Server error during login" });
	}
});

// ==================== START SERVER ====================
const PORT = 5000;
app.listen(PORT, () =>
	console.log(`🚀 Server running on http://localhost:${PORT}`)
);
