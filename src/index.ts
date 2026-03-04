import express from "express";
import dotenv from "dotenv";
import { qdrant, createCollection, COLLECTION_NAME } from "./qdrant";
import { generateEmbedding } from "./embedding";
import { openai } from "./openai";

const app = express();
app.use(express.json());

dotenv.config();

app.get("/ping", (req, res) => {
  res.json({ ok: true });
});

app.post("/ask", async (req, res) => {
  try {
    const { pergunta } = req.body;

    if (!pergunta) {
      return res.status(400).json({ error: "Pergunta é obrigatória" });
    }

    const embedding = await generateEmbedding(pergunta);

    const searchResult = await qdrant.search(COLLECTION_NAME, {
      vector: embedding,
      limit: 3,
    });

    const context = searchResult
      .map((item) => item.payload?.content)
      .join("\n\n---\n\n");

    const prompt = `
      Você é um assistente que responde apenas com base na documentação abaixo.

      DOCUMENTAÇÃO:
      ${context}

      PERGUNTA:
      ${pergunta}

      Responda de forma clara e objetiva.
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.2,
    });

    const resposta =
      completion.choices &&
      completion.choices[0] &&
      completion.choices[0].message &&
      typeof completion.choices[0].message.content === "string"
        ? completion.choices[0].message.content
        : "Não foi possível obter uma resposta.";

    res.json({
      resposta,
      fontes: searchResult,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro interno" });
  }
});

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