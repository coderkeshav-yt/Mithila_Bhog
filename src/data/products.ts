
// Mock product data for Mithila Bhog
import theKuaImage from "@/assets/thekua-product.jpg";
import picklesImage from "@/assets/pickles-product.jpg";
import chipsImage from "@/assets/chips-product.jpg";

export interface Product {
  id: string;
  name: string;
  image_url: string;
  price: number;
  rating: number;
  category: string;
  is_bestseller?: boolean;
  is_new?: boolean;
  description?: string;
  ingredients?: string[];
  weight?: string;
}

export const products: Product[] = [
  // Thekua Products
  {
    id: "thekua-classic",
    name: "Classic Thekua (Traditional Recipe)",
    image_url: theKuaImage,
    price: 299,
    rating: 5,
    category: "Thekua",
    is_bestseller: true,
    description: "Authentic Bihari Thekua made with pure jaggery, wheat flour, and ghee following our grandmother's 100-year-old recipe.",
    ingredients: ["Wheat Flour", "Jaggery", "Pure Ghee", "Cardamom", "Fennel Seeds"],
    weight: "500g"
  },
  {
    id: "thekua-coconut",
    name: "Coconut Thekua Special",
    image_url: theKuaImage,
    price: 349,
    rating: 4.8,
    category: "Thekua",
    is_new: true,
    description: "Crispy Thekua enriched with fresh coconut and aromatic spices for an enhanced traditional taste.",
    ingredients: ["Wheat Flour", "Fresh Coconut", "Jaggery", "Pure Ghee", "Cardamom"],
    weight: "450g"
  },
  {
    id: "thekua-mini",
    name: "Mini Thekua Bites",
    image_url: theKuaImage,
    price: 199,
    rating: 4.6,
    category: "Thekua",
    description: "Perfect bite-sized Thekua for kids and snacking, same authentic taste in smaller portions.",
    ingredients: ["Wheat Flour", "Jaggery", "Pure Ghee", "Cardamom"],
    weight: "350g"
  },

  // Pickles
  {
    id: "mango-pickle",
    name: "Authentic Mango Pickle (Aam Ka Achaar)",
    image_url: picklesImage,
    price: 249,
    rating: 4.9,
    category: "Pickles",
    is_bestseller: true,
    description: "Traditional Bihari mango pickle with the perfect blend of spices, oil, and tender mango pieces.",
    ingredients: ["Raw Mango", "Mustard Oil", "Red Chili", "Turmeric", "Fenugreek", "Mustard Seeds"],
    weight: "400g"
  },
  {
    id: "mixed-pickle",
    name: "Mixed Vegetable Pickle",
    image_url: picklesImage,
    price: 199,
    rating: 4.7,
    category: "Pickles",
    description: "A delightful mix of seasonal vegetables pickled in traditional Bihari style with aromatic spices.",
    ingredients: ["Mixed Vegetables", "Mustard Oil", "Spices", "Salt", "Turmeric"],
    weight: "350g"
  },
  {
    id: "lemon-pickle",
    name: "Spicy Lemon Pickle",
    image_url: picklesImage,
    price: 179,
    rating: 4.5,
    category: "Pickles",
    is_new: true,
    description: "Zesty lemon pickle with a perfect balance of tangy and spicy flavors that complement any meal.",
    ingredients: ["Fresh Lemons", "Red Chili Powder", "Turmeric", "Salt", "Mustard Oil"],
    weight: "300g"
  },

  // Chips
  {
    id: "banana-chips",
    name: "Crispy Banana Chips",
    image_url: chipsImage,
    price: 149,
    rating: 4.4,
    category: "Chips",
    description: "Golden, crispy banana chips made from fresh Kerala bananas, lightly salted for the perfect crunch.",
    ingredients: ["Fresh Bananas", "Coconut Oil", "Salt"],
    weight: "200g"
  },
  {
    id: "potato-chips-masala",
    name: "Spiced Potato Chips",
    image_url: chipsImage,
    price: 99,
    rating: 4.3,
    category: "Chips",
    is_bestseller: true,
    description: "Homestyle potato chips seasoned with traditional Indian spices for an authentic snacking experience.",
    ingredients: ["Potatoes", "Sunflower Oil", "Spice Mix", "Salt", "Chaat Masala"],
    weight: "150g"
  },
  {
    id: "namak-para",
    name: "Traditional Namak Para",
    image_url: chipsImage,
    price: 119,
    rating: 4.6,
    category: "Chips",
    description: "Classic diamond-shaped savory snack, perfectly spiced and crispy, ideal for tea-time munching.",
    ingredients: ["All-purpose Flour", "Oil", "Carom Seeds", "Salt", "Black Pepper"],
    weight: "180g"
  }
];

export const categories = [
  {
    id: "thekua",
    name: "Thekua",
    description: "Traditional wheat-based sweet treats",
    image: theKuaImage,
    productCount: 12
  },
  {
    id: "pickles", 
    name: "Pickles",
    description: "Authentic homemade pickles",
    image: picklesImage,
    productCount: 8
  },
  {
    id: "chips",
    name: "Chips & Snacks",
    description: "Crispy and crunchy delights",
    image: chipsImage,
    productCount: 15
  }
];

export const featuredProducts = products.filter(p => p.is_bestseller || p.is_new).slice(0, 6);
export const bestsellerProducts = products.filter(p => p.is_bestseller);
export const newArrivals = products.filter(p => p.is_new);
