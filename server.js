const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const path = require("path");

const app = express();

app.use(express.json());

// Serve static assets (CSS, client JS)
app.use(express.static(__dirname));
app.use(express.static(path.join(__dirname, "public")));

// Direct root handler (Fixes "Cannot GET /" regardless of folder structure)
app.get("/", (req, res) => {
    // Checks if index.html is in public/ first, otherwise falls back to root
    const publicPath = path.join(__dirname, "public", "index.html");
    const rootPath = path.join(__dirname, "index.html");

    res.sendFile(publicPath, (err) => {
        if (err) {
            res.sendFile(rootPath, (fallbackErr) => {
                if (fallbackErr) {
                    res.status(404).send("index.html not found on server.");
                }
            });
        }
    });
});

app.post("/audit", async (req, res) => {
    try {
        const { url } = req.body;

        if (!url) {
            return res.status(400).json({
                success: false,
                error: "URL is required."
            });
        }

        let parsedUrl;
        try {
            const formattedUrl = url.startsWith("http://") || url.startsWith("https://") 
                ? url 
                : `https://${url}`;

            parsedUrl = new URL(formattedUrl);
            if (!["http:", "https:"].includes(parsedUrl.protocol)) {
                throw new Error();
            }
        } catch {
            return res.status(400).json({
                success: false,
                error: "Invalid URL provided."
            });
        }

        const start = Date.now();

        const response = await axios.get(parsedUrl.href, {
            timeout: 10000,
            validateStatus: () => true,
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) WebsiteAuditor/1.0"
            }
        });

        const responseTime = Date.now() - start;
        const contentType = response.headers["content-type"] || "";

        if (!contentType.includes("text/html")) {
            return res.json({
                success: false,
                error: "The targeted URL is not an HTML webpage."
            });
        }

        const $ = cheerio.load(response.data);

        const title = $("title").first().text().trim();
        const metaDescription = $('meta[name="description"]').attr("content") || "";
        const h1Count = $("h1").length;

        const imagesMissingAlt = [];
        $("img").each((_, img) => {
            const alt = $(img).attr("alt");
            if (alt === undefined || alt.trim() === "") {
                imagesMissingAlt.push({
                    src: $(img).attr("src") || "Unknown"
                });
            }
        });

        $("script, style, noscript, iframe, svg").remove();
        const bodyText = $("body").text().replace(/\s+/g, " ").trim();
        const wordCount = bodyText ? bodyText.split(" ").length : 0;

        res.json({
            success: true,
            httpStatus: response.status,
            responseTimeMs: responseTime,
            title,
            metaDescription,
            h1Count,
            imagesMissingAltCount: imagesMissingAlt.length,
            imagesMissingAlt,
            approximateWordCount: wordCount
        });

    } catch (err) {
        if (err.code === "ECONNABORTED") {
            return res.json({
                success: false,
                error: "Request timed out after 10 seconds."
            });
        }

        res.json({
            success: false,
            error: "Unable to reach or audit the target website."
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});