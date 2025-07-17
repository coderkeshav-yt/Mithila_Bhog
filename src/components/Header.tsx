
import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Product {
  id: string;
  name: string;
  category?: string;
}
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, X, ShoppingCart, Heart, User, LogOut, Settings, Home, Utensils, BookOpen, Phone } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";

// Add global styles for nav items with enhanced animations
const navItemStyles = `
  /* Base nav item styles */
  .nav-item {
    position: relative;
    transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
    overflow: hidden;
    transform: translateZ(0);
  }
  
  /* Hover and active states */
  .nav-item:not(.active):hover {
    color: hsl(var(--primary));
    transform: translateY(-1px);
  }
  
  .nav-item:not(.active):active {
    transform: translateY(0);
  }
  
  /* Navigation item styles */
  .nav-item {
    display: inline-flex;
    align-items: center;
    padding: 0.5rem 0.75rem;
    font-weight: 500;
    color: hsl(var(--foreground));
    transition: all 0.2s ease;
  }
  
  .nav-item:hover {
    color: hsl(var(--primary));
  }
  
  /* Enhanced dropdown styles */
  .dropdown-content {
    animation-duration: 0.2s;
    animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
    transform-origin: var(--radix-dropdown-menu-content-transform-origin);
  }
  .dropdown-content[data-state='open'] {
    animation-name: slideDownAndFade;
  }
  /* Enhanced dropdown items */
  .dropdown-item {
    position: relative;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border-radius: 6px;
    margin: 2px 4px;
    overflow: hidden;
    transform: translateZ(0);
    will-change: transform, background-color, box-shadow;
  }
  
  .dropdown-item::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, hsl(var(--primary)/0.03) 0%, transparent 100%);
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
  }
  
  .dropdown-item:hover {
    background-color: hsl(var(--accent));
    transform: translateX(6px) scale(1.01);
    box-shadow: 0 4px 12px -2px hsl(var(--primary)/0.1);
  }
  
  .dropdown-item:hover::before {
    opacity: 1;
  }
  
  .dropdown-item:active {
    transform: translateX(4px) scale(0.99);
    transition-duration: 0.1s;
  }
  .dropdown-item:focus {
    outline: none;
    box-shadow: 0 0 0 2px hsl(var(--ring));
  }
  
  @keyframes slideDownAndFade {
    0% {
      opacity: 0;
      transform: translateY(-10px) scale(0.98);
      box-shadow: 0 10px 30px -10px hsl(var(--primary)/0.1);
    }
    50% {
      opacity: 1;
      transform: translateY(2px) scale(1.005);
    }
    100% {
      opacity: 1;
      transform: translateY(0) scale(1);
      box-shadow: 0 20px 40px -15px hsl(var(--primary)/0.1);
    }
  }
`;

// Add the styles to the document head
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = navItemStyles;
  document.head.append(style);
}

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut, isAdmin } = useAuth();
  const { cartItems } = useCart();
  const { wishlistItems } = useWishlist();

  const [products, setProducts] = useState<Product[]>([]);

  // Fetch products for search suggestions
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('name, id, category')
          .eq('is_active', true)
          .order('name');

        if (error) throw error;
        setProducts(data || []);
      } catch (error) {
        console.error('Error fetching products for search:', error);
      }
    };

    fetchProducts();
  }, []);

  // Filter products based on input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    // Filter products based on input
    if (value.trim().length > 0) {
      const searchTerm = value.trim().toLowerCase();
      const filtered = products
        .filter(product => 
          product.name.toLowerCase().includes(searchTerm) ||
          (product.category && product.category.toLowerCase().includes(searchTerm))
        )
        .map(product => product.name)
        .filter((value, index, self) => self.indexOf(value) === index) // Remove duplicates
        .slice(0, 5); // Limit to 5 suggestions
      
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  };

  // Find exact product match
  const findExactProductMatch = (query: string) => {
    return products.find(
      product => product.name.toLowerCase() === query.toLowerCase()
    );
  };

  // Handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    // Check for exact product match
    const exactMatch = findExactProductMatch(query);
    if (exactMatch) {
      const productPath = `/products/${exactMatch.name.toLowerCase().replace(/\s+/g, '-')}`;
      navigate(productPath);
    } else {
      navigate(`/search?q=${encodeURIComponent(query)}`);
    }
    
    setSearchQuery("");
    setSuggestions([]);
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    const exactMatch = findExactProductMatch(suggestion);
    if (exactMatch) {
      const productPath = `/products/${exactMatch.name.toLowerCase().replace(/\s+/g, '-')}`;
      navigate(productPath);
    } else {
      navigate(`/search?q=${encodeURIComponent(suggestion)}`);
    }
    
    setSearchQuery("");
    setSuggestions([]);
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSuggestions([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const cartItemCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const wishlistItemCount = wishlistItems.length;

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <header className="bg-background border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <img 
              src="https://res.cloudinary.com/dlvxjnycr/image/upload/v1752289039/download_j07tr0.png" 
              alt="Mithila Bhog Logo" 
              className="w-12 h-12 object-contain -ml-2"
              onError={(e) => {
                // Fallback to original logo if image fails to load
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center hidden">
              <span className="text-primary-foreground font-bold text-lg">M</span>
            </div>

          </Link>

          {/* Search Bar */}
          <div className="relative flex-1 max-w-2xl mx-4 hidden md:block" ref={searchRef}>
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search for products..."
                className="w-full pl-10 py-2 rounded-full bg-muted/50 border-border focus-visible:ring-1 focus-visible:ring-ring"
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
              />
            </form>
            
            {/* Search Suggestions */}
            {suggestions.length > 0 && isSearchFocused && (
              <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg animate-in fade-in-0 zoom-in-95">
                <div className="p-1">
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                      onMouseDown={() => handleSuggestionClick(suggestion)}
                    >
                      <Search className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                      <span>{suggestion}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Desktop Navigation */}
          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList className="gap-2">
              <NavigationMenuItem className="flex items-center">
                <Link
                  to="/"
                  className={`nav-item ${isActive("/") ? 'text-primary' : 'text-foreground'}`}
                >
                  Home
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem className="flex items-center">
                <NavigationMenuTrigger className="nav-item bg-transparent hover:bg-transparent data-[state=open]:text-primary">
                  Products
                </NavigationMenuTrigger>
                <NavigationMenuContent className="dropdown-content bg-background rounded-lg shadow-lg border border-border overflow-hidden">
                  <div className="grid gap-1 p-2 w-[320px]">
                    <NavigationMenuLink asChild>
                      <Link
                        to="/products"
                        className="dropdown-item flex items-center p-3 hover:bg-accent/50 transition-colors rounded-md group"
                      >
                        <div className="bg-primary/10 p-2 rounded-md mr-3 group-hover:bg-primary/20 transition-colors">
                          <Utensils className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="text-sm font-medium leading-none">All Products</div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Browse our complete collection
                          </p>
                        </div>
                      </Link>
                    </NavigationMenuLink>
                    
                    <div className="h-px bg-border mx-3 my-1"></div>
                    
                    <h3 className="text-xs font-semibold text-muted-foreground px-3 py-1.5 uppercase tracking-wider">Categories</h3>
                    
                    <NavigationMenuLink asChild>
                      <Link
                        to="/products?category=Traditional Sweets"
                        className="dropdown-item flex items-center p-3 hover:bg-accent/50 transition-colors rounded-md group"
                      >
                        <div className="bg-amber-100 dark:bg-amber-900/30 p-2 rounded-md mr-3 group-hover:bg-amber-200 dark:group-hover:bg-amber-900/50 transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600 dark:text-amber-400">
                            <path d="M8 2v4" /><path d="M12 2v4" /><path d="M16 2v4" />
                            <rect width="16" height="18" x="4" y="4" rx="2" />
                            <path d="M4 10h16" />
                            <path d="M10 14h.01" />
                            <path d="M14 14h.01" />
                            <path d="M10 18h.01" />
                            <path d="M14 18h.01" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-sm font-medium">Traditional Sweets</div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Authentic Bihari sweets and desserts
                          </p>
                        </div>
                      </Link>
                    </NavigationMenuLink>
                    
                    <NavigationMenuLink asChild>
                      <Link
                        to="/products?category=Pickles & Preserves"
                        className="dropdown-item flex items-center p-3 hover:bg-accent/50 transition-colors rounded-md group"
                      >
                        <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-md mr-3 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-900/50 transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600 dark:text-emerald-400">
                            <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5" />
                            <path d="M8.5 8.5v.01" />
                            <path d="M16 15.5v.01" />
                            <path d="M12 12a1 1 0 1 0-1-1" />
                            <path d="M11 17v1" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-sm font-medium">Pickles & Preserves</div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Homemade pickles and preserved foods
                          </p>
                        </div>
                      </Link>
                    </NavigationMenuLink>
                    
                    <NavigationMenuLink asChild>
                      <Link
                        to="/products?category=Chips & Snacks"
                        className="dropdown-item flex items-center p-3 hover:bg-accent/50 transition-colors rounded-md group"
                      >
                        <div className="bg-rose-100 dark:bg-rose-900/30 p-2 rounded-md mr-3 group-hover:bg-rose-200 dark:group-hover:bg-rose-900/50 transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-rose-600 dark:text-rose-400">
                            <path d="M4 2v20" /><path d="M1 10h6" /><path d="M1 18h6" /><path d="M1 2h6" />
                            <path d="M9 2v20" />
                            <path d="M12 2v20" />
                            <path d="M12 10h6" />
                            <path d="M12 18h6" />
                            <path d="M12 2h6" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-sm font-medium">Chips & Snacks</div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Crispy snacks and munchies
                          </p>
                        </div>
                      </Link>
                    </NavigationMenuLink>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
              <NavigationMenuItem className="flex items-center">
                <Link
                  to="/blog"
                  className={`nav-item ${isActive("/blog") ? 'text-primary' : 'text-foreground'}`}
                >
                  Blog
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem className="flex items-center">
                <Link
                  to="/contact"
                  className={`nav-item ${isActive("/contact") ? 'text-primary' : 'text-foreground'}`}
                >
                  Contact
                </Link>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

          {/* Right Side Actions - Desktop */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Cart */}
            <Link to="/cart">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="h-5 w-5" />
                {cartItemCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                    {cartItemCount}
                  </Badge>
                )}
              </Button>
            </Link>

            {/* Wishlist - Desktop Only */}
            <Link to="/wishlist" className="hidden md:block">
              <Button variant="ghost" size="icon" className="relative">
                <Heart className="h-5 w-5" />
                {wishlistItemCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                    {wishlistItemCount}
                  </Badge>
                )}
              </Button>
            </Link>

            {/* User Menu - Desktop Only */}
            <div className="hidden md:block">
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <User className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-2 py-1.5 text-sm font-medium">
                      {user.email}
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/profile">
                        <User className="mr-2 h-4 w-4" />
                        My Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/track-order">Track Orders</Link>
                    </DropdownMenuItem>
                    {isAdmin && (
                      <DropdownMenuItem asChild>
                        <Link to="/admin">
                          <Settings className="mr-2 h-4 w-4" />
                          Admin Dashboard
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link to="/login">
                  <Button variant="cta" size="sm">
                    Sign In
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Mobile Cart and Menu Toggle */}
          <div className="flex items-center space-x-4 md:hidden">
            {/* Cart - Mobile */}
            <Link to="/cart">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="h-5 w-5" />
                {cartItemCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                    {cartItemCount}
                  </Badge>
                )}
              </Button>
            </Link>

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

          {/* Mobile Search - Only visible when menu is open */}
          {isMenuOpen && (
            <div className="md:hidden w-full mb-4 px-4">
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search for products..."
                  className="w-full pl-10 py-2 rounded-full bg-muted/50 border-border"
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
              </form>
              
              {/* Mobile Search Suggestions */}
              {suggestions.length > 0 && (
                <div className="absolute z-50 mt-1 w-[calc(100%-2rem)] rounded-md border bg-popover shadow-lg">
                  <div className="p-1">
                    {suggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                        onMouseDown={() => {
                          handleSuggestionClick(suggestion);
                          setIsMenuOpen(false);
                        }}
                      >
                        <Search className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                        <span>{suggestion}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mobile Navigation */}
          {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <nav className="flex flex-col space-y-2">
              <Link
                to="/"
                className={`px-4 py-2 text-sm font-medium transition-colors hover:text-primary ${
                  isActive("/") ? "text-primary" : "text-foreground"
                } flex items-center`}
                onClick={() => setIsMenuOpen(false)}
              >
                <Home className="h-4 w-4 mr-2" />
                Home
              </Link>
              <Link
                to="/products"
                className={`px-4 py-2 text-sm font-medium transition-colors hover:text-primary ${
                  isActive("/products") ? "text-primary" : "text-foreground"
                } flex items-center`}
                onClick={() => setIsMenuOpen(false)}
              >
                <Utensils className="h-4 w-4 mr-2" />
                Products
              </Link>
              <Link
                to="/blog"
                className={`px-4 py-2 text-sm font-medium transition-colors hover:text-primary ${
                  isActive("/blog") ? "text-primary" : "text-foreground"
                } flex items-center`}
                onClick={() => setIsMenuOpen(false)}
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Blog
              </Link>
              <Link
                to="/contact"
                className={`px-4 py-2 text-sm font-medium transition-colors hover:text-primary ${
                  isActive("/contact") ? "text-primary" : "text-foreground"
                } flex items-center`}
                onClick={() => setIsMenuOpen(false)}
              >
                <Phone className="h-4 w-4 mr-2" />
                Contact
              </Link>
              {/* Wishlist - Mobile */}
              <Link
                to="/wishlist"
                className="px-4 py-2 text-sm font-medium transition-colors hover:text-primary text-foreground flex items-center"
                onClick={() => setIsMenuOpen(false)}
              >
                <Heart className="h-4 w-4 mr-2" />
                Wishlist
                {wishlistItemCount > 0 && (
                  <span className="ml-2 bg-primary text-primary-foreground rounded-full h-5 w-5 flex items-center justify-center text-xs">
                    {wishlistItemCount}
                  </span>
                )}
              </Link>

              {user ? (
                <>
                  <Link
                    to="/profile"
                    className="px-4 py-2 text-sm font-medium transition-colors hover:text-primary text-foreground flex items-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <User className="h-4 w-4 mr-2" />
                    My Profile
                  </Link>
                  <Link
                    to="/track-order"
                    className="px-4 py-2 text-sm font-medium transition-colors hover:text-primary text-foreground"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Track Orders
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      className="px-4 py-2 text-sm font-medium transition-colors hover:text-primary text-foreground flex items-center"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Admin Dashboard
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      handleSignOut();
                    }}
                    className="w-full text-left px-4 py-2 text-sm font-medium transition-colors hover:text-primary text-foreground flex items-center"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium transition-colors hover:text-primary text-foreground flex items-center"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <User className="h-4 w-4 mr-2" />
                  Sign In
                </Link>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
