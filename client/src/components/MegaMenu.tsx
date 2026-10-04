import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";

export interface MegaMenuCategory {
  name: string;
  path: string;
  image?: string;
  subcategories?: string[];
  featured?: {
    title: string;
    subtitle: string;
    image: string;
    link: string;
  };
}

interface MegaMenuProps {
  categories: MegaMenuCategory[];
}

export default function MegaMenu({ categories }: MegaMenuProps) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null);
  const buttonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

  // Check URL to determine active category
  useEffect(() => {
    const checkActiveCategory = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const categoryParam = urlParams.get('category');
      setActiveCategory(categoryParam);
    };
    
    checkActiveCategory();
    window.addEventListener('popstate', checkActiveCategory);
    
    return () => {
      window.removeEventListener('popstate', checkActiveCategory);
    };
  }, []);

  // Calculate dropdown position when activeMenu changes
  useEffect(() => {
    if (activeMenu && buttonRefs.current[activeMenu]) {
      const button = buttonRefs.current[activeMenu];
      const rect = button.getBoundingClientRect();
      const dropdownWidth = 250; // minWidth from styles
      
      // Calculate initial left position (centered under button)
      let left = rect.left + rect.width / 2 + window.scrollX;
      
      // Check if dropdown would overflow right edge
      const rightEdge = left + dropdownWidth / 2;
      const viewportWidth = window.innerWidth;
      
      if (rightEdge > viewportWidth - 20) {
        // Align to right edge with padding
        left = viewportWidth - dropdownWidth / 2 - 20 + window.scrollX;
      }
      
      // Check if dropdown would overflow left edge
      const leftEdge = left - dropdownWidth / 2;
      if (leftEdge < 20) {
        // Align to left edge with padding
        left = dropdownWidth / 2 + 20 + window.scrollX;
      }
      
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: left,
      });
    } else {
      setDropdownPosition(null);
    }
  }, [activeMenu]);

  return (
    <>
      <nav className="hidden lg:flex items-center space-x-0.5">
        {categories.map((category) => {
          const isActive = activeCategory === category.name;
          
          return (
            <div
              key={category.name}
              className="relative group"
              onMouseEnter={() => setActiveMenu(category.name)}
              onMouseLeave={() => setActiveMenu(null)}
            >
              {/* Main Menu Item */}
              <button
                ref={(el) => (buttonRefs.current[category.name] = el)}
                className={`flex items-center space-x-1 px-2 xl:px-3 py-2 text-xs xl:text-sm font-medium transition-colors duration-200 relative ${
                  isActive ? 'text-primary' : 'text-foreground hover:text-primary'
                }`}
                onClick={(e) => {
                  // If no subcategories, navigate to main category
                  if (!category.subcategories || category.subcategories.length === 0) {
                    window.history.pushState({}, '', category.path);
                    window.dispatchEvent(new PopStateEvent('popstate'));
                    setActiveMenu(null);
                  }
                }}
              >
                <span>{category.name}</span>
                {category.subcategories && category.subcategories.length > 0 && (
                  <ChevronDown className="h-4 w-4 transition-transform duration-200 group-hover:rotate-180" />
                )}
                {/* Underline animation - show on hover OR when active */}
                <span className={`absolute bottom-0 left-0 h-0.5 bg-primary transition-all duration-300 ${
                  isActive ? 'w-full' : 'w-0 group-hover:w-full'
                }`} />
              </button>
            </div>
          );
        })}
      </nav>

      {/* Mega Menu Dropdown - Rendered via Portal */}
      {activeMenu && dropdownPosition && categories.find(c => c.name === activeMenu)?.subcategories &&
        createPortal(
          <div
            className="fixed transition-all duration-300"
            style={{
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
              transform: 'translateX(-50%)',
              zIndex: 9999,
              width: "auto",
              minWidth: "250px",
              maxWidth: "400px",
            }}
            onMouseEnter={() => setActiveMenu(activeMenu)}
            onMouseLeave={() => setActiveMenu(null)}
          >
            <div className="pt-2">
              <div className="bg-white rounded-lg shadow-2xl border border-border p-4 max-h-[80vh] overflow-y-auto">
                <div className="space-y-1">
                  {/* Subcategories as clickable links */}
                  {categories.find(c => c.name === activeMenu)?.subcategories?.map((subcategory) => (
                    <button
                      key={subcategory}
                      onClick={() => {
                        const url = `/products?category=${encodeURIComponent(activeMenu)}&subcategory=${encodeURIComponent(subcategory)}`;
                        console.log('MegaMenu: Navigating to:', url);
                        
                        // Use pushState to update URL without page reload
                        window.history.pushState({}, '', url);
                        
                        // Dispatch a custom event to notify the Products page
                        window.dispatchEvent(new PopStateEvent('popstate'));
                        
                        setActiveMenu(null);
                      }}
                      className="w-full text-left block px-4 py-2.5 text-sm text-foreground hover:bg-primary/10 hover:text-primary rounded-md transition-colors duration-200"
                    >
                      {subcategory}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>,
          document.body
        )
      }
    </>
  );
}
