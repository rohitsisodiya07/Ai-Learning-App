require("dotenv").config();

const sendEmail = async (to, subject, html) => {
    try {
        if (!to || !subject || !html) {
            throw new Error("Email, subject and HTML content are required");
        }

        if (!process.env.BREVO_API_KEY) {
            throw new Error("BREVO_API_KEY is not configured");
        }

        if (!process.env.BREVO_FROM_EMAIL) {
            throw new Error("BREVO_FROM_EMAIL is not configured");
        }

        const response = await fetch("https://api.brevo.com/v3/smtp/email", {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                "api-key": process.env.BREVO_API_KEY,
            },
            body: JSON.stringify({
                sender: {
                    email: process.env.BREVO_FROM_EMAIL,
                    name: "AI Learning App",
                },
                to: [{ email: to }],
                subject,
                htmlContent: html,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("❌ Brevo Error:", data);
            throw new Error(data?.message || "Failed to send email");
        }

        console.log("✅ Email sent successfully:", data?.messageId || data);

        return {
            success: true,
            messageId: data?.messageId,
        };

    } catch (error) {
        console.error("❌ Email Error:", error.message);
        throw error;
    }
};

module.exports = {
    sendEmail
};