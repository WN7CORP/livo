import { GoogleGenAI, Type } from "@google/genai";
import { BookData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to convert File to Base64
const fileToGenerativePart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(',')[1];
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const extractBookFromPdf = async (
  bookFile: File, 
  onLog: (message: string) => void = () => {},
  onProgress: (percent: number) => void = () => {}
): Promise<BookData> => {
  let progressInterval: any;

  try {
    onProgress(5);
    onLog(`[Início] Iniciando processamento do livro: ${bookFile.name}`);
    
    // Passo 1: Leitura Arquivo
    onProgress(10);
    onLog(`[Leitura] Carregando arquivo (${(bookFile.size / 1024 / 1024).toFixed(2)} MB)...`);
    const bookPart = await fileToGenerativePart(bookFile);
    onProgress(25);
    onLog("[Leitura] PDF convertido para processamento.");

    // Passo 2: Montagem do Prompt
    onLog(`[IA] Configurando prompt de formatação mobile...`);
    
    const prompt = `
      Você é um especialista em editoração de livros digitais e acessibilidade.
      Analise o arquivo PDF fornecido (que é um livro completo ou capítulos de um livro).

      TAREFA:
      1. Extraia o Título do Livro.
      2. Estime a quantidade de páginas (baseado no conteúdo ou metadados).
      3. Liste os Títulos dos Capítulos encontrados.
      4. Extraia TODO o conteúdo textual do livro e realize a FORMATAÇÃO PARA MOBILE.

      REGRAS DE FORMATAÇÃO (Mobile Friendly):
      - Quebre parágrafos longos em parágrafos menores para facilitar a leitura em telas pequenas.
      - Use Markdown.
      - Títulos de capítulos devem ser H2 (## Título).
      - Subtítulos devem ser H3 (### Subtítulo).
      - Citações devem usar blockquote (> texto).
      - Listas devem ser formatadas corretamente.
      - Remova cabeçalhos e rodapés repetitivos de páginas (ex: número da página, nome do autor no topo).
      - Mantenha a integridade do texto original, apenas altere a formatação visual/estrutural.

      Retorne APENAS um JSON válido com a estrutura solicitada.
    `;

    // Passo 3: Envio para IA
    onProgress(30);
    onLog("[IA] Enviando livro para análise e formatação (Gemini 2.5 Flash)...");
    
    // Simular progresso durante o tempo de espera da IA (30% -> 90%)
    let currentFakeProgress = 30;
    progressInterval = setInterval(() => {
      if (currentFakeProgress < 90) {
        currentFakeProgress += Math.floor(Math.random() * 2) + 1;
        onProgress(currentFakeProgress);
        if (currentFakeProgress % 15 === 0) {
            onLog(`[IA] Formatando conteúdo e estruturando capítulos... (${currentFakeProgress}%)`);
        }
      }
    }, 1500);

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          bookPart,
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Título principal do livro" },
            pageCount: { type: Type.STRING, description: "Número estimado de páginas (ex: '150')" },
            chapters: { type: Type.STRING, description: "Lista de capítulos separados por vírgula (ex: 'Intro, Cap 1, Cap 2')" },
            content: { type: Type.STRING, description: "O conteúdo completo do livro formatado em Markdown/HTML para mobile." },
          },
          required: ["title", "pageCount", "chapters", "content"],
        },
      },
    });

    clearInterval(progressInterval);
    onProgress(95);
    onLog("[IA] Resposta recebida! Finalizando estruturação...");

    const resultText = response.text;
    if (!resultText) {
      throw new Error("O modelo não retornou nenhum texto.");
    }

    const data = JSON.parse(resultText) as BookData;
    
    onProgress(100);
    onLog(`[Sucesso] Livro '${data.title}' processado com sucesso.`);
    
    return data;

  } catch (error: any) {
    if (progressInterval) clearInterval(progressInterval);
    onLog(`[ERRO] ${error.message}`);
    console.error("Erro ao extrair livro:", error);
    throw error;
  }
};