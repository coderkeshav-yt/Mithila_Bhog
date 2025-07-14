
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { Heart, ShoppingBag } from "lucide-react";
import { useWishlist } from "@/contexts/WishlistContext";

const Wishlist = () => {
  const { wishlistItems } = useWishlist();

  if (wishlistItems.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <div className="mb-8">
              <Heart className="h-24 w-24 text-muted-foreground mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-foreground mb-4">Your Wishlist is Empty</h1>
              <p className="text-muted-foreground mb-8">
                Save your favorite products here and shop them later.
              </p>
              <Button variant="cta" size="lg" asChild>
                <Link to="/products">
                  <ShoppingBag className="h-5 w-5 mr-2" />
                  Explore Products
                </Link>
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary">Home</Link>
          <span>/</span>
          <span className="text-foreground">Wishlist</span>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              My Wishlist
            </h1>
            <p className="text-muted-foreground">
              {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'} saved for later
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/products">
              Continue Shopping
            </Link>
          </Button>
        </div>

        {/* Wishlist Items */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {wishlistItems.map((product) => (
            <ProductCard 
              key={product.id} 
              id={product.id}
              name={product.name}
              image_url={product.image_url}
              price={product.price}
              category={product.category}
              rating={product.rating}
              description={product.description}
              weight={product.weight}
            />
          ))}
        </div>

        {/* Recommended Products */}
        <section className="mt-16 pt-16 border-t">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              You Might Also Like
            </h2>
            <p className="text-muted-foreground">
              Discover more traditional delights
            </p>
          </div>
          
          <div className="text-center">
            <Button variant="warm" asChild>
              <Link to="/products">
                Explore All Products
              </Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Wishlist;
