import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import TestimonialsCarousel from "@/components/TestimonialsCarousel";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import ProductCard from "@/components/ProductCard";
import Footer from "@/components/Footer";
import { featuredProducts, bestsellerProducts, newArrivals, categories } from "@/data/products";
import { Star, Clock } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-background">
      <Header />
      <main>
        {/* Hero Section */}
        <Hero />

        {/* Categories Section */}
        <section className="py-16 bg-secondary/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <Badge className="mb-4 bg-accent text-accent-foreground px-4 py-2">
                Shop by Category
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Explore Our <span className="text-primary">Traditional</span> Categories
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Discover authentic Bihari flavors across our carefully curated categories
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {categories.map((category) => (
                <Card key={category.id} className="group cursor-pointer overflow-hidden border-0 shadow-card hover:shadow-warm transition-all duration-300 hover:-translate-y-2">
                  <div className="relative">
                    <div className="aspect-[4/3] overflow-hidden">
                      <img
                        src={category.image}
                        alt={category.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute bottom-6 left-6 right-6 text-white">
                      <h3 className="text-2xl font-bold mb-2">{category.name}</h3>
                      <p className="text-sm opacity-90 mb-3">{category.description}</p>
                      <Badge className="bg-white/20 text-white border-white/30">
                        {category.productCount} Products
                      </Badge>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Products */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <Badge className="mb-4 bg-primary text-primary-foreground px-4 py-2">
                Customer Favorites
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Featured <span className="text-accent">Products</span>
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Handpicked bestsellers and new arrivals that our customers love the most
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} {...product} />
              ))}
            </div>

            <div className="text-center">
              <Button 
                variant="warm" 
                size="lg"
                onClick={() => navigate('/products')}
              >
                View All Products
              </Button>
            </div>
          </div>
        </section>

        {/* Bestsellers Section */}
        <section className="py-16 bg-gradient-warm">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <Badge className="mb-4 bg-accent text-accent-foreground px-4 py-2">
                🏆 Top Rated
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Bestselling <span className="text-primary">Delights</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {bestsellerProducts.map((product) => (
                <ProductCard key={product.id} {...product} />
              ))}
            </div>
          </div>
        </section>

        {/* Our Story Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <Badge className="mb-6 bg-primary text-primary-foreground px-4 py-2">
                Our Heritage
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                Three Generations of <span className="text-accent">Authentic</span> Flavors
              </h2>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Started in 1950 by our grandmother in the heart of Bihar, Mithila Bhog has been preserving 
                the authentic taste of traditional Bihari snacks for over seven decades. Every product is 
                still made using the same time-tested recipes and traditional methods, ensuring that each 
                bite carries the legacy of our rich culinary heritage.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button variant="cta" size="lg">
                  Read Our Full Story
                </Button>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-accent rounded-full"></div>
                    <span>Est. 1950</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-accent rounded-full"></div>
                    <span>70+ Years of Trust</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-accent rounded-full"></div>
                    <span>Family Recipes</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-16 bg-gradient-to-b from-secondary/10 to-background overflow-hidden">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <Badge className="mb-4 bg-accent/20 text-accent-foreground px-4 py-1.5 text-sm font-medium tracking-wide">
                ❤️ Loved by Customers
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                What Our <span className="text-primary">Customers</span> Say
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
                Don't just take our word for it - hear from our growing family of satisfied customers across India
              </p>
            </div>
            <TestimonialsCarousel />
          </div>
        </section>

        {/* Blog Highlights */}
        <section className="py-16 bg-secondary/10">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <Badge className="mb-4 bg-primary/10 text-primary px-4 py-2">
                From Our Blog
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Latest <span className="text-primary">Stories</span> & Recipes
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Discover traditional recipes, cooking tips, and stories from Mithila's rich culinary heritage
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  title: "The Art of Making Perfect Thekua",
                  excerpt: "Learn the traditional method of making this iconic Bihari sweet at home with our step-by-step guide.",
                  category: "Recipe",
                  readTime: "5 min read",
                  image: "/blog/thekua-recipe.jpg"
                },
                {
                  title: "A Journey Through Bihari Cuisine",
                  excerpt: "Explore the rich and diverse flavors of Bihari cuisine and its cultural significance.",
                  category: "Culture",
                  readTime: "8 min read",
                  image: "/blog/bihari-cuisine.jpg"
                },
                {
                  title: "Festive Sweets of Bihar",
                  excerpt: "Discover the traditional sweets that make Bihari festivals so special and how they're made.",
                  category: "Festivals",
                  readTime: "6 min read",
                  image: "/blog/festive-sweets.jpg"
                }
              ].map((post, index) => (
                <Card key={index} className="group overflow-hidden hover:shadow-lg transition-shadow duration-300">
                  <div className="aspect-video bg-muted overflow-hidden">
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                      <span className="text-4xl text-primary/30">{post.category}</span>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                      <span className="px-2 py-1 bg-secondary rounded-full text-xs">{post.category}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {post.readTime}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-muted-foreground mb-4">{post.excerpt}</p>
                    <Button variant="link" className="p-0 h-auto text-primary">
                      Read More →
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center mt-12">
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => navigate('/blog')}
                className="border-primary text-primary hover:bg-primary/5"
              >
                View All Articles
              </Button>
            </div>
          </div>
        </section>

        {/* Newsletter Signup */}
        <section className="py-16 bg-card">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                Stay Connected with <span className="text-primary">Mithila Bhog</span>
              </h2>
              <p className="text-muted-foreground mb-8">
                Get exclusive offers, new product launches, and traditional recipes delivered to your inbox
              </p>
              <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Enter your email address"
                  className="flex-1 px-4 py-3 rounded-lg border border-primary/20 bg-background focus:border-primary/40 focus:outline-none"
                />
                <Button variant="cta" size="lg" className="sm:px-8">
                  Subscribe
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                🎁 Get ₹50 OFF on your first order when you subscribe!
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
