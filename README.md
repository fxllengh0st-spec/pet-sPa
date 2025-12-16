# 🐾 PetSpa - Plataforma de Gestão e Agendamento Inteligente

<div align="center">
  <img src="https://img.shields.io/badge/React-18-blue?logo=react" />
  <img src="https://img.shields.io/badge/TypeScript-5-blue?logo=typescript" />
  <img src="https://img.shields.io/badge/Vite-5-purple?logo=vite" />
  <img src="https://img.shields.io/badge/Supabase-Database-green?logo=supabase" />
  <img src="https://img.shields.io/badge/Gemini-AI-orange?logo=google-gemini" />
</div>

<br />

Bem-vindo ao **PetSpa**, uma aplicação web **Mobile-First** desenvolvida para modernizar o agendamento de serviços de pet shop. O sistema não é apenas uma vitrine, mas uma plataforma completa de gestão que integra um **Assistente de IA Real (Action-Driven)**, lógica de agendamento complexa com slots de tempo e um sistema de assinaturas recorrentes.

---

## ✨ Funcionalidades Principais

### 📱 Para o Cliente (Mobile & Desktop)
- **🤖 Assistente IA (Gemini 2.5)**: 
  - Chatbot contextual que realiza ações reais no banco de dados (`Function Calling`).
  - **Sincronização em Tempo Real**: Quando a IA agenda um banho ou cadastra um pet, a interface do aplicativo atualiza automaticamente sem recarregar a página.
  - **Fallback Mode**: Um "cérebro reserva" local que funciona mesmo se a API da IA oscilar.
- **📅 Agendamento Inteligente (Wizard)**: 
  - Sistema de **Slots de Tempo**: Gera horários de 30 em 30 minutos dinamicamente.
  - **Validação de Negócio**: Impede agendamentos que ultrapassem o horário de fechamento (Ex: Se fecha às 18h e o serviço dura 1h, o último slot é 17h).
- **👑 Clube VIP (Assinaturas)**: Sistema de planos mensais onde o cliente associa uma assinatura específica a um pet.
- **❤️ Marketplace de Adoção**: Área social para conectar clientes a ONGs parceiras.
- **👤 Gestão de Perfil**: Histórico completo de banhos, status do serviço (Kanban visual) e gestão de múltiplos pets.

### 🛡️ Para o Administrador (Backoffice)
- **📊 Dashboard Operacional**: KPIs em tempo real (Receita Estimada, Taxa de Ocupação, Ticket Médio).
- **📋 Kanban de Serviços**: Gestão visual do fluxo de trabalho (Pendente -> Confirmado -> Em Andamento -> Concluído).
- **🗓️ Agenda Semanal Visual**: Visualização cronológica estilo "Google Calendar" com cálculo de altura dos cards baseado na duração do serviço.
- **⚙️ Gerenciador de Catálogo**: CRUD completo para Serviços e Pacotes de Assinatura.

---

## 🚀 Arquitetura e Tecnologias

### Frontend
- **Framework**: React 18 + TypeScript.
- **Build Tool**: Vite.
- **Estilização**: CSS Puro Moderno (CSS Variables, CSS Modules concept) com animações nativas (`fade-in-up`, `pop-in`).
- **Icons**: Lucide React.
- **State Management**: React Context (Toast) + Props Drilling otimizado + Callbacks de Sincronização.

### Backend & AI
- **Database & Auth**: Supabase (PostgreSQL).
- **AI SDK**: `@google/genai` (Google Gemini API).
- **Lógica de Negócio**:
  - Validação de colisão de horários no Backend e Frontend.
  - Lógica de "slots" gerada no cliente para UX instantânea.

---

## 🛠️ Instalação e Configuração

### Pré-requisitos
- Node.js (v18+)
- Conta no [Supabase](https://supabase.com)
- Chave de API do [Google AI Studio](https://aistudio.google.com/)

### 1. Clonar e Instalar
```bash
git clone https://github.com/seu-usuario/petspa-react.git
cd petspa-react
npm install
```

### 2. Variáveis de Ambiente
Crie um arquivo `.env` na raiz:

```env
# Chave da API do Google Gemini
GEMINI_API_KEY=sua_chave_aqui_xyz
```

> **Nota:** As credenciais do Supabase já estão configuradas em `src/lib/supabase.ts` para o ambiente de demonstração. Em produção, mova-as para o `.env`.

### 3. Rodar a Aplicação
```bash
npm run dev
```
Acesse `http://localhost:3000`.

---

## 🧠 Detalhes Técnicos Importantes

### 1. O Cérebro da IA (`src/services/gemini.ts`)
Diferente de chatbots comuns, nossa implementação usa um loop de execução de ferramentas.
1. O usuário pede: *"Agende um banho para o Rex amanhã às 14h"*.
2. A IA identifica a intenção e chama a tool `create_appointment`.
3. O código executa a ação no Supabase.
4. **O Diferencial:** A função retorna uma flag `refreshRequired: true`. O componente de Chat intercepta isso e dispara um `loadUserData()` global, atualizando o saldo, agenda e lista de pets do usuário instantaneamente.

### 2. Lógica de Slots (`src/components/BookingWizard.tsx`)
Para evitar erros de agendamento:
```typescript
// Exemplo simplificado da lógica
const serviceDurationHours = service.duration / 60;
const lastPossibleStartHour = CLOSING_HOUR - serviceDurationHours;

// Se o serviço leva 1h e fechamos as 18h, o último slot gerado será 17:00.
// Slots passados (hoje) são filtrados automaticamente.
```

---

## 📂 Estrutura de Pastas

```
src/
├── components/      # Componentes UI (Chat, Wizard, AdminPanel)
├── context/         # React Context (Toast)
├── lib/             # Configurações de terceiros (Supabase)
├── services/        # Camada de API (Auth, Booking, Gemini)
├── styles/          # CSS Modular (Base, Layout, Pages, Animations)
├── utils/           # Helpers (Formatadores, Geradores de Avatar)
├── views/           # Páginas (Home, Dashboard, Profile)
├── App.tsx          # Roteamento e Gestão de Estado Global
└── types.ts         # Definições de Tipos TypeScript
```

---

## 📝 Licença

Desenvolvido como projeto demonstrativo de **Engenharia Frontend Sênior**.
Sinta-se à vontade para estudar o código e adaptar para seus projetos.