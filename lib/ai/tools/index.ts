import { searchWebTool } from "./searchWeb";
import { getMovieDetailsTool } from "./getMovieDetails";
import { createCalendarEventTool } from "./createCalendarEvent";

export const tools = {
  searchWeb: searchWebTool,
  getMovieDetails: getMovieDetailsTool,
  createCalendarEvent: createCalendarEventTool,
};

export type ToolName = keyof typeof tools;

