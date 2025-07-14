
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut, isAdmin } = useAuth();
  const { cartItems } = useCart();
  const { wishlistItems } = useWishlist();

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

          {/* Desktop Navigation */}
          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList>
              <NavigationMenuItem>
                <Link
                  to="/"
                  className={`px-4 py-2 text-sm font-medium transition-colors hover:text-primary ${
                    isActive("/") ? "text-primary" : "text-foreground"
                  }`}
                >
                  Home
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuTrigger>Products</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="grid gap-3 p-6 w-[400px]">
                    <NavigationMenuLink asChild>
                      <Link
                        to="/products"
                        className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                      >
                        <div className="text-sm font-medium leading-none">All Products</div>
                        <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                          Browse our complete collection
                        </p>
                      </Link>
                    </NavigationMenuLink>
                    <NavigationMenuLink asChild>
                      <Link
                        to="/products?category=Traditional Sweets"
                        className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                      >
                        <div className="text-sm font-medium leading-none">Traditional Sweets</div>
                        <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                          Authentic Bihari sweets and desserts
                        </p>
                      </Link>
                    </NavigationMenuLink>
                    <NavigationMenuLink asChild>
                      <Link
                        to="/products?category=Pickles & Preserves"
                        className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                      >
                        <div className="text-sm font-medium leading-none">Pickles & Preserves</div>
                        <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                          Homemade pickles and preserved foods
                        </p>
                      </Link>
                    </NavigationMenuLink>
                    <NavigationMenuLink asChild>
                      <Link
                        to="/products?category=Chips & Snacks"
                        className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                      >
                        <div className="text-sm font-medium leading-none">Chips & Snacks</div>
                        <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                          Crispy snacks and munchies
                        </p>
                      </Link>
                    </NavigationMenuLink>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link
                  to="/blog"
                  className={`px-4 py-2 text-sm font-medium transition-colors hover:text-primary ${
                    isActive("/blog") ? "text-primary" : "text-foreground"
                  }`}
                >
                  Blog
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link
                  to="/contact"
                  className={`px-4 py-2 text-sm font-medium transition-colors hover:text-primary ${
                    isActive("/contact") ? "text-primary" : "text-foreground"
                  }`}
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
