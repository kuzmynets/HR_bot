require("dotenv").config();
const mongoose = require("mongoose");
const TelegramBot = require("node-telegram-bot-api");

const MONGO_URI = process.env.URL;
const BOT_TOKEN = process.env.BOT_TOKEN;

if (!BOT_TOKEN) {
    console.error("BOT_TOKEN не знайдено у .env");
    process.exit(1);
}

async function startBot() {
    try {
        await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log("Підключено до MongoDB Atlas (bot)");

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

        const educationRank = {
            "Середня": 1,
            "Молодший спеціаліст": 2,
            "Бакалавр": 3,
            "Магістр": 4,
            "Кандидат наук": 5,
            "Доктор наук": 6,
        };

        async function findMatchingJobs(candidate) {
            const rules = await Rule.find({});
            const matches = [];

            for (const rule of rules) {
                const skillsNeeded = (rule.skills || []).filter(Boolean);
                const matchedSkillCount = skillsNeeded.filter(s =>
                    candidate.skills.some(c => c.toLowerCase() === s.toLowerCase())
                ).length;
                const skillMatch = skillsNeeded.length === 0 ? true : matchedSkillCount >= Math.ceil(skillsNeeded.length / 2);

                const educationMatch = !rule.education || (educationRank[candidate.education] || 0) >= (educationRank[rule.education] || 0);

                const expMatch = !rule.minExperience || candidate.experience >= rule.minExperience;

                let tagMatch = true;
                if (rule.tags && rule.tags.length) {
                    for (const tag of rule.tags) {
                        if (!candidate.answers || candidate.answers[tag] === undefined) {
                            tagMatch = false;
                            break;
                        }
                    }
                }

                if (skillMatch && educationMatch && expMatch && tagMatch) {
                    matches.push(rule);
                }
            }

            return matches;
        }

        const bot = new TelegramBot(BOT_TOKEN, { polling: true });
        console.log("Бот запущено (polling)");

        async function getEducationOptions() {
            const educations = await Rule.distinct("education");
            return educations.filter(Boolean).map(e => [e]).sort((a,b) => (educationRank[a[0]]||0) - (educationRank[b[0]]||0));
        }

        const experienceKeyboard = [["0-1","2-3"],["4-5","6+"]];

        async function getSkillsOptions() {
            const skills = await Rule.distinct("skills");
            const flat = (skills || []).flat().filter(Boolean);
            const unique = [...new Set(flat)];
            return unique.map(s => [s]);
        }

        async function sendJobs(chatId, jobs) {
            if (!jobs.length) {
                await bot.sendMessage(chatId, "На жаль, наразі немає вакансій за вашим профілем.");
                return;
            }

            for (const job of jobs) {
                const text = `${job.title}\nОсвіта: ${job.education || "-"}\n Мін. досвід: ${job.minExperience || "-"} років\n Навички: ${(job.skills||[]).join(", ") || "-"}`;
                const inline = {
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: " Переглянути опис", callback_data: `DETAIL_${job._id}` }],
                            [{ text: " Продовжити пошук", callback_data: "CONTINUE_SEARCH" }]
                        ]
                    }
                };
                await bot.sendMessage(chatId, text, inline);
            }
        }

        bot.onText(/\/start/, async (msg) => {
            const chatId = msg.chat.id;
            await bot.sendMessage(chatId, "👋 Вітаю! Почнемо підбір вакансій. Як вас звати?");
            bot.once("message", async nameMsg => {
                const name = nameMsg.text.trim();

                // освіта
                const educationKeyboard = await getEducationOptions();
                if (!educationKeyboard.length) {
                    educationKeyboard.push(["Бакалавр"], ["Магістр"]);
                }
                await bot.sendMessage(chatId, "Ваша освіта:", { reply_markup: { keyboard: educationKeyboard, one_time_keyboard: true, resize_keyboard: true } });
                bot.once("message", async eduMsg => {
                    const education = eduMsg.text.trim();

                    // досвід
                    await bot.sendMessage(chatId, "Ваш досвід:", { reply_markup: { keyboard: experienceKeyboard, one_time_keyboard: true, resize_keyboard: true } });
                    bot.once("message", async expMsg => {
                        let experience = 0;
                        const expText = expMsg.text.trim();
                        if (expText.includes("-")) experience = parseInt(expText.split("-")[1]);
                        else if (expText.includes("+")) experience = parseInt(expText.replace("+",""));
                        else experience = parseInt(expText) || 0;

                        // навички
                        const skillsKeyboard = await getSkillsOptions();
                        await bot.sendMessage(chatId, "Оберіть навички (натискайте кнопки або введіть текст). Коли закінчили — надішліть /done", { reply_markup: { keyboard: skillsKeyboard, resize_keyboard: true, one_time_keyboard: false } });

                        const skillsSelected = [];
                        const collectSkills = async function handler(skillMsg) {
                            const txt = (skillMsg.text || "").trim();
                            if (txt === "/done") {
                                // після завершення — задаємо питання з БД
                                let candidate = { telegram_id: chatId, name, education, experience, skills: skillsSelected, answers: {} };

                                // дістаємо питання
                                const questions = await Question.find({});
                                const askQuestion = async idx => {
                                    if (idx >= questions.length) {
                                        // завершили опитування — підбір вакансій
                                        const matched = await findMatchingJobs(candidate);
                                        candidate.matchedJobs = matched.map(m => m.title);
                                        await Candidate.create(candidate);

                                        // прибираємо reply keyboard
                                        await bot.sendMessage(chatId, "Дякую! Опитування завершено.", { reply_markup: { remove_keyboard: true } });
                                        await sendJobs(chatId, matched);
                                        return;
                                    }

                                    const q = questions[idx];
                                    const optKb = q.options && q.options.length ? q.options.map(o => [o]) : [["Так"],["Ні"]];
                                    await bot.sendMessage(chatId, ` ${q.text}`, { reply_markup: { keyboard: optKb, one_time_keyboard: true, resize_keyboard: true } });
                                    bot.once("message", async answerMsg => {
                                        candidate.answers = candidate.answers || {};
                                        candidate.answers[q.tag || q._id] = answerMsg.text.trim();
                                        askQuestion(idx + 1);
                                    });
                                };

                                if ((await Question.countDocuments({})) > 0) {
                                    askQuestion(0);
                                } else {
                                    const matched = await findMatchingJobs(candidate);
                                    candidate.matchedJobs = matched.map(m => m.title);
                                    await Candidate.create(candidate);
                                    await bot.sendMessage(chatId, "Дякую! (питань немає) Опитування завершено.", { reply_markup: { remove_keyboard: true } });
                                    await sendJobs(chatId, matched);
                                }

                            } else {
                                const val = txt.toLowerCase();
                                if (val && !skillsSelected.includes(val)) skillsSelected.push(val);
                                await bot.sendMessage(chatId, `Додано: ${txt}\nНадішліть ще навичку або /done`, { reply_markup: { remove_keyboard: false } });
                                bot.once("message", handler);
                            }
                        };

                        bot.once("message", collectSkills);
                    });
                });
            });
        });

        bot.on("callback_query", async (query) => {
            const chatId = query.message.chat.id;
            const data = query.data;

            if (data === "CONTINUE_SEARCH") {
                await bot.sendMessage(chatId, "Продовжимо пошук. Надішліть /start щоб почати нове опитування.");
            } else if (data.startsWith("DETAIL_")) {
                const id = data.split("_")[1];
                const job = await Rule.findById(id);
                if (job) {
                    await bot.sendMessage(chatId, ` ${job.title}\n\n${job.description || "-"}`);
                } else {
                    await bot.sendMessage(chatId, "Вакансію не знайдено.");
                }
            }

            try { await bot.answerCallbackQuery(query.id); } catch (e) { /* ignore */ }
        });

        bot.onText(/\/details_(.+)/, async (msg, match) => {
            const chatId = msg.chat.id;
            const jobId = match[1];
            const job = await Rule.findById(jobId);
            if (job) {
                await bot.sendMessage(chatId, ` ${job.title}\n\n${job.description || "-"}`);
            } else {
                await bot.sendMessage(chatId, " Вакансію не знайдено.");
            }
        });

    } catch (err) {
        console.error(" Помилка підключення до MongoDB (bot):", err);
        process.exit(1);
    }
}

startBot();