import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

const Footer = () => {
  return (
    <footer className="bg-card border-t mithila-border">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="text-xl font-bold text-primary">मिथिला भोग</div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Bringing you the authentic taste of Bihar with our handcrafted traditional snacks, 
              made from age-old family recipes with love and care.
            </p>
            <div className="flex space-x-3">
              <Button variant="outline" size="icon" className="h-8 w-8">
                <span className="text-xs">📘</span>
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8">
                <span className="text-xs">📷</span>
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8">
                <span className="text-xs">💬</span>
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Quick Links</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  to="/about"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  to="/products"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  All Products
                </Link>
              </li>
              <li>
                <Link
                  to="/blog"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Our Story
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Contact Us
                </Link>
              </li>
              <li>
                <Link
                  to="/wholesale"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Wholesale
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Categories</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  to="/categories/thekua"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Traditional Thekua
                </Link>
              </li>
              <li>
                <Link
                  to="/categories/pickles"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Artisanal Pickles
                </Link>
              </li>
              <li>
                <Link
                  to="/categories/chips"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Crispy Chips
                </Link>
              </li>
              <li>
                <Link
                  to="/categories/combo"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Gift Combos
                </Link>
              </li>
              <li>
                <Link
                  to="/categories/seasonal"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Seasonal Specials
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Stay Updated</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Get exclusive offers and be the first to know about new products!
            </p>
            <div className="space-y-3">
              <Input
                type="email"
                placeholder="Enter your email"
                className="bg-background border-primary/20 focus:border-primary/40"
              />
              <Button variant="cta" className="w-full">
                Subscribe & Get ₹50 OFF
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              * Use code MITHILA50 on your first order
            </p>
          </div>
        </div>

        <Separator className="my-8 bg-border" />

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-6 text-sm text-muted-foreground">
            <p>&copy; 2025 Mithila Bhog. All rights reserved.</p>
            <div className="flex space-x-4">
              <Link
                to="/privacy"
                className="hover:text-primary transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                to="/terms"
                className="hover:text-primary transition-colors"
              >
                Terms of Service
              </Link>
              <Link
                to="/shipping"
                className="hover:text-primary transition-colors"
              >
                Shipping Info
              </Link>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <span>Proudly Made in</span>
            <span className="text-primary font-semibold">🇮🇳 Bihar, India</span>
          </div>
        </div>
      </div>

      {/* Decorative Mithila Pattern */}
      <div className="h-1 bg-gradient-to-r from-transparent via-primary to-transparent"></div>
    </footer>
  );
};

export default Footer;