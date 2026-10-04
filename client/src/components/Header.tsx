import { Link, useLocation } from "wouter";
import {
  ShoppingCart,
  Menu,
  X,
  User,
  LogIn,
  LogOut,
  Heart,
  UserCircle,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useWishlist } from "@/hooks/useWishlist";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import bmaaFashionLogo from "@assets/bmaafashion.jpeg";

interface HeaderProps {
  cartItemCount?: number;
  onCartOpen?: () => void;
}

export default function Header({ cartItemCount = 0, onCartOpen }: HeaderProps) {
  const [location, setLocation] = useLocation();
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const {
    user,
    isLoading: isUserLoading,
    logout,
    clearPendingVerification,
  } = useAuth();
  const { wishlistCount } = useWishlist();
  const { logoUrl, announcementBar } = useSiteSettings();

  // Listen for navigation changes to update active menu highlighting
  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
      setLocation(window.location.pathname + window.location.search);
    };
    
    window.addEventListener('popstate', handleLocationChange);
    
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, [setLocation]);

  // Update currentPath when location changes (for wouter navigation)
  useEffect(() => {
    setCurrentPath(location.split('?')[0]);
  }, [location]);

  useEffect(() => {
    setLogoError(false);
  }, [logoUrl]);
  
  // Use currentPath for active menu detection
  const activePath = currentPath;

  const simpleNavigation = [
    { name: "Home", path: "/" },
    { name: "Shop", path: "/products" },
    { name: "About Us", path: "/about" },
    { name: "Contact", path: "/contact" },
  ];

  const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (activePath === "/") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="sticky top-0 z-50 shadow-sm overflow-visible">
      {announcementBar?.active && announcementBar?.text && (
        <div
          className="text-center text-sm py-2.5 px-4 font-medium tracking-wide"
          style={{
            backgroundColor: announcementBar.bgColor || "#F5C542",
            color: announcementBar.textColor || "#222222",
          }}
        >
          {announcementBar.text}
        </div>
      )}
      <header className="bg-white border-b border-border backdrop-blur-sm w-full overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex items-center justify-between h-20 lg:h-24 gap-2 lg:gap-4">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center flex-shrink-0"
            data-testid="link-home"
            onClick={handleLogoClick}
          >
            {logoUrl && !logoError ? (
              <img
                src={logoUrl}
                alt="Bmaafashion Logo"
                className="h-16 sm:h-20 md:h-24 w-auto object-contain"
                onError={() => setLogoError(true)}
              />
            ) : !logoUrl ? (
              <img
                src={bmaaFashionLogo}
                alt="Bmaafashion Logo"
                className="h-16 sm:h-20 md:h-24 w-auto object-contain"
              />
            ) : (
              <span className="text-xl sm:text-2xl font-bold text-primary font-poppins">
                Bmaafashion
              </span>
            )}
          </Link>

          {/* Desktop Navigation - Simple Links Only */}
          <nav className="hidden lg:flex items-center flex-1 justify-center gap-6 xl:gap-8">
            {simpleNavigation.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`px-3 py-2 text-sm font-medium transition-all duration-300 relative whitespace-nowrap ${
                  activePath === item.path
                    ? "text-primary"
                    : "text-foreground hover:text-primary"
                }`}
                data-testid={`link-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {item.name}
                {activePath === item.path && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"></span>
                )}
              </Link>
            ))}
          </nav>

          {/* Auth and Cart Actions */}
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            {/* Search Icon */}
            <Button
              variant="ghost"
              size="icon"
              className="hidden lg:flex"
              data-testid="button-search"
            >
              <Search className="h-5 w-5" />
            </Button>
            {/* Authentication */}
            {!isUserLoading && (
              <div className="hidden lg:flex items-center">
                {user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        data-testid="button-user-menu"
                      >
                        <UserCircle className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {user.firstName} {user.lastName}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {user.email}
                          </span>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link
                          to="/profile"
                          className="cursor-pointer"
                          data-testid="menu-item-profile"
                        >
                          <User className="h-5 w-5 mr-2" />
                          Profile
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={logout}
                        className="cursor-pointer text-red-600 focus:text-red-600"
                        data-testid="menu-item-logout"
                      >
                        <LogOut className="h-5 w-5 mr-2" />
                        Logout
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Link to="/login" onClick={() => clearPendingVerification()}>
                    <Button
                      variant="default"
                      className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
                      data-testid="button-login"
                    >
                      <LogIn className="h-4 w-4 mr-2" />
                      Sign In
                    </Button>
                  </Link>
                )}
              </div>
            )}

            {/* Wishlist Button */}
            {user && (
              <Link to="/wishlist">
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative"
                  data-testid="button-wishlist"
                >
                  <Heart className="h-5 w-5" />
                  {wishlistCount > 0 && (
                    <span
                      className="absolute -top-2 -right-2 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center px-1"
                      data-testid="badge-wishlist-count"
                    >
                      {wishlistCount > 9 ? "9+" : wishlistCount}
                    </span>
                  )}
                </Button>
              </Link>
            )}

            {/* Cart Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onCartOpen}
              className="relative"
              data-testid="button-cart"
            >
              <ShoppingCart className="h-5 w-5" />
              {cartItemCount > 0 && (
                <span
                  className="absolute -top-2 -right-2 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center px-1"
                  data-testid="badge-cart-count"
                >
                  {cartItemCount > 9 ? "9+" : cartItemCount}
                </span>
              )}
            </Button>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-border py-4 bg-muted/30">
            <nav className="flex flex-col space-y-1">
              {simpleNavigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`px-4 py-3 rounded-lg text-base font-medium transition-all duration-200 ${
                    activePath === item.path
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-foreground hover:bg-white hover:shadow-sm"
                  }`}
                  data-testid={`mobile-link-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
    </div>
  );
}
