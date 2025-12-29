import React, { useEffect, useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
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

  // Validation Schema
  const validationSchema = Yup.object({
    name: Yup.string()
      .required("Product name is required")
      .min(2, "Product name must be at least 2 characters"),
    gst: Yup.number()
      .required("GST is required")
      .min(0, "GST must be 0 or greater")
      .max(100, "GST cannot exceed 100"),
    hsn: Yup.number()
      .required("HSN is required")
      .positive("HSN must be a positive number"),
    isActive: Yup.string()
      .required("Active status is required")
      .oneOf(["yes", "no"]),
    variants: Yup.array()
      .of(
        Yup.object({
          variationId: Yup.string().required("Variation is required"),
          price: Yup.number()
            .required("Price is required")
            .positive("Price must be greater than 0"),
          productQrCode: Yup.string().required("Product QR code is required"),
          boxQuantity: Yup.number()
            .required("Box quantity is required")
            .positive("Box quantity must be greater than 0")
            .integer("Box quantity must be a whole number"),
          boxQrCode: Yup.string().required("Box QR code is required"),
          stockInHand: Yup.number()
            .required("Stock is required")
            .min(0, "Stock cannot be negative")
            .integer("Stock must be a whole number"),
        })
      )
      .min(1, "At least one variant is required"),
  });

  const formik = useFormik<FormValues>({
    initialValues: {
      name: "",
      gst: "",
      hsn: "",
      isActive: "yes",
      variants: [emptyVariant],
    },
    validationSchema,
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
        productQrCode: v.productQrCode || "",
        boxQuantity: v.boxQuantity?.toString() || "",
        boxQrCode: v.boxQrCode || "",
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

  // Helper to get field error
  const getFieldError = (field: string) => {
    const touched = formik.touched as any;
    const errors = formik.errors as any;
    return touched[field] && errors[field] ? errors[field] : null;
  };

  // Helper to get variant field error
  const getVariantFieldError = (index: number, field: keyof VariantFormValue) => {
    const touched = formik.touched.variants?.[index] as any;
    const errors = formik.errors.variants?.[index] as any;
    return touched?.[field] && errors?.[field] ? errors[field] : null;
  };

  return (
    <>
      <div
        className={`fixed top-0 right-0 h-full w-[800px] bg-white shadow-xl transition-all duration-300 z-50 overflow-hidden ${open ? "translate-x-0" : "translate-x-full"
          }`}
      >
        {/* Header */}
        <div className="flex justify-between p-5 border-b bg-slate-900 text-white">
          <h2 className="text-xl font-semibold">
            {mode === "create" && "Create Product"}
            {mode === "edit" && "Edit Product"}
            {mode === "view" && "View Product"}
          </h2>
          <button onClick={onClose} className="text-xl hover:text-gray-300">
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
                <label className="block text-sm font-medium mb-1">Product Name</label>
                <input
                  type="text"
                  name="name"
                  disabled={readOnly}
                  value={formik.values.name}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={`w-full border rounded px-3 py-2 ${getFieldError("name")
                      ? "border-red-500 focus:ring-red-500"
                      : "border-slate-300 focus:ring-slate-500"
                    } focus:ring-2 focus:outline-none`}
                />
                {getFieldError("name") && (
                  <div className="text-red-500 text-sm mt-1">{getFieldError("name")}</div>
                )}
              </div>

              {/* GST / HSN */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">GST (%)</label>
                  <input
                    type="text"
                    name="gst"
                    disabled={readOnly}
                    value={formik.values.gst}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={`w-full border rounded px-3 py-2 ${getFieldError("gst")
                        ? "border-red-500 focus:ring-red-500"
                        : "border-slate-300 focus:ring-slate-500"
                      } focus:ring-2 focus:outline-none`}
                  />
                  {getFieldError("gst") && (
                    <div className="text-red-500 text-sm mt-1">{getFieldError("gst")}</div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">HSN Code</label>
                  <input
                    type="text"
                    name="hsn"
                    disabled={readOnly}
                    value={formik.values.hsn}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={`w-full border rounded px-3 py-2 ${getFieldError("hsn")
                        ? "border-red-500 focus:ring-red-500"
                        : "border-slate-300 focus:ring-slate-500"
                      } focus:ring-2 focus:outline-none`}
                  />
                  {getFieldError("hsn") && (
                    <div className="text-red-500 text-sm mt-1">{getFieldError("hsn")}</div>
                  )}
                </div>
              </div>

              {/* Active */}
              <div>
                <label className="block text-sm font-medium mb-1">Active</label>
                <select
                  name="isActive"
                  disabled={readOnly}
                  value={formik.values.isActive}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={`w-full border rounded px-3 py-2 ${getFieldError("isActive")
                      ? "border-red-500 focus:ring-red-500"
                      : "border-slate-300 focus:ring-slate-500"
                    } focus:ring-2 focus:outline-none`}
                >
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
                {getFieldError("isActive") && (
                  <div className="text-red-500 text-sm mt-1">{getFieldError("isActive")}</div>
                )}
              </div>

              {/* Variants Table */}
              <div>
                <div className="flex justify-between mb-2">
                  <h3 className="font-semibold">Variants</h3>
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={addVariant}
                      className="px-3 py-1 bg-slate-900 text-white rounded flex items-center gap-2 hover:bg-slate-700"
                    >
                      <FiPlus size={14} /> Add Variant
                    </button>
                  )}
                </div>

                <div className="border rounded overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-900 text-amber-300">
                      <tr>
                        <th className="p-2">Variation*</th>
                        <th className="p-2">Price*</th>
                        <th className="p-2">Product QR*</th>
                        <th className="p-2">Box Qty*</th>
                        <th className="p-2">Box QR*</th>
                        <th className="p-2">Stock*</th>
                        {!readOnly && <th className="p-2">Action</th>}
                      </tr>
                    </thead>

                    <tbody>
                      {formik.values.variants.map((v, index) => (
                        <React.Fragment key={index}>
                          <tr className="border-t">
                            <td className="p-2">
                              <select
                                name={`variants[${index}].variationId`}
                                value={v.variationId}
                                disabled={readOnly}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                className={`w-full border rounded px-2 py-1 ${getVariantFieldError(index, "variationId")
                                    ? "border-red-500"
                                    : "border-slate-300"
                                  }`}
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
                                onBlur={formik.handleBlur}
                                className={`w-full border rounded px-2 py-1 ${getVariantFieldError(index, "price")
                                    ? "border-red-500"
                                    : "border-slate-300"
                                  }`}
                              />
                            </td>

                            <td className="p-2">
                              <input
                                type="text"
                                name={`variants[${index}].productQrCode`}
                                value={v.productQrCode}
                                disabled={readOnly}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                className={`w-full border rounded px-2 py-1 ${getVariantFieldError(index, "productQrCode")
                                    ? "border-red-500"
                                    : "border-slate-300"
                                  }`}
                              />
                            </td>

                            <td className="p-2">
                              <input
                                type="text"
                                name={`variants[${index}].boxQuantity`}
                                value={v.boxQuantity}
                                disabled={readOnly}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                className={`w-full border rounded px-2 py-1 ${getVariantFieldError(index, "boxQuantity")
                                    ? "border-red-500"
                                    : "border-slate-300"
                                  }`}
                              />
                            </td>

                            <td className="p-2">
                              <input
                                type="text"
                                name={`variants[${index}].boxQrCode`}
                                value={v.boxQrCode}
                                disabled={readOnly}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                className={`w-full border rounded px-2 py-1 ${getVariantFieldError(index, "boxQrCode")
                                    ? "border-red-500"
                                    : "border-slate-300"
                                  }`}
                              />
                            </td>

                            <td className="p-2">
                              <input
                                type="text"
                                name={`variants[${index}].stockInHand`}
                                value={v.stockInHand}
                                disabled={readOnly}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                className={`w-full border rounded px-2 py-1 ${getVariantFieldError(index, "stockInHand")
                                    ? "border-red-500"
                                    : "border-slate-300"
                                  }`}
                              />
                            </td>

                            {!readOnly && (
                              <td className="p-2 text-center">
                                <button
                                  type="button"
                                  disabled={formik.values.variants.length === 1}
                                  onClick={() => removeVariant(index)}
                                  className="text-red-600 hover:text-red-800 disabled:opacity-50"
                                >
                                  <FiTrash2 size={16} />
                                </button>
                              </td>
                            )}
                          </tr>
                          {/* Error row for this variant */}
                          {Object.keys(emptyVariant).some((key) =>
                            getVariantFieldError(index, key as keyof VariantFormValue)
                          ) && (
                              <tr>
                                <td colSpan={readOnly ? 6 : 7} className="p-2 bg-red-50">
                                  <div className="text-red-500 text-xs space-y-1">
                                    {getVariantFieldError(index, "variationId") && (
                                      <div>• {getVariantFieldError(index, "variationId")}</div>
                                    )}
                                    {getVariantFieldError(index, "price") && (
                                      <div>• {getVariantFieldError(index, "price")}</div>
                                    )}
                                    {getVariantFieldError(index, "productQrCode") && (
                                      <div>• {getVariantFieldError(index, "productQrCode")}</div>
                                    )}
                                    {getVariantFieldError(index, "boxQuantity") && (
                                      <div>• {getVariantFieldError(index, "boxQuantity")}</div>
                                    )}
                                    {getVariantFieldError(index, "boxQrCode") && (
                                      <div>• {getVariantFieldError(index, "boxQrCode")}</div>
                                    )}
                                    {getVariantFieldError(index, "stockInHand") && (
                                      <div>• {getVariantFieldError(index, "stockInHand")}</div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {!readOnly && (
                <button
                  type="submit"
                  disabled={formik.isSubmitting}
                  className="w-full bg-slate-900 text-white py-3 rounded hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
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

      {open && <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />}
    </>
  );
};

export default ProductForm;