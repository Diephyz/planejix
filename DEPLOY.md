# Deploy — Planejix (Vercel + Oracle Cloud)

**Custo total: R$ 0**

```
planejix.vercel.app  ←  usuário
        ↓ /api/*
api-planejix.duckdns.org  ←  Oracle Cloud VM (Node.js + SQLite)
```

---

## Parte 1 — Servidor backend (Oracle Cloud)

### 1.1 Criar conta Oracle Cloud
1. Acesse [cloud.oracle.com](https://cloud.oracle.com) e clique em **Start for free**
2. Preencha os dados (precisa de cartão de crédito para verificação, mas **não é cobrado nada**)
3. Escolha a região mais próxima: **Brazil East (São Paulo)**

### 1.2 Criar a VM gratuita
1. No painel, vá em **Compute → Instances → Create Instance**
2. Configure:
   - **Name:** planejix
   - **Image:** Ubuntu 22.04
   - **Shape:** Ampere → `VM.Standard.A1.Flex` → **4 OCPU, 24 GB RAM** (gratuito)
   - **SSH keys:** gere ou faça upload da sua chave pública
3. Clique em **Create**
4. Aguarde o status ficar **Running** e copie o **IP público**

### 1.3 Liberar as portas no firewall da Oracle
1. Vá em **Virtual Cloud Network → Security Lists → Default Security List**
2. Adicione regras de entrada (**Ingress Rules**):
   - Porta **80** (HTTP) — Source: `0.0.0.0/0`
   - Porta **443** (HTTPS) — Source: `0.0.0.0/0`

### 1.4 Abrir portas no firewall do Ubuntu
Conecte via SSH e execute:
```bash
sudo iptables -I INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT -p tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save
```

### 1.5 Criar subdomínio gratuito no DuckDNS
1. Acesse [duckdns.org](https://www.duckdns.org) e faça login com Google
2. Crie um subdomínio: `api-planejix` → URL final: `api-planejix.duckdns.org`
3. Coloque o **IP público da VM** no campo IP e clique em **Update IP**
4. Copie o seu **token** (será usado no próximo passo)

### 1.6 Rodar o script de setup na VM
```bash
# Conecte na VM via SSH
ssh ubuntu@SEU-IP-ORACLE

# Baixe e execute o script
curl -fsSL https://raw.githubusercontent.com/Diephyz/planejix/master/deploy/setup-server.sh | bash
```

O script vai pedir para você criar o `.env`. Use:
```bash
nano /home/ubuntu/planejix/backend/.env
```

Conteúdo do `.env`:
```
PORT=3001
JWT_SECRET=cole-uma-string-aleatória-longa-aqui
GOOGLE_CLIENT_ID=seu-google-client-id.apps.googleusercontent.com
FRONTEND_URL=https://SEU-PROJETO.vercel.app
```

### 1.7 Configurar Nginx + SSL
```bash
# Copiar configuração do Nginx
sudo cp /home/ubuntu/planejix/deploy/nginx.conf /etc/nginx/sites-available/planejix

# Substituir o subdomínio no arquivo
sudo sed -i 's/SEU-SUBDOMINIO/api-planejix/g' /etc/nginx/sites-available/planejix

# Ativar o site
sudo ln -s /etc/nginx/sites-available/planejix /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# Emitir certificado SSL gratuito
sudo certbot --nginx -d api-planejix.duckdns.org
```

Certbot vai perguntar seu e-mail e aceitar os termos. Depois o SSL é configurado automaticamente.

### 1.8 Testar o backend
```bash
curl https://api-planejix.duckdns.org/api/auth/login \
  -X POST -H "Content-Type: application/json" \
  -d '{"username":"teste","password":"teste"}'
# Esperado: {"error":"Username ou senha inválidos"} — backend OK!
```

---

## Parte 2 — Frontend (Vercel)

### 2.1 Acessar o Vercel
1. Acesse [vercel.com](https://vercel.com) e faça login com GitHub
2. Clique em **Add New → Project**
3. Importe o repositório `Diephyz/planejix`

### 2.2 Configurar o projeto no Vercel
| Campo | Valor |
|---|---|
| **Root Directory** | `frontend` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |

### 2.3 Adicionar variáveis de ambiente no Vercel
Em **Settings → Environment Variables**, adicione:

| Name | Value |
|---|---|
| `VITE_API_URL` | `https://api-planejix.duckdns.org/api` |
| `VITE_GOOGLE_CLIENT_ID` | `seu-google-client-id.apps.googleusercontent.com` |

### 2.4 Fazer o deploy
Clique em **Deploy**. Em ~1 minuto o site estará em:
```
https://planejix.vercel.app
```

---

## Parte 3 — Atualizar o Google OAuth

No [Google Cloud Console](https://console.cloud.google.com):
1. Vá em **APIs & Services → Credentials → seu OAuth Client**
2. Em **Authorized JavaScript origins**, adicione:
   - `https://planejix.vercel.app`
3. Em **Authorized redirect URIs**, adicione:
   - `https://planejix.vercel.app`
4. Salve

---

## Atualizações futuras

Para atualizar o app depois de fazer mudanças:

**Frontend** — automático. Cada push para o GitHub gera um novo deploy no Vercel.

**Backend** — na VM Oracle:
```bash
cd /home/ubuntu/planejix
git pull
cd backend && npm install --production
pm2 restart planejix-api
```

---

## Comandos úteis na VM

```bash
pm2 status                    # ver se o backend está rodando
pm2 logs planejix-api         # ver logs em tempo real
pm2 restart planejix-api      # reiniciar o backend
sudo systemctl status nginx   # ver status do Nginx
```
