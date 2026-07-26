const button = document.getElementById("auditBtn");

button.addEventListener("click", audit);

async function audit() {
    const urlInput = document.getElementById("url");
    const result = document.getElementById("result");
    const url = urlInput.value.trim();

    if (!url) {
        result.innerHTML = "<p style='color:red'>Please enter a valid URL.</p>";
        return;
    }

    result.innerHTML = "Loading audit report...";
    button.disabled = true;

    try {
        const response = await fetch("/audit", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ url })
        });

        // 1. Parse response as JSON (fixes the 'data is not defined' error)
        const data = await response.json();

        // 2. Handle server-side or business logic errors
        if (!response.ok || !data.success) {
            result.innerHTML = `<p style="color:red">${data.error || "Failed to audit website."}</p>`;
            return;
        }

        // 3. Render audit findings
        result.innerHTML = `
            <h2>Audit Report</h2>
            <p><strong>Status:</strong> ${data.httpStatus}</p>
            <p><strong>Response Time:</strong> ${data.responseTimeMs} ms</p>
            <p><strong>Title:</strong> ${data.title || "<em>None found</em>"}</p>
            <p><strong>Meta Description:</strong> ${data.metaDescription || "<em>None found</em>"}</p>
            <p><strong>H1 Count:</strong> ${data.h1Count}</p>
            <p><strong>Images Missing Alt:</strong> ${data.imagesMissingAltCount}</p>
            <p><strong>Word Count:</strong> ${data.approximateWordCount}</p>
        `;

    } catch (err) {
        console.error(err);
        result.innerHTML = "<p style='color:red'>Network error or backend issue. Something went wrong.</p>";
    } finally {
        button.disabled = false;
    }
}