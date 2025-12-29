
import { api } from './api';
import { Pet, Service } from '../types';

export type BotState = 
  | 'START'
  | 'MAIN_MENU'
  | 'BOOKING_SELECT_PET'
  | 'BOOKING_SELECT_SERVICE'
  | 'BOOKING_SELECT_DATE'
  | 'BOOKING_SELECT_TIME'
  | 'BOOKING_CONFIRM'
  | 'NEW_PET_NAME'
  | 'NEW_PET_BREED';

export interface BotContext {
  userId?: string;
  userName?: string;
  selectedPetId?: string;
  selectedPetName?: string;
  selectedService?: Service;
  selectedDate?: string;
  selectedTime?: string;
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

const BUSINESS_CONFIG = {
    OPEN_HOUR: 9, 
    CLOSE_HOUR: 18, 
    WORK_DAYS: [1, 2, 3, 4, 5, 6], 
    SLOT_INTERVAL: 30 
};

const generateTimeSlots = async (dateStr: string, durationMinutes: number): Promise<string[]> => {
    const slots: string[] = [];
    const now = new Date();
    const isToday = dateStr === now.toLocaleDateString('en-CA');
    
    let currentHour = BUSINESS_CONFIG.OPEN_HOUR;
    let currentMinute = 0;
    const serviceDurationHours = durationMinutes / 60;
    const lastPossibleStartHour = BUSINESS_CONFIG.CLOSE_HOUR - serviceDurationHours;

    while (currentHour < BUSINESS_CONFIG.CLOSE_HOUR) {
        const timeStr = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
        const currentDecimalTime = currentHour + (currentMinute / 60);

        if (currentDecimalTime > lastPossibleStartHour + 0.001) break;

        let isValid = true;
        if (isToday) {
            const slotDate = new Date(`${dateStr}T${timeStr}:00`);
            const bufferDate = new Date(now.getTime() + 30 * 60000); 
            if (slotDate < bufferDate) isValid = false;
        }

        if (isValid) slots.push(timeStr);
        currentMinute += BUSINESS_CONFIG.SLOT_INTERVAL;
        if (currentMinute >= 60) { currentHour++; currentMinute = 0; }
    }
    return slots;
};

export const botEngine = {
    // Adicionado parâmetro isOption para corrigir erro de assinatura no Chat.tsx
    processMessage: async (
        currentState: BotState, 
        input: string, 
        context: BotContext,
        isOption: boolean = false
    ): Promise<BotResponse> => {
        let ctx = { ...context };
        let nextState: BotState = currentState;
        let text = '';
        let options: BotOption[] = [];
        let shouldRefreshApp = false;

        // Comando Global de Reset
        if (['cancelar', 'menu', 'sair', 'voltar'].includes(input.toLowerCase())) {
             return {
                 text: "Entendido! Voltei ao menu principal. O que deseja fazer?",
                 options: [
                    { label: '📅 Agendar Banho', value: 'opt_booking' },
                    { label: '🐶 Novo Pet', value: 'opt_new_pet' }
                 ],
                 nextState: 'MAIN_MENU',
                 updatedContext: { userId: ctx.userId, userName: ctx.userName }
             };
        }

        switch (currentState) {
            case 'START':
                text = ctx.userId ? `Olá ${ctx.userName || 'Tutor'}! 🐾 Sou o assistente virtual da PetSpa. Como posso ajudar seu pet hoje?` : "Olá! Sou o assistente da PetSpa. Faça login para começarmos!";
                options = ctx.userId ? [
                    { label: '📅 Agendar Banho', value: 'opt_booking' },
                    { label: '🐶 Novo Pet', value: 'opt_new_pet' }
                ] : [{ label: '🔐 Entrar', value: 'login', action: 'link' }];
                nextState = 'MAIN_MENU';
                break;

            case 'MAIN_MENU':
                if (input === 'opt_booking') {
                    const pets = await api.booking.getMyPets(ctx.userId!);
                    if (pets.length === 0) {
                        text = "Não encontrei pets no seu perfil. Vamos cadastrar um?";
                        nextState = 'NEW_PET_NAME';
                    } else if (pets.length === 1) {
                        ctx.selectedPetId = pets[0].id;
                        ctx.selectedPetName = pets[0].name;
                        const services = await api.booking.getServices();
                        text = `Agendando para **${pets[0].name}**. Qual serviço você prefere?`;
                        options = services.map(s => ({ label: `${s.name} (R$${s.price})`, value: s.id.toString() }));
                        nextState = 'BOOKING_SELECT_SERVICE';
                    } else {
                        text = "Para qual dos seus pets você deseja agendar?";
                        options = pets.map(p => ({ label: p.name, value: p.id }));
                        nextState = 'BOOKING_SELECT_PET';
                    }
                } else if (input === 'opt_new_pet') {
                    text = "Ótimo! Qual o **nome** do novo membro da família?";
                    nextState = 'NEW_PET_NAME';
                }
                break;

            case 'BOOKING_SELECT_SERVICE':
                const services = await api.booking.getServices();
                const service = services.find(s => s.id.toString() === input);
                if (service) {
                    ctx.selectedService = service;
                    text = `Perfeito! **${service.name}** selecionado. Para qual dia?`;
                    const today = new Date();
                    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
                    options = [
                        { label: 'Hoje', value: today.toLocaleDateString('en-CA') },
                        { label: 'Amanhã', value: tomorrow.toLocaleDateString('en-CA') }
                    ];
                    nextState = 'BOOKING_SELECT_DATE';
                }
                break;

            case 'BOOKING_SELECT_DATE':
                const slots = await generateTimeSlots(input, ctx.selectedService!.duration_minutes);
                if (slots.length > 0) {
                    ctx.selectedDate = input;
                    text = `Temos esses horários para ${new Date(input).toLocaleDateString('pt-BR')}:`;
                    options = slots.slice(0, 10).map(t => ({ label: t, value: t }));
                    nextState = 'BOOKING_SELECT_TIME';
                } else {
                    text = "Data sem horários disponíveis. Tente outro dia:";
                    nextState = 'BOOKING_SELECT_DATE';
                }
                break;

            case 'BOOKING_SELECT_TIME':
                ctx.selectedTime = input;
                text = `Confirmando: **${ctx.selectedService?.name}** para **${ctx.selectedPetName}** em **${new Date(ctx.selectedDate!).toLocaleDateString('pt-BR')}** às **${input}**. Podemos marcar?`;
                options = [{ label: 'Sim, Confirmar!', value: 'yes' }, { label: 'Não, Reiniciar', value: 'menu' }];
                nextState = 'BOOKING_CONFIRM';
                break;

            case 'BOOKING_CONFIRM':
                if (input === 'yes') {
                    const startIso = `${ctx.selectedDate}T${ctx.selectedTime}:00`;
                    const endDate = new Date(new Date(startIso).getTime() + ctx.selectedService!.duration_minutes * 60000);
                    await api.booking.createAppointment(ctx.userId!, ctx.selectedPetId!, ctx.selectedService!.id, new Date(startIso).toISOString(), endDate.toISOString());
                    text = "🎉 Agendamento realizado com sucesso! Vejo você em breve.";
                    options = [{ label: 'Voltar ao Menu', value: 'menu' }];
                    nextState = 'MAIN_MENU';
                    shouldRefreshApp = true;
                }
                break;

            case 'NEW_PET_NAME':
                ctx.newPetName = input;
                text = `E qual a raça do(a) **${input}**?`;
                nextState = 'NEW_PET_BREED';
                break;

            case 'NEW_PET_BREED':
                await api.booking.createPet(ctx.userId!, { name: ctx.newPetName, breed: input });
                text = `✅ ${ctx.newPetName} cadastrado! Deseja agendar um banho agora?`;
                options = [{ label: 'Sim, Agendar', value: 'opt_booking' }, { label: 'Agora não', value: 'menu' }];
                nextState = 'MAIN_MENU';
                shouldRefreshApp = true;
                break;
        }

        return { text, options, nextState, updatedContext: ctx, shouldRefreshApp };
    }
};
