
import { api } from './api';
import { Pet, Service } from '../types';

// --- TYPES ---

export type BotState = 
  | 'START'
  | 'MAIN_MENU'
  | 'BOOKING_SELECT_PET'
  | 'BOOKING_SELECT_SERVICE'
  | 'BOOKING_SELECT_DATE'
  | 'BOOKING_SELECT_TIME'
  | 'BOOKING_CONFIRM'
  | 'NEW_PET_NAME'
  | 'NEW_PET_BREED'
  | 'NEW_PET_CONFIRM';

export interface BotContext {
  userId?: string;
  userName?: string;
  // Booking Context
  selectedPetId?: string;
  selectedPetName?: string;
  selectedService?: Service;
  selectedDate?: string; // YYYY-MM-DD
  selectedTime?: string; // HH:mm
  // New Pet Context
  newPetName?: string;
  newPetBreed?: string;
}

export interface BotOption {
  label: string;
  value: string;
  action?: 'next' | 'cancel' | 'link';
}

export interface BotResponse {
  text: string;
  options?: BotOption[];
  nextState: BotState;
  updatedContext: BotContext;
  shouldRefreshApp?: boolean;
}

// --- BUSINESS CONFIG (Duplicated to ensure standalone logic) ---
const BUSINESS_CONFIG = {
    OPEN_HOUR: 9, 
    CLOSE_HOUR: 18, 
    WORK_DAYS: [1, 2, 3, 4, 5, 6], // 0=Sun
    SLOT_INTERVAL: 30 
};

// --- HELPER FUNCTIONS ---

const generateTimeSlots = async (dateStr: string, durationMinutes: number): Promise<string[]> => {
    const slots: string[] = [];
    const now = new Date();
    const isToday = dateStr === now.toLocaleDateString('en-CA'); // Local YYYY-MM-DD
    
    let currentHour = BUSINESS_CONFIG.OPEN_HOUR;
    let currentMinute = 0;
    const serviceDurationHours = durationMinutes / 60;
    const lastPossibleStartHour = BUSINESS_CONFIG.CLOSE_HOUR - serviceDurationHours;

    while (currentHour < BUSINESS_CONFIG.CLOSE_HOUR) {
        const timeStr = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
        const currentDecimalTime = currentHour + (currentMinute / 60);

        if (currentDecimalTime > lastPossibleStartHour + 0.001) break;

        let isValid = true;
        
        // 1. Past time check
        if (isToday) {
            const slotDate = new Date(`${dateStr}T${timeStr}:00`);
            const bufferDate = new Date(now.getTime() + 30 * 60000); // 30 min buffer
            if (slotDate < bufferDate) isValid = false;
        }

        // 2. Availability check (Optimization: In a real bot, we might check availability batch or per click. 
        // For this demo, we will allow selection and validate on confirm to speed up UI).
        
        if (isValid) {
            slots.push(timeStr);
        }

        currentMinute += BUSINESS_CONFIG.SLOT_INTERVAL;
        if (currentMinute >= 60) {
            currentHour++;
            currentMinute = 0;
        }
    }
    return slots;
};

// --- MAIN ENGINE ---

export const botEngine = {
    
    getInitialState: (): BotState => 'START',

    processMessage: async (
        currentState: BotState, 
        input: string, 
        context: BotContext,
        inputValueIsOption: boolean = false
    ): Promise<BotResponse> => {
        
        // Clone context to avoid mutation issues
        let ctx = { ...context };
        let nextState: BotState = currentState;
        let text = '';
        let options: BotOption[] = [];
        let shouldRefreshApp = false;

        // Global Cancel/Reset
        if (input.toLowerCase() === 'cancelar' || input.toLowerCase() === 'menu' || input.toLowerCase() === 'sair') {
             return {
                 text: "Tudo bem, voltamos ao início. Como posso ajudar?",
                 options: [
                    { label: '📅 Agendar Banho', value: 'opt_booking' },
                    { label: '🐶 Novo Pet', value: 'opt_new_pet' },
                    { label: '📋 Meus Agendamentos', value: 'opt_list_apps' }
                 ],
                 nextState: 'MAIN_MENU',
                 updatedContext: { userId: ctx.userId, userName: ctx.userName } // Clear flow data
             };
        }

        switch (currentState) {
            case 'START':
                // Initial greeting logic
                if (ctx.userId) {
                    text = `Olá ${ctx.userName || 'Tutor'}! 🐾 Sou o assistente virtual da PetSpa. O que vamos fazer hoje?`;
                    options = [
                        { label: '📅 Agendar Banho', value: 'opt_booking' },
                        { label: '🐶 Novo Pet', value: 'opt_new_pet' },
                    ];
                    nextState = 'MAIN_MENU';
                } else {
                    text = "Olá! Eu sou o assistente da PetSpa 🐶. Para eu te ajudar, preciso que você entre na sua conta.";
                    options = [{ label: '🔐 Entrar / Cadastrar', value: 'login', action: 'link' }];
                    nextState = 'START';
                }
                break;

            case 'MAIN_MENU':
                if (input === 'opt_booking' || input.toLowerCase().includes('agendar')) {
                    // Check if user has pets
                    const pets = await api.booking.getMyPets(ctx.userId!);
                    if (pets.length === 0) {
                        text = "Vi que você ainda não tem pets cadastrados. Vamos cadastrar um agora?";
                        options = [{ label: 'Sim, cadastrar', value: 'yes' }];
                        nextState = 'NEW_PET_NAME';
                    } else if (pets.length === 1) {
                        // Auto-select single pet
                        ctx.selectedPetId = pets[0].id;
                        ctx.selectedPetName = pets[0].name;
                        const services = await api.booking.getServices();
                        text = `Agendando para **${pets[0].name}**. Qual serviço deseja?`;
                        options = services.map(s => ({ label: `${s.name} (R$${s.price})`, value: s.id.toString() }));
                        nextState = 'BOOKING_SELECT_SERVICE';
                    } else {
                        text = "Para qual pet seria o agendamento?";
                        options = pets.map(p => ({ label: p.name, value: p.id }));
                        nextState = 'BOOKING_SELECT_PET';
                    }
                } else if (input === 'opt_new_pet' || input.toLowerCase().includes('pet')) {
                    text = "Que legal! Qual é o **nome** do seu pet?";
                    nextState = 'NEW_PET_NAME';
                } else if (input === 'opt_list_apps' || input.toLowerCase().includes('meus')) {
                    const apps = await api.booking.getMyAppointments(ctx.userId!);
                    const activeApps = apps.filter(a => ['pending', 'confirmed', 'in_progress'].includes(a.status));
                    if(activeApps.length === 0) {
                        text = "Você não tem agendamentos futuros. Quer marcar algo?";
                        options = [{ label: 'Agendar Agora', value: 'opt_booking' }];
                    } else {
                        text = `Você tem ${activeApps.length} agendamentos ativos. Posso ajudar em algo mais?`;
                        options = [{ label: 'Menu Principal', value: 'menu' }];
                    }
                    nextState = 'MAIN_MENU';
                } else {
                    text = "Não entendi. Por favor, escolha uma das opções:";
                    options = [
                        { label: '📅 Agendar Banho', value: 'opt_booking' },
                        { label: '🐶 Novo Pet', value: 'opt_new_pet' }
                    ];
                }
                break;

            // --- BOOKING FLOW ---

            case 'BOOKING_SELECT_PET':
                const pets = await api.booking.getMyPets(ctx.userId!);
                // Try to find pet by ID (value) or Name (text input)
                const selectedPet = pets.find(p => p.id === input || p.name.toLowerCase() === input.toLowerCase());
                
                if (selectedPet) {
                    ctx.selectedPetId = selectedPet.id;
                    ctx.selectedPetName = selectedPet.name;
                    const services = await api.booking.getServices();
                    text = `Certo, serviço para o **${selectedPet.name}**. Escolha o tipo de cuidado:`;
                    options = services.map(s => ({ label: `${s.name} (R$${s.price})`, value: s.id.toString() }));
                    nextState = 'BOOKING_SELECT_SERVICE';
                } else {
                    text = "Não encontrei esse pet. Por favor, selecione abaixo:";
                    options = pets.map(p => ({ label: p.name, value: p.id }));
                    nextState = 'BOOKING_SELECT_PET';
                }
                break;

            case 'BOOKING_SELECT_SERVICE':
                const services = await api.booking.getServices();
                const service = services.find(s => s.id.toString() === input || s.name.toLowerCase().includes(input.toLowerCase()));

                if (service) {
                    ctx.selectedService = service;
                    text = `Ótimo! **${service.name}** dura aprox. ${service.duration_minutes} min. \n\nPara **qual dia** você gostaria?`;
                    
                    // Date Suggestions
                    const today = new Date();
                    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
                    
                    options = [
                        { label: 'Hoje', value: today.toLocaleDateString('en-CA') },
                        { label: 'Amanhã', value: tomorrow.toLocaleDateString('en-CA') },
                    ];
                    nextState = 'BOOKING_SELECT_DATE';
                } else {
                    text = "Opção inválida. Escolha um serviço da lista:";
                    options = services.map(s => ({ label: `${s.name} (R$${s.price})`, value: s.id.toString() }));
                }
                break;

            case 'BOOKING_SELECT_DATE':
                // Validate Date (Naive check: is it a date string?)
                let dateInput = input;
                // If user typed "hoje" or "amanha" manually
                if(input.toLowerCase().includes('hoje')) dateInput = new Date().toLocaleDateString('en-CA');
                else if(input.toLowerCase().includes('amanhã')) {
                    const d = new Date(); d.setDate(d.getDate()+1);
                    dateInput = d.toLocaleDateString('en-CA');
                }

                // Check basic format or valid date object
                if (new Date(dateInput).toString() !== 'Invalid Date') {
                     // Check Day of week
                     const dayOfWeek = new Date(`${dateInput}T12:00:00`).getDay(); // Avoid timezone issues
                     if (!BUSINESS_CONFIG.WORK_DAYS.includes(dayOfWeek)) {
                         text = "Ops! Não abrimos aos domingos. Escolha outra data.";
                         const d = new Date(dateInput); d.setDate(d.getDate()+1);
                         options = [{ label: 'Segunda-feira', value: d.toLocaleDateString('en-CA') }];
                         return { text, options, nextState: 'BOOKING_SELECT_DATE', updatedContext: ctx };
                     }

                     ctx.selectedDate = dateInput;
                     
                     // Generate Slots
                     const slots = await generateTimeSlots(dateInput, ctx.selectedService!.duration_minutes);
                     
                     if (slots.length === 0) {
                         text = `Poxa, não temos mais horários livres para ${dateInput}. Tente outra data.`;
                         nextState = 'BOOKING_SELECT_DATE';
                     } else {
                         text = `Data confirmada: ${new Date(dateInput).toLocaleDateString('pt-BR')}. \nEscolha um horário:`;
                         // Limit to first 12 slots to not flood chat
                         options = slots.slice(0, 12).map(t => ({ label: t, value: t }));
                         nextState = 'BOOKING_SELECT_TIME';
                     }
                } else {
                    text = "Data inválida. Por favor, digite no formato AAAA-MM-DD ou escolha uma opção.";
                    nextState = 'BOOKING_SELECT_DATE';
                }
                break;

            case 'BOOKING_SELECT_TIME':
                // Check if valid time format HH:MM
                if (/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(input)) {
                    ctx.selectedTime = input;
                    
                    // Final Confirmation
                    const dateDisplay = new Date(ctx.selectedDate!).toLocaleDateString('pt-BR');
                    text = `📝 **Resumo do Agendamento**:\n\n🐶 **Pet:** ${ctx.selectedPetName}\n✂️ **Serviço:** ${ctx.selectedService?.name}\n📅 **Quando:** ${dateDisplay} às ${input}\n💰 **Valor:** R$ ${ctx.selectedService?.price}\n\nPosso confirmar?`;
                    
                    options = [
                        { label: '✅ Confirmar', value: 'yes' },
                        { label: '❌ Cancelar', value: 'cancelar' }
                    ];
                    nextState = 'BOOKING_CONFIRM';
                } else {
                    text = "Horário inválido. Por favor, clique em um dos horários listados.";
                    const slots = await generateTimeSlots(ctx.selectedDate!, ctx.selectedService!.duration_minutes);
                    options = slots.slice(0, 12).map(t => ({ label: t, value: t }));
                }
                break;

            case 'BOOKING_CONFIRM':
                if (input === 'yes' || input.toLowerCase() === 'sim' || input.toLowerCase() === 'confirmar') {
                    try {
                        const startIso = `${ctx.selectedDate}T${ctx.selectedTime}:00`;
                        const duration = ctx.selectedService!.duration_minutes;
                        const endDate = new Date(new Date(startIso).getTime() + duration * 60000);
                        
                        // Security check for availability
                        const isAvailable = await api.booking.checkAvailability(new Date(startIso).toISOString(), endDate.toISOString());
                        
                        if (!isAvailable) {
                            text = "Eita! Enquanto conversávamos, esse horário foi ocupado 😓. Por favor, escolha outro horário.";
                            const slots = await generateTimeSlots(ctx.selectedDate!, ctx.selectedService!.duration_minutes);
                            options = slots.slice(0, 12).map(t => ({ label: t, value: t }));
                            nextState = 'BOOKING_SELECT_TIME';
                        } else {
                            await api.booking.createAppointment(
                                ctx.userId!, 
                                ctx.selectedPetId!, 
                                ctx.selectedService!.id, 
                                new Date(startIso).toISOString(),
                                endDate.toISOString()
                            );
                            
                            text = `🎉 **Agendamento Confirmado!** \n\nO ${ctx.selectedPetName} vai adorar! Te esperamos lá.`;
                            options = [{ label: 'Menu Principal', value: 'menu' }];
                            nextState = 'MAIN_MENU';
                            shouldRefreshApp = true;
                            // Clear temp context
                            delete ctx.selectedPetId; delete ctx.selectedService;
                        }
                    } catch (e) {
                        console.error(e);
                        text = "Tive um erro técnico ao salvar. Tente novamente.";
                        options = [{ label: 'Tentar Novamente', value: 'yes' }];
                    }
                } else {
                    text = "Agendamento cancelado.";
                    options = [{ label: 'Menu Principal', value: 'menu' }];
                    nextState = 'MAIN_MENU';
                }
                break;

            // --- NEW PET FLOW ---

            case 'NEW_PET_NAME':
                if (input.length < 2) {
                    text = "Nome muito curto. Qual o nome do pet?";
                } else {
                    ctx.newPetName = input;
                    text = `Nome bonito! Qual é a raça do(a) **${input}**? (Se não souber, digite 'SRD')`;
                    options = [
                        { label: 'SRD (Vira-lata)', value: 'SRD' },
                        { label: 'Poodle', value: 'Poodle' },
                        { label: 'Golden Retriever', value: 'Golden' },
                        { label: 'Shih Tzu', value: 'Shih Tzu' },
                        { label: 'Gato', value: 'Gato' }
                    ];
                    nextState = 'NEW_PET_BREED';
                }
                break;

            case 'NEW_PET_BREED':
                ctx.newPetBreed = input;
                try {
                    await api.booking.createPet(ctx.userId!, {
                        name: ctx.newPetName,
                        breed: ctx.newPetBreed
                    });
                    text = `✅ Cadastro concluído! O(A) **${ctx.newPetName}** já faz parte da família PetSpa. \n\nQuer agendar um banho agora?`;
                    options = [
                        { label: 'Sim, Agendar', value: 'opt_booking' },
                        { label: 'Não, Menu', value: 'menu' }
                    ];
                    nextState = 'MAIN_MENU';
                    shouldRefreshApp = true;
                } catch (e) {
                    text = "Erro ao salvar pet. Tente novamente.";
                    nextState = 'MAIN_MENU';
                }
                break;
        }

        return {
            text,
            options,
            nextState,
            updatedContext: ctx,
            shouldRefreshApp
        };
    }
};
