// audit.test.js
const { parseHtml } = require("./auditHelper");

describe("Website Audit Parsing Logic", () => {
    
    // 1. HAPPY PATH
    test("Happy Path: Correctly parses title, meta, H1s, missing alt tags, and word count", () => {
        const sampleHtml = `
            <!DOCTYPE html>
            <html>
                <head>
                    <title>Test Page Title</title>
                    <meta name="description" content="This is a test meta description.">
                </head>
                <body>
                    <h1>Main Heading</h1>
                    <p>Hello world, this is a test page containing some body text.</p>
                    <img src="valid.jpg" alt="A valid image">
                    <img src="missing1.jpg">
                    <img src="missing2.jpg" alt="">
                </body>
            </html>
        `;

        const result = parseHtml(sampleHtml);

        expect(result.title).toBe("Test Page Title");
        expect(result.metaDescription).toBe("This is a test meta description.");
        expect(result.h1Count).toBe(1);
        expect(result.imagesMissingAltCount).toBe(2);
        expect(result.imagesMissingAlt).toEqual([
            { src: "missing1.jpg" },
            { src: "missing2.jpg" }
        ]);
        expect(result.approximateWordCount).toBeGreaterThan(0);
    });

    // 2. FAILURE CASE 1: Missing metadata & structural elements
    test("Failure Case 1: Gracefully handles missing title, description, and images", () => {
        const malformedHtml = `
            <html>
                <body>
                    <p>Bare minimum HTML with no head tags or images.</p>
                </body>
            </html>
        `;

        const result = parseHtml(malformedHtml);

        expect(result.title).toBe("");
        expect(result.metaDescription).toBe("");
        expect(result.h1Count).toBe(0);
        expect(result.imagesMissingAltCount).toBe(0);
        expect(result.approximateWordCount).toBe(8);
    });

    // 3. FAILURE CASE 2: No HTML content / invalid payload
    test("Failure Case 2: Throws error when HTML content is empty or null", () => {
        expect(() => parseHtml("")).toThrow("HTML content is required");
        expect(() => parseHtml(null)).toThrow("HTML content is required");
    });

    // 4. EDGE CASE: Stripping script and style tags from word count
    test("Edge Case: Excludes script and style tags from word count calculation", () => {
        const htmlWithScripts = `
            <html>
                <head>
                    <style>body { color: red; background: blue; }</style>
                </head>
                <body>
                    <h1>Title</h1>
                    <script>console.log("This should not be counted as body text");</script>
                    <p>Only these five words count.</p>
                </body>
            </html>
        `;

        const result = parseHtml(htmlWithScripts);
        expect(result.approximateWordCount).toBe(6); // "Title" + "Only these five words count."
    });
});