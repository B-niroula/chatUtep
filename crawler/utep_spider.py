import json
from pathlib import Path
import scrapy
from urllib.parse import urlparse

SKIP_EXTENSIONS = {
    ".pdf",
    ".doc",
    ".docx",
    ".xls",
    ".xlsx",
    ".ppt",
    ".pptx",
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".svg",
    ".mp4",
    ".mov",
    ".zip",
}

DENY_PATH_KEYWORDS = [
    "/directory",
    "/people",
    "/staff",
    "/news",
    "/events",
    "/archive",
    "/blog",
    "/login",
    "/myutep",
    "/secure",
    "/search",
    "/utility",
]

class UtepSpider(scrapy.Spider):
    name = "utep_spider"
    allowed_domains = ["utep.edu"]
    start_urls = ["https://www.utep.edu/programs/graduate/?utep-home"]

    custom_settings = {
        "DEPTH_LIMIT": 7,
        "DOWNLOAD_DELAY": 2.0,
        "ROBOTSTXT_OBEY": True,
        "LOG_LEVEL": "INFO",
        "FEEDS": {
            "data/utep_pages.jsonl": {
                "format": "jsonlines",
                "encoding": "utf8",
                "append": True,
                "store_empty": False,
            }
        },
    }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.seen_urls = set()
        existing = Path("data/utep_pages.jsonl")
        if existing.exists():
            try:
                with existing.open("r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if not line:
                            continue
                        try:
                            obj = json.loads(line)
                            if "url" in obj:
                                self.seen_urls.add(obj["url"])
                        except json.JSONDecodeError:
                            continue
                self.logger.info(f"Loaded {len(self.seen_urls)} existing URLs to skip")
            except Exception as e:
                self.logger.warning(f"Could not load existing URLs: {e}")

    def parse(self, response):
        ctype = response.headers.get(b"Content-Type", b"").decode("utf-8").lower()
        if "text/html" not in ctype:
            return

        # If we've seen this URL before, skip emitting an item but still follow links
        is_new = response.url not in self.seen_urls
        self.seen_urls.add(response.url)

        if is_new:
            # Extract visible text
            text_parts = response.xpath("//body//text()[normalize-space()]").getall()
            text = " ".join(t.strip() for t in text_parts if t.strip())

            title = response.xpath("//title/text()").get() or ""

            yield {
                "url": response.url,
                "title": title.strip(),
                "text": text,
            }

        # Follow internal links only
        for href in response.css("a::attr(href)").getall():
            url = response.urljoin(href)
            parsed = urlparse(url)
            if parsed.netloc.endswith("utep.edu"):
                path_lower = parsed.path.lower()
                # Keep crawl within /graduate or explicitly allowed high-value paths
                if "/graduate/" not in path_lower and not any(
                    kw in path_lower for kw in ["/admissions", "/financial-aid", "/scholarships"]
                ):
                    continue
                if any(path_lower.endswith(ext) for ext in SKIP_EXTENSIONS):
                    continue
                if any(k in path_lower for k in DENY_PATH_KEYWORDS):
                    continue
                if url in self.seen_urls:
                    continue
                yield scrapy.Request(url, callback=self.parse)
