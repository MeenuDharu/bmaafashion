import { useEffect, useState } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider, useCart } from "@/context/CartContext";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ShoppingCartSlideout from "@/components/ShoppingCartSlideout";
import { AdminLayout } from "@/components/AdminLayout";
import Home from "@/pages/Home";
import Products from "@/pages/Products";
import FreshProduce from "@/pages/FreshProduce";
import Services from "@/pages/Services";
import Categories from "@/pages/Categories";
import ProductDetail from "@/pages/ProductDetail";
import Checkout from "@/pages/Checkout";
import About from "@/pages/About";
import Contact from "@/pages/Contact";
import Profile from "@/pages/Profile";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import TermsOfService from "@/pages/TermsOfService";
import ShippingPolicy from "@/pages/ShippingPolicy";
import ReturnPolicy from "@/pages/ReturnPolicy";
import Addresses from "@/pages/Addresses";
import Wishlist from "@/pages/Wishlist";
import OrderHistory from "@/pages/OrderHistory";
import OrderDetail from "@/pages/OrderDetail";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import VerifyEmail from "@/pages/VerifyEmail";
import EmailVerificationPending from "@/pages/EmailVerificationPending";
import DesignShowcase from "@/pages/DesignShowcase";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminAnalytics from "@/pages/admin/AdminAnalytics";
import AdminTopProducts from "@/pages/admin/AdminTopProducts";
import AdminProducts from "@/pages/admin/AdminProducts";
import AdminCategories from "@/pages/admin/AdminCategories";
import AdminOrders from "@/pages/admin/AdminOrders";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminCustomers from "@/pages/admin/AdminCustomers";
import AdminInventory from "@/pages/admin/AdminInventory";
import AdminExports from "@/pages/admin/AdminExports";
import AdminReviews from "@/pages/admin/AdminReviews";
import AdminWhatsappAnalytics from "@/pages/admin/AdminWhatsappAnalytics";
import AdminMessageTemplates from "@/pages/admin/AdminMessageTemplates";
import AdminNotifications from "@/pages/admin/AdminNotifications";
import AdminSettings from "@/pages/admin/AdminSettings";
import GuestOrderLookup from "@/pages/GuestOrderLookup";
import OrderAccess from "@/pages/OrderAccess";
import NotFound from "@/pages/not-found";
import { AuthProvider } from "@/context/AuthContext";
import AdminRoute from "@/components/AdminRoute";

// ── Storefront Extras: maintenance, cookie consent, popup, tracking ──
function StorefrontExtras() {
  const { maintenanceMode, cookieConsent, popupSettings, trackingSettings } = useSiteSettings();
  const [location] = useLocation();
  const [cookieAccepted, setCookieAccepted] = useState<boolean | null>(() => {
    const stored = localStorage.getItem("sg_cookie_consent");
    return stored ? (stored === "accepted" ? true : false) : null;
  });
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupDismissed, setPopupDismissed] = useState(() => !!localStorage.getItem("sg_popup_dismissed"));

  // Inject GA4 script
  useEffect(() => {
    const gaId = trackingSettings?.googleAnalyticsId;
    if (!gaId || document.getElementById("sg-ga-script")) return;
    const script = document.createElement("script");
    script.id = "sg-ga-script";
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
    document.head.appendChild(script);
    const inline = document.createElement("script");
    inline.id = "sg-ga-inline";
    inline.textContent = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}');`;
    document.head.appendChild(inline);
  }, [trackingSettings?.googleAnalyticsId]);

  // Inject Facebook Pixel
  useEffect(() => {
    const pixelId = trackingSettings?.facebookPixelId;
    if (!pixelId || document.getElementById("sg-fb-pixel")) return;
    const script = document.createElement("script");
    script.id = "sg-fb-pixel";
    script.textContent = `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${pixelId}');fbq('track','PageView');`;
    document.head.appendChild(script);
  }, [trackingSettings?.facebookPixelId]);

  // Popup timer
  useEffect(() => {
    if (!popupSettings?.enabled || popupDismissed) return;
    const delay = (popupSettings.delay ?? 5) * 1000;
    const t = setTimeout(() => setPopupVisible(true), delay);
    return () => clearTimeout(t);
  }, [popupSettings?.enabled, popupSettings?.delay, popupDismissed]);

  const isAdminRoute = location.startsWith("/admin");

  // Maintenance mode gate (skip for admin routes)
  if (maintenanceMode?.enabled && !isAdminRoute) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 text-center">
        <div className="max-w-md space-y-4">
          <div className="p-4 bg-primary/10 rounded-full inline-flex">
            <svg className="h-12 w-12 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-foreground">{maintenanceMode.title ?? "We'll be back soon!"}</h1>
          <p className="text-muted-foreground">{maintenanceMode.message ?? "We're making some improvements. Check back shortly."}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Cookie Consent Banner */}
      {cookieConsent?.enabled && cookieAccepted === null && (
        <div className="fixed bottom-0 left-0 right-0 z-[100] bg-card border-t border-border shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-4 flex flex-wrap items-center gap-3 justify-between">
            <p className="text-sm text-foreground flex-1 min-w-[200px]">
              {cookieConsent.message ?? "We use cookies to improve your experience on our site."}
            </p>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => { localStorage.setItem("sg_cookie_consent", "declined"); setCookieAccepted(false); }}
                className="text-sm px-4 py-2 rounded-md border border-border hover:bg-muted transition-colors"
              >
                {cookieConsent.declineText ?? "Decline"}
              </button>
              <button
                onClick={() => { localStorage.setItem("sg_cookie_consent", "accepted"); setCookieAccepted(true); }}
                className="text-sm px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                {cookieConsent.acceptText ?? "Accept"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Popup / Welcome Modal */}
      {popupSettings?.enabled && popupVisible && !popupDismissed && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 px-4">
          <div className="bg-card rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-xl font-bold text-foreground">{popupSettings.title || "Special Offer!"}</h2>
              <button
                onClick={() => { setPopupVisible(false); setPopupDismissed(true); localStorage.setItem("sg_popup_dismissed", "1"); }}
                className="text-muted-foreground hover:text-foreground transition-colors mt-0.5"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            {popupSettings.message && <p className="text-muted-foreground text-sm">{popupSettings.message}</p>}
            {popupSettings.couponCode && (
              <div className="bg-primary/10 rounded-md px-4 py-2 text-center">
                <p className="text-xs text-muted-foreground mb-1">Use code at checkout:</p>
                <p className="text-lg font-bold text-primary tracking-widest">{popupSettings.couponCode}</p>
              </div>
            )}
            <button
              onClick={() => { setPopupVisible(false); setPopupDismissed(true); localStorage.setItem("sg_popup_dismissed", "1"); }}
              className="w-full py-2.5 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
            >
              {popupSettings.buttonText || "Shop Now"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function AppRoutes() {
  const [location] = useLocation();
  const [, setLocation] = useLocation();

  // Apply admin-configured font and background color globally
  useSiteSettings();
  
  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);
  
  // Check if current route is an admin route
  const isAdminRoute = location.startsWith('/admin');

  // Admin routes get their own layout with AdminLayout wrapper
  if (isAdminRoute) {
    return (
      <AdminLayout>
        <Switch>
          <Route path="/admin">
            <AdminRoute><AdminDashboard /></AdminRoute>
          </Route>
          <Route path="/admin/analytics">
            <AdminRoute><AdminAnalytics /></AdminRoute>
          </Route>
          <Route path="/admin/top-products">
            <AdminRoute><AdminTopProducts /></AdminRoute>
          </Route>
          <Route path="/admin/products">
            <AdminRoute><AdminProducts /></AdminRoute>
          </Route>
          <Route path="/admin/categories">
            <AdminRoute><AdminCategories /></AdminRoute>
          </Route>
          <Route path="/admin/orders">
            <AdminRoute><AdminOrders /></AdminRoute>
          </Route>
          <Route path="/admin/users">
            <AdminRoute><AdminUsers /></AdminRoute>
          </Route>
          <Route path="/admin/customers">
            <AdminRoute><AdminCustomers /></AdminRoute>
          </Route>
          <Route path="/admin/inventory">
            <AdminRoute><AdminInventory /></AdminRoute>
          </Route>
          <Route path="/admin/exports">
            <AdminRoute><AdminExports /></AdminRoute>
          </Route>
          <Route path="/admin/reviews">
            <AdminRoute><AdminReviews /></AdminRoute>
          </Route>
          <Route path="/admin/whatsapp-analytics">
            <AdminRoute><AdminWhatsappAnalytics /></AdminRoute>
          </Route>
          <Route path="/admin/message-templates">
            <AdminRoute><AdminMessageTemplates /></AdminRoute>
          </Route>
          <Route path="/admin/notifications">
            <AdminRoute><AdminNotifications /></AdminRoute>
          </Route>
          <Route path="/admin/settings">
            <AdminRoute><AdminSettings /></AdminRoute>
          </Route>
          <Route component={NotFound} />
        </Switch>
      </AdminLayout>
    );
  }

  // Regular routes need cart functionality, so render the MainApp component
  return <MainApp />;
}

function MainApp() {
  const [, setLocation] = useLocation();
  const { 
    items, 
    isCartOpen, 
    addToCart, 
    removeFromCart, 
    updateQuantity, 
    openCart, 
    closeCart, 
    getTotalItems 
  } = useCart();

  const handleAddToCart = async (productId: string, quantity: number = 1) => {
    try {
      const response = await fetch(`/api/products/${productId}`);
      if (response.ok) {
        const product = await response.json();
        const success = await addToCart(product, quantity);
        if (success) {
          console.log('Added to cart:', productId);
        }
      } else {
        console.error('Product not found');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  const handleViewProductDetails = (productId: string) => {
    setLocation(`/products/${productId}`);
    // Scroll to top when navigating to product details
    window.scrollTo(0, 0);
  };

  const handleNavigateToProducts = () => {
    setLocation('/products');
    window.scrollTo(0, 0);
  };

  const handleNavigateToCategory = (mainCategory: string, subcategory: string) => {
    setLocation(`/products?category=${encodeURIComponent(mainCategory)}&subcategory=${encodeURIComponent(subcategory)}`);
    window.scrollTo(0, 0);
  };

  const handleCheckout = () => {
    setLocation('/checkout');
    closeCart();
    window.scrollTo(0, 0);
  };

  // Regular routes get the standard layout with header and footer
  return (
    <div className="min-h-screen flex flex-col">
      <StorefrontExtras />
      <Header cartItemCount={getTotalItems()} onCartOpen={openCart} />
      
      <main className="flex-1">
        <Switch>
          <Route path="/">
            <Home 
              onAddToCart={handleAddToCart}
              onViewProductDetails={handleViewProductDetails}
              onNavigateToProducts={handleNavigateToProducts}
              onNavigateToCategory={handleNavigateToCategory}
            />
          </Route>
          <Route path="/products">
            <Products 
              onAddToCart={handleAddToCart}
              onViewProductDetails={handleViewProductDetails}
            />
          </Route>
          <Route path="/fresh-produce">
            <FreshProduce 
              onAddToCart={handleAddToCart}
              onViewProductDetails={handleViewProductDetails}
            />
          </Route>
          <Route path="/services">
            <Services />
          </Route>
          <Route path="/categories">
            <Categories 
              onNavigateToProducts={handleNavigateToProducts}
              onNavigateToCategory={handleNavigateToCategory}
            />
          </Route>
          <Route path="/products/:id">
            <ProductDetail 
              onAddToCart={handleAddToCart}
            />
          </Route>
          <Route path="/checkout">
            <Checkout />
          </Route>
          <Route path="/about">
            <About />
          </Route>
          <Route path="/contact">
            <Contact />
          </Route>
          <Route path="/profile">
            <Profile />
          </Route>
          <Route path="/addresses">
            <Addresses />
          </Route>
          <Route path="/wishlist">
            <Wishlist />
          </Route>
          <Route path="/orders">
            <OrderHistory />
          </Route>
          <Route path="/orders/:id">
            <OrderDetail />
          </Route>
          <Route path="/login">
            <Login />
          </Route>
          <Route path="/register">
            <Register />
          </Route>
          <Route path="/forgot-password">
            <ForgotPassword />
          </Route>
          <Route path="/reset-password">
            <ResetPassword />
          </Route>
          <Route path="/verify-email">
            <VerifyEmail />
          </Route>
          <Route path="/email-verification-pending">
            <EmailVerificationPending />
          </Route>
          <Route path="/guest-orders">
            <GuestOrderLookup />
          </Route>
          <Route path="/order-access">
            <OrderAccess />
          </Route>
          <Route path="/privacy-policy">
            <PrivacyPolicy />
          </Route>
          <Route path="/terms-of-service">
            <TermsOfService />
          </Route>
          <Route path="/shipping-policy">
            <ShippingPolicy />
          </Route>
          <Route path="/return-policy">
            <ReturnPolicy />
          </Route>
          <Route path="/design-showcase">
            <DesignShowcase />
          </Route>
          <Route component={NotFound} />
        </Switch>
      </main>

      <Footer />
      
      <ShoppingCartSlideout
        isOpen={isCartOpen}
        onClose={closeCart}
        items={items}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeFromCart}
        onCheckout={handleCheckout}
      />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <CartProvider>
            <Toaster />
            <AppRoutes />
          </CartProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
