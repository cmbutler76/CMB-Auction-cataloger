export default async (request) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };

  if (request.method === "OPTIONS") return new Response("", { status: 204, headers });
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers });
  }

  try {
    const body = await request.json();
    const images = Array.isArray(body?.images) ? body.images : [];

    if (!images.length) {
      return new Response(JSON.stringify({ error: "No photos were provided." }), { status: 400, headers });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY is not configured in Netlify.");

    const imageParts = images
      .map((image) => typeof image === "string" ? image : image?.data)
      .filter((image) => typeof image === "string" && image.startsWith("data:image/"))
      .map((image_url) => ({ type: "input_image", image_url }));

    if (!imageParts.length) {
      return new Response(JSON.stringify({ error: "No usable image data was provided." }), { status: 400, headers });
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-5-mini",
        input: [{
          role: "user",
          content: [
            {
              type: "input_text",
              text: `Analyze all attached photos as one auction lot.

Create a concise, accurate auction listing. Do not claim a maker, material, age, authenticity, precious-metal content, gemstone identity, or condition detail unless it is visible or reasonably supported by the photos. Describe visible stamps as "marked" or "stamped." Put anything that needs human verification in warnings.

Return ONLY valid JSON with this exact shape:
{
  "title": "",
  "description": "",
  "maker_markings": "",
  "condition": "",
  "warnings": []
}

"warnings" must always be an array of short strings.`
            },
            ...imageParts
          ]
        }]
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data?.error?.message || "OpenAI request failed.");

    const text =
      data.output_text ||
      data.output?.flatMap((item) => item.content || [])?.find((item) => item.type === "output_text")?.text;

    if (!text) throw new Error("No listing was returned.");

    const cleaned = text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
    const listing = JSON.parse(cleaned);

    return new Response(JSON.stringify({
      title: listing.title || "",
      description: listing.description || "",
      maker_markings: listing.maker_markings || listing.markings || "",
      condition: listing.condition || "",
      warnings: Array.isArray(listing.warnings)
        ? listing.warnings
        : (listing.warnings ? [String(listing.warnings)] : [])
    }), { status: 200, headers });

  } catch (error) {
    return new Response(JSON.stringify({ error: error?.message || "Analysis failed." }), { status: 500, headers });
  }
};
