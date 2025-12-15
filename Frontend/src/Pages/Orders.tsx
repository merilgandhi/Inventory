import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import client from "../Services/clientServices";
import toast from "react-hot-toast";
import { SuccessToast, ErrorToast } from "../components/ToastStyles";
import { variantCellTotals, productTotals, grandTotal } from "../utils/orderCalculations";

type Seller = { id: number; name: string };
type RawVariant = any;
type Variant = {
  id: number;
  name: string;
  price: number; // per strip
  boxQuantity: number; // strips per box
};
type Product = {
  id: number;
  name: string;
  gst: number;
  variants: Variant[];
};
export default function Orders() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [selectedSeller, setSelectedSeller] = useState<number | "">("");
  const [products, setProducts] = useState<Product[]>([]);
  const [sellerQuantities, setSellerQuantities] = useState<
    Record<number, Record<string, number>>
  >({});
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const quantities =
    selectedSeller && sellerQuantities[selectedSeller]
      ? sellerQuantities[selectedSeller]
      : {};

  // helper to key quantities by product + variant
  const getQty = (pId: number, vId: number) => Number(quantities[`${pId}__${vId}`] ?? 0);
  const setQty = (pId: number, vId: number, val: number) => {
    if (!selectedSeller) return;
    setSellerQuantities((prev) => ({
      ...prev,
      [selectedSeller]: {
        ...(prev[selectedSeller] || {}),
        [`${pId}__${vId}`]: val,
      },
    }));
  };

  // fetch sellers
  const fetchSellers = async () => {
    try {
      const res = await client.get("/sellers?limit=999");
      const list = res?.data?.data || res?.data?.sellers || res?.data || [];
      setSellers(list);
    } catch (err) {
      toast.custom(() => <ErrorToast message="Failed to load sellers" />);
    }
  };

  // fetch products & normalize variants
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await client.get("/products?limit=999");
      const list = res?.data?.products || res?.data?.data || res?.data || [];

      const normalized: Product[] = (list || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        gst: Number(p.gst ?? 0),
        variants: (p.variants || []).map((v: RawVariant) => ({
          id: v.variationId ?? v.id,
          name: v.Variation?.name ?? v.name ?? "Variant",
          price: Number(v.price ?? 0),
          boxQuantity: Number(v.boxQuantity ?? v.box_quantity ?? 1),
        })),
      }));

      setProducts(normalized);
    } catch (err) {
      toast.custom(() => <ErrorToast message="Failed to load products" />);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSellers();
    fetchProducts();
  }, []);


  const globalVariants = useMemo(() => {
    const map = new Map<number, { id: number; name: string }>();
    for (const p of products) {
      for (const v of p.variants) {
        if (!map.has(v.id)) map.set(v.id, { id: v.id, name: v.name });
      }
    }
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
      for (const gv of globalVariants) {
        const k = `v-${gv.id}`;
        if (!next[k]) next[k] = 160;
      }
      return next;
    });
  }, [globalVariants]);

  const resizingRef = useRef<{ key: string; startX: number; startWidth: number } | null>(null);

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!resizingRef.current) return;
    const { key, startX, startWidth } = resizingRef.current;
    const newW = Math.max(40, startWidth + (e.clientX - startX));
    setColWidths((prev) => ({ ...prev, [key]: newW }));
  }, []);

  const onMouseUp = useCallback(() => {
    resizingRef.current = null;
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
  }, [onMouseMove]);

  // cleanup listeners on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, [onMouseMove, onMouseUp]);

  const onMouseDownResize = (e: React.MouseEvent, key: string) => {
    e.preventDefault();
    resizingRef.current = { key, startX: e.clientX, startWidth: colWidths[key] ?? 120 };
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  const createOrder = async () => {
    if (!selectedSeller) {
      toast.custom(() => <ErrorToast message="Please select a seller" />);
      return;
    }

    const items: any[] = [];
    for (const p of products) {
      for (const gv of globalVariants) {
        const c = variantCellTotals(p, gv.id, getQty);
        if (!c.exists) continue;
        if (!c.strips || c.strips <= 0) continue;
        items.push({
          productId: p.id,
          productVariantId: gv.id,
          quantity: c.strips,
          total: c.total,
        });
      }
    }

    if (items.length === 0) {
      toast.custom(() => <ErrorToast message="Enter at least one quantity" />);
      return;
    }

    try {
      setCreating(true);
      const res = await client.post("/orders/sell", {
        sellerId: selectedSeller,
        items,
        grandTotal: grandTotal(products, globalVariants, getQty),
      });
      toast.custom(() => (
        <SuccessToast message={res?.data?.message || "Order created"} />
      ));
      setSellerQuantities((prev) => {
        const copy = { ...prev };
        delete copy[selectedSeller as number];
        return copy;
      });
    } catch (err: any) {
      toast.custom(() => (
        <ErrorToast
          message={err?.response?.data?.message || "Failed to create order"}
        />
      ));
    } finally {
      setCreating(false);
    }
  };

  // sticky left inline styles
  const stickyLeftStyle: React.CSSProperties = {
    position: "sticky",
    left: 0,
    zIndex: 20,
    background: "white",
  };
  const headerStyle: React.CSSProperties = {
    position: "sticky",
    top: 0,
    background: "#0f1724",
    color: "white",
    padding: "12px",
    border: "1px solid rgba(0,0,0,0.08)",
  };

  const headerLeftStyle: React.CSSProperties = { ...headerStyle, left: 0, zIndex: 30 };

  const resizerStyle: React.CSSProperties = { position: "absolute", right: 0, top: 0, bottom: 0, width: 8, cursor: "col-resize" };
  const resizerInnerStyle: React.CSSProperties = { position: "absolute", right: 3, top: "50%", transform: "translateY(-50%)", width: 2, height: "56%", background: "rgba(255,255,255,0.5)" };

  const renderResizer = (key: string) => (
    <div onMouseDown={(e) => onMouseDownResize(e, key)} style={resizerStyle}>
      <div style={resizerInnerStyle} />
    </div>
  );

  const colSpan = globalVariants.length + 4;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Create Order</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={createOrder}
            disabled={creating}
            className="px-4 py-2 bg-slate-900 text-white rounded font-semibold"
          >
            {creating ? "Creating..." : "Create Order"}
          </button>
        </div>
      </div>

      {/* Seller select */}
      <div className="bg-white p-4 rounded shadow border flex items-center gap-4">
        <label className="font-medium text-slate-700">Select Seller</label>
        <select
          className="px-3 py-2 border rounded"
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

      {/* prompt when no seller */}
      {!selectedSeller ? (
        <div className="bg-white p-6 rounded shadow text-center text-slate-500 border">
          Please select a seller to view products & variants.
        </div>
      ) : (
        <div className="bg-white border rounded shadow overflow-hidden">
          {/* horizontal scroll wrapper — table inside */}
          <div className="overflow-auto" style={{ maxHeight: "620px" }}>
            <table className="min-w-full border-collapse" style={{ tableLayout: "fixed" }}>
              <thead>
                <tr>
                  {/* sticky product header */}
                  <th
                    style={{
                      ...headerLeftStyle,
                      padding: "12px",
                      border: "1px solid rgba(0,0,0,0.08)",
                      width: colWidths.product,
                      position: "sticky",
                      left: 0,
                    }}
                    className="text-left relative"
                  >
                    Products
                    {renderResizer("product")}
                  </th>

                  {/* global variant headers */}
                  {globalVariants.map((gv) => {
                    const key = `v-${gv.id}`;
                    return (
                      <th key={gv.id} style={{ ...headerStyle, padding: "10px 8px", width: colWidths[key] }} className="relative">
                        <div className="text-amber-300 font-medium whitespace-nowrap text-sm">{gv.name}</div>
                            {renderResizer(key)}
                      </th>
                    );
                  })}

                  <th style={{ ...headerStyle, width: colWidths.subtotal }} className="text-right relative">Subtotal{renderResizer("subtotal")}</th>
                  <th style={{ ...headerStyle, width: colWidths.gst }} className="text-right relative">GST{renderResizer("gst")}</th>
                  <th style={{ ...headerStyle, width: colWidths.total }} className="text-right">Total</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={colSpan} className="p-6 text-center">
                      Loading products...
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={colSpan} className="p-6 text-center">
                      No products available
                    </td>
                  </tr>
                ) : (
                  products.map((product) => {
                    const pTotals = productTotals(product, globalVariants, getQty);

                    return (
                      <tr key={product.id} className="align-top">
                        {/* sticky left product cell */}
                        <td
                          style={{ ...(stickyLeftStyle as React.CSSProperties), width: colWidths.product }}
                          className="p-3 border bg-slate-50 font-medium"
                        >
                          {product.name}
                        </td>

                        {/* variant cells in same order as headers */}
                        {globalVariants.map((gv) => {
                          const c = variantCellTotals(product, gv.id, getQty);
                          if (!c.exists) {
                            return (
                              <td
                                key={gv.id}
                                className="p-3 border text-center text-slate-400"
                              >
                                —
                              </td>
                            );
                          }

                          // NEW 3-box compact layout
                          return (
                            <td key={gv.id} className="p-3 border align-top">
                              <div className="bg-[#f8fafc] rounded p-2 text-xs text-slate-700 border border-slate-300 ">
                                {/* header row: variant name + price */}
                                <div className="flex justify-between items-center mb-2">
                                  <div className="text-slate-900 font-semibold text-sm">
                                    {c.variantName}
                                  </div>
                                  <div className="text-[11px] text-slate-600">
                                    ₹{c.price} GST({product.gst}%)
                                  </div>
                                </div>

                                {/* three boxes */}
                                <div className="flex gap-2 w-full">
                                  {/* Strip Quantity */}
                                  <div className="flex flex-col items-center w-1/3">
                                    <div className="text-[10px] text-slate-600 mb-1">
                                      Qty[Strips]
                                    </div>
                                    <input
                                      type="number"
                                      min={0}
                                      value={c.strips}
                                      onChange={(e) =>
                                        setQty(
                                          product.id,
                                          gv.id,
                                          Math.max(
                                            0,
                                            Number(e.target.value) || 0
                                          )
                                        )
                                      }
                                      className="w-full px-1 py-6px border border-slate-300 bg-white rounded text-right text-xs text-slate-800"
                                    />
                                  </div>

                                  {/* Boxes */}
                                  <div className="flex flex-col items-center w-1/3">
                                    <div className="text-[10px] text-slate-600 mb-1">
                                      Boxes
                                    </div>
                                    <div className="w-full text-center bg-white border border-slate-300 rounded py-6px text-xs text-slate-800">
                                      {c.boxes}
                                    </div>
                                  </div>

                                  {/* Remaining Strips */}
                                  <div className="flex flex-col items-center w-1/3">
                                    <div className="text-[10px] text-slate-600 mb-1">
                                      Strips
                                    </div>
                                    <div className="w-full text-center bg-white border border-slate-300 rounded py-6px text-xs text-slate-800">
                                      {c.remaining}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </td>
                          );
                        })}

                        {/* Subtotal, GST, Total */}
                        <td className="p-3 border text-right">₹ {pTotals.subtotal.toFixed(2)}</td>
                        <td className="p-3 border text-right">₹ {pTotals.gstAmount.toFixed(2)}</td>
                        <td className="p-3 border text-right font-semibold">₹ {pTotals.total.toFixed(2)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>

              <tfoot>
                <tr>
                  {/* left footer placeholder (sticky left) */}
                  <td style={headerLeftStyle}></td>

                  {/* footer cells for each variant (empty for now) */}
                  {globalVariants.map((gv) => (
                    <td
                      key={gv.id}
                      style={{ width: colWidths[`v-${gv.id}`] }}
                      className="p-3 border bg-slate-800 text-white text-center text-xs"
                    ></td>
                  ))}

                  <td className="p-3 border bg-slate-800 text-white text-right font-semibold">
                    Grand Subtotal
                  </td>
                  <td className="p-3 border bg-slate-800 text-white text-right">
                    —
                  </td>
                  <td className="p-3 border bg-slate-800 text-white text-right font-bold">
                    ₹ {grandTotal(products, globalVariants, getQty).toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
