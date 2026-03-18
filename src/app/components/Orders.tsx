import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Package, Search, Plus, RefreshCw, Filter, ArrowUpDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { fetchOrders, updateOrderStatus, fetchPrioritizedOrders } from '../services/api';
import { Order, OrderStatus } from '../types';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

export function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<OrderStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'priority' | 'amount'>('date');

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, searchQuery, activeTab, sortBy]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await fetchOrders();
      setOrders(data);
    } catch (error) {
      console.error('Failed to load orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = orders;

    // Filter by status tab
    if (activeTab !== 'all') {
      filtered = filtered.filter(order => order.status === activeTab);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        order =>
          order.orderNumber.toLowerCase().includes(query) ||
          order.customerName.toLowerCase().includes(query) ||
          order.id.toLowerCase().includes(query)
      );
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      if (sortBy === 'date') {
        return b.createdAt.getTime() - a.createdAt.getTime();
      } else if (sortBy === 'priority') {
        const priorityWeight = { urgent: 4, high: 3, medium: 2, low: 1 };
        return priorityWeight[b.priority] - priorityWeight[a.priority];
      } else {
        return b.totalAmount - a.totalAmount;
      }
    });

    setFilteredOrders(filtered);
  };

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      toast.success('Order status updated successfully');
      loadOrders();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update order status');
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'packed': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'shipped': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'delivered': return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getNextStatus = (currentStatus: OrderStatus): OrderStatus | null => {
    const statusFlow: Record<OrderStatus, OrderStatus | null> = {
      pending: 'packed',
      packed: 'shipped',
      shipped: 'delivered',
      delivered: null,
    };
    return statusFlow[currentStatus];
  };

  const statusCounts = {
    all: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    packed: orders.filter(o => o.status === 'packed').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-500 mt-1">Manage and track all warehouse orders</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadOrders}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by order number, customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-full sm:w-48">
                <ArrowUpDown className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Sort by Date</SelectItem>
                <SelectItem value="priority">Sort by Priority</SelectItem>
                <SelectItem value="amount">Sort by Amount</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
        <TabsList className="grid w-full grid-cols-5 lg:w-auto">
          <TabsTrigger value="all" className="relative">
            All
            <Badge variant="secondary" className="ml-2">{statusCounts.all}</Badge>
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending
            <Badge variant="secondary" className="ml-2">{statusCounts.pending}</Badge>
          </TabsTrigger>
          <TabsTrigger value="packed">
            Packed
            <Badge variant="secondary" className="ml-2">{statusCounts.packed}</Badge>
          </TabsTrigger>
          <TabsTrigger value="shipped">
            Shipped
            <Badge variant="secondary" className="ml-2">{statusCounts.shipped}</Badge>
          </TabsTrigger>
          <TabsTrigger value="delivered">
            Delivered
            <Badge variant="secondary" className="ml-2">{statusCounts.delivered}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredOrders.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Package className="w-16 h-16 text-gray-300 mb-4" />
                <p className="text-gray-500 text-lg">No orders found</p>
                <p className="text-gray-400 text-sm">Try adjusting your filters</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredOrders.map((order) => {
                const nextStatus = getNextStatus(order.status);
                return (
                  <Card key={order.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-start gap-3 mb-3">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Package className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Link to={`/orders/${order.id}`}>
                                  <h3 className="font-bold text-gray-900 hover:text-blue-600">
                                    {order.orderNumber}
                                  </h3>
                                </Link>
                                {order.pickingSequence && (
                                  <Badge variant="outline" className="text-xs">
                                    Queue #{order.pickingSequence}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-600">{order.customerName}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                Created: {order.createdAt.toLocaleDateString()} at {order.createdAt.toLocaleTimeString()}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 mt-3">
                            <Badge className={getStatusColor(order.status)}>
                              {order.status.toUpperCase()}
                            </Badge>
                            <Badge className={getPriorityColor(order.priority)}>
                              {order.priority.toUpperCase()}
                            </Badge>
                            <Badge variant="outline">
                              {order.items.length} items
                            </Badge>
                            <Badge variant="outline">
                              ${order.totalAmount.toFixed(2)}
                            </Badge>
                          </div>

                          {order.trackingNumber && (
                            <p className="text-sm text-gray-600 mt-2">
                              Tracking: <span className="font-mono">{order.trackingNumber}</span>
                            </p>
                          )}
                        </div>

                        <div className="flex flex-col gap-2 lg:items-end">
                          <Link to={`/orders/${order.id}`}>
                            <Button variant="outline" size="sm" className="w-full lg:w-auto">
                              View Details
                            </Button>
                          </Link>
                          {nextStatus && (
                            <Button
                              size="sm"
                              onClick={() => handleStatusChange(order.id, nextStatus)}
                              className="w-full lg:w-auto"
                            >
                              Mark as {nextStatus}
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
