import express from 'express';
import MenuItem from '../models/MenuItem.js';
import Category from '../models/Category.js';

const router = express.Router();

// Get menu analytics
router.get('/menu-analytics', async (req, res) => {
  try {
    // Get all menu items with necessary fields only
    const allMenuItems = await MenuItem.find({})
      .select('name price category imageUrl recommendedItems isVisible createdAt description')
      .populate('recommendedItems', 'name _id') // Populate both name and _id
      .lean();
    
    // Get all distinct categories from the Category collection
    const categories = await Category.find().distinct("name");
    const categoryCount = categories.length;
    
    // Calculate stats
    const totalItems = allMenuItems.length;
    const visibleItems = allMenuItems.filter(item => item.isVisible).length;
    const hiddenItems = totalItems - visibleItems;
    
    // Properly filter items with recommendations
    const itemsWithRecommendations = allMenuItems.filter(item => 
      item.recommendedItems && item.recommendedItems.length > 0
    );

    // Items without recommendations
    const itemsWithoutRecommendations = allMenuItems.filter(item => 
      !item.recommendedItems || item.recommendedItems.length === 0
    );
    
    // Items without images
    const itemsWithoutImages = allMenuItems.filter(
      item => !item.imageUrl || item.imageUrl === ''
    ).length;
    
    // Category distribution (from menu items)
    const categoryDistribution = {};
    allMenuItems.forEach(item => {
      categoryDistribution[item.category] = (categoryDistribution[item.category] || 0) + 1;
    });
    
    // Price distribution (in Sri Lankan Rupees)
    const priceRanges = {
      '0-100': 0,
      '101-200': 0,
      '201-300': 0,
      '301-400': 0,
      '401-500': 0,
      '501+': 0
    };
    
    allMenuItems.forEach(item => {
      const price = item.price;
      if (price <= 100) priceRanges['0-100']++;
      else if (price <= 200) priceRanges['101-200']++;
      else if (price <= 300) priceRanges['201-300']++;
      else if (price <= 400) priceRanges['301-400']++;
      else if (price <= 500) priceRanges['401-500']++;
      else priceRanges['501+']++;
    });
    
    // Recently added items (last 5)
    const recentlyAdded = allMenuItems
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)
      .map(item => ({
        _id: item._id,
        name: item.name,
        price: item.price,
        imageUrl: item.imageUrl,
        category: item.category,
        createdAt: item.createdAt,
        isVisible: item.isVisible
      }));
    
      res.json({
        success: true,
        stats: {
          totalItems,
          visibleItems,
          hiddenItems,
          categoryCount,
          itemsWithRecommendations: itemsWithRecommendations.length,
          itemsWithoutRecommendations: itemsWithoutRecommendations.length,
          itemsWithoutImages
        },
        categoryDistribution,
        priceDistribution: priceRanges,
        recentlyAdded,
        allItems: allMenuItems,
        itemsWithRecommendations,  // Send the actual filtered items
        itemsWithoutRecommendations  // Send the actual filtered items
      });
    
  } catch (error) {
    console.error('Error fetching menu analytics:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch menu analytics',
      error: error.message 
    });
  }
});

export default router;