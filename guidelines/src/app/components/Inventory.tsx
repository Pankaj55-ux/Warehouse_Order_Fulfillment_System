import { useEffect, useState } from 'react';
import { Package, AlertTriangle, Search, TrendingUp, Edit } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { fetchInventory, updateInventory, fetchTransactions } from '../services/api';
import { Product, InventoryTransaction } from '../types';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Label } from './ui/label';

export function Inventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [newStockLevel, setNewStockLevel] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchQuery]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [inventoryData, transactionData] = await Promise.all([
        fetchInventory(),
        fetchTransactions(10),
      ]);
      setProducts(inventoryData);
      setTransactions(transactionData);
    } catch (error) {
      console.error('Failed to load inventory:', error);
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    if (!searchQuery) {
      setFilteredProducts(products);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = products.filter(
      product =>
        product.name.toLowerCase().includes(query) ||
        product.sku.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query)
    );
    setFilteredProducts(filtered);
  };

  const handleUpdateStock = async () => {
    if (!selectedProduct) return;

    const stockLevel = parseInt(newStockLevel);
    if (isNaN(stockLevel) || stockLevel < 0) {
      toast.error('Please enter a valid stock level');
      return;
    }

    setUpdating(true);
    try {
      await updateInventory(selectedProduct.id, stockLevel);
      toast.success('Stock level updated successfully');
      setDialogOpen(false);
      setSelectedProduct(null);
      setNewStockLevel('');
      loadData();
    } catch (error) {
      toast.error('Failed to update stock level');
    } finally {
      setUpdating(false);
    }
  };

  const openUpdateDialog = (product: Product) => {
    setSelectedProduct(product);
    setNewStockLevel(product.stockLevel.toString());
    setDialogOpen(true);
  };

  const getStockStatus = (product: Product) => {
    if (product.stockLevel === 0) return { label: 'Out of Stock', color: 'bg-red-100 text-red-800 border-red-200' };
    if (product.stockLevel <= product.reorderPoint) return { label: 'Low Stock', color: 'bg-orange-100 text-orange-800 border-orange-200' };
    return { label: 'In Stock', color: 'bg-green-100 text-green-800 border-green-200' };
  };

  const getStockPercentage = (product: Product) => {
    const optimalStock = product.reorderPoint * 3;
    return Math.min((product.stockLevel / optimalStock) * 100, 100);
  };

  const lowStockCount = products.filter(p => p.stockLevel <= p.reorderPoint).length;
  const outOfStockCount = products.filter(p => p.stockLevel === 0).length;
  const totalValue = products.reduce((sum, p) => sum + (p.stockLevel * p.price), 0);

  const categoryGroups = products.reduce((acc, product) => {
    if (!acc[product.category]) acc[product.category] = [];
    acc[product.category].push(product);
    return acc;
  }, {} as Record<string, Product[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
        <p className="text-gray-500 mt-1">Monitor and manage warehouse stock levels</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Products</p>
                <p className="text-3xl font-bold text-gray-900">{products.length}</p>
                <p className="text-xs text-gray-500 mt-2">Across {Object.keys(categoryGroups).length} categories</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Low Stock Alerts</p>
                <p className="text-3xl font-bold text-orange-600">{lowStockCount}</p>
                <p className="text-xs text-gray-500 mt-2">{outOfStockCount} out of stock</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Inventory Value</p>
                <p className="text-3xl font-bold text-gray-900">${totalValue.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-2">At current stock levels</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by product name, SKU, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Products</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No products found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock Level
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProducts.map((product) => {
                    const status = getStockStatus(product);
                    const stockPercentage = getStockPercentage(product);
                    return (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4">
                          <div>
                            <p className="font-medium text-gray-900">{product.name}</p>
                            <p className="text-sm text-gray-500">{product.sku}</p>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <Badge variant="outline">{product.category}</Badge>
                        </td>
                        <td className="px-4 py-4">
                          <span className="font-mono text-sm text-gray-600">{product.location}</span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">{product.stockLevel}</span>
                              <span className="text-sm text-gray-500">/ {product.reorderPoint} min</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  stockPercentage > 50 ? 'bg-green-500' :
                                  stockPercentage > 25 ? 'bg-orange-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${stockPercentage}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <Badge className={status.color}>{status.label}</Badge>
                        </td>
                        <td className="px-4 py-4">
                          <span className="font-medium text-gray-900">${product.price.toFixed(2)}</span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openUpdateDialog(product)}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Update
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No recent transactions</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction) => {
                const product = products.find(p => p.id === transaction.productId);
                const typeColors: Record<string, string> = {
                  allocation: 'bg-red-100 text-red-800',
                  release: 'bg-green-100 text-green-800',
                  restock: 'bg-blue-100 text-blue-800',
                  adjustment: 'bg-gray-100 text-gray-800',
                };

                return (
                  <div key={transaction.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{product?.name || 'Unknown Product'}</p>
                      <p className="text-sm text-gray-600">
                        {transaction.type === 'allocation' ? 'Allocated' : 
                         transaction.type === 'release' ? 'Released' :
                         transaction.type === 'restock' ? 'Restocked' : 'Adjusted'} {transaction.quantity} units
                      </p>
                      {transaction.orderId && (
                        <p className="text-xs text-gray-500 mt-1">Order: {transaction.orderId}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <Badge className={typeColors[transaction.type]}>{transaction.type}</Badge>
                      <p className="text-xs text-gray-500 mt-1">
                        {transaction.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Update Stock Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Stock Level</DialogTitle>
            <DialogDescription>
              Adjust the stock level for {selectedProduct?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Product</Label>
              <p className="font-medium">{selectedProduct?.name}</p>
              <p className="text-sm text-gray-500">SKU: {selectedProduct?.sku}</p>
            </div>
            <div className="space-y-2">
              <Label>Current Stock</Label>
              <p className="text-2xl font-bold text-gray-900">{selectedProduct?.stockLevel} units</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="stockLevel">New Stock Level</Label>
              <Input
                id="stockLevel"
                type="number"
                min="0"
                value={newStockLevel}
                onChange={(e) => setNewStockLevel(e.target.value)}
                placeholder="Enter new stock level"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateStock} disabled={updating}>
              {updating ? 'Updating...' : 'Update Stock'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
