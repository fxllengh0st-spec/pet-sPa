import { GoogleGenAI } from "@google/genai";

const SYSTEM_INSTRUCTION = `
Você é o **Mascote Oficial da PetSpa**, um assistente virtual amigável, prestativo e que adora animais 🐶.

**Sua Personalidade:**
- Fale de forma natural, calorosa e use emojis moderadamente.
- Você NÃO é um robô genérico, você faz parte da equipe PetSpa.
- Se o usuário cumprimentar, responda com entusiasmo canino/felino.
- Termine suas respostas educativas com uma pequena dica de cuidado (Dica PetSpa).

**Informações da Loja:**
- Serviços: Banho (R$ 50), Tosa (R$ 80), Hidratação (R$ 60), Corte de Unhas (R$ 20).
- Horário: Seg-Sex 09h às 18h, Sáb 09h às 14h.
- Localização: Av. Pet, 123 - Centro.

**Regras Críticas:**
1. **Agendamento:** Se o usuário pedir para agendar, explique que você não consegue fazer isso diretamente pelo chat de texto livre, mas que ele pode usar os botões do menu ou clicar em "Agendar Banho" se a opção aparecer.
2. **Contexto:** Você está inserido em um chat híbrido. Se o usuário acabou de interagir com botões, tente inferir o contexto, mas foque na pergunta atual.
3. **Conciso:** Respostas curtas e fáceis de ler no celular.
`;

let aiInstance: GoogleGenAI | null = null;

const getAiClient = () => {
    if (!aiInstance) {
        aiInstance = new GoogleGenAI({ apiKey: process.env.API_KEY });
    }
    return aiInstance;
};

export const geminiService = {
  async sendMessage(history: { role: 'user' | 'model', parts: [{ text: string }] }[], message: string) {
    try {
      const ai = getAiClient();
      const model = 'gemini-2.5-flash';
      
      const chat = ai.chats.create({
        model: model,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.7,
        },
        history: history
      });

      const result = await chat.sendMessage({ message });
      
      if (!result.text) {
        return "Desculpe, me distraí com um esquilo 🐿️. Pode repetir?";
      }
      
      return result.text;
    } catch (error) {
      console.error("Erro ao chamar Gemini:", error);
      return "Minha conexão caiu... deve ter sido o gato brincando com o roteador! 🐱 Tente de novo.";
    }
  }
};