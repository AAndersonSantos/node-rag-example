import { QdrantClient } from "@qdrant/js-client-rest";

export const qdrant = new QdrantClient({
  url: process.env.QDRANT_URL || "http://localhost:6333"
});

export const COLLECTION_NAME = "test_collection";

export async function createCollection() {
  const collections = await qdrant.getCollections();

  const exists = collections.collections.find(
    (c) => c.name === COLLECTION_NAME
  );

  if (!exists) {
    await qdrant.createCollection(COLLECTION_NAME, {
      vectors: {
        size: 384,
        distance: "Cosine"
      }
    });

    console.log("Collection criada 🚀");
  }
}