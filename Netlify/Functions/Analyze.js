export default async (request) => {
  const headers = {
    "Access-Control-Allow-Origin": "https://cmbutler76.github.io",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };

  if (request.method === "OPTIONS") {
    return new Response("", { status: 204, headers });
  }

  if (request.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers }
    );
  }

  try {
    const { images } = await request.json();

    if (!Array.isArray(images) || images.length === 0) {
      return new Response(
        JSON.stringify({ error: "No photos were provided." }),
        { status: 400, headers }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not configured.");
    }

    const imageParts = images.map((image) => ({
      type: "input_image",
      image_url: image,
    }));

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-5-mini",
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: `Analyze all attached photos as one auction lot.

Create an accurate auction listing. Do not claim a maker, material, age, authenticity, precious-metal content, or condition detail unless it is visible or reasonably supported by the photos. If uncertain, say so in warnings.

Return ONLY valid JSON in exactly this format:
{
  "title": "",
  "description": "",
  "maker_markings": "",
  "condition": "",
  "warnings": ""
}`,
              },
              ...imageParts,
            ],
          },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.error?.message || "OpenAI request failed.");
    }

    const text =
      data.output_text ||
      data.output
        ?.flatMap((item) => item.content || [])
        ?.find((item) => item.type === "output_text")?.text;

    if (!text) {
      throw new Error("No listing was returned.");
    }

    const cleaned = text
      .replace(/^```json\s*/i, "")
      .replace(/```$/i, "")
      .trim();

    const listing = JSON.parse(cleaned);

    return new Response(JSON.stringify(listing), {
      status: 200,
      headers,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message || "Analysis failed." }),
      { status: 500, headers }
    );
  }
