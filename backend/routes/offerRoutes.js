import express from "express";
import multer from "multer";
import cloudinary from "cloudinary";
import Offer from "../models/Offer.js";
import dotenv from "dotenv";
import mongoose from "mongoose";

const router = express.Router();
dotenv.config();

// Configure Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Multer for file upload
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Add a new offer with image upload
router.post("/add", upload.single("image"), async (req, res) => {
  try {
    const {
      offerType,
      name,
      description,
      startDate,
      endDate,
      applicable,
      isVisible,
      deliveryOfferType,
      eligibility,
      discountType,
      discountValue,
      minimumOrderAmount,
      comboItems,
      comboPrice,
      festivalName,
    } = req.body;

    console.log("Request Body:", req.body);
    console.log("Request File:", req.file);

    // Upload image to Cloudinary (if provided)
    let imageUrl = "";
    if (req.file) {
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.v2.uploader.upload_stream(
          { folder: "offers", resource_type: "image" },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          }
        );

        uploadStream.end(req.file.buffer);
      });

      imageUrl = result.secure_url;
      console.log("Image uploaded to Cloudinary. URL:", imageUrl); // Debugging
    } else {
      console.log("No image file provided."); // Debugging
    }

    // Create a new offer based on the offerType
    const newOffer = new Offer({
      offerType,
      name, 
      description,
      image: imageUrl, 
      startDate,
      endDate,
      applicable,
      isVisible: isVisible === "true",
      ...(offerType === "delivery" && {
        deliveryOfferType,
        eligibility,
        discountType: discountType === "free delivery" ? "fixed amount off" : discountType, 
        discountValue,
        minimumOrderAmount,
      }),
      ...(offerType === "combo" && {
        comboItems: comboItems ? JSON.parse(comboItems) : [],
        comboPrice,
      }),
      ...(offerType === "festive" && {
        festivalName,
        eligibility,
        discountType,
        discountValue,
        minimumOrderAmount,
      }),
    });

    // Save the offer to the database
    await newOffer.save();
    console.log("Offer saved to the database:", newOffer); // Debugging

    res.status(201).json({ success: true, message: "Offer added successfully!", offer: newOffer });
  } catch (error) {
    console.error("Error adding offer:", error);
    res.status(500).json({ success: false, message: "Failed to add offer.", error: error.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const { search, offerType, isVisible } = req.query;
    const query = {};

    console.log("Query Parameters:", { search, offerType, isVisible });

    if (search) {
      query.name = { $regex: search, $options: "i" }; 
    }

    if (offerType) {
      query.offerType = offerType;
    }

    if (isVisible !== undefined) {
      query.isVisible = isVisible === "true";
    }

    console.log("Final Query:", query);

    const offers = await Offer.find(query).populate("comboItems"); 
    console.log("Offers Fetched:", offers);

    res.status(200).json({ success: true, offers });
  } catch (error) {
    console.error("Error fetching offers:", error);
    res.status(500).json({ success: false, message: "Failed to fetch offers.", error: error.message });
  }
});

// Update offer visibility
router.put("/offers/:id/visibility", async (req, res) => {
  try {
    const { id } = req.params;
    const { isVisible } = req.body;

    const updatedOffer = await Offer.findByIdAndUpdate(id, { isVisible }, { new: true });
    res.status(200).json({ success: true, message: "Offer visibility updated!", offer: updatedOffer });
  } catch (error) {
    console.error("Error updating offer visibility:", error);
    res.status(500).json({ success: false, message: "Failed to update offer visibility.", error: error.message });
  }
});


router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log("Deleting offer with ID:", id); 

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid offer ID." });
    }

    const deletedOffer = await Offer.findByIdAndDelete(id);
    console.log("Deleted Offer:", deletedOffer); 

    if (!deletedOffer) {
      return res.status(404).json({ success: false, message: "Offer not found." });
    }

    res.status(200).json({ success: true, message: "Offer deleted successfully!" });
  } catch (error) {
    console.error("Error deleting offer:", error);
    res.status(500).json({ success: false, message: "Failed to delete offer.", error: error.message });
  }
});

// Update an existing offer
router.put("/:id", upload.single("image"), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      startDate,
      endDate,
      discountType,
      discountValue,
      minimumOrderValue,
      eligibility,
      comboItems,
      comboPrice,
      customizationAllowed,
      availability,
      festivalName,
      themedItems,
      isVisible,
      offerType,
    } = req.body;

    console.log("Request Body:", req.body);
    console.log("Request File:", req.file);

    const existingOffer = await Offer.findById(id);
    if (!existingOffer) {
      return res.status(404).json({ success: false, message: "Offer not found." });
    }

    let imageUrl = existingOffer.imageUrl;
    if (req.file) {
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.v2.uploader.upload_stream(
          { folder: "offers", resource_type: "image" },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          }
        );

        uploadStream.end(req.file.buffer);
      });

      imageUrl = result.secure_url;
    }

    // Update fields only if they are provided and valid
    if (name) existingOffer.name = name;
    if (description) existingOffer.description = description;
    if (startDate) existingOffer.startDate = startDate;
    if (endDate) existingOffer.endDate = endDate;
    if (discountType) existingOffer.discountType = discountType;
    if (discountValue && !isNaN(discountValue)) existingOffer.discountValue = parseFloat(discountValue);
    if (minimumOrderValue && !isNaN(minimumOrderValue)) existingOffer.minimumOrderValue = parseFloat(minimumOrderValue);
    if (eligibility) existingOffer.eligibility = eligibility;
    if (comboItems) existingOffer.comboItems = JSON.parse(comboItems);
    if (comboPrice) existingOffer.comboPrice = comboPrice;
    if (customizationAllowed !== undefined) existingOffer.customizationAllowed = customizationAllowed;
    if (availability) existingOffer.availability = JSON.parse(availability);
    if (festivalName) existingOffer.festivalName = festivalName;
    if (themedItems) existingOffer.themedItems = JSON.parse(themedItems);
    if (isVisible !== undefined) existingOffer.isVisible = isVisible;
    if (offerType) existingOffer.offerType = offerType;
    existingOffer.imageUrl = imageUrl;

    await existingOffer.save();

    res.status(200).json({ success: true, message: "Offer updated successfully!", offer: existingOffer });
  } catch (error) {
    console.error("Error updating offer:", error);
    res.status(500).json({ success: false, message: "Failed to update offer.", error: error.message });
  }
});

// Get a single offer by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid offer ID." });
    }

    const offer = await Offer.findById(id).populate("comboItems");

    if (!offer) {
      return res.status(404).json({ success: false, message: "Offer not found." });
    }

    res.status(200).json({ success: true, offer });
  } catch (error) {
    console.error("Error fetching offer:", error);
    res.status(500).json({ success: false, message: "Failed to fetch offer.", error: error.message });
  }
});

router.get('/check-combo/:itemId', async (req, res) => {
  try {
    const itemId = req.params.itemId;
    
    // Find all combo offers that include this item
    const offers = await Offer.find({
      offerType: 'combo',
      comboItems: itemId,
      endDate: { $gte: new Date() } // Only check active offers
    });

    res.json({ inUse: offers.length > 0 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;