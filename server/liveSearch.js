const axios = require("axios");
const cheerio = require("cheerio");
const { ChatGoogleGenerativeAI } = require("@langchain/google-genai");

let extractorModel = null;

const getExtractorModel = () => {
  if (extractorModel) return extractorModel;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY missing for extractor");
  }
  const modelName = process.env.GEMINI_CHAT_MODEL || "gemini-2.5-flash";
  extractorModel = new ChatGoogleGenerativeAI({
    apiKey,
    model: modelName,
    temperature: 0,
    maxOutputTokens: 512,
  });
  return extractorModel;
};

const extractWithLLM = async ({ text, question }) => {
  const model = getExtractorModel();
  const trimmed = text.slice(0, 4000); // keep prompt small
  const prompt = `
You are an extraction assistant. Given a question and raw page text, extract only the requested facts.
Return a JSON object with:
- "deadline": string or null
- "code": string or null (TOEFL/ETS/School code)
- "scores": array of strings for TOEFL/IELTS/Duolingo score requirements
Use ONLY the provided text. If a field is absent, set it to null (or [] for scores).

Question: ${question}
Page text:
${trimmed}

Respond with JSON only.`;

  let raw = "";
  try {
    const resp = await model.invoke(prompt);
    if (typeof resp === "string") {
      raw = resp;
    } else if (resp?.content) {
      raw =
        typeof resp.content === "string"
          ? resp.content
          : Array.isArray(resp.content)
          ? resp.content
              .map((c) => (typeof c === "string" ? c : c?.text || ""))
              .join(" ")
          : JSON.stringify(resp.content);
    } else {
      raw = JSON.stringify(resp);
    }
  } catch (err) {
    console.warn("LLM extraction failed:", err.message);
    return { deadline: null, code: null, scores: [] };
  }

  const defaultResult = { deadline: null, code: null, scores: [] };

  const tryParse = (str) => {
    try {
      return JSON.parse(str);
    } catch {
      const match = str.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          return JSON.parse(match[0]);
        } catch {
          return null;
        }
      }
      return null;
    }
  };

  const parsed = tryParse(raw);
  if (!parsed) return defaultResult;

  return {
    deadline: parsed.deadline || null,
    code: parsed.code || null,
    scores: Array.isArray(parsed.scores) ? parsed.scores.filter(Boolean) : [],
  };
};

const fetchPage = async (url) => {
  const res = await axios.get(url, {
    timeout: 8000,
    headers: { "User-Agent": "Mozilla/5.0 UTEPAssistant/1.0" },
    maxRedirects: 4,
    validateStatus: (s) => s < 400,
  });
  return res.data;
};

const searchGoogle = async (query, { CSE_KEY, CSE_CX }) => {
  const res = await axios.get("https://www.googleapis.com/customsearch/v1", {
    timeout: 5000,
    params: {
      key: CSE_KEY,
      cx: CSE_CX,
      q: query,
      num: 3,
      safe: "active",
    },
  });
  const items = res.data?.items || [];
  return items.filter((item) => item.link && item.link.includes("utep.edu"));
};

const generateQueries = async (question) => {
  const model = getExtractorModel();
  const prompt = `
You plan search queries for UTEP answers.
Given a user question, produce 2-3 concise Google queries that prioritize UTEP sources. Always include "site:utep.edu" in each.
Return only a JSON array of strings. Example: ["site:utep.edu utep toefl code","site:utep.edu graduate school deadlines"]

User question: ${question}`;

  try {
    const resp = await model.invoke(prompt);
    let text;
    if (typeof resp === "string") text = resp;
    else if (resp?.content) {
      text =
        typeof resp.content === "string"
          ? resp.content
          : Array.isArray(resp.content)
          ? resp.content
              .map((c) => (typeof c === "string" ? c : c?.text || ""))
              .join(" ")
          : JSON.stringify(resp.content);
    } else {
      text = JSON.stringify(resp);
    }

    const tryParseArray = (str) => {
      try {
        const parsed = JSON.parse(str);
        return Array.isArray(parsed) ? parsed : null;
      } catch {
        const match = str.match(/\[[\s\S]*\]/);
        if (match) {
          try {
            const parsed = JSON.parse(match[0]);
            return Array.isArray(parsed) ? parsed : null;
          } catch {
            return null;
          }
        }
        return null;
      }
    };

    const queries = tryParseArray(text) || [];
    const cleaned = queries
      .map((q) => (typeof q === "string" ? q.trim() : ""))
      .filter(Boolean)
      .slice(0, 3);
    if (cleaned.length) return cleaned;
  } catch (err) {
    console.warn("LLM query planner failed:", err.message);
  }

  return [`site:utep.edu ${question}`];
};

const inspectLink = async (item, question) => {
  const html = await fetchPage(item.link);
  const $ = cheerio.load(html);
  $("script, style, noscript").remove();
  const text = $("body").text().replace(/\s+/g, " ").trim();
  const cleaned = text.slice(0, 12000);

  const extracted = await extractWithLLM({ text: cleaned, question });
  const bestSnippet =
    extracted.scores?.[0] ||
    extracted.deadline ||
    extracted.code ||
    cleaned.slice(0, 600);

  return {
    title: item.title || "UTEP source",
    url: item.link,
    snippet: item.snippet || bestSnippet,
    deadline: extracted.deadline || null,
    code: extracted.code || null,
    scores: extracted.scores || [],
  };
};

const runLiveSearch = async (query) => {
  const CSE_KEY = process.env.GOOGLE_CSE_KEY;
  const CSE_CX = process.env.GOOGLE_CSE_CX;

  if (!CSE_KEY || !CSE_CX) {
    throw new Error("Google CSE not configured");
  }

  const queries = await generateQueries(query);
  const enriched = [];
  let found = null;

  for (const q of queries.slice(0, 3)) {
    const searchResults = await searchGoogle(q, { CSE_KEY, CSE_CX });
    if (!searchResults.length) {
      console.warn("Live search: no UTEP results for query:", q);
      continue;
    }
    console.info("Live search hits:", q, searchResults.map((r) => r.link));

    for (const item of searchResults.slice(0, 3)) {
      try {
        const inspected = await inspectLink(item, query);
        enriched.push(inspected);

        if (
          inspected.deadline ||
          inspected.code ||
          (inspected.scores && inspected.scores.length)
        ) {
          found = inspected;
          break;
        }
      } catch (err) {
        console.warn("Live fetch failed for", item.link, err.message);
      }
    }
    if (found) break;
  }

  const contextLines = enriched.slice(0, 6).map((entry, idx) => {
    if (entry.deadline) {
      return `Live web result ${idx + 1}: ${entry.title} — Deadline: ${entry.deadline}. Source: ${entry.url}`;
    }
    if (entry.code) {
      return `Live web result ${idx + 1}: ${entry.title} — School/TOEFL code: ${entry.code}. Source: ${entry.url}`;
    }
    if (entry.scores && entry.scores.length) {
      return `Live web result ${idx + 1}: ${entry.title} — Scores: ${entry.scores.join(" | ")}. Source: ${entry.url}`;
    }
    return `Live web result ${idx + 1}: ${entry.title} — ${entry.snippet || "No snippet available"}. Source: ${entry.url}`;
  });

  const sources = enriched.map((entry) => ({
    topic: entry.title,
    url: entry.url,
    category: entry.deadline
      ? "Live Deadline"
      : entry.code
        ? "Live Code"
        : entry.scores && entry.scores.length
          ? "Live Scores"
          : "Live Search",
    code: entry.code,
    deadline: entry.deadline,
    scores: entry.scores,
  }));

  return {
    context: contextLines.join("\n"),
    sources,
    found,
  };
};

module.exports = { runLiveSearch };
