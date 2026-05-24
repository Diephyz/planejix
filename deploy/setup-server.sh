#!/bin/bash
# Script de setup completo para Oracle Cloud VM (Ubuntu 22.04)
# Execute com: bash setup-server.sh

set -e

echo "=== Planejix — Setup do Servidor ==="
echo ""

# ─── Node.js 24 ───────────────────────────────────────────────
echo "[1/7] Instalando Node.js 24..."
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v && npm -v

# ─── PM2 ──────────────────────────────────────────────────────
echo "[2/7] Instalando PM2..."
sudo npm install -g pm2

# ─── Nginx ────────────────────────────────────────────────────
echo "[3/7] Instalando Nginx..."
sudo apt-get install -y nginx

# ─── Certbot (SSL gratuito via Let's Encrypt) ─────────────────
echo "[4/7] Instalando Certbot..."
sudo apt-get install -y certbot python3-certbot-nginx

# ─── Clonar repositório ───────────────────────────────────────
echo "[5/7] Clonando repositório..."
cd /home/ubuntu
git clone https://github.com/Diephyz/planejix.git
cd planejix

# ─── Backend ──────────────────────────────────────────────────
echo "[6/7] Configurando backend..."
cd backend
npm install --production

echo ""
echo ">>> Agora crie o arquivo .env:"
echo "    nano /home/ubuntu/planejix/backend/.env"
echo ""
echo "    Conteúdo necessário:"
echo "    PORT=3001"
echo "    JWT_SECRET=$(openssl rand -base64 48)"
echo "    GOOGLE_CLIENT_ID=seu-google-client-id"
echo "    FRONTEND_URL=https://SEU-PROJETO.vercel.app"
echo ""
read -p "Pressione Enter depois de criar o .env para continuar..."

# ─── Iniciar backend com PM2 ──────────────────────────────────
echo "[7/7] Iniciando backend com PM2..."
cd /home/ubuntu/planejix/backend
pm2 start server.js --name planejix-api
pm2 save
pm2 startup | tail -1 | sudo bash

echo ""
echo "=== Backend rodando! Testando... ==="
sleep 2
curl -s http://localhost:3001/api/auth/login \
  -X POST -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}' | head -c 100
echo ""
echo "=== Setup do backend concluído! ==="
