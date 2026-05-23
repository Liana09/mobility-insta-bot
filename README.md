# Mobility Instagram Bot

Weekly automation that collects mobility news, generates a square Instagram post image, writes a caption, and publishes it through the Instagram Graph API.

## What It Does

- Reads mobility-related RSS/news feeds.
- Picks the strongest recent stories that have not already been posted.
- Generates a `1080x1080` PNG post image.
- Publishes the post to Instagram on a weekly GitHub Actions schedule.
- Records posted story IDs in `.state/posted.json` to avoid repeats.

## Instagram Requirements

Instagram publishing uses Meta's official content publishing flow:

1. Create a media container for an Instagram professional account.
2. Publish that media container.

You need:

- An Instagram Business or Creator account.
- A Meta app with Instagram content publishing permissions.
- An Instagram user/account ID for the professional account.
- A long-lived access token that can publish content for that account.

## GitHub Secrets

Add these repository secrets:

- `IG_USER_ID`: Instagram professional account ID.
- `IG_ACCESS_TOKEN`: long-lived Meta/Instagram access token.

Optional repository variables or secrets:

- `GRAPH_API_VERSION`: defaults to `v24.0`.
- `NEWS_QUERY`: defaults to a broad mobility-news query.
- `NEWS_RSS_FEEDS`: comma-separated RSS feed URLs. If set, this replaces the default Google News RSS search feed.
- `PUBLIC_BASE_URL`: public URL prefix for generated images. Leave unset if this repo is public and raw GitHub URLs are acceptable.

## Local Dry Run

```sh
npm install
npm run dry-run
```

Dry runs generate a post preview under `dist/posts/` and do not publish to Instagram.

## Manual Publish

```sh
npm run prepare-post
npm run publish-post
```

`publish-post` needs `IG_USER_ID` and `IG_ACCESS_TOKEN` in the environment.

## Weekly Schedule

The included workflow runs every Monday at `08:00 UTC` and can also be started manually from GitHub Actions.
