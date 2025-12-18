import { useEffect, useState } from "react";
import { FiEye, FiEdit, FiTrash2 } from "react-icons/fi";
import client from "../../Services/clientServices";
import toast from "react-hot-toast";
import { ErrorToast, SuccessToast } from "../../components/ToastStyles";
import CreateOrders from "./CreateOrders"; // adjust path if needed

type Mode = "list" | "view" | "update";

const OrdersList = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // controls which screen is visible
  const [mode, setMode] = useState<Mode>("list");
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  /* ================= FETCH ORDERS ================= */

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await client.get("/orders");
      setOrders(res.data.data || []);
    } catch {
      toast.custom(() => <ErrorToast message="Failed to load orders" />);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  /* ================= DELETE ================= */

  const handleDelete = async (orderId: number) => {
    if (!window.confirm("Are you sure you want to delete this order?")) return;

    try {
      await client.delete(`/orders/${orderId}`);
      toast.custom(() => <SuccessToast message="Order deleted successfully" />);
      fetchOrders();
    } catch {
      toast.custom(() => <ErrorToast message="Failed to delete order" />);
    }
  };

  /* ================= VIEW ================= */

  const handleView = (orderId: number) => {
    setSelectedOrderId(orderId);
    setMode("view");
  };

  /* ================= UPDATE ================= */

  const handleUpdate = (orderId: number) => {
    setSelectedOrderId(orderId);
    setMode("update");
  };

  /* ================= BACK TO LIST ================= */

  const goBackToList = () => {
    setSelectedOrderId(null);
    setMode("list");
    fetchOrders();
  };

  /* ================= RENDER ================= */

  // 👉 VIEW MODE
  if (mode === "view" && selectedOrderId) {
    return (
      <div className="p-4">
        <button
          onClick={goBackToList}
          className="mb-4 px-3 py-1 border rounded"
        >
          ← Back to Order List
        </button>

        <CreateOrders
          mode="view"
          orderId={selectedOrderId}
        />
      </div>
    );
  }

  // 👉 UPDATE MODE
  if (mode === "update" && selectedOrderId) {
    return (
      <div className="p-4">
        <button
          onClick={goBackToList}
          className="mb-4 px-3 py-1 border rounded"
        >
          ← Back to Order List
        </button>

        <CreateOrders
          mode="update"
          orderId={selectedOrderId}
          onSuccess={goBackToList}
        />
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Order List</h2>

      <div className="overflow-x-auto bg-white rounded shadow">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left">Order ID</th>
              <th className="px-4 py-2 text-left">Seller</th>
              <th className="px-4 py-2 text-right">Subtotal</th>
              <th className="px-4 py-2 text-right">GST</th>
              <th className="px-4 py-2 text-right">Grand Total</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-t">
                <td className="px-4 py-2">{order.id}</td>
                <td className="px-4 py-2">{order.seller?.name || "N/A"}</td>
                <td className="px-4 py-2 text-right">₹{order.subtotal}</td>
                <td className="px-4 py-2 text-right">₹{order.gstTotal}</td>
                <td className="px-4 py-2 text-right font-semibold">
                  ₹{order.grandTotal}
                </td>
                <td className="px-4 py-2">
                  <span className="px-2 py-1 rounded bg-green-100 text-green-700 text-xs">
                    {order.status}
                  </span>
                </td>
                <td className="px-4 py-2 text-center">
                  <div className="flex justify-center gap-3">
                    <FiEye
                      className="cursor-pointer text-blue-600"
                      onClick={() => handleView(order.id)}
                    />
                    <FiEdit
                      className="cursor-pointer text-yellow-600"
                      onClick={() => handleUpdate(order.id)}
                    />
                    <FiTrash2
                      className="cursor-pointer text-red-600"
                      onClick={() => handleDelete(order.id)}
                    />
                  </div>
                </td>
              </tr>
            ))}

            {!loading && orders.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-6">
                  No orders found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrdersList;
