import express from 'express';
import Offer from '../models/Offer.js';
import mongoose from 'mongoose';

const router = express.Router();

// Get offer analytics
router.get('/offer-analytics', async (req, res) => {
  try {
    const allOffers = await Offer.find({})
      .populate('comboItems', 'name price imageUrl')
      .lean();

    const now = new Date();
    const activeOffers = allOffers.filter(offer => 
      offer.startDate <= now && offer.endDate >= now
    );
    const expiredOffers = allOffers.filter(offer => offer.endDate < now);
    const upcomingOffers = allOffers.filter(offer => offer.startDate > now);

    // Calculate offer type distribution
    const offerTypeCounts = {
      delivery: allOffers.filter(o => o.offerType === 'delivery').length,
      combo: allOffers.filter(o => o.offerType === 'combo').length,
      festive: allOffers.filter(o => o.offerType === 'festive').length
    };

    // Find max discount
    let maxDiscount = 0;
    let maxDiscountOffer = null;
    allOffers.forEach(offer => {
      let discount = 0;
      if (offer.discountType === 'percentage off') {
        discount = offer.discountValue;
      } else if (offer.discountType === 'fixed amount off') {
        // For fixed amount, we'll consider it as percentage of combo price if combo
        if (offer.offerType === 'combo') {
          const totalOriginalPrice = offer.comboItems.reduce((sum, item) => sum + item.price, 0);
          discount = (offer.discountValue / totalOriginalPrice) * 100;
        } else {
          discount = offer.discountValue;
        }
      }

      if (discount > maxDiscount) {
        maxDiscount = discount;
        maxDiscountOffer = offer;
      }
    });

    // Calculate discount range distribution
    const discountRanges = {
      '0-10%': 0,
      '11-20%': 0,
      '21-30%': 0,
      '31-40%': 0,
      '41-50%': 0,
      '51%+': 0
    };

    allOffers.forEach(offer => {
      let discount = 0;
      if (offer.discountType === 'percentage off') {
        discount = offer.discountValue;
      } else if (offer.discountType === 'fixed amount off' && offer.offerType === 'combo') {
        const totalOriginalPrice = offer.comboItems.reduce((sum, item) => sum + item.price, 0);
        discount = (offer.discountValue / totalOriginalPrice) * 100;
      }

      if (discount <= 10) discountRanges['0-10%']++;
      else if (discount <= 20) discountRanges['11-20%']++;
      else if (discount <= 30) discountRanges['21-30%']++;
      else if (discount <= 40) discountRanges['31-40%']++;
      else if (discount <= 50) discountRanges['41-50%']++;
      else discountRanges['51%+']++;
    });

    // Get offers expiring soon (within 7 days)
    const soonToExpire = allOffers.filter(offer => {
      const daysLeft = Math.ceil((offer.endDate - now) / (1000 * 60 * 60 * 24));
      return daysLeft <= 7 && daysLeft >= 0;
    });

    // Get offers with high discounts (>50%)
    const highDiscountOffers = allOffers.filter(offer => {
      if (offer.discountType === 'percentage off') {
        return offer.discountValue > 50;
      } else if (offer.discountType === 'fixed amount off' && offer.offerType === 'combo') {
        const totalOriginalPrice = offer.comboItems.reduce((sum, item) => sum + item.price, 0);
        return (offer.discountValue / totalOriginalPrice) * 100 > 50;
      }
      return false;
    });

    res.json({
      success: true,
      stats: {
        totalOffers: allOffers.length,
        activeOffers: activeOffers.length,
        expiredOffers: expiredOffers.length,
        upcomingOffers: upcomingOffers.length,
        offerTypes: offerTypeCounts,
        maxDiscount: {
          value: maxDiscount.toFixed(2),
          offer: maxDiscountOffer ? {
            name: maxDiscountOffer.name,
            type: maxDiscountOffer.offerType,
            discountType: maxDiscountOffer.discountType,
            discountValue: maxDiscountOffer.discountValue
          } : null
        }
      },
      discountRanges,
      allOffers,
      activeOffers,
      expiredOffers,
      upcomingOffers,
      soonToExpire,
      highDiscountOffers
    });
    
  } catch (error) {
    console.error('Error fetching offer analytics:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch offer analytics',
      error: error.message 
    });
  }
});

export default router;