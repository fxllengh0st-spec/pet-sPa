import { supabase } from '../lib/supabase';
import { Appointment, Employee, Pet, Product, Profile, Service, Package, Subscription } from '../types';

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
    // NOVO MÉTODO: Verifica colisão de horários (Overlapping)
    // Regra: (StartA < EndB) and (EndA > StartB)
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

      async subscribe(userId: string, packageId: number, petId: string) {
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
              package_id: packageId,
              pet_id: petId,
              status: 'active'
          });

          if (error) throw error;
          return { success: true, message: 'Assinatura realizada com sucesso!' };
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
        const { error } = await supabase.from('services').insert(service);
        if (error) throw error;
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