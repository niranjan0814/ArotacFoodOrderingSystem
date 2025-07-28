import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from 'react-toastify';
import { MdDelete } from "react-icons/md";
import ConfirmationPopup from "./ConfirmationPopup";
import "./OffersPage.css";

function ViewOffers() {
  const [offers, setOffers] = useState([]);
  const [filteredOffers, setFilteredOffers] = useState([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [offerToDelete, setOfferToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [offerTypeFilter, setOfferTypeFilter] = useState("all");
  const navigate = useNavigate();

  useEffect(() => {
    fetchOffers();
  }, []);

  useEffect(() => {
    filterOffers();
  }, [offers, searchTerm, offerTypeFilter]);

  const fetchOffers = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/offers");
      setOffers(response.data.offers);
    } catch (error) {
      console.error("Error fetching offers:", error);
      toast.error("Error fetching offers. Please try again.");
    }
  };

  const filterOffers = () => {
    let filtered = offers.filter((offer) => {
      const matchesSearch = offer.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesOfferType = offerTypeFilter === "all" || offer.offerType === offerTypeFilter;
      return matchesSearch && matchesOfferType;
    });
    setFilteredOffers(filtered);
  };

  const handleDeleteClick = (id) => {
    setOfferToDelete(id);
    setShowConfirmation(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      const response = await axios.delete(`http://localhost:5000/api/offers/${offerToDelete}`);
      toast.success(response.data.message);
      fetchOffers();
    } catch (error) {
      console.error("Error deleting offer:", error);
      toast.error("Error deleting offer. Please try again.");
    } finally {
      setShowConfirmation(false);
      setOfferToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowConfirmation(false);
    setOfferToDelete(null);
  };

  const handleEdit = (id) => {
    navigate(`/offers/edit/${id}`);
  };

  return (
    <div className="view-offers-container">
      <h2 className="view-offers-header">All Offers</h2>
      
      <div className="search-and-filter">
        <input
          type="text"
          placeholder="Search by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-bar"
        />
        <select
          value={offerTypeFilter}
          onChange={(e) => setOfferTypeFilter(e.target.value)}
          className="filter-dropdown"
        >
          <option value="all">All Types</option>
          <option value="delivery">Delivery</option>
          <option value="combo">Combo</option>
          <option value="festive">Festive</option>
        </select>
      </div>
      
      <div className="offers-grid">
        {filteredOffers.map((offer) => (
          <div key={offer._id} className="offer-card">
            <div className="offer-image-container">
              <img
                src={offer.image}
                alt={offer.name}
                className="offer-image"
              />
              <MdDelete
                className="delete-icon"
                onClick={() => handleDeleteClick(offer._id)}
              />
            </div>
            <div className="offer-details">
              <h2 className="offer-title"><b>{offer.name}</b></h2>
              <p className="offer-type"><b>Type:</b> {offer.offerType}</p>
              <p className="offer-description">{offer.description}</p>
              <p className="offer-dates">
                <b>Start Date:</b> {new Date(offer.startDate).toLocaleDateString()} |{" "}
                <b>End Date:</b> {new Date(offer.endDate).toLocaleDateString()}
              </p>

              {offer.offerType === "delivery" && (
                <>
                  <p className="offer-discount">
                    <b>Delivery Offer Type:</b> {offer.deliveryOfferType}
                  </p>
                  <p className="offer-discount">
                    <b>Eligibility:</b> {offer.eligibility}
                  </p>
                  <p className="offer-discount">
                    <b>Discount Type:</b> {offer.discountType}
                  </p>
                  <p className="offer-discount">
                    <b>Discount Value:</b> {offer.discountValue}
                  </p>
                  <p className="offer-discount">
                    <b>Minimum Order Amount:</b> {offer.minimumOrderAmount}
                  </p>
                </>
              )}

              {offer.offerType === "combo" && (
                <>
                  <p className="offer-discount">
                    <b>Combo Items:</b>{" "}
                    {offer.comboItems.map((item) => item.name).join(", ")}
                  </p>
                  <p className="offer-discount">
                    <b>Combo Price:</b> {offer.comboPrice}
                  </p>
                </>
              )}

              {offer.offerType === "festive" && (
                <>
                  <p className="offer-discount">
                    <b>Festival Name:</b> {offer.festivalName}
                  </p>
                  <p className="offer-discount">
                    <b>Eligibility:</b> {offer.eligibility}
                  </p>
                  <p className="offer-discount">
                    <b>Discount Type:</b> {offer.discountType}
                  </p>
                  <p className="offer-discount">
                    <b>Discount Value:</b> {offer.discountValue}
                  </p>
                  <p className="offer-discount">
                    <b>Minimum Order Amount:</b> {offer.minimumOrderAmount}
                  </p>
                </>
              )}

              <div className="offer-buttons">
                <button
                  onClick={() => handleEdit(offer._id)}
                  className="edit-button"
                >
                  Edit
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showConfirmation && (
        <ConfirmationPopup
          message="Are you sure you want to delete this offer?"
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
        />
      )}
    </div>
  );
}

export default ViewOffers;