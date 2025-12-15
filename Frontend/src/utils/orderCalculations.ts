
type Variant = {
  id: number;
  name: string;
  price: number;
  boxQuantity: number;
};

type Product = {
  id: number;
  name: string;
  gst: number;
  variants: Variant[];
};

export const calcBoxes = (strips: number, boxQty: number) => {
  if (!boxQty) return { boxes: 0, remaining: strips };
  return {
    boxes: Math.floor(strips / boxQty),
    remaining: strips % boxQty,
  };
};

export const calcSubtotal = (price: number, qty: number) => price * qty;

export const calcGstAmount = (subtotal: number, gst: number) =>
  (subtotal * gst) / 100;

export const calcTotal = (subtotal: number, gst: number) =>
  subtotal + calcGstAmount(subtotal, gst);

export const variantCellTotals = (
  product: Product,
  variantId: number,
  getQty: (pId: number, vId: number) => number
) => {
  const variant = product.variants.find((v) => v.id === variantId);
  if (!variant) return { exists: false };

  const strips = getQty(product.id, variantId);
  const { boxes, remaining } = calcBoxes(strips, variant.boxQuantity);
  const subtotal = calcSubtotal(variant.price, strips);
  const total = calcTotal(subtotal, product.gst);

  return {
    exists: true,
    variantName: variant.name,
    price: variant.price,
    strips,
    boxes,
    remaining,
    subtotal,
    total,
  };
};


export const productTotals = (
  product: Product,
  globalVariantIds: { id: number }[],
  getQty: (pId: number, vId: number) => number
) => {
  let subtotal = 0;

  globalVariantIds.forEach((v) => {
    const c = variantCellTotals(product, v.id, getQty);
    if (c.exists) subtotal += c.subtotal ?? 0;
  });

  const gstAmount = calcGstAmount(subtotal, product.gst);

  return {
    subtotal,
    gstAmount,
    total: subtotal + gstAmount,
  };
};

export const grandTotal = (
  products: Product[],
  globalVariantIds: { id: number }[],
  getQty: (pId: number, vId: number) => number
) => {
  return products.reduce((sum, p) => {
    return sum + productTotals(p, globalVariantIds, getQty).total;
  }, 0);
};
