import express from "express";
import dotenv from "dotenv";
import { qdrant, createCollection, COLLECTION_NAME } from "./qdrant";
import { generateEmbedding } from "./embedding";

const app = express();
app.use(express.json());

dotenv.config();

app.post("/insert", async (req, res) => {
  const { id, texto } = req.body;

  const vector = await generateEmbedding(texto);

  await qdrant.upsert(COLLECTION_NAME, {
    points: [
      {
        id,
        vector,
        payload: { texto }
      }
    ]
  });

  res.json({ message: "Inserido com sucesso" });
});

app.post("/search", async (req, res) => {
  const { texto } = req.body;

  const vector = await generateEmbedding(texto);

  const result = await qdrant.search(COLLECTION_NAME, {
    vector,
    limit: 3
  });

  res.json(result);
});

async function start() {
  await createCollection();

  app.listen(3000, () => {
    console.log("Servidor rodando na porta 3000 🚀");
  });
}

start();