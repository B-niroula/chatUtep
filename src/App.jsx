import React, { useState, useEffect, useRef } from 'react';
import MarkdownIt from 'markdown-it';
import Header from './components/Header';
import ChatForm from './components/ChatForm';
import ChatOutput from './components/ChatOutput';
import About from './components/About';
import { formatSources } from './data/utepKnowledge';
import './App.css';

const md = new MarkdownIt();

const App = () => {
  const [conversationHistory, setConversationHistory] = useState([]);
  const [pendingResponse, setPendingResponse] = useState('');
  const [error, setError] = useState(null);
  const [showAbout, setShowAbout] = useState(false);
  const messagesEndRef = useRef(null);

  const apiBase = process.env.REACT_APP_API_BASE || '';

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversationHistory, pendingResponse]);

  const handleSubmit = async (userMessage) => {
    if (!userMessage.trim()) return;

    const updatedHistory = [
      ...conversationHistory,
      { role: 'user', parts: [{ text: userMessage }] },
    ];
    setConversationHistory(updatedHistory);

    setPendingResponse('');
    setError(null);

    let retrievedSources = [];

    try {
      const response = await fetch(`${apiBase}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, history: updatedHistory }),
      });

      if (!response.ok || !response.body) {
        throw new Error('The assistant is unavailable right now. Please try again.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let streamBuffer = '';
      let assistantText = '';

      // Parse simple SSE stream from backend
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        streamBuffer += decoder.decode(value, { stream: true });
        let boundary = streamBuffer.indexOf('\n\n');

        while (boundary !== -1) {
          const rawEvent = streamBuffer.slice(0, boundary).trim();
          streamBuffer = streamBuffer.slice(boundary + 2);

          if (rawEvent.startsWith('data:')) {
            const payloadStr = rawEvent.replace(/^data:\s*/, '');
            if (payloadStr === '[DONE]') {
              break;
            }

            let payload;
            try {
              payload = JSON.parse(payloadStr);
            } catch (err) {
              console.warn('Failed to parse stream chunk', err);
              payload = null;
            }

            if (payload?.type === 'sources') {
              retrievedSources = payload.sources || [];
            } else if (payload?.type === 'token') {
              assistantText += payload.token;
              setPendingResponse(assistantText);
            } else if (payload?.type === 'error') {
              throw new Error(payload.message || 'Server error');
            }
          }

          boundary = streamBuffer.indexOf('\n\n');
        }
      }

      const finalResponse = assistantText + formatSources(retrievedSources);
      setConversationHistory((prev) => [
        ...prev,
        { role: 'model', parts: [{ text: finalResponse }] },
      ]);
      setPendingResponse('');
    } catch (e) {
      const errorMsg = e.message.includes('fetch') || e.message.includes('Failed to fetch') 
        ? 'Backend server is not available. This demo requires a backend server to function.'
        : e.message;
      setError(errorMsg);
      setPendingResponse('');
    }
  };

  const handleClear = () => {
    setConversationHistory([]);
    setPendingResponse('');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      <Header onAboutClick={() => setShowAbout(true)} />
      
      {showAbout && <About onClose={() => setShowAbout(false)} />}
      
      {/* Main content area with padding for fixed input */}
      <main className="flex-1 container mx-auto px-4 py-8 max-w-5xl pb-32">
        {/* Show initial form only if no conversation */}
        {conversationHistory.length === 0 && !pendingResponse && (
          <ChatForm onSubmit={handleSubmit} onClear={handleClear} />
        )}
        
        <ChatOutput
          conversationHistory={conversationHistory}
          pendingResponse={pendingResponse}
          error={error}
          md={md}
        />
        
        {/* Invisible div to scroll to */}
        <div ref={messagesEndRef} />
      </main>

      {/* Fixed input at bottom - ONLY show after conversation has started */}
      {(conversationHistory.length > 0 || pendingResponse) && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
          <div className="container mx-auto px-4 py-4 max-w-5xl">
            <div className="flex items-center space-x-3">
              <div className="flex-1">
                <ChatForm onSubmit={handleSubmit} onClear={handleClear} isSticky={true} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
