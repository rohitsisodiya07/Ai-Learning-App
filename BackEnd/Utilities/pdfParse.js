const { PDFParse } = require("pdf-parse");

const extractTextFromPDF = async (fileBuffer) => {
    let parser;

    try {
        if (!Buffer.isBuffer(fileBuffer)) {
            throw new Error("Invalid PDF buffer");
        }

        parser = new PDFParse({
            data: fileBuffer
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
        throw new Error(
            error.message || "Failed to extract text from PDF"
        );
    } finally {
        if (parser) {
            await parser.destroy();
        }
    }
};

module.exports = {
    extractTextFromPDF
};