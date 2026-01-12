import { z } from "zod";

const getMovieDetailsSchema = z.object({
  title: z.string().describe("The exact title of the movie to fetch details for"),
});

export type GetMovieDetailsInput = z.infer<typeof getMovieDetailsSchema>;

export interface MovieDetails {
  title: string;
  poster: string;
  plot: string;
  released: string;
  year?: string;
  imdbRating?: string;
}

export async function getMovieDetails(input: GetMovieDetailsInput): Promise<MovieDetails> {
  const response = await fetch(
    `https://www.omdbapi.com/?t=${encodeURIComponent(input.title)}&apikey=${process.env.OMDB_API_KEY}`
  );

  if (!response.ok) {
    throw new Error(`OMDb API error: ${response.statusText}`);
  }

  const data = await response.json();

  if (data.Response === "False") {
    throw new Error(data.Error || "Movie not found");
  }

  return {
    title: data.Title || input.title,
    poster: data.Poster || "",
    plot: data.Plot || "",
    released: data.Released || "",
    year: data.Year,
    imdbRating: data.imdbRating,
  };
}

export const getMovieDetailsTool = {
  description: "Fetch detailed information about a movie including poster, plot, release date, and ratings from OMDb API.",
  parameters: getMovieDetailsSchema,
  execute: getMovieDetails,
};

