export const DEFAULT_NEWS_QUERY =
  '("mobility" OR "transportation" OR "public transit" OR "electric vehicles" OR "micromobility") when:7d';

export function getConfig() {
  const newsQuery = process.env.NEWS_QUERY?.trim() || DEFAULT_NEWS_QUERY;
  const feedUrls = parseFeedUrls(process.env.NEWS_RSS_FEEDS, newsQuery);

  return {
    feedUrls,
    graphApiVersion: process.env.GRAPH_API_VERSION?.trim() || "v24.0",
    igAccessToken: process.env.IG_ACCESS_TOKEN?.trim(),
    igUserId: process.env.IG_USER_ID?.trim(),
    publicBaseUrl: process.env.PUBLIC_BASE_URL?.trim(),
    repository: process.env.GITHUB_REPOSITORY?.trim(),
    refName: process.env.GITHUB_REF_NAME?.trim() || "main"
  };
}

function parseFeedUrls(value, newsQuery) {
  if (value?.trim()) {
    return value
      .split(",")
      .map((url) => url.trim())
      .filter(Boolean);
  }

  const query = encodeURIComponent(newsQuery);
  return [`https://news.google.com/rss/search?q=${query}&hl=en-US&gl=US&ceid=US:en`];
}
