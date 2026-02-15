# 📦 ERP Pro - Système de Gestion de Stock Modernisé

## ✨ Fonctionnalités

### Dashboard Professionnel
- 📊 Statistiques en temps réel (produits, quantités, valeur totale)
- 📈 Graphiques de répartition par statut
- 🏷️ Analyse par catégorie
- 🔔 Alertes de péremption

### Gestion Complète des Produits
- **Informations détaillées** : Nom, catégorie, quantité, provenance, fournisseur, prix unitaire
- **Dates importantes** : Date d'arrivée en stock, date de péremption
- **Calcul automatique** : Temps restant avant péremption
- **Statuts intelligents** : ✓ Bon état / ⚠ Attention (≤7 jours) / ✕ Périmé

### Interface Moderne
- 🎨 Design professionnel avec animations fluides
- 📱 Responsive (PC, tablette, mobile)
- 🔍 Recherche en temps réel
- 🎯 Filtres par statut
- ⚡ Navigation rapide

## 🚀 Installation sur Debian

### 1. Prérequis

```bash
# Mise à jour du système
sudo apt update && sudo apt upgrade -y

# Installation de Node.js (version LTS)
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt install -y nodejs

# Installation de Nginx
sudo apt install -y nginx

# Vérifier les installations
node --version
npm --version
nginx -v
```

### 2. Structure des dossiers

```bash
# Créer la structure
sudo mkdir -p /var/www/mini-erp-pro/frontend
sudo mkdir -p /var/www/mini-erp-pro/backend
sudo mkdir -p /var/www/mini-erp-pro/backend/data

# Définir les permissions
sudo chown -R $USER:$USER /var/www/mini-erp-pro
```

### 3. Déploiement du Frontend

```bash
# Copier les fichiers frontend
sudo cp index.html /var/www/mini-erp-pro/frontend/
sudo mkdir -p /var/www/mini-erp-pro/frontend/css
sudo mkdir -p /var/www/mini-erp-pro/frontend/js
sudo cp style.css /var/www/mini-erp-pro/frontend/css/
sudo cp app.js /var/www/mini-erp-pro/frontend/js/

# Vérifier les permissions
sudo chown -R www-data:www-data /var/www/mini-erp-pro/frontend
sudo chmod -R 755 /var/www/mini-erp-pro/frontend
```

### 4. Déploiement du Backend

```bash
# Copier les fichiers backend
sudo cp server.js /var/www/mini-erp-pro/backend/
sudo cp package.json /var/www/mini-erp-pro/backend/

# Installer les dépendances
cd /var/www/mini-erp-pro/backend
sudo npm install

# Permissions
sudo chown -R $USER:$USER /var/www/mini-erp-pro/backend
```

### 5. Configuration Nginx

```bash
# Copier la configuration
sudo cp erp.conf /etc/nginx/sites-available/erp-pro

# Créer le lien symbolique
sudo ln -s /etc/nginx/sites-available/erp-pro /etc/nginx/sites-enabled/

# Supprimer la config par défaut (optionnel)
sudo rm /etc/nginx/sites-enabled/default

# Tester la configuration
sudo nginx -t

# Redémarrer Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### 6. Service systemd pour Node.js (démarrage automatique)

Créer le fichier de service :

```bash
sudo nano /etc/systemd/system/erp-backend.service
```

Contenu du fichier :

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
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=erp-backend

Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Activer et démarrer le service :

```bash
# Recharger systemd
sudo systemctl daemon-reload

# Démarrer le service
sudo systemctl start erp-backend

# Activer au démarrage
sudo systemctl enable erp-backend

# Vérifier le statut
sudo systemctl status erp-backend
```

### 7. Configuration Pare-feu (optionnel)

```bash
# Autoriser HTTP
sudo ufw allow 80/tcp

# Autoriser HTTPS (si vous configurez SSL plus tard)
sudo ufw allow 443/tcp

# Activer le pare-feu
sudo ufw enable
```

## 📝 Utilisation

### Accès à l'application

Ouvrez votre navigateur et accédez à :
- **URL locale** : `http://localhost`
- **Depuis le réseau** : `http://[IP_DE_VOTRE_VM]`

### Navigation

1. **Dashboard** : Vue d'ensemble avec statistiques et graphiques
2. **Consulter le Stock** : Liste complète des produits avec filtres et recherche
3. **Ajouter Produit** : Formulaire d'enregistrement complet
4. **Alertes Péremption** : Surveillance des produits à risque

### Gestion des produits

- **Ajouter** : Remplir le formulaire avec toutes les informations requises
- **Modifier** : Cliquer sur l'icône ✏️ dans le tableau
- **Supprimer** : Cliquer sur l'icône 🗑️ (avec confirmation)
- **Rechercher** : Utiliser la barre de recherche
- **Filtrer** : Utiliser les boutons "Tous", "Bon état", "Attention", "Périmés"

## 🔧 Maintenance

### Vérifier les logs

```bash
# Logs Nginx
sudo tail -f /var/log/nginx/erp-pro-access.log
sudo tail -f /var/log/nginx/erp-pro-error.log

# Logs Backend
sudo journalctl -u erp-backend -f
```

### Redémarrer les services

```bash
# Redémarrer Nginx
sudo systemctl restart nginx

# Redémarrer le backend
sudo systemctl restart erp-backend

# Redémarrer les deux
sudo systemctl restart nginx erp-backend
```

### Sauvegarder les données

```bash
# Sauvegarder la base de données
cp /var/www/mini-erp-pro/backend/data/db.json ~/backup-erp-$(date +%Y%m%d).json

# Ou avec un script automatique
sudo crontab -e
# Ajouter : 0 2 * * * cp /var/www/mini-erp-pro/backend/data/db.json /root/backup-erp-$(date +\%Y\%m\%d).json
```

## 🎨 Personnalisation

### Modifier les couleurs

Éditez `/var/www/mini-erp-pro/frontend/css/style.css` :

```css
:root {
    --primary-color: #4f46e5;    /* Couleur principale */
    --secondary-color: #10b981;  /* Couleur secondaire */
    --danger-color: #ef4444;     /* Couleur danger */
    --warning-color: #f59e0b;    /* Couleur attention */
}
```

### Ajouter des catégories

Éditez `/var/www/mini-erp-pro/frontend/index.html` et ajoutez dans les `<select>` :

```html
<option value="Nouvelle Catégorie">Nouvelle Catégorie</option>
```

## 🔒 Sécurité (Production)

### 1. Installer un certificat SSL (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d votre-domaine.com
```

### 2. Renforcer Nginx

```bash
# Modifier /etc/nginx/nginx.conf
sudo nano /etc/nginx/nginx.conf

# Ajouter dans http {}
client_max_body_size 10M;
client_body_timeout 12;
client_header_timeout 12;
keepalive_timeout 15;
send_timeout 10;
```

### 3. Limiter l'accès API

Dans `/etc/nginx/sites-available/erp-pro`, ajoutez :

```nginx
# Limiter le nombre de requêtes
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

location /api/ {
    limit_req zone=api_limit burst=20 nodelay;
    # ... reste de la configuration
}
```

## 🐛 Dépannage

### Le backend ne démarre pas

```bash
# Vérifier les logs
sudo journalctl -u erp-backend --no-pager -n 50

# Vérifier si le port 3000 est utilisé
sudo netstat -tulpn | grep 3000

# Redémarrer avec les logs
cd /var/www/mini-erp-pro/backend
node server.js
```

### Nginx affiche 502 Bad Gateway

```bash
# Vérifier que le backend tourne
sudo systemctl status erp-backend

# Vérifier la configuration Nginx
sudo nginx -t

# Voir les logs détaillés
sudo tail -f /var/log/nginx/erp-pro-error.log
```

### Les modifications ne s'affichent pas

```bash
# Vider le cache du navigateur ou utiliser Ctrl+F5

# Redémarrer Nginx
sudo systemctl restart nginx

# Vérifier les permissions
sudo chown -R www-data:www-data /var/www/mini-erp-pro/frontend
```

## 📞 Support

Pour toute question ou problème :
- Vérifiez d'abord les logs
- Consultez la documentation Nginx et Node.js
- Vérifiez les permissions des fichiers

## 📄 Licence

Ce projet est sous licence MIT.

---

**Développé avec ❤️ pour une gestion efficace de stock**
