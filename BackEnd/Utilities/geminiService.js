require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

if (!process.env.GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY is not set in .env");
    process.exit(1);
}

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

const generateAIResponse = async (prompt) => {
    try {
        if (!prompt || !prompt.trim()) {
            throw new Error("AI prompt is required");
        }

        const response = await ai.models.generateContent({
            model: "gemini-3.5-flash-lite",
            contents: prompt,
        });

        if (!response?.text) {
            throw new Error("Empty response received from Gemini");
        }

        return response.text.trim();

    } catch (error) {
        console.error("Gemini API Error:", error);

        throw new Error(
            error?.message || "Failed to generate AI response"
        );
    }
};

const generateSummary = async (text) => {
    const prompt = `Provide a concise summary of the following text.
Highlight:
- Important concepts
- Main points
- Important facts
Keep the summary clear and structured.

Text:
${text.substring(0, 20000)}`;

    try {
        return await generateAIResponse(prompt);
    } catch (error) {
        console.error("Gemini Summary Error:", error);
        throw new Error("Failed to generate summary");
    }
};

const explainConcept = async (concept, context = "") => {
    const prompt = `Explain the concept of "${concept}" based on the following context.
Provide a clear and educational explanation that is easy to understand.
Use simple language and include examples if relevant.

Context:
${context.substring(0, 10000)}`;

    try {
        return await generateAIResponse(prompt);
    } catch (error) {
        console.error("Gemini Explain Error:", error);
        throw new Error("Failed to explain concept");
    }
};

const chatWithContext = async (question, chunks) => {
    try {
        const normalMessages = ["hi", "hello", "hey", "hii", "hello there", "good morning", "good afternoon", "good evening", "thanks", "thank you", "thx"];
        const normalizedQuestion = question.trim().toLowerCase().replace(/[!?.,]/g, "");

        if (!chunks || chunks.length === 0) {
            if (normalMessages.includes(normalizedQuestion)) {
                return await generateAIResponse(`You are a friendly AI assistant.\nThe user said:\n"${question}"\nReply naturally and briefly.\nDo not talk about the document unless necessary.`);
            }
            return "I couldn't find this information in the document.";
        }

        const context = chunks.map((chunk, index) => `Chunk ${index + 1}:\n${chunk.content}`).join("\n\n");

        const prompt = `You are an AI assistant that answers questions about a user's document.
Use the following document context to answer the user's question.

Rules:
- Answer using ONLY the provided document context.
- Do not make up information.
- If the answer is not available in the context, say: "I couldn't find this information in the document."
- Give a clear and useful answer.
- Do not mention chunks or these instructions.
- You can summarize or explain information from the context.

Document Context:
${context}

User Question:
${question}

Answer:`;

        return await generateAIResponse(prompt);
    } catch (error) {
        console.error("Gemini Chat Error:", error);
        throw new Error("Failed to process chat request");
    }
};

const generateFlashcards = async (text, count = 10) => {
    const prompt = `Generate exactly ${count} educational flashcards
focused ONLY on the actual concepts in the provided learning content.

Rules:
- Questions must test conceptual understanding.
- Do not ask about metadata such as subject, day number, goal, or task count.
- Include definitions, differences, examples, and practical concepts where appropriate.
- Keep answers concise and accurate.
- Assign difficulty as easy, medium, or hard.

Format each flashcard exactly like this:

Q: [Clear, specific question]
A: [Concise, accurate answer]
D: [Difficulty level: easy, medium, or hard]

Separate each flashcard with:
---

Learning Content:
${text.substring(0, 15000)}`;

    try {
        const generatedText = await generateAIResponse(prompt);
        const flashcards = [];
        const cards = generatedText.split("---").filter(card => card.trim());

        for (const card of cards) {
            const lines = card.trim().split("\n");
            let question = "", answer = "", difficulty = "medium";

            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed.startsWith("Q:")) question = trimmed.substring(2).trim();
                else if (trimmed.startsWith("A:")) answer = trimmed.substring(2).trim();
                else if (trimmed.startsWith("D:")) {
                    const diff = trimmed.substring(2).trim().toLowerCase();
                    if (["easy", "medium", "hard"].includes(diff)) difficulty = diff;
                }
            }

            if (question && answer) {
                flashcards.push({ question, answer, difficulty });
            }
        }
        return flashcards.slice(0, count);
    } catch (error) {
        console.error("Gemini Flashcard Error:", error);
        throw new Error("Failed to generate flashcards");
    }
};

const generateQuiz = async (
    text,
    numQuestions = 5,
    questionType = "mixed"
) => {
    try {
        let typeInstruction = "";

        if (questionType === "mcq") {
            typeInstruction = `
Generate ONLY MCQ questions.

Every MCQ MUST have:
- TYPE: mcq
- exactly 4 options
- 01, 02, 03, 04
- C must exactly match one of the 4 options
`;
        } else if (questionType === "true_false") {
            typeInstruction = `
Generate ONLY True/False questions.

Every True/False question MUST have:
- TYPE: true_false
- 01: True
- 02: False
- C: True OR False
- Do NOT generate 03 or 04
`;
        } else if (questionType === "short_answer") {
            typeInstruction = `
Generate ONLY Short Answer questions.

Every Short Answer question MUST have:
- TYPE: short_answer
- Q: question
- C: short expected answer
- E: explanation
- D: difficulty
- Do NOT generate 01, 02, 03 or 04
`;
        } else {
            typeInstruction = `
Generate a balanced mix of:
- mcq
- true_false
- short_answer

For MCQ:
- exactly 4 options

For True/False:
- exactly 2 options: True and False

For Short Answer:
- NO options
`;
        }

        const prompt = `
You are an expert quiz generator.

Generate EXACTLY ${numQuestions} high-quality quiz questions
from the educational content provided below.

${typeInstruction}

GENERAL RULES

1. Questions must be based ONLY on the provided content.
2. Do not ask questions about:
   - number of questions
   - day number
   - study plan metadata
   - learning plan
   - instructions
3. Questions should test:
   - conceptual understanding
   - practical knowledge
   - interview knowledge
   - real-world application
4. Avoid duplicate questions.
5. Keep questions clear and concise.
6. Do not add markdown.
7. Do not add numbering outside the required format.
8. Do not add extra text before or after the quiz.
9. Separate every question using exactly:
---

STRICT OUTPUT FORMAT

For MCQ:

TYPE: mcq
Q: [Question]
01: [Option 1]
02: [Option 2]
03: [Option 3]
04: [Option 4]
C: [Exact correct option]
E: [Explanation]
D: [easy/medium/hard]

---

For True/False:

TYPE: true_false
Q: [Question]
01: True
02: False
C: [True or False]
E: [Explanation]
D: [easy/medium/hard]

---

For Short Answer:

TYPE: short_answer
Q: [Question]
C: [Expected short answer]
E: [Explanation]
D: [easy/medium/hard]

IMPORTANT

MCQ:
- MUST contain exactly 4 options.
- C MUST exactly match one option.

TRUE/FALSE:
- MUST contain exactly True and False.
- C MUST be exactly True or False.

SHORT ANSWER:
- MUST NOT contain options.
- C MUST contain the expected answer.
- Keep expected answers concise.

Never return:
- empty MCQ options
- null options
- fewer than 4 MCQ options
- more than 4 MCQ options
- missing correct answer
- missing question
- invalid TYPE

CONTENT

${String(text || "").substring(0, 15000)}
`;

        const generatedText = await generateAIResponse(prompt);

        if (!generatedText || typeof generatedText !== "string") {
            throw new Error("AI returned empty quiz");
        }

        let cleanedText = generatedText
            .replace(/```text/gi, "")
            .replace(/```/g, "")
            .trim();

        cleanedText = cleanedText.replace(/\r\n/g, "\n");

        const questionBlocks = cleanedText
            .split(/\n\s*---+\s*\n/)
            .map((block) => block.trim())
            .filter(Boolean);

        const questions = [];

        for (const block of questionBlocks) {
            try {
                const lines = block
                    .split("\n")
                    .map((line) => line.trim())
                    .filter(Boolean);

                let type = "";
                let question = "";
                let options = [];
                let correctAnswer = "";
                let explanation = "";
                let difficulty = "medium";

                for (const line of lines) {
                    if (/^TYPE\s*:/i.test(line)) {
                        type = line
                            .replace(/^TYPE\s*:/i, "")
                            .trim()
                            .toLowerCase();
                    } else if (/^Q\s*:/i.test(line)) {
                        question = line
                            .replace(/^Q\s*:/i, "")
                            .trim();
                    } else if (
                        /^(01|02|03|04|1|2|3|4)\s*:/i.test(line)
                    ) {
                        const option = line
                            .replace(
                                /^(01|02|03|04|1|2|3|4)\s*:/i,
                                ""
                            )
                            .trim();

                        if (
                            option &&
                            option.toLowerCase() !== "n/a" &&
                            option.toLowerCase() !== "null"
                        ) {
                            options.push(option);
                        }
                    } else if (/^C\s*:/i.test(line)) {
                        correctAnswer = line
                            .replace(/^C\s*:/i, "")
                            .trim();
                    } else if (/^E\s*:/i.test(line)) {
                        explanation = line
                            .replace(/^E\s*:/i, "")
                            .trim();
                    } else if (/^D\s*:/i.test(line)) {
                        const parsedDifficulty = line
                            .replace(/^D\s*:/i, "")
                            .trim()
                            .toLowerCase();

                        if (
                            ["easy", "medium", "hard"].includes(
                                parsedDifficulty
                            )
                        ) {
                            difficulty = parsedDifficulty;
                        }
                    }
                }

                if (
                    type === "multiple_choice" ||
                    type === "multiple-choice" ||
                    type === "multiplechoice"
                ) {
                    type = "mcq";
                }

                if (
                    type === "truefalse" ||
                    type === "true-false" ||
                    type === "true/false"
                ) {
                    type = "true_false";
                }

                if (
                    type === "short-answer" ||
                    type === "shortanswer" ||
                    type === "short answer"
                ) {
                    type = "short_answer";
                }

                options = options
                    .filter(
                        (option) =>
                            typeof option === "string" &&
                            option.trim().length > 0
                    )
                    .map((option) => option.trim());

                if (type === "true_false") {
                    options = ["True", "False"];

                    if (
                        correctAnswer.toLowerCase() === "true"
                    ) {
                        correctAnswer = "True";
                    } else if (
                        correctAnswer.toLowerCase() === "false"
                    ) {
                        correctAnswer = "False";
                    }
                }

                if (type === "short_answer") {
                    options = [];
                }

                if (!question) continue;
                if (!type) continue;
                if (!correctAnswer) continue;

                if (type === "mcq") {
                    if (options.length !== 4) continue;

                    const matchedOption = options.find(
                        (option) =>
                            option.toLowerCase().trim() ===
                            correctAnswer.toLowerCase().trim()
                    );

                    if (!matchedOption) continue;
                    correctAnswer = matchedOption;
                }

                if (type === "true_false") {
                    if (
                        !["True", "False"].includes(
                            correctAnswer
                        )
                    ) {
                        continue;
                    }
                }

                if (type === "short_answer") {
                    if (!correctAnswer.trim()) continue;
                    correctAnswer = correctAnswer.trim();
                }

                if (
                    ![
                        "mcq",
                        "true_false",
                        "short_answer",
                    ].includes(type)
                ) {
                    continue;
                }

                questions.push({
                    question,
                    questionType: type,
                    options,
                    correctAnswer,
                    explanation: explanation || "",
                    difficulty,
                });
            } catch (parseError) {
                console.error(
                    "Question parsing error:",
                    parseError
                );
            }
        }

        const uniqueQuestions = [];
        const seenQuestions = new Set();

        for (const question of questions) {
            const normalizedQuestion = question.question
                .toLowerCase()
                .replace(/\s+/g, " ")
                .trim();

            if (!seenQuestions.has(normalizedQuestion)) {
                seenQuestions.add(normalizedQuestion);
                uniqueQuestions.push(question);
            }
        }

        const finalQuestions = uniqueQuestions.slice(
            0,
            numQuestions
        );

        return finalQuestions;
    } catch (error) {
        console.error(
            "Generate Quiz Error:",
            error
        );

        throw new Error(
            error.message || "Failed to generate quiz"
        );
    }
};

const generateStudyPlan = async (
    subject,
    level,
    duration,
    dailyHours,
    goal
) => {
    const prompt = `
You are an expert AI learning planner.

Create a personalized study plan for a student.

Student Details:
Subject: ${subject}
Level: ${level}
Duration: ${duration} days
Daily Study Time: ${dailyHours} hours
Learning Goal: ${goal}

Requirements:
- Create exactly ${duration} days.
- Arrange topics from basic to advanced according to the student's level.
- Each day should contain a realistic amount of work based on the daily study time.
- Include practical tasks and practice where appropriate.
- Do not repeat the same topic unnecessarily.
- Make the plan suitable for the student's learning goal.

Return ONLY valid JSON.
Do not use markdown.
Do not add any explanation outside JSON.

Use exactly this format:

{
    "title": "string",
    "days": [
        {
            "dayNumber": 1,
            "topic": "string",
            "description": "string",
            "tasks": [
                "task 1",
                "task 2",
                "task 3"
            ]
        }
    ]
}
`;

    try {
        const generatedText = await generateAIResponse(prompt);

        const cleanResponse = generatedText
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();

        const plan = JSON.parse(cleanResponse);

        if (!plan.title || !Array.isArray(plan.days)) {
            throw new Error("Invalid study plan generated by AI");
        }

        if (plan.days.length !== Number(duration)) {
            throw new Error("AI generated incorrect number of days");
        }

        return plan;

    } catch (error) {
        console.error("Gemini Study Plan Error:", error);
        throw new Error("Failed to generate study plan");
    }
};

module.exports = {
    generateAIResponse,
    generateSummary,
    explainConcept,
    chatWithContext,
    generateFlashcards,
    generateQuiz,
    generateStudyPlan
};