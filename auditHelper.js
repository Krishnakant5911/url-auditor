// auditHelper.js
const cheerio = require("cheerio");

function parseHtml(htmlContent) {
    if (!htmlContent) {
        throw new Error("HTML content is required");
    }

    const $ = cheerio.load(htmlContent);

    // Title
    const title = $("title").first().text().trim();

    // Meta Description
    const metaDescription = $('meta[name="description"]').attr("content") || "";

    // H1 Count
    const h1Count = $("h1").length;

    // Missing Alt Images
    const imagesMissingAlt = [];
    $("img").each((_, img) => {
        const alt = $(img).attr("alt");
        if (alt === undefined || alt.trim() === "") {
            imagesMissingAlt.push({
                src: $(img).attr("src") || "Unknown"
            });
        }
    });

    // Word Count (cleaning out scripts, styles, noise)
    const clone = $.load(htmlContent);
    clone("script, style, noscript, iframe, svg").remove();
    const bodyText = clone("body").text().replace(/\s+/g, " ").trim();
    const approximateWordCount = bodyText ? bodyText.split(" ").length : 0;

    return {
        title,
        metaDescription,
        h1Count,
        imagesMissingAltCount: imagesMissingAlt.length,
        imagesMissingAlt,
        approximateWordCount
    };
}

module.exports = { parseHtml };