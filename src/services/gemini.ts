import { GoogleGenAI, Content, Part, FunctionDeclaration, Type } from "@google/genai";
import { api } from "./api";
import { toLocalISOString } from "../utils/ui";

const SYSTEM_INSTRUCTION = `
Você é o **Assistente IA Oficial da PetSpa**.
Seu objetivo é **REALIZAR AÇÕES** para o cliente.

**REGRA DE OURO (IMPORTANTE):**
NUNCA, em hipótese alguma, diga para o usuário "acessar a página tal" ou "ir no menu tal".
VOCÊ deve fazer o trabalho. Se o usuário quer cadastrar um pet, PERGUNTE os dados e use a ferramenta \`create_pet\`. Se quer agendar, PERGUNTE os dados e use \`create_appointment\`.

**Seu Fluxo de Trabalho:**
1. O usuário pede algo (ex: "Quero agendar").
2. Você verifica se tem todos os dados (Qual pet? Qual serviço? Qual horário?).
3. Se faltar dados, **PERGUNTE** ao usuário (ex: "Para qual pet seria o agendamento?").
4. Quando tiver os dados, CHAME A FERRAMENTA (Tool).
5. Confirme o sucesso.

**Suas Ferramentas (Tools):**
- \`list_my_pets\`: Use para saber os nomes e IDs dos pets do usuário.
- \`list_services\`: Use para ver preços e IDs dos serviços (Banho, Tosa, etc).
- \`create_pet\`: Cadastra um pet. Argumentos: userId, name, breed (opcional), weight (opcional).
- \`create_appointment\`: Cria agendamento. Argumentos: userId, petId, serviceId, dateTimeIso.

**Tom de Voz:**
- Proativo: "Posso agendar para você, qual o nome do pet?"
- Nunca dê desculpas de "não consigo acessar". Se a tool falhar, diga que houve um erro técnico, mas tente novamente.
`;

// --- Tool Definitions ---

const toolsDef = [
  {
    functionDeclarations: [
      {
        name: "list_services",
        description: "Lista todos os serviços disponíveis (Banho, Tosa, etc), seus preços e IDs.",
      },
      {
        name: "list_my_pets",
        description: "Lista os pets cadastrados do usuário atual para encontrar seus nomes e IDs.",
        parameters: {
          type: Type.OBJECT,
          properties: {
             userId: { type: Type.STRING, description: "O ID do usuário logado." }
          },
          required: ["userId"]
        }
      },
      {
        name: "create_pet",
        description: "Cadastra um novo pet no sistema.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            userId: { type: Type.STRING, description: "ID do dono do pet" },
            name: { type: Type.STRING, description: "Nome do pet" },
            breed: { type: Type.STRING, description: "Raça do pet (opcional)" },
            weight: { type: Type.NUMBER, description: "Peso aproximado (opcional)" },
          },
          required: ["userId", "name"]
        }
      },
      {
        name: "create_appointment",
        description: "Cria um agendamento de serviço.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            userId: { type: Type.STRING, description: "ID do usuário" },
            petId: { type: Type.STRING, description: "ID do pet (obtido via list_my_pets)" },
            serviceId: { type: Type.NUMBER, description: "ID do serviço (obtido via list_services)" },
            dateTimeIso: { type: Type.STRING, description: "Data e hora no formato ISO 8601 (ex: 2024-12-25T14:00:00)" }
          },
          required: ["userId", "petId", "serviceId", "dateTimeIso"]
        }
      }
    ]
  }
];

// --- Execution Logic ---

async function executeFunction(name: string, args: any): Promise<any> {
  console.log(`[Gemini Tool] Executing ${name}`, args);
  try {
    switch (name) {
      case "list_services":
        const services = await api.booking.getServices();
        return services.map(s => ({ id: s.id, name: s.name, price: s.price, duration: s.duration_minutes }));

      case "list_my_pets":
        if (!args.userId) return { error: "Usuário não identificado." };
        const pets = await api.booking.getMyPets(args.userId);
        return pets.map(p => ({ id: p.id, name: p.name, breed: p.breed }));

      case "create_pet":
        await api.booking.createPet(args.userId, { 
          name: args.name, 
          breed: args.breed, 
          weight: args.weight 
        });
        return { success: true, message: `Pet ${args.name} cadastrado com sucesso!` };

      case "create_appointment":
        // Calculate end time based on service duration (default 60 min if service fetch fails logic here, but simpler for AI)
        // For robustness, we re-fetch service to get duration
        const serviceList = await api.booking.getServices();
        const service = serviceList.find(s => s.id === args.serviceId);
        const duration = service ? service.duration_minutes : 60;
        
        const start = new Date(args.dateTimeIso);
        const end = new Date(start.getTime() + duration * 60000);
        
        await api.booking.createAppointment(args.userId, args.petId, args.serviceId, start.toISOString(), end.toISOString());
        return { success: true, message: "Agendamento realizado!", details: { service: service?.name, start: start.toLocaleString() } };

      default:
        return { error: "Função desconhecida" };
    }
  } catch (e: any) {
    console.error("Tool Execution Error", e);
    return { error: e.message || "Erro ao executar ação." };
  }
}

let aiInstance: GoogleGenAI | null = null;

const getAiClient = () => {
    if (!aiInstance) {
        aiInstance = new GoogleGenAI({ apiKey: process.env.API_KEY });
    }
    return aiInstance;
};

export const geminiService = {
  /**
   * Main entry point for Chat interaction
   */
  async sendMessage(
      history: { role: 'user' | 'model', parts: [{ text: string }] }[], 
      message: string,
      userId?: string
  ) {
    // Removed the internal try-catch to allow the error to propagate to the Chat component.
    // This allows the Chat component to activate the "Backup Brain".
    
    const ai = getAiClient();
    const modelId = 'gemini-2.5-flash';
    
    // Prepare history
    const chatHistory: Content[] = history.map(h => ({
      role: h.role,
      parts: h.parts as Part[]
    }));

    // Initialize Chat with Tools
    const chat = ai.chats.create({
      model: modelId,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
        tools: toolsDef, 
      },
      history: chatHistory
    });

    // 1. Send user message
    // We append userId to the context implicitly if available, so the model knows it for tool calls
    let msgToSend = message;
    if (userId) {
      msgToSend += ` [System Context: Current User ID is "${userId}"]`;
    }

    let result = await chat.sendMessage({ message: msgToSend });
    
    // 2. Loop for Function Calls (Multi-turn tool use)
    // The model might want to call multiple tools or call a tool and then speak.
    // We loop while there are function calls.
    
    // We limit loops to avoid infinite recursion
    let maxTurns = 5; 
    
    while (result.functionCalls && result.functionCalls.length > 0 && maxTurns > 0) {
        maxTurns--;
        const call = result.functionCalls[0]; // Handle one call at a time for simplicity (or iterate all)
        
        // Execute tool
        const functionResponse = await executeFunction(call.name, call.args);
        
        // Send result back to model
        result = await chat.sendMessage({
          message: [{
            functionResponse: {
              name: call.name,
              response: { result: functionResponse }
            }
          }]
        });
    }

    // 3. Final Text Response
    return result.text || "Desculpe, processei a ação mas fiquei sem palavras!";
  }
};