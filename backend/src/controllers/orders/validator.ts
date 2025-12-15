import * as yup from "yup";

export const createNewProductSchema = yup.object({
  product: yup.object({
    name: yup
      .string()
      .required("Product name is required")
      .max(100, "Product name cannot exceed 100 characters"),

    gst: yup
      .number()
      .typeError("GST must be a number")
      .required("GST is required")
      .min(0, "GST cannot be negative")
      .max(100, "GST cannot exceed 100"),

    hsn: yup
      .number()
      .typeError("HSN must be a number")
      .required("HSN code is required"),
  }),

  variation: yup.object({
    name: yup
      .string()
      .required("Variation name is required")
      .max(100, "Variation name cannot exceed 100 characters"),

    status: yup
      .mixed()
      .transform((v) => {
        if (typeof v === "boolean") return v;
        if (typeof v === "string") {
          if (v.toLowerCase() === "yes") return true;
          if (v.toLowerCase() === "no") return false;
        }
        return undefined;
      })
      .required("Variation status is required"),
  }),

  productVariation: yup.object({
    price: yup
      .number()
      .typeError("Price must be a valid number")
      .required("Price is required")
      .min(1, "Price must be at least 1"),

    productQrCode: yup
      .string()
      .required("Product QR code is required"),

    boxQuantity: yup
      .number()
      .typeError("Box quantity must be a number")
      .required("Box quantity is required")
      .min(1, "Box quantity must be at least 1"),

    boxQrCode: yup
      .string()
      .required("Box QR code is required"),

    stockInHand: yup
      .number()
      .typeError("Stock must be a number")
      .required("Stock in hand is required")
      .min(0, "Stock cannot be negative"),
  })
});
