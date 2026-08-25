import React, { useState } from "react";
import axios from "axios";
import {
    ArrowLeft,
    BookOpen,
    Clock,
    Target,
    CalendarDays,
    Loader2,
    Sparkles,
    ArrowRight,
    Check
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../Api";

const CreateStudyPlan = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        subject: "",
        level: "Beginner",
        duration: 7,
        dailyHours: 2,
        goal: "",
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const token = localStorage.getItem("token");

    const levels = ["Beginner", "Intermediate", "Advanced"];
    const durations = [3, 5, 7, 14, 30];
    const dailyHoursOptions = [1, 2, 3, 4, 5];

    const totalHours = Number(formData.duration) * Number(formData.dailyHours);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.subject.trim()) {
            setError("Subject is required");
            return;
        }

        if (!formData.goal.trim()) {
            setError("Goal is required");
            return;
        }

        try {
            setLoading(true);
            setError("");

            const response = await axios.post(
                `${api}/studyPlan/generate`,
                {
                    subject: formData.subject.trim(),
                    level: formData.level,
                    duration: Number(formData.duration),
                    dailyHours: Number(formData.dailyHours),
                    goal: formData.goal.trim(),
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.data.success) {
                navigate("/studyPlan");
            }
        } catch (error) {
            console.error("Create Study Plan Error:", error);
            setError(
                error.response?.data?.message || "Failed to create study plan"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8">
            <div className="mx-auto max-w-2xl">
                
                {/* Back Button */}
                <button
                    onClick={() => navigate("/studyPlan")}
                    className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-[#19b673]"
                >
                    <ArrowLeft size={18} />
                    Back to Study Plans
                </button>

                {/* Header with Icon Block */}
                <div className="mb-7 flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 shadow-sm">
                        <BookOpen size={23} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">
                            Create Study Plan
                        </h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Build a personalized learning path based on your goals.
                        </p>
                    </div>
                </div>

                {/* Form Card */}
                <form
                    onSubmit={handleSubmit}
                    className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
                >
                    {error && (
                        <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                            {error}
                        </div>
                    )}

                    {/* Subject */}
                    <div className="mb-6">
                        <label className="mb-2 block text-sm font-semibold text-slate-800">
                            What do you want to learn?
                        </label>
                        <div className="relative">
                            <BookOpen
                                size={18}
                                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                            />
                            <input
                                type="text"
                                name="subject"
                                value={formData.subject}
                                onChange={handleChange}
                                placeholder="e.g. JavaScript, React, System Design"
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3.5 pl-11 pr-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-[#19b673] focus:bg-white focus:ring-4 focus:ring-[#19b673]/10"
                            />
                        </div>
                    </div>

                    {/* Level Selection Cards */}
                    <div className="mb-6">
                        <label className="mb-2 block text-sm font-semibold text-slate-800">
                            Your Current Level
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                            {levels.map((lvl) => (
                                <button
                                    key={lvl}
                                    type="button"
                                    onClick={() =>
                                        setFormData((prev) => ({ ...prev, level: lvl }))
                                    }
                                    className={`relative flex items-center justify-center rounded-2xl border px-3 py-3 text-sm font-semibold transition ${
                                        formData.level === lvl
                                            ? "border-[#19b673] bg-emerald-50/70 text-[#19b673] shadow-sm"
                                            : "border-slate-200 bg-slate-50/50 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                                    }`}
                                >
                                    {lvl}
                                    {formData.level === lvl && (
                                        <span className="absolute right-2.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#19b673] text-[10px] text-white">
                                            <Check size={10} strokeWidth={3} />
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Duration & Daily Hours Grid */}
                    <div className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
                        
                        {/* Duration */}
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-800">
                                Duration (Days)
                            </label>
                            <div className="relative">
                                <CalendarDays
                                    size={18}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                                />
                                <select
                                    name="duration"
                                    value={formData.duration}
                                    onChange={handleChange}
                                    className="w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50/50 py-3.5 pl-11 pr-4 text-sm font-medium text-slate-800 outline-none transition focus:border-[#19b673] focus:bg-white focus:ring-4 focus:ring-[#19b673]/10 cursor-pointer"
                                >
                                    {durations.map((d) => (
                                        <option key={d} value={d}>
                                            {d} Days
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Daily Hours */}
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-800">
                                Daily Study Time
                            </label>
                            <div className="relative">
                                <Clock
                                    size={18}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                                />
                                <select
                                    name="dailyHours"
                                    value={formData.dailyHours}
                                    onChange={handleChange}
                                    className="w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50/50 py-3.5 pl-11 pr-4 text-sm font-medium text-slate-800 outline-none transition focus:border-[#19b673] focus:bg-white focus:ring-4 focus:ring-[#19b673]/10 cursor-pointer"
                                >
                                    {dailyHoursOptions.map((h) => (
                                        <option key={h} value={h}>
                                            {h} {h === 1 ? "Hour" : "Hours"} / day
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Goal */}
                    <div className="mb-6">
                        <label className="mb-2 block text-sm font-semibold text-slate-800">
                            What is your goal?
                        </label>
                        <div className="relative">
                            <Target
                                size={18}
                                className="absolute left-4 top-4 text-slate-400"
                            />
                            <textarea
                                name="goal"
                                value={formData.goal}
                                onChange={handleChange}
                                rows={3}
                                placeholder="e.g. Master React hooks and prepare for frontend interviews"
                                className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50/50 py-3.5 pl-11 pr-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-[#19b673] focus:bg-white focus:ring-4 focus:ring-[#19b673]/10"
                            />
                        </div>
                    </div>

                    {/* Plan Preview Card */}
                    <div className="mb-7 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 transition-all">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm text-[#19b673]">
                                <Sparkles size={18} />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-slate-800">
                                    Study Plan Preview
                                </p>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    {formData.subject ? formData.subject : "Your Subject"} • {formData.level} • {formData.duration} Days
                                </p>
                            </div>
                        </div>
                        <div className="mt-3 flex items-center justify-between border-t border-emerald-100/80 pt-3 text-xs font-bold text-emerald-800">
                            <span>Estimated Effort:</span>
                            <span className="bg-emerald-100/80 px-2.5 py-1 rounded-lg">
                                {totalHours} Hours Total ({formData.dailyHours}h / day)
                            </span>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-[#19b673] px-5 py-4 text-sm font-bold text-white shadow-sm transition-all hover:bg-[#159d63] hover:shadow-md active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {loading ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Generating Study Plan...
                            </>
                        ) : (
                            <>
                                <Sparkles size={18} />
                                Generate Study Plan
                                <ArrowRight
                                    size={18}
                                    className="transition-transform group-hover:translate-x-0.5"
                                />
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CreateStudyPlan;