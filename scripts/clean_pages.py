"""
Clean scraped UTEP pages (data/utep_pages.jsonl) and write a cleaned JSONL.

Usage:
  python scripts/clean_pages.py

Output:
  data/utep_pages_cleaned.jsonl

This reuses the cleaning logic from build_chroma.py (JS/boilerplate stripping, whitespace collapse)
and drops very short documents (<200 chars).
"""
import json
import re
from pathlib import Path

INPUT_PATH = Path("data/utep_pages.jsonl")
OUTPUT_PATH = Path("data/utep_pages_cleaned.jsonl")
MIN_LENGTH = 1

# Cleaning patterns (same as build_chroma.py)
COMMENT_PATTERN = re.compile(r"<!--.*?-->", flags=re.DOTALL)
JS_JUNK_PATTERN = re.compile(
    r"\(function\(d, s, id\).*?facebook-jssdk'\)\);", flags=re.DOTALL
)
# Strip out obvious JS/CSS blobs that survived the scrape
JS_READY_PATTERN = re.compile(
    r"\$\(document\)\.ready\s*\(function\s*\(\)\s*\{.*?\}\);?",
    flags=re.DOTALL | re.IGNORECASE,
)
GENERIC_FUNCTION_PATTERN = re.compile(
    r"\bfunction\s*\([^)]*\)\s*\{[^{}]*?\}", flags=re.DOTALL | re.IGNORECASE
)
CSS_BLOCK_PATTERN = re.compile(
    r"(?:@media[^{]+)?[.#][A-Za-z0-9_\- ]+\s*\{[^{}]*?\}", flags=re.DOTALL
)
URL_PATTERN = re.compile(r"https?://\S+")
BAD_LINE_PATTERN = re.compile(
    r"(Flickity|sidr|addEventListener|hideLabel|\$\(window\)|\$\("
    r"document\)|carousel|prettyPhoto|slick)",
    flags=re.IGNORECASE,
)
BAD_TOKEN_PATTERN = re.compile(
    r"(max-width\s*:\s*\d+px|max-width|maxwidth|freeScroll|Flickity|sidr|slick|prettyPhoto|hideLabel)",
    flags=re.IGNORECASE,
)
BOILERPLATE_PATTERNS = [
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
    r"Enhancements HELP PEOPLE CENTERS COMMUNITIES RESEARCH STORIES",
    r"searchTerm-main-box",
]
BOILERPLATE_REGEX = re.compile("|".join(BOILERPLATE_PATTERNS), flags=re.IGNORECASE)


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


def clean_text(text: str) -> str:
  if not text:
    return ""
  cleaned = JS_JUNK_PATTERN.sub(" ", text)
  cleaned = JS_READY_PATTERN.sub(" ", cleaned)
  cleaned = GENERIC_FUNCTION_PATTERN.sub(" ", cleaned)
  cleaned = CSS_BLOCK_PATTERN.sub(" ", cleaned)
  cleaned = COMMENT_PATTERN.sub(" ", cleaned)
  cleaned = BOILERPLATE_REGEX.sub(" ", cleaned)
  cleaned = URL_PATTERN.sub(" ", cleaned)
  cleaned = re.sub(
      r"\.program-overview-section.*?(?=Request info)", " ", cleaned, flags=re.DOTALL | re.IGNORECASE
  )
  cleaned = re.sub(r"@media[^R]{0,120}", " ", cleaned, flags=re.IGNORECASE)
  cleaned = BAD_TOKEN_PATTERN.sub(" ", cleaned)
  # Remove stray CSS/JS symbols
  cleaned = re.sub(r"[{};]{2,}", " ", cleaned)
  cleaned = re.sub(r"[{}\[\]()]+", " ", cleaned)
  cleaned = cleaned.replace('"', " ")
  # Drop obvious code-heavy lines
  lines = []
  for raw in cleaned.splitlines():
    line = raw.strip()
    if not line:
      continue
    if BAD_LINE_PATTERN.search(line):
      continue
    lines.append(line)
  cleaned = " ".join(lines)
  cleaned = re.sub(r"[\s\u00a0]+", " ", cleaned).strip()
  cleaned = cleaned.lstrip("}]{| ")
  # Trim any leftover CSS/JS artifacts or footer junk
  for pat in [
      r"\breen and\b",
      r"Quick Links",
      r"//<!",
      r"<!",
      r"\bfunction\s*\(",
      r"\bvar\s+[A-Za-z_]",
      r"createSimpleSlider",
      r"BLACKBAUD",
      r"CDATA",
  ]:
    parts = re.split(pat, cleaned, flags=re.IGNORECASE)
    cleaned = parts[0]
  cleaned = re.sub(r"^\.\s*:focus[^;]*;\s*", "", cleaned)
  return cleaned


def esc(s: str) -> str:
  return s.replace("\\", "\\\\").replace('"', '\\"')


def main():
  if not INPUT_PATH.exists():
    raise FileNotFoundError(f"Missing input file: {INPUT_PATH}")

  pages = load_pages(INPUT_PATH)
  print(f"Loaded {len(pages)} pages from {INPUT_PATH}")

  count = 0
  with OUTPUT_PATH.open("w", encoding="utf-8") as f:
    for p in pages:
      txt = clean_text(p.get("text", ""))
      if len(txt) < MIN_LENGTH:
        continue
      url = esc(p.get("url", ""))
      title = esc(p.get("title", "") or "")
      text = esc(txt)
      f.write(f'{{"url": "{url}", "title": "{title}", "text": "{text}"}}\n')
      count += 1

  print(f"Wrote {count} cleaned items to {OUTPUT_PATH}")


if __name__ == "__main__":
  main()
