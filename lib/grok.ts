import OpenAI from "openai";

let client: OpenAI | null = null;

export function grokModel() {
  return process.env.GROK_MODEL?.trim() || "grok-4.7";
}

export function getGrok() {
  const apiKey = process.env.XAI_API_KEY?.trim();
  if (!apiKey) return null;
  if (!client) {
    client = new OpenAI({
      apiKey,
      baseURL: "https://api.x.ai/v1",
      timeout: 90_000,
      maxRetries: 0,
    });
  }
  return client;
}

export function parseJson(text: string): unknown {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenced) return JSON.parse(fenced[1]);
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(trimmed.slice(start, end + 1));
    throw new Error("Grok did not return JSON.");
  }
}

type ContentPart =
  | { type: "input_text"; text: string }
  | { type: "input_image"; image_url: string; detail: "auto" };

function safeMessage(err: unknown) {
  const message = err instanceof Error ? err.message : "Grok request failed";
  const key = process.env.XAI_API_KEY;
  const redacted = key && message.includes(key) ? message.replaceAll(key, "[redacted]") : message;
  return redacted.slice(0, 400);
}

export async function grokJSON(options: { system: string; userText: string; images?: string[] }) {
  const grok = getGrok();
  if (!grok) {
    throw new Error("Add XAI_API_KEY to .env.local to use Grok.");
  }

  const userContent: ContentPart[] = [];
  for (const image of options.images ?? []) {
    userContent.push({ type: "input_image", image_url: image, detail: "auto" });
  }
  userContent.push({ type: "input_text", text: options.userText });

  const input = [
    { role: "system" as const, content: [{ type: "input_text" as const, text: options.system }] },
    { role: "user" as const, content: userContent },
  ];

  try {
    try {
      const response = await grok.responses.create({
        model: grokModel(),
        store: false,
        input,
        text: { format: { type: "json_object" } },
      });
      const text = response.output_text;
      if (!text.trim()) throw new Error("Grok returned an empty response.");
      return parseJson(text);
    } catch (err) {
      const message = safeMessage(err);
      const retryable = /response_format|json_object|text\.format|store|unsupported|invalid_request/i.test(message);
      if (!retryable) throw err;
      const response = await grok.responses.create({
        model: grokModel(),
        input,
      });
      const text = response.output_text;
      if (!text.trim()) throw new Error("Grok returned an empty response.");
      return parseJson(text);
    }
  } catch (responseError) {
    const message = safeMessage(responseError);
    const tryChat = /response_format|json_object|text\.format|store|unsupported|invalid|400|404|not found|unrecognized/i.test(
      message,
    );
    if (!tryChat) throw new Error(message);
    try {
      const imageParts = (options.images ?? []).map((url) => ({
        type: "image_url" as const,
        image_url: { url },
      }));
      const completion = await grok.chat.completions.create({
        model: grokModel(),
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: options.system },
          {
            role: "user",
            content: imageParts.length
              ? [...imageParts, { type: "text" as const, text: options.userText }]
              : options.userText,
          },
        ],
      });
      const text = completion.choices[0]?.message?.content ?? "";
      if (!text.trim()) throw new Error(message);
      return parseJson(text);
    } catch {
      throw new Error(message);
    }
  }
}
