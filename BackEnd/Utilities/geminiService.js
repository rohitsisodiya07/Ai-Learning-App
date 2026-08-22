require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

// 1. Verify API Key before initialization
if (!process.env.GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY is not set in .env");
    process.exit(1);
}

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

// Central Helper Function for AI Calls
const generateAIResponse = async (prompt) => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-3.5-flash-lite",
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Gemini API Error:", error);
        throw new Error("Failed to generate AI response");
    }
};

// Generate Summary
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

// Explain Concept
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

// Chat With Document Context
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

// Generate Flashcards
const generateFlashcards = async (text, count = 10) => {
    const prompt = `Generate exactly ${count} educational flashcards from the following text.
Format each flashcard exactly like this:
Q: [Clear, specific question]
A: [Concise, accurate answer]
D: [Difficulty level: easy, medium, or hard]
Separate each flashcard with:
---

Text:
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

// Generate Quiz with support for multiple types
const generateQuiz = async (text, numQuestions = 5, questionType = "mixed") => {
    let typeInstruction = "";

    if (questionType === "mcq") {
        typeInstruction = "Generate only multiple-choice questions (mcq) with 4 options.";
    } else if (questionType === "true_false") {
        typeInstruction = "Generate only True/False questions (true_false).";
    } else if (questionType === "short_answer") {
        typeInstruction = "Generate only Short Answer questions (short_answer).";
    } else {
        typeInstruction = "Generate a balanced mix of mcq, true_false, and short_answer questions.";
    }

    const prompt = `Generate exactly ${numQuestions} questions from the following text.
${typeInstruction}

Use this exact format for EVERY question:
TYPE: [mcq / true_false / short_answer]
Q: [Question text]
01: [Option 1 or True]
02: [Option 2 or False]
03: [Option 3 - only for mcq, else skip]
04: [Option 4 - only for mcq, else skip]
C: [Correct answer matching one of the options or exact text]
E: [Brief explanation]
D: [Difficulty: easy, medium, or hard]

Separate each question with:
---

Text:
${text.substring(0, 15000)}`;

    try {
        const generatedText = await generateAIResponse(prompt);
        const questions = [];
        const questionBlocks = generatedText.split("---").filter(q => q.trim());

        for (const block of questionBlocks) {
            const lines = block.trim().split("\n").map(l => l.trim()).filter(Boolean);

            let type = "mcq";
            let question = "";
            let options = [];
            let correctAnswer = "";
            let explanation = "";
            let difficulty = "medium";

            for (const line of lines) {
                if (line.startsWith("TYPE:")) {
                    const parsedType = line.substring(5).trim().toLowerCase();
                    if (["mcq", "true_false", "short_answer"].includes(parsedType)) {
                        type = parsedType;
                    }
                } else if (line.startsWith("Q:")) {
                    question = line.substring(2).trim();
                } else if (/^(0[1-4]|[1-4]):/.test(line)) {
                    const optionText = line.replace(/^(0[1-4]|[1-4]):/, "").trim();
                    if (optionText && optionText !== "N/A") {
                        options.push(optionText);
                    }
                } else if (line.startsWith("C:")) {
                    correctAnswer = line.substring(2).trim();
                } else if (line.startsWith("E:")) {
                    explanation = line.substring(2).trim();
                } else if (line.startsWith("D:")) {
                    const diff = line.substring(2).trim().toLowerCase();
                    if (["easy", "medium", "hard"].includes(diff)) difficulty = diff;
                }
            }

            // Fallback options for True/False if AI didn't format 01/02 properly
            if (type === "true_false" && options.length === 0) {
                options = ["True", "False"];
            }

            // Validation checks before pushing
            if (type === "mcq" && question && options.length >= 2 && correctAnswer) {
                questions.push({ questionType: type, question, options, correctAnswer, explanation, difficulty });
            } else if (type === "true_false" && question && correctAnswer) {
                if (options.length === 0) options = ["True", "False"];
                questions.push({ questionType: type, question, options, correctAnswer, explanation, difficulty });
            } else if (type === "short_answer" && question && correctAnswer) {
                questions.push({ questionType: type, question, options: [], correctAnswer, explanation, difficulty });
            }
        }

        return questions.slice(0, numQuestions);
    } catch (error) {
        console.error("Gemini Quiz Error:", error);
        throw new Error("Failed to generate quiz");
    }
};

module.exports = {
    generateAIResponse,
    generateSummary,
    explainConcept,
    chatWithContext,
    generateFlashcards,
    generateQuiz
};