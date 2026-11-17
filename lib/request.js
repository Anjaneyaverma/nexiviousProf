export async function readJsonObject(request, maxBytes) {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > maxBytes) return { error: "Request is too large." };

  const text = await request.text();
  if (Buffer.byteLength(text, "utf8") > maxBytes) {
    return { error: "Request is too large." };
  }

  try {
    const value = JSON.parse(text);
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return { error: "A JSON object is required." };
    }
    return { value };
  } catch (error) {
    if (error instanceof SyntaxError) return { error: "The request body is not valid JSON." };
    throw error;
  }
}
