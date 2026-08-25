const studyActivityModel = require("../Model/studyActivityModel");

const recordStudyActivity = async (userId, activityType) => {
    try {
        const now = new Date();

        const startOfDay = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
        );

        const endOfDay = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate() + 1
        );

        let activity = await studyActivityModel.findOne({
            userId,
            activityDate: {
                $gte: startOfDay,
                $lt: endOfDay,
            },
        });

        if (!activity) {
            activity = new studyActivityModel({
                userId,
                activityDate: startOfDay,
            });
        }

        switch (activityType) {
            case "quiz":
                activity.quizCount += 1;
                break;

            case "flashcard":
                activity.flashcardCount += 1;
                break;

            case "studyPlan":
                activity.studyPlanCount += 1;
                break;

            case "weakTopicQuiz":
                activity.weakTopicQuizCount += 1;
                break;

            default:
                throw new Error(
                    `Invalid activity type: ${activityType}`
                );
        }

        await activity.save();

        return activity;

    } catch (error) {
        console.error(
            "Record Study Activity Error:",
            error
        );

        throw error;
    }
};

const calculateStudyStats = (activities) => {
    const studyDates = new Set();

    activities.forEach((activity) => {
        const totalActivity =
            (Number(activity.quizCount) || 0) +
            (Number(activity.flashcardCount) || 0) +
            (Number(activity.studyPlanCount) || 0) +
            (Number(activity.weakTopicQuizCount) || 0);

        if (totalActivity <= 0) {
            return;
        }

        const date = new Date(activity.activityDate);

        if (Number.isNaN(date.getTime())) {
            return;
        }

        const dateString =
            `${date.getFullYear()}-${String(
                date.getMonth() + 1
            ).padStart(2, "0")}-${String(
                date.getDate()
            ).padStart(2, "0")}`;

        studyDates.add(dateString);
    });

    const sortedDates = Array.from(studyDates).sort(
        (a, b) =>
            new Date(`${b}T00:00:00`) -
            new Date(`${a}T00:00:00`)
    );

    const totalStudyDays = sortedDates.length;

    const lastStudyDate =
        sortedDates.length > 0
            ? sortedDates[0]
            : null;

    let currentStreak = 0;

    if (sortedDates.length > 0) {
        const today = new Date();

        const todayString =
            `${today.getFullYear()}-${String(
                today.getMonth() + 1
            ).padStart(2, "0")}-${String(
                today.getDate()
            ).padStart(2, "0")}`;

        const yesterday = new Date(today);

        yesterday.setDate(
            yesterday.getDate() - 1
        );

        const yesterdayString =
            `${yesterday.getFullYear()}-${String(
                yesterday.getMonth() + 1
            ).padStart(2, "0")}-${String(
                yesterday.getDate()
            ).padStart(2, "0")}`;

        if (
            sortedDates[0] === todayString ||
            sortedDates[0] === yesterdayString
        ) {
            currentStreak = 1;

            for (
                let i = 1;
                i < sortedDates.length;
                i++
            ) {
                const previousDate =
                    new Date(
                        `${sortedDates[i - 1]}T00:00:00`
                    );

                const currentDate =
                    new Date(
                        `${sortedDates[i]}T00:00:00`
                    );

                const difference =
                    Math.round(
                        (
                            previousDate -
                            currentDate
                        ) /
                        (1000 * 60 * 60 * 24)
                    );

                if (difference === 1) {
                    currentStreak++;
                } else {
                    break;
                }
            }
        }
    }

    let longestStreak = 0;

    if (sortedDates.length > 0) {
        const ascendingDates = [
            ...sortedDates,
        ].reverse();

        let tempStreak = 1;

        longestStreak = 1;

        for (
            let i = 1;
            i < ascendingDates.length;
            i++
        ) {
            const previousDate =
                new Date(
                    `${ascendingDates[i - 1]}T00:00:00`
                );

            const currentDate =
                new Date(
                    `${ascendingDates[i]}T00:00:00`
                );

            const difference =
                Math.round(
                    (
                        currentDate -
                        previousDate
                    ) /
                    (1000 * 60 * 60 * 24)
                );

            if (difference === 1) {
                tempStreak++;

                longestStreak = Math.max(
                    longestStreak,
                    tempStreak
                );
            } else {
                tempStreak = 1;
            }
        }
    }

    return {
        currentStreak,
        longestStreak,
        totalStudyDays,
        lastStudyDate,
    };
};

module.exports = {
    recordStudyActivity,
    calculateStudyStats,
};