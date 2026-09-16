const express = require("express");
const cors = require("cors");
const path = require("path");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const { GoogleGenAI } = require("@google/genai");

require("dotenv").config();

const User = require("./models/user");
const Progress = require("./models/progress");
const StudyPlan = require("./models/studyPlan");

const app = express();
const PORT = 5000;


// ==========================================
// GEMINI AI
// ==========================================

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});


// ==========================================
// MIDDLEWARE
// ==========================================

app.use(express.json());
app.use(cors());


// ==========================================
// STATIC FILES
// ==========================================

app.use(express.static(path.join(__dirname)));


// ==========================================
// HOME ROUTE
// ==========================================

app.get("/", (req, res) => {
    res.send("KrishLearn Backend is Running!");
});


// ==========================================
// TEST API
// ==========================================

app.get("/api/test", (req, res) => {
    res.json({
        message: "KrishLearn API is Working!"
    });
});


// ==========================================
// MONGODB CONNECTION
// ==========================================

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB Connected Successfully");
    })
    .catch((error) => {
        console.log(
            "MongoDB Connection Error:",
            error.message
        );
    });


// ==========================================
// SIGNUP API
// ==========================================

app.post("/api/signup", async (req, res) => {
    try {

        const {
            name,
            email,
            password
        } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        const existingUser =
            await User.findOne({
                email: email
            });

        if (existingUser) {
            return res.status(400).json({
                message: "Email already registered"
            });
        }

        const hashedPassword =
            await bcrypt.hash(password, 10);

        const user = new User({
            name: name,
            email: email,
            password: hashedPassword
        });

        await user.save();

        console.log(
            "New User Registered:",
            email
        );

        res.status(201).json({
            message: "Signup successful"
        });

    } catch (error) {

        console.log(
            "Signup Error:",
            error.message
        );

        res.status(500).json({
            message: "Signup failed"
        });
    }
});


// ==========================================
// LOGIN API
// ==========================================

app.post("/api/login", async (req, res) => {
    try {

        const {
            email,
            password
        } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message:
                    "Email and password are required"
            });
        }

        const user =
            await User.findOne({
                email: email
            });

        if (!user) {
            return res.status(401).json({
                message:
                    "Invalid email or password"
            });
        }

        const passwordMatch =
            await bcrypt.compare(
                password,
                user.password
            );

        if (!passwordMatch) {
            return res.status(401).json({
                message:
                    "Invalid email or password"
            });
        }

        console.log(
            "User Login:",
            email
        );

        res.status(200).json({

            message:
                "Login successful",

            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }

        });

    } catch (error) {

        console.log(
            "Login Error:",
            error.message
        );

        res.status(500).json({
            message: "Login failed"
        });
    }
});


// ==========================================
// SAVE / UPDATE STUDY PROFILE
// ==========================================

app.post("/api/profile", async (req, res) => {
    try {

        const {
            email,
            education,
            course,
            subjects,
            studyTime,
            studyGoal
        } = req.body;

        if (!email) {
            return res.status(400).json({
                message: "Email is required"
            });
        }

        const user =
            await User.findOne({
                email: email
            });

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        user.education =
            education || "";

        user.course =
            course || "";

        user.subjects =
            subjects || [];

        user.studyTime =
            studyTime || "";

        user.studyGoal =
            studyGoal || "";

        await user.save();

        console.log(
            "Study Profile Updated:",
            email
        );

        res.status(200).json({
            message:
                "Study profile saved successfully"
        });

    } catch (error) {

        console.log(
            "Profile Save Error:",
            error.message
        );

        res.status(500).json({
            message:
                "Profile save failed"
        });
    }
});


// ==========================================
// GET STUDY PROFILE
// ==========================================

app.get("/api/profile/:email", async (req, res) => {
    try {

        const email =
            req.params.email;

        const user =
            await User.findOne({
                email: email
            });

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        res.status(200).json({

            name:
                user.name,

            email:
                user.email,

            education:
                user.education,

            course:
                user.course,

            subjects:
                user.subjects,

            studyTime:
                user.studyTime,

            studyGoal:
                user.studyGoal
        });

    } catch (error) {

        console.log(
            "Profile Fetch Error:",
            error.message
        );

        res.status(500).json({
            message:
                "Profile fetch failed"
        });
    }
});


// ==========================================
// AI NOTES GENERATION
// ==========================================

app.post("/api/generate-notes", async (req, res) => {

    try {

        const {
            subject,
            topic
        } = req.body;

        console.log(
            "AI Notes Request:",
            subject,
            "-",
            topic
        );

        if (!subject || !topic) {
            return res.status(400).json({
                message:
                    "Subject and topic are required"
            });
        }

        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({
                message:
                    "Gemini API key is not configured"
            });
        }

        const prompt = `

You are KrishLearn AI, an expert study mentor.

Create detailed and accurate study notes for the following student.

Subject: ${subject}
Topic: ${topic}

Structure the notes using these sections:

1. Introduction
2. Simple Explanation
3. Important Definitions
4. Key Concepts
5. Detailed Explanation
6. Examples
7. Important Points to Remember
8. Quick Revision
9. Practice Questions

Requirements:

- Explain everything in simple student-friendly language.
- Make the explanation suitable for college students.
- Use clear headings.
- Use bullet points where useful.
- Give practical examples.
- Explain formulas if the topic contains formulas.
- Include important exam points.
- At the end give exactly 5 practice questions.
- Do not include unnecessary filler.
- Do not mention that you are an AI.
- Return only the study notes.

`;

        async function generateNotes(modelName) {

            const response =
                await ai.models.generateContent({

                    model:
                        modelName,

                    contents:
                        prompt
                });

            return response.text;
        }

        let notes;

        try {

            notes =
                await generateNotes(
                    "gemini-3.6-flash"
                );

        } catch (primaryError) {

            console.log(
                "Primary Notes Model Error:",
                primaryError.message
            );

            notes =
                await generateNotes(
                    "gemini-3.5-flash"
                );
        }

        if (!notes) {
            return res.status(500).json({
                message:
                    "AI did not generate any notes"
            });
        }

        console.log(
            "AI Notes Generated Successfully"
        );

        res.status(200).json({

            message:
                "AI notes generated successfully!",

            notes:
                notes
        });

    } catch (error) {

        console.log(
            "AI Notes Error:",
            error.message
        );

        res.status(500).json({

            message:
                "AI notes generation failed: " +
                error.message
        });
    }
});


// ==========================================
// AI QUIZ GENERATION
// ==========================================

app.post("/api/generate-quiz", async (req, res) => {

    try {

        const {
            subject,
            topic
        } = req.body;

        console.log(
            "AI Quiz Request:",
            subject,
            "-",
            topic
        );

        if (!subject || !topic) {
            return res.status(400).json({
                message:
                    "Subject and topic are required"
            });
        }

        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({
                message:
                    "Gemini API key is not configured"
            });
        }

        const prompt = `

You are KrishLearn AI, an expert study mentor.

Create a quiz for a college student.

Subject: ${subject}
Topic: ${topic}

Create exactly 5 multiple-choice questions.

For every question provide:

- question
- 4 options
- correct answer
- short explanation

Rules:

- Questions must be accurate.
- Questions must be based on the given subject and topic.
- Difficulty should be mixed: easy, medium and hard.
- Each question must have exactly 4 options.
- Only one option should be correct.
- Return ONLY valid JSON.
- Do not use markdown.
- Do not add any text before or after the JSON.

Use exactly this JSON format:

{
    "quiz": [
        {
            "question": "Question here",
            "options": [
                "Option A",
                "Option B",
                "Option C",
                "Option D"
            ],
            "answer": "Option A",
            "explanation": "Short explanation"
        }
    ]
}

`;

        async function generateQuiz(modelName) {

            const response =
                await ai.models.generateContent({

                    model:
                        modelName,

                    contents:
                        prompt
                });

            return response.text;
        }

        let aiText;

        try {

            aiText =
                await generateQuiz(
                    "gemini-3.6-flash"
                );

        } catch (primaryError) {

            console.log(
                "Primary Quiz Model Error:",
                primaryError.message
            );

            try {

                aiText =
                    await generateQuiz(
                        "gemini-3.5-flash"
                    );

            } catch (fallbackError) {

                console.log(
                    "Fallback Quiz Model Error:",
                    fallbackError.message
                );

                return res.status(503).json({
                    message:
                        "AI service is temporarily busy. Please try again."
                });
            }
        }

        if (!aiText) {
            return res.status(500).json({
                message:
                    "AI did not generate quiz"
            });
        }

        let cleanedText =
            aiText.trim();

        if (
            cleanedText.startsWith("```json")
        ) {

            cleanedText =
                cleanedText
                    .replace(/^```json/, "")
                    .replace(/```$/, "")
                    .trim();
        }

        if (
            cleanedText.startsWith("```")
        ) {

            cleanedText =
                cleanedText
                    .replace(/^```/, "")
                    .replace(/```$/, "")
                    .trim();
        }

        let quizData;

        try {

            quizData =
                JSON.parse(cleanedText);

        } catch (parseError) {

            console.log(
                "Quiz JSON Parse Error:",
                parseError.message
            );

            return res.status(500).json({
                message:
                    "AI returned invalid quiz format"
            });
        }

        if (
            !quizData.quiz ||
            !Array.isArray(quizData.quiz) ||
            quizData.quiz.length !== 5
        ) {

            return res.status(500).json({
                message:
                    "AI quiz format is invalid"
            });
        }

        console.log(
            "AI Quiz Generated Successfully"
        );

        res.status(200).json({

            message:
                "AI quiz generated successfully!",

            quiz:
                quizData.quiz
        });

    } catch (error) {

        console.log(
            "AI Quiz Error:",
            error.message
        );

        res.status(500).json({

            message:
                "AI quiz generation failed: " +
                error.message
        });
    }
});


// ==========================================
// AI STUDY PLAN GENERATION
// ==========================================

app.post("/api/generate-plan", async (req, res) => {

    try {

        const {
            email,
            goal,
            days
        } = req.body;

        console.log(
            "Study Plan Request:",
            email,
            "|",
            goal,
            "|",
            days
        );

        if (!email || !goal || !days) {
            return res.status(400).json({
                message:
                    "Email, goal and days are required"
            });
        }

        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({
                message:
                    "Gemini API key is not configured"
            });
        }

        const user =
            await User.findOne({
                email: email
            });

        if (!user) {
            return res.status(404).json({
                message:
                    "User not found"
            });
        }

        const prompt = `

You are KrishLearn AI, an expert personalized study mentor.

Create a detailed ${days}-day study plan for the student.

Student Information:

Education:
${user.education || "Not specified"}

Course:
${user.course || "Not specified"}

Subjects:
${(user.subjects || []).join(", ")}

Daily Study Time:
${user.studyTime || "Not specified"}

Existing Study Goal:
${user.studyGoal || "Not specified"}

New Goal:
${goal}

Create EXACTLY ${days} days.

For every day use this exact structure:

DAY 1

Target:
Write the main target for the day.

Tasks:
1. Task
2. Task
3. Task

Revision / Practice:
Write revision or practice work.

DAY 2

Target:
...

Tasks:
1. ...
2. ...
3. ...

Revision / Practice:
...

Continue until DAY ${days}.

IMPORTANT RULES:

- Provide exactly ${days} unique days.
- Never repeat a day number.
- Do not skip any day.
- Do not create empty days.
- Keep tasks practical and achievable.
- Consider the student's daily study time.
- Prioritize the student's new goal.
- Include revision and practice.
- Use clear headings.
- Do not use markdown tables.
- At the end include:

FINAL REVISION STRATEGY

Give a short strategy for revising the complete plan.

Return only the study plan.

`;

        async function generatePlan(modelName) {

            const response =
                await ai.models.generateContent({

                    model:
                        modelName,

                    contents:
                        prompt
                });

            return response.text;
        }

        let plan;

        try {

            plan =
                await generatePlan(
                    "gemini-3.6-flash"
                );

        } catch (primaryError) {

            console.log(
                "Primary Plan Model Error:",
                primaryError.message
            );

            try {

                plan =
                    await generatePlan(
                        "gemini-3.5-flash"
                    );

            } catch (fallbackError) {

                console.log(
                    "Fallback Plan Model Error:",
                    fallbackError.message
                );

                return res.status(503).json({
                    message:
                        "AI service is temporarily busy. Please try again."
                });
            }
        }

        if (!plan) {

            return res.status(500).json({
                message:
                    "AI did not generate any study plan"
            });
        }

        console.log(
            "AI Study Plan Generated Successfully"
        );

        res.status(200).json({

            message:
                "Study plan generated successfully!",

            plan:
                plan
        });

    } catch (error) {

        console.log(
            "Study Plan Generation Error:",
            error.message
        );

        res.status(500).json({

            message:
                "Study plan generation failed: " +
                error.message
        });
    }
});


// ==========================================
// SAVE STUDY PLAN TO MONGODB
// ==========================================

app.post("/api/save-plan", async (req, res) => {

    try {

        const {
            email,
            goal,
            days,
            plan
        } = req.body;

        console.log(
            "Save Study Plan Request:",
            email
        );

        if (!email || !goal || !days || !plan) {

            return res.status(400).json({
                message:
                    "Email, goal, days and plan are required"
            });
        }

        const user =
            await User.findOne({
                email: email
            });

        if (!user) {

            return res.status(404).json({
                message:
                    "User not found"
            });
        }

        const newPlan =
            new StudyPlan({

                email:
                    email,

                goal:
                    goal,

                days:
                    Number(days),

                plan:
                    plan,

                completedDays:
                    []
            });

        await newPlan.save();

        console.log(
            "Study Plan Saved Successfully:",
            email
        );

        res.status(201).json({

            message:
                "Study plan saved successfully!",

            plan:
                newPlan
        });

    } catch (error) {

        console.log(
            "Save Study Plan Error:",
            error.message
        );

        res.status(500).json({

            message:
                "Failed to save study plan"
        });
    }
});


// ==========================================
// AI MENTOR
// ==========================================

app.post("/api/mentor", async (req, res) => {

    try {

        const {
            email,
            message
        } = req.body;


        // Check message
        if (!message || !message.trim()) {

            return res.status(400).json({
                message: "Message is required"
            });

        }


        // Check Gemini API key
        if (!process.env.GEMINI_API_KEY) {

            return res.status(500).json({
                message: "Gemini API key is not configured"
            });

        }


        // Find student
        let user = null;

        if (email) {

            user = await User.findOne({
                email: email.toLowerCase().trim()
            });

        }


        // Student profile information
        let profileInfo =
            "No profile information available.";


        if (user) {

            profileInfo = `

Education:
${user.education || "Not provided"}

Course:
${user.course || "Not provided"}

Subjects:
${
    Array.isArray(user.subjects)
        ? user.subjects.join(", ")
        : user.subjects || "Not provided"
}

Daily Study Time:
${user.studyTime || "Not provided"}

Study Goal:
${user.studyGoal || "Not provided"}

`;

        }


        // AI Mentor prompt
        const prompt = `

You are KrishLearn AI Mentor.

You are a friendly and intelligent study mentor
for college students.

Your job is to help students with:

- Understanding difficult topics
- Study planning
- Exam preparation
- NIMCET preparation
- Time management
- Revision strategies
- Practice questions
- Career and learning guidance

Student Profile:

${profileInfo}


Student's Question:

${message}


Instructions:

1. Give a clear and useful answer.
2. Explain difficult concepts in simple language.
3. Give examples whenever useful.
4. If the student asks what to study,
   suggest specific topics.
5. If the student asks about NIMCET,
   focus on Maths, Reasoning, Computer Awareness
   and English.
6. Keep the response practical.
7. Do not mention that you are an AI.
8. Do not give unnecessary filler.
9. Use headings and bullet points when useful.

Return only the mentor's response.

`;


        // Gemini generation function
        async function generateMentor(modelName) {

            const response =
                await ai.models.generateContent({

                    model: modelName,

                    contents: prompt

                });

            return response.text;

        }


        // Generate response
        let reply;


        try {

            reply =
                await generateMentor(
                    "gemini-3.6-flash"
                );

        }

        catch (primaryError) {

            console.log(
                "Primary Mentor Model Error:",
                primaryError.message
            );


            try {

                reply =
                    await generateMentor(
                        "gemini-3.5-flash"
                    );

            }

            catch (fallbackError) {

                console.log(
                    "Fallback Mentor Model Error:",
                    fallbackError.message
                );


                return res.status(503).json({

                    message:
                        "AI Mentor is temporarily unavailable. Please try again."

                });

            }

        }


        // Check response
        if (!reply) {

            return res.status(500).json({

                message:
                    "AI Mentor did not generate a response."

            });

        }


        console.log(
            "AI Mentor Response Generated Successfully"
        );


        // Send response
        res.status(200).json({

            message:
                "AI Mentor response generated successfully!",

            reply:
                reply

        });


    }

    catch (error) {

        console.log(
            "AI Mentor Error:",
            error.message
        );


        res.status(500).json({

            message:
                "AI Mentor failed: " +
                error.message

        });

    }

});


// ==========================================
// GET SAVED STUDY PLANS
// ==========================================

app.get("/api/saved-plans/:email", async (req, res) => {

    try {

        const email =
            req.params.email.toLowerCase().trim();

        const plans =
            await StudyPlan.find({
                email: email
            })
            .sort({
                createdAt: -1
            });

        res.status(200).json({

            success: true,

            plans: plans

        });

    } catch (error) {

        console.error(
            "Get Saved Plans Error:",
            error.message
        );

        res.status(500).json({

            success: false,

            message:
                "Unable to load saved study plans"

        });

    }

});


// ==========================================
// SAVE QUIZ RESULT / PROGRESS
// ==========================================

app.post("/api/save-quiz-result", async (req, res) => {

    try {

        const {
            email,
            subject,
            topic,
            score,
            total
        } = req.body;

        if (
            !email ||
            score === undefined ||
            total === undefined
        ) {

            return res.status(400).json({
                message:
                    "Email, score and total are required"
            });
        }

        const user =
            await User.findOne({
                email: email
            });

        if (!user) {

            return res.status(404).json({
                message:
                    "User not found"
            });
        }

        const numericScore =
            Number(score);

        const numericTotal =
            Number(total);

        if (
            isNaN(numericScore) ||
            isNaN(numericTotal) ||
            numericTotal <= 0 ||
            numericScore < 0 ||
            numericScore > numericTotal
        ) {

            return res.status(400).json({
                message:
                    "Invalid score or total"
            });
        }

        const percentage =
            Math.round(
                (numericScore / numericTotal) * 100
            );

        const progress =
            new Progress({

                email:
                    email,

                subject:
                    subject || "General",

                topic:
                    topic || "General Quiz",

                score:
                    numericScore,

                total:
                    numericTotal,

                percentage:
                    percentage
            });

        await progress.save();

        console.log(
            "Quiz Progress Saved:",
            email,
            "| Score:",
            numericScore + "/" + numericTotal,
            "| Percentage:",
            percentage + "%"
        );

        const allProgress =
            await Progress.find({
                email:
                    email
            });

        let totalQuestions = 0;
        let correctAnswers = 0;

        allProgress.forEach((item) => {

            totalQuestions +=
                Number(item.total);

            correctAnswers +=
                Number(item.score);

        });

        const quizAttempts =
            allProgress.length;

        let averageScore = 0;

        if (totalQuestions > 0) {

            averageScore =
                Math.round(
                    (
                        correctAnswers /
                        totalQuestions
                    ) * 100
                );
        }

        res.status(200).json({

            message:
                "Quiz result saved successfully",

            progress: {

                quizAttempts:
                    quizAttempts,

                totalQuestions:
                    totalQuestions,

                correctAnswers:
                    correctAnswers,

                averageScore:
                    averageScore
            }
        });

    } catch (error) {

        console.log(
            "Quiz Result Save Error:",
            error.message
        );

        res.status(500).json({
            message:
                "Quiz result save failed"
        });
    }
});


// ==========================================
// GET QUIZ PROGRESS
// ==========================================

app.get("/api/progress/:email", async (req, res) => {

    try {

        const email =
            req.params.email;

        const user =
            await User.findOne({
                email:
                    email
            });

        if (!user) {

            return res.status(404).json({
                message:
                    "User not found"
            });
        }

        const progress =
            await Progress.find({
                email:
                    email
            }).sort({
                date:
                    -1
            });

        let totalQuestions = 0;
        let correctAnswers = 0;

        progress.forEach((item) => {

            totalQuestions +=
                Number(item.total);

            correctAnswers +=
                Number(item.score);

        });

        const quizAttempts =
            progress.length;

        let averageScore = 0;

        if (totalQuestions > 0) {

            averageScore =
                Math.round(
                    (
                        correctAnswers /
                        totalQuestions
                    ) * 100
                );
        }

        res.status(200).json({

            quizAttempts:
                quizAttempts,

            totalQuestions:
                totalQuestions,

            correctAnswers:
                correctAnswers,

            averageScore:
                averageScore,

            history:
                progress
        });

    } catch (error) {

        console.log(
            "Progress Fetch Error:",
            error.message
        );

        res.status(500).json({
            message:
                "Progress fetch failed"
        });
    }
});


// ==========================================
// START SERVER
// ==========================================

app.listen(PORT, () => {

    console.log(
        `KrishLearn Backend is Running on port ${PORT}`
    );

});