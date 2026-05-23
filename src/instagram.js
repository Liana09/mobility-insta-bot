export async function publishToInstagram({ accessToken, apiVersion, caption, igUserId, imageUrl }) {
  if (!igUserId || !accessToken) {
    throw new Error("Missing IG_USER_ID or IG_ACCESS_TOKEN. Add them as GitHub repository secrets.");
  }

  const container = await createMediaContainer({
    accessToken,
    apiVersion,
    caption,
    igUserId,
    imageUrl
  });

  await sleep(5000);

  return publishMediaContainer({
    accessToken,
    apiVersion,
    creationId: container.id,
    igUserId
  });
}

async function createMediaContainer({ accessToken, apiVersion, caption, igUserId, imageUrl }) {
  const url = new URL(`https://graph.facebook.com/${apiVersion}/${igUserId}/media`);
  url.searchParams.set("image_url", imageUrl);
  url.searchParams.set("caption", caption);
  url.searchParams.set("access_token", accessToken);

  return postJson(url);
}

async function publishMediaContainer({ accessToken, apiVersion, creationId, igUserId }) {
  const url = new URL(`https://graph.facebook.com/${apiVersion}/${igUserId}/media_publish`);
  url.searchParams.set("creation_id", creationId);
  url.searchParams.set("access_token", accessToken);

  return postJson(url);
}

async function postJson(url) {
  const response = await fetch(url, { method: "POST" });
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = body?.error?.message || response.statusText;
    throw new Error(`Instagram API request failed: ${message}`);
  }

  return body;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
