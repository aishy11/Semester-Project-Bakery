/**
 * Bakery Management System - Initial Sample Data
 * Pre-populated data with prices in Bangladeshi Taka (৳ BDT)
 */

const INITIAL_SAMPLE_DATA = {
  products: [
    {
      id: "PROD-101",
      name: "Black Forest Cake (1 kg)",
      category: "Cakes",
      price: 1200,
      cost: 750,
      stock: 8,
      unit: "Pcs",
      description: "Rich dark chocolate cake layered with fresh whipped cream and cherry topping.",
      icon: "🎂",
      createdDate: "2026-08-01"
    },
    {
      id: "PROD-102",
      name: "Red Velvet Cupcake",
      category: "Pastries",
      price: 120,
      cost: 65,
      stock: 25,
      unit: "Pcs",
      description: "Moist red velvet cupcake with smooth cream cheese frosting.",
      icon: "🧁",
      createdDate: "2026-08-05"
    },
    {
      id: "PROD-103",
      name: "Special Butter Bread",
      category: "Breads",
      price: 90,
      cost: 50,
      stock: 40,
      unit: "Pcs",
      description: "Soft oven-fresh sliced butter loaf bread ideal for breakfast.",
      icon: "🍞",
      createdDate: "2026-08-10"
    },
    {
      id: "PROD-104",
      name: "French Butter Croissant",
      category: "Pastries",
      price: 150,
      cost: 80,
      stock: 5, // Low stock for testing alert
      unit: "Pcs",
      description: "Flaky, buttery, multi-layered classic croissant baked fresh daily.",
      icon: "🥐",
      createdDate: "2026-08-12"
    },
    {
      id: "PROD-105",
      name: "Chocolate Glazed Donut",
      category: "Sweets",
      price: 85,
      cost: 40,
      stock: 18,
      unit: "Pcs",
      description: "Fluffy fried donut dipped in dark Belgian chocolate glaze.",
      icon: "🍩",
      createdDate: "2026-08-15"
    },
    {
      id: "PROD-106",
      name: "Crispy Garlic Toast (200g)",
      category: "Biscuits",
      price: 140,
      cost: 80,
      stock: 30,
      unit: "Pkt",
      description: "Crunchy double-baked bread toast seasoned with garlic butter.",
      icon: "🥖",
      createdDate: "2026-08-18"
    },
    {
      id: "PROD-107",
      name: "Cold Coffee Shake (350ml)",
      category: "Beverages",
      price: 160,
      cost: 70,
      stock: 15,
      unit: "Bot",
      description: "Creamy iced espresso blended with thick milk and cocoa powder.",
      icon: "🥤",
      createdDate: "2026-08-20"
    },
    {
      id: "PROD-108",
      name: "Chicken Patty Roll",
      category: "Snacks",
      price: 110,
      cost: 60,
      stock: 3, // Low stock for testing alert
      unit: "Pcs",
      description: "Spicy minced chicken filling inside a golden puff pastry casing.",
      icon: "🧆",
      createdDate: "2026-08-22"
    }
  ],
  customers: [
    {
      id: "CUST-001",
      name: "Tanvir Ahmed",
      phone: "01712345678",
      email: "tanvir@example.com",
      address: "Dhanmondi, Dhaka",
      totalOrders: 3,
      totalSpent: 2450,
      createdDate: "2026-08-02"
    },
    {
      id: "CUST-002",
      name: "Nusrat Jahan",
      phone: "01898765432",
      email: "nusrat@example.com",
      address: "Uttara, Dhaka",
      totalOrders: 1,
      totalSpent: 1200,
      createdDate: "2026-08-14"
    },
    {
      id: "CUST-003",
      name: "Rahim Chowdhury",
      phone: "01911223344",
      email: "rahim@example.com",
      address: "Gulshan 2, Dhaka",
      totalOrders: 2,
      totalSpent: 890,
      createdDate: "2026-08-20"
    }
  ],
  orders: [
    {
      id: "ORD-1001",
      customerName: "Tanvir Ahmed",
      customerPhone: "01712345678",
      date: "2026-08-26 14:30",
      items: [
        { id: "PROD-101", name: "Black Forest Cake (1 kg)", price: 1200, quantity: 1, total: 1200 },
        { id: "PROD-103", name: "Special Butter Bread", price: 90, quantity: 2, total: 180 }
      ],
      subtotal: 1380,
      discount: 50,
      tax: 69,
      grandTotal: 1399,
      status: "Completed",
      paymentMethod: "bKash"
    },
    {
      id: "ORD-1002",
      customerName: "Nusrat Jahan",
      customerPhone: "01898765432",
      date: "2026-08-26 16:45",
      items: [
        { id: "PROD-101", name: "Black Forest Cake (1 kg)", price: 1200, quantity: 1, total: 1200 }
      ],
      subtotal: 1200,
      discount: 0,
      tax: 60,
      grandTotal: 1260,
      status: "Completed",
      paymentMethod: "Cash"
    },
    {
      id: "ORD-1003",
      customerName: "Walk-in Customer",
      customerPhone: "N/A",
      date: "2026-08-27 10:15",
      items: [
        { id: "PROD-102", name: "Red Velvet Cupcake", price: 120, quantity: 2, total: 240 },
        { id: "PROD-107", name: "Cold Coffee Shake (350ml)", price: 160, quantity: 1, total: 160 }
      ],
      subtotal: 400,
      discount: 0,
      tax: 20,
      grandTotal: 420,
      status: "Pending",
      paymentMethod: "Cash"
    }
  ]
};
