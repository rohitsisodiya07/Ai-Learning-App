import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Check, Copy, ExternalLink } from "lucide-react";

const MarkDownRender = ({ content }) => {
    return (
        <div className="w-full text-[15px] leading-7 text-slate-700 break-words">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    h1: ({ node, ...props }) => (
                        <div className="mt-8 mb-5">
                            <h1
                                className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight tracking-tight pb-3 border-b border-slate-200"
                                {...props}
                            />
                        </div>
                    ),
                    h2: ({ node, ...props }) => (
                        <div className="mt-8 mb-4">
                            <h2 className="flex items-center gap-3 text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
                                <span className="w-1 h-6 bg-emerald-500 rounded-full shrink-0" />
                                <span {...props} />
                            </h2>
                        </div>
                    ),
                    h3: ({ node, ...props }) => (
                        <h3 className="text-lg font-bold text-slate-900 mt-6 mb-3 leading-snug" {...props} />
                    ),
                    h4: ({ node, ...props }) => (
                        <h4 className="text-base font-semibold text-slate-900 mt-5 mb-2" {...props} />
                    ),
                    p: ({ node, ...props }) => (
                        <p className="mb-4 leading-7 text-slate-700" {...props} />
                    ),
                    strong: ({ node, ...props }) => (
                        <strong className="font-semibold text-slate-900" {...props} />
                    ),
                    em: ({ node, ...props }) => (
                        <em className="italic text-slate-600" {...props} />
                    ),
                    a: ({ node, ...props }) => (
                        <a
                            className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 hover:underline font-medium transition-colors"
                            target="_blank"
                            rel="noopener noreferrer"
                            {...props}
                        >
                            <span>{props.children}</span>
                            <ExternalLink size={13} className="shrink-0" />
                        </a>
                    ),
                    ul: ({ node, ...props }) => (
                        <ul className="list-disc pl-6 space-y-2 mb-5 marker:text-emerald-500" {...props} />
                    ),
                    ol: ({ node, ...props }) => (
                        <ol className="list-decimal pl-6 space-y-2 mb-5 marker:text-emerald-600 marker:font-semibold" {...props} />
                    ),
                    li: ({ node, ...props }) => (
                        <li className="pl-1 leading-7 text-slate-700" {...props} />
                    ),
                    blockquote: ({ node, ...props }) => (
                        <blockquote
                            className="relative my-6 pl-5 pr-5 py-4 border-l-4 border-emerald-500 bg-emerald-50 rounded-r-xl text-slate-600 italic"
                            {...props}
                        />
                    ),
                    hr: ({ node, ...props }) => (
                        <hr className="my-8 border-0 border-t border-slate-200" {...props} />
                    ),
                    code: ({ node, inline, className, children, ...props }) => {
                        const match = /language-(\w+)/.exec(className || "");

                        if (!inline && match) {
                            return (
                                <CodeBlock
                                    language={match[1]}
                                    code={String(children).replace(/\n$/, "")}
                                    {...props}
                                />
                            );
                        }

                        return (
                            <code
                                className="bg-slate-100 text-emerald-700 px-1.5 py-0.5 rounded-md text-[13px] font-mono border border-slate-200 font-medium"
                                {...props}
                            >
                                {children}
                            </code>
                        );
                    },
                    pre: ({ node, children, ...props }) => (
                        <pre className="overflow-x-auto rounded-xl my-5" {...props}>
                            {children}
                        </pre>
                    ),
                    table: ({ node, ...props }) => (
                        <div className="overflow-x-auto my-6 rounded-xl border border-slate-200 shadow-sm">
                            <table className="w-full text-sm border-collapse min-w-[600px]" {...props} />
                        </div>
                    ),
                    thead: ({ node, ...props }) => (
                        <thead className="bg-slate-100 text-slate-900" {...props} />
                    ),
                    tr: ({ node, ...props }) => (
                        <tr className="border-b border-slate-200 last:border-b-0 hover:bg-slate-50 transition-colors" {...props} />
                    ),
                    th: ({ node, ...props }) => (
                        <th className="px-4 py-3 text-left font-semibold text-slate-900 border-r border-slate-200 last:border-r-0 whitespace-nowrap" {...props} />
                    ),
                    td: ({ node, ...props }) => (
                        <td className="px-4 py-3 border-r border-slate-200 last:border-r-0 text-slate-700 align-top" {...props} />
                    ),
                    img: ({ node, ...props }) => (
                        <img
                            className="max-w-full h-auto rounded-xl border border-slate-200 shadow-sm my-5"
                            loading="lazy"
                            alt={props.alt || "Document image"}
                            {...props}
                        />
                    ),
                    del: ({ node, ...props }) => (
                        <del className="text-slate-400" {...props} />
                    )
                }}
            >
                {content || ""}
            </ReactMarkdown>
        </div>
    );
};

// Sub-Component for Code Blocks
const CodeBlock = ({ language, code }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.log("Copy Error:", error);
        }
    };

    return (
        <div className="my-5 rounded-xl overflow-hidden border border-slate-700 shadow-sm">
            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-800 border-b border-slate-700">
                <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                    <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
                    <span className="ml-2 text-xs font-medium text-slate-300 uppercase">
                        {language}
                    </span>
                </div>

                <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-slate-700 transition"
                >
                    {copied ? (
                        <>
                            <Check size={14} /> Copied
                        </>
                    ) : (
                        <>
                            <Copy size={14} /> Copy
                        </>
                    )}
                </button>
            </div>

            <SyntaxHighlighter
                style={oneDark}
                language={language}
                PreTag="div"
                customStyle={{
                    margin: 0,
                    padding: "18px",
                    fontSize: "13px",
                    lineHeight: "1.7",
                    background: "#0f172a",
                    overflowX: "auto"
                }}
            >
                {code}
            </SyntaxHighlighter>
        </div>
    );
};

export default MarkDownRender;