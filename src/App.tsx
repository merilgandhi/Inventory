import DashboardLayout from "./layouts/DashboardLayout";
import ProtectedRoute from "./routes/ProtectedRoute";
import Home from "./Pages/Home";
import LogIn from "./Pages/Auth/LogIn";
import Variations from "./Pages/Products/Variations";
import ProductList from "./Pages/Products/ProductList"
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Seller from "./Pages/Seller";

function App() {
  return (
    <>
      <Toaster position="top-right" containerStyle={{ marginTop: "60px" }} toastOptions={{duration: 1500,}} />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LogIn />} />

          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Home />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/products/variations"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Variations />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/products/edit"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <ProductList/>
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/stock"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Seller />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
