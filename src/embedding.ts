import { pipeline } from "@xenova/transformers";

let embedder: any;

export async function loadModel() {
  if (!embedder) {
    console.log("Carregando modelo de embeddings...");
    embedder = await pipeline(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2"
    );
    console.log("Modelo carregado 🚀");
  }
}

export async function generateEmbedding(text: string): Promise<number[]> {
  if (!embedder) {
    await loadModel();
  }

  const result = await embedder(text, {
    pooling: "mean",
    normalize: true,
  });

  return Array.from(result.data);
}