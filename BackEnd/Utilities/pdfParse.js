const fs = require('fs');
const { PDFParse } = require('pdf-parse');

// Extract Text From PDF
const extractTextFromPDF = async (filePath) => {
    let parser;

    try {
        const dataBuffer = await fs.promises.readFile(filePath);

        parser = new PDFParse({
            data: dataBuffer
        });

        const data = await parser.getText();

        if (!data.text || !data.text.trim()) {
            throw new Error("No readable text found in PDF");
        }

        return {
            text: data.text,
            numPages: data.total,
            info: data.info
        };

    } catch (error) {
        console.error("PDF parsing error:", error);
        throw new Error(error.message || "Failed to extract text from PDF");
    } finally {
        if (parser) {
            await parser.destroy();
        }
    }
};

module.exports = {
    extractTextFromPDF
};