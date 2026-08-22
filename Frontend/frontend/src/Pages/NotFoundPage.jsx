import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Home, SearchX } from "lucide-react";

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-lg text-center">

        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-2xl bg-[#ecfdf5] text-[#19b673] flex items-center justify-center shadow-sm">
            <SearchX size={40} strokeWidth={1.8} />
          </div>
        </div>

        {/* 404 Heading */}
        <h1 className="text-7xl md:text-8xl font-extrabold text-gray-900 tracking-tight">
          404
        </h1>

        {/* Sub-heading */}
        <h2 className="mt-4 text-2xl md:text-3xl font-bold text-gray-900">
          Page not found
        </h2>

        {/* Description */}
        <p className="mt-3 text-gray-500 text-sm md:text-base leading-6 max-w-md mx-auto">
          Sorry, we couldn't find the page you're looking for. It may have been moved, deleted, or the URL might be incorrect.
        </p>

        {/* Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">

          {/* Go Back */}
          <button
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-gray-200 bg-white text-gray-700 font-semibold text-sm hover:bg-gray-50 transition"
          >
            <ArrowLeft size={18} /> Go Back
          </button>

          {/* Dashboard */}
          <button
            onClick={() => navigate("/dashboard")}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#19b673] text-white font-semibold text-sm shadow-sm hover:bg-[#16a968] hover:shadow-md transition-all"
          >
            <Home size={18} /> Go to Dashboard
          </button>

        </div>

        {/* Small Brand Text */}
        <p className="mt-10 text-xs text-gray-400 font-medium">
          AI Learning Assistant
        </p>

      </div>
    </div>
  );
};

export default NotFoundPage;