const songSchema = {
  type: "object",
  properties: {
    id: { type: "integer", example: 1 },
    position: { type: "integer", example: 1, description: "Position in the playlist (starts at 1)" },
    title: { type: "string", example: "Blinding Lights" },
    artist: { type: "string", example: "The Weeknd" },
    album: { type: "string", example: "After Hours" },
    durationSeconds: { type: "integer", example: 212 },
    duration: { type: "string", example: "3:32" },
    genre: { type: "string", example: "Pop" },
    favorite: { type: "boolean", example: true },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
  },
};

const songInput = (required) => ({
  type: "object",
  required,
  properties: {
    title: { type: "string", example: "Blinding Lights" },
    artist: { type: "string", example: "The Weeknd" },
    album: { type: "string", example: "After Hours" },
    durationSeconds: { type: "integer", minimum: 1, example: 212 },
    genre: { type: "string", example: "Pop" },
    favorite: { type: "boolean", example: false },
  },
});

const idParam = {
  name: "id", in: "path", required: true, schema: { type: "integer" }, example: 1,
};

const errorRes = (description) => ({
  description,
  content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
});

module.exports = {
  openapi: "3.0.3",
  info: {
    title: "Playlist API",
    version: "1.0.0",
    description:
      "SE4458 Assignment 2 – Group 2 (Playlist). A REST API to add, edit, delete, search, sort, filter by genre, favorite and reorder songs (drag & drop equivalent). Data is stored in memory and resets to the seed songs when the server restarts.",
  },
  tags: [
    { name: "Songs", description: "Song operations" },
    { name: "Playlist", description: "Playlist summary and genres" },
    { name: "System", description: "Health check" },
  ],
  paths: {
    "/songs": {
      get: {
        tags: ["Songs"],
        summary: "List songs (search, genre filter, sorting, pagination)",
        parameters: [
          { name: "search", in: "query", schema: { type: "string" }, description: "Searches title, artist and album (case-insensitive)", example: "weeknd" },
          { name: "genre", in: "query", schema: { type: "string" }, description: "Filter by genre", example: "Pop" },
          { name: "favorite", in: "query", schema: { type: "boolean" }, description: "If true, returns only favorite songs" },
          { name: "minDuration", in: "query", schema: { type: "integer", minimum: 0 }, description: "Minimum duration in seconds", example: 180 },
          { name: "maxDuration", in: "query", schema: { type: "integer", minimum: 0 }, description: "Maximum duration in seconds", example: 240 },
          { name: "sortBy", in: "query", schema: { type: "string", enum: ["position", "title", "artist", "duration"], default: "position" } },
          { name: "order", in: "query", schema: { type: "string", enum: ["asc", "desc"], default: "asc" } },
          { name: "page", in: "query", schema: { type: "integer", default: 1, minimum: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20, minimum: 1, maximum: 100 } },
        ],
        responses: {
          200: {
            description: "List of songs",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { type: "array", items: { $ref: "#/components/schemas/Song" } },
                    meta: {
                      type: "object",
                      properties: {
                        total: { type: "integer" },
                        page: { type: "integer" },
                        limit: { type: "integer" },
                        totalPages: { type: "integer" },
                      },
                    },
                  },
                },
              },
            },
          },
          400: errorRes("Invalid query parameter"),
        },
      },
      post: {
        tags: ["Songs"],
        summary: "Add a new song (duplicate title + artist is rejected with 409)",
        requestBody: { required: true, content: { "application/json": { schema: songInput(["title", "artist", "durationSeconds"]) } } },
        responses: {
          201: { description: "Created", content: { "application/json": { schema: { $ref: "#/components/schemas/Song" } } } },
          400: errorRes("Validation error"),
          409: errorRes("A song with the same title and artist already exists"),
        },
      },
    },
    "/songs/{id}": {
      get: {
        tags: ["Songs"],
        summary: "Get a single song",
        parameters: [idParam],
        responses: {
          200: { description: "Song", content: { "application/json": { schema: { $ref: "#/components/schemas/Song" } } } },
          404: errorRes("Song not found"),
        },
      },
      put: {
        tags: ["Songs"],
        summary: "Replace a song (title, artist, durationSeconds are required)",
        parameters: [idParam],
        requestBody: { required: true, content: { "application/json": { schema: songInput(["title", "artist", "durationSeconds"]) } } },
        responses: {
          200: { description: "Updated", content: { "application/json": { schema: { $ref: "#/components/schemas/Song" } } } },
          400: errorRes("Validation error"),
          404: errorRes("Song not found"),
          409: errorRes("A song with the same title and artist already exists"),
        },
      },
      patch: {
        tags: ["Songs"],
        summary: "Partially update a song (only the sent fields change)",
        parameters: [idParam],
        requestBody: { required: true, content: { "application/json": { schema: songInput([]) } } },
        responses: {
          200: { description: "Updated", content: { "application/json": { schema: { $ref: "#/components/schemas/Song" } } } },
          400: errorRes("Validation error"),
          404: errorRes("Song not found"),
          409: errorRes("A song with the same title and artist already exists"),
        },
      },
      delete: {
        tags: ["Songs"],
        summary: "Remove a song from the playlist",
        parameters: [idParam],
        responses: {
          200: { description: "Deleted", content: { "application/json": { schema: { type: "object", properties: { message: { type: "string" }, deleted: { $ref: "#/components/schemas/Song" } } } } } },
          404: errorRes("Song not found"),
        },
      },
    },
    "/songs/{id}/favorite": {
      patch: {
        tags: ["Songs"],
        summary: "Toggle favorite status, or set it explicitly",
        description: "If no body is sent, the current value is flipped. If {\"favorite\": true} is sent, that value is set.",
        parameters: [idParam],
        requestBody: { required: false, content: { "application/json": { schema: { type: "object", properties: { favorite: { type: "boolean" } } } } } },
        responses: {
          200: { description: "Updated", content: { "application/json": { schema: { $ref: "#/components/schemas/Song" } } } },
          400: errorRes("favorite must be a boolean"),
          404: errorRes("Song not found"),
        },
      },
    },
    "/songs/{id}/move": {
      patch: {
        tags: ["Songs"],
        summary: "Move a song to another position in the playlist (drag & drop)",
        parameters: [idParam],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object", required: ["position"], properties: { position: { type: "integer", minimum: 1, example: 3 } } } } },
        },
        responses: {
          200: { description: "Moved; returns the updated ordered list", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Song" } } } } },
          400: errorRes("Invalid position"),
          404: errorRes("Song not found"),
        },
      },
    },
    "/playlist/summary": {
      get: {
        tags: ["Playlist"],
        summary: "Song count and total duration (\"5 songs • 17 min 26 sec\")",
        responses: {
          200: {
            description: "Summary",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    songCount: { type: "integer", example: 5 },
                    totalDurationSeconds: { type: "integer", example: 1046 },
                    totalDuration: { type: "string", example: "17 min 26 sec" },
                    favoriteCount: { type: "integer", example: 3 },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/playlist/stats": {
      get: {
        tags: ["Playlist"],
        summary: "Playlist statistics: average, longest and shortest song, top artist, genre distribution",
        responses: {
          200: {
            description: "Statistics",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    songCount: { type: "integer", example: 5 },
                    totalDurationSeconds: { type: "integer", example: 1046 },
                    averageDurationSeconds: { type: "integer", example: 209 },
                    averageDuration: { type: "string", example: "3:29" },
                    longestSong: { $ref: "#/components/schemas/Song" },
                    shortestSong: { $ref: "#/components/schemas/Song" },
                    topArtist: { type: "object", properties: { artist: { type: "string", example: "The Weeknd" }, songCount: { type: "integer", example: 2 } } },
                    genreDistribution: {
                      type: "array",
                      items: { type: "object", properties: { genre: { type: "string", example: "Pop" }, count: { type: "integer", example: 4 }, percentage: { type: "number", example: 80 } } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/genres": {
      get: {
        tags: ["Playlist"],
        summary: "Genres in the playlist with song counts (for the \"All Genres\" filter)",
        responses: {
          200: { description: "Genres", content: { "application/json": { schema: { type: "array", items: { type: "object", properties: { genre: { type: "string", example: "Pop" }, count: { type: "integer", example: 4 } } } } } } },
        },
      },
    },
    "/health": {
      get: {
        tags: ["System"],
        summary: "Is the service up?",
        responses: { 200: { description: "OK" } },
      },
    },
  },
  components: {
    schemas: {
      Song: songSchema,
      Error: {
        type: "object",
        properties: {
          error: { type: "string", example: "Validation failed" },
          details: { type: "array", items: { type: "string" }, example: ["title is required"] },
        },
      },
    },
  },
};
