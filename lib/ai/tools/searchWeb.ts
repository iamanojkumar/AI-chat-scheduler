import { z } from "zod";

const searchWebSchema = z.object({
  query: z.string().describe("The search query to find events, movies, or activities"),
});

export type SearchWebInput = z.infer<typeof searchWebSchema>;

export async function searchWeb(input: SearchWebInput): Promise<{
  results: Array<{
    title: string;
    url: string;
    content: string;
    publishedDate?: string;
  }>;
}> {
  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": process.env.TAVILY_API_KEY!,
    },
    body: JSON.stringify({
      api_key: process.env.TAVILY_API_KEY!,
      query: input.query,
      search_depth: "advanced",
      include_answer: true,
      include_raw_content: false,
      max_results: 10,
    }),
  });

  if (!response.ok) {
    throw new Error(`Tavily API error: ${response.statusText}`);
  }

  const data = await response.json();

  // Extract event names and dates from search results
  const results = (data.results || []).map((result: any) => ({
    title: result.title || "",
    url: result.url || "",
    content: result.content || "",
    publishedDate: result.published_date || undefined,
  }));

  return { results };
}

export const searchWebTool = {
  description: "Search the web for upcoming events, movies, concerts, or activities. Returns a list of relevant results with titles, URLs, and content.",
  parameters: searchWebSchema,
  execute: searchWeb,
};

