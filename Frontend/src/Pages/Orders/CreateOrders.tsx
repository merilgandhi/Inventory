import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { SuccessToast, ErrorToast } from "../../components/ToastStyles";
import OrderVariantCell from "../../components/OrderVariantCell";
import { useOrders } from "../../hooks/useOrders";
import { OrderService } from "../../Services/order.service";
import { grandTotal } from "../../utils/orderCalculations";
import type { OrderMode, Product } from "../../types/order.types";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";

export default function CreateOrders({
  onSuccess,
}: {
  onSuccess?: () => void;
}) {
  const { sellers, products, loading } = useOrders();

  const [selectedSeller, setSelectedSeller] = useState<number | "">("");
  const [orderQuantities, setOrderQuantities] = useState<any>({});
  const [creating, setCreating] = useState(false);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const navigate = useNavigate();

  const getQty = (productId: number, variationId: number) => {
    return orderQuantities[productId]?.[variationId]?.quantity || 0;
  };

  const { orderId } = useParams<{ orderId: string }>();
  const orderid = orderId ? Number(orderId) : undefined;

  const pathname = window.location.pathname;

  const mode: OrderMode = pathname.includes("/edit")
    ? "update"
    : pathname.includes("/view")
      ? "view"
      : "create";

  const updateQuantity = (
    productId: number,
    variantId: number,
    value: number
  ) => {
    setOrderQuantities((prev: any) => ({
      ...prev,
      [productId]: {
        ...(prev[productId] || {}),
        [variantId]: {
          ...(prev[productId]?.[variantId] || {}),
          quantity: value,
        },
      },
    }));
  };

  useEffect(() => {
    if (mode === "view" || mode === "update") {
      if (!orderid || products.length === 0) return;
      fetchOrderById(orderid);
    }
  }, [orderid, mode, products]);

  const fetchOrderById = async (id: number) => {
    try {
      setLoadingOrder(true);
      const orderData = await OrderService.getOrderById(id);
      setSelectedSeller(orderData.seller.id);

      const quantities: any = {};

      orderData.items.forEach((item: any) => {
        // Add null checks for item properties
        if (!item || !item.product || !item.productVariation) {
          console.warn("Skipping invalid item:", item);
          return;
        }

        const productId = item.product.id;
        const productVariationId = item.productVariation.id; // This is the vId in your frontend

        if (!productId || !productVariationId) {
          console.warn("Missing productId or productVariationId:", item);
          return;
        }

        const product = products.find((p) => p.id === productId);
        if (!product) {
          console.warn(`Product not found: ${productId}`);
          return;
        }

        // Match by vId (which corresponds to productVariation.id from API)
        const matchedVariant = product.variants.find(
          (v) => v.vId === productVariationId
        );

        if (!matchedVariant) {
          console.warn(`Variant not found for productVariationId: ${productVariationId}`, {
            productId,
            productVariationId,
            availableVariants: product.variants.map(v => ({ vId: v.vId, id: v.id, name: v.name }))
          });
          return;
        }

        if (!quantities[productId]) {
          quantities[productId] = {};
        }

        // Store using vId as the key
        quantities[productId][matchedVariant.vId] = {
          quantity: item.quantity,
          orderProductVariationId: item.id,
        };
      });

      console.log("Loaded quantities:", quantities);
      setOrderQuantities(quantities);
    } catch (error) {
      console.error("Error fetching order:", error);
      toast.custom(() => <ErrorToast message="Failed to load order data" />);
    } finally {
      setLoadingOrder(false);
    }
  };

  const globalVariants = useMemo(() => {
    const map = new Map<number, { id: number; name: string }>();

    products.forEach((p: Product) =>
      p.variants.forEach((v) => {
        if (!map.has(v.id)) {
          map.set(v.id, { id: v.id, name: v.name });
        }
      })
    );

    return Array.from(map.values());
  }, [products]);

  const [colWidths, setColWidths] = useState<Record<string, number>>({
    product: 220,
    subtotal: 120,
    gst: 100,
    total: 120,
  });

  useEffect(() => {
    if (!globalVariants.length) return;

    setColWidths((prev) => {
      const next = { ...prev };
      globalVariants.forEach((gv) => {
        const key = `v-${gv.id}`;
        if (!next[key]) next[key] = 160;
      });
      return next;
    });
  }, [globalVariants]);

  const items = useMemo(() => {
    const result: any[] = [];

    Object.entries(orderQuantities).forEach(
      ([productId, variants]: [string, any]) => {
        Object.entries(variants).forEach(([variantId, data]: [string, any]) => {
          const qty = Number(data?.quantity || 0);

          if (qty > 0) {
            const itemData: any = {
              productId: Number(productId),
              productVariationId: Number(variantId),
              quantity: qty,
            };

            // For update mode, include the orderProductVariationId
            if (mode === "update" && data.orderProductVariationId) {
              itemData.orderProductVariationId = data.orderProductVariationId;
            }

            result.push(itemData);
          }
        });
      }
    );

    return result;
  }, [orderQuantities, mode]);

  console.log("Items to submit:", items);

  const submitOrder = async () => {
    if (!selectedSeller) {
      toast.custom(() => <ErrorToast message="Please select a seller" />);
      return;
    }

    if (!items.length) {
      toast.custom(() => <ErrorToast message="Enter at least one quantity" />);
      return;
    }

    try {
      setCreating(true);

      if (mode === "update") {
        await OrderService.updateOrder(orderid!, { items });
        toast.custom(() => <SuccessToast message="Order updated successfully" />);
      } else {
        await OrderService.createOrder({
          sellerId: selectedSeller,
          items,
          grandTotal: grandTotal(products, globalVariants, getQty),
        });
        toast.custom(() => <SuccessToast message="Order created successfully" />);
      }

      onSuccess?.();
      navigate("/orderslist");
    } catch (error) {
      console.error("Order submission error:", error);
      toast.custom(() => <ErrorToast message="Failed to process order" />);
    } finally {
      setCreating(false);
    }
  };

  const colSpan = globalVariants.length * 3 + 4;

  const doTotal = useMemo(() => {
    const total: any = {};
    const orderItem = Object.keys(orderQuantities) as unknown as number[];

    orderItem.forEach((item: number) => {
      const product = products.find((pro) => pro.id == item);
      if (!product) {
        return;
      }

      let productTotal = 0;

      product.variants.forEach((variant) => {
        // Use variant.vId to match how quantities are stored
        const qty = Number(orderQuantities[item]?.[variant.vId]?.quantity) || 0;
        productTotal += qty * Number(variant.price);
      });

      const gst = (productTotal * product.gst) / 100;
      total[item] = {
        productTotal,
        gst,
        finalTotal: productTotal + gst,
      };
    });

    return total;
  }, [orderQuantities, products]);

  const footerTotals = useMemo(() => {
    let subtotal = 0;
    let gst = 0;
    let total = 0;

    Object.values(doTotal).forEach((row: any) => {
      subtotal += row.productTotal || 0;
      gst += row.gst || 0;
      total += row.finalTotal || 0;
    });

    return { subtotal, gst, total };
  }, [doTotal]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      {mode !== "create" && (
        <button
          onClick={() => navigate("/orderslist")}
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900"
        >
          ← Back to Orders List
        </button>
      )}

      {/* View Mode Banner */}
      {mode === "view" && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium text-blue-800">
              Viewing Order #{orderid} in read-only mode
            </span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">
          {mode === "update"
            ? `Update Order #${orderid}`
            : mode === "view"
              ? `View Order #${orderid}`
              : "Create Order"}
        </h1>

        {mode !== "view" && (
          <button
            onClick={submitOrder}
            disabled={creating || loadingOrder}
            className="px-4 py-2 bg-slate-900 text-white rounded font-semibold hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {creating
              ? mode === "update"
                ? "Updating..."
                : "Creating..."
              : mode === "update"
                ? "Update Order"
                : "Create Order"}
          </button>
        )}
      </div>

      {/* Seller Selection */}
      <div className="bg-white p-4 rounded shadow border flex items-center gap-4">
        <label className="font-medium text-slate-700">
          {mode === "create" ? "Select Seller:" : "Seller:"}
        </label>
        <select
          disabled={mode !== "create"}
          className={`px-3 py-2 border rounded ${mode !== "create" ? "bg-slate-100 cursor-not-allowed text-slate-700" : ""
            }`}
          value={selectedSeller}
          onChange={(e) =>
            setSelectedSeller(e.target.value ? Number(e.target.value) : "")
          }
        >
          <option value="">-- Choose Seller --</option>
          {sellers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {loadingOrder ? (
        <div className="bg-white p-8 rounded shadow text-center border">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mb-4"></div>
          <p className="text-slate-600">Loading order details...</p>
        </div>
      ) : !selectedSeller && mode === "create" ? (
        <div className="bg-white p-6 rounded shadow text-center text-slate-500 border">
          Please select a seller to view products & variants.
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-auto">
          <table
            className="min-w-full border-collapse text-sm"
            style={{ tableLayout: "fixed" }}
          >
            <thead>
              <tr>
                {/* Product Header */}
                <th
                  style={{
                    ...headerLeftStyle,
                    width: colWidths.product,
                  }}
                  className="text-left px-4 py-3 border-r text-slate-200 uppercase tracking-wide text-xs"
                >
                  Product
                </th>

                {/* Variant Headers */}
                {globalVariants.map((gv) => (
                  <th
                    key={gv.id}
                    colSpan={3}
                    style={{ ...headerStyle, width: 180 }}
                    className="px-2 py-3 border-r"
                  >
                    <div className="text-amber-300 font-semibold text-xs uppercase tracking-wide whitespace-nowrap text-center">
                      {gv.name}
                    </div>
                  </th>
                ))}

                <th
                  style={{ ...headerStyle, width: colWidths.subtotal }}
                  className="text-right px-4 py-3 border-r uppercase tracking-wide text-xs"
                >
                  Subtotal
                </th>
                <th
                  style={{ ...headerStyle, width: colWidths.gst }}
                  className="text-right px-4 py-3 border-r uppercase tracking-wide text-xs"
                >
                  GST
                </th>
                <th
                  style={{ ...headerStyle, width: colWidths.total }}
                  className="text-right px-4 py-3 uppercase tracking-wide text-xs"
                >
                  Total
                </th>
              </tr>
            </thead>

            {/* ===================== BODY ===================== */}
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={colSpan}
                    className="p-8 text-center text-slate-500"
                  >
                    Loading products…
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td
                    colSpan={colSpan}
                    className="p-8 text-center text-slate-500"
                  >
                    No products available
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr
                    key={product.id}
                    className="align-top hover:bg-slate-50 transition-colors"
                  >
                    {/* Product Name */}
                    <td
                      style={{
                        ...(stickyLeftStyle as React.CSSProperties),
                        width: colWidths.product,
                      }}
                      className="px-4 py-3 border-r bg-slate-50 font-medium text-slate-700"
                    >
                      {product.name}
                    </td>

                    {/* Variant Cells */}
                    {globalVariants.map((gv, index) => {
                      const item = product.variants.find((v) => v.id === gv.id);

                      return item ? (
                        <OrderVariantCell
                          key={`${product.id}-${item.vId}_${index}`}
                          variation={item}
                          quantity={getQty(product.id, item.vId)}
                          disabled={mode === "view"}
                          onChange={(val) =>
                            updateQuantity(product.id, item.vId, val)
                          }
                        />
                      ) : (
                        <td
                          key={`${product.id}-${gv.id}-empty`}
                          colSpan={3}
                          className="text-center text-slate-400 border-r py-3"
                        >
                          —
                        </td>
                      );
                    })}

                    {/* Row Totals */}
                    <td className="px-4 py-3 text-right border-r tabular-nums text-slate-700">
                      {doTotal[product.id]?.productTotal?.toFixed(2) || "0.00"}
                    </td>
                    <td className="px-4 py-3 text-right border-r tabular-nums text-slate-700">
                      {doTotal[product.id]?.gst?.toFixed(2) || "0.00"}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-semibold text-slate-800">
                      {doTotal[product.id]?.finalTotal?.toFixed(2) || "0.00"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>

            {/* ===================== FOOTER ===================== */}
            <tfoot>
              <tr className="bg-slate-900 text-white font-semibold">
                <td
                  style={{
                    ...(stickyLeftStyle as React.CSSProperties),
                    width: colWidths.product,
                  }}
                  className="px-4 py-4 text-right uppercase tracking-wide"
                >
                  Grand Total
                </td>

                {globalVariants.map((gv) => (
                  <td key={gv.id} colSpan={3}></td>
                ))}

                <td className="px-4 py-4 text-right tabular-nums">
                  ₹ {footerTotals.subtotal.toFixed(2)}
                </td>
                <td className="px-4 py-4 text-right tabular-nums text-amber-300">
                  ₹ {footerTotals.gst.toFixed(2)}
                </td>
                <td className="px-4 py-4 text-right tabular-nums text-emerald-300 text-lg">
                  ₹ {footerTotals.total.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}

const stickyLeftStyle: React.CSSProperties = {
  position: "sticky",
  left: 0,
  zIndex: 20,
  background: "#f8fafc",
};

const headerStyle: React.CSSProperties = {
  background: "#0f172a",
  color: "#e5e7eb",
  fontWeight: 600,
  borderBottom: "1px solid rgba(255,255,255,0.08)",
};

const headerLeftStyle: React.CSSProperties = {
  ...headerStyle,
  position: "sticky",
  left: 0,
  zIndex: 30,
};