import React, { useEffect, useState } from "react";
import client from "../../Services/clientServices";
import Pagination from "../../components/Pagination";
import CreateProduct from "../../components/CreateProduct"
import toast from "react-hot-toast";
import { ErrorToast, SuccessToast } from "../../components/ToastStyles";
import { FiEdit2, FiTrash2, FiPlus } from "react-icons/fi";

const EditProduct: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);

  const fetchProducts = async (pageNumber = 1) => {
    try {
      setLoading(true);
      const res = await client.get(`/products?page=${pageNumber}`);

      if (res.data?.success) {
        setProducts(res.data.data || []);
        setTotalPages(res.data.totalPages || 1);
      } else {
        toast.custom(<ErrorToast message="Failed to load products" />);
      }
    } catch (err) {
      toast.custom(<ErrorToast message="Server error while fetching products" />);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // ---------------- DELETE PRODUCT ----------------
  const deleteProduct = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;

    try {
      const res = await client.delete(`/products/${id}`);

      if (res.data?.success) {
        toast.custom(<SuccessToast message="Product deleted!" />);
        fetchProducts(page);
      } else {
        toast.custom(<ErrorToast message="Delete failed" />);
      }
    } catch {
      toast.custom(<ErrorToast message="Server error while deleting" />);
    }
  };

  // ---------------- OPEN CREATE / EDIT ----------------
  const openCreate = () => {
    setEditingProduct(null);
    setDrawerOpen(true);
  };

  const openEdit = (product: any) => {
    setEditingProduct(product);
    setDrawerOpen(true);
  };

  // ---------------- RENDER ----------------
  return (
    <div className="p-6">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-5">
        <h1 className="text-xl font-semibold">Products</h1>

        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-md hover:bg-slate-700 transition"
        >
          <FiPlus size={18} />
          Create Product
        </button>
      </div>

      {/* PRODUCT + VARIANTS TABLE */}
      <div className="overflow-x-auto border rounded-lg shadow-sm bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-900 text-white">
            <tr>
              <th className="p-3 text-left">Product</th>
              <th className="p-3 text-left">GST</th>
              <th className="p-3 text-left">HSN</th>
              <th className="p-3 text-left">Active</th>

              <th className="p-3 text-left">Variant</th>
              <th className="p-3 text-left">Price</th>
              <th className="p-3 text-left">Product QR</th>
              <th className="p-3 text-left">Box Qty</th>
              <th className="p-3 text-left">Box QR</th>
              <th className="p-3 text-left">Stock</th>

              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={11} className="p-5 text-center">
                  Loading...
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={11} className="p-5 text-center text-gray-500">
                  No products found.
                </td>
              </tr>
            ) : (
              products.map((product) => {
                const variants = product.variants || [];

                // If no variants → single row with blanks for variant fields
                if (!variants.length) {
                  return (
                    <tr
                      key={product.id}
                      className="border-b hover:bg-gray-50 transition"
                    >
                      <td className="p-3 font-medium">{product.name}</td>
                      <td className="p-3">{product.gst}%</td>
                      <td className="p-3">{product.hsn}</td>
                      <td className="p-3">
                        {product.isActive ? (
                          <span className="text-green-600 font-medium">Yes</span>
                        ) : (
                          <span className="text-red-600 font-medium">No</span>
                        )}
                      </td>

                      <td className="p-3 text-gray-400">—</td>
                      <td className="p-3 text-gray-400">—</td>
                      <td className="p-3 text-gray-400">—</td>
                      <td className="p-3 text-gray-400">—</td>
                      <td className="p-3 text-gray-400">—</td>
                      <td className="p-3 text-gray-400">—</td>

                      <td className="p-3 flex items-center gap-3">
                        <button
                          onClick={() => openEdit(product)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <FiEdit2 size={18} />
                        </button>

                        <button
                          onClick={() => deleteProduct(product.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <FiTrash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                }

                // If variants exist → one row per variant with rowSpan on product cells
                return variants.map((variant: any, index: number) => (
                  <tr
                    key={`${product.id}-${variant.id}`}
                    className="border-b hover:bg-gray-50 transition"
                  >
                    {/* Product info only on first variant row, using rowSpan */}
                    {index === 0 && (
                      <>
                        <td
                          className="p-3 font-medium align-top"
                          rowSpan={variants.length}
                        >
                          {product.name}
                        </td>
                        <td
                          className="p-3 align-top"
                          rowSpan={variants.length}
                        >
                          {product.gst}%
                        </td>
                        <td
                          className="p-3 align-top"
                          rowSpan={variants.length}
                        >
                          {product.hsn}
                        </td>
                        <td
                          className="p-3 align-top"
                          rowSpan={variants.length}
                        >
                          {product.isActive ? (
                            <span className="text-green-600 font-medium">
                              Yes
                            </span>
                          ) : (
                            <span className="text-red-600 font-medium">
                              No
                            </span>
                          )}
                        </td>
                      </>
                    )}

                    {/* Variant fields */}
                    <td className="p-3">
                      {variant.Variation?.name || "—"}
                    </td>
                    <td className="p-3">{variant.price ?? "—"}</td>
                    <td className="p-3">{variant.productQrCode ?? "—"}</td>
                    <td className="p-3">{variant.boxQuantity ?? "—"}</td>
                    <td className="p-3">{variant.boxQrCode ?? "—"}</td>
                    <td className="p-3">{variant.stockInHand ?? "—"}</td>

                    {/* Actions only on first row */}
                    {index === 0 && (
                      <td
                        className="p-3 align-top"
                        rowSpan={variants.length}
                      >
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => openEdit(product)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <FiEdit2 size={18} />
                          </button>

                          <button
                            onClick={() => deleteProduct(product.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <FiTrash2 size={18} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ));
              })
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      <div className="flex justify-end mt-4">
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={(p) => setPage(p)}
        />
      </div>

      {/* RIGHT DRAWER FOR CREATE / EDIT PRODUCT */}
      <div
        className={`fixed top-0 right-0 h-full w-[480px] bg-white shadow-xl border-l transform transition-transform duration-300 z-50 ${
          drawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* DRAWER HEADER */}
        <div className="flex justify-between items-center px-5 py-4 border-b bg-slate-100">
          <h2 className="text-lg font-semibold">
            {editingProduct ? "Edit Product" : "Create Product"}
          </h2>
          <button
            onClick={() => setDrawerOpen(false)}
            className="text-gray-600 hover:text-black text-xl"
          >
            ×
          </button>
        </div>

        {/* FORM BODY */}
        <CreateProduct
          mode={editingProduct ? "edit" : "create"}
          initialData={editingProduct || undefined}
          onSuccess={() => {
            setDrawerOpen(false);
            fetchProducts(page);
          }}
        />
      </div>

      {/* BACKDROP */}
      {drawerOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-[1px] z-40"
          onClick={() => setDrawerOpen(false)}
        />
      )}
    </div>
  );
};

export default EditProduct;
