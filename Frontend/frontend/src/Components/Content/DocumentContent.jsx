import React from "react";
import {
    ExternalLink,
    FileText,
    CheckCircle,
    Clock,
    HardDrive,
    Maximize2
} from "lucide-react";

const DocumentContent = ({ documentData }) => {
    // Format File Size
    const formatFileSize = (bytes) => {
        if (!bytes) return "0 KB";
        const mb = bytes / (1024 * 1024);
        if (mb >= 1) return `${mb.toFixed(2)} MB`;
        return `${(bytes / 1024).toFixed(1)} KB`;
    };

    const isProcessing = documentData?.status === "processing";

    // Open PDF in new tab
    const handleOpenPdf = () => {
        if (!documentData?.filePath) return;
        window.open(documentData.filePath, "_blank", "noopener,noreferrer");
    };

    return (
        <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm">
            {/* Header section */}
            <div className="px-5 sm:px-6 py-5 border-b border-gray-200">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                    {/* Left: Document Info */}
                    <div className="flex items-center gap-4 min-w-0">
                        <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
                            <FileText size={24} className="text-red-500" />
                        </div>

                        <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h2 className="text-lg font-semibold text-gray-900">Document Preview</h2>
                                <span className="px-2 py-0.5 rounded-md bg-red-50 text-red-500 text-[10px] font-bold tracking-wide">
                                    PDF
                                </span>
                            </div>
                            <p className="text-sm text-gray-500 mt-1 truncate max-w-[500px]">
                                {documentData?.fileName || documentData?.title || "Untitled Document"}
                            </p>
                        </div>
                    </div>

                    {/* Right: Actions and Status */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <span
                            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border ${isProcessing
                                    ? "bg-amber-50 text-amber-600 border-amber-100"
                                    : "bg-emerald-50 text-emerald-600 border-emerald-100"
                                }`}
                        >
                            {isProcessing ? (
                                <>
                                    <Clock size={14} /> Processing
                                </>
                            ) : (
                                <>
                                    <CheckCircle size={14} /> Ready
                                </>
                            )}
                        </span>

                        {documentData?.filePath && (
                            <button
                                onClick={handleOpenPdf}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#19b673] text-white text-sm font-medium hover:bg-[#149b61] transition shadow-sm"
                            >
                                <ExternalLink size={15} /> Open PDF
                            </button>
                        )}
                    </div>
                </div>

                {/* File Meta */}
                <div className="flex items-center gap-3 flex-wrap mt-4">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-100">
                        <HardDrive size={13} className="text-gray-400" />
                        <span className="text-xs text-gray-600 font-medium">
                            {formatFileSize(documentData?.fileSize)}
                        </span>
                    </div>
                    <span className="text-gray-300">•</span>
                    <span className="text-xs text-gray-500">PDF Document</span>
                    <span className="text-gray-300">•</span>
                    <span className="text-xs text-gray-500">Document Viewer</span>
                </div>
            </div>

            {/* PDF Viewer Header */}
            <div className="px-4 sm:px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#19b673]" />
                    <span className="text-xs font-medium text-gray-600">PDF Preview</span>
                </div>

                {documentData?.filePath && (
                    <button
                        onClick={handleOpenPdf}
                        className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#19b673] transition"
                    >
                        <Maximize2 size={14} /> Full View
                    </button>
                )}
            </div>

            {/* PDF Viewer */}
            <div className="bg-gray-100 p-3 sm:p-5">
                {documentData?.filePath ? (
                    <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
                        <iframe
                            src={`${documentData.filePath}#toolbar=1&navpanes=0`}
                            title={documentData?.title || "PDF Document"}
                            className="w-full h-[65vh] sm:h-[72vh] lg:h-[75vh] bg-white border-0"
                        />
                    </div>
                ) : (
                    <div className="h-[400px] flex flex-col items-center justify-center bg-white rounded-2xl border border-gray-200">
                        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
                            <FileText size={30} className="text-gray-300" />
                        </div>
                        <h3 className="text-sm font-semibold text-gray-700 mt-4">
                            PDF Preview Unavailable
                        </h3>
                        <p className="text-xs text-gray-400 mt-1">
                            The document file could not be loaded.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DocumentContent;