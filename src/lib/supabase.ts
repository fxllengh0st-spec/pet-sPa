import { createClient } from '@supabase/supabase-js';

// ID do Projeto extraído dos arquivos originais
const SUPABASE_URL = 'https://vfryefavzurwoiuznkwv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmcnllZmF2enVyd29pdXpua3d2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2MjI5MjQsImV4cCI6MjA4MDE5ODkyNH0.B8kUGDsCBBre-ZmbBqrfP3s-EEFqaEpyHPurE7cm8VY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);