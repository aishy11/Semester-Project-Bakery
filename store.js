/**
 * Bakery Management System - State & LocalStorage Manager
 * Implements full CRUD operations for Products, Orders, Customers, Inventory, and User Authentication
 */

const STORAGE_KEYS = {
  PRODUCTS: "bakery_products",
  ORDERS: "bakery_orders",
  CUSTOMERS: "bakery_customers",
  SESSION: "bakery_session"
};

const DEFAULT_USERS = [
  {
    username: "admin",
    password: "admin123",
    name: "System Admin",
    role: "Admin",
    avatar: "👑"
  },
  {
    username: "cashier",
    password: "bakery123",
    name: "Bakery Cashier",
    role: "Cashier",
    avatar: "👨‍🍳"
  }
];

class BakeryStore {
  constructor() {
    this.init();
  }

  init() {
    if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
      this.resetToSampleData();
    }
  }

  // --- LOCALSTORAGE HELPERS ---
  _getItem(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error(`Error reading ${key} from LocalStorage:`, e);
      return [];
    }
  }

  _setItem(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Error saving ${key} to LocalStorage:`, e);
    }
  }

  resetToSampleData() {
    this._setItem(STORAGE_KEYS.PRODUCTS, INITIAL_SAMPLE_DATA.products);
    this._setItem(STORAGE_KEYS.CUSTOMERS, INITIAL_SAMPLE_DATA.customers);
    this._setItem(STORAGE_KEYS.ORDERS, INITIAL_SAMPLE_DATA.orders);
  }

  // ==========================================
  // 0. AUTHENTICATION & SESSION
  // ==========================================

  loginUser(username, password) {
    const user = DEFAULT_USERS.find(
      u => u.username.toLowerCase() === username.trim().toLowerCase() && u.password === password
    );

    if (user) {
      const sessionData = {
        username: user.username,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        loginTime: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(sessionData));
      return { success: true, user: sessionData };
    }

    return { success: false, message: "Invalid username or password!" };
  }

  getCurrentUser() {
    try {
      const session = localStorage.getItem(STORAGE_KEYS.SESSION);
      return session ? JSON.parse(session) : null;
    } catch (e) {
      return null;
    }
  }

  logoutUser() {
    localStorage.removeItem(STORAGE_KEYS.SESSION);
  }

  // ==========================================
  // 1. PRODUCT CRUD OPERATIONS
  // ==========================================

  getProducts() {
    return this._getItem(STORAGE_KEYS.PRODUCTS);
  }

  getProductById(id) {
    return this.getProducts().find(p => p.id === id);
  }

  addProduct(productData) {
    const products = this.getProducts();
    const newId = "PROD-" + Math.floor(100 + Math.random() * 900);
    const newProduct = {
      id: newId,
      name: productData.name,
      category: productData.category || "General",
      price: parseFloat(productData.price) || 0,
      cost: parseFloat(productData.cost) || 0,
      stock: parseInt(productData.stock) || 0,
      unit: productData.unit || "Pcs",
      description: productData.description || "",
      icon: productData.icon || "🎂",
      createdDate: new Date().toISOString().split("T")[0]
    };
    products.unshift(newProduct);
    this._setItem(STORAGE_KEYS.PRODUCTS, products);
    return newProduct;
  }

  updateProduct(id, updatedFields) {
    const products = this.getProducts();
    const index = products.findIndex(p => p.id === id);
    if (index !== -1) {
      products[index] = {
        ...products[index],
        name: updatedFields.name ?? products[index].name,
        category: updatedFields.category ?? products[index].category,
        price: updatedFields.price !== undefined ? parseFloat(updatedFields.price) : products[index].price,
        cost: updatedFields.cost !== undefined ? parseFloat(updatedFields.cost) : products[index].cost,
        stock: updatedFields.stock !== undefined ? parseInt(updatedFields.stock) : products[index].stock,
        unit: updatedFields.unit ?? products[index].unit,
        description: updatedFields.description ?? products[index].description,
        icon: updatedFields.icon ?? products[index].icon
      };
      this._setItem(STORAGE_KEYS.PRODUCTS, products);
      return products[index];
    }
    return null;
  }

  deleteProduct(id) {
    let products = this.getProducts();
    const initialLen = products.length;
    products = products.filter(p => p.id !== id);
    this._setItem(STORAGE_KEYS.PRODUCTS, products);
    return products.length < initialLen;
  }

  updateStock(id, newStockQuantity) {
    return this.updateProduct(id, { stock: parseInt(newStockQuantity) || 0 });
  }

  // ==========================================
  // 2. ORDER CRUD OPERATIONS
  // ==========================================

  getOrders() {
    return this._getItem(STORAGE_KEYS.ORDERS);
  }

  getOrderById(id) {
    return this.getOrders().find(o => o.id === id);
  }

  createOrder(orderData) {
    const orders = this.getOrders();
    const newId = "ORD-" + (1001 + orders.length);
    const now = new Date();
    const dateFormatted = `${now.toISOString().split("T")[0]} ${now.toTimeString().split(" ")[0].substring(0, 5)}`;

    const newOrder = {
      id: newId,
      customerName: orderData.customerName || "Walk-in Customer",
      customerPhone: orderData.customerPhone || "N/A",
      date: dateFormatted,
      items: orderData.items || [],
      subtotal: parseFloat(orderData.subtotal) || 0,
      discount: parseFloat(orderData.discount) || 0,
      tax: parseFloat(orderData.tax) || 0,
      grandTotal: parseFloat(orderData.grandTotal) || 0,
      status: orderData.status || "Completed",
      paymentMethod: orderData.paymentMethod || "Cash"
    };

    // Deduct stock for ordered items
    const products = this.getProducts();
    newOrder.items.forEach(item => {
      const prodIndex = products.findIndex(p => p.id === item.id);
      if (prodIndex !== -1) {
        products[prodIndex].stock = Math.max(0, products[prodIndex].stock - item.quantity);
      }
    });
    this._setItem(STORAGE_KEYS.PRODUCTS, products);

    // Update customer total order stats if applicable
    if (newOrder.customerName && newOrder.customerName !== "Walk-in Customer") {
      this._updateCustomerStats(newOrder.customerName, newOrder.customerPhone, newOrder.grandTotal);
    }

    orders.unshift(newOrder);
    this._setItem(STORAGE_KEYS.ORDERS, orders);
    return newOrder;
  }

  updateOrderStatus(id, newStatus) {
    const orders = this.getOrders();
    const index = orders.findIndex(o => o.id === id);
    if (index !== -1) {
      orders[index].status = newStatus;
      this._setItem(STORAGE_KEYS.ORDERS, orders);
      return orders[index];
    }
    return null;
  }

  deleteOrder(id) {
    let orders = this.getOrders();
    const initialLen = orders.length;
    orders = orders.filter(o => o.id !== id);
    this._setItem(STORAGE_KEYS.ORDERS, orders);
    return orders.length < initialLen;
  }

  // ==========================================
  // 3. CUSTOMER CRUD OPERATIONS
  // ==========================================

  getCustomers() {
    return this._getItem(STORAGE_KEYS.CUSTOMERS);
  }

  getCustomerById(id) {
    return this.getCustomers().find(c => c.id === id);
  }

  addCustomer(customerData) {
    const customers = this.getCustomers();
    const newId = "CUST-" + Math.floor(100 + Math.random() * 900);
    const newCustomer = {
      id: newId,
      name: customerData.name,
      phone: customerData.phone || "N/A",
      email: customerData.email || "",
      address: customerData.address || "",
      totalOrders: 0,
      totalSpent: 0,
      createdDate: new Date().toISOString().split("T")[0]
    };
    customers.unshift(newCustomer);
    this._setItem(STORAGE_KEYS.CUSTOMERS, customers);
    return newCustomer;
  }

  updateCustomer(id, updatedFields) {
    const customers = this.getCustomers();
    const index = customers.findIndex(c => c.id === id);
    if (index !== -1) {
      customers[index] = {
        ...customers[index],
        name: updatedFields.name ?? customers[index].name,
        phone: updatedFields.phone ?? customers[index].phone,
        email: updatedFields.email ?? customers[index].email,
        address: updatedFields.address ?? customers[index].address
      };
      this._setItem(STORAGE_KEYS.CUSTOMERS, customers);
      return customers[index];
    }
    return null;
  }

  deleteCustomer(id) {
    let customers = this.getCustomers();
    const initialLen = customers.length;
    customers = customers.filter(c => c.id !== id);
    this._setItem(STORAGE_KEYS.CUSTOMERS, customers);
    return customers.length < initialLen;
  }

  _updateCustomerStats(name, phone, orderAmount) {
    const customers = this.getCustomers();
    let customer = customers.find(c => c.phone === phone || c.name.toLowerCase() === name.toLowerCase());
    if (customer) {
      customer.totalOrders = (customer.totalOrders || 0) + 1;
      customer.totalSpent = (customer.totalSpent || 0) + orderAmount;
    } else {
      const newId = "CUST-" + Math.floor(100 + Math.random() * 900);
      customers.push({
        id: newId,
        name: name,
        phone: phone || "N/A",
        email: "",
        address: "",
        totalOrders: 1,
        totalSpent: orderAmount,
        createdDate: new Date().toISOString().split("T")[0]
      });
    }
    this._setItem(STORAGE_KEYS.CUSTOMERS, customers);
  }

  // ==========================================
  // 4. STATS & ANALYTICS HELPERS
  // ==========================================

  getDashboardStats() {
    const products = this.getProducts();
    const orders = this.getOrders();

    const totalRevenue = orders
      .filter(o => o.status === "Completed")
      .reduce((sum, o) => sum + (o.grandTotal || 0), 0);

    const totalOrdersCount = orders.length;
    const totalProductsCount = products.length;
    const lowStockItems = products.filter(p => p.stock < 10);

    return {
      totalRevenue,
      totalOrdersCount,
      totalProductsCount,
      lowStockCount: lowStockItems.length,
      lowStockItems,
      recentOrders: orders.slice(0, 5)
    };
  }

  // ==========================================
  // 5. IMPORT / EXPORT DATA
  // ==========================================

  exportData() {
    const backupObj = {
      version: "1.0",
      exportDate: new Date().toISOString(),
      products: this.getProducts(),
      customers: this.getCustomers(),
      orders: this.getOrders()
    };
    return JSON.stringify(backupObj, null, 2);
  }

  importData(jsonDataString) {
    try {
      const data = JSON.parse(jsonDataString);
      if (Array.isArray(data.products) && Array.isArray(data.orders)) {
        this._setItem(STORAGE_KEYS.PRODUCTS, data.products);
        if (data.customers) this._setItem(STORAGE_KEYS.CUSTOMERS, data.customers);
        this._setItem(STORAGE_KEYS.ORDERS, data.orders);
        return true;
      }
      return false;
    } catch (e) {
      console.error("Failed to parse import data:", e);
      return false;
    }
  }
}

// Global singleton store instance
const store = new BakeryStore();
