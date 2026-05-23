import Parser from "rss-parser";

const parser = new Parser({
  customFields: {
    item: [["source", "source"]]
  },
  timeout: 15000
});

const MOBILITY_KEYWORDS = [
  "mobility",
  "transport",
  "transit",
  "rail",
  "train",
  "bus",
  "subway",
  "metro",
  "bike",
  "scooter",
  "walk",
  "ev",
  "electric vehicle",
  "charging",
  "autonomous",
  "ridehail",
  "rideshare",
  "micromobility"
];

export async function fetchMobilityNews(feedUrls, postedIds = []) {
  const settledFeeds = await Promise.allSettled(feedUrls.map((url) => parser.parseURL(url)));
  const postedSet = new Set(postedIds);
  const articles = [];

  for (const result of settledFeeds) {
    if (result.status !== "fulfilled") {
      console.warn(`Skipping feed: ${result.reason?.message || result.reason}`);
      continue;
    }

    for (const item of result.value.items || []) {
      const article = normalizeItem(item, result.value.title);
      if (!article || postedSet.has(article.id)) {
        continue;
      }
      articles.push(article);
    }
  }

  return dedupeArticles(articles)
    .map((article) => ({ ...article, score: scoreArticle(article) }))
    .filter((article) => article.score > 0)
    .sort((a, b) => b.score - a.score || b.publishedAtMs - a.publishedAtMs)
    .slice(0, 5);
}

function normalizeItem(item, feedTitle) {
  const rawTitle = cleanText(item.title);
  if (!rawTitle) {
    return null;
  }

  const source = cleanText(extractSource(item, feedTitle));
  const title = stripSourceSuffix(rawTitle, source);
  const link = item.link || item.guid || "";
  const id = item.guid || item.id || link || title;
  const publishedAt = item.isoDate || item.pubDate || new Date().toISOString();
  const publishedAtMs = Number.isNaN(Date.parse(publishedAt)) ? 0 : Date.parse(publishedAt);

  return {
    id,
    title,
    source,
    link,
    publishedAt,
    publishedAtMs,
    summary: cleanText(item.contentSnippet || item.summary || item.content || "")
  };
}

function extractSource(item, feedTitle) {
  if (typeof item.source === "string") {
    return item.source;
  }

  if (item.source?._) {
    return item.source._;
  }

  if (item.creator) {
    return item.creator;
  }

  if (item.link) {
    try {
      return new URL(item.link).hostname.replace(/^www\./, "");
    } catch {
      return feedTitle || "News";
    }
  }

  return feedTitle || "News";
}

function stripSourceSuffix(title, source) {
  if (!source) {
    return title;
  }

  const suffix = ` - ${source}`;
  return title.endsWith(suffix) ? title.slice(0, -suffix.length).trim() : title;
}

function cleanText(value) {
  return String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function scoreArticle(article) {
  const haystack = `${article.title} ${article.summary}`.toLowerCase();
  const keywordScore = MOBILITY_KEYWORDS.reduce(
    (total, keyword) => total + (haystack.includes(keyword) ? 4 : 0),
    0
  );
  const ageHours = Math.max(0, (Date.now() - article.publishedAtMs) / 36e5);
  const freshnessScore = Math.max(0, 12 - ageHours / 12);
  return keywordScore + freshnessScore;
}

function dedupeArticles(articles) {
  const seen = new Set();
  const deduped = [];

  for (const article of articles) {
    const key = article.link || article.title.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    deduped.push(article);
  }

  return deduped;
}
