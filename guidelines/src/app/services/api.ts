import { Order, Product, OrderStatus, InventoryTransaction, PerformanceMetrics } from '../types';
import { MOCK_PRODUCTS, generateMockOrders } from './mockData';

// Simulated in-memory database
let orders: Order[] = generateMockOrders();
let products: Product[] = [...MOCK_PRODUCTS];
let transactions: InventoryTransaction[] = [];

// Simulate network delay
const delay = (ms: number = 300) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Order Prioritization Algorithm (Greedy-based)
 * Prioritizes based on:
 * 1. Order priority level (urgent > high > medium > low)
 * 2. Order age (older orders first)
 * 3. Number of items (fewer items first for faster processing)
 */
export const prioritizeOrders = (orderList: Order[]): Order[] => {
  const priorityWeight: Record<string, number> = {
    urgent: 4,
    high: 3,
    medium: 2,
    low: 1,
  };

  return [...orderList].sort((a, b) => {
    // First: Priority level
    const priorityDiff = priorityWeight[b.priority] - priorityWeight[a.priority];
    if (priorityDiff !== 0) return priorityDiff;

    // Second: Age (older first)
    const ageDiff = a.createdAt.getTime() - b.createdAt.getTime();
    if (ageDiff !== 0) return ageDiff;

    // Third: Number of items (fewer first for quick wins)
    return a.items.length - b.items.length;
  });
};

/**
 * REST API: GET /orders
 * Fetch all orders with optional status filter
 */
export const fetchOrders = async (status?: OrderStatus): Promise<Order[]> => {
  await delay();
  
  let filteredOrders = orders;
  if (status) {
    filteredOrders = orders.filter(order => order.status === status);
  }
  
  return filteredOrders;
};

/**
 * REST API: GET /orders/:id
 * Fetch a specific order by ID
 */
export const fetchOrderById = async (orderId: string): Promise<Order | null> => {
  await delay();
  
  const order = orders.find(o => o.id === orderId);
  return order || null;
};

/**
 * REST API: POST /orders
 * Create a new order
 */
export const createOrder = async (orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>): Promise<Order> => {
  await delay(500);
  
  const newOrder: Order = {
    ...orderData,
    id: `ORD${(orders.length + 1).toString().padStart(5, '0')}`,
    orderNumber: `WH-2026-${(orders.length + 1).toString().padStart(5, '0')}`,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  orders.push(newOrder);
  
  // Allocate inventory
  for (const item of newOrder.items) {
    await allocateInventory(item.productId, item.quantity, newOrder.id);
  }
  
  return newOrder;
};

/**
 * REST API: PATCH /orders/:id/status
 * Update order status with state transition validation
 */
export const updateOrderStatus = async (orderId: string, newStatus: OrderStatus): Promise<Order> => {
  await delay(400);
  
  const orderIndex = orders.findIndex(o => o.id === orderId);
  if (orderIndex === -1) {
    throw new Error('Order not found');
  }
  
  const order = orders[orderIndex];
  
  // Validate state transitions
  const validTransitions: Record<OrderStatus, OrderStatus[]> = {
    pending: ['packed'],
    packed: ['shipped'],
    shipped: ['delivered'],
    delivered: [],
  };
  
  if (!validTransitions[order.status].includes(newStatus)) {
    throw new Error(`Invalid status transition from ${order.status} to ${newStatus}`);
  }
  
  // Update timestamps based on new status
  const now = new Date();
  const updates: Partial<Order> = {
    status: newStatus,
    updatedAt: now,
  };
  
  if (newStatus === 'packed') {
    updates.packedAt = now;
    updates.assignedTo = `Worker ${Math.floor(Math.random() * 10) + 1}`;
  } else if (newStatus === 'shipped') {
    updates.shippedAt = now;
    updates.trackingNumber = `TRK${Math.floor(Math.random() * 1000000000)}`;
  } else if (newStatus === 'delivered') {
    updates.deliveredAt = now;
  }
  
  orders[orderIndex] = { ...order, ...updates };
  
  return orders[orderIndex];
};

/**
 * REST API: GET /orders/prioritized
 * Get pending orders sorted by priority algorithm
 */
export const fetchPrioritizedOrders = async (): Promise<Order[]> => {
  await delay();
  
  const pendingOrders = orders.filter(o => o.status === 'pending');
  const prioritized = prioritizeOrders(pendingOrders);
  
  // Assign picking sequence numbers
  return prioritized.map((order, index) => ({
    ...order,
    pickingSequence: index + 1,
  }));
};

/**
 * REST API: GET /inventory
 * Fetch all products with stock levels
 */
export const fetchInventory = async (): Promise<Product[]> => {
  await delay();
  return [...products];
};

/**
 * REST API: PATCH /inventory/:id
 * Update product stock level
 */
export const updateInventory = async (productId: string, newStockLevel: number): Promise<Product> => {
  await delay(300);
  
  const productIndex = products.findIndex(p => p.id === productId);
  if (productIndex === -1) {
    throw new Error('Product not found');
  }
  
  const oldStock = products[productIndex].stockLevel;
  products[productIndex].stockLevel = newStockLevel;
  
  // Log transaction
  transactions.push({
    id: `TXN${transactions.length + 1}`,
    productId,
    type: newStockLevel > oldStock ? 'restock' : 'adjustment',
    quantity: Math.abs(newStockLevel - oldStock),
    timestamp: new Date(),
  });
  
  return products[productIndex];
};

/**
 * Allocate inventory for an order
 */
const allocateInventory = async (productId: string, quantity: number, orderId: string): Promise<void> => {
  const productIndex = products.findIndex(p => p.id === productId);
  if (productIndex === -1) {
    throw new Error('Product not found');
  }
  
  if (products[productIndex].stockLevel < quantity) {
    throw new Error(`Insufficient stock for product ${productId}`);
  }
  
  products[productIndex].stockLevel -= quantity;
  
  transactions.push({
    id: `TXN${transactions.length + 1}`,
    productId,
    orderId,
    type: 'allocation',
    quantity,
    timestamp: new Date(),
  });
};

/**
 * REST API: GET /analytics/metrics
 * Calculate performance metrics
 */
export const fetchMetrics = async (): Promise<PerformanceMetrics> => {
  await delay(200);
  
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const packedOrders = orders.filter(o => o.status === 'packed').length;
  const shippedOrders = orders.filter(o => o.status === 'shipped').length;
  const deliveredOrders = orders.filter(o => o.status === 'delivered').length;
  
  // Calculate average processing time (pending to packed)
  const packedOrdersWithTime = orders.filter(o => o.packedAt && o.createdAt);
  const totalProcessingTime = packedOrdersWithTime.reduce((sum, order) => {
    const processingTime = order.packedAt!.getTime() - order.createdAt.getTime();
    return sum + processingTime;
  }, 0);
  const averageProcessingTime = packedOrdersWithTime.length > 0
    ? totalProcessingTime / packedOrdersWithTime.length / (1000 * 60 * 60) // Convert to hours
    : 0;
  
  // Order fulfillment rate (delivered / total)
  const orderFulfillmentRate = totalOrders > 0 ? (deliveredOrders / totalOrders) * 100 : 0;
  
  // Low stock items
  const lowStockItems = products.filter(p => p.stockLevel <= p.reorderPoint).length;
  
  // Inventory turnover (simplified calculation)
  const inventoryTurnover = deliveredOrders > 0 ? deliveredOrders / 30 : 0;
  
  return {
    totalOrders,
    pendingOrders,
    packedOrders,
    shippedOrders,
    deliveredOrders,
    averageProcessingTime,
    inventoryTurnover,
    orderFulfillmentRate,
    lowStockItems,
  };
};

/**
 * REST API: GET /analytics/transactions
 * Fetch inventory transactions
 */
export const fetchTransactions = async (limit?: number): Promise<InventoryTransaction[]> => {
  await delay();
  
  const sorted = [...transactions].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  return limit ? sorted.slice(0, limit) : sorted;
};

/**
 * REST API: DELETE /orders/:id
 * Cancel an order and release inventory
 */
export const cancelOrder = async (orderId: string): Promise<void> => {
  await delay(400);
  
  const orderIndex = orders.findIndex(o => o.id === orderId);
  if (orderIndex === -1) {
    throw new Error('Order not found');
  }
  
  const order = orders[orderIndex];
  
  // Only allow cancellation of pending orders
  if (order.status !== 'pending') {
    throw new Error('Only pending orders can be cancelled');
  }
  
  // Release allocated inventory
  for (const item of order.items) {
    const productIndex = products.findIndex(p => p.id === item.productId);
    if (productIndex !== -1) {
      products[productIndex].stockLevel += item.quantity;
      
      transactions.push({
        id: `TXN${transactions.length + 1}`,
        productId: item.productId,
        orderId,
        type: 'release',
        quantity: item.quantity,
        timestamp: new Date(),
        notes: 'Order cancelled',
      });
    }
  }
  
  // Remove order
  orders.splice(orderIndex, 1);
};
