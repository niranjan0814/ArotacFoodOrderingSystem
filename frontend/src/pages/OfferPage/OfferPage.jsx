import React, { useState, useEffect } from "react";
import axios from "axios";
import { GrNext, GrPrevious } from "react-icons/gr";
import Modal from "react-modal";
import "./OfferPage.css";
import Navbar from "../../components/Navbar/Navbar";

Modal.setAppElement("#root");

const OfferPage = () => {
  const [offers, setOffers] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [alert, setAlert] = useState({ show: false, message: "", type: "" });


  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/offers");
        setOffers(response.data.offers);
      } catch (error) {
        console.error("Error fetching offers:", error);
        showAlert("Error fetching offers. Please try again.", "error");
      }
    };

    fetchOffers();
  }, []);


  const showAlert = (message, type) => {
    setAlert({ show: true, message, type });
    setTimeout(() => {
      setAlert({ ...alert, show: false });
    }, 3000);
  };


  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % offers.length);
  };


  const handlePrevious = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? offers.length - 1 : prevIndex - 1
    );
  };


  const handleOfferClick = (offer) => {
    setSelectedOffer(offer);
    setIsModalOpen(true);
  };


  const closeModal = () => {
    setIsModalOpen(false);
  };

  if (offers.length === 0) {
    return <div>Loading offers...</div>;
  }

  const currentOffer = offers[currentIndex];

  return (
    <><Navbar /><div className="offer-page">
      <h1>Special Offers</h1>
      
      {alert.show && (
        <div className={`alert ${alert.type}`}>
          {alert.message}
        </div>
      )}

      <div className="slideshow-container">
        <button className="nav-button prev" onClick={handlePrevious}>
          <GrPrevious />
        </button>

        <div className="offer-card" onClick={() => handleOfferClick(currentOffer)}>
          <div className="offer-image-container">
            {currentOffer.image && (
              <img
                src={currentOffer.image}
                alt={currentOffer.name}
                className="offer-image"
              />
            )}
          </div>
          <div className="offer-details">
            <h2>{currentOffer.name}</h2>
            <p>{currentOffer.description}</p>
            {currentOffer.offerType === "combo" && (
              <p>Combo Price: Rs. {currentOffer.comboPrice}</p>
            )}
            {currentOffer.offerType === "delivery" && (
              <p>Discount: {currentOffer.discountValue}%</p>
            )}
            {currentOffer.offerType === "festive" && (
              <p>Festival: {currentOffer.festivalName}</p>
            )}
          </div>
        </div>

        <button className="nav-button next" onClick={handleNext}>
          <GrNext />
        </button>
      </div>

      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        contentLabel="Offer Details"
        className="modal"
        overlayClassName="modal-overlay"
      >
        {selectedOffer && (
          <div className="modal-content">
            <h2>{selectedOffer.name}</h2>
            {selectedOffer.image && (
              <img
                src={selectedOffer.image}
                alt={selectedOffer.name}
                className="modal-image"
              />
            )}
            <p>{selectedOffer.description}</p>

            {selectedOffer.offerType === "combo" && (
              <div>
                <h3>Combo Details</h3>
                <p>Combo Price: Rs. {selectedOffer.comboPrice}</p>
                <p>Savings: Rs. {selectedOffer.savings}</p>
                <div className="combo-items">
                  {selectedOffer.comboItems && selectedOffer.comboItems.map((item, index) => (
                    <div key={index} className="combo-item">
                      {item.image && <img src={item.image} alt={item.name} />}
                      <p>{item.name}</p>
                    </div>
                  ))}
                </div>
                <button className="cta-button">Add Combo to Cart</button>
              </div>
            )}

            {selectedOffer.offerType === "delivery" && (
              <div>
                <h3>Delivery Offer Details</h3>
                <p>Minimum Order Value: Rs. {selectedOffer.minimumOrderAmount}</p>
                <p>Discount: {selectedOffer.discountValue}%</p>
                <button className="cta-button">Shop Now and Save</button>
              </div>
            )}

            {selectedOffer.offerType === "festive" && (
              <div>
                <h3>Festive Offer Details</h3>
                <p>Validity Period: {new Date(selectedOffer.startDate).toLocaleDateString()} - {new Date(selectedOffer.endDate).toLocaleDateString()}</p>
                <p>Applicable Items: {selectedOffer.applicableItems && selectedOffer.applicableItems.join(", ")}</p>
                <button className="cta-button">Shop Now and Save</button>
              </div>
            )}

            <button className="close-button" onClick={closeModal}>
              Close
            </button>
          </div>
        )}
      </Modal>
    </div></>
  );
};

export default OfferPage;