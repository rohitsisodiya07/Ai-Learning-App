import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  ArrowLeft,
  ExternalLink,
  FileText,
  Clock,
  HardDrive,
  CheckCircle
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import api from "../../Api";
import Spinner from "../../Components/Common/Spinner";

// Tab Components
import DocumentContent from "../../Components/Content/DocumentContent";
import ChatInterface from "../../Components/Chat/ChatInterface";
import AiActions from "../../Components/Actions/AiActions";
import FlashCardManager from "../../Components/FlashCards/FlashCardManager";
import QuizManager from "../../Components/Quizzes/QuizManager";

const DocumentDetailPage = () => {
  const { id } = useParams();

  const [documentData, setDocumentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Content");

  // Get Single Document
  useEffect(() => {
    const fetchDocument = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`${api}/document/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        console.log("Document Data:", response.data);
        setDocumentData(response.data.data);
      } catch (error) {
        console.log("Document Error:", error);
        toast.error(
          error.response?.data?.message || "Failed to fetch document"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [id]);

  // Loading
  if (loading) {
    return <Spinner />;
  }

  // Document Not Found
  if (!documentData) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <FileText size={45} className="text-gray-300 mb-3" />
        <h2 className="text-lg font-semibold text-gray-700">
          Document not found
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          This document may have been deleted.
        </p>
        <Link
          to="/documents"
          className="mt-5 text-sm text-[#19b673] hover:underline"
        >
          Back to Documents
        </Link>
      </div>
    );
  }

  // Tabs
  const tabs = [
    "Content",
    "Chat",
    "AI Actions",
    "Flashcards",
    "Quizzes"
  ];

  // Format File Size
  const formatFileSize = (bytes) => {
    if (!bytes) {
      return "0 KB";
    }
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) {
      return `${mb.toFixed(2)} MB`;
    }
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  // Format Date
  const formatDate = (date) => {
    if (!date) {
      return "-";
    }
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };

  return (
    <div className="space-y-6">

      {/* Back Button */}
      <Link
        to="/documents"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition"
      >
        <ArrowLeft size={17} />
        Back to Documents
      </Link>

      {/* Document Header */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">

          {/* Document Information */}
          <div className="flex items-start gap-4">

            {/* PDF Icon */}
            <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
              <FileText size={24} className="text-red-500" />
            </div>

            {/* Details */}
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {documentData.title}
              </h1>
              <p className="text-sm text-gray-500 mt-1 break-all">
                {documentData.fileName}
              </p>

              {/* Document Stats */}
              <div className="flex flex-wrap items-center gap-4 mt-3">

                {/* Status */}
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
                  <CheckCircle size={13} />
                  {documentData.status || "Ready"}
                </span>

                {/* File Size */}
                <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
                  <HardDrive size={14} />
                  {formatFileSize(documentData.fileSize)}
                </span>

                {/* Upload Date */}
                <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
                  <Clock size={14} />
                  {formatDate(documentData.uploadDate)}
                </span>
              </div>
            </div>
          </div>

          {/* Open PDF Button */}
          <a
            href={documentData.filePath}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:border-[#19b673] hover:text-[#19b673] transition"
          >
            <ExternalLink size={16} />
            Open PDF
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border border-gray-200 rounded-xl px-4">
        <div className="flex gap-7 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative py-4 text-sm font-medium whitespace-nowrap transition ${activeTab === tab
                ? "text-[#19b673]"
                : "text-gray-500 hover:text-gray-900"
                }`}
            >
              {tab}
              {/* Active Tab Line */}
              {activeTab === tab && (
                <span className="absolute left-0 right-0 bottom-0 h-0.5 bg-[#19b673] rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ================= TAB CONTENT ================= */}

      {/* Content */}
      {activeTab === "Content" && (
        <DocumentContent documentData={documentData} />
      )}

      {/* Chat */}
      {activeTab === "Chat" && (
        <ChatInterface documentData={documentData} />
      )}

      {/* AI Actions */}
      {activeTab === "AI Actions" && (
        <AiActions documentData={documentData} />
      )}

      {/* Flashcards */}
      {activeTab === "Flashcards" && (
        <FlashCardManager documentData={documentData} documentId={id} />
      )}

      {/* Quizzes */}
      {activeTab === "Quizzes" && (
        <QuizManager
          documentData={documentData}
          documentId={id}
        />
      )}

    </div>
  );
};

export default DocumentDetailPage;