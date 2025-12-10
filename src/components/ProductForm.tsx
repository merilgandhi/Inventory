import React, { useEffect, useState } from "react";
import { useFormik } from "formik";
import client from "../Services/clientServices";
import { FiX, FiTrash2, FiPlus } from "react-icons/fi";
import toast from "react-hot-toast";
import { SuccessToast, ErrorToast } from "./ToastStyles";

interface ProductFormProps {
  open: boolean;
  mode: "create" | "edit" | "view";
  productId?: number | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface VariationOption {
  id: number;
  name: string;
}

interface VariantFormValue {
  variationId: string;
  price: string;
  productQrCode: string;
  boxQuantity: string;
  boxQrCode: string;
  stockInHand: string;
}

interface FormValues {
  name: string;
  gst: string;
  hsn: string;
  isActive: string;
  variants: VariantFormValue[];
}

const emptyVariant: VariantFormValue = {
  variationId: "",
  price: "",
  productQrCode: "",
  boxQuantity: "",
  boxQrCode: "",
  stockInHand: "",
};

const ProductForm: React.FC<ProductFormProps> = ({
  open,
  mode,
  productId,
  onClose,
  onSuccess,
}) => {
  const [variations, setVariations] = useState<VariationOption[]>([]);
  const [loadingProduct, setLoadingProduct] = useState(false);

  const formik = useFormik<FormValues>({
    initialValues: {
      name: "",
      gst: "",
      hsn: "",
      isActive: "yes",
      variants: [emptyVariant],
    },
    validate: () => ({}), // NO VALIDATION
    onSubmit: async (values, helpers) => {
      const payload = {
        name: values.name,
        gst: Number(values.gst),
        hsn: Number(values.hsn),
        isActive: values.isActive === "yes",
        variants: values.variants.map((v) => ({
          variationId: Number(v.variationId),
          price: Number(v.price),
          productQrCode: v.productQrCode,
          boxQuantity: Number(v.boxQuantity),
          boxQrCode: v.boxQrCode,
          stockInHand: Number(v.stockInHand),
        })),
      };

      try {
        let res;

        if (mode === "edit" && productId) {
          res = await client.put(`/products/${productId}`, payload);
        } else {
          res = await client.post("/products", payload);
        }

        toast.custom(() => (
          <SuccessToast message={res?.data?.message || "Success"} />
        ));

        helpers.resetForm();
        onSuccess();
        onClose();
      } catch (err: any) {
        toast.custom(() => (
          <ErrorToast
            message={err?.response?.data?.message || "Error occurred"}
          />
        ));
      } finally {
        helpers.setSubmitting(false);
      }
    },
  });

  const loadVariations = async () => {
    try {
      const res = await client.get("/variations?status=true&limit=999");
      setVariations(res.data.data || []);
    } catch {
      toast.custom(() => <ErrorToast message="Failed to load variations" />);
    }
  };

  const loadProduct = async (id: number) => {
    setLoadingProduct(true);

    try {
      const res = await client.get(`/products/${id}`);
      const product = res.data.product;

      const mappedVariants = product.variants?.map((v: any) => ({
        variationId:
          v.variationId?.toString() || v.Variation?.id?.toString() || "",
        price: v.price?.toString() || "",
        productQrCode: v.productQrCode,
        boxQuantity: v.boxQuantity?.toString() || "",
        boxQrCode: v.boxQrCode,
        stockInHand: v.stockInHand?.toString() || "",
      })) || [emptyVariant];

      formik.setValues({
        name: product.name || "",
        gst: product.gst?.toString() || "",
        hsn: product.hsn?.toString() || "",
        isActive: product.isActive ? "yes" : "no",
        variants: mappedVariants,
      });
    } catch {
      toast.custom(() => <ErrorToast message="Failed loading product" />);
    } finally {
      setLoadingProduct(false);
    }
  };

  useEffect(() => {
    if (!open) return;

    loadVariations();

    if (mode === "create") {
      formik.resetForm();
      return;
    }

    if ((mode === "edit" || mode === "view") && productId) {
      loadProduct(productId);
    }
  }, [open]);

  if (!open) return null;

  const readOnly = mode === "view";

  const addVariant = () => {
    formik.setFieldValue("variants", [...formik.values.variants, emptyVariant]);
  };

  const removeVariant = (i: number) => {
    const list = [...formik.values.variants];
    if (list.length === 1) return;
    list.splice(i, 1);
    formik.setFieldValue("variants", list);
  };

  return (
    <>
      <div
        className={`fixed top-0 right-0 h-full w-[20] bg-white shadow-xl transition-all duration-300 z-50 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex justify-between p-5 border-b bg-gray-50">
          <h2 className="text-xl font-semibold">
            {mode === "create" && "Create Product"}
            {mode === "edit" && "Edit Product"}
            {mode === "view" && "View Product"}
          </h2>
          <button onClick={onClose} className="text-xl">
            <FiX />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto h-full pb-40">
          {loadingProduct ? (
            <p className="text-center">Loading...</p>
          ) : (
            <form onSubmit={formik.handleSubmit} className="space-y-5">
              {/* Product Name */}
              <div>
                <label>Product Name</label>
                <input
                  type="text"
                  name="name"
                  disabled={readOnly}
                  value={formik.values.name}
                  onChange={formik.handleChange}
                  className="w-full border rounded px-3 py-2 mt-1"
                />
              </div>

              {/* GST / HSN */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label>GST</label>
                  <input
                    type="text"
                    name="gst"
                    disabled={readOnly}
                    value={formik.values.gst}
                    onChange={formik.handleChange}
                    className="w-full border rounded px-3 py-2 mt-1"
                  />
                </div>

                <div>
                  <label>HSN</label>
                  <input
                    type="text"
                    name="hsn"
                    disabled={readOnly}
                    value={formik.values.hsn}
                    onChange={formik.handleChange}
                    className="w-full border rounded px-3 py-2 mt-1"
                  />
                </div>
              </div>

              {/* Active */}
              <div>
                <label>Active</label>
                <select
                  name="isActive"
                  disabled={readOnly}
                  value={formik.values.isActive}
                  onChange={formik.handleChange}
                  className="w-full border rounded px-3 py-2 mt-1"
                >
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>

              {/* Variants Table */}
              <div>
                <div className="flex justify-between mb-2">
                  <h3 className="font-semibold">Variants</h3>
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={addVariant}
                      className="px-3 py-1 bg-slate-900 text-white rounded flex items-center gap-2"
                    >
                      <FiPlus size={14} /> Add Variant
                    </button>
                  )}
                </div>

                <div className="border rounded overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="p-2">Variation</th>
                        <th className="p-2">Price</th>
                        <th className="p-2">Product QR</th>
                        <th className="p-2">Box Qty</th>
                        <th className="p-2">Box QR</th>
                        <th className="p-2">Stock</th>
                        {!readOnly && <th className="p-2">Action</th>}
                      </tr>
                    </thead>

                    <tbody>
                      {formik.values.variants.map((v, index) => (
                        <tr key={index} className="border-t">
                          <td className="p-2">
                            <select
                              name={`variants[${index}].variationId`}
                              value={v.variationId}
                              disabled={readOnly}
                              onChange={formik.handleChange}
                              className="w-full border rounded px-2 py-1"
                            >
                              <option value="">Select</option>
                              {variations.map((opt) => (
                                <option key={opt.id} value={opt.id}>
                                  {opt.name}
                                </option>
                              ))}
                            </select>
                          </td>

                          <td className="p-2">
                            <input
                              type="text"
                              name={`variants[${index}].price`}
                              value={v.price}
                              disabled={readOnly}
                              onChange={formik.handleChange}
                              className="w-full border rounded px-2 py-1"
                            />
                          </td>

                          <td className="p-2">
                            <input
                              type="text"
                              name={`variants[${index}].productQrCode`}
                              value={v.productQrCode}
                              disabled={readOnly}
                              onChange={formik.handleChange}
                              className="w-full border rounded px-2 py-1"
                            />
                          </td>

                          <td className="p-2">
                            <input
                              type="text"
                              name={`variants[${index}].boxQuantity`}
                              value={v.boxQuantity}
                              disabled={readOnly}
                              onChange={formik.handleChange}
                              className="w-full border rounded px-2 py-1"
                            />
                          </td>

                          <td className="p-2">
                            <input
                              type="text"
                              name={`variants[${index}].boxQrCode`}
                              value={v.boxQrCode}
                              disabled={readOnly}
                              onChange={formik.handleChange}
                              className="w-full border rounded px-2 py-1"
                            />
                          </td>

                          <td className="p-2">
                            <input
                              type="text"
                              name={`variants[${index}].stockInHand`}
                              value={v.stockInHand}
                              disabled={readOnly}
                              onChange={formik.handleChange}
                              className="w-full border rounded px-2 py-1"
                            />
                          </td>

                          {!readOnly && (
                            <td className="p-2 text-center">
                              <button
                                type="button"
                                disabled={formik.values.variants.length === 1}
                                onClick={() => removeVariant(index)}
                                className="text-red-600"
                              >
                                <FiTrash2 size={16} />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {!readOnly && (
                <button
                  type="submit"
                  disabled={formik.isSubmitting}
                  className="w-full bg-slate-900 text-white py-3 rounded hover:bg-slate-700"
                >
                  {formik.isSubmitting
                    ? "Processing..."
                    : mode === "edit"
                    ? "Update Product"
                    : "Save Product"}
                </button>
              )}
            </form>
          )}
        </div>
      </div>

      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
    </>
  );
};

export default ProductForm;
