export function buildCaption(articles, date = new Date()) {
  const formatter = new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC"
  });

  const lines = [
    `Mobility Weekly - ${formatter.format(date)}`,
    "",
    ...articles.slice(0, 3).flatMap((article, index) => [
      `${index + 1}. ${article.title}`,
      article.source ? `Source: ${article.source}` : ""
    ]),
    "",
    "A quick roundup of the mobility stories shaping transport, cities, and electric movement this week.",
    "",
    "#mobility #transportation #publictransit #electricvehicles #micromobility #urbanmobility"
  ];

  return lines.filter((line, index, all) => line || all[index - 1]).join("\n").trim();
}
