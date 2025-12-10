// --- FINAL FIXED PRODUCT LIST ---

import{ useEffect, useState } from "react";
import client from "../../Services/clientServices";
import toast from "react-hot-toast";
import { SuccessToast, ErrorToast } from "../../components/ToastStyles";
import Pagination from "../../components/Pagination";
import ProductForm from "../../components/ProductForm";
import { FiEye, FiEdit2, FiTrash2 } from "react-icons/fi";

interface ProductVariant {
  variationId?: number;
  price?: number | string;
  productQrCode?: string;
  boxQuantity?: number | string;
  boxQrCode?: string;
  stockInHand?: number | string;
  Variation?: { id: number; name: string };
}

interface Product {
  id: number;
  name: string;
  gst: number | string;
  hsn: number | string;
  isActive: boolean;
  variants?: ProductVariant[];
}

const ProductList = () => {
  const [products, setProducts] = useState<Product[]>([]);

  const [searchName, setSearchName] = useState("");
  const [limit, setLimit] = useState("10");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"create" | "edit" | "view">(
    "create"
  );
  const [selectedProductId, setSelectedProductId] = useState<number | null>(
    null
  );

  const fetchProducts = async () => {
    try {
      const params = new URLSearchParams();
      params.set("page", currentPage.toString());
      params.set("limit", limit);

      if (searchName.trim()) params.set("search", searchName);

      const res = await client.get(`/products?${params.toString()}`);

      setProducts(res.data.data || []);
      setTotalPages(res.data.totalPages || 1);
    } catch {
      toast.custom(() => (
        <ErrorToast message="Failed to load products" />
      ));
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [searchName, currentPage, limit]);

  const openCreateDrawer = () => {
    setSelectedProductId(null);
    setDrawerMode("create");
    setDrawerOpen(true);
  };

  const openEditDrawer = (id: number) => {
    setSelectedProductId(id);
    setDrawerMode("edit");
    setDrawerOpen(true);
  };

  const openViewDrawer = (id: number) => {
    setSelectedProductId(id);
    setDrawerMode("view");
    setDrawerOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure?")) return;

    try {
      const res = await client.delete(`/products/${id}`);
      toast.custom(() => (
        <SuccessToast
          message={res?.data?.message || "Product deleted successfully"}
        />
      ));
      fetchProducts();
    } catch (err: any) {
      toast.custom(() => (
        <ErrorToast
          message={err?.response?.data?.message || "Delete failed"}
        />
      ));
    }
  };

  return (
    <div className="p-6 space-y-4">

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Products</h1>
        <button
          onClick={openCreateDrawer}
          className="px-5 py-2 bg-slate-900 text-white rounded hover:bg-slate-700"
        >
          Create Product
        </button>
      </div>

      <div className="bg-white shadow rounded border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-900 text-white sticky top-0">
            <tr>
              <th className="p-3">
                <div className="flex flex-col gap-1">
                  <span>Product</span>
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                    className="px-2 py-1 text-white border rounded text-sm"
                  />
                </div>
              </th>

              <th className="p-3">GST</th>
              <th className="p-3">HSN</th>

              <th className="p-3">
                <div className="flex flex-col gap-1">
                  <span>Active</span>
                </div>
              </th>

              <th className="p-3">Variant</th>
              <th className="p-3">Price</th>
              <th className="p-3">Product QR</th>
              <th className="p-3">Box Qty</th>
              <th className="p-3">Box QR</th>
              <th className="p-3">Stock</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            {products.length > 0 ? (
              products.map((product) => {
                const firstVariant = product.variants?.[0];
                return (
                  <tr key={product.id} className="border-b hover:bg-gray-50">

                    <td className="p-3">{product.name}</td>
                    <td className="p-3">{product.gst}%</td>
                    <td className="p-3">{product.hsn}</td>

                    <td className="p-3">
                      {product.isActive ? (
                        <span className="text-green-600 font-semibold">
                          Yes
                        </span>
                      ) : (
                        <span className="text-red-600 font-semibold">
                          No
                        </span>
                      )}
                    </td>

                    <td className="p-3">
                      {firstVariant?.Variation?.name || "-"}
                    </td>
                    <td className="p-3">{firstVariant?.price ?? "-"}</td>
                    <td className="p-3">{firstVariant?.productQrCode ?? "-"}</td>
                    <td className="p-3">{firstVariant?.boxQuantity ?? "-"}</td>
                    <td className="p-3">{firstVariant?.boxQrCode ?? "-"}</td>
                    <td className="p-3">{firstVariant?.stockInHand ?? "-"}</td>

                    <td className="p-3">
                      <div className="flex gap-3">
                        <button onClick={() => openViewDrawer(product.id)}>
                          <FiEye size={18} />
                        </button>
                        <button onClick={() => openEditDrawer(product.id)}>
                          <FiEdit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="text-red-600"
                        >
                          <FiTrash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={11} className="p-4 text-center text-gray-500">
                  No products found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between">
        <select
          value={limit}
          onChange={(e) => {
            setLimit(e.target.value);
            setCurrentPage(1);
          }}
          className="border px-2 py-1 rounded"
        >
          <option value="5">5</option>
          <option value="10">10</option>
          <option value="25">25</option>
        </select>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(page: number) => setCurrentPage(page)}
        />
      </div>

      {/* Drawer */}
      <ProductForm
        open={drawerOpen}
        mode={drawerMode}
        productId={selectedProductId}
        onClose={() => setDrawerOpen(false)}
        onSuccess={fetchProducts}
      />
    </div>
  );
};

export default ProductList;
