require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(
    "/uploads",
    express.static(path.join(__dirname, "uploads"))
);

const port = process.env.PORT || 4000;

mongoose
    .connect(process.env.MONGO_URL)
    .then(() => {
        console.log("MongoDB Connected");
    })
    .catch((err) => {
        console.log("MongoDB Connection Error:", err);
    });

const userRoutes = require("./Routes/userRoutes");
const documentRoutes = require("./Routes/documentRoutes");
const flashcardRoutes = require("./Routes/flashcardRoutes");
const aiRoutes = require("./Routes/aiRoutes");
const quizRoutes = require("./Routes/quizRoutes");
const progressRoutes = require("./Routes/progressRoutes");
const notificationRoutes = require('./Routes/notificationRoute')
const studyPlanRoutes = require('./Routes/studyPlanRoutes')


app.use("/user", userRoutes);
app.use("/document", documentRoutes);
app.use("/flashcard", flashcardRoutes);
app.use("/ai", aiRoutes);
app.use("/quiz", quizRoutes);
app.use("/progress", progressRoutes);
app.use("/notification", notificationRoutes);
app.use("/studyPlan", studyPlanRoutes);

app.listen(port, () => {
    console.log(`Server is Connected on Port ${port}`);
});