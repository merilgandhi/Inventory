import React, { useEffect, useState } from "react";
import client from "../Services/clientServices";
import toast from "react-hot-toast";
import { SuccessToast, ErrorToast } from "./ToastStyles";
import { FiTrash2 } from "react-icons/fi";

const GST_OPTIONS = ["0.00", "5.00", "18.00", "40.00"];

interface ProductFormProps {
  mode: "create" | "edit";
  initialData?: any;
  onSuccess: () => void;
}

const ProductForm: React.FC<ProductFormProps> = ({ mode, initialData, onSuccess }) => {
  const [variations, setVariations] = useState<any[]>([]);

  const [form, setForm] = useState({
    name: "",
    gst: "",
    hsn: "",
    isActive: "yes",
    selectedVariation: "",
    variantRows: [] as any[],
  });

  const [errors, setErrors] = useState<any>({});

  const loadVariations = async () => {
    try {
      const res = await client.get("/variations");
      setVariations(res.data.data || []);
    } catch {
      toast.custom(<ErrorToast message="Failed to load variations" />);
    }
  };

  useEffect(() => {
    loadVariations();

    if (mode === "edit" && initialData) {
      setForm({
        name: initialData.name ?? "",
        gst: String(initialData.gst ?? ""),
        hsn: String(initialData.hsn ?? ""),
        isActive: initialData.isActive ? "yes" : "no",
        selectedVariation: "",
        variantRows: initialData.variants.map((v: any) => ({
          id: v.id,
          variationId: v.variationId,
          variationName: v.Variation?.name ?? "",
          price: v.price?.toString() ?? "",
          productQrCode: v.productQrCode ?? "",
          boxQuantity: v.boxQuantity?.toString() ?? "",
          boxQrCode: v.boxQrCode ?? "",
          stockInHand: v.stockInHand?.toString() ?? "",
        })),
      });
    }
  }, [mode, initialData]);

  // ---------------- STATE UPDATERS ----------------
  const updateField = (field: string, value: any) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const updateVariant = (i: number, field: string, value: any) => {
    setForm((prev) => {
      const rows = prev.variantRows.map((row, index) =>
        index === i ? { ...row, [field]: value } : row
      );
      return { ...prev, variantRows: rows };
    });
  };

  // ---------------- ADD VARIANT ROW ----------------
  const addVariantRow = () => {
    if (!form.selectedVariation) {
      toast.custom(<ErrorToast message="Select a variant first" />);
      return;
    }

    const selected = variations.find((v) => v.id == form.selectedVariation);
    if (!selected) return;

    if (form.variantRows.some((r) => r.variationId == selected.id)) {
      toast.custom(<ErrorToast message="Variant already added" />);
      return;
    }

    setForm((prev) => ({
      ...prev,
      variantRows: [
        ...prev.variantRows,
        {
          id: null,
          variationId: selected.id,
          variationName: selected.name,
          price: "",
          productQrCode: "",
          boxQuantity: "",
          boxQrCode: "",
          stockInHand: "",
        },
      ],
    }));
  };

  // ---------------- VALIDATION ----------------
  const validate = () => {
    const e: any = {};

    if (!form.name.trim()) e.name = "Product name is required";
    if (!form.gst) e.gst = "GST is required";
    if (!form.hsn) e.hsn = "HSN is required";

    form.variantRows.forEach((row, i) => {
      ["price", "productQrCode", "boxQuantity", "boxQrCode", "stockInHand"].forEach((f) => {
        if (!row[f]) e[`${f}_${i}`] = "Required";
      });
    });

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ---------------- SUBMIT ----------------
  const handleSubmit = async () => {
    if (!validate()) return;

    const payload = {
      name: form.name,
      gst: Number(form.gst),
      hsn: Number(form.hsn),
      isActive: form.isActive === "yes",
      variants: form.variantRows.map((row) => ({
        id: row.id,
        variationId: row.variationId,
        price: Number(row.price),
        productQrCode: row.productQrCode,
        boxQuantity: Number(row.boxQuantity),
        boxQrCode: row.boxQrCode,
        stockInHand: Number(row.stockInHand),
      })),
    };

    try {
      const res =
        mode === "edit"
          ? await client.put(`/products/${initialData.id}`, payload)
          : await client.post("/products", payload);

      if (res.data?.success) {
        toast.custom(
          <SuccessToast
            message={mode === "edit" ? "Product updated successfully!" : "Product created!"}
          />
        );
        onSuccess();
      } else {
        toast.custom(<ErrorToast message="Operation failed" />);
      }
    } catch (err) {
      toast.custom(<ErrorToast message="Server error" />);
    }
  };

  // ---------------- UI ----------------
  return (
    <div className="p-5 space-y-6">

      {/* PRODUCT FIELDS */}
      <div className="grid grid-cols-2 gap-4">
        {/* Name */}
        <div>
          <label className="text-sm font-medium">Product Name</label>
          <input
            className={`w-full border px-3 py-2 rounded-md ${
              errors.name ? "border-red-500" : "border-gray-300"
            }`}
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
          />
          {errors.name && <p className="text-red-500 text-xs">{errors.name}</p>}
        </div>

        {/* GST */}
        <div>
          <label className="text-sm font-medium">GST</label>
          <select
            className={`w-full border px-3 py-2 rounded-md ${
              errors.gst ? "border-red-500" : "border-gray-300"
            }`}
            value={form.gst}
            onChange={(e) => updateField("gst", e.target.value)}
          >
            <option value="">Select GST</option>
            {GST_OPTIONS.map((g) => (
              <option key={g} value={g}>
                {g}%
              </option>
            ))}
          </select>
          {errors.gst && <p className="text-red-500 text-xs">{errors.gst}</p>}
        </div>

        {/* HSN */}
        <div>
          <label className="text-sm font-medium">HSN</label>
          <input
            type="number"
            className={`w-full border px-3 py-2 rounded-md ${
              errors.hsn ? "border-red-500" : "border-gray-300"
            }`}
            value={form.hsn}
            onChange={(e) => updateField("hsn", e.target.value)}
          />
          {errors.hsn && <p className="text-red-500 text-xs">{errors.hsn}</p>}
        </div>

        {/* Active */}
        <div>
          <label className="text-sm font-medium">Is Active</label>
          <select
            className="w-full border px-3 py-2 rounded-md border-gray-300"
            value={form.isActive}
            onChange={(e) => updateField("isActive", e.target.value)}
          >
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>
      </div>

      {/* ADD VARIANT DROPDOWN */}
      <div>
        <label className="text-sm font-medium">Add Variant</label>
        <div className="flex gap-2 mt-1">
          <select
            className="border rounded-md px-3 py-2 w-full"
            value={form.selectedVariation}
            onChange={(e) => updateField("selectedVariation", e.target.value)}
          >
            <option value="">Select Variant</option>
            {variations.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>

          <button
            onClick={addVariantRow}
            className="px-4 py-2 bg-slate-950 text-white rounded-md hover:bg-slate-800"
          >
            Add
          </button>
        </div>
      </div>

      {/* VARIANT TABLE */}
      {form.variantRows.length > 0 && (
        <div className="overflow-x-auto border rounded-md">
          <table className="w-full text-sm">
            <thead className="bg-slate-900 text-white">
              <tr>
                <th className="p-2 text-left">Variant</th>
                <th className="p-2 text-left">Price</th>
                <th className="p-2 text-left">Product QR</th>
                <th className="p-2 text-left">Box Qty</th>
                <th className="p-2 text-left">Box QR</th>
                <th className="p-2 text-left">Stock</th>
                <th className="p-2 text-left">Remove</th>
              </tr>
            </thead>

            <tbody>
              {form.variantRows.map((row, i) => (
                <tr key={i} className="border-b">
                  <td className="p-2">{row.variationName}</td>

                  {/* PRICE */}
                  <td className="p-2">
                    <input
                      className={`w-full border px-2 py-1 rounded-md ${
                        errors[`price_${i}`] ? "border-red-500" : "border-gray-300"
                      }`}
                      value={row.price}
                      onChange={(e) => updateVariant(i, "price", e.target.value)}
                    />
                  </td>

                  {/* PRODUCT QR */}
                  <td className="p-2">
                    <input
                      className={`w-full border px-2 py-1 rounded-md ${
                        errors[`productQrCode_${i}`] ? "border-red-500" : "border-gray-300"
                      }`}
                      value={row.productQrCode}
                      onChange={(e) => updateVariant(i, "productQrCode", e.target.value)}
                    />
                  </td>

                  {/* BOX QTY */}
                  <td className="p-2">
                    <input
                      className={`w-full border px-2 py-1 rounded-md ${
                        errors[`boxQuantity_${i}`] ? "border-red-500" : "border-gray-300"
                      }`}
                      value={row.boxQuantity}
                      onChange={(e) => updateVariant(i, "boxQuantity", e.target.value)}
                    />
                  </td>

                  {/* BOX QR */}
                  <td className="p-2">
                    <input
                      className={`w-full border px-2 py-1 rounded-md ${
                        errors[`boxQrCode_${i}`] ? "border-red-500" : "border-gray-300"
                      }`}
                      value={row.boxQrCode}
                      onChange={(e) => updateVariant(i, "boxQrCode", e.target.value)}
                    />
                  </td>

                  {/* STOCK */}
                  <td className="p-2">
                    <input
                      className={`w-full border px-2 py-1 rounded-md ${
                        errors[`stockInHand_${i}`] ? "border-red-500" : "border-gray-300"
                      }`}
                      value={row.stockInHand}
                      onChange={(e) => updateVariant(i, "stockInHand", e.target.value)}
                    />
                  </td>

                  {/* REMOVE BUTTON */}
                  <td className="p-2">
                    <button
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          variantRows: prev.variantRows.filter((_, idx) => idx !== i),
                        }))
                      }
                      className="text-red-600 hover:text-red-800 text-lg"
                    >
                      <FiTrash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* SUBMIT */}
      <button
        onClick={handleSubmit}
        className="w-full bg-slate-950 text-white py-2 rounded-md hover:bg-slate-800"
      >
        {mode === "edit" ? "Update Product" : "Create Product"}
      </button>
    </div>
  );
};

export default ProductForm;