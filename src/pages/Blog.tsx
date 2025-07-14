import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Calendar, User, Clock, ArrowRight } from "lucide-react";
import heroBanner from "@/assets/hero-banner.jpg";
import theKuaImage from "@/assets/thekua-product.jpg";
import picklesImage from "@/assets/pickles-product.jpg";

const Blog = () => {
  const blogPosts = [
    {
      id: 1,
      title: "The Rich History of Thekua: Bihar's Beloved Sweet",
      excerpt: "Discover the centuries-old tradition behind Thekua, the iconic Bihari sweet that has been bringing families together during festivals and special occasions.",
      image: theKuaImage,
      author: "Priya Sharma",
      date: "December 5, 2024",
      readTime: "5 min read",
      category: "Traditional Stories",
      featured: true
    },
    {
      id: 2,
      title: "The Art of Making Traditional Bihari Pickles",
      excerpt: "Learn about the ancient techniques and secret ingredients that make Bihari pickles so special, passed down through generations of home cooks.",
      image: picklesImage,
      author: "Rajesh Kumar",
      date: "December 3, 2024",
      readTime: "7 min read",
      category: "Recipes & Tips"
    },
    {
      id: 3,
      title: "From Our Kitchen to Your Heart: The Mithila Bhog Story",
      excerpt: "Journey with us through three generations of preserving authentic Bihari flavors and bringing traditional snacks to modern homes.",
      image: heroBanner,
      author: "Mithila Bhog Team",
      date: "December 1, 2024",
      readTime: "8 min read",
      category: "Our Story"
    },
    {
      id: 4,
      title: "Health Benefits of Traditional Indian Snacks",
      excerpt: "Explore how our traditional snacks made with natural ingredients offer both taste and nutrition, perfect for modern healthy lifestyles.",
      image: theKuaImage,
      author: "Dr. Anita Singh",
      date: "November 28, 2024",
      readTime: "6 min read",
      category: "Health & Wellness"
    },
    {
      id: 5,
      title: "Festival Celebrations with Mithila Bhog Snacks",
      excerpt: "Discover how our traditional snacks play a perfect role in Indian festivals and family celebrations throughout the year.",
      image: picklesImage,
      author: "Kavya Jha",
      date: "November 25, 2024",
      readTime: "4 min read",
      category: "Culture & Festivals"
    },
    {
      id: 6,
      title: "The Perfect Pairings: What Goes Best with Our Snacks",
      excerpt: "Learn about the best beverages and accompaniments that enhance the flavors of our traditional Bihari snacks.",
      image: heroBanner,
      author: "Chef Vikram",
      date: "November 22, 2024",
      readTime: "5 min read",
      category: "Food Tips"
    }
  ];

  const categories = [
    "All Posts",
    "Traditional Stories", 
    "Recipes & Tips",
    "Our Story",
    "Health & Wellness",
    "Culture & Festivals",
    "Food Tips"
  ];

  const featuredPost = blogPosts.find(post => post.featured);
  const regularPosts = blogPosts.filter(post => !post.featured);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary">Home</Link>
          <span>/</span>
          <span className="text-foreground">Blog</span>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-accent text-accent-foreground px-4 py-2">
            Stories & Traditions
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            The <span className="text-primary">Mithila Bhog</span> Blog
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover the rich heritage, recipes, and stories behind our traditional Bihari snacks. 
            Join us on a journey through taste, tradition, and culture.
          </p>
        </div>

        {/* Categories Filter */}
        <div className="flex flex-wrap gap-2 justify-center mb-8">
          {categories.map((category) => (
            <Button
              key={category}
              variant={category === "All Posts" ? "cta" : "outline"}
              size="sm"
              className="rounded-full"
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Featured Post */}
        {featuredPost && (
          <Card className="mb-12 overflow-hidden border-0 shadow-warm">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
              <div className="aspect-[4/3] lg:aspect-auto overflow-hidden">
                <img
                  src={featuredPost.image}
                  alt={featuredPost.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <CardContent className="p-8 flex flex-col justify-center">
                <Badge className="w-fit mb-4 bg-primary text-primary-foreground">
                  Featured Story
                </Badge>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4 leading-tight">
                  {featuredPost.title}
                </h2>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  {featuredPost.excerpt}
                </p>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-6">
                  <div className="flex items-center space-x-1">
                    <User className="h-4 w-4" />
                    <span>{featuredPost.author}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>{featuredPost.date}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>{featuredPost.readTime}</span>
                  </div>
                </div>
                <Button variant="cta" className="w-fit">
                  Read Full Story
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </div>
          </Card>
        )}

        {/* Blog Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {regularPosts.map((post) => (
            <Card key={post.id} className="group overflow-hidden border-0 shadow-card hover:shadow-warm transition-all duration-300 hover:-translate-y-1">
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <CardContent className="p-6">
                <Badge className="mb-3 text-xs">{post.category}</Badge>
                <h3 className="font-bold text-foreground mb-3 leading-tight group-hover:text-primary transition-colors line-clamp-2">
                  {post.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                  {post.excerpt}
                </p>
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-1">
                      <User className="h-3 w-3" />
                      <span>{post.author}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{post.readTime}</span>
                    </div>
                  </div>
                  <span>{post.date}</span>
                </div>
                <Button variant="ghost" className="w-full p-0 h-auto justify-start text-primary hover:text-primary">
                  Read More
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Newsletter Subscription */}
        <Card className="bg-gradient-warm border-0">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Stay Updated with Our Stories
            </h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Subscribe to our newsletter and never miss a story about traditional flavors, 
              family recipes, and cultural heritage.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email address"
                className="flex-1 px-4 py-3 rounded-lg border border-primary/20 bg-background focus:border-primary/40 focus:outline-none"
              />
              <Button variant="cta" className="sm:px-6">
                Subscribe
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              🎁 Get ₹50 OFF on your first order when you subscribe!
            </p>
          </CardContent>
        </Card>

        {/* Archive Section */}
        <section className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Looking for More Stories?
          </h2>
          <p className="text-muted-foreground mb-6">
            Explore our complete archive of traditional recipes, cultural stories, and food heritage articles.
          </p>
          <Button variant="warm" size="lg">
            View All Blog Posts
          </Button>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Blog;