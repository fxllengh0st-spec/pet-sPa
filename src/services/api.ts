
import { supabase } from '../lib/supabase';
import { Appointment, Employee, Pet, Product, Profile, Service, Package, Subscription } from '../types';

// Configuração de Negócio (Duplicada aqui para uso no Backend Service Simulation)
const BUSINESS_CONFIG = {
    OPEN_HOUR: 9, 
    CLOSE_HOUR: 18,
    WORK_DAYS: [1, 2, 3, 4, 5, 6], // 0=Dom (Fechado)
    SLOT_INTERVAL: 30
};

// Helper para encontrar próximo slot válido
const findNextValidSlot = async (targetDate: Date, durationMinutes: number): Promise<Date> => {
    let candidate = new Date(targetDate);
    let attempts = 0;
    const maxAttempts = 50; // Evitar loop infinito

    while (attempts < maxAttempts) {
        // 1. Verificar regra de dia da semana (Domingo fechado)
        const day = candidate.getDay();
        if (!BUSINESS_CONFIG.WORK_DAYS.includes(day)) {
            // Avança para o próximo dia às 9h
            candidate.setDate(candidate.getDate() + 1);
            candidate.setHours(BUSINESS_CONFIG.OPEN_HOUR, 0, 0, 0);
            continue;
        }

        // 2. Verificar horário comercial
        const hour = candidate.getHours();
        const endHour = hour + (durationMinutes / 60);
        
        if (hour < BUSINESS_CONFIG.OPEN_HOUR) {
             candidate.setHours(BUSINESS_CONFIG.OPEN_HOUR, 0, 0, 0);
             continue;
        }
        if (endHour > BUSINESS_CONFIG.CLOSE_HOUR) {
             // Avança para o próximo dia
             candidate.setDate(candidate.getDate() + 1);
             candidate.setHours(BUSINESS_CONFIG.OPEN_HOUR, 0, 0, 0);
             continue;
        }

        // 3. Verificar Colisão no Banco
        const endCandidate = new Date(candidate.getTime() + durationMinutes * 60000);
        const isFree = await api.booking.checkAvailability(candidate.toISOString(), endCandidate.toISOString());

        if (isFree) {
            return candidate;
        }

        // Se ocupado, avança 1 hora (tentativa simples de heurística)
        candidate.setTime(candidate.getTime() + 60 * 60000);
        attempts++;
    }

    return targetDate; // Fallback se falhar (deixa colidir ou trata erro na UI)
};

export const api = {
  auth: {
    async getSession() {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
    async getUserProfile(userId: string) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (error) throw error;
      return data as Profile;
    },
    async signIn(email: string, pass: string) {
      return await supabase.auth.signInWithPassword({ email, password: pass });
    },
    async signUp(email: string, pass: string, name: string, phone: string) {
      return await supabase.auth.signUp({
        email,
        password: pass,
        options: {
          data: { full_name: name, phone },
          emailRedirectTo: window.location.origin
        }
      });
    },
    async signOut() {
      return supabase.auth.signOut();
    }
  },

  booking: {
    async getServices() {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('active', true)
        .order('price', { ascending: true });
      if (error) throw error;
      return data as Service[];
    },
    async getMyPets(userId: string) {
      const { data, error } = await supabase.from('pets').select('*').eq('owner_id', userId);
      if (error) throw error;
      return data as Pet[];
    },
    async createPet(userId: string, pet: Partial<Pet>) {
      const { error } = await supabase.from('pets').insert({ ...pet, owner_id: userId });
      if (error) throw error;
    },
    async createAppointment(userId: string, petId: string, serviceId: number, start: string, end: string) {
      const { error } = await supabase.from('appointments').insert({
        client_id: userId,
        pet_id: petId,
        service_id: serviceId,
        start_time: start,
        end_time: end,
        status: 'pending'
      });
      if (error) throw error;
    },
    async rescheduleAppointment(appointmentId: number, newStartIso: string, newEndIso: string) {
        // Validação de disponibilidade
        const isAvailable = await api.booking.checkAvailability(newStartIso, newEndIso);
        if (!isAvailable) {
            throw new Error("Horário indisponível.");
        }

        const { error } = await supabase
            .from('appointments')
            .update({ 
                start_time: newStartIso, 
                end_time: newEndIso,
                status: 'confirmed' // Reseta status para confirmado se estava pendente
            })
            .eq('id', appointmentId);
            
        if (error) throw error;
    },
    // NOVO MÉTODO: Verifica colisão de horários (Overlapping)
    async checkAvailability(startIso: string, endIso: string) {
        const { data, error } = await supabase
            .from('appointments')
            .select('id')
            .neq('status', 'cancelled') // Ignora cancelados
            .lt('start_time', endIso) 
            .gt('end_time', startIso);
            
        if (error) throw error;
        // Se array vazio, está livre. Se tiver itens, tem conflito.
        return data.length === 0;
    },
    // NOVO MÉTODO: Verifica conflito semanal de pacote
    async checkWeeklyPackageConflict(petId: string, date: string): Promise<boolean> {
        // 1. Verifica se o pet tem assinatura ativa
        const { data: subscription } = await supabase
            .from('subscriptions')
            .select('id')
            .eq('pet_id', petId)
            .eq('status', 'active')
            .maybeSingle();

        // Se não tem assinatura, não há conflito de "pacote semanal"
        if (!subscription) return false;

        // 2. Calcula intervalo da semana (Domingo a Sábado) da data escolhida
        const targetDate = new Date(date);
        const day = targetDate.getDay();
        const diffToSunday = targetDate.getDate() - day;
        
        const startOfWeek = new Date(targetDate);
        startOfWeek.setDate(diffToSunday);
        startOfWeek.setHours(0,0,0,0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23,59,59,999);

        // 3. Verifica se existe agendamento nesta semana para este pet
        const { data: appointments, error } = await supabase
            .from('appointments')
            .select('id')
            .eq('pet_id', petId)
            .neq('status', 'cancelled')
            .gte('start_time', startOfWeek.toISOString())
            .lte('start_time', endOfWeek.toISOString());

        if (error) throw error;

        // Se encontrou agendamento, há conflito com a lógica de "1 banho por semana do pacote"
        return appointments && appointments.length > 0;
    },
    async getMyAppointments(userId: string) {
      const { data, error } = await supabase
        .from('appointments')
        .select('*, pets(*), services(*)')
        .eq('client_id', userId)
        .order('start_time', { ascending: false });
      if (error) throw error;
      return data as Appointment[];
    },
    async getAppointmentById(id: number) {
      const { data, error } = await supabase
        .from('appointments')
        .select('*, pets(*), services(*)')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as Appointment;
    },
    async getAppointmentsRange(start: Date, end: Date) {
      const { data, error } = await supabase
        .from('appointments')
        .select('id, start_time, end_time, status, pets(name), profiles(full_name)')
        .gte('start_time', start.toISOString())
        .lte('end_time', end.toISOString())
        .neq('status', 'cancelled');
      if (error) throw error;
      return data as unknown as Appointment[];
    }
  },

  packages: {
      async getPackages() {
          const { data, error } = await supabase
            .from('packages')
            .select('*')
            .eq('active', true)
            .order('price', { ascending: true });
            
          if (error) throw error;
          return data as Package[];
      },
      
      async getMySubscriptions(userId: string) {
          const { data, error } = await supabase
             .from('subscriptions')
             .select('*, packages(*), pets(name)')
             .eq('user_id', userId)
             .eq('status', 'active'); // Traz apenas as ativas
             
          if (error) throw error;
          return data as Subscription[];
      },

      async subscribe(userId: string, pkg: Package, petId: string, firstBathStartIso: string) {
          // 1. Verifica se ESSE PET já tem assinatura ativa
          const { data: existing } = await supabase
              .from('subscriptions')
              .select('id')
              .eq('pet_id', petId)
              .eq('status', 'active')
              .maybeSingle();

          if (existing) {
              throw new Error("Este pet já possui um plano ativo. Cancele o anterior para trocar.");
          }

          // 2. Cria a assinatura vinculada ao Pet
          const { error } = await supabase.from('subscriptions').insert({
              user_id: userId,
              package_id: pkg.id,
              pet_id: petId,
              status: 'active'
          });

          if (error) throw error;

          // 3. AUTO-SCHEDULE LOGIC
          try {
              // Busca o serviço vinculado ao pacote ou fallback para o primeiro "Banho" encontrado
              const services = await api.booking.getServices();
              const linkedService = pkg.service_id 
                  ? services.find(s => s.id === pkg.service_id)
                  : services.find(s => s.name.toLowerCase().includes('banho')) || services[0];
              
              if (!linkedService) return { success: true, message: 'Assinatura criada, mas erro ao agendar banhos.' };

              const totalBaths = pkg.bath_count;
              const intervalDays = Math.floor(30 / totalBaths); // Ex: 4 banhos = cada 7 dias
              const duration = linkedService.duration_minutes;

              const firstDate = new Date(firstBathStartIso);

              // Loop para criar agendamentos
              for (let i = 0; i < totalBaths; i++) {
                  // Calcular data ideal
                  let targetDate = new Date(firstDate);
                  targetDate.setDate(targetDate.getDate() + (i * intervalDays));

                  // Se for o primeiro, usa a hora exata escolhida. 
                  const validStartDate = await findNextValidSlot(targetDate, duration);
                  const validEndDate = new Date(validStartDate.getTime() + duration * 60000);

                  await api.booking.createAppointment(
                      userId,
                      petId,
                      linkedService.id,
                      validStartDate.toISOString(),
                      validEndDate.toISOString()
                  );
              }

          } catch (scheduleError) {
              console.error("Erro no agendamento automático:", scheduleError);
              return { success: true, warning: 'Assinatura ativa, mas verifique os agendamentos.' };
          }

          return { success: true, message: 'Assinatura realizada e banhos agendados!' };
      },

      async cancelSubscription(subscriptionId: number) {
          const { error } = await supabase
              .from('subscriptions')
              .update({ status: 'cancelled' })
              .eq('id', subscriptionId);
          
          if (error) throw error;
          return { success: true };
      }
  },

  admin: {
    async getAllAppointments() {
      const { data, error } = await supabase
        .from('appointments')
        .select('*, pets(name, breed), services(name, price), profiles(full_name, phone)')
        .order('start_time', { ascending: true });
      if (error) throw error;
      return data as Appointment[];
    },
    async updateStatus(id: number, status: string) {
      const { error } = await supabase.from('appointments').update({ status }).eq('id', id);
      if (error) throw error;
    },
    async updateFullAppointment(id: number, payload: any) {
      const { error } = await supabase.from('appointments').update(payload).eq('id', id);
      if (error) throw error;
    },
    
    // --- CRUD SERVICES ---
    async getAllServicesAdmin() {
        const { data, error } = await supabase.from('services').select('*').order('id');
        if (error) throw error;
        return data as Service[];
    },
    async createService(service: Omit<Service, 'id'>) {
        const { data, error } = await supabase.from('services').insert(service).select().single();
        if (error) throw error;
        return data as Service; // Returns the created service
    },
    async updateService(id: number, service: Partial<Service>) {
        const { error } = await supabase.from('services').update(service).eq('id', id);
        if (error) throw error;
    },
    async deleteService(id: number) {
        const { error } = await supabase.from('services').delete().eq('id', id);
        if (error) throw error;
    },

    // --- CRUD PACKAGES ---
    async getAllPackagesAdmin() {
        const { data, error } = await supabase.from('packages').select('*').order('id');
        if (error) throw error;
        return data as Package[];
    },
    async createPackage(pkg: Omit<Package, 'id'>) {
        const { error } = await supabase.from('packages').insert(pkg);
        if (error) throw error;
    },
    async updatePackage(id: number, pkg: Partial<Package>) {
        const { error } = await supabase.from('packages').update(pkg).eq('id', id);
        if (error) throw error;
    },
    async deletePackage(id: number) {
        const { error } = await supabase.from('packages').delete().eq('id', id);
        if (error) throw error;
    }
  }
};
