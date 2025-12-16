
export type UserRole = 'client' | 'admin' | 'employee';

export interface Profile {
  id: string;
  full_name: string;
  phone?: string;
  role: UserRole;
  email?: string;
}

export interface Service {
  id: string | number; // Updated to support UUID
  name: string;
  description?: string;
  price: number;
  duration_minutes: number;
  active: boolean;
}

export interface Pet {
  id: string; // UUID
  owner_id: string;
  name: string;
  breed?: string;
  weight?: number;
  birth_date?: string; 
  notes?: string;
  avatar_url?: string; 
}

export type AppointmentStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';

export interface Appointment {
  id: number;
  created_at: string;
  client_id: string;
  pet_id: string; 
  service_id: string | number; // Updated to support UUID
  employee_id?: string | null;
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  pets?: Partial<Pet>;
  services?: Partial<Service>;
  profiles?: Partial<Profile>; 
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
  stock_status?: 'in_stock' | 'low_stock' | 'out_of_stock';
}

export interface Employee {
  id: string;
  specialties: string[];
  active: boolean;
  profiles?: Profile;
}

export interface Package {
    id: number;
    title: string;
    description?: string;
    price: number;
    original_price?: number; 
    bath_count: number;
    features: string[];
    highlight: boolean; 
    color_theme?: string; 
    active: boolean;
    service_id?: string | number; // Updated to support UUID
}

export interface Subscription {
    id: number;
    user_id: string;
    package_id: number;
    pet_id?: string; 
    status: 'active' | 'cancelled' | 'expired';
    created_at: string;
    packages?: Package;
    pets?: Pet;
}

// UI Types
export type Route = 'home' | 'services' | 'about' | 'chat' | 'login' | 'register' | 'dashboard' | 'profile' | 'admin' | 'tracker' | 'user-profile' | 'pet-details' | 'appointment-details' | 'booking-wizard' | 'market' | 'packages';

export type LoginStage = 'idle' | 'authenticating' | 'welcome' | 'insight';
