

import { supabase } from '../lib/supabase';
import { Appointment, Employee, Pet, Product, Profile, Service, Package } from '../types';

// Mock Data para Pacotes (Simulando DB)
const MOCK_PACKAGES: Package[] = [
    {
        id: 1,
        title: "Pacote Básico",
        description: "Ideal para manter a higiene em dia.",
        price: 180.00,
        original_price: 200.00,
        bath_count: 4,
        features: ["4 Banhos Simples", "Validade de 30 dias", "Agendamento Prioritário"],
        color_theme: "var(--brand-cyan)",
        highlight: false
    },
    {
        id: 2,
        title: "Clube VIP",
        description: "O favorito dos nossos clientes!",
        price: 250.00,
        original_price: 320.00,
        bath_count: 4,
        features: ["4 Banhos Completos", "1 Hidratação Grátis", "Tosa Higiênica Inclusa", "Perfume Importado"],
        color_theme: "var(--primary)",
        highlight: true
    },
    {
        id: 3,
        title: "Spa Total",
        description: "Tratamento de realeza para seu pet.",
        price: 450.00,
        original_price: 550.00,
        bath_count: 8,
        features: ["8 Banhos Premium", "2 Tosas Completas", "Taxi Dog (Busca e Leva)", "Kit Petiscos Mensal"],
        color_theme: "var(--brand-yellow)",
        highlight: false
    }
];

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
      // Retorna o objeto de resposta completo { data, error }
      // Isso previne o erro "Cannot read properties of undefined" no App.tsx
      return await supabase.auth.signInWithPassword({ email, password: pass });
    },
    async signUp(email: string, pass: string, name: string, phone: string) {
      // Retorna o objeto de resposta completo { data, error }
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
          // Simulando delay de rede
          await new Promise(resolve => setTimeout(resolve, 500));
          return MOCK_PACKAGES;
      },
      async subscribe(userId: string, packageId: number) {
          // Aqui seria a integração com gateway de pagamento ou inserção na tabela 'subscriptions'
          await new Promise(resolve => setTimeout(resolve, 1500));
          return { success: true, message: 'Assinatura realizada com sucesso!' };
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
    async getEmployees() {
      // Simpler query logic for now
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('role', ['admin', 'employee']);
      if (error) throw error;
      return data as Profile[];
    },
    async createProduct(prod: Partial<Product>) {
      const { error } = await supabase.from('products').insert(prod);
      if (error) throw error;
    }
  }
};
