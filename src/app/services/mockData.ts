import { Product, Order, OrderStatus, OrderPriority } from '../types';

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'P001',
    name: 'Wireless Mouse',
    sku: 'WM-2024-BLK',
    category: 'Electronics',
    stockLevel: 450,
    reorderPoint: 100,
    location: 'A1-B2',
    price: 29.99,
  },
  {
    id: 'P002',
    name: 'USB-C Cable 6ft',
    sku: 'UC-6FT-WHT',
    category: 'Electronics',
    stockLevel: 800,
    reorderPoint: 200,
    location: 'A1-B3',
    price: 12.99,
  },
  {
    id: 'P003',
    name: 'Mechanical Keyboard',
    sku: 'MK-RGB-BLU',
    category: 'Electronics',
    stockLevel: 120,
    reorderPoint: 50,
    location: 'A2-B1',
    price: 89.99,
  },
  {
    id: 'P004',
    name: 'Laptop Stand',
    sku: 'LS-ALU-GRY',
    category: 'Accessories',
    stockLevel: 85,
    reorderPoint: 30,
    location: 'B1-C2',
    price: 45.99,
  },
  {
    id: 'P005',
    name: 'Webcam HD 1080p',
    sku: 'WC-HD-1080',
    category: 'Electronics',
    stockLevel: 65,
    reorderPoint: 25,
    location: 'A3-B2',
    price: 69.99,
  },
  {
    id: 'P006',
    name: 'Desk Lamp LED',
    sku: 'DL-LED-WHT',
    category: 'Accessories',
    stockLevel: 200,
    reorderPoint: 50,
    location: 'B2-C1',
    price: 34.99,
  },
  {
    id: 'P007',
    name: 'Monitor 27" 4K',
    sku: 'MON-27-4K',
    category: 'Electronics',
    stockLevel: 45,
    reorderPoint: 15,
    location: 'C1-D1',
    price: 399.99,
  },
  {
    id: 'P008',
    name: 'Wireless Headphones',
    sku: 'WH-BT-BLK',
    category: 'Electronics',
    stockLevel: 180,
    reorderPoint: 60,
    location: 'A2-B3',
    price: 149.99,
  },
  {
    id: 'P009',
    name: 'Notebook 200 Pages',
    sku: 'NB-200-BLU',
    category: 'Office',
    stockLevel: 15,
    reorderPoint: 100,
    location: 'B3-C2',
    price: 5.99,
  },
  {
    id: 'P010',
    name: 'Pen Set (12-pack)',
    sku: 'PS-12-BLK',
    category: 'Office',
    stockLevel: 350,
    reorderPoint: 150,
    location: 'B3-C3',
    price: 8.99,
  },
];

const generateOrder = (
  id: number,
  status: OrderStatus,
  priority: OrderPriority,
  daysAgo: number
): Order => {
  const createdAt = new Date();
  createdAt.setDate(createdAt.getDate() - daysAgo);
  createdAt.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));

  const numItems = Math.floor(Math.random() * 4) + 1;
  const items = [];
  const selectedProducts = new Set<string>();

  for (let i = 0; i < numItems; i++) {
    let product;
    do {
      product = MOCK_PRODUCTS[Math.floor(Math.random() * MOCK_PRODUCTS.length)];
    } while (selectedProducts.has(product.id));
    
    selectedProducts.add(product.id);
    const quantity = Math.floor(Math.random() * 5) + 1;
    
    items.push({
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      quantity,
      price: product.price,
      location: product.location,
    });
  }

  const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const updatedAt = new Date(createdAt);

  let packedAt: Date | undefined;
  let shippedAt: Date | undefined;
  let deliveredAt: Date | undefined;
  let trackingNumber: string | undefined;

  if (status !== 'pending') {
    packedAt = new Date(createdAt);
    packedAt.setHours(packedAt.getHours() + 2);
    updatedAt.setTime(packedAt.getTime());
  }

  if (status === 'shipped' || status === 'delivered') {
    shippedAt = new Date(packedAt!);
    shippedAt.setHours(shippedAt.getHours() + 4);
    updatedAt.setTime(shippedAt.getTime());
    trackingNumber = `TRK${Math.floor(Math.random() * 1000000000)}`;
  }

  if (status === 'delivered') {
    deliveredAt = new Date(shippedAt!);
    deliveredAt.setDate(deliveredAt.getDate() + Math.floor(Math.random() * 3) + 1);
    updatedAt.setTime(deliveredAt.getTime());
  }

  const customers = [
    'Acme Corporation',
    'TechStart Inc',
    'Global Supplies Co',
    'Metro Retail Ltd',
    'Pacific Trading',
    'Eastern Distributors',
    'Western Wholesale',
    'Northern Enterprises',
  ];

  return {
    id: `ORD${id.toString().padStart(5, '0')}`,
    orderNumber: `WH-2026-${id.toString().padStart(5, '0')}`,
    customerId: `CUST${Math.floor(Math.random() * 1000).toString().padStart(4, '0')}`,
    customerName: customers[Math.floor(Math.random() * customers.length)],
    status,
    priority,
    items,
    totalAmount,
    createdAt,
    updatedAt,
    packedAt,
    shippedAt,
    deliveredAt,
    assignedTo: status !== 'pending' ? `Worker ${Math.floor(Math.random() * 10) + 1}` : undefined,
    trackingNumber,
    shippingAddress: `${Math.floor(Math.random() * 9999) + 1} Main St, City, State ${Math.floor(Math.random() * 90000) + 10000}`,
    pickingSequence: status === 'pending' ? undefined : Math.floor(Math.random() * 100) + 1,
  };
};

export const generateMockOrders = (): Order[] => {
  const orders: Order[] = [];
  let orderId = 1;

  // Pending orders with various priorities
  for (let i = 0; i < 8; i++) {
    const priority: OrderPriority = i < 2 ? 'urgent' : i < 4 ? 'high' : i < 6 ? 'medium' : 'low';
    orders.push(generateOrder(orderId++, 'pending', priority, Math.floor(Math.random() * 2)));
  }

  // Packed orders
  for (let i = 0; i < 5; i++) {
    const priority: OrderPriority = i < 2 ? 'high' : i < 4 ? 'medium' : 'low';
    orders.push(generateOrder(orderId++, 'packed', priority, Math.floor(Math.random() * 3) + 1));
  }

  // Shipped orders
  for (let i = 0; i < 6; i++) {
    const priority: OrderPriority = i < 2 ? 'high' : i < 4 ? 'medium' : 'low';
    orders.push(generateOrder(orderId++, 'shipped', priority, Math.floor(Math.random() * 5) + 2));
  }

  // Delivered orders
  for (let i = 0; i < 12; i++) {
    const priority: OrderPriority = i < 3 ? 'high' : i < 7 ? 'medium' : 'low';
    orders.push(generateOrder(orderId++, 'delivered', priority, Math.floor(Math.random() * 10) + 3));
  }

  return orders;
};
