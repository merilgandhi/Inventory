import { useEffect, useState, useMemo } from "react";
import client from "../Services/clientServices";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";

type TodayReport = {
  date: string;
  todaysOrders: {
    date: string;
    totalSales: string;
    orderCount: number;
  };
};

type SellerReport = {
  sellerId: number;
  sellerName: string;
  contactNumber: string;
  email: string;
  products: {
    productId: number;
    productName: string;
    variations: {
      productVariationId: number;
      variationName: string;
      quantity: number;
      revenue: number;
    }[];
  }[];
};

const Dashboard = () => {
  const [todayReport, setTodayReport] = useState<TodayReport | null>(null);
  const [sellerReport, setSellerReport] = useState<SellerReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSellers, setExpandedSellers] = useState<Set<number>>(new Set());

  const toggleSeller = (sellerId: number) => {
    setExpandedSellers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sellerId)) {
        newSet.delete(sellerId);
      } else {
        newSet.add(sellerId);
      }
      return newSet;
    });
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [todayRes, sellerRes] = await Promise.all([
          client.get("/dashboard/today-report"),
          client.get("/dashboard/today-seller-report"),
        ]);

        setTodayReport(todayRes.data.data);
        setSellerReport(sellerRes.data.data);
      } catch (err) {
        console.error("Dashboard fetch failed", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    let totalQuantity = 0;

    sellerReport.forEach((seller) => {
      seller.products.forEach((product) => {
        product.variations.forEach((v) => {
          totalQuantity += v.quantity;
        });
      });
    });

    return {
      totalQuantity,
      totalSellers: sellerReport.length,
    };
  }, [sellerReport]);

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mb-4"></div>
        <p className="text-slate-600">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* ================= HEADER ================= */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-600 mt-1">Today's business overview</p>
        </div>
        <div className="text-sm text-slate-600">
          {todayReport?.todaysOrders.date || "N/A"}
        </div>
      </div>

      {/* ================= METRIC CARDS ================= */}
      {todayReport && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
            <p className="text-sm text-slate-600 mb-1">Total Sales</p>
            <p className="text-2xl font-bold text-slate-900">
              ₹{parseFloat(todayReport.todaysOrders.totalSales).toFixed(2)}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
            <p className="text-sm text-slate-600 mb-1">Orders</p>
            <p className="text-2xl font-bold text-slate-900">
              {todayReport.todaysOrders.orderCount}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
            <p className="text-sm text-slate-600 mb-1">Active Sellers</p>
            <p className="text-2xl font-bold text-slate-900">
              {summaryStats.totalSellers}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
            <p className="text-sm text-slate-600 mb-1">Items Sold</p>
            <p className="text-2xl font-bold text-slate-900">
              {summaryStats.totalQuantity}
            </p>
          </div>
        </div>
      )}

      {/* ================= SELLER REPORT ================= */}
      <div>
        <h2 className="text-xl font-semibold text-slate-900 mb-4">
          Seller-wise Sales Report
        </h2>

        {sellerReport.length === 0 ? (
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-12 text-center">
            <p className="text-slate-500">No sales recorded for today</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sellerReport.map((seller) => {
              const sellerTotal = seller.products.reduce(
                (sum, product) =>
                  sum +
                  product.variations.reduce((vSum, v) => vSum + v.revenue, 0),
                0
              );

              const sellerQuantity = seller.products.reduce(
                (sum, product) =>
                  sum +
                  product.variations.reduce((vSum, v) => vSum + v.quantity, 0),
                0
              );

              return (
                <div
                  key={seller.sellerId}
                  className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden"
                >
                  {/* SELLER HEADER - Clickable */}
                  <div 
                    className="bg-slate-50 border-b border-slate-200 p-5 cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => toggleSeller(seller.sellerId)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-slate-600">
                          {expandedSellers.has(seller.sellerId) ? (
                            <FiChevronUp size={20} />
                          ) : (
                            <FiChevronDown size={20} />
                          )}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900 mb-1">
                            {seller.sellerName}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-slate-600">
                            <span>{seller.contactNumber}</span>
                            <span>•</span>
                            <span>{seller.email}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-8 text-right">
                        <div>
                          <p className="text-xs text-slate-500 uppercase mb-1">Items</p>
                          <p className="text-xl font-bold text-slate-900">{sellerQuantity}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 uppercase mb-1">Revenue</p>
                          <p className="text-xl font-bold text-emerald-600">
                            ₹{sellerTotal.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* PRODUCTS - Collapsible */}
                  {expandedSellers.has(seller.sellerId) && (
                    <div className="divide-y divide-slate-200">
                    {seller.products.map((product) => {
                      const productTotal = product.variations.reduce(
                        (sum, v) => sum + v.revenue,
                        0
                      );
                      const productQuantity = product.variations.reduce(
                        (sum, v) => sum + v.quantity,
                        0
                      );

                      return (
                        <div key={product.productId}>
                          {/* Product Header */}
                          <div className="bg-slate-100 px-5 py-3 flex items-center justify-between">
                            <h4 className="font-semibold text-slate-900">
                              {product.productName}
                            </h4>
                            <div className="flex gap-6 text-sm">
                              <span className="text-slate-600">
                                Qty: <span className="font-semibold text-slate-900">{productQuantity}</span>
                              </span>
                              <span className="font-semibold text-emerald-600">
                                ₹{productTotal.toFixed(2)}
                              </span>
                            </div>
                          </div>

                          {/* Variations Table */}
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-slate-900 text-white">
                                <th className="text-left px-5 py-3 border-r border-slate-700 uppercase text-xs">
                                  Variation
                                </th>
                                <th className="text-right px-5 py-3 border-r border-slate-700 uppercase text-xs">
                                  Quantity
                                </th>
                                <th className="text-right px-5 py-3 uppercase text-xs">
                                  Revenue
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {product.variations.map((v) => (
                                <tr
                                  key={v.productVariationId}
                                  className="border-b border-slate-200 hover:bg-slate-50"
                                >
                                  <td className="px-5 py-3 border-r text-slate-700">
                                    {v.variationName}
                                  </td>
                                  <td className="px-5 py-3 text-right border-r tabular-nums font-medium text-slate-900">
                                    {v.quantity}
                                  </td>
                                  <td className="px-5 py-3 text-right tabular-nums font-semibold text-emerald-600">
                                    ₹{v.revenue.toFixed(2)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      );
                    })}
                  </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;