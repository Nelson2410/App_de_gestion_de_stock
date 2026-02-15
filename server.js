const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;
const DB_PATH = path.join(__dirname, 'data', 'db.json');

// --- MIDDLEWARES ---
app.use(cors());
app.use(express.json());

/**
 * Lit les données du fichier JSON
 */
const readDB = () => {
    try {
        if (!fs.existsSync(DB_PATH)) {
            if (!fs.existsSync(path.dirname(DB_PATH))) {
                fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
            }
            const initialData = {
                products: [
                    {
                        id: 1,
                        name: "Lait UHT 1L",
                        qty: 150,
                        origin: "France",
                        entryDate: "2026-02-10",
                        expiryDate: "2026-03-15",
                        category: "Produits Laitiers",
                        supplier: "Lactalis",
                        unitPrice: 1.20
                    },
                    {
                        id: 2,
                        name: "Pain de Campagne",
                        qty: 45,
                        origin: "Côte d'Ivoire",
                        entryDate: "2026-02-15",
                        expiryDate: "2026-02-18",
                        category: "Boulangerie",
                        supplier: "Boulangerie Locale",
                        unitPrice: 2.50
                    },
                    {
                        id: 3,
                        name: "Tomates Fraîches",
                        qty: 80,
                        origin: "Sénégal",
                        entryDate: "2026-02-14",
                        expiryDate: "2026-02-25",
                        category: "Fruits & Légumes",
                        supplier: "Maraîchers du Sud",
                        unitPrice: 0.80
                    }
                ]
            };
            fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2));
            return initialData;
        }
        return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    } catch (err) {
        console.error("Erreur de lecture :", err);
        return { products: [] };
    }
};

/**
 * Sauvegarde les données dans le fichier JSON
 */
const writeDB = (data) => {
    try {
        fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
    } catch (err) {
        console.error("Erreur d'écriture :", err);
    }
};

/**
 * Calcule les jours restants avant expiration
 */
const calculateDaysRemaining = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
};

// --- ROUTES API ---

// [READ] Obtenir tous les produits avec calcul du temps restant
app.get('/api/products', (req, res) => {
    const data = readDB();
    const productsWithStatus = data.products.map(p => ({
        ...p,
        daysRemaining: calculateDaysRemaining(p.expiryDate),
        status: calculateDaysRemaining(p.expiryDate) <= 0 ? 'expired' : 
                calculateDaysRemaining(p.expiryDate) <= 7 ? 'warning' : 'good'
    }));
    res.json(productsWithStatus);
});

// [READ] Obtenir les statistiques du dashboard
app.get('/api/stats', (req, res) => {
    const data = readDB();
    const products = data.products;
    
    const totalProducts = products.length;
    const totalQuantity = products.reduce((sum, p) => sum + p.qty, 0);
    const totalValue = products.reduce((sum, p) => sum + (p.qty * (p.unitPrice || 0)), 0);
    
    const expiredCount = products.filter(p => calculateDaysRemaining(p.expiryDate) <= 0).length;
    const warningCount = products.filter(p => {
        const days = calculateDaysRemaining(p.expiryDate);
        return days > 0 && days <= 7;
    }).length;
    const goodCount = products.filter(p => calculateDaysRemaining(p.expiryDate) > 7).length;
    
    const categoryStats = {};
    products.forEach(p => {
        if (!categoryStats[p.category]) {
            categoryStats[p.category] = { count: 0, quantity: 0 };
        }
        categoryStats[p.category].count++;
        categoryStats[p.category].quantity += p.qty;
    });
    
    res.json({
        totalProducts,
        totalQuantity,
        totalValue: totalValue.toFixed(2),
        expiredCount,
        warningCount,
        goodCount,
        categoryStats
    });
});

// [CREATE] Ajouter un produit
app.post('/api/products', (req, res) => {
    const { name, qty, origin, entryDate, expiryDate, category, supplier, unitPrice } = req.body;
    
    if (!name || qty === undefined || !origin || !entryDate || !expiryDate || !category) {
        return res.status(400).json({ error: "Champs requis manquants" });
    }

    const data = readDB();
    const newProduct = {
        id: Date.now(),
        name,
        qty: parseInt(qty),
        origin,
        entryDate,
        expiryDate,
        category,
        supplier: supplier || 'Non spécifié',
        unitPrice: parseFloat(unitPrice) || 0
    };
    
    data.products.push(newProduct);
    writeDB(data);
    
    res.status(201).json({
        ...newProduct,
        daysRemaining: calculateDaysRemaining(newProduct.expiryDate),
        status: calculateDaysRemaining(newProduct.expiryDate) <= 0 ? 'expired' : 
                calculateDaysRemaining(newProduct.expiryDate) <= 7 ? 'warning' : 'good'
    });
});

// [UPDATE] Modifier un produit
app.put('/api/products/:id', (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const data = readDB();
    const index = data.products.findIndex(p => p.id == id);

    if (index !== -1) {
        data.products[index] = { ...data.products[index], ...updates };
        if (updates.qty !== undefined) {
            data.products[index].qty = parseInt(updates.qty);
        }
        if (updates.unitPrice !== undefined) {
            data.products[index].unitPrice = parseFloat(updates.unitPrice);
        }
        writeDB(data);
        
        const updated = data.products[index];
        return res.json({
            ...updated,
            daysRemaining: calculateDaysRemaining(updated.expiryDate),
            status: calculateDaysRemaining(updated.expiryDate) <= 0 ? 'expired' : 
                    calculateDaysRemaining(updated.expiryDate) <= 7 ? 'warning' : 'good'
        });
    }
    res.status(404).json({ error: "Produit non trouvé" });
});

// [DELETE] Supprimer un produit
app.delete('/api/products/:id', (req, res) => {
    const { id } = req.params;
    let data = readDB();
    const initialLength = data.products.length;
    data.products = data.products.filter(p => p.id != id);

    if (data.products.length === initialLength) {
        return res.status(404).json({ error: "Produit non trouvé" });
    }

    writeDB(data);
    res.json({ message: "Produit supprimé avec succès" });
});

// Démarrage du serveur
app.listen(PORT, '127.0.0.1', () => {
    console.log(`✅ Backend ERP actif sur http://127.0.0.1:${PORT}`);
    console.log(`📊 Base de données : ${DB_PATH}`);
});
