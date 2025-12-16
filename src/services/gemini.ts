
// SERVICE DEPRECATED
// This file is no longer used. The Chat now uses src/services/bot-engine.ts
// for a deterministic, rule-based approach.

export const geminiService = {
  async sendMessage() {
    console.warn("Gemini Service is deprecated. Use BotEngine.");
    return { text: "Sistema em manutenção.", refreshRequired: false };
  }
};
