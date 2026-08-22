import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import {
    Send,
    MessageSquare,
    Sparkles,
    User,
    Bot,
    RotateCcw,
    FileText,
    ChevronRight
} from "lucide-react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";

import api from "../../Api";
import MarkDownRender from "./MarkDownRender";
import Spinner from "../Common/Spinner";

const ChatInterface = () => {
    const { id: documentId } = useParams();

    const [history, setHistory] = useState([]);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);

    const messagesEndRef = useRef(null);
    const textareaRef = useRef(null);

    const token = localStorage.getItem("token");

    // Get Chat History
    useEffect(() => {
        const fetchChatHistory = async () => {
            try {
                setInitialLoading(true);
                const response = await axios.get(`${api}/ai/chat/${documentId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                console.log("Chat History:", response.data);
                setHistory(response.data?.data || []);
            } catch (error) {
                console.log("Chat History Error:", error);
                toast.error(error.response?.data?.message || "Failed to load chat history");
            } finally {
                setInitialLoading(false);
            }
        };

        if (documentId) {
            fetchChatHistory();
        }
    }, [documentId, token]);

    // Auto Scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [history, loading]);

    // Auto Resize Textarea
    useEffect(() => {
        if (!textareaRef.current) return;
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
    }, [message]);

    // Send Message
    const handleSendMessage = async (e) => {
        if (e) e.preventDefault();
        if (!message.trim() || loading) return;

        const currentMessage = message.trim();

        // Add user message immediately
        setHistory((prev) => [
            ...prev,
            { role: "user", content: currentMessage, temporary: true }
        ]);
        setMessage("");
        setLoading(true);

        try {
            const response = await axios.post(
                `${api}/ai/chat`,
                { documentId: documentId, question: currentMessage },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            console.log("Chat Response:", response.data);
            const answer = response.data?.data?.answer || response.data?.answer || "No response received.";

            // Add AI response
            setHistory((prev) => [...prev, { role: "assistant", content: answer }]);
        } catch (error) {
            console.log("Chat Error:", error);
            toast.error(error.response?.data?.message || "Failed to get AI response");
            // Remove temporary user message if API fails
            setHistory((prev) => prev.filter((item) => !item.temporary));
        } finally {
            setLoading(false);
            setTimeout(() => textareaRef.current?.focus(), 100);
        }
    };

    // Keyboard Handler
    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage(e);
        }
    };

    // Suggested Question
    const handleSuggestedQuestion = (question) => {
        if (loading) return;
        setMessage(question);
        setTimeout(() => textareaRef.current?.focus(), 50);
    };

    // Clear Chat UI
    const handleClearChat = () => {
        if (loading || history.length === 0) return;
        const confirmClear = window.confirm("Are you sure you want to clear this chat?");
        if (!confirmClear) return;

        setHistory([]);
        toast.success("Chat cleared");
    };

    if (initialLoading) {
        return (
            <div className="h-[75vh] flex flex-col items-center justify-center bg-white border border-slate-200 rounded-3xl shadow-sm">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center">
                    <Sparkles className="w-7 h-7 text-emerald-600 animate-pulse" />
                </div>
                <div className="mt-4"><Spinner /></div>
                <p className="text-sm text-slate-500 mt-3">Loading your document chat...</p>
            </div>
        );
    }

    return (
        <div className="w-full h-[75vh] min-h-[600px] flex flex-col bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">

            {/* HEADER */}
            <div className="shrink-0 px-5 py-4 border-b border-slate-200 bg-white">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="relative shrink-0">
                            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center">
                                <Sparkles className="w-5 h-5 text-emerald-600" />
                            </div>
                            <span className="absolute -right-0.5 -bottom-0.5 w-3.5 h-3.5 rounded-full bg-white flex items-center justify-center">
                                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            </span>
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <h2 className="text-sm sm:text-base font-semibold text-slate-900 truncate">Document AI</h2>
                                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-semibold">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Online
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-500">
                                <FileText size={12} />
                                <span>Ask questions about your document</span>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleClearChat}
                        disabled={loading || history.length === 0}
                        title="Clear chat"
                        className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <RotateCcw size={16} />
                    </button>
                </div>
            </div>

            {/* MESSAGES */}
            <div className="flex-1 overflow-y-auto bg-gradient-to-b from-slate-50/80 to-white">
                <div className="max-w-4xl mx-auto p-4 sm:p-6">

                    {/* EMPTY STATE */}
                    {history.length === 0 && (
                        <div className="min-h-[430px] flex flex-col items-center justify-center text-center px-4">
                            <div className="relative mb-5">
                                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center">
                                    <MessageSquare className="w-9 h-9 text-emerald-600" />
                                </div>
                                <div className="absolute -right-2 -top-2 w-8 h-8 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center">
                                    <Sparkles size={15} className="text-amber-500" />
                                </div>
                            </div>
                            <h3 className="text-xl font-bold text-slate-900">Ask your document</h3>
                            <p className="text-sm text-slate-500 mt-2 max-w-md leading-6">
                                Ask questions about your PDF and get AI-powered answers based on its content.
                            </p>

                            {/* Suggested Questions */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-7 w-full max-w-xl">
                                <button
                                    onClick={() => handleSuggestedQuestion("Summarize this document")}
                                    className="group text-left p-4 rounded-2xl border border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/50 transition"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-slate-700">Summarize this document</span>
                                        <ChevronRight size={16} className="text-slate-300 group-hover:text-emerald-500 transition" />
                                    </div>
                                    <p className="text-xs text-slate-400 mt-1">Get the main points quickly</p>
                                </button>
                                <button
                                    onClick={() => handleSuggestedQuestion("What are the key points of this document?")}
                                    className="group text-left p-4 rounded-2xl border border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/50 transition"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-slate-700">Key points</span>
                                        <ChevronRight size={16} className="text-slate-300 group-hover:text-emerald-500 transition" />
                                    </div>
                                    <p className="text-xs text-slate-400 mt-1">Find the important information</p>
                                </button>
                                <button
                                    onClick={() => handleSuggestedQuestion("Explain this document in simple terms")}
                                    className="group text-left p-4 rounded-2xl border border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/50 transition"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-slate-700">Explain simply</span>
                                        <ChevronRight size={16} className="text-slate-300 group-hover:text-emerald-500 transition" />
                                    </div>
                                    <p className="text-xs text-slate-400 mt-1">Understand difficult concepts</p>
                                </button>
                                <button
                                    onClick={() => handleSuggestedQuestion("What are the most important things I should remember?")}
                                    className="group text-left p-4 rounded-2xl border border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/50 transition"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-slate-700">What should I remember?</span>
                                        <ChevronRight size={16} className="text-slate-300 group-hover:text-emerald-500 transition" />
                                    </div>
                                    <p className="text-xs text-slate-400 mt-1">Get study-focused information</p>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* MESSAGE LIST */}
                    <div className="space-y-6">
                        {history.map((msg, index) => {
                            const isUser = msg.role === "user";
                            return (
                                <div key={msg._id || index} className={`flex items-end gap-3 ${isUser ? "justify-end" : "justify-start"}`}>

                                    {/* AI AVATAR */}
                                    {!isUser && (
                                        <div className="w-9 h-9 shrink-0 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center border border-emerald-100">
                                            <Bot className="w-5 h-5 text-emerald-600" />
                                        </div>
                                    )}

                                    {/* MESSAGE */}
                                    <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3.5 text-sm leading-7 shadow-sm ${isUser
                                            ? "bg-emerald-500 text-white rounded-br-md"
                                            : "bg-white border border-slate-200 text-slate-700 rounded-bl-md"
                                        }`}
                                    >
                                        {isUser ? (
                                            <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                                        ) : (
                                            <MarkDownRender content={msg.content} />
                                        )}
                                    </div>

                                    {/* USER AVATAR */}
                                    {isUser && (
                                        <div className="w-9 h-9 shrink-0 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center">
                                            <User className="w-5 h-5 text-slate-500" />
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {/* AI TYPING */}
                        {loading && (
                            <div className="flex items-end gap-3">
                                <div className="w-9 h-9 shrink-0 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center border border-emerald-100">
                                    <Bot className="w-5 h-5 text-emerald-600" />
                                </div>
                                <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-md px-5 py-4 shadow-sm">
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" />
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:150ms]" />
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:300ms]" />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* INPUT AREA */}
            <div className="shrink-0 border-t border-slate-200 bg-white p-4">
                <div className="max-w-4xl mx-auto">
                    <form
                        onSubmit={handleSendMessage}
                        className="relative flex items-end gap-3 p-2 rounded-2xl border border-slate-200 bg-slate-50 focus-within:border-emerald-400 focus-within:ring-4 focus-within:ring-emerald-500/10 transition"
                    >
                        <textarea
                            ref={textareaRef}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={loading}
                            rows={1}
                            placeholder="Ask a question about this document..."
                            className="flex-1 resize-none min-h-[44px] max-h-[140px] py-2.5 px-3 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 outline-none disabled:opacity-50"
                        />
                        <button
                            type="submit"
                            disabled={loading || !message.trim()}
                            className="w-11 h-11 shrink-0 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center transition-all shadow-sm hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Send size={18} />
                            )}
                        </button>
                    </form>

                    {/* Bottom Hint */}
                    <div className="flex items-center justify-between px-2 mt-2">
                        <p className="text-[11px] text-slate-400">AI answers are based on your document.</p>
                        <p className="hidden sm:block text-[11px] text-slate-400">Enter to send • Shift + Enter for new line</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatInterface;