import React, { useState } from "react";
import * as Yup from "yup";
import { useFormik } from "formik";
import { useNavigate } from "react-router-dom";
import { FiEye, FiEyeOff } from "react-icons/fi";
import client from "../../Services/clientServices";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import { ErrorToast, SuccessToast } from "../../components/ToastStyles";
import Header from "../../Global/Header";

const LogIn: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const validationSchema = Yup.object({
    email: Yup.string()
      .email("Invalid email format")
      .required("Email is required"),
    password: Yup.string()
      .min(6, "Password must be at least 6 characters")
      .required("Password is required"),
  });

  const formik = useFormik({
    initialValues: { email: "", password: "" },
    validationSchema,

    onSubmit: async (values, { setSubmitting, setErrors }) => {
      try {
        const res = await client.post("/login", values);

        const token = res.data?.data?.token;

        const user = {
          id: Date.now(),
          username: res.data.data.username,
          name: res.data.data.username,
          email: res.data.data.email,
        };

        if (!token || !user) {
          setErrors({ password: "Invalid server response" });
          return;
        }

        login(user, token);
        toast.custom(() => <SuccessToast message="Login successful!" />);
        navigate("/home");
      } catch (error: any) {
        setErrors({
          password:
            error.response?.data?.message ||
            "Login failed. Please check credentials.",
        });
        toast.custom(() => <ErrorToast message="Invalid credentials!" />);

      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex flex-col">

      <Header />

      <div className="flex flex-1 justify-center items-center px-6">
        <div className="w-full max-w-lg bg-white shadow-xl border border-gray-200 rounded-2xl p-10">

          <h2 className="text-3xl font-semibold text-slate-900 text-center mb-8">
            Log In
          </h2>

          <form onSubmit={formik.handleSubmit} className="space-y-6">

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Registered Email ID
              </label>
              <input
                type="email"
                name="email"
                placeholder="yourname@gmail.com"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={`w-full rounded-lg border px-4 py-2.5 text-sm outline-none shadow-sm
                ${formik.errors.email && formik.touched.email
                    ? "border-red-500"
                    : "border-slate-300"
                }`}
              />
              {formik.errors.email && formik.touched.email && (
                <p className="text-red-500 text-sm mt-1">{formik.errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Password
              </label>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="********"
                  value={formik.values.password}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={`w-full rounded-lg border px-4 py-2.5 text-sm outline-none shadow-sm
                  ${formik.errors.password && formik.touched.password
                      ? "border-red-500"
                      : "border-slate-300"
                  }`}
                />

                <button
                  type="button"
                  className="absolute right-3 top-2 text-xl text-slate-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FiEye /> : <FiEyeOff />}
                </button>
              </div>

              {formik.errors.password && formik.touched.password && (
                <p className="text-red-500 text-sm mt-1">
                  {formik.errors.password}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={formik.isSubmitting}
              className="w-full bg-slate-900 hover:bg-slate-700 text-white py-3 rounded-lg 
              text-sm font-semibold transition shadow-md disabled:opacity-60"
            >
              {formik.isSubmitting ? "Logging in..." : "Log In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LogIn;
