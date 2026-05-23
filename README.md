# Planejix - Carteira Inteligente

Dashboard completo com autenticação, dark mode, gráficos mensais/anuais e controle de gastos (fixos, variáveis e personalizados).

## Pré-requisitos

### 1. Instalar Node.js
Baixe e instale o Node.js em: **https://nodejs.org** (versão LTS recomendada)

Após instalar, abra o PowerShell e verifique:
```
node --version
npm --version
```

### 2. Ferramentas de Build (necessário para o better-sqlite3)
O banco de dados usa uma biblioteca nativa. Instale as ferramentas de compilação:
```
npm install --global windows-build-tools
```
**OU** instale o Visual Studio Community com o componente "Desenvolvimento para Desktop com C++".

---

## Instalação

Abra o PowerShell na pasta do projeto (`c:\Users\jeffb\Downloads\ProjetoClaudezin`) e execute:

```powershell
# 1. Instalar dependência raiz (concurrently)
npm install

# 2. Instalar dependências do backend e frontend
npm run install:all
```

---

## Executar o Projeto

```powershell
# Inicia backend (:3001) e frontend (:3000) ao mesmo tempo
npm run dev
```

Depois abra no navegador: **http://localhost:3000**

---

## Uso

1. Acesse `http://localhost:3000` → redireciona para a tela de login
2. Clique em **"Criar conta"** e registre-se (usuário + senha)
3. Após o login, você verá o **Dashboard** com:
   - Cards de Entradas, Saídas, Saldo e Maior Gasto
   - Gráfico de barras mensal (entradas vs saídas)
   - Gráfico de linhas anual (evolução)
   - Transações recentes

4. Em **Transações**: adicione gastos e ganhos
   - Tipo: **Entrada** ou **Saída**
   - Subtipo da saída: **Fixo**, **Variável** ou **Personalizado**
   - Categoria, valor, data e observações

5. Em **Categorias**: gerencie suas categorias com cores personalizadas

---

## Estrutura do Projeto

```
ProjetoClaudezin/
├── backend/           ← API Node.js/Express + SQLite
│   ├── server.js
│   ├── database/db.js ← Banco de dados (criado automaticamente)
│   ├── routes/        ← auth, transactions, categories
│   └── controllers/
└── frontend/          ← React + TypeScript + Tailwind CSS
    └── src/
        ├── pages/     ← Login, Register, Dashboard, Transactions, Categories
        ├── components/
        └── context/   ← AuthContext (JWT)
```

---

## Tecnologias

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + Recharts
- **Backend**: Node.js + Express + SQLite (better-sqlite3)
- **Auth**: JWT + bcrypt
- **Design**: Dark mode por padrão, totalmente responsivo
