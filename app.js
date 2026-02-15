// API Base URL
const API_URL = '/api';

// État global
let allProducts = [];
let currentFilter = 'all';

// ========== Initialisation ==========
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initDateTime();
    initEventListeners();
    loadDashboard();
    loadProducts();
});

// ========== Navigation ==========
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.content-section');
    
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Mise à jour des éléments actifs
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            
            // Affichage de la section correspondante
            const sectionId = item.dataset.section;
            sections.forEach(section => section.classList.remove('active'));
            document.getElementById(`${sectionId}Section`).classList.add('active');
            
            // Mise à jour du titre
            updatePageTitle(sectionId);
            
            // Chargement des données spécifiques
            if (sectionId === 'dashboard') loadDashboard();
            if (sectionId === 'stock') loadProducts();
            if (sectionId === 'alerts') loadAlerts();
        });
    });
}

function updatePageTitle(section) {
    const titles = {
        dashboard: 'Dashboard',
        stock: 'Consulter le Stock',
        add: 'Ajouter un Produit',
        alerts: 'Alertes de Péremption'
    };
    
    document.getElementById('pageTitle').textContent = titles[section];
    document.getElementById('breadcrumbCurrent').textContent = titles[section];
}

// ========== Date & Time ==========
function initDateTime() {
    updateDateTime();
    setInterval(updateDateTime, 1000);
}

function updateDateTime() {
    const now = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    document.getElementById('currentDateTime').textContent = 
        now.toLocaleDateString('fr-FR', options);
}

// ========== Event Listeners ==========
function initEventListeners() {
    // Formulaire d'ajout
    const addForm = document.getElementById('addProductForm');
    if (addForm) {
        addForm.addEventListener('submit', handleAddProduct);
    }
    
    // Formulaire d'édition
    const editForm = document.getElementById('editProductForm');
    if (editForm) {
        editForm.addEventListener('submit', handleEditProduct);
    }
    
    // Recherche
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }
    
    // Filtres
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            filterProducts();
        });
    });
    
    // Fermeture du modal
    const closeModalBtns = document.querySelectorAll('.close-modal');
    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', closeModal);
    });
    
    // Date d'aujourd'hui par défaut
    const today = new Date().toISOString().split('T')[0];
    const entryDateInput = document.getElementById('productEntryDate');
    if (entryDateInput) entryDateInput.value = today;
}

// ========== Dashboard ==========
async function loadDashboard() {
    try {
        const [products, stats] = await Promise.all([
            fetch(`${API_URL}/products`).then(r => r.json()),
            fetch(`${API_URL}/stats`).then(r => r.json())
        ]);
        
        // Mise à jour des statistiques
        document.getElementById('totalProducts').textContent = stats.totalProducts;
        document.getElementById('totalQuantity').textContent = stats.totalQuantity;
        document.getElementById('totalValue').textContent = `${stats.totalValue} FCFA`;
        document.getElementById('warningCount').textContent = stats.warningCount + stats.expiredCount;
        
        // Graphique de statut
        const total = stats.goodCount + stats.warningCount + stats.expiredCount;
        document.getElementById('goodBar').style.width = `${(stats.goodCount / total * 100) || 0}%`;
        document.getElementById('warningBar').style.width = `${(stats.warningCount / total * 100) || 0}%`;
        document.getElementById('expiredBar').style.width = `${(stats.expiredCount / total * 100) || 0}%`;
        
        document.getElementById('goodCount').textContent = stats.goodCount;
        document.getElementById('warningCountChart').textContent = stats.warningCount;
        document.getElementById('expiredCount').textContent = stats.expiredCount;
        
        // Statistiques par catégorie
        renderCategoryStats(stats.categoryStats);
        
        // Produits récents
        renderRecentProducts(products.slice(0, 5));
        
    } catch (error) {
        console.error('Erreur chargement dashboard:', error);
        showNotification('Erreur de chargement des données', 'error');
    }
}

function renderCategoryStats(categoryStats) {
    const container = document.getElementById('categoryStats');
    const html = Object.entries(categoryStats)
        .map(([category, data]) => `
            <div class="category-item">
                <span class="category-name">${category}</span>
                <div class="category-count">
                    ${data.count} produits • ${data.quantity} unités
                </div>
            </div>
        `).join('');
    
    container.innerHTML = html || '<p class="text-center" style="color: #94a3b8;">Aucune donnée</p>';
}

function renderRecentProducts(products) {
    const container = document.getElementById('recentProducts');
    const html = products.map(p => `
        <div class="recent-item">
            <div class="recent-info">
                <h4>${p.name}</h4>
                <p class="recent-meta">
                    ${p.category} • ${p.qty} unités • ${p.origin}
                </p>
            </div>
            <span class="recent-badge badge-${p.status}">${getStatusText(p.status)}</span>
        </div>
    `).join('');
    
    container.innerHTML = html || '<p class="text-center" style="color: #94a3b8;">Aucun produit récent</p>';
}

// ========== Products ==========
async function loadProducts() {
    try {
        const response = await fetch(`${API_URL}/products`);
        allProducts = await response.json();
        filterProducts();
    } catch (error) {
        console.error('Erreur chargement produits:', error);
        showNotification('Erreur de chargement des produits', 'error');
    }
}

function filterProducts() {
    let filtered = allProducts;
    
    if (currentFilter !== 'all') {
        filtered = allProducts.filter(p => p.status === currentFilter);
    }
    
    renderProducts(filtered);
}

function renderProducts(products) {
    const tbody = document.getElementById('productTableBody');
    
    if (products.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="10" class="text-center" style="padding: 3rem; color: #94a3b8;">
                    <i class="fas fa-inbox" style="font-size: 3rem; margin-bottom: 1rem; display: block;"></i>
                    Aucun produit trouvé
                </td>
            </tr>
        `;
        return;
    }
    
    const html = products.map(p => `
        <tr>
            <td>${p.id}</td>
            <td><strong>${p.name}</strong></td>
            <td>${p.category}</td>
            <td><strong>${p.qty}</strong> unités</td>
            <td>${p.origin}</td>
            <td>${formatDate(p.entryDate)}</td>
            <td>${formatDate(p.expiryDate)}</td>
            <td>
                <strong style="color: ${getDaysColor(p.daysRemaining)}">
                    ${getDaysText(p.daysRemaining)}
                </strong>
            </td>
            <td>
                <span class="status-badge ${p.status}">
                    ${getStatusText(p.status)}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn-icon btn-edit" onclick="openEditModal(${p.id})" title="Modifier">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-delete" onclick="deleteProduct(${p.id})" title="Supprimer">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
    
    tbody.innerHTML = html;
}

function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    const filtered = allProducts.filter(p => 
        p.name.toLowerCase().includes(searchTerm) ||
        p.category.toLowerCase().includes(searchTerm) ||
        p.origin.toLowerCase().includes(searchTerm)
    );
    renderProducts(filtered);
}

// ========== Add Product ==========
async function handleAddProduct(e) {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('productName').value,
        category: document.getElementById('productCategory').value,
        qty: document.getElementById('productQty').value,
        unitPrice: document.getElementById('productPrice').value || 0,
        origin: document.getElementById('productOrigin').value,
        supplier: document.getElementById('productSupplier').value || 'Non spécifié',
        entryDate: document.getElementById('productEntryDate').value,
        expiryDate: document.getElementById('productExpiryDate').value
    };
    
    // Validation
    if (new Date(formData.expiryDate) < new Date(formData.entryDate)) {
        showNotification('La date de péremption doit être après la date d\'arrivée', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/products`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            showNotification('Produit ajouté avec succès', 'success');
            e.target.reset();
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('productEntryDate').value = today;
            loadProducts();
            loadDashboard();
        } else {
            throw new Error('Erreur lors de l\'ajout');
        }
    } catch (error) {
        console.error('Erreur ajout produit:', error);
        showNotification('Erreur lors de l\'ajout du produit', 'error');
    }
}

// ========== Edit Product ==========
function openEditModal(id) {
    const product = allProducts.find(p => p.id === id);
    if (!product) return;
    
    document.getElementById('editProductId').value = product.id;
    document.getElementById('editProductName').value = product.name;
    document.getElementById('editProductCategory').value = product.category;
    document.getElementById('editProductQty').value = product.qty;
    document.getElementById('editProductPrice').value = product.unitPrice || 0;
    document.getElementById('editProductOrigin').value = product.origin;
    document.getElementById('editProductSupplier').value = product.supplier;
    document.getElementById('editProductEntryDate').value = product.entryDate;
    document.getElementById('editProductExpiryDate').value = product.expiryDate;
    
    document.getElementById('editModal').classList.add('active');
}

function closeModal() {
    document.getElementById('editModal').classList.remove('active');
}

async function handleEditProduct(e) {
    e.preventDefault();
    
    const id = document.getElementById('editProductId').value;
    const formData = {
        name: document.getElementById('editProductName').value,
        category: document.getElementById('editProductCategory').value,
        qty: document.getElementById('editProductQty').value,
        unitPrice: document.getElementById('editProductPrice').value || 0,
        origin: document.getElementById('editProductOrigin').value,
        supplier: document.getElementById('editProductSupplier').value,
        entryDate: document.getElementById('editProductEntryDate').value,
        expiryDate: document.getElementById('editProductExpiryDate').value
    };
    
    try {
        const response = await fetch(`${API_URL}/products/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            showNotification('Produit modifié avec succès', 'success');
            closeModal();
            loadProducts();
            loadDashboard();
        } else {
            throw new Error('Erreur lors de la modification');
        }
    } catch (error) {
        console.error('Erreur modification produit:', error);
        showNotification('Erreur lors de la modification', 'error');
    }
}

// ========== Delete Product ==========
async function deleteProduct(id) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) return;
    
    try {
        const response = await fetch(`${API_URL}/products/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showNotification('Produit supprimé avec succès', 'success');
            loadProducts();
            loadDashboard();
        } else {
            throw new Error('Erreur lors de la suppression');
        }
    } catch (error) {
        console.error('Erreur suppression produit:', error);
        showNotification('Erreur lors de la suppression', 'error');
    }
}

// ========== Alerts ==========
async function loadAlerts() {
    try {
        const response = await fetch(`${API_URL}/products`);
        const products = await response.json();
        
        const warningProducts = products.filter(p => p.status === 'warning');
        const expiredProducts = products.filter(p => p.status === 'expired');
        
        renderAlertProducts('warningProducts', warningProducts, 'warning');
        renderAlertProducts('expiredProducts', expiredProducts, 'expired');
        
    } catch (error) {
        console.error('Erreur chargement alertes:', error);
        showNotification('Erreur de chargement des alertes', 'error');
    }
}

function renderAlertProducts(containerId, products, type) {
    const container = document.getElementById(containerId);
    
    if (products.length === 0) {
        container.innerHTML = `
            <p class="text-center" style="color: #94a3b8; padding: 2rem;">
                <i class="fas fa-check-circle" style="font-size: 2rem; display: block; margin-bottom: 0.5rem;"></i>
                ${type === 'warning' ? 'Aucun produit à surveiller' : 'Aucun produit périmé'}
            </p>
        `;
        return;
    }
    
    const html = products.map(p => `
        <div class="alert-item ${type}">
            <div class="alert-info">
                <h4>${p.name}</h4>
                <div class="alert-details">
                    <span><i class="fas fa-layer-group"></i> ${p.category}</span>
                    <span><i class="fas fa-cubes"></i> ${p.qty} unités</span>
                    <span><i class="fas fa-calendar"></i> ${formatDate(p.expiryDate)}</span>
                </div>
            </div>
            <div class="alert-days ${type}">
                ${p.daysRemaining <= 0 ? 'PÉRIMÉ' : `${p.daysRemaining}j`}
            </div>
        </div>
    `).join('');
    
    container.innerHTML = html;
}

// ========== Utility Functions ==========
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
    });
}

function getDaysText(days) {
    if (days < 0) return 'Périmé';
    if (days === 0) return 'Aujourd\'hui';
    if (days === 1) return '1 jour';
    return `${days} jours`;
}

function getDaysColor(days) {
    if (days <= 0) return '#ef4444';
    if (days <= 7) return '#f59e0b';
    return '#10b981';
}

function getStatusText(status) {
    const statuses = {
        good: '✓ Bon état',
        warning: '⚠ Attention',
        expired: '✕ Périmé'
    };
    return statuses[status] || status;
}

function showNotification(message, type = 'info') {
    // Créer la notification
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        z-index: 9999;
        animation: slideIn 0.3s ease;
        font-weight: 500;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Retirer après 3 secondes
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Animations CSS dynamiques
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);
