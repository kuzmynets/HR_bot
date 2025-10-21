require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const open = require("open").default;

const app = express();
app.use(express.json());
app.use(express.static("public"));
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.URL;

async function startServer() {
    try {
        await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log("Підключено до MongoDB Atlas (server)");

        // Схеми
        const ruleSchema = new mongoose.Schema({
            title: String,
            education: String,
            minExperience: Number,
            skills: [String],
            description: String,
            tags: [String],
        });
        const Rule = mongoose.model("Rule", ruleSchema);

        const candidateSchema = new mongoose.Schema({
            telegram_id: Number,
            name: String,
            education: String,
            experience: Number,
            skills: [String],
            answers: mongoose.Schema.Types.Mixed,
            matchedJobs: [String],
            createdAt: { type: Date, default: Date.now },
        });
        const Candidate = mongoose.model("Candidate", candidateSchema);

        const questionSchema = new mongoose.Schema({
            text: String,
            options: [String],
            tag: String,
        });
        const Question = mongoose.model("Question", questionSchema);

        // --- API: Vacancies (rules) ---
        app.get("/rules", async (req, res) => res.json(await Rule.find({})));
        app.post("/rules", async (req, res) => res.json(await Rule.create(req.body)));
        app.put("/rules/:id", async (req, res) => res.json(await Rule.findByIdAndUpdate(req.params.id, req.body, { new: true })));
        app.delete("/rules/:id", async (req, res) => res.json(await Rule.findByIdAndDelete(req.params.id)));

        // --- API: Candidates ---
        app.get("/candidates", async (req, res) => res.json(await Candidate.find({}).sort({ createdAt: -1 })));
        app.delete("/candidates/:id", async (req, res) => res.json(await Candidate.findByIdAndDelete(req.params.id)));

        // --- API: Questions ---
        app.get("/questions", async (req, res) => res.json(await Question.find({})));
        app.post("/questions", async (req, res) => res.json(await Question.create(req.body)));
        app.put("/questions/:id", async (req, res) => res.json(await Question.findByIdAndUpdate(req.params.id, req.body, { new: true })));
        app.delete("/questions/:id", async (req, res) => res.json(await Question.findByIdAndDelete(req.params.id)));

        app.listen(PORT, async () => {
            console.log(` Сервер запущено на http://localhost:${PORT}`);
            try {
                await open(`http://localhost:${PORT}/admin_panel.html`); // відкриває адмін-панель
                console.log("Адмін-панель відкрито у браузері");
            } catch (err) {
                console.error(" Не вдалося відкрити браузер:", err);
            }
        });

    } catch (err) {
        console.error("Помилка підключення до MongoDB (server):", err);
        process.exit(1);
    }
}

startServer();