import fs from "node:fs/promises";
import path from "node:path";
import { buildCaption } from "./caption.js";
import { getConfig } from "./config.js";
import { publishToInstagram } from "./instagram.js";
import { fetchMobilityNews } from "./news.js";
import { renderPostImage } from "./render.js";
import {
  clearPendingPost,
  readPendingPost,
  readPostedState,
  writePendingPost,
  writePostedState
} from "./state.js";

const command = process.argv[2] || "dry-run";

try {
  if (command === "prepare") {
    await preparePost({ dryRun: false });
  } else if (command === "publish") {
    await publishPost();
  } else if (command === "dry-run") {
    await preparePost({ dryRun: true });
  } else {
    throw new Error(`Unknown command "${command}". Use prepare, publish, or dry-run.`);
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}

async function preparePost({ dryRun }) {
  const config = getConfig();
  const existingPending = await readPendingPost();

  if (existingPending && !dryRun) {
    console.log(`Pending post already exists at ${existingPending.imagePath}. Publish it before preparing another.`);
    return;
  }

  const postedState = await readPostedState();
  const articles = await fetchMobilityNews(
    config.feedUrls,
    postedState.posted.map((item) => item.id)
  );

  if (!articles.length) {
    console.log("No new mobility news found.");
    return;
  }

  const now = new Date();
  const dateSlug = now.toISOString().slice(0, 10);
  const imagePath = path.join("dist", "posts", `${dateSlug}-${slugify(articles[0].title)}.png`);
  await fs.mkdir(path.dirname(imagePath), { recursive: true });

  const selectedArticles = articles.slice(0, 3);
  const caption = buildCaption(selectedArticles, now);
  await renderPostImage({ articles: selectedArticles, outputPath: imagePath, date: now });

  const post = {
    id: selectedArticles[0].id,
    preparedAt: now.toISOString(),
    caption,
    imagePath,
    imageUrl: buildImageUrl(config, imagePath),
    articles: selectedArticles.map(({ id, link, publishedAt, source, title }) => ({
      id,
      link,
      publishedAt,
      source,
      title
    }))
  };

  if (dryRun) {
    console.log(`Dry run prepared ${imagePath}`);
    console.log("");
    console.log(caption);
    return;
  }

  await writePendingPost(post);
  console.log(`Prepared ${imagePath}`);
}

async function publishPost() {
  const config = getConfig();
  const pending = await readPendingPost();

  if (!pending) {
    console.log("No pending post to publish.");
    return;
  }

  const imageUrl = pending.imageUrl || buildImageUrl(config, pending.imagePath);
  if (!imageUrl) {
    throw new Error(
      "Could not build a public image URL. Set PUBLIC_BASE_URL or run from GitHub Actions in a public repository."
    );
  }

  if (process.env.DRY_RUN === "true") {
    console.log(`DRY_RUN=true, skipping Instagram publish for ${imageUrl}`);
    return;
  }

  const result = await publishToInstagram({
    accessToken: config.igAccessToken,
    apiVersion: config.graphApiVersion,
    caption: pending.caption,
    igUserId: config.igUserId,
    imageUrl
  });

  const postedState = await readPostedState();
  const publishedAt = new Date().toISOString();
  const knownIds = new Set(postedState.posted.map((item) => item.id));
  const newItems = pending.articles
    .filter((article) => !knownIds.has(article.id))
    .map((article) => ({
      id: article.id,
      title: article.title,
      link: article.link,
      publishedAt,
      instagramMediaId: result.id
    }));

  await writePostedState({
    posted: [...newItems, ...postedState.posted].slice(0, 100)
  });
  await clearPendingPost();

  console.log(`Published Instagram media ${result.id}`);
}

function buildImageUrl(config, imagePath) {
  const normalizedPath = imagePath.split(path.sep).join("/");

  if (config.publicBaseUrl) {
    return `${config.publicBaseUrl.replace(/\/$/, "")}/${normalizedPath}`;
  }

  if (config.repository && config.refName) {
    return `https://raw.githubusercontent.com/${config.repository}/${config.refName}/${normalizedPath}`;
  }

  return "";
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
}
