import { useState, useEffect, useCallback } from 'react';
import { useSwipeable } from 'react-swipeable';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';

type Testimonial = {
  id: string;
  name: string;
  location: string;
  rating: number;
  comment: string;
  image: string;
  product?: string;
  date?: string;
};

const TestimonialsCarousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  // Mock data - replace with actual API call
  const testimonials: Testimonial[] = [
    {
      id: '1',
      name: "Priya Sharma",
      location: "Patna, Bihar",
      rating: 5,
      comment: "The authentic taste of Mithila in every bite! Ordered the Thekua and Kachori, and they were so fresh and delicious.",
      image: "/images/testimonials/priya.jpg"
    },
    {
      id: '2',
      name: "Rahul Kumar",
      location: "New Delhi",
      rating: 4,
      comment: "Great packaging and fast delivery. The Khaja was crispy and just like how my grandmother used to make it.",
      image: "/images/testimonials/rahul.jpg"
    },
    {
      id: '3',
      name: "Ananya Singh",
      location: "Bangalore",
      rating: 5,
      comment: "Living away from home, I was craving authentic Mithila sweets. Mithila Bhog Bazaar made my day with their fresh and tasty treats!",
      image: "/images/testimonials/ananya.jpg"
    },
    {
      id: '4',
      name: "Vikram Patel",
      location: "Mumbai",
      rating: 5,
      comment: "The quality and taste of the sweets are exceptional. The packaging was secure and the delivery was prompt.",
      image: "/images/testimonials/vikram.jpg"
    },
    {
      id: '5',
      name: "Meera Iyer",
      location: "Chennai",
      rating: 4,
      comment: "Tried the Makhana Kheer and it was divine! The perfect balance of sweetness and texture.",
      image: "/images/testimonials/meera.jpg"
    },
    {
      id: '6',
      name: "Arjun Reddy",
      location: "Hyderabad",
      rating: 5,
      comment: "The Mithai platter was the highlight of our family gathering. Everyone loved the variety and authentic taste.",
      image: "/images/testimonials/arjun.jpg"
    }
  ];

  const slidesToShow = 3;
  const totalSlides = Math.ceil(testimonials.length / slidesToShow) - 1;

  const nextSlide = useCallback(() => {
    if (isLoading || isPaused) return;
    setCurrentSlide(prev => (prev >= totalSlides ? 0 : prev + 1));
  }, [totalSlides, isLoading, isPaused]);

  const prevSlide = useCallback(() => {
    if (isLoading || isPaused) return;
    setCurrentSlide(prev => (prev <= 0 ? totalSlides : prev - 1));
  }, [totalSlides, isLoading, isPaused]);

  const goToSlide = useCallback((index: number) => {
    if (isLoading || isPaused) return;
    setCurrentSlide(index);
  }, [isLoading, isPaused]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') nextSlide();
      if (e.key === 'ArrowLeft') prevSlide();
      if (e.key === 'Escape') setIsPaused(true);
      if (e.key === ' ') setIsPaused(prev => !prev);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextSlide, prevSlide]);

  // Pause when window loses focus
  useEffect(() => {
    const handleBlur = () => setIsPaused(true);
    const handleFocus = () => setIsPaused(false);

    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Auto-advance slides with pause controls
  useEffect(() => {
    if (isLoading || isPaused) return;

    const timer = setInterval(() => {
      nextSlide();
    }, 5000);

    return () => clearInterval(timer);
  }, [currentSlide, isLoading, isPaused, nextSlide]);

  // Calculate visible testimonials
  const visibleTestimonials = testimonials.slice(
    currentSlide * slidesToShow,
    (currentSlide + 1) * slidesToShow
  );

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-4">{error}</p>
        <Button 
          variant="outline" 
          onClick={() => window.location.reload()}
          className="mt-2"
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="relative group" aria-live="polite">
      {/* Navigation Buttons */}
      <button 
        onClick={prevSlide}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 md:-translate-x-4 z-10 w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/90 backdrop-blur-sm shadow-lg flex items-center justify-center text-primary hover:bg-primary/10 transition-all duration-300 opacity-0 group-hover:opacity-100 hover:scale-110 hover:shadow-xl active:scale-95"
        aria-label="Previous testimonial"
      >
        <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
      </button>

      {/* Testimonials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-2 md:px-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-6 h-64 animate-pulse bg-gray-100">
              <div className="h-6 w-3/4 bg-gray-200 rounded mb-4"></div>
              <div className="h-4 w-1/2 bg-gray-200 rounded mb-6"></div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            </Card>
          ))
        ) : (
          visibleTestimonials.map((testimonial) => (
            <Card 
              key={testimonial.id}
              className="p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 hover:shadow-primary/10 border border-transparent hover:border-primary/20 bg-white/50 backdrop-blur-sm"
            >
              <div className="flex items-center gap-4 mb-5">
                <div className="relative">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                    <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
                      {testimonial.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-primary/90 flex items-center justify-center">
                    <Star className="w-3 h-3 text-white fill-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-lg">{testimonial.name}</h4>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <span>{testimonial.location}</span>
                    <span className="text-muted-foreground/50">•</span>
                    <span className="flex items-center gap-1">
                      <span className="font-medium text-amber-500">{testimonial.rating}</span>
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    </span>
                  </p>
                </div>
              </div>
              <div className="relative">
                <div className="absolute -top-3 left-0 text-5xl text-primary/10 font-serif leading-none">"</div>
                <p className="text-muted-foreground/90 pl-4 pt-2 relative z-10">
                  {testimonial.comment}
                </p>
                <div className="absolute -bottom-3 right-0 text-5xl text-primary/10 font-serif leading-none transform rotate-180">"</div>
              </div>
            </Card>
          ))
        )}
      </div>

      <button 
        onClick={nextSlide}
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 md:translate-x-4 z-10 w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/90 backdrop-blur-sm shadow-lg flex items-center justify-center text-primary hover:bg-primary/10 transition-all duration-300 opacity-0 group-hover:opacity-100 hover:scale-110 hover:shadow-xl active:scale-95"
        aria-label="Next testimonial"
      >
        <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
      </button>

      {/* Dots Indicator */}
      <div className="flex flex-col items-center mt-8 space-y-4">
        <button
          onClick={() => setIsPaused(!isPaused)}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          aria-label={isPaused ? 'Play carousel' : 'Pause carousel'}
        >
          {isPaused ? (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          )}
        </button>
        
        <div className="flex justify-center space-x-3">
          {Array.from({ length: totalSlides + 1 }).map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`relative h-1.5 rounded-full transition-all duration-300 ${
                index === currentSlide ? 'bg-primary w-8' : 'bg-gray-200 w-3 hover:bg-gray-300'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            >
              {index === currentSlide && (
                <span className="absolute -top-1 left-0 h-3 w-3 rounded-full bg-primary shadow-sm transform -translate-x-1/2" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TestimonialsCarousel;
