import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import LoadingSpinner from "@/components/LoadingSpinner";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { X, Image as ImageIcon, Trash2, Star, Upload } from "lucide-react";

interface ProductImage {
  id?: string;
  url: string;
  is_primary?: boolean;
}

interface Product {
  id?: string;
  name: string;
  description: string;
  price: number;
  image_url: string; // Keep for backward compatibility
  images?: ProductImage[];
  category: string;
  ingredients: string[];
  weight: string;
  rating: number;
  stock_quantity: number;
  is_bestseller: boolean;
  is_new: boolean;
  is_active: boolean;
}

interface ProductFormProps {
  product?: Product;
  onClose: () => void;
  onSuccess: () => void;
}

const categories = [
  "Traditional Sweets",
  "Pickles & Preserves", 
  "Chips & Snacks",
  "Beverages",
  "Spices & Condiments"
];

const ProductForm = ({ product, onClose, onSuccess }: ProductFormProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Product>({
    name: product?.name || "",
    description: product?.description || "",
    price: product?.price || 0,
    image_url: product?.image_url || "",
    images: product?.images || (product?.image_url ? [{ url: product.image_url, is_primary: true }] : []),
    category: product?.category || "",
    ingredients: product?.ingredients || [],
    weight: product?.weight || "",
    rating: product?.rating || 0,
    stock_quantity: product?.stock_quantity || 0,
    is_bestseller: product?.is_bestseller || false,
    is_new: product?.is_new || false,
    is_active: product?.is_active ?? true,
  });
  const [ingredientInput, setIngredientInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState("");

  const addIngredient = () => {
    if (ingredientInput.trim() && !formData.ingredients.includes(ingredientInput.trim())) {
      setFormData({
        ...formData,
        ingredients: [...formData.ingredients, ingredientInput.trim()]
      });
      setIngredientInput("");
    }
  };

  const removeIngredient = (ingredient: string) => {
    setFormData({
      ...formData,
      ingredients: formData.ingredients.filter(i => i !== ingredient)
    });
  };

  const addImageByUrl = () => {
    if (!imageUrlInput.trim()) return;
    
    const newImage = {
      url: imageUrlInput.trim(),
      is_primary: formData.images?.length === 0
    };

    setFormData({
      ...formData,
      images: [...(formData.images || []), newImage],
      image_url: formData.image_url || newImage.url
    });
    
    setImageUrlInput("");
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    
    try {
      const uploadedImages = await Promise.all(
        Array.from(files).map(async (file) => {
          // In a real app, you would upload the file to your storage service here
          // For now, we'll just create a local URL for the image
          const url = URL.createObjectURL(file);
          return {
            url,
            is_primary: formData.images?.length === 0
          };
        })
      );

      setFormData({
        ...formData,
        images: [...(formData.images || []), ...uploadedImages],
        image_url: formData.image_url || uploadedImages[0]?.url || ""
      });
    } catch (error) {
      console.error('Error uploading images:', error);
      toast({
        title: "Error",
        description: "Failed to upload images. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...(formData.images || [])];
    const removedImage = newImages.splice(index, 1)[0];
    
    setFormData({
      ...formData,
      images: newImages,
      image_url: formData.image_url === removedImage.url 
        ? newImages[0]?.url || "" 
        : formData.image_url
    });
  };

  const setPrimaryImage = (index: number) => {
    const newImages = [...(formData.images || [])];
    if (index < 0 || index >= newImages.length) return;
    
    // Update all images to set is_primary to false
    const updatedImages = newImages.map((img, i) => ({
      ...img,
      is_primary: i === index
    }));
    
    setFormData({
      ...formData,
      images: updatedImages,
      image_url: updatedImages[index]?.url || ""
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.category || !formData.price) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    // Ensure we have at least one image
    if (!formData.images?.length && !formData.image_url) {
      toast({
        title: "Error",
        description: "Please add at least one product image.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // In a real app, you would upload the images to your storage service here
      // and get back the URLs to store in your database
      // For now, we'll just use the existing URLs
      
      // Prepare the product data
      const productData = {
        name: formData.name,
        description: formData.description,
        price: formData.price,
        // For backward compatibility, keep the primary image in image_url
        image_url: formData.images?.find(img => img.is_primary)?.url || formData.image_url,
        // Store all images in the images array
        images: formData.images || (formData.image_url ? [{ url: formData.image_url, is_primary: true }] : []),
        category: formData.category,
        ingredients: formData.ingredients,
        weight: formData.weight,
        rating: formData.rating,
        stock_quantity: formData.stock_quantity,
        is_bestseller: formData.is_bestseller,
        is_new: formData.is_new,
        is_active: formData.is_active,
      };

      if (product?.id) {
        // Update existing product
        const { data, error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', product.id)
          .select();
        
        if (error) throw error;
        
        // In a real app, you would handle the response and update the UI accordingly
        console.log('Updated product:', data);
        
        toast({
          title: "Success",
          description: "Product updated successfully.",
        });
      } else {
        // Create new product
        const { data, error } = await supabase
          .from('products')
          .insert([productData])
          .select();
        
        if (error) throw error;
        
        // In a real app, you would handle the response and update the UI accordingly
        console.log('Created product:', data);
        
        toast({
          title: "Success", 
          description: "Product created successfully.",
        });
      }
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving product:', error);
      toast({
        title: "Error",
        description: "Failed to save product. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              {product ? "Edit Product" : "Add New Product"}
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price (₹) *</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="weight">Weight</Label>
                <Input
                  id="weight"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  placeholder="e.g., 500g"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="stock">Stock Quantity</Label>
                <Input
                  id="stock"
                  type="number"
                  min="0"
                  value={formData.stock_quantity}
                  onChange={(e) => setFormData({ ...formData, stock_quantity: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Product Images</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {/* Image upload button */}
                  <label 
                    className="flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent/10 transition-colors"
                    htmlFor="image-upload"
                  >
                    <div className="flex flex-col items-center justify-center p-4">
                      {uploading ? (
                        <LoadingSpinner size="sm" className="mb-2" />
                      ) : (
                        <Upload className="h-6 w-6 text-muted-foreground mb-2" />
                      )}
                      <span className="text-sm text-muted-foreground text-center">
                        {uploading ? 'Uploading...' : 'Click to upload\nor drag and drop'}
                      </span>
                    </div>
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      multiple
                      onChange={handleImageUpload}
                      disabled={uploading}
                    />
                  </label>

                  {/* Thumbnails */}
                  {formData.images?.map((img, index) => (
                    <div key={index} className="relative group h-32 rounded-lg overflow-hidden border">
                      <img
                        src={img.url}
                        alt={`Product image ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPrimaryImage(index);
                          }}
                          className="p-1.5 rounded-full bg-background/80 hover:bg-background transition-colors"
                          title="Set as primary"
                        >
                          <Star className={`h-4 w-4 ${img.is_primary ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeImage(index);
                          }}
                          className="p-1.5 rounded-full bg-background/80 hover:bg-destructive/90 hover:text-destructive-foreground transition-colors"
                          title="Remove image"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      {img.is_primary && (
                        <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded">
                          Primary
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Add image by URL */}
                <div className="mt-4 space-y-2">
                  <div className="flex gap-2">
                    <Input
                      value={imageUrlInput}
                      onChange={(e) => setImageUrlInput(e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      className="flex-1"
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addImageByUrl())}
                    />
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={addImageByUrl}
                      disabled={!imageUrlInput.trim()}
                    >
                      Add URL
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Enter image URL and press Enter or click Add URL
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="rating">Rating (0-5)</Label>
                <Input
                  id="rating"
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  value={formData.rating}
                  onChange={(e) => setFormData({ ...formData, rating: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Ingredients</Label>
              <div className="flex gap-2">
                <Input
                  value={ingredientInput}
                  onChange={(e) => setIngredientInput(e.target.value)}
                  placeholder="Add an ingredient"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addIngredient();
                    }
                  }}
                />
                <Button type="button" onClick={addIngredient}>
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.ingredients.map((ingredient, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {ingredient}
                    <button
                      type="button"
                      onClick={() => removeIngredient(ingredient)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="bestseller"
                  checked={formData.is_bestseller}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_bestseller: checked })}
                />
                <Label htmlFor="bestseller">Bestseller</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="new"
                  checked={formData.is_new}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_new: checked })}
                />
                <Label htmlFor="new">New Product</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="active">Active</Label>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    {product ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  product ? "Update Product" : "Create Product"
                )}
              </Button>
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductForm;