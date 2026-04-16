import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Package, TrendingUp, AlertTriangle, CheckCircle2, Clock, Truck, PackageCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { fetchMetrics, fetchPrioritizedOrders, fetchInventory } from '../services/api';
import { PerformanceMetrics, Order, Product } from '../types';
import { Badge } from './ui/badge';

export function Dashboard() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [prioritizedOrders, setPrioritizedOrders] = useState<Order[]>([]);
  const [lowStockItems, setLowStockItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [metricsData, ordersData, inventoryData] = await Promise.all([
        fetchMetrics(),
        fetchPrioritizedOrders(),
        fetchInventory(),
      ]);

      setMetrics(metricsData);
      setPrioritizedOrders(ordersData.slice(0, 5));
      setLowStockItems(inventoryData.filter(p => p.stockLevel <= p.reorderPoint).slice(0, 5));
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !metrics) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Orders',
      value: metrics.totalOrders,
      icon: Package,
      color: 'bg-blue-500',
      trend: '+12% from last month',
    },
    {
      title: 'Pending Orders',
      value: metrics.pendingOrders,
      icon: Clock,
      color: 'bg-orange-500',
      trend: `${metrics.pendingOrders} awaiting processing`,
    },
    {
      title: 'Fulfillment Rate',
      value: `${metrics.orderFulfillmentRate.toFixed(1)}%`,
      icon: TrendingUp,
      color: 'bg-green-500',
      trend: 'Target: 95%',
    },
    {
      title: 'Low Stock Alerts',
      value: metrics.lowStockItems,
      icon: AlertTriangle,
      color: 'bg-red-500',
      trend: 'Requires attention',
    },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome to your warehouse management system</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-xs text-gray-500 mt-2">{stat.trend}</p>
                  </div>
                  <div className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Order Status Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <PackageCheck className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Packed</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.packedOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Truck className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Shipped</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.shippedOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Delivered</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.deliveredOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priority Queue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle>Priority Queue (Optimized)</CardTitle>
            <Link to="/orders">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {prioritizedOrders.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No pending orders</p>
              </div>
            ) : (
              <div className="space-y-3">
                {prioritizedOrders.map((order) => (
                  <Link key={order.id} to={`/orders/${order.id}`}>
                    <div className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50/50 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium text-gray-900">{order.orderNumber}</p>
                          <p className="text-sm text-gray-600">{order.customerName}</p>
                        </div>
                        <Badge className={getPriorityColor(order.priority)}>
                          #{order.pickingSequence}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">{order.items.length} items</span>
                        <span className="font-medium text-gray-900">
                          ${order.totalAmount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Alerts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle>Low Stock Alerts</CardTitle>
            <Link to="/inventory">
              <Button variant="ghost" size="sm">View Inventory</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {lowStockItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>All items well stocked</p>
              </div>
            ) : (
              <div className="space-y-3">
                {lowStockItems.map((product) => (
                  <div key={product.id} className="p-4 border border-red-200 bg-red-50/50 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{product.name}</p>
                        <p className="text-sm text-gray-600">{product.sku}</p>
                      </div>
                      <AlertTriangle className="w-5 h-5 text-red-600 ml-2" />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Location: {product.location}</span>
                      <div className="text-right">
                        <span className="text-red-700 font-medium">{product.stockLevel} units</span>
                        <span className="text-gray-500 ml-1">/ {product.reorderPoint} min</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>System Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-600 mb-1">Avg Processing Time</p>
              <p className="text-2xl font-bold text-gray-900">
                {metrics.averageProcessingTime.toFixed(1)} hrs
              </p>
              <div className="mt-2 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${Math.min((24 - metrics.averageProcessingTime) / 24 * 100, 100)}%` }}
                ></div>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-1">Inventory Turnover</p>
              <p className="text-2xl font-bold text-gray-900">
                {metrics.inventoryTurnover.toFixed(1)}x
              </p>
              <div className="mt-2 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{ width: `${Math.min(metrics.inventoryTurnover * 10, 100)}%` }}
                ></div>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-1">Fulfillment Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {metrics.orderFulfillmentRate.toFixed(1)}%
              </p>
              <div className="mt-2 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{ width: `${metrics.orderFulfillmentRate}%` }}
                ></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
