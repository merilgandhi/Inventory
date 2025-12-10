import React, { useEffect, useState } from "react";
import client from "../Services/clientServices";
import toast from "react-hot-toast";
import { SuccessToast, ErrorToast } from "../components/ToastStyles";
import { FiEdit2, FiTrash2, FiPlus, FiX } from "react-icons/fi";
import Pagination from "../components/Pagination";
interface Seller {
  id: number;
  name: string;
  email: string;
  contactNumber: string;
  isActive: boolean;
}

const Seller: React.FC = () => {
  const [sellers, setSellers] = useState<Seller[]>([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"create" | "edit">("create");
  const [selectedSellerId, setSelectedSellerId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    contactNumber: "",
    isActive: "yes" as "yes" | "no",
  });

  const fetchSellers = async () => {
    try {
      const res = await client.get(
        `/sellers?page=${currentPage}&limit=${limit}`
      );

      setSellers(res.data.data || []);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      toast.custom(() => <ErrorToast message="Failed to load sellers" />);
    }
  };

  useEffect(() => {
    fetchSellers();
  }, [currentPage, limit]);

  const openCreate = () => {
    setDrawerMode("create");
    setSelectedSellerId(null);
    setFormData({
      name: "",
      email: "",
      contactNumber: "",
      isActive: "yes",
    });
    setDrawerOpen(true);
  };

  const openEdit = (seller: Seller) => {
    setDrawerMode("edit");
    setSelectedSellerId(seller.id);
    setFormData({
      name: seller.name,
      email: seller.email,
      contactNumber: seller.contactNumber,
      isActive: seller.isActive ? "yes" : "no",
    });
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setSelectedSellerId(null);
  };

  // ---------- Delete seller ----------
  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure?")) return;

    try {
      const res = await client.delete(`/sellers/${id}`);
      toast.custom(() => (
        <ErrorToast message={res?.data?.message || "Seller deleted"} />
      ));

      fetchSellers();
    } catch (err: any) {
      toast.custom(() => (
        <ErrorToast
          message={err?.response?.data?.message || "Delete failed"}
        />
      ));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      name: formData.name,
      email: formData.email,
      contactNumber: formData.contactNumber,
      isActive: formData.isActive === "yes",
    };

    try {
      let res;

      if (drawerMode === "edit" && selectedSellerId) {
        res = await client.put(`/sellers/${selectedSellerId}`, payload);
      } else {
        res = await client.post("/sellers", payload);
      }

      toast.custom(() => (
        <SuccessToast message={res?.data?.message || "Success"} />
      ));

      closeDrawer();
      fetchSellers();
    } catch (err: any) {
      toast.custom(() => (
        <ErrorToast
          message={err?.response?.data?.message || "Failed to save seller"}
        />
      ));
    }
  };

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Sellers</h1>
        <button
          onClick={openCreate}
          className="px-5 py-2 bg-slate-900 text-white rounded flex items-center gap-2 hover:bg-slate-700"
        >
          <FiPlus />
          Add Seller
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded shadow border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-900 text-white">
            <tr>
              <th className="p-3 text-center">Name</th>
              <th className="p-3 text-center">Email</th>
              <th className="p-3 text-center">Contact</th>
              <th className="p-3 text-center">Active</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {sellers.length > 0 ? (
              sellers.map((s) => (
                <tr key={s.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 text-center">{s.name}</td>
                  <td className="p-3 text-center">{s.email}</td>
                  <td className="p-3 text-center">{s.contactNumber}</td>
                  <td className="p-3 text-center">
                    {s.isActive ? (
                      <span className="text-green-600 font-semibold">Yes</span>
                    ) : (
                      <span className="text-red-600 font-semibold">No</span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex justify-center gap-3">
                      <button
                        onClick={() => openEdit(s)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <FiEdit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={5}
                  className="p-4 text-center text-gray-500 font-medium"
                >
                  No sellers found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      <div className="flex justify-between items-center mt-4">
        <select
          value={limit}
          onChange={(e) => {
            setLimit(Number(e.target.value));
            setCurrentPage(1);
          }}
          className="border px-3 py-2 rounded"
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
        </select>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(page: number) => setCurrentPage(page)}
        />
      </div>

      {/* Drawer */}
      {drawerOpen && (
        <>
          <div className="fixed top-0 right-0 w-[35] max-w-full h-full bg-white shadow-xl z-50 p-6 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {drawerMode === "create" ? "Create Seller" : "Edit Seller"}
              </h2>
              <button onClick={closeDrawer} className="text-xl">
                <FiX />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full border rounded px-3 py-2 mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full border rounded px-3 py-2 mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Contact Number</label>
                <input
                  type="text"
                  value={formData.contactNumber}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      contactNumber: e.target.value,
                    })
                  }
                  className="w-full border rounded px-3 py-2 mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Active</label>
                <select
                  value={formData.isActive}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      isActive: e.target.value as "yes" | "no",
                    })
                  }
                  className="w-full border rounded px-3 py-2 mt-1"
                >
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-slate-900 text-white py-3 rounded hover:bg-slate-700"
              >
                {drawerMode === "edit" ? "Update Seller" : "Save Seller"}
              </button>
            </form>
          </div>

          <div
            className="fixed inset-0 bg-black/30 z-40"
            onClick={closeDrawer}
          />
        </>
      )}
    </div>
  );
};
export default Seller
