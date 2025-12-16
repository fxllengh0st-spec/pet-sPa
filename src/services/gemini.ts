import { GoogleGenAI, Content, Part, FunctionDeclaration, Type } from "@google/genai";
import { api } from "./api";

const SYSTEM_INSTRUCTION = `
Você é o **Assistente IA Oficial da PetSpa**.
Seu objetivo é **REALIZAR AÇÕES** para o cliente.

**REGRA DE OURO (IMPORTANTE):**
NUNCA diga para o usuário "acessar a página tal". VOCÊ deve fazer o trabalho.
Se o usuário quer cadastrar um pet, PERGUNTE os dados e use a ferramenta \`create_pet\`.
Se quer agendar, PERGUNTE os dados e use \`create_appointment\`.

**Seu Fluxo de Trabalho:**
1. O usuário pede algo (ex: "Quero agendar").
2. Você verifica se tem todos os dados (Qual pet? Qual serviço? Qual horário?).
3. Se faltar dados, **PERGUNTE** ao usuário.
4. Quando tiver os dados, CHAME A FERRAMENTA (Tool).
5. Confirme o sucesso e seja cordial.

**Suas Ferramentas (Tools):**
- \`list_my_pets\`: Consulta pets do usuário.
- \`list_services\`: Consulta catálogo de serviços.
- \`create_pet\`: Cadastra pet. Args: userId, name, breed (opcional), weight (opcional).
- \`create_appointment\`: Cria agendamento. Args: userId, petId, serviceId, dateTimeIso.
`;

const toolsDef = [
  {
    functionDeclarations: [
      {
        name: "list_services",
        description: "Lista todos os serviços disponíveis (Banho, Tosa, etc), preços e IDs.",
      },
      {
        name: "list_my_pets",
        description: "Lista os pets cadastrados do usuário atual.",
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
            breed: { type: Type.STRING, description: "Raça do pet" },
            weight: { type: Type.NUMBER, description: "Peso aproximado" },
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
            petId: { type: Type.STRING, description: "ID do pet" },
            serviceId: { type: Type.NUMBER, description: "ID do serviço" },
            dateTimeIso: { type: Type.STRING, description: "Data e hora ISO 8601 (ex: 2024-12-25T14:00:00)" }
          },
          required: ["userId", "petId", "serviceId", "dateTimeIso"]
        }
      }
    ]
  }
];

// Interface interna para resposta da Tool
interface ToolExecutionResult {
    result: any;
    refreshRequired: boolean; // Flag para indicar se o App deve recarregar dados
}

async function executeFunction(name: string, args: any): Promise<ToolExecutionResult> {
  console.log(`[Gemini Tool] Executing ${name}`, args);
  try {
    switch (name) {
      case "list_services":
        const services = await api.booking.getServices();
        return { 
            result: services.map(s => ({ id: s.id, name: s.name, price: s.price, duration: s.duration_minutes })),
            refreshRequired: false
        };

      case "list_my_pets":
        if (!args.userId) return { result: { error: "Usuário não identificado." }, refreshRequired: false };
        const pets = await api.booking.getMyPets(args.userId);
        return { 
            result: pets.map(p => ({ id: p.id, name: p.name, breed: p.breed })),
            refreshRequired: false
        };

      case "create_pet":
        await api.booking.createPet(args.userId, { 
          name: args.name, 
          breed: args.breed, 
          weight: args.weight 
        });
        return { 
            result: { success: true, message: `Pet ${args.name} cadastrado com sucesso!` },
            refreshRequired: true // MUDANÇA DE ESTADO
        };

      case "create_appointment":
        // Verifica duração para calcular fim
        const serviceList = await api.booking.getServices();
        const service = serviceList.find(s => s.id === args.serviceId);
        const duration = service ? service.duration_minutes : 60;
        
        const start = new Date(args.dateTimeIso);
        const end = new Date(start.getTime() + duration * 60000);
        
        // Verifica disponibilidade antes de agendar (Camada de segurança extra na IA)
        const isAvailable = await api.booking.checkAvailability(start.toISOString(), end.toISOString());
        if (!isAvailable) {
            return {
                result: { error: "Horário indisponível. Peça para o usuário escolher outro horário." },
                refreshRequired: false
            };
        }

        await api.booking.createAppointment(args.userId, args.petId, args.serviceId, start.toISOString(), end.toISOString());
        return { 
            result: { success: true, message: "Agendamento realizado!", details: { service: service?.name, start: start.toLocaleString() } },
            refreshRequired: true // MUDANÇA DE ESTADO
        };

      default:
        return { result: { error: "Função desconhecida" }, refreshRequired: false };
    }
  } catch (e: any) {
    console.error("Tool Execution Error", e);
    return { result: { error: e.message || "Erro ao executar ação." }, refreshRequired: false };
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
   * Retorna objeto com texto e flag de refresh
   */
  async sendMessage(
      history: { role: 'user' | 'model', parts: [{ text: string }] }[], 
      message: string,
      userId?: string
  ): Promise<{ text: string, refreshRequired: boolean }> {
    
    const ai = getAiClient();
    const modelId = 'gemini-2.5-flash'; 
    
    const chatHistory: Content[] = history.map(h => ({
      role: h.role,
      parts: h.parts as Part[]
    }));

    const chat = ai.chats.create({
      model: modelId,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
        tools: toolsDef, 
      },
      history: chatHistory
    });

    let msgToSend = message;
    if (userId) {
      msgToSend += ` [System Context: Current User ID is "${userId}"]`;
    }

    let result = await chat.sendMessage({ message: msgToSend });
    
    let shouldRefreshApp = false;
    let maxTurns = 5; 
    
    // Function Call Loop
    while (result.functionCalls && result.functionCalls.length > 0 && maxTurns > 0) {
        maxTurns--;
        const call = result.functionCalls[0];
        
        // Execute tool and capture refresh flag
        const { result: funcResult, refreshRequired } = await executeFunction(call.name, call.args);
        
        if (refreshRequired) shouldRefreshApp = true;
        
        // Send result back to model
        result = await chat.sendMessage({
          message: [{
            functionResponse: {
              name: call.name,
              response: { result: funcResult }
            }
          }]
        });
    }

    return {
        text: result.text || "Desculpe, processei a ação mas fiquei sem palavras!",
        refreshRequired: shouldRefreshApp
    };
  }
};