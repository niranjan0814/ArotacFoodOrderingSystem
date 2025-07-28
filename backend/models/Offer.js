import mongoose from "mongoose";
import MenuItem from "./MenuItem.js";

const offerSchema = new mongoose.Schema({
  // Common Fields (Applicable to All Offers)
  offerType: {
    type: String,
    required: [true, "Offer type is required"],
    enum: {
      values: ["delivery", "combo", "festive"],
      message: "Offer type must be 'delivery', 'combo', or 'festive'",
    },
  },
  name: {
    type: String,
    required: [true, "Name is required"],
  },
  description: {
    type: String,
    required: [true, "Description is required"],
  },
  image: {
    type: String,
    required: [true, "Image URL is required"],
  },
  startDate: {
    type: Date,
    required: [true, "Start date is required"],
  },
  endDate: {
    type: Date,
    required: [true, "End date is required"],
  },
  applicable: {
    type: String,
    required: [true, "Applicable field is required"],
    enum: {
      values: ["home", "in-shop", "takeaway", "all"],
      message: "Applicable must be 'home', 'in-shop', 'takeaway', or 'all'",
    },
  },
  isVisible: {
    type: Boolean,
    default: true,
  },

  // Delivery Offers (Only for offerType = "delivery")
  deliveryOfferType: {
    type: String,
    enum: {
      values: ["free delivery", "discount off", "percentage off"],
      message: "Delivery offer type must be 'free delivery', 'discount off', or 'percentage off'",
    },
    required: function () {
      return this.offerType === "delivery";
    },
  },
  eligibility: {
    type: String,
    enum: {
      values: ["order more than", "first order"],
      message: "Eligibility must be 'order more than' or 'first order'",
    },
    required: function () {
      return this.offerType === "delivery";
    },
  },
  discountType: {
    type: String,
    enum: {
      values: ["percentage off", "fixed amount off"],
      message: "Discount type must be 'percentage off' or 'fixed amount off'",
    },
    required: function () {
      return this.offerType === "delivery";
    },
  },
  discountValue: {
    type: Number,
    required: function () {
      return this.offerType === "delivery";
    },
    min: [0, "Discount value cannot be negative"],
  },
  minimumOrderAmount: {
    type: Number,
    required: function () {
      return this.offerType === "delivery";
    },
    min: [0, "Minimum order amount cannot be negative"],
  },

  // Combo Offers (Only for offerType = "combo")
  comboItems: {
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: "MenuItem" }],
    required: function () {
      return this.offerType === "combo"; // Only required for combo offers
    },
    validate: {
      validator: function (items) {
        if (this.offerType === "combo") {
          return items.length > 0; // Ensure at least one combo item is provided for combo offers
        }
        return true; // Skip validation for non-combo offers
      },
      message: "At least one combo item is required for combo offers",
    },
  },
  comboPrice: {
    type: Number,
    required: function () {
      return this.offerType === "combo";
    },
    min: [0, "Combo price cannot be negative"],
  },

  // Festive Offers (Only for offerType = "festive")
  festivalName: {
    type: String,
    required: function () {
      return this.offerType === "festive";
    },
  },
  eligibility: {
    type: String,
    enum: {
      values: ["order more than"],
      message: "Eligibility must be 'order more than'",
    },
    required: function () {
      return this.offerType === "festive";
    },
  },
  discountType: {
    type: String,
    enum: {
      values: ["percentage off", "fixed amount off"],
      message: "Discount type must be 'percentage off' or 'fixed amount off'",
    },
    required: function () {
      return this.offerType === "festive";
    },
  },
  discountValue: {
    type: Number,
    required: function () {
      return this.offerType === "festive";
    },
    min: [0, "Discount value cannot be negative"],
  },
  minimumOrderAmount: {
    type: Number,
    required: function () {
      return this.offerType === "festive";
    },
    min: [0, "Minimum order amount cannot be negative"],
  },
});

// Pre-save middleware for additional validation
offerSchema.pre("save", function (next) {
  if (this.startDate > this.endDate) {
    throw new Error("Start date cannot be after end date");
  }

  if (this.offerType === "delivery" && this.applicable !== "home") {
    throw new Error("Delivery offers must have applicable set to 'home'");
  }

  next();
});

const Offer = mongoose.model("Offer", offerSchema);

export default Offer;