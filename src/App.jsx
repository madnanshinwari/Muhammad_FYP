import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { CartProvider } from './context/CartContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { ErrorBoundary } from './components/common/ErrorBoundary.jsx';
import { ProtectedAdminRoute } from './components/common/ProtectedAdminRoute.jsx';
import { Header } from './components/layout/Header.jsx';
import { Footer } from './components/layout/Footer.jsx';
import { CartDrawer } from './components/layout/CartDrawer.jsx';

// Pages
import { HomePage } from './pages/customer/HomePage.jsx';
import { CatalogPage } from './pages/customer/CatalogPage.jsx';
import { CheckoutPage } from './pages/customer/CheckoutPage.jsx';
import { EditProfilePage } from './pages/customer/EditProfilePage.jsx';
import { CustomerDashboardPage } from './pages/customer/CustomerDashboardPage.jsx';
import { AdminDashboard } from './pages/admin/AdminDashboard.jsx';
import { RiderDashboardPage } from './pages/rider/RiderDashboardPage.jsx';
import { LoginPage } from './pages/auth/LoginPage.jsx';
import { RegisterPage } from './pages/auth/RegisterPage.jsx';
import { NotFoundPage } from './pages/NotFoundPage.jsx';

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <CartProvider>
              <BrowserRouter>
                <div className="min-h-screen flex flex-col bg-[#FFFDF5] text-[#263238] selection:bg-[#218838] selection:text-white">
                  {/* Header Navigation */}
                  <Header />

                  {/* Main Content Viewport */}
                  <main className="flex-1 bg-[#FFFDF5]">
                    <Routes>
                      <Route path="/" element={<HomePage />} />
                      <Route path="/catalog" element={<CatalogPage />} />
                      <Route path="/checkout" element={<CheckoutPage />} />
                      <Route path="/profile" element={<EditProfilePage />} />
                      <Route path="/dashboard" element={<CustomerDashboardPage />} />
                      <Route
                        path="/admin"
                        element={
                          <ProtectedAdminRoute>
                            <AdminDashboard />
                          </ProtectedAdminRoute>
                        }
                      />
                      <Route path="/rider/*" element={<RiderDashboardPage />} />
                      <Route path="/login" element={<LoginPage />} />
                      <Route path="/register" element={<RegisterPage />} />
                      <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                  </main>

                  {/* Global Slide-Over Cart Drawer */}
                  <CartDrawer />

                  {/* Dairy Farm Footer */}
                  <Footer />
                </div>
              </BrowserRouter>
            </CartProvider>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
