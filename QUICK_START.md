# 🚀 Guide de Démarrage Rapide - ERP Pro

## Installation Automatique (Recommandé)

### Sur Debian/Ubuntu

```bash
# 1. Extraire le package
cd deploy-package

# 2. Exécuter le script d'installation
sudo bash install.sh

# 3. Accéder à l'application
# Ouvrir le navigateur : http://localhost
```

L'installation automatique prend environ 5 minutes et configure :
- ✅ Node.js et npm
- ✅ Nginx
- ✅ Structure des dossiers
- ✅ Service systemd (démarrage automatique)
- ✅ Base de données avec exemples

## Installation Manuelle

### 1. Frontend

```bash
sudo mkdir -p /var/www/mini-erp-pro/frontend/css /var/www/mini-erp-pro/frontend/js
sudo cp frontend/index.html /var/www/mini-erp-pro/frontend/
sudo cp frontend/css/style.css /var/www/mini-erp-pro/frontend/css/
sudo cp frontend/js/app.js /var/www/mini-erp-pro/frontend/js/
sudo chown -R www-data:www-data /var/www/mini-erp-pro/frontend
```

### 2. Backend

```bash
sudo mkdir -p /var/www/mini-erp-pro/backend/data
sudo cp backend/server.js /var/www/mini-erp-pro/backend/
sudo cp backend/package.json /var/www/mini-erp-pro/backend/
sudo cp backend/data/db.json /var/www/mini-erp-pro/backend/data/
cd /var/www/mini-erp-pro/backend
sudo npm install
```

### 3. Nginx

```bash
sudo cp erp.conf /etc/nginx/sites-available/erp-pro
sudo ln -s /etc/nginx/sites-available/erp-pro /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 4. Service Backend

Créer `/etc/systemd/system/erp-backend.service` :

```ini
[Unit]
Description=ERP Pro Backend API
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/mini-erp-pro/backend
ExecStart=/usr/bin/node server.js
Restart=always

[Install]
WantedBy=multi-user.target
```

Puis :

```bash
sudo systemctl daemon-reload
sudo systemctl start erp-backend
sudo systemctl enable erp-backend
```

## Vérification

```bash
# Vérifier le backend
sudo systemctl status erp-backend

# Vérifier Nginx
sudo systemctl status nginx

# Tester l'API
curl http://localhost/api/products
```

## Premier Lancement

1. Ouvrir : `http://localhost` ou `http://[IP-de-votre-VM]`
2. Le dashboard affiche 6 produits d'exemple
3. Explorer les différentes sections via le menu latéral

## Commandes Utiles

```bash
# Redémarrer les services
sudo systemctl restart erp-backend nginx

# Voir les logs
sudo journalctl -u erp-backend -f
sudo tail -f /var/log/nginx/erp-pro-error.log

# Sauvegarder les données
cp /var/www/mini-erp-pro/backend/data/db.json ~/backup.json
```

## Dépannage Express

**Problème** : Erreur 502 Bad Gateway
**Solution** : 
```bash
sudo systemctl status erp-backend
sudo systemctl restart erp-backend
```

**Problème** : Les fichiers ne s'affichent pas
**Solution** :
```bash
sudo chown -R www-data:www-data /var/www/mini-erp-pro
sudo systemctl restart nginx
```

## 📖 Documentation Complète

Consultez `README.md` pour :
- Instructions détaillées
- Configuration avancée
- Sécurité et SSL
- Personnalisation
- Maintenance

---

**Besoin d'aide ?** Consultez les logs avec `sudo journalctl -u erp-backend -f`
