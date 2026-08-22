/**
 * Split text into chunks for better AI processing
 *
 * @param {string} text - Full text to chunk
 * @param {number} chunkSize - Target words per chunk
 * @param {number} overlap - Words to overlap between chunks
 * @returns {Array<{content: string, chunkIndex: number, pageNumber: number}>}
 */
const chunkText = (text, chunkSize = 500, overlap = 50) => {
    if (!text || typeof text !== "string" || text.trim().length === 0) {
        return [];
    }

    if (chunkSize <= 0 || overlap < 0 || overlap >= chunkSize) {
        throw new Error("Invalid chunk settings: overlap must be smaller than chunkSize");
    }

    const cleanedText = text
        .replace(/\r\n/g, "\n")
        .replace(/[ \t]+/g, " ")
        .replace(/\n+/g, "\n")
        .trim();

    const paragraphs = cleanedText
        .split(/\n+/)
        .filter(paragraph => paragraph.trim().length > 0);

    const chunks = [];
    let currentChunk = [];
    let currentWordCount = 0;
    let chunkIndex = 0;

    for (const paragraph of paragraphs) {
        const paragraphWords = paragraph.trim().split(/\s+/);
        const paragraphWordCount = paragraphWords.length;

        if (paragraphWordCount > chunkSize) {
            if (currentChunk.length > 0) {
                chunks.push({
                    content: currentChunk.join("\n\n"),
                    chunkIndex: chunkIndex++,
                    pageNumber: 0
                });
                currentChunk = [];
                currentWordCount = 0;
            }

            for (let i = 0; i < paragraphWords.length; i += chunkSize - overlap) {
                const chunkWords = paragraphWords.slice(i, i + chunkSize);
                chunks.push({
                    content: chunkWords.join(" "),
                    chunkIndex: chunkIndex++,
                    pageNumber: 0
                });

                if (i + chunkSize >= paragraphWords.length) break;
            }
            continue;
        }

        if (currentWordCount + paragraphWordCount > chunkSize && currentChunk.length > 0) {
            chunks.push({
                content: currentChunk.join("\n\n"),
                chunkIndex: chunkIndex++,
                pageNumber: 0
            });

            const previousChunkText = currentChunk.join(" ");
            const previousWords = previousChunkText.split(/\s+/);
            const overlapWords = previousWords.slice(-Math.min(overlap, previousWords.length));

            currentChunk = [
                ...(overlapWords.length > 0 ? [overlapWords.join(" ")] : []),
                paragraph.trim()
            ];
            currentWordCount = overlapWords.length + paragraphWordCount;
        } else {
            currentChunk.push(paragraph.trim());
            currentWordCount += paragraphWordCount;
        }
    }

    if (currentChunk.length > 0) {
        chunks.push({
            content: currentChunk.join("\n\n"),
            chunkIndex: chunkIndex++,
            pageNumber: 0
        });
    }

    return chunks;
};

/**
 * Escape special characters before using text in RegExp
 */
const escapeRegex = (text) => {
    return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

/**
 * Find relevant chunks based on keyword matching
 *
 * @param {Array<Object>} chunks - Array of document chunks
 * @param {string} query - User search query
 * @param {number} maxChunks - Maximum chunks to return
 * @returns {Array<Object>}
 */
const findRelevantChunks = (chunks, query, maxChunks = 3) => {
    if (!Array.isArray(chunks) || chunks.length === 0 || !query || typeof query !== "string") {
        return [];
    }

    const stopWords = new Set([
        "the", "is", "at", "which", "on", "a", "an", "and", "or", "but",
        "in", "with", "to", "for", "of", "as", "by", "this", "that", "it",
        "how", "what", "why", "when", "where"
    ]);

    const queryWords = query
        .toLowerCase()
        .split(/\s+/)
        .map(word => word.replace(/[^\w]/g, "").trim())
        .filter(word => word.length > 2 && !stopWords.has(word));

    if (queryWords.length === 0) {
        return chunks.slice(0, maxChunks).map(chunk => ({
            content: chunk.content,
            chunkIndex: chunk.chunkIndex,
            pageNumber: chunk.pageNumber,
            _id: chunk._id
        }));
    }

    const scoredChunks = chunks.map((chunk, index) => {
        const content = String(chunk.content || "").toLowerCase();
        if (!content) return null;

        const contentWords = content.split(/\s+/);
        let score = 0;

        for (const word of queryWords) {
            const safeWord = escapeRegex(word);

            const exactMatches = content.match(new RegExp(`\\b${safeWord}\\b`, "g")) || [];
            score += exactMatches.length * 3;

            const partialMatches = content.match(new RegExp(safeWord, "g")) || [];
            score += Math.max(0, partialMatches.length - exactMatches.length) * 1.5;
        }

        const uniqueWordsFound = queryWords.filter(word => content.includes(word)).length;
        if (uniqueWordsFound > 1) score += uniqueWordsFound * 2;

        const normalizedScore = score / Math.sqrt(contentWords.length);
        const positionBonus = 1 - (index / chunks.length) * 0.1;

        return {
            content: chunk.content,
            chunkIndex: chunk.chunkIndex,
            pageNumber: chunk.pageNumber,
            _id: chunk._id,
            score: normalizedScore * positionBonus,
            rawScore: score,
            matchedWords: uniqueWordsFound
        };
    });

    const relevantChunks = scoredChunks
        .filter(chunk => chunk && chunk.score > 0)
        .sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            if (b.matchedWords !== a.matchedWords) return b.matchedWords - a.matchedWords;
            return a.chunkIndex - b.chunkIndex;
        })
        .slice(0, maxChunks);

    if (relevantChunks.length === 0) {
        return chunks.slice(0, maxChunks).map(chunk => ({
            content: chunk.content,
            chunkIndex: chunk.chunkIndex,
            pageNumber: chunk.pageNumber,
            _id: chunk._id
        }));
    }

    return relevantChunks;
};

module.exports = {
    chunkText,
    findRelevantChunks
};

// Iska main benefit kya hai?

// Agar PDF 200 pages ka hai, tumhe har question par:

//  200 pages Gemini ko nahi bhejne.

// Instead:

// 200 pages
//    ↓
// Extract text
//    ↓
// Chunks
//    ↓
// User Question
//    ↓
// Relevant chunks
//    ↓
// Top 3
//    ↓
// Gemini

// Is concept ko broadly RAG (Retrieval-Augmented Generation) kehte hain.