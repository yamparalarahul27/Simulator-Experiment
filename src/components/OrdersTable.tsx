import { OrderData, DeriverseService } from './DeriverseService';

interface OrdersTableProps {
  title: string;
  orders: OrderData[];
  loading?: boolean;
}

export default function OrdersTable({ title, orders, loading = false }: OrdersTableProps) {
  const formatTime = (timestamp: number) => {
    return DeriverseService.formatTime(timestamp);
  };

  const calculatePrice = (sum: number, quantity: number) => {
    return DeriverseService.calculatePrice(sum, quantity);
  };

  if (loading) {
    return (
      <div className="w-full max-w-6xl mx-auto mt-8">
        <h3 className="text-xl font-bold text-white mb-4">{title}</h3>
        <div className="bg-zinc-900 rounded-lg overflow-hidden">
          <div className="animate-pulse">
            <div className="h-12 bg-zinc-800 mb-2"></div>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-10 bg-zinc-800 mb-1"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="w-full max-w-6xl mx-auto mt-8">
        <h3 className="text-xl font-bold text-white mb-4">{title}</h3>
        <div className="bg-zinc-900 rounded-lg p-6 text-center">
          <p className="text-zinc-400">No {title.toLowerCase()} found on Deriverse Devnet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto mt-8">
      <h3 className="text-xl font-bold text-white mb-4">
        {title} ({orders.length} orders)
      </h3>
      <div className="bg-zinc-900 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Sum (Value)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Time
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {orders.map((order, index) => (
                <tr key={`${order.orderId}-${index}`} className="hover:bg-zinc-800 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    #{order.orderId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-300">
                    {order.quantity.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-300">
                    {order.sum.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-300">
                    {calculatePrice(order.sum, order.quantity).toFixed(6)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
                    {formatTime(order.time)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}