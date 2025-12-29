import { useEffect, useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import client from "../Services/clientServices";
import { FiEdit, FiTrash2, FiX } from "react-icons/fi";
import toast from "react-hot-toast";
import Pagination from "../components/Pagination";
import { SuccessToast, ErrorToast } from "../components/ToastStyles";
import DeleteConfirmation from "../components/DeleteConfirmation";

const Sellers = () => {
  // Drawer State
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  // Table Data
  const [sellers, setSellers] = useState<any[]>([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState("5");
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [searchName, setSearchName] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Validation Schema
  const validationSchema = Yup.object({
    name: Yup.string()
      .required("Name is required")
      .min(2, "Name must be at least 2 characters"),
    email: Yup.string()
      .required("Email is required")
      .email("Invalid email format"),
    contactNumber: Yup.string()
      .required("Contact number is required")
      .matches(/^[0-9]{10}$/, "Contact number must be 10 digits"),
    isActive: Yup.string().required("Status is required"),
  });

  // Formik
  const formik = useFormik({
    initialValues: {
      name: "",
      email: "",
      contactNumber: "",
      isActive: "yes",
    },
    validationSchema,
    onSubmit: async (values) => {
      const payload = {
        name: values.name,
        email: values.email,
        contactNumber: values.contactNumber,
        isActive: values.isActive === "yes",
      };

      try {
        if (editMode && editId) {
          const res = await client.put(`/sellers/${editId}`, payload);
          toast.custom(() => <SuccessToast message={res.data.message} />);
        } else {
          const res = await client.post(`/sellers`, payload);
          toast.custom(() => <SuccessToast message={res.data.message} />);
        }

        setOpen(false);
        fetchSellers();
        formik.resetForm();
      } catch (err: any) {
        toast.custom(() => (
          <ErrorToast message={err?.response?.data?.message || "Action failed"} />
        ));
      }
    },
  });

  // Fetch Sellers
  const fetchSellers = async () => {
    try {
      const params = new URLSearchParams();
      params.set("page", String(currentPage));
      params.set("limit", String(limit));

      if (searchName.trim()) params.set("search", searchName.trim());
      if (statusFilter) params.set("status", statusFilter);

      const res = await client.get(`/sellers?${params.toString()}`);

      setSellers(res.data.data || []);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      toast.custom(() => <ErrorToast message="Failed to load sellers" />);
    }
  };

  useEffect(() => {
    fetchSellers();
  }, [currentPage, limit, searchName, statusFilter]);

  // Handle Add New
  const openCreateDrawer = () => {
    setEditMode(false);
    setEditId(null);
    formik.resetForm();
    setOpen(true);
  };

  // Handle Edit
  const handleEdit = (seller: any) => {
    setEditMode(true);
    setEditId(seller.id);

    formik.setValues({
      name: seller.name,
      email: seller.email,
      contactNumber: seller.contactNumber,
      isActive: seller.isActive ? "yes" : "no",
    });

    setOpen(true);
  };

  // Delete Confirmation State
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; sellerId: number | null; isDeleting: boolean }>({ open: false, sellerId: null, isDeleting: false });

  const openDeleteModal = (sellerId: number) => {
    setDeleteModal({ open: true, sellerId, isDeleting: false });
  };

  const closeDeleteModal = () => {
    setDeleteModal({ open: false, sellerId: null, isDeleting: false });
  };

  const handleDeleteConfirm = async () => {
    if (deleteModal.sellerId == null) return;
    setDeleteModal((prev) => ({ ...prev, isDeleting: true }));
    try {
      const res = await client.delete(`/sellers/${deleteModal.sellerId}`);
      toast.custom(() => <SuccessToast message={res.data.message} />);
      closeDeleteModal();
      fetchSellers();
    } catch (err: any) {
      toast.custom(() => (
        <ErrorToast
          message={err?.response?.data?.message || "Failed to delete"}
        />
      ));
      setDeleteModal((prev) => ({ ...prev, isDeleting: false }));
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Sellers</h1>
        <button
          onClick={openCreateDrawer}
          className="px-5 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-700 transition"
        >
          + Add Seller
        </button>
      </div>

      {/* Table */}
      <div className="bg-white shadow-md rounded-xl border overflow-hidden">
        <div className="max-h-[475px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-900 text-white sticky top-0 z-10">
              <tr>
                {/* NAME WITH SEARCH */}
                <th className="p-3 text-left">
                  <div className="flex flex-col gap-2">
                    <span className="font-medium">Name</span>
                    <input
                      type="text"
                      placeholder="Search name..."
                      value={searchName}
                      onChange={(e) => {
                        setSearchName(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full bg-white border text-black rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-slate-500"
                    />
                  </div>
                </th>

                {/* ACTIVE FILTER */}
                <th className="p-3 text-left">
                  <div className="flex flex-col gap-2">
                    <span className="font-medium">Active</span>
                    <select
                      value={statusFilter}
                      onChange={(e) => {
                        setStatusFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="bg-white border text-black rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-slate-500"
                    >
                      <option value="">All</option>
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  </div>
                </th>

                <th className="p-3 text-left font-medium">Email</th>
                <th className="p-3 text-left font-medium">Contact</th>
                <th className="p-3 text-left font-medium">Actions</th>
              </tr>
            </thead>

            <tbody>
              {sellers.length > 0 ? (
                sellers.map((seller) => (
                  <tr
                    key={seller.id}
                    className="border-b hover:bg-gray-50 transition"
                  >
                    <td className="p-4">{seller.name}</td>

                    <td className="p-4 font-semibold">
                      {seller.isActive ? (
                        <span className="text-green-600">Yes</span>
                      ) : (
                        <span className="text-red-500">No</span>
                      )}
                    </td>

                    <td className="p-4">{seller.email}</td>

                    <td className="p-4">{seller.contactNumber}</td>

                    <td className="p-4 flex gap-4">
                      <button
                        className="text-blue-600 hover:text-blue-800"
                        onClick={() => handleEdit(seller)}
                      >
                        <FiEdit size={18} className="text-amber-400"/>
                      </button>

                      <button
                        className="text-red-600 hover:text-red-800"
                        onClick={() => openDeleteModal(seller.id)}
                      >
                        <FiTrash2 size={18} />
                      </button>
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
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <select
          value={limit}
          onChange={(e) => {
            setLimit(e.target.value);
            setCurrentPage(1);
          }}
          className="border rounded-md px-2 py-1"
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={25}>25</option>
        </select>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(page: number) => setCurrentPage(page)}
        />
      </div>

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-96 bg-white shadow-xl border-l transition-transform duration-300 z-50 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="px-6 py-5 flex justify-between items-center bg-slate-900 text-white border-b">
          <h2 className="text-xl font-semibold">
            {editMode ? "Update Seller" : "Add Seller"}
          </h2>

          <button
            onClick={() => setOpen(false)}
            className="text-gray-600 text-2xl"
          >
            <FiX />
          </button>
        </div>

        <form onSubmit={formik.handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-sm font-medium">Name</label>
            <input
              type="text"
              name="name"
              className={`w-full border rounded-md px-3 py-2 ${
                formik.touched.name && formik.errors.name
                  ? "border-red-500"
                  : ""
              }`}
              value={formik.values.name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
            {formik.touched.name && formik.errors.name && (
              <div className="text-red-500 text-xs mt-1">
                {formik.errors.name}
              </div>
            )}
          </div>

          <div>
            <label className="text-sm font-medium">Email</label>
            <input
              type="email"
              name="email"
              className={`w-full border rounded-md px-3 py-2 ${
                formik.touched.email && formik.errors.email
                  ? "border-red-500"
                  : ""
              }`}
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
            {formik.touched.email && formik.errors.email && (
              <div className="text-red-500 text-xs mt-1">
                {formik.errors.email}
              </div>
            )}
          </div>

          <div>
            <label className="text-sm font-medium">Contact Number</label>
            <input
              type="text"
              name="contactNumber"
              className={`w-full border rounded-md px-3 py-2 ${
                formik.touched.contactNumber && formik.errors.contactNumber
                  ? "border-red-500"
                  : ""
              }`}
              value={formik.values.contactNumber}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
            {formik.touched.contactNumber && formik.errors.contactNumber && (
              <div className="text-red-500 text-xs mt-1">
                {formik.errors.contactNumber}
              </div>
            )}
          </div>

          <div>
            <label className="text-sm font-medium">Active</label>
            <select
              name="isActive"
              className="w-full border rounded-md px-3 py-2"
              value={formik.values.isActive}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            >
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full bg-slate-900 text-white py-2 rounded-md hover:bg-slate-700"
          >
            {editMode ? "Update Seller" : "Save Seller"}
          </button>
        </form>
      </div>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/30 z-40"
          onClick={() => setOpen(false)}
        />
      )}
      {/* Delete Confirmation Modal */}
      <DeleteConfirmation
        isOpen={deleteModal.open}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteConfirm}
        isDeleting={deleteModal.isDeleting}
        itemName={
          sellers.find((s) => s.id === deleteModal.sellerId)?.name
        }
        title="Delete Seller"
        message="Are you sure you want to delete"
      />
    </div>
  );
};

export default Sellers;