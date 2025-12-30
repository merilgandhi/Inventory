import React, { useEffect, useMemo, useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
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
  const [creating, setCreating] = useState(false);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const navigate = useNavigate();

  const { orderId } = useParams<{ orderId: string }>();
  const orderid = orderId ? Number(orderId) : undefined;

  const pathname = window.location.pathname;

  const mode: OrderMode = pathname.includes("/edit")
    ? "update"
    : pathname.includes("/view")
      ? "view"
      : "create";

  // Validation Schema
  const validationSchema = Yup.object({
    selectedSeller: Yup.number()
      .required("Please select a seller")
      .positive("Invalid seller selection"),
    orderQuantities: Yup.object().test(
      "has-items",
      "Please add at least one item to the order",
      (value) => {
        if (!value) return false;

        // Check if any quantity > 0
        return Object.values(value).some((productVariants: any) =>
          Object.values(productVariants || {}).some(
            (variantData: any) => (variantData?.quantity || 0) > 0
          )
        );
      }
    ),
  });

  // Formik
  const formik = useFormik({
    initialValues: {
      selectedSeller: "" as number | "",
      orderQuantities: {} as any,
    },
    validationSchema,
    validateOnChange: true,
    validateOnBlur: true,
    onSubmit: async (values) => {
      const items = buildItems(values.orderQuantities);

      try {
        setCreating(true);

        if (mode === "update") {
          await OrderService.updateOrder(orderid!, { items });
          toast.custom(() => <SuccessToast message="Order updated successfully" />);
        } else {
          await OrderService.createOrder({
            sellerId: values.selectedSeller as number,
            items,
            grandTotal: grandTotal(
              products,
              globalVariants,
              (productId, variationId) =>
                values.orderQuantities[productId]?.[variationId]?.quantity || 0
            ),
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
    },
  });

  const getQty = (productId: number, variationId: number) => {
    return formik.values.orderQuantities[productId]?.[variationId]?.quantity || 0;
  };

  const updateQuantity = (
    productId: number,
    variantId: number,
    value: number
  ) => {
    formik.setFieldValue(`orderQuantities.${productId}.${variantId}`, {
      ...(formik.values.orderQuantities[productId]?.[variantId] || {}),
      quantity: value,
    });
  };

  const buildItems = (orderQuantities: any) => {
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

            if (mode === "update" && data.orderProductVariationId) {
              itemData.orderProductVariationId = data.orderProductVariationId;
            }

            result.push(itemData);
          }
        });
      }
    );

    return result;
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

      formik.setFieldValue("selectedSeller", orderData.seller.id);

      const quantities: any = {};

      orderData.items.forEach((item: any) => {
        if (!item || !item.product || !item.productVariation) {
          console.warn("Skipping invalid item:", item);
          return;
        }

        const productId = item.product.id;
        const productVariationId = item.productVariation.id;

        if (!productId || !productVariationId) {
          console.warn("Missing productId or productVariationId:", item);
          return;
        }

        const product = products.find((p) => p.id === productId);
        if (!product) {
          console.warn(`Product not found: ${productId}`);
          return;
        }

        const matchedVariant = product.variants.find(
          (v) => v.vId === productVariationId
        );

        if (!matchedVariant) {
          console.warn(`Variant not found for productVariationId: ${productVariationId}`);
          return;
        }

        if (!quantities[productId]) {
          quantities[productId] = {};
        }

        quantities[productId][matchedVariant.vId] = {
          quantity: item.quantity,
          orderProductVariationId: item.id,
        };
      });

      formik.setFieldValue("orderQuantities", quantities);
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
    product: 100,
    subtotal: 100,
    gst: 100,
    total: 100,
  });

  useEffect(() => {
    if (!globalVariants.length) return;

    setColWidths((prev) => {
      const next = { ...prev };
      globalVariants.forEach((gv) => {
        const key = `v-${gv.id}`;
        if (!next[key]) next[key] = 200;
      });
      return next;
    });
  }, [globalVariants]);


  const colSpan = globalVariants.length * 3 + 4;

  const doTotal = useMemo(() => {
    const total: any = {};
    const orderItem = Object.keys(formik.values.orderQuantities) as unknown as number[];

    orderItem.forEach((item: number) => {
      const product = products.find((pro) => pro.id == item);
      if (!product) {
        return;
      }

      let productTotal = 0;

      product.variants.forEach((variant) => {
        const qty = Number(formik.values.orderQuantities[item]?.[variant.vId]?.quantity) || 0;
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
  }, [formik.values.orderQuantities, products]);

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
    <form onSubmit={formik.handleSubmit} className="p-6 space-y-6">
      {/* Header */}
      {mode !== "create" && (
        <button
          type="button"
          onClick={() => navigate("/orderslist")}
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900"
        >
          ← Back to Orders List
        </button>
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
            type="submit"
            disabled={creating || loadingOrder || !formik.isValid}
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
      <div className="bg-white p-4 rounded shadow border">
        <div className="flex items-center gap-4">
          <label className="font-medium text-slate-700">
            {mode === "create" ? "Select Seller:" : "Seller:"}
          </label>
          <div className="flex-1">
            <select
              name="selectedSeller"
              disabled={mode !== "create"}
              className={`px-3 py-2 border rounded ${mode !== "create" ? "bg-slate-100 cursor-not-allowed text-slate-700" : ""
                } ${formik.touched.selectedSeller && formik.errors.selectedSeller
                  ? "border-red-500"
                  : ""
                }`}
              value={formik.values.selectedSeller}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            >
              <option value="">-- Choose Seller --</option>
              {sellers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            {formik.touched.selectedSeller && formik.errors.selectedSeller && (
              <div className="text-red-500 text-xs mt-1">
                {formik.errors.selectedSeller}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Validation Error for Items */}
      {formik.touched.orderQuantities && formik.errors.orderQuantities && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {formik.errors.orderQuantities as string}
        </div>
      )}

      {loadingOrder ? (
        <div className="bg-white p-8 rounded shadow text-center border">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mb-4"></div>
          <p className="text-slate-600">Loading order details...</p>
        </div>
      ) : !formik.values.selectedSeller && mode === "create" ? (
        <div className="bg-white p-6 rounded shadow text-center text-slate-500 border">
          Please select a seller to view products & variants.
        </div>
      ) : (
        <div className="relative bg-white rounded-lg border shadow">
          <div className="overflow-x-auto">
            <div className="max-h-[600px] overflow-y-auto">
              <table
                className="min-w-[1600px] table-fixed border-collapse">
                <thead>
                  <tr>
                    <th
                      style={{ ...headerStyle, width: colWidths.product }}
                      className="text-left px-4 py-3 border-r text-slate-200 uppercase tracking-wide text-xs">
                      Product
                    </th>
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
                        <td
                          style={{ ...stickyLeftStyle, width: colWidths.product }}
                          className="px-4 py-3 border-r"
                        >
                          {product.name}
                        </td>


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

                <tfoot
                  style={footerstyle}>
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

                    <td className="px-3 py3 text-right tabular-nums">
                      ₹ {footerTotals.subtotal.toFixed(2)}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums text-amber-300">
                      ₹ {footerTotals.gst.toFixed(2)}
                    </td>
                    <td className="px-2 py-3 text-right tabular-nums text-emerald-300 text-lg">
                      ₹ {footerTotals.total.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}

const stickyLeftStyle: React.CSSProperties = {
  position: "sticky",
  left: 0,
  background: "#f8fafc",
  zIndex: 25,
};
const headerStyle: React.CSSProperties = {
  position: "sticky",
  top: 0,
  background: "#0f172a",
  color: "#e5e7eb",
  zIndex: 20,
};
const footerstyle: React.CSSProperties = {
  position: "sticky",
  bottom: 0,
  background: "#0f172a",
  color: "#e5e7eb",
  zIndex: 20,
};