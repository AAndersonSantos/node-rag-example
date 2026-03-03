// src/seed.ts

import fs from "fs";
import path from "path";
import { generateEmbedding } from "../embedding";
import { qdrant, COLLECTION_NAME } from "../qdrant";
import { chunkBySections } from "../chunker";
import { v4 as uuidv4 } from "uuid";

const DOCUMENT_ID = "tela_sentimentos_v1";

const filePath = path.resolve(
  process.cwd(),
  "src/documents/tela_sentimentos.md"
);

const fullText = fs.readFileSync(filePath, "utf-8");


async function seed() {
  const chunks = chunkBySections(fullText);

  console.log(`Total de chunks: ${chunks.length}`);

  const points = [];

  for (const [i, chunk] of chunks.entries()) {
    const chunk = chunks[i];

    if (!chunk) continue;

    const vector = await generateEmbedding(chunk);

    points.push({
      id: uuidv4(),
      vector,
      payload: {
        document_id: DOCUMENT_ID,
        chunk_index: i,
        content: chunk,
        tipo: "documentacao_sentimentos"
      }
    });

    console.log(`Chunk ${i} processado`);
  }

  await qdrant.upsert(COLLECTION_NAME, {
    points
  });

  console.log("Documento inserido com sucesso 🚀");
}

seed();