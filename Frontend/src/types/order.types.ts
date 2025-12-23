export type Seller = {
  id: number;
  name: string;
};

export type Variant = {
  id: number;
  vId: number;
  variationId: number;
  name: string;
  price: number;
  boxQuantity: number;
};
export type OrderItem = {
  id: number;
  product: { id: number; name: string };
  productVariation: {
    id: number;
    variation: { id: number; name: string }
  };
  quantity: number;
  unitPrice: number;
  total: number;
};
export type Order = {
  id: number;
  seller: Seller;
  subtotal: number;
  gstTotal: number;
  grandTotal: number;
  status: string;
  createdAt: string;
  items: OrderItem[];
};
export type Product = {
  id: number;
  name: string;
  gst: number;
  variants: Variant[];
};

export type OrderMode = "create" | "view" | "update";

export type GetQtyFn = (productId: number, variantId: number) => number;
