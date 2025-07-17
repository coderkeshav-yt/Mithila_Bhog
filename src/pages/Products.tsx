
import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import ProductSkeleton from "@/components/ProductSkeleton";
import { supabase } from "@/integrations/supabase/client";
import { Search, Filter, SlidersHorizontal } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { products as localProducts } from "@/data/products"; // Import local fallback data

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  ingredients: string[];
  weight: string;
  rating: number;
  stock_quantity: number;
  is_bestseller: boolean;
  is_new: boolean;
  created_at: string;
  updated_at: string;
}

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'name');
  const [showFilters, setShowFilters] = useState(false);
  const { toast } = useToast();

  // Fetch products with improved performance and caching
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Fetching products from Supabase...');
        
        // Check for cached products first
        const cachedProducts = localStorage.getItem('cachedProducts');
        const cacheTimestamp = localStorage.getItem('productsCacheTimestamp');
        const now = Date.now();
        const cacheAge = cacheTimestamp ? now - parseInt(cacheTimestamp) : Infinity;
        const cacheValid = cacheAge < 15 * 60 * 1000; // 15 minutes cache validity for better performance
        
        // Use cache if valid and available
        if (cachedProducts && cacheValid) {
          try {
            const parsedProducts = JSON.parse(cachedProducts);
            console.log('Using cached products data:', parsedProducts.length);
            setProducts(parsedProducts);
            setLoading(false);
            
            // Refresh cache in background
            fetchFromSupabase(false);
            return;
          } catch (e) {
            console.error('Error parsing cached products:', e);
            // Continue with normal fetch if cache parsing fails
          }
        }
        
        // Set a shorter timeout to prevent getting stuck in loading state
        const timeoutId = setTimeout(() => {
          console.log('Products fetch timeout reached, falling back to local data');
          setProducts(localProducts as Product[]);
          setLoading(false);
          toast({
            title: "Connection Timeout",
            description: "Using local product data due to slow connection.",
            variant: "default"
          });
        }, 4000); // Reduced from 8s to 4s timeout
        
        await fetchFromSupabase(true, timeoutId);
      } catch (error) {
        console.error('Error in fetchProducts:', error);
        setError("An unexpected error occurred while loading products");
        toast({
          title: "Error",
          description: "Failed to load products. Using local data instead.",
          variant: "destructive"
        });
        // Fall back to local data on any error
        setProducts(localProducts as Product[]);
        setLoading(false);
      }
    };
    
    // Separate function to fetch from Supabase
    const fetchFromSupabase = async (updateUI = true, timeoutId?: NodeJS.Timeout) => {
      try {
        // Use a Promise.race to implement a timeout
        const fetchPromise = supabase
          .from('products')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false });
          
        const { data, error } = await fetchPromise;

        // Clear the timeout if it exists
        if (timeoutId) clearTimeout(timeoutId);

        if (error) {
          console.error('Error fetching products from Supabase:', error);
          if (updateUI) {
            setError("Failed to load products from database");
            toast({
              title: "Warning",
              description: "Using local product data instead of database.",
              variant: "default"
            });
            // Fall back to local data
            console.log('Falling back to local product data');
            setProducts(localProducts as Product[]);
          }
          return;
        }

        if (!data || data.length === 0) {
          console.log('No products found in Supabase, falling back to local data');
          if (updateUI) {
            toast({
              title: "Info",
              description: "Using demo products as no products were found in the database.",
              variant: "default"
            });
            setProducts(localProducts as Product[]);
          }
          return;
        }

        console.log('Successfully fetched products from Supabase:', data.length);
        
        // Cache the products data
        try {
          localStorage.setItem('cachedProducts', JSON.stringify(data));
          localStorage.setItem('productsCacheTimestamp', Date.now().toString());
        } catch (e) {
          console.error('Error caching products:', e);
        }
        
        if (updateUI) {
          setProducts(data);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error in fetchFromSupabase:', error);
        if (updateUI) {
          setError("An unexpected error occurred while loading products");
          toast({
            title: "Error",
            description: "Failed to load products. Using local data instead.",
            variant: "destructive"
          });
          // Fall back to local data on any error
          setProducts(localProducts as Product[]);
          setLoading(false);
        }
      }
    };

    fetchProducts();
  }, []); // Only run once on mount

  // Get unique categories from products
  const categories = useMemo(() => {
    if (!products.length) return ['all'];
    return ['all', ...new Set(products.map(p => p.category))];
  }, [products]);

  // Filter and sort products with optimized performance
  const filteredProducts = useMemo(() => {
    // Early return if no products
    if (!products.length) return [];
    
    // Prepare search term once for all products
    const lowerSearchTerm = searchTerm.toLowerCase();
    const hasSearchTerm = !!searchTerm;
    const isAllCategories = selectedCategory === 'all';
    
    // First filter by category (faster check)
    const categoryFiltered = isAllCategories 
      ? products 
      : products.filter(product => product.category === selectedCategory);
    
    // Then filter by search term if needed
    const fullyFiltered = !hasSearchTerm 
      ? categoryFiltered 
      : categoryFiltered.filter(product => {
          return product.name.toLowerCase().includes(lowerSearchTerm) || 
                 product.description?.toLowerCase().includes(lowerSearchTerm) ||
                 product.category.toLowerCase().includes(lowerSearchTerm) ||
                 product.ingredients?.some(ingredient => 
                   ingredient.toLowerCase().includes(lowerSearchTerm)
                 );
        });
    
    // Sort the filtered results
    return fullyFiltered.sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'name':
        default:
          return a.name.localeCompare(b.name);
      }
    });
  }, [products, searchTerm, selectedCategory, sortBy]);

  // Update URL params when filters change (separate effect)
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (selectedCategory && selectedCategory !== 'all') params.set('category', selectedCategory);
    if (sortBy && sortBy !== 'name') params.set('sort', sortBy);
    setSearchParams(params);
  }, [searchTerm, selectedCategory, sortBy, setSearchParams]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSortBy('name');
    setSearchParams({});
  };

  const retryFetch = () => {
    setLoading(true);
    setError(null);
    // Re-mount effect to trigger a new fetch
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">Our Products</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover authentic flavors from Mithila region. From traditional pickles to crispy snacks, 
            we bring you the finest quality products made with love and tradition.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between mb-6">
            {/* Search Bar - Mobile Only */}
            <div className="w-full lg:hidden">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
            </div>

            {/* Filter Toggle (Mobile) */}
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden"
            >
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filters
            </Button>

            {/* Desktop Filters */}
            <div className={`flex flex-col sm:flex-row gap-4 w-full lg:w-auto ${showFilters ? 'block' : 'hidden lg:flex'}`}>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.slice(1).map((category) => (
                    <SelectItem key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name (A-Z)</SelectItem>
                  <SelectItem value="price-low">Price (Low to High)</SelectItem>
                  <SelectItem value="price-high">Price (High to Low)</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                  <SelectItem value="newest">Newest First</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          </div>

          {/* Active Filters */}
          <div className="flex flex-wrap gap-2">
            {searchTerm && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Search: {searchTerm}
                <button
                  onClick={() => setSearchTerm('')}
                  className="ml-1 hover:text-destructive"
                >
                  ×
                </button>
              </Badge>
            )}
            {selectedCategory && selectedCategory !== 'all' && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Category: {selectedCategory}
                <button
                  onClick={() => setSelectedCategory('all')}
                  className="ml-1 hover:text-destructive"
                >
                  ×
                </button>
              </Badge>
            )}
            {sortBy && sortBy !== 'name' && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Sort: {sortBy.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                <button
                  onClick={() => setSortBy('name')}
                  className="ml-1 hover:text-destructive"
                >
                  ×
                </button>
              </Badge>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="text-center my-8 p-4 bg-destructive/10 rounded-lg">
            <p className="text-destructive mb-2">{error}</p>
            <Button variant="outline" onClick={retryFetch}>
              Retry
            </Button>
          </div>
        )}

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {loading ? (
            // Loading Skeletons
            Array.from({ length: 8 }).map((_, i) => (
              <ProductSkeleton key={i} />
            ))
          ) : filteredProducts.length > 0 ? (
            // Product Cards
            filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))
          ) : (
            // No Products Found
            <div className="col-span-full text-center py-12">
              <h3 className="text-xl font-medium mb-2">No products found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search or filter criteria
              </p>
              <Button onClick={clearFilters}>Clear All Filters</Button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Products;
