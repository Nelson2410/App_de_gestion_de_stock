#!/bin/bash

##############################################################
# Script d'Installation ERP Pro
# Déploiement automatique sur Debian/Ubuntu
##############################################################

set -e  # Arrêter en cas d'erreur

echo "=========================================="
echo "  Installation ERP Pro"
echo "=========================================="
echo ""

# Couleurs pour l'affichage
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Vérifier si root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ Ce script doit être exécuté avec sudo${NC}"
    exit 1
fi

echo -e "${YELLOW}📦 Étape 1/8 : Mise à jour du système...${NC}"
apt update && apt upgrade -y

echo -e "${YELLOW}📦 Étape 2/8 : Installation de Node.js...${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_lts.x | bash -
    apt install -y nodejs
fi
echo -e "${GREEN}✓ Node.js $(node --version) installé${NC}"

echo -e "${YELLOW}📦 Étape 3/8 : Installation de Nginx...${NC}"
if ! command -v nginx &> /dev/null; then
    apt install -y nginx
fi
echo -e "${GREEN}✓ Nginx installé${NC}"

echo -e "${YELLOW}📦 Étape 4/8 : Création de la structure des dossiers...${NC}"
mkdir -p /var/www/mini-erp-pro/frontend/css
mkdir -p /var/www/mini-erp-pro/frontend/js
mkdir -p /var/www/mini-erp-pro/backend/data

echo -e "${YELLOW}📦 Étape 5/8 : Copie des fichiers frontend...${NC}"
cp frontend/index.html /var/www/mini-erp-pro/frontend/
cp frontend/css/style.css /var/www/mini-erp-pro/frontend/css/
cp frontend/js/app.js /var/www/mini-erp-pro/frontend/js/
chown -R www-data:www-data /var/www/mini-erp-pro/frontend
chmod -R 755 /var/www/mini-erp-pro/frontend
echo -e "${GREEN}✓ Frontend déployé${NC}"

echo -e "${YELLOW}📦 Étape 6/8 : Installation du backend...${NC}"
cp backend/server.js /var/www/mini-erp-pro/backend/
cp backend/package.json /var/www/mini-erp-pro/backend/
cp backend/data/db.json /var/www/mini-erp-pro/backend/data/

cd /var/www/mini-erp-pro/backend
npm install --production
chown -R www-data:www-data /var/www/mini-erp-pro/backend
echo -e "${GREEN}✓ Backend installé${NC}"

echo -e "${YELLOW}📦 Étape 7/8 : Configuration de Nginx...${NC}"
cp erp.conf /etc/nginx/sites-available/erp-pro
ln -sf /etc/nginx/sites-available/erp-pro /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Tester la configuration
nginx -t

systemctl restart nginx
systemctl enable nginx
echo -e "${GREEN}✓ Nginx configuré${NC}"

echo -e "${YELLOW}📦 Étape 8/8 : Configuration du service backend...${NC}"
cat > /etc/systemd/system/erp-backend.service << 'EOF'
[Unit]
Description=ERP Pro Backend API
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/mini-erp-pro/backend
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=erp-backend

Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl start erp-backend
systemctl enable erp-backend
echo -e "${GREEN}✓ Service backend configuré${NC}"

echo ""
echo "=========================================="
echo -e "${GREEN}✅ Installation terminée avec succès !${NC}"
echo "=========================================="
echo ""
echo "📍 Accédez à l'application :"
echo "   http://localhost"
echo "   http://$(hostname -I | awk '{print $1}')"
echo ""
echo "🔧 Commandes utiles :"
echo "   sudo systemctl status erp-backend"
echo "   sudo systemctl restart erp-backend"
echo "   sudo systemctl restart nginx"
echo "   sudo journalctl -u erp-backend -f"
echo ""
echo "📝 Consultez README.md pour plus d'informations"
echo ""
