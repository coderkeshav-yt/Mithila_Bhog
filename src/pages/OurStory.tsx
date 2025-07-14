import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Leaf, Shield, Award, HeartHandshake, Clock } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";

const OurStory = () => {
  return (
    <div className="bg-background min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-24 bg-gradient-to-r from-primary/10 to-secondary/20">
          <div className="absolute inset-0 bg-[url('/images/bihar-pattern.png')] opacity-5"></div>
          <div className="container mx-auto px-4 text-center relative z-10">
            <Badge className="mb-6 bg-accent text-accent-foreground px-6 py-2.5 text-sm font-medium shadow-button hover:bg-accent/90 transition-colors">
              Since 1995
            </Badge>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight">
              The Soul of <span className="text-primary">Bihar</span> in Every Bite
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
              For over two decades, we've been preserving the culinary heritage of Mithila, one authentic recipe at a time.
            </p>
          </div>
        </section>

        {/* Our Story Section */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="grid lg:grid-cols-2 gap-16 items-center mb-24">
                <div className="order-2 lg:order-1">
                  <h2 className="text-4xl font-bold mb-6">From Our Family Kitchen to Your Home</h2>
                  <div className="space-y-6 text-muted-foreground">
                    <p>
                      In the heart of Mithila, where the Ganges nourishes the land and ancient traditions thrive, 
                      our story began in a small village kitchen. What started as a mother's labor of love to 
                      share her family recipes has blossomed into Mithila Bhog Bazaar - a celebration of Bihari 
                      cuisine's rich tapestry.
                    </p>
                    <p>
                      Our founder, Mrs. Indira Devi, started by preparing traditional snacks for local festivals. 
                      Word of her authentic Thekua and mouth-watering pickles spread like wildfire, and soon, 
                      people were traveling from neighboring villages just for a taste of her creations.
                    </p>
                    <p>
                      Today, while we've grown beyond that humble kitchen, every product we make still carries 
                      the same love, care, and authenticity that made those first batches so special.
                    </p>
                  </div>
                </div>
                <div className="relative order-1 lg:order-2 rounded-2xl overflow-hidden shadow-2xl h-[500px]">
                  <img 
                    src="/images/traditional-cooking.jpg" 
                    alt="Traditional Bihari cooking"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <div className="absolute bottom-0 left-0 p-8 text-white">
                    <p className="text-sm font-medium">Our founder, Mrs. Indira Devi, preparing traditional Bihari sweets</p>
                  </div>
                </div>
              </div>

              {/* The Mithila Legacy */}
              <div className="grid lg:grid-cols-2 gap-16 items-center mb-24">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl h-[500px]">
                  <img 
                    src="/images/mithila-art.jpg" 
                    alt="Mithila art and culture"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                </div>
                <div>
                  <h2 className="text-4xl font-bold mb-6">The Mithila Legacy</h2>
                  <div className="space-y-6 text-muted-foreground">
                    <p>
                      Mithila's culinary heritage is as rich and vibrant as its famous Madhubani paintings. 
                      Our recipes are deeply intertwined with the region's history, culture, and festivals. 
                      Each dish tells a story - of harvest celebrations, wedding feasts, and age-old traditions.
                    </p>
                    <p>
                      We take immense pride in preserving these culinary traditions while adapting them for 
                      modern kitchens. Our products are made using traditional methods that have been 
                      perfected over centuries, ensuring an authentic taste of Mithila in every bite.
                    </p>
                    <p>
                      From the earthy flavors of Sattu to the sweet indulgence of Khaja, our range brings 
                      the diverse flavors of Bihar to your table, no matter where you are in the world.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Our Process Section */}
        <section className="py-20 bg-muted/20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">Our Time-Honored Process</h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Every product is crafted with meticulous attention to detail, just like in traditional Bihari homes.
              </p>
              <Separator className="w-20 h-1 bg-primary mx-auto mt-6" />
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {[
                {
                  icon: <Leaf className="w-10 h-10 text-primary mb-4" />,
                  title: "Sourcing",
                  description: "We work directly with local farmers to source the freshest, highest quality ingredients. Our spices are hand-picked and ground in-house for maximum flavor."
                },
                {
                  icon: <Clock className="w-10 h-10 text-primary mb-4" />,
                  title: "Traditional Methods",
                  description: "Our recipes follow traditional preparation methods, some dating back centuries. Slow cooking and natural fermentation are key to developing authentic flavors."
                },
                {
                  icon: <Shield className="w-10 h-10 text-primary mb-4" />,
                  title: "Quality Control",
                  description: "Every batch undergoes rigorous quality checks to ensure it meets our high standards. We never compromise on quality or authenticity."
                }
              ].map((step, index) => (
                <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all h-full">
                  <CardContent className="p-8 text-center">
                    <div className="flex justify-center mb-4">{step.icon}</div>
                    <h3 className="text-2xl font-semibold mb-4">{step.title}</h3>
                    <p className="text-muted-foreground">{step.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Our Values Section - Expanded */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">Our Guiding Principles</h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                The values that shape everything we do at Mithila Bhog Bazaar
              </p>
              <Separator className="w-20 h-1 bg-primary mx-auto mt-6" />
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {[
                {
                  icon: <Award className="w-8 h-8 text-primary mb-4" />,
                  title: "Authenticity",
                  description: "We stay true to traditional recipes, using the same techniques and ingredients that have been used for generations in Mithila."
                },
                {
                  icon: <CheckCircle className="w-8 h-8 text-primary mb-4" />,
                  title: "Quality",
                  description: "Only the finest, locally-sourced ingredients make it into our products, ensuring every bite is a taste of perfection."
                },
                {
                  icon: <HeartHandshake className="w-8 h-8 text-primary mb-4" />,
                  title: "Community",
                  description: "We're committed to supporting local farmers and artisans, creating sustainable livelihoods while preserving culinary traditions."
                },
                {
                  icon: <Leaf className="w-8 h-8 text-primary mb-4" />,
                  title: "Sustainability",
                  description: "We prioritize eco-friendly practices, from sourcing to packaging, to minimize our environmental impact."
                },
                {
                  icon: <Shield className="w-8 h-8 text-primary mb-4" />,
                  title: "Transparency",
                  description: "We believe you should know exactly what goes into your food. No artificial additives, ever."
                },
                {
                  icon: <Clock className="w-8 h-8 text-primary mb-4" />,
                  title: "Tradition",
                  description: "We honor time-tested methods while innovating to meet modern needs, keeping traditions alive for future generations."
                }
              ].map((item, index) => (
                <div key={index} className="flex flex-col items-center text-center p-8 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors">
                  <div className="bg-primary/10 p-3 rounded-full mb-4">
                    {item.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Community Impact */}
        <section className="py-20 bg-muted/20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-4xl font-bold mb-6">Beyond the Kitchen</h2>
              <p className="text-xl text-muted-foreground mb-12">
                Our commitment extends beyond creating delicious food. We're proud to make a positive impact in our community.
              </p>
              
              <div className="grid md:grid-cols-3 gap-8 mb-16">
                {[
                  { number: "50+", label: "Local Families Supported" },
                  { number: "15+", label: "Traditional Recipes Preserved" },
                  { number: "100%", label: "Natural Ingredients" }
                ].map((stat, index) => (
                  <div key={index} className="bg-background p-6 rounded-xl shadow-md">
                    <div className="text-4xl font-bold text-primary mb-2">{stat.number}</div>
                    <div className="text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>

              <p className="text-lg text-muted-foreground mb-8">
                Through our initiatives, we provide training and employment opportunities to local women, 
                empowering them with skills in traditional food preparation and business management.
              </p>
              
              <Button asChild variant="outline" size="lg" className="mt-4">
                <Link to="/impact">
                  Learn About Our Impact
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
          <div className="container mx-auto px-4 text-center">
            <Badge className="mb-6 bg-accent text-accent-foreground px-6 py-2 text-sm font-medium shadow-button hover:bg-accent/90 transition-colors">
              Join Our Journey
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Experience the Taste of Tradition</h2>
            <p className="text-xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed">
              Discover why food lovers across the country are falling in love with authentic Bihari flavors.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild variant="default" size="lg" className="gap-2">
                <Link to="/products">
                  Explore Our Products
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="gap-2">
                <Link to="/contact">
                  Get in Touch
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default OurStory;
