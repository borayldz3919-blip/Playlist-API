const songSchema = {
  type: "object",
  properties: {
    id: { type: "integer", example: 1 },
    position: { type: "integer", example: 1, description: "Playlist içindeki sıra (1'den başlar)" },
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
      "SE4458 Assignment 2 – Group 2 (Playlist). Şarkı ekleme, düzenleme, silme, arama, sıralama, tür filtresi, favorileme ve playlist içi sıralama (drag & drop karşılığı) sağlayan REST API. Veriler bellekte tutulur, sunucu yeniden başlayınca başlangıç verisine döner.",
  },
  tags: [
    { name: "Songs", description: "Şarkı işlemleri" },
    { name: "Playlist", description: "Playlist özeti ve türler" },
    { name: "System", description: "Sağlık kontrolü" },
  ],
  paths: {
    "/songs": {
      get: {
        tags: ["Songs"],
        summary: "Şarkıları listele (arama, tür filtresi, sıralama, sayfalama)",
        parameters: [
          { name: "search", in: "query", schema: { type: "string" }, description: "Başlık, sanatçı veya albümde arar (büyük/küçük harf duyarsız)", example: "weeknd" },
          { name: "genre", in: "query", schema: { type: "string" }, description: "Türe göre filtre", example: "Pop" },
          { name: "favorite", in: "query", schema: { type: "boolean" }, description: "true ise sadece favoriler" },
          { name: "sortBy", in: "query", schema: { type: "string", enum: ["position", "title", "artist", "duration"], default: "position" } },
          { name: "order", in: "query", schema: { type: "string", enum: ["asc", "desc"], default: "asc" } },
          { name: "page", in: "query", schema: { type: "integer", default: 1, minimum: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20, minimum: 1, maximum: 100 } },
        ],
        responses: {
          200: {
            description: "Şarkı listesi",
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
          400: errorRes("Geçersiz sorgu parametresi"),
        },
      },
      post: {
        tags: ["Songs"],
        summary: "Yeni şarkı ekle",
        requestBody: { required: true, content: { "application/json": { schema: songInput(["title", "artist", "durationSeconds"]) } } },
        responses: {
          201: { description: "Oluşturuldu", content: { "application/json": { schema: { $ref: "#/components/schemas/Song" } } } },
          400: errorRes("Doğrulama hatası"),
        },
      },
    },
    "/songs/{id}": {
      get: {
        tags: ["Songs"],
        summary: "Tek şarkıyı getir",
        parameters: [idParam],
        responses: {
          200: { description: "Şarkı", content: { "application/json": { schema: { $ref: "#/components/schemas/Song" } } } },
          404: errorRes("Şarkı bulunamadı"),
        },
      },
      put: {
        tags: ["Songs"],
        summary: "Şarkıyı tamamen güncelle (title, artist, durationSeconds zorunlu)",
        parameters: [idParam],
        requestBody: { required: true, content: { "application/json": { schema: songInput(["title", "artist", "durationSeconds"]) } } },
        responses: {
          200: { description: "Güncellendi", content: { "application/json": { schema: { $ref: "#/components/schemas/Song" } } } },
          400: errorRes("Doğrulama hatası"),
          404: errorRes("Şarkı bulunamadı"),
        },
      },
      patch: {
        tags: ["Songs"],
        summary: "Şarkıyı kısmen güncelle (sadece gönderilen alanlar değişir)",
        parameters: [idParam],
        requestBody: { required: true, content: { "application/json": { schema: songInput([]) } } },
        responses: {
          200: { description: "Güncellendi", content: { "application/json": { schema: { $ref: "#/components/schemas/Song" } } } },
          400: errorRes("Doğrulama hatası"),
          404: errorRes("Şarkı bulunamadı"),
        },
      },
      delete: {
        tags: ["Songs"],
        summary: "Şarkıyı playlist'ten sil",
        parameters: [idParam],
        responses: {
          200: { description: "Silindi", content: { "application/json": { schema: { type: "object", properties: { message: { type: "string" }, deleted: { $ref: "#/components/schemas/Song" } } } } } },
          404: errorRes("Şarkı bulunamadı"),
        },
      },
    },
    "/songs/{id}/favorite": {
      patch: {
        tags: ["Songs"],
        summary: "Favori durumunu değiştir (toggle) veya body ile belirle",
        description: "Body göndermezseniz mevcut değerin tersi atanır. {\"favorite\": true} gönderirseniz o değer atanır.",
        parameters: [idParam],
        requestBody: { required: false, content: { "application/json": { schema: { type: "object", properties: { favorite: { type: "boolean" } } } } } },
        responses: {
          200: { description: "Güncellendi", content: { "application/json": { schema: { $ref: "#/components/schemas/Song" } } } },
          400: errorRes("favorite boolean olmalı"),
          404: errorRes("Şarkı bulunamadı"),
        },
      },
    },
    "/songs/{id}/move": {
      patch: {
        tags: ["Songs"],
        summary: "Şarkıyı playlist içinde başka bir sıraya taşı (drag & drop)",
        parameters: [idParam],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object", required: ["position"], properties: { position: { type: "integer", minimum: 1, example: 3 } } } } },
        },
        responses: {
          200: { description: "Taşındı; güncel sıralı liste döner", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Song" } } } } },
          400: errorRes("Geçersiz pozisyon"),
          404: errorRes("Şarkı bulunamadı"),
        },
      },
    },
    "/playlist/summary": {
      get: {
        tags: ["Playlist"],
        summary: "Şarkı sayısı ve toplam süre (\"5 songs • 17 min 26 sec\")",
        responses: {
          200: {
            description: "Özet",
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
    "/genres": {
      get: {
        tags: ["Playlist"],
        summary: "Playlist'teki türler ve şarkı sayıları (\"All Genres\" filtresi için)",
        responses: {
          200: { description: "Türler", content: { "application/json": { schema: { type: "array", items: { type: "object", properties: { genre: { type: "string", example: "Pop" }, count: { type: "integer", example: 4 } } } } } } },
        },
      },
    },
    "/health": {
      get: {
        tags: ["System"],
        summary: "Servis ayakta mı?",
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
