import { useEffect, useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import client from "../../Services/clientServices";
import { FiX, FiEdit, FiTrash2 } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import Pagination from "../../components/Pagination";
import { SuccessToast, ErrorToast } from "../../components/ToastStyles";

const Variations = () => {
  const { user } = useAuth();

  // Drawer States
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  // Table Data
  const [variations, setVariations] = useState<any[]>([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit] = useState("5");

  const [searchName, setSearchName] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const validationSchema = Yup.object({
    name: Yup.string().required("Variation name is required"),
    status: Yup.string().oneOf(["yes", "no"]).required("Status is required"),
  });

  const fetchVariations = async () => {
    try {
      const params = new URLSearchParams();
      params.set("page", String(currentPage));
      params.set("limit", String(limit));

      if (searchName.trim()) params.set("search", searchName.trim());
      if (statusFilter) params.set("status", statusFilter);

      const res = await client.get(`/variations?${params.toString()}`);

      setVariations(res.data.data || []);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      toast.custom(() => <ErrorToast message="Failed to load variations" />);
    }
  };

  useEffect(() => {
    fetchVariations();
    // eslint-disable-next-line
  }, [currentPage, limit, searchName, statusFilter]);

  // Formik Setup
  const formik = useFormik({
    initialValues: { name: "", status: "yes" },
    validationSchema,

    onSubmit: async (values, helpers) => {
      const payload = {
        name: values.name,
        status: values.status === "yes",
      };

      try {
        if (editMode && editId) {
          await client.put(`/variations/${editId}`, payload);
          toast.custom(() => <SuccessToast message="Variation updated!" />);
        } else {
          await client.post("/variations", payload);
          toast.custom(() => <SuccessToast message="Variation created!" />);
        }

        helpers.resetForm();
        setOpen(false);
        setEditMode(false);
        setEditId(null);
        fetchVariations();
      } catch (err: any) {
        if (err.response.data.errors) {
          helpers.setErrors(err.response.data.errors);
        }
        toast.custom(() => (
          <ErrorToast
            message={err?.response?.data?.message || "Action failed"}
          />
        ));
      } finally {
        helpers.setSubmitting(false);
      }
    },
  });

  const handleEdit = (item: any) => {
    setEditMode(true);
    setEditId(item.id);
    formik.setFieldValue("name", item.name);
    formik.setFieldValue("status", item.status ? "yes" : "no");
    setOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this variation?")) return;

    try {
      await client.delete(`/variations/${id}`);
      toast.custom(() => <ErrorToast message="Variation deleted!" />);
      fetchVariations();
    } catch (err: any) {
      toast.custom(() => (
        <ErrorToast
          message={err?.response?.data?.message || "Failed to delete"}
        />
      ));
    }
  };

  const getLog = (errors: any) => {
    console.log("Formik Errors:", errors);
    return JSON.stringify(errors);
  };

  return (
    <div className="p-6 space-y-4">
      {/* Add Button */}
      <div className="flex justify-end">
        <button
          onClick={() => {
            setEditMode(false);
            setEditId(null);
            formik.resetForm();
            setOpen(true);
          }}
          className="px-5 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-700 transition"
        >
          + Add Variation
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

                {/* STATUS FILTER */}
                <th className="p-3 text-left">
                  <div className="flex flex-col gap-2">
                    <span className="font-medium">Status</span>
                    <select
                      value={statusFilter}
                      onChange={(e) => {
                        setStatusFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="bg-white border text-black rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-slate-500"
                    >
                      <option value="">All</option>
                      <option value="true">Active (Yes)</option>
                      <option value="false">Inactive (No)</option>
                    </select>
                  </div>
                </th>

                <th className="p-3 text-left font-medium">Creator</th>
                <th className="p-3 text-left font-medium">Actions</th>
              </tr>
            </thead>

            <tbody>
              {variations.length > 0 ? (
                variations.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b hover:bg-gray-50 transition"
                  >
                    <td className="p-4">{item.name}</td>

                    <td className="p-4 font-semibold">
                      {item.status ? (
                        <span className="text-green-600">Yes</span>
                      ) : (
                        <span className="text-red-500">No</span>
                      )}
                    </td>

                    <td className="p-4">{item.creator?.name}</td>

                    <td className="p-4 flex gap-4">
                      {user?.email === item.creator?.email && (
                        <>
                          <button
                            className="text-blue-600 hover:text-blue-800"
                            onClick={() => handleEdit(item)}
                          >
                            <FiEdit size={18} />
                          </button>
                          <button
                            className="text-red-600 hover:text-red-800"
                            onClick={() => handleDelete(item.id)}
                          >
                            <FiTrash2 size={18} />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    className="p-4 text-center text-gray-500 font-medium"
                  >
                    No variations found
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
        <div className="px-6 py-5 flex justify-between items-center bg-gray-50 border-b">
          <h2 className="text-xl font-semibold">
            {editMode ? "Update Variation" : "Add Variation"}
          </h2>
          <button
            onClick={() => {
              setOpen(false);
              setEditMode(false);
              setEditId(null);
              formik.resetForm();
            }}
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
              value={formik.values.name}
              onChange={formik.handleChange}
              className="w-full border rounded-md px-3 py-2"
            />
            {formik.errors.name && (
              <div className="text-red-500 text-sm mt-1">
                {formik.errors.name}
              </div>
            )}
          </div>

          <div>
            <label className="text-sm font-medium">Status</label>
            <select
              name="status"
              value={formik.values.status}
              onChange={formik.handleChange}
              className="w-full border rounded-md px-3 py-2"
            >
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={formik.isSubmitting}
            className="w-full bg-slate-900 text-white py-2 rounded-md hover:bg-slate-700"
          >
            {formik.isSubmitting
              ? "Processing..."
              : editMode
              ? "Update Variation"
              : "Save Variation"}
          </button>
        </form>
      </div>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/30 z-40"
          onClick={() => {
            setOpen(false);
            setEditMode(false);
            setEditId(null);
            formik.resetForm();
          }}
        />
      )}
    </div>
  );
};

export default Variations;
