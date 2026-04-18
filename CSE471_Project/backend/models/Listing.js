import mongoose from "mongoose";

const ListingSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    location: { type: String, required: true },
    listingType: {
      type: String,
      enum: ["Apartment", "Commercial", "Shop", "Office"],
      default: "Apartment",
    },
    price: { type: Number, required: true },
    size: { type: Number, required: true },
    bedrooms: { type: Number, default: 0 },
    bathrooms: { type: Number, default: 0 },
    contactPhone: { type: String, default: null },
    contactEmail: { type: String, default: null },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: {
      type: String,
      enum: ["Available", "Rented", "Pending"],
      default: "Available",
    },
  },
  { timestamps: true }
);

const Listing = mongoose.models.Listing || mongoose.model('Listing', ListingSchema);
export default Listing;