/**
 * Bakery Management System - Application Controller
 * Handles UI interactions, tab switching, forms, POS cart state, rendering, and authentication
 */

// Application State
let activeTab = "dashboard";
let posCart = []; // Array of { id, name, price, quantity, icon }
let selectedPOSCategory = "ALL";

// Initialize application on DOM load
document.addEventListener("DOMContentLoaded", () => {
  setupNavigation();
  checkAuth();
});

// ==========================================
// 0. AUTHENTICATION & LOGIN CONTROLLER
// ==========================================

function checkAuth() {
  const currentUser = store.getCurrentUser();
  const loginOverlay = document.getElementById("login-overlay");

  if (!currentUser) {
    loginOverlay.classList.remove("hidden");
  } else {
    loginOverlay.classList.add("hidden");
    updateUserProfileUI(currentUser);
    applyRolePermissions(currentUser.role);
    renderActiveView();
  }
}

function fillDemoCredentials(username, password) {
  document.getElementById("login-username").value = username;
  document.getElementById("login-password").value = password;
  document.getElementById("login-error-msg").classList.add("hidden");
}

function togglePasswordVisibility() {
  const pwInput = document.getElementById("login-password");
  const icon = document.getElementById("toggle-pw-icon");
  if (pwInput.type === "password") {
    pwInput.type = "text";
    icon.className = "fa-solid fa-eye-slash";
  } else {
    pwInput.type = "password";
    icon.className = "fa-solid fa-eye";
  }
}

function handleLoginSubmit(e) {
  e.preventDefault();
  const username = document.getElementById("login-username").value;
  const password = document.getElementById("login-password").value;
  const errorMsg = document.getElementById("login-error-msg");

  const result = store.loginUser(username, password);

  if (result.success) {
    errorMsg.classList.add("hidden");
    document.getElementById("login-overlay").classList.add("hidden");
    document.getElementById("login-form").reset();

    updateUserProfileUI(result.user);
    applyRolePermissions(result.user.role);
    showToast(`Welcome back, ${result.user.name}! (${result.user.role})`, "success");
    renderActiveView();
  } else {
    errorMsg.textContent = result.message;
    errorMsg.classList.remove("hidden");
  }
}

function handleLogout() {
  if (confirm("Are you sure you want to log out?")) {
    store.logoutUser();
    document.getElementById("login-overlay").classList.remove("hidden");
    showToast("Logged out successfully.", "info");
  }
}

function updateUserProfileUI(user) {
  document.getElementById("user-avatar-icon").textContent = user.avatar || "👤";
  document.getElementById("user-display-name").textContent = user.name || user.username;
  document.getElementById("user-display-role").textContent = user.role === "Admin" ? "System Administrator" : "Cashier / Staff";
}

function applyRolePermissions(role) {
  const adminBtns = document.querySelectorAll(".admin-only-btn");
  const settingsTabLink = document.querySelector('a[data-tab="settings"]');

  if (role === "Cashier") {
    adminBtns.forEach(btn => btn.classList.add("hidden"));
    if (settingsTabLink) settingsTabLink.classList.add("hidden");
  } else {
    adminBtns.forEach(btn => btn.classList.remove("hidden"));
    if (settingsTabLink) settingsTabLink.classList.remove("hidden");
  }
}

// ==========================================
// 1. NAVIGATION & TAB ROUTING
// ==========================================

function setupNavigation() {
  const navLinks = document.querySelectorAll(".nav-link");
  navLinks.forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const tabName = link.getAttribute("data-tab");
      switchTab(tabName);
    });
  });

  // Handle URL Hash if present
  const hash = window.location.hash.replace("#", "");
  if (hash && ["dashboard", "products", "pos", "orders", "inventory", "customers", "settings"].includes(hash)) {
    switchTab(hash);
  }
}

function switchTab(tabName) {
  activeTab = tabName;
  window.location.hash = tabName;

  // Update active sidebar link state
  document.querySelectorAll(".nav-link").forEach(link => {
    if (link.getAttribute("data-tab") === tabName) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });

  // Update Header Title
  const titleMap = {
    dashboard: { title: "Dashboard", sub: "Overview of bakery sales, inventory & orders" },
    products: { title: "Products Menu (CRUD)", sub: "Manage bakery menu items, prices, and categories" },
    pos: { title: "Point of Sale (POS)", sub: "Quick billing counter & instant invoice generation" },
    orders: { title: "Order History", sub: "View past sales, update order status, and reprint receipts" },
    inventory: { title: "Inventory & Stock Control", sub: "Monitor item stock levels & restock warnings" },
    customers: { title: "Customer Database", sub: "Manage customer profiles & purchase histories" },
    settings: { title: "Data Backup & Restore", sub: "Export/Import backup files and system settings" }
  };

  if (titleMap[tabName]) {
    document.getElementById("page-title").textContent = titleMap[tabName].title;
    document.getElementById("page-subtitle").textContent = titleMap[tabName].sub;
  }

  // Show corresponding view section
  document.querySelectorAll(".tab-view").forEach(view => {
    view.classList.add("hidden");
  });
  const currentView = document.getElementById(`view-${tabName}`);
  if (currentView) {
    currentView.classList.remove("hidden");
  }

  renderActiveView();
}

function renderActiveView() {
  if (!store.getCurrentUser()) return;

  switch (activeTab) {
    case "dashboard":
      renderDashboard();
      break;
    case "products":
      renderProductsTable();
      break;
    case "pos":
      renderPOSGrid();
      renderPOSCart();
      break;
    case "orders":
      renderOrdersTable();
      break;
    case "inventory":
      renderInventoryTable();
      break;
    case "customers":
      renderCustomersTable();
      break;
    case "settings":
      break;
  }
}

// ==========================================
// 2. DASHBOARD VIEW CONTROLLER
// ==========================================

function renderDashboard() {
  const stats = store.getDashboardStats();

  document.getElementById("stat-revenue").textContent = `৳ ${stats.totalRevenue.toLocaleString()}`;
  document.getElementById("stat-orders").textContent = stats.totalOrdersCount;
  document.getElementById("stat-products").textContent = stats.totalProductsCount;
  document.getElementById("stat-low-stock").textContent = stats.lowStockCount;

  // Render Dashboard Recent Orders
  const recentOrdersTbody = document.getElementById("dash-recent-orders-list");
  if (stats.recentOrders.length === 0) {
    recentOrdersTbody.innerHTML = `<tr><td colspan="5" class="py-6 text-center text-slate-400">No orders logged yet.</td></tr>`;
  } else {
    recentOrdersTbody.innerHTML = stats.recentOrders.map(o => `
      <tr class="hover:bg-slate-50/80">
        <td class="py-3 font-semibold text-slate-900">${o.id}</td>
        <td class="py-3">${escapeHTML(o.customerName)}</td>
        <td class="py-3 text-slate-500">${o.date}</td>
        <td class="py-3 text-right font-bold text-slate-800">৳ ${o.grandTotal}</td>
        <td class="py-3 text-center">${getStatusBadge(o.status)}</td>
      </tr>
    `).join("");
  }

  // Render Low Stock Warnings List
  const lowStockContainer = document.getElementById("dash-low-stock-list");
  if (stats.lowStockItems.length === 0) {
    lowStockContainer.innerHTML = `<div class="p-6 text-center text-slate-400 text-xs bg-slate-50 rounded-xl">All products have sufficient stock! 👍</div>`;
  } else {
    lowStockContainer.innerHTML = stats.lowStockItems.map(item => `
      <div class="flex items-center justify-between p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl text-xs">
        <div class="flex items-center gap-3">
          <span class="text-xl">${item.icon || '🧁'}</span>
          <div>
            <p class="font-semibold text-slate-900">${escapeHTML(item.name)}</p>
            <p class="text-[11px] text-amber-700">Stock: <span class="font-bold">${item.stock}</span> ${item.unit || 'Pcs'}</p>
          </div>
        </div>
        <button onclick="quickRestockItem('${item.id}')" class="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-[11px] rounded-lg shadow-sm transition">
          + Restock
        </button>
      </div>
    `).join("");
  }
}

function getStatusBadge(status) {
  switch (status) {
    case "Completed":
      return `<span class="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[10px]">Completed</span>`;
    case "Pending":
      return `<span class="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full font-bold text-[10px]">Pending</span>`;
    case "Cancelled":
      return `<span class="px-2.5 py-1 bg-rose-100 text-rose-800 rounded-full font-bold text-[10px]">Cancelled</span>`;
    default:
      return `<span class="px-2.5 py-1 bg-slate-100 text-slate-800 rounded-full font-bold text-[10px]">${status}</span>`;
  }
}

// ==========================================
// 3. PRODUCTS MENU VIEW (CRUD)
// ==========================================

function renderProductsTable() {
  const search = document.getElementById("prod-search-input").value.toLowerCase();
  const categoryFilter = document.getElementById("prod-category-filter").value;
  let products = store.getProducts();

  // Apply filters
  if (categoryFilter !== "ALL") {
    products = products.filter(p => p.category === categoryFilter);
  }
  if (search) {
    products = products.filter(p => p.name.toLowerCase().includes(search) || p.category.toLowerCase().includes(search) || p.id.toLowerCase().includes(search));
  }

  const currentUser = store.getCurrentUser();
  const isAdmin = currentUser && currentUser.role === "Admin";

  const tbody = document.getElementById("products-table-body");
  if (products.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="py-12 text-center text-slate-400">No products found matching your filter.</td></tr>`;
    return;
  }

  tbody.innerHTML = products.map(p => `
    <tr class="hover:bg-slate-50/80 transition">
      <td class="px-6 py-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center text-xl flex-shrink-0">
            ${p.icon || '🧁'}
          </div>
          <div>
            <p class="font-bold text-slate-900">${escapeHTML(p.name)}</p>
            <p class="text-[11px] text-slate-400">ID: ${p.id} ${p.description ? '• ' + escapeHTML(p.description) : ''}</p>
          </div>
        </div>
      </td>
      <td class="px-6 py-4">
        <span class="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-[11px] font-semibold">${p.category}</span>
      </td>
      <td class="px-6 py-4 text-right font-extrabold text-slate-900">৳ ${p.price}</td>
      <td class="px-6 py-4 text-right text-slate-500">৳ ${p.cost || 0}</td>
      <td class="px-6 py-4 text-center">
        ${p.stock < 10 
          ? `<span class="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full font-bold text-[11px]">${p.stock} ${p.unit || 'Pcs'} (Low)</span>` 
          : `<span class="px-2.5 py-1 bg-slate-100 text-slate-800 rounded-full font-semibold text-[11px]">${p.stock} ${p.unit || 'Pcs'}</span>`}
      </td>
      <td class="px-6 py-4 text-center">
        ${isAdmin ? `
          <div class="flex items-center justify-center gap-2">
            <button onclick="openEditProductModal('${p.id}')" title="Edit Product" class="w-8 h-8 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 flex items-center justify-center transition">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button onclick="deleteProductItem('${p.id}')" title="Delete Product" class="w-8 h-8 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 flex items-center justify-center transition">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        ` : `<span class="text-slate-400 text-[11px]">Read-only</span>`}
      </td>
    </tr>
  `).join("");
}

// Product Form Modal Handlers
function openAddProductModal() {
  document.getElementById("modal-product-title").textContent = "Add New Bakery Product";
  document.getElementById("form-product").reset();
  document.getElementById("prod-id-input").value = "";
  document.getElementById("prod-icon-input").value = "🎂";
  document.getElementById("modal-product").classList.remove("hidden");
}

function openEditProductModal(id) {
  const prod = store.getProductById(id);
  if (!prod) return;

  document.getElementById("modal-product-title").textContent = `Edit Product (${prod.id})`;
  document.getElementById("prod-id-input").value = prod.id;
  document.getElementById("prod-name-input").value = prod.name;
  document.getElementById("prod-category-input").value = prod.category;
  document.getElementById("prod-icon-input").value = prod.icon || "🎂";
  document.getElementById("prod-price-input").value = prod.price;
  document.getElementById("prod-cost-input").value = prod.cost || 0;
  document.getElementById("prod-stock-input").value = prod.stock;
  document.getElementById("prod-desc-input").value = prod.description || "";

  document.getElementById("modal-product").classList.remove("hidden");
}

function closeProductModal() {
  document.getElementById("modal-product").classList.add("hidden");
}

function handleProductFormSubmit(e) {
  e.preventDefault();
  const id = document.getElementById("prod-id-input").value;
  const productData = {
    name: document.getElementById("prod-name-input").value.trim(),
    category: document.getElementById("prod-category-input").value,
    icon: document.getElementById("prod-icon-input").value.trim() || "🎂",
    price: parseFloat(document.getElementById("prod-price-input").value),
    cost: parseFloat(document.getElementById("prod-cost-input").value) || 0,
    stock: parseInt(document.getElementById("prod-stock-input").value) || 0,
    description: document.getElementById("prod-desc-input").value.trim()
  };

  if (id) {
    store.updateProduct(id, productData);
    showToast("Product updated successfully!", "success");
  } else {
    store.addProduct(productData);
    showToast("New product added to menu!", "success");
  }

  closeProductModal();
  renderProductsTable();
}

function deleteProductItem(id) {
  const prod = store.getProductById(id);
  if (!prod) return;

  if (confirm(`Are you sure you want to delete "${prod.name}" from menu?`)) {
    store.deleteProduct(id);
    showToast("Product removed successfully.", "info");
    renderProductsTable();
  }
}

// ==========================================
// 4. POS BILLING & CHECKOUT
// ==========================================

function filterPOSCategory(category) {
  selectedPOSCategory = category;
  document.querySelectorAll(".pos-cat-btn").forEach(btn => {
    if (btn.textContent.includes(category) || (category === "ALL" && btn.textContent.includes("All"))) {
      btn.className = "pos-cat-btn px-3 py-1.5 rounded-lg bg-orange-600 text-white whitespace-nowrap";
    } else {
      btn.className = "pos-cat-btn px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 whitespace-nowrap";
    }
  });
  renderPOSGrid();
}

function renderPOSGrid() {
  const search = document.getElementById("pos-search").value.toLowerCase();
  let products = store.getProducts();

  if (selectedPOSCategory !== "ALL") {
    products = products.filter(p => p.category === selectedPOSCategory);
  }
  if (search) {
    products = products.filter(p => p.name.toLowerCase().includes(search) || p.category.toLowerCase().includes(search));
  }

  const grid = document.getElementById("pos-items-grid");
  if (products.length === 0) {
    grid.innerHTML = `<div class="col-span-full py-12 text-center text-slate-400 text-xs">No matching products found.</div>`;
    return;
  }

  grid.innerHTML = products.map(p => `
    <div onclick="addToPOSCart('${p.id}')" class="bg-white p-4 rounded-xl border border-slate-200/80 hover:border-orange-500/50 shadow-sm hover:shadow-md cursor-pointer transition flex flex-col justify-between space-y-3 bakery-card">
      <div class="flex items-center gap-3">
        <span class="text-2xl">${p.icon || '🧁'}</span>
        <div>
          <h4 class="font-bold text-slate-900 text-xs line-clamp-1">${escapeHTML(p.name)}</h4>
          <span class="text-[10px] text-slate-400">${p.category}</span>
        </div>
      </div>

      <div class="flex items-center justify-between border-t border-slate-100 pt-2">
        <span class="font-extrabold text-orange-600 text-sm">৳ ${p.price}</span>
        <span class="text-[10px] px-2 py-0.5 rounded-md ${p.stock < 10 ? 'bg-amber-100 text-amber-800 font-bold' : 'bg-slate-100 text-slate-600'}">
          Stock: ${p.stock}
        </span>
      </div>
    </div>
  `).join("");
}

function addToPOSCart(productId) {
  const product = store.getProductById(productId);
  if (!product) return;

  if (product.stock <= 0) {
    showToast(`Sorry, "${product.name}" is out of stock!`, "error");
    return;
  }

  const existingItem = posCart.find(item => item.id === productId);
  if (existingItem) {
    if (existingItem.quantity + 1 > product.stock) {
      showToast(`Cannot add more than available stock (${product.stock})`, "error");
      return;
    }
    existingItem.quantity += 1;
  } else {
    posCart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      icon: product.icon || "🧁"
    });
  }

  renderPOSCart();
}

function updateCartQty(productId, delta) {
  const item = posCart.find(i => i.id === productId);
  const product = store.getProductById(productId);
  if (!item || !product) return;

  const newQty = item.quantity + delta;
  if (newQty <= 0) {
    removeFromCart(productId);
  } else if (newQty > product.stock) {
    showToast(`Stock limit reached (${product.stock} available)`, "error");
  } else {
    item.quantity = newQty;
    renderPOSCart();
  }
}

function removeFromCart(productId) {
  posCart = posCart.filter(item => item.id !== productId);
  renderPOSCart();
}

function clearPOSCart() {
  posCart = [];
  renderPOSCart();
}

function renderPOSCart() {
  const container = document.getElementById("pos-cart-items");
  if (posCart.length === 0) {
    container.innerHTML = `<p class="text-xs text-slate-400 text-center py-10">No items added to cart yet.</p>`;
  } else {
    container.innerHTML = posCart.map(item => `
      <div class="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200/60 rounded-xl text-xs">
        <div class="flex items-center gap-2.5 min-w-0 flex-1">
          <span class="text-lg flex-shrink-0">${item.icon}</span>
          <div class="truncate">
            <p class="font-bold text-slate-900 truncate">${escapeHTML(item.name)}</p>
            <p class="text-[10px] text-slate-500">৳ ${item.price} x ${item.quantity}</p>
          </div>
        </div>

        <div class="flex items-center gap-2 flex-shrink-0">
          <div class="flex items-center bg-white border border-slate-200 rounded-lg">
            <button onclick="updateCartQty('${item.id}', -1)" class="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded-l-lg font-bold">-</button>
            <span class="px-2 text-xs font-bold text-slate-900">${item.quantity}</span>
            <button onclick="updateCartQty('${item.id}', 1)" class="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded-r-lg font-bold">+</button>
          </div>
          <span class="font-extrabold text-slate-900 w-16 text-right">৳ ${item.price * item.quantity}</span>
          <button onclick="removeFromCart('${item.id}')" class="text-slate-400 hover:text-rose-600 ml-1">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
      </div>
    `).join("");
  }

  calculatePOSTotals();
}

function calculatePOSTotals() {
  const subtotal = posCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discount = parseFloat(document.getElementById("pos-discount").value) || 0;
  const tax = Math.round(subtotal * 0.05); // 5% VAT
  const grandTotal = Math.max(0, subtotal - discount + tax);

  document.getElementById("pos-subtotal").textContent = `৳ ${subtotal}`;
  document.getElementById("pos-tax").textContent = `৳ ${tax}`;
  document.getElementById("pos-grand-total").textContent = `৳ ${grandTotal}`;
}

function processPOSCheckout() {
  if (posCart.length === 0) {
    showToast("Please add items to cart before checkout!", "error");
    return;
  }

  const custName = document.getElementById("pos-cust-name").value.trim() || "Walk-in Customer";
  const custPhone = document.getElementById("pos-cust-phone").value.trim() || "N/A";

  const subtotal = posCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discount = parseFloat(document.getElementById("pos-discount").value) || 0;
  const tax = Math.round(subtotal * 0.05);
  const grandTotal = Math.max(0, subtotal - discount + tax);
  const paymentMethod = document.getElementById("pos-payment-method").value;

  const items = posCart.map(item => ({
    id: item.id,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
    total: item.price * item.quantity
  }));

  const orderData = {
    customerName: custName,
    customerPhone: custPhone,
    items,
    subtotal,
    discount,
    tax,
    grandTotal,
    status: "Completed",
    paymentMethod
  };

  const createdOrder = store.createOrder(orderData);

  // Open Receipt Modal
  showOrderReceipt(createdOrder);

  // Clear POS Form
  posCart = [];
  document.getElementById("pos-discount").value = "0";
  renderPOSCart();
  renderPOSGrid();
  showToast("Order completed successfully!", "success");
}

function showOrderReceipt(order) {
  document.getElementById("receipt-order-id").textContent = `#${order.id}`;
  document.getElementById("receipt-date").textContent = order.date;
  document.getElementById("receipt-cust-name").textContent = order.customerName;
  document.getElementById("receipt-cust-phone").textContent = order.customerPhone;

  const itemsBody = document.getElementById("receipt-items-body");
  itemsBody.innerHTML = order.items.map(item => `
    <tr>
      <td class="py-1">${escapeHTML(item.name)}</td>
      <td class="py-1 text-center">${item.quantity}</td>
      <td class="py-1 text-right">৳ ${item.total}</td>
    </tr>
  `).join("");

  document.getElementById("receipt-subtotal").textContent = `৳ ${order.subtotal}`;
  document.getElementById("receipt-discount").textContent = `৳ ${order.discount}`;
  document.getElementById("receipt-tax").textContent = `৳ ${order.tax}`;
  document.getElementById("receipt-grand-total").textContent = `৳ ${order.grandTotal}`;
  document.getElementById("receipt-payment").textContent = order.paymentMethod;

  document.getElementById("modal-receipt").classList.remove("hidden");
}

function closeReceiptModal() {
  document.getElementById("modal-receipt").classList.add("hidden");
}

// ==========================================
// 5. ORDER HISTORY VIEW (CRUD)
// ==========================================

function renderOrdersTable() {
  const search = document.getElementById("order-search").value.toLowerCase();
  const statusFilter = document.getElementById("order-status-filter").value;
  let orders = store.getOrders();

  if (statusFilter !== "ALL") {
    orders = orders.filter(o => o.status === statusFilter);
  }
  if (search) {
    orders = orders.filter(o => o.id.toLowerCase().includes(search) || o.customerName.toLowerCase().includes(search) || o.customerPhone.includes(search));
  }

  const currentUser = store.getCurrentUser();
  const isAdmin = currentUser && currentUser.role === "Admin";

  const tbody = document.getElementById("orders-table-body");
  if (orders.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="py-12 text-center text-slate-400">No orders found.</td></tr>`;
    return;
  }

  tbody.innerHTML = orders.map(o => `
    <tr class="hover:bg-slate-50/80 transition">
      <td class="px-6 py-4 font-bold text-slate-900">${o.id}</td>
      <td class="px-6 py-4">
        <p class="font-semibold text-slate-900">${escapeHTML(o.customerName)}</p>
        <p class="text-[11px] text-slate-400">Phone: ${o.customerPhone}</p>
      </td>
      <td class="px-6 py-4 text-slate-500">${o.date}</td>
      <td class="px-6 py-4 text-center font-semibold">${o.items ? o.items.length : 0} items</td>
      <td class="px-6 py-4 text-right font-extrabold text-slate-900">৳ ${o.grandTotal}</td>
      <td class="px-6 py-4 text-center">
        <select onchange="updateOrderStatus('${o.id}', this.value)" class="bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg text-xs font-bold">
          <option value="Completed" ${o.status === 'Completed' ? 'selected' : ''}>Completed</option>
          <option value="Pending" ${o.status === 'Pending' ? 'selected' : ''}>Pending</option>
          <option value="Cancelled" ${o.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
        </select>
      </td>
      <td class="px-6 py-4 text-center">
        <div class="flex items-center justify-center gap-2">
          <button onclick="reprintOrderReceipt('${o.id}')" title="View & Print Receipt" class="w-8 h-8 rounded-lg bg-slate-100 hover:bg-orange-50 text-slate-600 hover:text-orange-600 flex items-center justify-center transition">
            <i class="fa-solid fa-receipt"></i>
          </button>
          ${isAdmin ? `
            <button onclick="deleteOrderRecord('${o.id}')" title="Delete Order Record" class="w-8 h-8 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 flex items-center justify-center transition">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          ` : ''}
        </div>
      </td>
    </tr>
  `).join("");
}

function updateOrderStatus(id, newStatus) {
  store.updateOrderStatus(id, newStatus);
  showToast(`Order #${id} status changed to ${newStatus}`, "info");
  renderOrdersTable();
}

function reprintOrderReceipt(id) {
  const order = store.getOrderById(id);
  if (order) {
    showOrderReceipt(order);
  }
}

function deleteOrderRecord(id) {
  if (confirm(`Are you sure you want to delete order #${id}?`)) {
    store.deleteOrder(id);
    showToast(`Order #${id} deleted.`, "info");
    renderOrdersTable();
  }
}

// ==========================================
// 6. INVENTORY & STOCK MANAGEMENT
// ==========================================

function renderInventoryTable() {
  const products = store.getProducts();
  const tbody = document.getElementById("inventory-table-body");
  const currentUser = store.getCurrentUser();
  const isAdmin = currentUser && currentUser.role === "Admin";

  if (products.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="py-12 text-center text-slate-400">No inventory data available.</td></tr>`;
    return;
  }

  tbody.innerHTML = products.map(p => `
    <tr class="hover:bg-slate-50/80 transition">
      <td class="px-6 py-4">
        <div class="flex items-center gap-3">
          <span class="text-xl">${p.icon || '🧁'}</span>
          <div>
            <p class="font-bold text-slate-900">${escapeHTML(p.name)}</p>
            <p class="text-[11px] text-slate-400">ID: ${p.id}</p>
          </div>
        </div>
      </td>
      <td class="px-6 py-4">
        <span class="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-[11px] font-semibold">${p.category}</span>
      </td>
      <td class="px-6 py-4 text-center font-extrabold text-slate-900 text-sm">
        ${p.stock} ${p.unit || 'Pcs'}
      </td>
      <td class="px-6 py-4 text-center">
        ${p.stock < 10 
          ? `<span class="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full font-bold text-[11px]">⚠️ Low Stock</span>`
          : `<span class="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[11px]">✓ In Stock</span>`}
      </td>
      <td class="px-6 py-4 text-center">
        ${isAdmin ? `
          <div class="inline-flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button onclick="quickStockAdjust('${p.id}', -5)" class="px-2 py-1 bg-white hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-xs shadow-xs">-5</button>
            <button onclick="quickStockAdjust('${p.id}', 10)" class="px-2 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold text-xs shadow-xs">+10</button>
            <button onclick="quickStockAdjust('${p.id}', 25)" class="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-xs shadow-xs">+25</button>
          </div>
        ` : `<span class="text-slate-400 text-[11px]">View only</span>`}
      </td>
    </tr>
  `).join("");
}

function quickStockAdjust(id, delta) {
  const p = store.getProductById(id);
  if (!p) return;
  const newStock = Math.max(0, p.stock + delta);
  store.updateStock(id, newStock);
  showToast(`Updated stock for ${p.name} to ${newStock}`, "success");
  renderInventoryTable();
}

function quickRestockItem(id) {
  const p = store.getProductById(id);
  if (!p) return;
  store.updateStock(id, p.stock + 20);
  showToast(`Restocked +20 ${p.unit || 'pcs'} for ${p.name}`, "success");
  renderDashboard();
}

// ==========================================
// 7. CUSTOMERS VIEW (CRUD)
// ==========================================

function renderCustomersTable() {
  const search = document.getElementById("cust-search").value.toLowerCase();
  let customers = store.getCustomers();

  if (search) {
    customers = customers.filter(c => c.name.toLowerCase().includes(search) || c.phone.includes(search));
  }

  const currentUser = store.getCurrentUser();
  const isAdmin = currentUser && currentUser.role === "Admin";

  const tbody = document.getElementById("customers-table-body");
  if (customers.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="py-12 text-center text-slate-400">No customers found.</td></tr>`;
    return;
  }

  tbody.innerHTML = customers.map(c => `
    <tr class="hover:bg-slate-50/80 transition">
      <td class="px-6 py-4 font-bold text-slate-900">${c.id}</td>
      <td class="px-6 py-4 font-semibold text-slate-900">${escapeHTML(c.name)}</td>
      <td class="px-6 py-4 text-slate-600">${c.phone}</td>
      <td class="px-6 py-4 text-slate-500">${escapeHTML(c.address || 'N/A')}</td>
      <td class="px-6 py-4 text-center font-bold text-slate-800">${c.totalOrders || 0}</td>
      <td class="px-6 py-4 text-right font-extrabold text-orange-600">৳ ${(c.totalSpent || 0).toLocaleString()}</td>
      <td class="px-6 py-4 text-center">
        ${isAdmin ? `
          <div class="flex items-center justify-center gap-2">
            <button onclick="openEditCustomerModal('${c.id}')" title="Edit Customer" class="w-8 h-8 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 flex items-center justify-center transition">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button onclick="deleteCustomerItem('${c.id}')" title="Delete Customer" class="w-8 h-8 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 flex items-center justify-center transition">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        ` : `<span class="text-slate-400 text-[11px]">View only</span>`}
      </td>
    </tr>
  `).join("");
}

function openAddCustomerModal() {
  document.getElementById("modal-customer-title").textContent = "Add New Customer";
  document.getElementById("form-customer").reset();
  document.getElementById("cust-id-input").value = "";
  document.getElementById("modal-customer").classList.remove("hidden");
}

function openEditCustomerModal(id) {
  const cust = store.getCustomerById(id);
  if (!cust) return;

  document.getElementById("modal-customer-title").textContent = `Edit Customer (${cust.id})`;
  document.getElementById("cust-id-input").value = cust.id;
  document.getElementById("cust-name-input").value = cust.name;
  document.getElementById("cust-phone-input").value = cust.phone;
  document.getElementById("cust-email-input").value = cust.email || "";
  document.getElementById("cust-address-input").value = cust.address || "";

  document.getElementById("modal-customer").classList.remove("hidden");
}

function closeCustomerModal() {
  document.getElementById("modal-customer").classList.add("hidden");
}

function handleCustomerFormSubmit(e) {
  e.preventDefault();
  const id = document.getElementById("cust-id-input").value;
  const customerData = {
    name: document.getElementById("cust-name-input").value.trim(),
    phone: document.getElementById("cust-phone-input").value.trim(),
    email: document.getElementById("cust-email-input").value.trim(),
    address: document.getElementById("cust-address-input").value.trim()
  };

  if (id) {
    store.updateCustomer(id, customerData);
    showToast("Customer profile updated!", "success");
  } else {
    store.addCustomer(customerData);
    showToast("New customer added!", "success");
  }

  closeCustomerModal();
  renderCustomersTable();
}

function deleteCustomerItem(id) {
  const cust = store.getCustomerById(id);
  if (!cust) return;

  if (confirm(`Are you sure you want to delete customer "${cust.name}"?`)) {
    store.deleteCustomer(id);
    showToast("Customer deleted.", "info");
    renderCustomersTable();
  }
}

// ==========================================
// 8. BACKUP & SYSTEM SETTINGS
// ==========================================

function downloadDataBackup() {
  const jsonStr = store.exportData();
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `bakery_system_backup_${new Date().toISOString().split("T")[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast("Bakery data backup downloaded!", "success");
}

function handleDataImport() {
  const fileInput = document.getElementById("import-file-input");
  if (!fileInput.files || fileInput.files.length === 0) {
    showToast("Please select a valid JSON backup file first.", "error");
    return;
  }

  const file = fileInput.files[0];
  const reader = new FileReader();
  reader.onload = function(e) {
    const success = store.importData(e.target.result);
    if (success) {
      showToast("Data imported successfully!", "success");
      renderActiveView();
    } else {
      showToast("Failed to import. Invalid backup file format.", "error");
    }
  };
  reader.readAsText(file);
}

function confirmResetSampleData() {
  if (confirm("Reset system to original factory sample data? Current modifications will be overwritten.")) {
    store.resetToSampleData();
    showToast("System reset to sample data.", "info");
    renderActiveView();
  }
}

// ==========================================
// 9. UTILITIES & TOAST NOTIFICATIONS
// ==========================================

function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  
  const iconMap = {
    success: '<i class="fa-solid fa-circle-check text-emerald-600"></i>',
    error: '<i class="fa-solid fa-circle-xmark text-rose-600"></i>',
    info: '<i class="fa-solid fa-circle-info text-blue-600"></i>'
  };

  toast.innerHTML = `
    ${iconMap[type] || iconMap.info}
    <span class="text-xs font-semibold text-slate-800">${escapeHTML(message)}</span>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}
