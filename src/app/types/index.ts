export type OrderStatus = 'pending' | 'packed' | 'shipped' | 'delivered';
export type OrderPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  stockLevel: number;
  reorderPoint: number;
  location: string;
  price: number;
}

export interface OrderItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  price: number;
  location: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  status: OrderStatus;
  priority: OrderPriority;
  items: OrderItem[];
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
  packedAt?: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
  assignedTo?: string;
  trackingNumber?: string;
  shippingAddress: string;
  pickingSequence?: number;
}

export interface InventoryTransaction {
  id: string;
  productId: string;
  orderId?: string;
  type: 'allocation' | 'release' | 'restock' | 'adjustment';
  quantity: number;
  timestamp: Date;
  notes?: string;
}

export interface PerformanceMetrics {
  totalOrders: number;
  pendingOrders: number;
  packedOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  averageProcessingTime: number;
  inventoryTurnover: number;
  orderFulfillmentRate: number;
  lowStockItems: number;
}
