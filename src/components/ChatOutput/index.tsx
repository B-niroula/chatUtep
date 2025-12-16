import React, { useState } from "react";
import usePdfExport from "../../hooks/usePdfExport";

interface ChatOutputProps {
  conversationHistory: { role: string; parts: { text: string }[] }[];
  pendingResponse?: string;
  error?: string;
  md: { render: (input: string) => string };
}

const ChatOutput: React.FC<ChatOutputProps> = ({
  conversationHistory,
  pendingResponse,
  error,
  md,
}) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const { exportToPdf } = usePdfExport();

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const handleExportPdf = () => {
    exportToPdf(conversationHistory);
  };

  if (conversationHistory.length === 0 && !pendingResponse && !error) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 text-center border border-gray-100">
        <div className="text-gray-400 mb-4">
          <svg
            className="w-16 h-16 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          Welcome to UTEP Support Assistant
        </h3>
        <p className="text-gray-500">
          Ask me anything about the University of Texas at El Paso!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Export Button - Show only when there are messages */}
      {conversationHistory.length > 0 && (
        <div className="flex justify-end mb-4">
          <button
            onClick={handleExportPdf}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Export as PDF
          </button>
        </div>
      )}

      {conversationHistory.map((message, index) => (
        <div
          key={index}
          className={`flex ${
            message.role === "user" ? "justify-end" : "justify-start"
          }`}
        >
          <div
            className={`max-w-4xl w-full ${
              message.role === "user"
                ? "bg-blue-600 text-white rounded-2xl rounded-br-md"
                : "bg-white text-gray-800 rounded-2xl rounded-bl-md border border-gray-200"
            } shadow-md overflow-hidden group`}
          >
            {/* Header */}
            <div
              className={`px-6 py-3 border-b flex items-center justify-between ${
                message.role === "user"
                  ? "border-blue-500 bg-blue-700"
                  : "border-gray-100 bg-gray-50"
              }`}
            >
              <div className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3 ${
                    message.role === "user"
                      ? "bg-blue-500 text-white"
                      : "bg-blue-600 text-white"
                  }`}
                >
                  {message.role === "user" ? "👤" : "🤖"}
                </div>
                <span
                  className={`font-semibold ${
                    message.role === "user" ? "text-blue-100" : "text-gray-700"
                  }`}
                >
                  {message.role === "user" ? "You" : "UTEP Assistant"}
                </span>
                <span
                  className={`ml-2 text-xs ${
                    message.role === "user" ? "text-blue-200" : "text-gray-500"
                  }`}
                >
                  {new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              {/* Copy Button */}
              <button
                onClick={() => copyToClipboard(message.parts[0].text, index)}
                className={`opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-2 rounded-md hover:bg-opacity-20 hover:bg-white ${
                  message.role === "user"
                    ? "text-blue-100 hover:text-white"
                    : "text-gray-400 hover:text-gray-600"
                } focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  message.role === "user"
                    ? "focus:ring-blue-300"
                    : "focus:ring-gray-300"
                }`}
                title="Copy message"
              >
                {copiedIndex === index ? (
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                )}
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-4">
              {message.role === "user" ? (
                <div className="text-white leading-relaxed">
                  {message.parts[0].text}
                </div>
              ) : (
                <div className="prose prose-gray max-w-none leading-relaxed">
                  <div
                    className="formatted-content"
                    dangerouslySetInnerHTML={{
                      __html: md.render(message.parts[0].text),
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      ))}

      {pendingResponse && (
        <div className="flex justify-start">
          <div className="max-w-4xl w-full bg-gray-50 text-gray-800 rounded-2xl rounded-bl-md border border-gray-200 shadow-md overflow-hidden">
            <div className="px-6 py-4">
              <div className="flex items-center mb-3">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold mr-3 text-white">
                  🤖
                </div>
                <span className="font-semibold text-gray-700">
                  UTEP Assistant
                </span>
                <div className="ml-3 flex space-x-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
              </div>
              <div className="prose prose-gray max-w-none leading-relaxed">
                <div
                  className="formatted-content"
                  dangerouslySetInnerHTML={{
                    __html: md.render(pendingResponse),
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg shadow-sm">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Error occurred
              </h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatOutput;
