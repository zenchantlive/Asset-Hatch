import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const request = await req.json();
  const messages = request.messages || [];

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-pro",
      messages: messages.map((m: any) => ({
        role: m.role === "assistant" ? "assistant" : m.role,
        content: typeof m.content === "string" ? m.content : "",
      })),
      stream: true,
    }),
  });

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const stream = response.body?.getReader();
  
  const readableStream = new ReadableStream({
    async start(controller) {
      if (stream) {
        try {
          while (true) {
            const { done, value } = await stream.read();
            if (done) break;
            if (value) {
              const chunk = decoder.decode(value, { stream: true });
              const lines = chunk.split("\n").filter((line) => line.trim() !== "");
              
              for (const line of lines) {
                if (line.startsWith("data: ")) {
                  const data = JSON.parse(line.slice(6));
                  if (data.choices?.[0]?.delta?.content) {
                    controller.enqueue({
                      type: "TextMessageContent",
                      content: data.choices[0].delta.content,
                    });
                  } else if (data.choices?.[0]?.finish_reason) {
                    controller.enqueue({
                      type: "TextMessageEnd",
                    });
                  }
                }
              }
            }
          }
        } catch (error) {
          controller.error(error);
        }
      }
    },
  });

  return new Response(readableStream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
