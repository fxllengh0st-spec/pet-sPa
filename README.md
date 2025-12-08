# 🐾 PetSpa - Plataforma de Gestão e Agendamento Inteligente

<div align="center">
  <img src="https://img.shields.io/badge/React-18-blue?logo=react" />
  <img src="https://img.shields.io/badge/TypeScript-5-blue?logo=typescript" />
  <img src="https://img.shields.io/badge/Vite-5-purple?logo=vite" />
  <img src="https://img.shields.io/badge/Supabase-Database-green?logo=supabase" />
  <img src="https://img.shields.io/badge/Gemini-AI-orange?logo=google-gemini" />
</div>

<br />

Bem-vindo ao **PetSpa**, uma aplicação web **Mobile-First** desenvolvida para modernizar o agendamento de serviços de pet shop. O sistema integra um assistente de IA avançado capaz de realizar ações reais (como agendar e consultar preços), além de um painel administrativo completo e uma loja virtual.

---

## ✨ Funcionalidades Principais

### 🐶 Para o Cliente
- **Assistente IA (Gemini)**: Chatbot inteligente com *Function Calling*. Ele entende linguagem natural para agendar banhos, consultar serviços e tirar dúvidas.
  - *Exemplo: "Agende um banho para o Rex amanhã às 14h"*
- **Agendamento Visual**: Fluxo "Wizard" passo-a-passo para quem prefere clicar a digitar.
- **Gestão de Pets**: Cadastro completo dos animais (Nome, Raça, Peso, Observações).
- **Marketplace**: Loja integrada com carrinho de compras para produtos e acessórios.
- **Acompanhamento em Tempo Real**: Status do banho (Solicitado -> Em Andamento -> Pronto).

### 🛡️ Para o Administrador
- **Dashboard Operacional**: KPIs de receita, ocupação e ticket médio.
- **Kanban de Serviços**: Gestão visual do fluxo de trabalho (Aprovar -> Iniciar -> Finalizar).
- **Agenda Diária**: Visualização cronológica dos compromissos.

---

## 🚀 Tecnologias Utilizadas

- **Frontend**: React 18, TypeScript, CSS Modules (Variáveis CSS modernas).
- **Build Tool**: Vite.
- **Backend / Database**: Supabase (PostgreSQL, Auth, Storage).
- **Inteligência Artificial**: Google Gemini API (`@google/genai` SDK).
- **Ícones**: Lucide React.
- **Estilização**: CSS puro organizado em arquitetura modular (`src/styles/`).

---

## 🛠️ Configuração e Instalação

### Pré-requisitos
- Node.js (v18 ou superior)
- Gerenciador de pacotes (npm, yarn ou pnpm)

### 1. Clonar o Repositório
```bash
git clone https://github.com/seu-usuario/petspa-react.git
cd petspa-react
```

### 2. Instalar Dependências
```bash
npm install
```

### 3. Configurar Variáveis de Ambiente
Crie um arquivo `.env` ou `.env.local` na raiz do projeto. Você precisará de uma chave de API do Google Gemini.

```env
# Chave da API do Google AI Studio (Gemini)
# Obtenha em: https://aistudio.google.com/app/apikey
GEMINI_API_KEY=sua_chave_aqui_xyz
```

> **Nota:** As credenciais do Supabase (URL e Key) já estão configuradas para o ambiente de demonstração em `src/lib/supabase.ts`. Para produção, recomenda-se movê-las também para o `.env`.

### 4. Rodar o Projeto
```bash
npm run dev
```
Acesse `http://localhost:3000` no seu navegador.

---

## 📂 Estrutura do Banco de Dados (Supabase)

O projeto depende das seguintes tabelas no PostgreSQL:

| Tabela | Descrição |
| :--- | :--- |
| `profiles` | Dados dos usuários (role: 'client' ou 'admin'). |
| `pets` | Animais cadastrados vinculados a um owner_id. |
| `services` | Catálogo de serviços (Banho, Tosa) e preços. |
| `appointments` | Agendamentos com status e relacionamentos. |
| `products` | Itens do Marketplace. |

---

## 🤖 Como funciona a IA (Cérebro do Chat)

O arquivo `src/services/gemini.ts` implementa a lógica de **Tools (Ferramentas)**.

1. O usuário envia uma mensagem.
2. O modelo Gemini analisa se precisa de dados externos.
3. Se necessário, ele "pede" para executar uma função local:
   - `list_my_pets`: Busca os pets do usuário no Supabase.
   - `list_services`: Consulta a tabela de preços.
   - `create_appointment`: Insere o agendamento no banco.
4. O app executa a função e devolve o resultado para a IA.
5. A IA gera a resposta final em linguagem natural.

---

## 📱 Design System

O projeto utiliza um sistema de design próprio focado em **Mobile-First**:

- **Arquivos CSS**: Localizados em `src/styles/`.
- **Temas**: Cores e espaçamentos definidos em `variables.css`.
- **Responsividade**: O layout se adapta a teclados virtuais móveis usando a API `visualViewport` (ver `Chat.tsx`).

---

## 📝 Licença

Este projeto é de uso educacional e demonstrativo. Sinta-se à vontade para forkear e melhorar!
