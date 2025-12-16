const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } = require("@langchain/google-genai");
const { ChatPromptTemplate, MessagesPlaceholder } = require("@langchain/core/prompts");
const { StringOutputParser } = require("@langchain/core/output_parsers");
const { AIMessage, HumanMessage } = require("@langchain/core/messages");
const { utepKnowledge } = require("./knowledgeBase");
const { runLiveSearch } = require("./liveSearch");
const fs = require("fs");
const path = require("path");

dotenv.config();

const PORT = process.env.PORT || 4000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error("Missing GEMINI_API_KEY in your environment (.env)");
  process.exit(1);
}

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: "1mb" }));
app.use(bodyParser.urlencoded({ extended: false }));

const embedder = new GoogleGenerativeAIEmbeddings({
  apiKey: GEMINI_API_KEY,
  model: "text-embedding-004",
});

const llmModel = process.env.GEMINI_CHAT_MODEL || "gemini-2.5-flash";
const llm = new ChatGoogleGenerativeAI({
  apiKey: GEMINI_API_KEY,
  model: llmModel,
  temperature: 0.2,
  streaming: true,
});

let knowledgeVectors = [];
let ragIndex = [];

const loadRagIndex = () => {
  try {
    const indexPath = path.join(__dirname, "..", "data", "rag_index.jsonl");
    if (!fs.existsSync(indexPath)) {
      console.warn("No rag_index.jsonl found. Skipping local RAG index load.");
      return;
    }
    const lines = fs.readFileSync(indexPath, "utf8").split("\n");
    ragIndex = lines
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const obj = JSON.parse(line);
        return {
          embedding: obj.embedding,
          text: obj.text,
          url: obj.url,
          title: obj.title || "",
        };
      });
    console.log(`Loaded ${ragIndex.length} embedded chunks from rag_index.jsonl`);
  } catch (err) {
    console.error("Failed to load rag index:", err.message);
  }
};

const cosineSimilarity = (a, b) => {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (!normA || !normB) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
};

const buildKnowledgeStore = async () => {
  const texts = utepKnowledge.map(
    (item) => `${item.category} - ${item.topic}\n${item.content}`
  );
  const embeddings = await embedder.embedDocuments(texts);
  knowledgeVectors = embeddings.map((vector, idx) => ({
    embedding: vector,
    metadata: utepKnowledge[idx],
    text: texts[idx],
  }));
  console.log(`Loaded ${knowledgeVectors.length} UTEP knowledge chunks into memory.`);
};

const initPromise = buildKnowledgeStore().catch((err) => {
  console.error("Failed to initialize knowledge store:", err);
  process.exit(1);
});
loadRagIndex();

const prompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You are a helpful assistant for the University of Texas at El Paso (UTEP).
Use only the provided UTEP context to answer. If information is missing, say so and guide the user to official UTEP resources (registrar, graduate school, department pages).
Be concise, friendly, and professional.
Use live web results first; if a deadline/date is present, state it clearly. If no exact date is present, say so and point the user to the Graduate School/Registrar links.
If codes (e.g., TOEFL school codes) are present in the context, state them explicitly.
Do NOT include a "Sources" section; the system will append sources separately.

UTEP context:
{context}`,
  ],
  new MessagesPlaceholder("chat_history"),
  ["human", "{question}"],
]);

const chain = prompt.pipe(llm).pipe(new StringOutputParser());

const mapHistory = (history = []) =>
  history
    .filter((m) => m?.parts?.[0]?.text)
    .slice(-8)
    .map((m) =>
      m.role === "user"
        ? new HumanMessage(m.parts[0].text)
        : new AIMessage(m.parts[0].text)
    );

const retrieveContext = async (question) => {
  const queryVector = await embedder.embedQuery(question);

  const scoreItems = (items, getEmbedding) =>
    items
      .map((entry) => ({
        entry,
        score: cosineSimilarity(getEmbedding(entry), queryVector),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

  const ragResults = ragIndex.length
    ? scoreItems(ragIndex, (e) => e.embedding)
    : [];

  const kbResults = knowledgeVectors.length
    ? scoreItems(knowledgeVectors, (e) => e.embedding)
    : [];

  const combined = [...ragResults, ...kbResults]
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const context = combined
    .map((item, idx) => {
      const e = item.entry;
      if (e.metadata) {
        return `${idx + 1}. ${e.metadata.topic} (${e.metadata.category})\n${e.metadata.content}`;
      }
      return `${idx + 1}. ${e.title || "UTEP content"}\n${e.text}`;
    })
    .join("\n\n");

  const sources = combined.map((item) => {
    const e = item.entry;
    if (e.metadata) {
      return {
        topic: e.metadata.topic,
        url: e.metadata.url,
        category: e.metadata.category,
      };
    }
    return {
      topic: e.title || "UTEP content",
      url: e.url,
      category: "Local RAG",
    };
  });

  return { context, sources };
};

const uniqueSources = (sources, limit = 5) => {
  const seen = new Set();
  const result = [];
  for (const src of sources) {
    const key = src.url || `${src.topic}-${src.category}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(src);
    if (result.length >= limit) break;
  }
  return result;
};

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/chat", async (req, res) => {
  try {
    await initPromise;
    const message = (req.body?.message || "").trim();
    const history = req.body?.history || [];

    if (!message) {
      return res.status(400).json({ error: "message is required" });
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    // Disabled live search - using only local RAG index for faster responses
    let liveContext = "";
    let liveSources = [];

    const { context, sources } = await retrieveContext(message);
    const combinedContext = [liveContext, context].filter(Boolean).join("\n\n") || "No additional context.";
    const allSources = uniqueSources([...liveSources, ...sources], 6);
    res.write(`data: ${JSON.stringify({ type: "sources", sources: allSources })}\n\n`);

    const stream = await chain.stream({
      question: message,
      context: combinedContext,
      chat_history: mapHistory(history),
    });

    for await (const chunk of stream) {
      res.write(`data: ${JSON.stringify({ type: "token", token: chunk })}\n\n`);
    }

    res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
    res.end();
  } catch (err) {
    console.error("Chat error:", err);
    try {
      res.write(
        `data: ${JSON.stringify({ type: "error", message: err.message })}\n\n`
      );
      res.end();
    } catch (inner) {
      console.error("Stream error after failure:", inner);
      if (!res.headersSent) {
        res.status(500).json({ error: "Server error" });
      }
    }
  }
});

initPromise.then(() => {
  app.listen(PORT, () => {
    console.log(`RAG server listening on http://localhost:${PORT}`);
  });
});
