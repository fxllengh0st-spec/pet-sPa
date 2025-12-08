
export type UserRole = 'client' | 'admin' | 'employee';

export interface Profile {
  id: string;
  full_name: string;
  phone?: string;
  role: UserRole;
  email?: string;
}

export interface Service {
  id: number;
  name: string;
  description?: string;
  price: number;
  duration_minutes: number;
  active: boolean;
}

export interface Pet {
  id: number;
  owner_id: string;
  name: string;
  breed?: string;
  weight?: number;
  notes?: string;
}

export type AppointmentStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';

export interface Appointment {
  id: number;
  created_at: string;
  client_id: string;
  pet_id: number;
  service_id: number;
  employee_id?: string | null;
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  // Joins - Alterado para Partial para suportar selects parciais do Supabase
  pets?: Partial<Pet>;
  services?: Partial<Service>;
  profiles?: Partial<Profile>; // Client profile
}

export interface Product {
  id: number;
  name: string;
  sku?: string;
  category: 'food' | 'toys' | 'hygiene' | 'accessories';
  price: number;
  stock_quantity: number;
  image: string;
  description?: string;
}

export interface Employee {
  id: string;
  specialties: string[];
  active: boolean;
  profiles?: Profile;
}

// UI Types
export type Route = 'home' | 'services' | 'about' | 'chat' | 'login' | 'register' | 'dashboard' | 'profile' | 'admin' | 'tracker' | 'user-profile' | 'pet-details' | 'appointment-details' | 'booking-wizard' | 'market';

export type LoginStage = 'idle' | 'authenticating' | 'welcome' | 'insight';
