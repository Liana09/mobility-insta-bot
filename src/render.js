import sharp from "sharp";

const WIDTH = 1080;
const HEIGHT = 1080;

export async function renderPostImage({ articles, outputPath, date = new Date() }) {
  const svg = buildSvg(articles, date);
  await sharp(Buffer.from(svg)).png().toFile(outputPath);
}

function buildSvg(articles, date) {
  const formattedDate = new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC"
  }).format(date);

  const storyBlocks = articles.slice(0, 3).map((article, index) => {
    const titleLines = wrapText(article.title, 34).slice(0, 3);
    const y = 410 + index * 160;
    return `
      <g transform="translate(86 ${y})">
        <circle cx="22" cy="22" r="22" fill="${index === 0 ? "#f4c542" : "#24a87a"}"/>
        <text x="22" y="31" text-anchor="middle" font-size="26" font-weight="800" fill="#15201e">${index + 1}</text>
        ${titleLines
          .map(
            (line, lineIndex) =>
              `<text x="66" y="${lineIndex * 38 + 12}" font-size="31" font-weight="740" fill="#f8fbf5">${escapeXml(line)}</text>`
          )
          .join("")}
        <text x="66" y="126" font-size="22" font-weight="650" fill="#a9c8bd">${escapeXml(article.source || "News")}</text>
      </g>
    `;
  });

  return `
    <svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#101816"/>
          <stop offset="55%" stop-color="#162b28"/>
          <stop offset="100%" stop-color="#0f363e"/>
        </linearGradient>
      </defs>
      <rect width="1080" height="1080" fill="url(#bg)"/>
      <rect x="0" y="0" width="1080" height="28" fill="#f4c542"/>
      <rect x="0" y="1052" width="1080" height="28" fill="#24a87a"/>

      <text x="84" y="132" font-size="30" font-weight="760" fill="#24a87a" letter-spacing="0">MOBILITY WEEKLY</text>
      <text x="84" y="224" font-size="82" font-weight="850" fill="#f8fbf5" letter-spacing="0">What moved</text>
      <text x="84" y="312" font-size="82" font-weight="850" fill="#f8fbf5" letter-spacing="0">this week</text>
      <text x="84" y="358" font-size="28" font-weight="650" fill="#c8d9d2">${escapeXml(formattedDate)}</text>

      ${storyBlocks.join("")}

      <text x="84" y="990" font-size="24" font-weight="680" fill="#f4c542">Cities. Transit. EVs. Micromobility.</text>
    </svg>
  `;
}

function wrapText(text, maxChars) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }

  if (current) {
    lines.push(current);
  }

  return lines;
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
