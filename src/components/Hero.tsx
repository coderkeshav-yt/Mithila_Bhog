import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import heroBanner from "@/assets/hero-banner.jpg";
import FreeShippingBadge from "@/components/FreeShippingBadge";

const Hero = () => {
  return (
    <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroBanner})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/70 to-background/50" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className="max-w-2xl">
          {/* Badge */}
          <Badge className="mb-6 bg-accent text-accent-foreground px-4 py-2 text-sm font-medium shadow-button">
            ✨ Handcrafted Traditional Delights
          </Badge>

          {/* Main Heading */}
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
            Authentic Bihari Delights,{" "}
            <span className="text-primary">Handcrafted</span> with Love
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed">
            Experience the rich flavors of traditional Bihar with our premium collection of 
            Thekua, artisanal Pickles, and crispy Chips made from age-old family recipes.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <Link to="/products">
              <Button variant="cta" size="xl" className="w-full sm:w-auto">
                Shop Now
              </Button>
            </Link>
            <Link to="/our-story">
              <Button variant="warm" size="xl" className="w-full sm:w-auto">
                Explore Our Story
              </Button>
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-accent rounded-full"></div>
              <span>100% Natural Ingredients</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-accent rounded-full"></div>
              <span>Traditional Recipes</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-accent rounded-full"></div>
              <span>Fresh & Handmade</span>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-10 right-10 w-20 h-20 bg-accent/10 rounded-full blur-xl animate-pulse hidden lg:block"></div>
      <div className="absolute bottom-20 left-10 w-32 h-32 bg-primary/10 rounded-full blur-2xl animate-pulse hidden lg:block"></div>
    </section>
  );
};

export default Hero;