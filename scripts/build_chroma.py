import os
import json
import re
from pathlib import Path

from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter

# Paths and chunking
INPUT_PATH = Path("data/utep_pages.jsonl")
CHROMA_DIR = Path("data/utep_chroma_db")
CHUNK_SIZE = 1000
CHUNK_OVERLAP = 100
MIN_LENGTH = 200

# Cleaning patterns
COMMENT_PATTERN = re.compile(r"<!--.*?-->", flags=re.DOTALL)
JS_JUNK_PATTERN = re.compile(
    r"\(function\(d, s, id\).*?facebook-jssdk'\)\);", flags=re.DOTALL
)
BOILERPLATE_PATTERNS = [
    # Navigation / UI noise
    r"Skip to main content",
    r"MinerAlert",
    r"Search pages and people",
    r"Toggle navigation",
    r"My UTEP",
    r"Resources for INFORMATION FOR:",
    r"Students Faculty & Staff Alumni Parents",
    r"Quick Links X Quick Links",
    r"Main Content",
    r"Modal X",
    r"SITE FEEDBACK",
    # Footer & compliance
    r"Connect With Us",
    r"The University of Texas at El Paso",
    r"CARES Act Compliance",
    r"Clery Crime Statistics",
    r"Emergency Information",
    r"Employment Mental Health Resources",
    r"Public Course Information",
    r"Report Fraud",
    r"Required Links",
    r"State Reports",
    r"Texas Veterans Portal",
    r"Title IX Reporting",
    r"Title IX Sexual Misconduct Policy",
    r"UT System",
    r"Web Accessibility",
    r"Web Privacy Policy",
    r"500 West University Avenue\s*\|\s*El Paso,\s*TX\s*79968\s*\|\s*[\d-]*",
]
BOILERPLATE_REGEX = re.compile("|".join(BOILERPLATE_PATTERNS), flags=re.IGNORECASE)


def clean_text(text: str) -> str:
    """Clean scraped text: remove JS/boilerplate, comments, collapse whitespace."""
    if not text:
        return ""
    cleaned = JS_JUNK_PATTERN.sub(" ", text)
    cleaned = COMMENT_PATTERN.sub(" ", cleaned)
    cleaned = BOILERPLATE_REGEX.sub(" ", cleaned)
    cleaned = re.sub(r"[\s\u00a0]+", " ", cleaned).strip()
    return cleaned


def load_pages(path: Path):
    pages = []
    with path.open("r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                obj = json.loads(line)
                if obj.get("text") and obj.get("url"):
                    pages.append(obj)
            except json.JSONDecodeError:
                continue
    return pages


def chunk_pages(pages):
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        separators=["\n\n", "\n", " ", ""],
    )
    docs = []
    for page in pages:
        text = clean_text(page.get("text", ""))
        if not text or len(text) < MIN_LENGTH:
            continue
        splits = splitter.create_documents(
            [text],
            metadatas=[{"url": page.get("url", ""), "title": page.get("title", "")}],
        )
        docs.extend(splits)
    return docs


def build_index():
    if not INPUT_PATH.exists():
        raise FileNotFoundError(f"Missing input file: {INPUT_PATH}")
    if not os.getenv("OPENAI_API_KEY"):
        raise RuntimeError("OPENAI_API_KEY is required for embedding")

    print("Loading pages...")
    pages = load_pages(INPUT_PATH)
    print(f"Loaded {len(pages)} pages")

    print("Cleaning and chunking pages...")
    docs = chunk_pages(pages)
    print(f"Prepared {len(docs)} chunks")

    print("Embedding and building Chroma index...")
    embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
    vectorstore = Chroma.from_documents(
        documents=docs,
        embedding=embeddings,
        persist_directory=str(CHROMA_DIR),
    )
    vectorstore.persist()
    print(f"Chroma index persisted to {CHROMA_DIR}")


if __name__ == "__main__":
    build_index()

