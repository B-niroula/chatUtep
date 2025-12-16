/**
 * Build a local RAG index from scraped UTEP pages.
 *
 * Input: data/utep_pages.jsonl (from crawler/utep_spider.py)
 * Output: data/rag_index.jsonl (embeddings + text + url)
 *
 * Usage:
 *   GEMINI_API_KEY=... node scripts/buildIndex.js
 *
 * Notes:
 * - Uses Gemini embeddings via @langchain/google-genai
 * - Batches requests to avoid large payloads
 * - Keep chunks modest to control token usage
 */
const fs = require("fs");
const path = require("path");
const readline = require("readline");
const dotenv = require("dotenv");
const { GoogleGenerativeAIEmbeddings } = require("@langchain/google-genai");

dotenv.config();

const INPUT_PATH = path.join(__dirname, "..", "data", "utep_pages_cleaned.jsonl");
const OUTPUT_PATH = path.join(__dirname, "..", "data", "rag_index.jsonl");
const CHUNK_SIZE = 700;
const CHUNK_OVERLAP = 120;
const BATCH_SIZE = 16;

const ensureDir = (filePath) => {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const chunkText = (text) => {
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + CHUNK_SIZE, text.length);
    const slice = text.slice(start, end).trim();
    if (slice.length > 100) {
      chunks.push(slice);
    }
    start += CHUNK_SIZE - CHUNK_OVERLAP;
  }
  return chunks;
};

const loadPages = async (filePath) => {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing input file at ${filePath}`);
  }
  const stream = fs.createReadStream(filePath, { encoding: "utf8" });
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });
  const pages = [];
  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const obj = JSON.parse(trimmed);
      if (obj.text && obj.url) {
        pages.push(obj);
      }
    } catch (err) {
      console.warn("Skipping invalid JSON line");
    }
  }
  return pages;
};

const embedBatch = async (embedder, docs) => {
  const texts = docs.map((d) => d.text);
  const vectors = await embedder.embedDocuments(texts);
  return docs.map((doc, i) => ({
    embedding: vectors[i],
    text: doc.text,
    url: doc.url,
    title: doc.title || "",
  }));
};

const main = async () => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is required");
  }

  console.log("Loading scraped pages...");
  const pages = await loadPages(INPUT_PATH);
  console.log(`Loaded ${pages.length} pages from ${INPUT_PATH}`);

  const embedder = new GoogleGenerativeAIEmbeddings({
    apiKey: process.env.GEMINI_API_KEY,
    model: "text-embedding-004",
  });

  const docs = [];
  pages.forEach((page) => {
    const text = (page.text || "").replace(/\s+/g, " ").trim();
    if (!text) return;
    const chunks = chunkText(text);
    chunks.forEach((chunk) => {
      docs.push({
        text: chunk,
        url: page.url,
        title: page.title || "",
      });
    });
  });

  console.log(`Prepared ${docs.length} chunks for embedding`);

  ensureDir(OUTPUT_PATH);
  const outStream = fs.createWriteStream(OUTPUT_PATH, { flags: "w" });

  for (let i = 0; i < docs.length; i += BATCH_SIZE) {
    const batch = docs.slice(i, i + BATCH_SIZE);
    const embedded = await embedBatch(embedder, batch);
    embedded.forEach((item) => {
      outStream.write(JSON.stringify(item) + "\n");
    });
    console.log(
      `Embedded ${Math.min(i + BATCH_SIZE, docs.length)} / ${docs.length}`
    );
  }

  outStream.end();
  console.log(`Index written to ${OUTPUT_PATH}`);
};

main().catch((err) => {
  console.error("Index build failed:", err.message);
  process.exit(1);
});

