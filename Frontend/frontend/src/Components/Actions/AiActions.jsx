import React, { useState } from "react";
import { useParams } from "react-router-dom";
import {
    BookOpen,
    Lightbulb,
    Sparkles,
    ArrowRight,
    Loader2,
    WandSparkles
} from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";

import api from "../../Api";
import Modal from "./Modal";
import MarkdownRenderer from "../Chat/MarkDownRender";

const AiActions = () => {
    const { id: documentId } = useParams();

    const [loadingAction, setLoadingAction] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState("");
    const [modalTitle, setModalTitle] = useState("");
    const [concept, setConcept] = useState("");

    // Generate Summary
    const handleGenerateSummary = async () => {
        setLoadingAction("summary");
        try {
            const token = localStorage.getItem("token");
            const response = await axios.post(
                `${api}/ai/summary`,
                { documentId },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            console.log("Summary Response:", response.data);

            setModalTitle("Generated Summary");
            setModalContent(response.data.summary);
            setIsModalOpen(true);
        } catch (error) {
            console.log("Summary Error:", error);
            toast.error(error.response?.data?.message || "Failed to generate summary");
        } finally {
            setLoadingAction(null);
        }
    };

    // Explain Concept
    const handleExplainConcept = async (e) => {
        e.preventDefault();
        if (!concept.trim()) {
            return toast.error("Please enter a concept to explain.");
        }

        setLoadingAction("explain");
        try {
            const token = localStorage.getItem("token");
            const currentConcept = concept.trim();
            const response = await axios.post(
                `${api}/ai/explain`,
                { documentId, concept: currentConcept },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            console.log("Explain Response:", response.data);

            const explanation = response.data?.data?.explanation;
            setModalTitle(`Explanation of "${currentConcept}"`);
            setModalContent(explanation || "No explanation available.");
            setIsModalOpen(true);
            setConcept("");
        } catch (error) {
            console.log("Explain Error:", error);
            toast.error(error.response?.data?.message || "Failed to explain concept");
        } finally {
            setLoadingAction(null);
        }
    };

    const handleQuickConcept = (value) => {
        setConcept(value);
    };

    return (
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            {/* HEADER */}
            <div className="relative px-6 py-6 sm:px-7 sm:py-7 border-b border-slate-200 overflow-hidden">
                {/* Background decoration */}
                <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-emerald-100/50 blur-2xl" />
                <div className="absolute right-20 bottom-0 w-24 h-24 rounded-full bg-teal-100/40 blur-2xl" />

                <div className="relative flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
                        <Sparkles className="w-7 h-7 text-white" />
                    </div>

                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg sm:text-xl font-bold text-slate-900">AI Assistant</h2>
                            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-wide">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> AI Powered
                            </span>
                        </div>
                        <p className="text-sm text-slate-500 mt-1">Understand your document faster with AI</p>
                    </div>
                </div>
            </div>

            {/* ACTION AREA */}
            <div className="p-5 sm:p-6 bg-slate-50/50 space-y-4">

                {/* SUMMARY CARD */}
                <div className="group bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 transition-all duration-200 hover:border-emerald-200 hover:shadow-md">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                        <div className="flex gap-4">
                            <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                                <BookOpen className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="text-base font-semibold text-slate-900">Generate Summary</h3>
                                <p className="text-sm text-slate-500 mt-1 leading-6 max-w-xl">
                                    Get a concise AI-generated overview of the entire document and focus on the most important information.
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={handleGenerateSummary}
                            disabled={loadingAction === "summary"}
                            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold transition-all shadow-sm hover:shadow-md active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed shrink-0"
                        >
                            {loadingAction === "summary" ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" /> Generating...
                                </>
                            ) : (
                                <>
                                    <Sparkles size={16} /> Summarize <ArrowRight size={15} />
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* EXPLAIN CONCEPT */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 transition-all duration-200 hover:border-amber-200 hover:shadow-md">
                    <div className="flex gap-4">
                        <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                            <Lightbulb className="w-5 h-5 text-amber-500" />
                        </div>
                        <div>
                            <h3 className="text-base font-semibold text-slate-900">Explain a Concept</h3>
                            <p className="text-sm text-slate-500 mt-1 leading-6">
                                Enter any topic from your document and let AI explain it in simple terms.
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleExplainConcept} className="mt-5">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative flex-1">
                                <WandSparkles size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    value={concept}
                                    onChange={(e) => setConcept(e.target.value)}
                                    placeholder="Enter a concept, e.g. React Hooks"
                                    disabled={loadingAction === "explain"}
                                    className="w-full h-12 pl-11 pr-4 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-all focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:opacity-60"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loadingAction === "explain" || !concept.trim()}
                                className="h-12 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed sm:min-w-[120px]"
                            >
                                {loadingAction === "explain" ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" /> Explaining...
                                    </>
                                ) : (
                                    <>
                                        Explain <ArrowRight size={15} />
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Quick suggestions */}
                        <div className="mt-4">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                                    Try asking about
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {["Main concept", "Important terms", "Key points"].map((item) => (
                                    <button
                                        key={item}
                                        type="button"
                                        onClick={() => handleQuickConcept(item)}
                                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-emerald-50 text-slate-500 hover:text-emerald-600 text-xs font-medium transition-colors"
                                    >
                                        {item}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            {/* MODAL */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalTitle}>
                <div className="max-h-[65vh] overflow-y-auto px-1 pr-2">
                    <MarkdownRenderer content={modalContent} />
                </div>
            </Modal>
        </div>
    );
};

export default AiActions;