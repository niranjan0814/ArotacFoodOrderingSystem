import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { ArrowRight } from 'lucide-react';

const Index = () => {
  const { setOrderType } = useCart();
  
  const handleOrderType = (type) => {
    setOrderType(type);
  };
  
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative h-[500px] flex items-center">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&h=500&q=80" 
            alt="Food background" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black opacity-50"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl text-white">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Delicious Food Delivered To Your Door</h1>
            <p className="text-xl md:text-2xl mb-8">Order your favorite meals online and have them delivered in minutes</p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                to="/menu" 
                onClick={() => handleOrderType('delivery')}
                className="bg-primary hover:bg-primary/90 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center"
              >
                Order for Delivery
                <ArrowRight className="ml-2" size={18} />
              </Link>
              
              <Link 
                to="/menu" 
                onClick={() => handleOrderType('takeaway')}
                className="bg-white hover:bg-gray-100 text-gray-900 font-bold py-3 px-6 rounded-lg flex items-center justify-center"
              >
                Order for Takeaway
                <ArrowRight className="ml-2" size={18} />
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Features Section */}
      <div className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose AROTAC?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Fast Delivery</h3>
              <p className="text-gray-600">Your food delivered in 30 minutes or less, guaranteed.</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Quality Food</h3>
              <p className="text-gray-600">Fresh ingredients and meals prepared by top chefs.</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Best Prices</h3>
              <p className="text-gray-600">Affordable meals with no hidden charges.</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Popular Categories */}
      <div className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Popular Categories</h2>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {['Burgers', 'Pizza', 'Pasta', 'Desserts', 'Drinks', 'Salads'].map((category, index) => (
              <Link 
                key={index} 
                to={`/menu?category=${category.toLowerCase()}`}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="h-32 bg-gray-200"></div>
                <div className="p-4 text-center">
                  <h3 className="font-medium">{category}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
      
      {/* Call to Action */}
      <div className="bg-primary py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">Ready to Order?</h2>
          <p className="text-white text-xl mb-8 max-w-2xl mx-auto">
            Browse our menu and order your favorite meals with just a few clicks.
          </p>
          <Link 
            to="/menu" 
            className="inline-block bg-white hover:bg-gray-100 text-primary font-bold py-3 px-8 rounded-lg"
          >
            Order Now
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Index;