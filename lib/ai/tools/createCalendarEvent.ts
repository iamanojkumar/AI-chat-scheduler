import { z } from "zod";
import { google } from "googleapis";

const createCalendarEventSchema = z.object({
  title: z.string().describe("The title of the calendar event"),
  description: z.string().optional().describe("Detailed description of the event"),
  startDateTime: z.string().describe("Start date and time in ISO 8601 format (e.g., 2024-12-25T19:00:00)"),
  endDateTime: z.string().describe("End date and time in ISO 8601 format (e.g., 2024-12-25T21:00:00)"),
  location: z.string().optional().describe("Location of the event"),
  timeZone: z.string().optional().default("America/New_York").describe("Timezone for the event"),
});

export type CreateCalendarEventInput = z.infer<typeof createCalendarEventSchema>;

export async function createCalendarEvent(
  input: CreateCalendarEventInput,
  accessToken: string
): Promise<{ id: string; htmlLink: string }> {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  const event = {
    summary: input.title,
    description: input.description || "",
    start: {
      dateTime: input.startDateTime,
      timeZone: input.timeZone || "America/New_York",
    },
    end: {
      dateTime: input.endDateTime,
      timeZone: input.timeZone || "America/New_York",
    },
    location: input.location,
  };

  try {
    const response = await calendar.events.insert({
      calendarId: "primary",
      requestBody: event,
    });

    return {
      id: response.data.id || "",
      htmlLink: response.data.htmlLink || "",
    };
  } catch (error: any) {
    throw new Error(`Failed to create calendar event: ${error.message}`);
  }
}

export const createCalendarEventTool = {
  description: "Create a new event in the user's Google Calendar. Requires authentication and proper date/time formatting.",
  parameters: createCalendarEventSchema,
  execute: createCalendarEvent,
};

