import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { ArrowLeft } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { useToast } from "@/components/ui/use-toast";

const CheckoutPage = () => {
  const { cart, getCartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const orderId = location.state?.orderId;

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
  const token = localStorage.getItem('token');

  const [formData, setFormData] = useState({
    orderType: 'takeaway',
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    tableNumber: '',
    paymentMethod: 'cash',
  });
  const [formErrors, setFormErrors] = useState({
    phone: '',
    tableNumber: '',
  });
  const [recipes, setRecipes] = useState([]);
  const [recipeLoading, setRecipeLoading] = useState(false);
  const [recipeError, setRecipeError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Utility function to strip Markdown symbols
  const stripMarkdown = (text) => {
    return text
      .replace(/#{1,6}\s*/g, '') // Remove ###, ####, etc.
      .replace(/\*\*/g, '') // Remove bold **
      .replace(/-\s*/g, '') // Remove list dashes
      .replace(/\n{2,}/g, '\n\n') // Normalize multiple newlines
      .replace(/:\s*$/gm, '') // Remove trailing colons after headings
      .trim();
  };

  // Utility function to format recipe text for UI display
  const formatRecipeForUI = (text) => {
    const sections = text.split('\n\n').filter(section => section.trim());
    return sections.map((section, index) => {
      const lines = section.split('\n').filter(line => line.trim());
      if (!lines.length) return null;

      // Check if the first line is a heading (e.g., "Dough:", "Ingredients:")
      const isHeading = lines[0].match(/^[A-Za-z\s]+:/) || lines[0].startsWith('#');
      const headingText = isHeading ? stripMarkdown(lines.shift()) : null;

      // Format the remaining lines as a list or paragraph
      const content = lines.map(line => {
        const cleanLine = stripMarkdown(line).trim();
        return cleanLine ? `  ${cleanLine}` : ''; // Indent non-empty lines
      }).filter(line => line).join('\n');

      return (
        <div key={index} className="mt-2">
          {headingText && (
            <h4 className="text-sm font-semibold text-gray-800">{headingText}</h4>
          )}
          <p className="text-gray-600 whitespace-pre-wrap ml-2">{content}</p>
        </div>
      );
    });
  };

  // Utility function to clean recipe text for PDF
  const cleanRecipeForPDF = (text) => {
    return stripMarkdown(text);
  };
 // Validate phone number (10 digits)
 const validatePhone = (phone) => {
  const phoneRegex = /^\d{10}$/;
  if (!phoneRegex.test(phone)) {
    return 'Phone number must be exactly 10 digits';
  }
  return '';
};
// Validate table number (positive integer between 1 and 20)
const validateTableNumber = (tableNumber) => {
  if (formData.orderType === 'dine-in') {
    const num = parseInt(tableNumber, 10);
    if (!tableNumber || isNaN(num) || num < 1 || num > 20) {
      return 'Table number must be a positive integer between 1 and 20';
    }
  }
  return '';
};
  // Log orderId for debugging
  useEffect(() => {
    console.log('orderId:', orderId);
    if (!orderId) {
      setError('No order found. Please return to cart.');
      setTimeout(() => navigate('/cart'), 3000);
      return;
    }

    const fetchRecipes = async () => {
      setRecipeLoading(true);
      setRecipeError(null);
      try {
        console.log('Fetching recipes from:', `${API_URL}/qwen/recipes`);
        const recipePromises = cart.map(async (item) => {
          const prompt = `Generate a detailed recipe for ${item.name}. Include ingredients and step-by-step instructions. Ingredients: ${item.ingredients?.join(', ') || 'unknown'}.`;
          const response = await axios.post(
            `${API_URL}/qwen/recipes`,
            {
              model: 'qwen-turbo',
              input: { prompt },
            },
            {
              headers: {
                'Content-Type': 'application/json',
              },
            }
          );
          console.log(`Recipe response for ${item.name}:`, response.data);
          return {
            foodName: item.name,
            recipe: response.data.recipe || 'No recipe generated.',
          };
        });
        const results = await Promise.all(recipePromises);
        setRecipes(results);
      } catch (err) {
        const status = err.response?.status;
        let errorMessage = 'Failed to fetch recipes from Qwen AI. Please try again.';
        if (status === 404) {
          errorMessage = 'Recipe generation endpoint not found. Please contact support.';
        } else if (status === 500) {
          errorMessage = 'Internal server error during recipe generation. Please try again later.';
        } else if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        }
        console.error('Recipe fetch error:', status, err.response?.data);
        setRecipeError(errorMessage);
        toast({
          variant: 'destructive',
          title: 'Recipe Error',
          description: errorMessage,
        });
      } finally {
        setRecipeLoading(false);
      }
    };

    if (cart.length > 0) {
      fetchRecipes();
    }
  }, [cart, orderId, navigate, toast]);

  // Generate and download PDF
  const downloadRecipesAsPDF = () => {
    console.log('Generating PDF with recipes:', recipes);
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    const margin = 15;
    const maxWidth = pageWidth - 2 * margin;
    const indent = 5; // Indentation for body text
    let yOffset = margin;

    // Helper function to add text with page break check
    const addText = (text, x, y, fontSize, isBold = false, align = 'left') => {
      if (y + fontSize > pageHeight - margin) {
        doc.addPage();
        yOffset = margin;
      }
      doc.setFont('times', isBold ? 'bold' : 'normal');
      doc.setFontSize(fontSize);
      doc.setTextColor(50, 50, 50); // Dark gray for text
      const lines = doc.splitTextToSize(text, maxWidth - (align === 'left' ? indent : 0));
      lines.forEach((line, index) => {
        if (yOffset + fontSize > pageHeight - margin) {
          doc.addPage();
          yOffset = margin;
        }
        doc.text(line, align === 'center' ? pageWidth / 2 : x, yOffset, { align });
        yOffset += fontSize * 0.5; // Tighter line height
      });
      return yOffset;
    };

    // Helper function to add content border
    const addBorder = () => {
      doc.setDrawColor(150, 150, 150);
      doc.rect(margin - 5, margin - 5, pageWidth - 2 * (margin - 5), pageHeight - 2 * (margin - 5), 'S');
    };

    // Compact header
    yOffset = addText('Recipes for Your Order', margin, yOffset, 18, true, 'center');
    yOffset += 3;
    yOffset = addText(`Order ID: ${orderId}`, margin, yOffset, 10, false, 'center');
    yOffset += 5;

    // Recipes
    recipes.forEach((recipe, index) => {
      // Recipe title
      yOffset = addText(`${recipe.foodName} Recipe`, margin, yOffset, 16, true);
      yOffset += 3;

      // Clean the recipe text for PDF
      const cleanedRecipe = cleanRecipeForPDF(recipe.recipe);

      // Split recipe into sections (Ingredients, Instructions, etc.)
      const sections = cleanedRecipe.split('\n\n').filter(section => section.trim());
      sections.forEach((section, sectionIndex) => {
        const lines = section.split('\n').filter(line => line.trim());
        if (lines.length === 0) return;

        // Section title (e.g., Ingredients, Instructions, Dough, Sauce)
        const sectionTitle = lines[0].match(/^[A-Za-z\s]+/) ? lines.shift().trim() : null;
        if (sectionTitle) {
          yOffset = addText(sectionTitle, margin, yOffset, 12, true);
          yOffset += 2;
        }

        // Section content with indentation
        const content = lines.join('\n');
        yOffset = addText(content, margin + indent, yOffset, 10);
        yOffset += 3;
      });

      // Add new page for next recipe if not the last one
      if (index < recipes.length - 1) {
        doc.addPage();
        yOffset = margin;
      }
    });

    // Add border and page numbers
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      addBorder();
      doc.setFontSize(8);
      doc.setFont('times', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin - 15, pageHeight - 10);
    }

    doc.save(`order_${orderId}_recipes.pdf`);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  
    // Validate fields on change
    if (name === 'phone') {
      setFormErrors((prev) => ({ ...prev, phone: validatePhone(value) }));
    } else if (name === 'tableNumber') {
      setFormErrors((prev) => ({ ...prev, tableNumber: validateTableNumber(value) }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form before submission
    const phoneError = validatePhone(formData.phone);
    const tableNumberError = validateTableNumber(formData.tableNumber);

    setFormErrors({ phone: phoneError, tableNumber: tableNumberError });

    if (phoneError || tableNumberError) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please correct the errors in the form.',
      });
      return;
    }

    setLoading(true);
    setError(null);
    try {
      if (formData.paymentMethod === 'card') {
        // Redirect to payment page for card payments
        navigate('/PaymentPage', { state: { orderId } });
        setLoading(false);
        return;
      }

      const subtotal = getCartTotal();
      const tax = subtotal * 0.1;
      const totalAmount = Number((subtotal + tax).toFixed(2));

      console.log('Subtotal:', subtotal, 'Tax:', tax, 'Total:', totalAmount); // Debug log

      const updatedOrderData = {
        items: cart.map((item) => ({
          food: item._id,
          quantity: item.quantity,
          price: item.price,
          orderType: formData.orderType,
        })),
        totalAmount: totalAmount,
        paymentMethod: formData.paymentMethod,
        guestDetails: user
          ? null
          : {
              name: formData.name,
              phone: formData.phone,
              address: formData.orderType === 'takeaway' ? formData.address : '',
              tableNumber: formData.orderType === 'dine-in' ? formData.tableNumber : '',
            },
      };

      if (formData.orderType === 'takeaway') {
        updatedOrderData.deliveryAddress = formData.address;
      } else if (formData.orderType === 'dine-in') {
        updatedOrderData.deliveryAddress = 'N/A';
        updatedOrderData.tableNumber = formData.tableNumber;
      }

      if (user) {
        updatedOrderData.user = user._id;
      }

      console.log('Sending updatedOrderData:', JSON.stringify(updatedOrderData, null, 2));

      const response = await axios.put(`${API_URL}/orders/${orderId}`, updatedOrderData, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (response.data.success) {
        toast({
          title: 'Order Placed',
          description: 'Your order has been successfully placed.',
        });
        clearCart();
        navigate('/order-success', { state: { orderId } });
      } else {
        setError('Failed to update order: ' + (response.data.message || 'Unknown error'));
        toast({
          variant: 'destructive',
          title: 'Order Failed',
          description: response.data.message || 'An unknown error occurred.',
        });
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to complete checkout. Please try again.';
      console.error('Checkout error:', err.response?.status, err.response?.data);
      setError(errorMessage);
      toast({
        variant: 'destructive',
        title: 'Checkout Error',
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  if (!orderId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-8">Checkout</h1>
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg">
          {error || 'Loading...'}
        </div>
      </div>
    );
  }

  const subtotal = getCartTotal();
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">Checkout</h1>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Order Details and Recipes */}
        <div className="lg:col-span-2">
          {/* Order Details */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-bold mb-4">Order Details</h2>
            {cart.length === 0 ? (
              <p className="text-gray-600">No items in order.</p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {cart.map((item) => (
                  <li key={item._id} className="py-4 flex items-center justify-between">
                    <div className="flex items-center">
                     <img
  src={item.image && item.image !== '' ? item.image : 'https://via.placeholder.com/64?text=Food+Image'}
  alt={item.name || 'Food Item'}
  className="w-16 h-16 object-cover rounded mr-4"
  onError={(e) => {
    console.log(`Image load error for ${item.name || 'Unknown Item'}: ${e.target.src}`);
    e.target.src = 'https://via.placeholder.com/64?text=Food+Image';
  }}
/>
                      <div>
                        <h3 className="font-medium text-gray-800">{item.name}</h3>
                        <p className="text-sm text-gray-500">{item.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <span className="text-gray-800 font-medium">
                        Rs.{item.price .toFixed(2)} x {item.quantity}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="text-gray-800 font-medium">Rs.{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-gray-600">Tax (10%)</span>
                <span className="text-gray-800 font-medium">Rs.{tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between mt-2 font-bold">
                <span>Total</span>
                <span>Rs.{total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Recipes Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-bold mb-4">Recipes for Your Items</h2>
            {recipeLoading ? (
              <p className="text-gray-600">Generating recipes...</p>
            ) : recipeError ? (
              <p className="text-red-600">{recipeError}</p>
            ) : recipes.length === 0 ? (
              <p className="text-gray-600">No recipes available.</p>
            ) : (
              <>
                {recipes.map((recipe, index) => (
                  <div key={index} className="mb-4">
                    <h3 className="text-md font-semibold">{recipe.foodName}</h3>
                    {formatRecipeForUI(recipe.recipe)}
                  </div>
                ))}
                <button
                  onClick={downloadRecipesAsPDF}
                  className="mt-4 py-2 px-4 bg-primary text-white rounded-lg hover:bg-primary/90"
                >
                  Download Recipes as PDF
                </button>
              </>
            )}
          </div>
        </div>

        {/* Checkout Form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-bold mb-4">Customer Information</h2>
            <form onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-medium text-gray-700">Order Type</label>
                <select
                  name="orderType"
                  value={formData.orderType}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="takeaway">Takeaway</option>
                  <option value="dine-in">Dine-in</option>
                </select>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  disabled={!!user}
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2"
                  required
                />
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2"
                  required
                  pattern="\d{10}"
                  title="Phone number must be exactly 10 digits"
                />
                {formErrors.phone && (
                <p className="mt-1 text-sm text-red-600">{formErrors.phone}</p>
                )}
              </div>
              {formData.orderType === 'takeaway' ? (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700">Customer Address (For the safety)</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2"
                    rows="4"
                    required
                  />
                </div>
              ) : (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700">Table Number</label>
                  <input
                    type="text"
                    name="tableNumber"
                    value={formData.tableNumber}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2"
                    required
                    pattern="[1-9]\d*"
                    title="Table number must be a positive integer"
                  />
                  {formErrors.tableNumber && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.tableNumber}</p>
                  )}  
                </div>
              )}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                <select
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={loading || cart.length === 0 || formErrors.phone || formErrors.tableNumber} 
                 className="w-full mt-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Place Order'}
              </button>
            </form>
            <Link
              to="/cart"
              className="inline-flex items-center mt-4 text-primary hover:underline"
            >
              <ArrowLeft className="mr-2" size={16} />
              Back to Cart
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;