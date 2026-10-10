import { Home, Search, Heart, UserRound, ShoppingBag } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useWishlist } from "@/hooks/useWishlist";
import { useAuth } from "@/context/AuthContext";

interface MobileBottomNavProps { cartItemCount?: number; onCartOpen?: () => void; }

export default function MobileBottomNav({ cartItemCount = 0, onCartOpen }: MobileBottomNavProps) {
  const [location] = useLocation();
  const { wishlistCount } = useWishlist();
  const { user } = useAuth();
  const items = [
    { label: "Home", icon: Home, href: "/" },
    { label: "Shop", icon: Search, href: "/products" },
    { label: "Wishlist", icon: Heart, href: "/wishlist", badge: wishlistCount },
    { label: "Account", icon: UserRound, href: user ? "/profile" : "/login" },
  ];
  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
      <div className="mobile-bottom-nav__inner">
        {items.map(({ label, icon: Icon, href, badge }) => {
          const active = href === "/" ? location === "/" : location.startsWith(href);
          return <Link key={label} href={href} className={`mobile-bottom-nav__item ${active ? "is-active" : ""}`}>
            <span className="mobile-bottom-nav__icon"><Icon size={19} strokeWidth={active ? 2.2 : 1.8} />{badge ? <span className="mobile-bottom-nav__badge">{badge > 99 ? "99+" : badge}</span> : null}</span>
            <span>{label}</span>
          </Link>;
        })}
        <button type="button" onClick={onCartOpen} className="mobile-bottom-nav__item" aria-label="Open shopping bag">
          <span className="mobile-bottom-nav__icon"><ShoppingBag size={19} strokeWidth={1.8} />{cartItemCount ? <span className="mobile-bottom-nav__badge">{cartItemCount > 99 ? "99+" : cartItemCount}</span> : null}</span>
          <span>Bag</span>
        </button>
      </div>
    </nav>
  );
}
