# UTEP Support Assistant

An AI-powered support chatbot for the University of Texas at El Paso (UTEP) built with React, a LangChain/Gemini RAG backend, and streaming responses.

## 🎯 Overview

The UTEP Support Assistant is a modern, responsive web application that provides students, faculty, and staff with instant access to information about UTEP. The assistant can help with questions about academic programs, admissions, campus facilities, student services, and much more.

## ✨ Features

- **AI-Powered Conversations**: Powered by Google's Gemini 2.5 Flash model
- **Voice Input**: Speech-to-text functionality for hands-free interaction
- **Copy & Share**: Copy individual messages or responses with one click
- **PDF Export**: Export entire conversations as formatted PDF documents
- **Real-time Streaming**: See responses as they're being generated
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Markdown Support**: Rich text formatting for better readability
- **Professional UI**: Clean, modern interface with UTEP branding

## 🛠️ Tech Stack

- **Frontend**: React 19.1.0, TypeScript, Tailwind CSS
- **Backend**: Node.js + Express + LangChain RAG (Gemini 2.0 Flash + text-embedding-004)
- **AI Integration**: `@langchain/google-genai` for chat + embeddings
- **Speech Recognition**: Web Speech API
- **PDF Generation**: jsPDF + html2canvas
- **Markdown Rendering**: markdown-it

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Google Gemini API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd csueb-support
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory (see `.env.example`):
   ```env
   GEMINI_API_KEY=your_google_gemini_api_key_here
   # Optional: choose a model (default in server is gemini-2.5-flash)
   # GEMINI_CHAT_MODEL=gemini-2.5-flash
   # Optional: override API base if you host the backend elsewhere
   # REACT_APP_API_BASE=http://localhost:4000
   # Optional: enable live Google Programmable Search (Custom Search API)
   # GOOGLE_CSE_KEY=your_google_custom_search_api_key
   # GOOGLE_CSE_CX=your_custom_search_engine_id
   ```

4. **Start the LangChain RAG backend** (runs on port 4000 by default)
   ```bash
   npm run server
   ```

5. **Start the frontend**
   ```bash
   npm start
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000) (a dev proxy forwards `/api` to the backend)

### Getting a Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Copy the key and add it to your `.env` file

## 📁 Project Structure

```
crawler/
├── utep_spider.py          # Scrapy spider to crawl UTEP pages into data/utep_pages.jsonl
├── requirements.txt        # Python deps for crawler

data/
└── ...                     # RAG index and scrape output live here (rag_index.jsonl, utep_pages.jsonl)

scripts/
└── buildIndex.js           # Build local embeddings index from scraped pages

src/
├── App.jsx                 # Main application component (streams from backend /api/chat)
├── App.css                 # Application styles
├── index.js                # React app entry point
├── index.css               # Global styles and Tailwind imports
├── components/
│   ├── Header/             # Application header component
│   ├── ChatForm/           # Chat input form with voice support
│   ├── ChatOutput/         # Message display and conversation history
│   └── SpeechRecognition/  # Speech recognition hook
├── hooks/
│   └── usePdfExport.ts     # PDF export functionality
└── data/
    └── utepKnowledge.js    # Client-side knowledge snippets (also mirrored on the server)

server/
├── index.js                # Express + LangChain RAG backend (Gemini chat + embeddings)
└── knowledgeBase.js        # Server-side UTEP knowledge used for retrieval
```

## 🎮 Usage

### Basic Chat
1. Type your question in the input field
2. Press Enter or click "Send"
3. View the AI-generated response

### Voice Input
1. Click the microphone icon in the input field
2. Speak your question clearly
3. Click the microphone again to stop recording
4. Edit the transcribed text if needed
5. Send your message

### Copy Messages
1. Hover over any message
2. Click the copy icon in the message header
3. The message text is copied to your clipboard

### Export to PDF
1. Start a conversation with the assistant
2. Click the "Export as PDF" button above the chat
3. The PDF will be automatically downloaded

## 🔧 Available Scripts

### `npm start`
Runs the React app in development mode. The CRA proxy forwards `/api` to `http://localhost:4000`.

### `npm run server`
Starts the Express + LangChain backend with streaming RAG.

### `npm test`
Launches the test runner in interactive watch mode.

### `npm run build`
Builds the app for production to the `build` folder. The build is minified and optimized for the best performance.

### `npm run eject`
**Note: This is a one-way operation. Once you eject, you can't go back!**

### `npm run build:index`
Embeds scraped UTEP pages from `data/utep_pages.jsonl` into `data/rag_index.jsonl` (requires `GEMINI_API_KEY`).

### `npm run build:chroma`
Builds a Chroma vector index from `data/utep_pages.jsonl` into `data/utep_chroma_db` (requires `OPENAI_API_KEY`).

## 🌐 Browser Support

- **Chrome/Edge**: Full support (recommended)
- **Firefox**: Limited speech recognition support
- **Safari**: Partial speech recognition support
- **Mobile browsers**: Varies by device and browser

## 🤖 AI & RAG Capabilities

- **LangChain RAG**: Embeds the UTEP knowledge base with Gemini `text-embedding-004` and retrieves the top matches for each query.
- **Offline RAG Index**: If `data/rag_index.jsonl` exists (built from the crawler + `npm run build:index`), it is used for retrieval before live search.
- **Chroma Index (Python path)**: If you build `data/utep_chroma_db` with `npm run build:chroma`, the backend can use it for retrieval (OpenAI embeddings).
- **Optional Live Search**: If `GOOGLE_CSE_KEY` and `GOOGLE_CSE_CX` are set, the backend queries Google Programmable Search for UTEP pages, pulls fresh snippets, and includes them (with sources) in responses.
- **Streaming Responses**: SSE streaming from the backend for responsive typing indicators.
- **Source Citations**: Retrieved documents are surfaced in the reply footer.
- **Domains Covered**: Academic programs, admissions, campus life, student services, financial aid, career services, library resources, and housing/dining/transit.

## 🧭 Building the Offline RAG Index (every few months)
1. **Crawl UTEP** (Python, Scrapy):
   - Install deps: `pip install -r crawler/requirements.txt`
   - Run: `scrapy runspider crawler/utep_spider.py -O data/utep_pages.jsonl`
   - Politeness: respects robots.txt, depth limit 2, delay 1.5s.
2. **Embed & index** (Node):
   - `GEMINI_API_KEY=... npm run build:index`
   - Output: `data/rag_index.jsonl` (loaded automatically by the backend if present).
   - Alternative (Python + Chroma, OpenAI): `OPENAI_API_KEY=... npm run build:chroma` → `data/utep_chroma_db`
3. **Serve**:
   - `npm run server` (loads the local index on startup)
   - `npm start` (frontend)

## 🔒 Privacy & Security

- No conversation data is stored permanently
- All API calls are made directly to Google's servers
- Speech recognition is processed locally in your browser
- No personal information is collected or stored

## 🛠️ Development

### Adding New Features

1. Create new components in the `src/components/` directory
2. Add custom hooks in the `src/hooks/` directory
3. Update styles in `src/index.css` or component-specific CSS files
4. Test thoroughly across different browsers and devices

### Customizing the Assistant

To modify the AI assistant's behavior, update the `systemInstruction` in [`src/App.jsx`](src/App.jsx):

```javascript
systemInstruction: `You are a helpful assistant for the University of Texas at El Paso (UTEP)...`
```

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Support

For technical support or questions about this application, please contact the development team or create an issue in the repository.

## 🎓 About UTEP

The University of Texas at El Paso is a public research university serving the El Paso region with a commitment to access, research, and student success.

---

**Built with ❤️ for the UTEP community**
