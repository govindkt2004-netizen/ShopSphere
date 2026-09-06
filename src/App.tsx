import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { RealtimeProvider } from './context/RealtimeContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';

// Storefront Components
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { ProductQuickViewModal } from './components/ProductQuickViewModal';
import { AdminLayout } from './components/AdminLayout';
import { UnauthorizedPage } from './components/UnauthorizedPage';
import { AdminRouteGuard } from './components/AdminRouteGuard';

// Storefront Pages
import { HomePage } from './pages/HomePage';
import { ProductsPage } from './pages/ProductsPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderTrackingPage } from './pages/OrderTrackingPage';
import { WishlistPage } from './pages/WishlistPage';
import { ProfilePage } from './pages/ProfilePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';

// Admin Pages
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminProductsPage } from './pages/admin/AdminProductsPage';
import { AdminOrdersPage } from './pages/admin/AdminOrdersPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminCategoriesPage } from './pages/admin/AdminCategoriesPage';
import { AdminEmailsPage } from './pages/admin/AdminEmailsPage';
import { EmailInboxDrawer } from './components/EmailInboxDrawer';

import { Product } from './types';

function ShopSphereApp() {
  const [currentView, setCurrentView] = useState<string>('home');
  const [viewParam, setViewParam] = useState<string | undefined>(undefined);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [isEmailDrawerOpen, setIsEmailDrawerOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  const { isAdmin, isAuthenticated, user } = useAuth();

  const handleNavigate = (view: string, param?: string) => {
    setCurrentView(view);
    setViewParam(param);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Scroll to top whenever view changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentView, viewParam]);

  // Is current view in admin namespace?
  const isAdminView = currentView.startsWith('admin-');

  // Convert currentView into activeTab for AdminLayout
  const getAdminActiveTab = (): 'dashboard' | 'products' | 'orders' | 'users' | 'categories' | 'emails' => {
    if (currentView === 'admin-products') return 'products';
    if (currentView === 'admin-orders') return 'orders';
    if (currentView === 'admin-users') return 'users';
    if (currentView === 'admin-categories') return 'categories';
    if (currentView === 'admin-emails') return 'emails';
    return 'dashboard';
  };

  const handleAdminTabChange = (tab: 'dashboard' | 'products' | 'orders' | 'users' | 'categories' | 'emails') => {
    handleNavigate(`admin-${tab}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-indigo-600 selection:text-white">
      {/* RENDER ADMIN LAYOUT OR STOREFRONT */}
      {isAdminView ? (
        <AdminRouteGuard
          onNavigate={handleNavigate}
          fallback={
            <div className="flex-1 flex flex-col">
              <Navbar
                currentView={currentView}
                onNavigate={handleNavigate}
                onOpenCartDrawer={() => setIsCartDrawerOpen(true)}
              />
              <UnauthorizedPage onNavigate={handleNavigate} />
              <Footer onNavigate={handleNavigate} />
            </div>
          }
        >
          <AdminLayout
            activeTab={getAdminActiveTab()}
            onTabChange={handleAdminTabChange}
            onExitAdmin={() => handleNavigate('home')}
          >
            {currentView === 'admin-dashboard' && (
              <AdminDashboardPage
                onNavigateTab={(tab) => handleNavigate(`admin-${tab}`)}
                onNavigateOrder={(orderId) => handleNavigate('admin-orders', `orderId=${orderId}`)}
              />
            )}

            {currentView === 'admin-products' && <AdminProductsPage />}

            {currentView === 'admin-orders' && <AdminOrdersPage />}

            {currentView === 'admin-users' && <AdminUsersPage />}

            {currentView === 'admin-categories' && <AdminCategoriesPage />}

            {currentView === 'admin-emails' && <AdminEmailsPage />}
          </AdminLayout>
        </AdminRouteGuard>
      ) : (
        <>
          {/* Main Top Navigation */}
          <Navbar
            currentView={currentView}
            onNavigate={handleNavigate}
            onOpenCartDrawer={() => setIsCartDrawerOpen(true)}
            onOpenEmailInbox={() => setIsEmailDrawerOpen(true)}
          />

          {/* Main Content Area */}
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
            {currentView === 'home' && (
              <HomePage
                onNavigate={handleNavigate}
                onQuickView={(product) => setQuickViewProduct(product)}
              />
            )}

            {currentView === 'products' && (
              <ProductsPage
                initialQuery={viewParam}
                onNavigate={handleNavigate}
                onQuickView={(product) => setQuickViewProduct(product)}
              />
            )}

            {currentView === 'product-detail' && (
              <ProductDetailPage
                productId={viewParam || '1'}
                onNavigate={handleNavigate}
                onQuickView={(product) => setQuickViewProduct(product)}
              />
            )}

            {currentView === 'cart' && <CartPage onNavigate={handleNavigate} />}

            {currentView === 'checkout' && <CheckoutPage onNavigate={handleNavigate} />}

            {currentView === 'track-order' && (
              <OrderTrackingPage initialQuery={viewParam} onNavigate={handleNavigate} />
            )}

            {currentView === 'wishlist' && <WishlistPage onNavigate={handleNavigate} />}

            {currentView === 'profile' && (
              <ProfilePage
                initialQuery={viewParam}
                onNavigate={handleNavigate}
                onOpenEmailInbox={() => setIsEmailDrawerOpen(true)}
              />
            )}

            {currentView === 'login' && <LoginPage onNavigate={handleNavigate} />}

            {currentView === 'register' && <RegisterPage onNavigate={handleNavigate} />}

            {currentView === 'forgot-password' && (
              <ForgotPasswordPage onNavigate={handleNavigate} />
            )}
          </main>

          {/* Global Store Footer */}
          <Footer onNavigate={handleNavigate} />
        </>
      )}

      {/* Global Slide-Over Cart Drawer */}
      <CartDrawer
        isOpen={isCartDrawerOpen}
        onClose={() => setIsCartDrawerOpen(false)}
        onNavigate={handleNavigate}
      />

      {/* Global Slide-Over Email Notification & Inbox Drawer */}
      <EmailInboxDrawer
        isOpen={isEmailDrawerOpen}
        onClose={() => setIsEmailDrawerOpen(false)}
        userEmail={user?.email || 'customer@shopsphere.com'}
      />

      {/* Global Product Quick View Modal */}
      {quickViewProduct && (
        <ProductQuickViewModal
          product={quickViewProduct}
          isOpen={!!quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
          onNavigateDetail={(id) => {
            setQuickViewProduct(null);
            handleNavigate('product-detail', id);
          }}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <RealtimeProvider>
            <CartProvider>
              <WishlistProvider>
                <ShopSphereApp />
              </WishlistProvider>
            </CartProvider>
          </RealtimeProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
