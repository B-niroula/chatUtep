import React, { useState, useEffect } from 'react';
import useSpeechRecognition from '../SpeechRecognition';

interface ChatFormProps {
  onSubmit: (input: string) => void;
  onClear: () => void;
  isSticky?: boolean;
}

const ChatForm: React.FC<ChatFormProps> = ({ onSubmit, onClear, isSticky = false }) => {
  const [input, setInput] = useState('');
  const { 
    isListening, 
    transcript, 
    error: speechError, 
    startListening, 
    stopListening,
    resetTranscript 
  } = useSpeechRecognition();

  // Update input when speech transcript changes
  useEffect(() => {
    if (transcript) {
      setInput(transcript);
    }
  }, [transcript]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      // Stop listening before submitting
      if (isListening) {
        stopListening();
      }
      onSubmit(input);
      setInput('');
      resetTranscript();
    }
  };

  const handleVoiceToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Sticky version for bottom of screen
  if (isSticky) {
    return (
      <div>
        {speechError && (
          <div className="mb-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">
            {speechError}
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex items-center space-x-3">
          <div className="flex-1 relative">
            <input
              name="prompt"
              placeholder={isListening ? "Listening..." : "Ask a follow-up question..."}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 text-gray-700 placeholder-gray-400"
            />
            <button
              type="button"
              onClick={handleVoiceToggle}
              className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full transition-all duration-200 ${
                isListening 
                  ? 'text-red-600 hover:bg-red-50 animate-pulse' 
                  : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
              }`}
              title={isListening ? "Stop recording" : "Start voice input"}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          <button
            type="submit"
            disabled={!input.trim()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-md hover:shadow-lg"
          >
            Send
          </button>
          <button
            type="button"
            onClick={onClear}
            className="px-4 py-3 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 font-medium"
          >
            Clear
          </button>
        </form>
      </div>
    );
  }

  // Original form for initial state
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-100">
      {speechError && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">
          {speechError}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <input
              name="prompt"
              placeholder={isListening ? "Listening..." : "Ask me anything about UTEP..."}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 text-gray-700 placeholder-gray-400"
            />
            <button
              type="button"
              onClick={handleVoiceToggle}
              className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full transition-all duration-200 ${
                isListening 
                  ? 'text-red-600 hover:bg-red-50 animate-pulse' 
                  : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
              }`}
              title={isListening ? "Stop recording" : "Start voice input"}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          <button
            type="submit"
            disabled={!input.trim()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-md hover:shadow-lg"
          >
            Send
          </button>
        </div>
      </form>
      <div className="flex justify-between items-center mt-4">
        <div className="text-sm text-gray-500">
          {isListening && (
            <span className="flex items-center">
              <span className="animate-pulse text-red-600 mr-2">●</span>
              Recording...
            </span>
          )}
        </div>
        <button
          onClick={onClear}
          className="px-4 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 font-medium"
        >
          Clear Chat
        </button>
      </div>
    </div>
  );
};

export default ChatForm;
