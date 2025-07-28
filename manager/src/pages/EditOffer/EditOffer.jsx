import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import Select from "react-select";
import { toast } from 'react-toastify';
import styled from '@emotion/styled';
import { FiUpload, FiPlus, FiX, FiCheck, FiCalendar, FiTag, FiShoppingCart, FiGift, FiEdit2 } from 'react-icons/fi';
import {FiArrowLeft } from 'react-icons/fi';


const FormContainer = styled.div`
  width: 1000px; /* Fixed width in pixels */
  margin: 5rem 5rem auto; /* Centered horizontally */
  padding: 3rem;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  overflow: hidden; /* Prevents content from affecting container size */

  /* Optional: Add a max-width for smaller screens */
  @media (max-width: 1300px) {
    width: 90%;
    margin: 3rem auto;
    padding: 2rem;
  }
`;

const BackButton = styled.button`
  position: absolute;
  left: 20rem;
  top: 2rem;
  padding: 0.5rem 1rem;
  background-color: #f8fafc;
  color:rgb(82, 134, 224);
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &:hover {
    background-color: #edf2f7;
    border-color: #cbd5e0;
  }
`;

const FormHeader = styled.h2`
  font-size: 1.8rem;
  font-weight: 700;
  color: #2d3748;
  margin-bottom: 2rem;
  text-align: center;
  position: relative;
  padding-bottom: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 30%;
    right: 30%;
    height: 3px;
    background: linear-gradient(90deg, #c19755, #f3e9d2);
    border-radius: 3px;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const FormLabel = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
  font-weight: 600;
  color: #4a5568;
`;

const FormInput = styled.input`
  width: 100%;
  padding: 0.8rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.95rem;
  transition: all 0.2s ease;
  background-color: #f8fafc;

  &:focus {
    outline: none;
    border-color: #c19755;
    box-shadow: 0 0 0 2px rgba(193, 151, 85, 0.2);
    background-color: white;
  }

  &[type="date"] {
    &::-webkit-calendar-picker-indicator {
      color: #c19755;
    }
  }

  &.error {
    border-color: #e53e3e;
    box-shadow: 0 0 0 2px rgba(229, 62, 62, 0.2);
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 0.8rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.95rem;
  transition: all 0.2s ease;
  min-height: 100px;
  resize: vertical;
  background-color: #f8fafc;

  &:focus {
    outline: none;
    border-color: #c19755;
    box-shadow: 0 0 0 2px rgba(193, 151, 85, 0.2);
    background-color: white;
  }

  &.error {
    border-color: #e53e3e;
    box-shadow: 0 0 0 2px rgba(229, 62, 62, 0.2);
  }
`;

const SelectContainer = styled.div`
  .react-select__control {
    min-height: 44px;
    border-color: #e2e8f0;
    border-radius: 8px;
    background-color: #f8fafc;
    transition: all 0.2s ease;

    &:hover {
      border-color: #cbd5e0;
    }

    &--is-focused {
      border-color: #c19755;
      box-shadow: 0 0 0 2px rgba(193, 151, 85, 0.2);
    }

    &.error {
      border-color: #e53e3e;
      box-shadow: 0 0 0 2px rgba(229, 62, 62, 0.2);
    }
  }

  .react-select__option {
    &--is-selected {
      background-color: #c19755;
    }
    &--is-focused {
      background-color: #f0f4f8;
    }
  }

  .react-select__multi-value {
    background-color: #f0f4f8;
    border-radius: 4px;
  }

  .react-select__multi-value__label {
    color: #2d3748;
  }

  .react-select__multi-value__remove {
    &:hover {
      background-color: #e53e3e;
      color: white;
    }
  }
`;

const FileUploadContainer = styled.div`
  border: 2px dashed #e2e8f0;
  border-radius: 8px;
  padding: 1.5rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  background-color: #f8fafc;

  &:hover {
    border-color: #c19755;
    background-color: #f0f4f8;
  }
`;

const FileUploadLabel = styled.label`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
`;

const FileUploadIcon = styled.div`
  font-size: 1.5rem;
  color: #c19755;
`;

const FileTypeInfo = styled.div`
  font-size: 0.75rem;
  color: #718096;
  margin-top: 0.5rem;
  text-align: center;
`;

const FileSizeInfo = styled.div`
  font-size: 0.8rem;
  color: #4a5568;
  margin-top: 0.5rem;
`;

const CurrentImage = styled.div`
  margin-top: 0.5rem;
  font-size: 0.9rem;
  color: #4a5568;
  
  a {
    color: #c19755;
    text-decoration: none;
    font-weight: 500;
    
    &:hover {
      text-decoration: underline;
    }
  }
`;

const ComboPriceInfo = styled.div`
  margin-top: 0.5rem;
  font-size: 0.9rem;
  color: #4a5568;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ComboSavings = styled.span`
  color: #38a169;
  font-weight: 600;
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, #c19755, #d8b56c);
  color: white;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  &:hover {
    background: linear-gradient(135deg, #b38a4a, #c19755);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(193, 151, 85, 0.3);
  }

  &:disabled {
    background: #e2e8f0;
    color: #a0aec0;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const ErrorMessage = styled.div`
  color: #e53e3e;
  font-size: 0.8rem;
  margin-top: 0.3rem;
`;

const OfferTypeBadge = styled.div`
  display: inline-block;
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  margin-bottom: 1rem;
  background-color: ${props => 
    props.type === 'delivery' ? '#ebf8ff' : 
    props.type === 'combo' ? '#f0fff4' : '#fff5f5'};
  color: ${props => 
    props.type === 'delivery' ? '#3182ce' : 
    props.type === 'combo' ? '#38a169' : '#e53e3e'};
`;

const customSelectStyles = {
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected ? '#c19755' : state.isFocused ? '#f0f4f8' : 'white',
    color: state.isSelected ? 'white' : '#2d3748'
  })
};

function EditOffer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [validationErrors, setValidationErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const [formData, setFormData] = useState({
    offerType: "delivery",
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    applicable: "home",
    isVisible: true,
    deliveryOfferType: "",
    eligibility: "",
    discountType: "",
    discountValue: "",
    minimumOrderAmount: "",
    comboItems: [],
    comboPrice: "",
    festivalName: "",
    image: null,
    currentImageUrl: ""
  });
  const [totalComboPrice, setTotalComboPrice] = useState(0);
  const [fileSize, setFileSize] = useState("");

  useEffect(() => {
    fetchOffer();
  }, [id]);

  const fetchOffer = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/offers/${id}`);
      const offer = response.data.offer;

      setFormData({
        ...formData,
        offerType: offer.offerType,
        name: offer.name,
        description: offer.description,
        startDate: offer.startDate.split("T")[0],
        endDate: offer.endDate.split("T")[0],
        applicable: offer.applicable || (offer.offerType === "delivery" ? "home" : "all"),
        isVisible: offer.isVisible,
        deliveryOfferType: offer.deliveryOfferType,
        eligibility: offer.eligibility,
        discountType: offer.discountType,
        discountValue: offer.discountValue,
        minimumOrderAmount: offer.minimumOrderAmount,
        comboItems: offer.comboItems || [],
        comboPrice: offer.comboPrice,
        festivalName: offer.festivalName,
        image: null,
        currentImageUrl: offer.image
      });

      await fetchMenuItems(offer.comboItems);
    } catch (error) {
      console.error("Error fetching offer:", error);
      toast.error("Error fetching offer. Please try again.");
    }
  };

  const validateField = (name, value) => {
    let error = "";
    switch (name) {
      case "name":
        if (!value) error = "Name is required";
        else if (value.length > 50) error = "Name cannot exceed 50 characters";
        break;
      case "description":
        if (!value) error = "Description is required";
        else if (value.length > 150) error = "Description cannot exceed 150 characters";
        break;
      case "startDate":
        if (!value) error = "Start Date is required";
        else if (new Date(value) < new Date().setHours(0, 0, 0, 0)) {
          error = "Start Date must be today or later";
        }
        break;
      case "endDate":
        if (!value) error = "End Date is required";
        else if (formData.startDate && new Date(value) < new Date(formData.startDate)) {
          error = "End Date must be after Start Date";
        }
        break;
      case "discountValue":
        if (formData.discountType) {
          if (formData.discountType === "percentage off" && parseFloat(value) > 100) {
            error = "Discount value must be ≤ 100%";
          } else if (parseFloat(value) <= 0) {
            error = "Discount value must be > 0";
          }
        }
        break;
      case "comboPrice":
        if (formData.offerType === "combo" && parseFloat(value) <= 0) {
          error = "Combo price must be > 0";
        }
        break;
      default:
        break;
    }
    return error;
  };

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    // Validate the field
    const error = validateField(name, value);
    setValidationErrors({ ...validationErrors, [name]: error });

    if (type === "file") {
      const file = files[0];
      if (file) {
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
        setFileSize(`File size: ${fileSizeMB} MB`);
        if (file.size > 5 * 1024 * 1024) {
          toast.error("File size must be less than 5MB");
          return;
        }
        if (!["image/jpeg", "image/png"].includes(file.type)) {
          toast.error("Only JPG and PNG files are allowed");
          return;
        }
      }
      setFormData({ ...formData, [name]: file });
    } else {
      setFormData((prevFormData) => ({
        ...prevFormData,
        [name]: type === "checkbox" ? checked : value,
      }));

      // Revalidate discountValue if discountType changes
      if (name === "discountType") {
        const discountValueError = validateField("discountValue", formData.discountValue);
        setValidationErrors((prevErrors) => ({
          ...prevErrors,
          discountValue: discountValueError,
        }));
      }
    }
  };

  const fetchMenuItems = async (comboItems) => {
    try {
      // Fetch all menu items
      const response = await axios.get("http://localhost:5000/api/menu");
      const fetchedMenuItems = response.data.map((item) => ({
        value: item._id,
        label: item.name,
        price: item.price,
      }));

      // Calculate total price for existing combo items
      const totalPrice = comboItems.reduce((sum, item) => {
        const menuItem = fetchedMenuItems.find(mi => mi.value === (item._id || item));
        return sum + (menuItem?.price || 0);
      }, 0);
      setTotalComboPrice(totalPrice);

      setMenuItems(fetchedMenuItems);
    } catch (error) {
      console.error("Error fetching menu items:", error);
      toast.error("Error fetching menu items.");
    }
  };

  const handleComboItemsChange = (selectedOptions) => {
    const comboItems = selectedOptions ? selectedOptions.map((option) => option.value) : [];
    const totalPrice = selectedOptions
      ? selectedOptions.reduce((sum, option) => sum + option.price, 0)
      : 0;
    setTotalComboPrice(totalPrice);
    setFormData({ ...formData, comboItems });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
  
    const data = new FormData();
    data.append("offerType", formData.offerType);
    data.append("name", formData.name);
    data.append("description", formData.description);
    data.append("startDate", formData.startDate);
    data.append("endDate", formData.endDate);
    data.append("applicable", formData.applicable);
    data.append("isVisible", formData.isVisible);
    if (formData.image) {
      data.append("image", formData.image);
    }
  
    if (formData.offerType === "delivery") {
      data.append("deliveryOfferType", formData.deliveryOfferType);
      data.append("eligibility", formData.eligibility);
      data.append("discountType", formData.discountType);
      data.append("discountValue", formData.discountValue);
      data.append("minimumOrderAmount", formData.minimumOrderAmount);
    } else if (formData.offerType === "combo") {
      data.append("comboItems", JSON.stringify(formData.comboItems));
      data.append("comboPrice", formData.comboPrice);
    } else if (formData.offerType === "festive") {
      data.append("festivalName", formData.festivalName);
      data.append("eligibility", formData.eligibility);
      data.append("discountType", formData.discountType);
      data.append("discountValue", formData.discountValue);
      data.append("minimumOrderAmount", formData.minimumOrderAmount);
    }
  
    try {
      const response = await axios.put(`http://localhost:5000/api/offers/${id}`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
  
      toast.success("Offer updated successfully!");
      setTimeout(() => {
        navigate("/offers/view");
      }, 1500);
    } catch (error) {
      console.error("Error updating offer:", error);
      toast.error(error.response?.data?.message || "Error updating offer. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const comboDiscount = totalComboPrice - parseFloat(formData.comboPrice || 0);
  const comboDiscountPercentage = totalComboPrice > 0 
    ? Math.round((comboDiscount / totalComboPrice) * 100) 
    : 0;

  return (
    <FormContainer>
      <BackButton onClick={() => navigate('/offers/view')}>
                           <FiArrowLeft /> Back to Offers
                         </BackButton>
      <FormHeader>
        <FiEdit2 /> Edit Offer
      </FormHeader>

      <OfferTypeBadge type={formData.offerType}>
        {formData.offerType === 'delivery' ? 'Delivery Offer' : 
         formData.offerType === 'combo' ? 'Combo Offer' : 'Festive Offer'}
      </OfferTypeBadge>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <FormGroup>
            <FormLabel>Name</FormLabel>
            <FormInput
              type="text"
              name="name"
              placeholder="e.g. Weekend Special"
              value={formData.name}
              onChange={handleChange}
              onBlur={(e) => {
                const error = validateField(e.target.name, e.target.value);
                setValidationErrors({ ...validationErrors, [e.target.name]: error });
              }}
              className={validationErrors.name ? "error" : ""}
              required
            />
            {validationErrors.name && <ErrorMessage>{validationErrors.name}</ErrorMessage>}
          </FormGroup>

          <FormGroup>
  <FormLabel>Applicable To</FormLabel>
  <FormInput
    as="select"
    name="applicable"
    value={formData.offerType === "delivery" ? "home" : formData.applicable}
    onChange={handleChange}
    disabled={formData.offerType === "delivery"}
    required
  >
    <option value="home">Home Delivery</option>
    {formData.offerType !== "delivery" && (
      <>
        <option value="in-shop">In-Shop</option>
        <option value="takeaway">Takeaway</option>
        <option value="all">All Channels</option>
      </>
    )}
  </FormInput>
  {formData.offerType === "delivery" && (
    <div style={{ fontSize: '0.8rem', color: '#718096', marginTop: '0.3rem' }}>
      Delivery offers are only applicable to home delivery orders
    </div>
  )}
</FormGroup>
        </div>

        <FormGroup>
          <FormLabel>Description</FormLabel>
          <TextArea
            name="description"
            placeholder="Describe the offer details"
            value={formData.description}
            onChange={handleChange}
            onBlur={(e) => {
              const error = validateField(e.target.name, e.target.value);
              setValidationErrors({ ...validationErrors, [e.target.name]: error });
            }}
            className={validationErrors.description ? "error" : ""}
            required
          />
          {validationErrors.description && <ErrorMessage>{validationErrors.description}</ErrorMessage>}
        </FormGroup>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <FormGroup>
            <FormLabel>Start Date</FormLabel>
            <FormInput
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              onBlur={(e) => {
                const error = validateField(e.target.name, e.target.value);
                setValidationErrors({ ...validationErrors, [e.target.name]: error });
              }}
              className={validationErrors.startDate ? "error" : ""}
              required
            />
            {validationErrors.startDate && <ErrorMessage>{validationErrors.startDate}</ErrorMessage>}
          </FormGroup>

          <FormGroup>
            <FormLabel>End Date</FormLabel>
            <FormInput
              type="date"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              onBlur={(e) => {
                const error = validateField(e.target.name, e.target.value);
                setValidationErrors({ ...validationErrors, [e.target.name]: error });
              }}
              className={validationErrors.endDate ? "error" : ""}
              required
            />
            {validationErrors.endDate && <ErrorMessage>{validationErrors.endDate}</ErrorMessage>}
          </FormGroup>
        </div>

        <FormGroup>
          <FormLabel>Offer Image</FormLabel>
          {formData.currentImageUrl && (
            <CurrentImage>
              Current image: <a href={formData.currentImageUrl} target="_blank" rel="noopener noreferrer">View</a>
            </CurrentImage>
          )}
          <FileUploadContainer>
            <FileUploadLabel htmlFor="imageInput">
              <FileUploadIcon>
                <FiUpload />
              </FileUploadIcon>
              <div>{formData.image ? formData.image.name : "Upload new image (optional)"}</div>
              <FileTypeInfo>JPG or PNG (Max 5MB)</FileTypeInfo>
              {fileSize && <FileSizeInfo>{fileSize}</FileSizeInfo>}
            </FileUploadLabel>
            <input
              type="file"
              name="image"
              onChange={handleChange}
              id="imageInput"
              accept="image/jpeg, image/png"
              style={{ display: 'none' }}
            />
          </FileUploadContainer>
        </FormGroup>

        {formData.offerType === "delivery" && (
          <>
            <FormGroup>
              <FormLabel>Delivery Offer Type</FormLabel>
              <FormInput
                as="select"
                name="deliveryOfferType"
                value={formData.deliveryOfferType}
                onChange={handleChange}
                required
              >
                <option value="">Select Offer Type</option>
                <option value="free delivery">Free Delivery</option>
                <option value="discount off">Discount Off</option>
                <option value="percentage off">Percentage Off</option>
              </FormInput>
            </FormGroup>

            <FormGroup>
              <FormLabel>Eligibility</FormLabel>
              <FormInput
                as="select"
                name="eligibility"
                value={formData.eligibility}
                onChange={handleChange}
                required
              >
                <option value="">Select Eligibility</option>
                <option value="order more than">Order More Than</option>
                <option value="first order">First Order</option>
              </FormInput>
            </FormGroup>

            <FormGroup>
              <FormLabel>Discount Type</FormLabel>
              <FormInput
                as="select"
                name="discountType"
                value={formData.discountType}
                onChange={handleChange}
                required
              >
                <option value="">Select Discount Type</option>
                <option value="percentage off">Percentage Off</option>
                <option value="fixed amount off">Fixed Amount Off</option>
              </FormInput>
            </FormGroup>

            <FormGroup>
              <FormLabel>Discount Value</FormLabel>
              <FormInput
                type="number"
                name="discountValue"
                placeholder={formData.discountType === "percentage off" ? "0-100" : "Amount"}
                value={formData.discountValue}
                onChange={handleChange}
                onBlur={(e) => {
                  const error = validateField(e.target.name, e.target.value);
                  setValidationErrors({ ...validationErrors, [e.target.name]: error });
                }}
                className={validationErrors.discountValue ? "error" : ""}
                required
                min={formData.discountType === "percentage off" ? "0" : "1"}
                max={formData.discountType === "percentage off" ? "100" : ""}
              />
              {validationErrors.discountValue && (
                <ErrorMessage>{validationErrors.discountValue}</ErrorMessage>
              )}
            </FormGroup>

            <FormGroup>
              <FormLabel>Minimum Order Amount</FormLabel>
              <FormInput
                type="number"
                name="minimumOrderAmount"
                placeholder="Minimum order amount"
                value={formData.minimumOrderAmount}
                onChange={handleChange}
                min="1"
                required
              />
            </FormGroup>
          </>
        )}

        {formData.offerType === "combo" && (
          <>
            <FormGroup>
  <FormLabel>Combo Items</FormLabel>
  <SelectContainer>
    <Select
      options={menuItems}
      isMulti
      isSearchable
      onChange={handleComboItemsChange}
      value={formData.comboItems.map(item => {
        const id = typeof item === 'object' ? item._id || item.value : item;
        const menuItem = menuItems.find(mi => mi.value === id);
        
        return {
          value: id,
          label: menuItem ? `${menuItem.label} (Rs. ${menuItem.price})` : `Unknown Item (ID: ${id})`,
          price: menuItem ? menuItem.price : 0
        };
      })}
      placeholder="Select items for combo..."
      classNamePrefix="react-select"
      styles={customSelectStyles}
      required
    />
  </SelectContainer>
  <ComboPriceInfo>
    <span>Total items price: Rs. {totalComboPrice.toFixed(2)}</span>
    {formData.comboPrice && (
      <ComboSavings>
        They save: Rs. {comboDiscount.toFixed(2)} ({comboDiscountPercentage}%)
      </ComboSavings>
    )}
  </ComboPriceInfo>
</FormGroup>

            <FormGroup>
              <FormLabel>Combo Price</FormLabel>
              <FormInput
                type="number"
                name="comboPrice"
                placeholder="Enter combo price"
                value={formData.comboPrice}
                onChange={handleChange}
                onBlur={(e) => {
                  const error = validateField(e.target.name, e.target.value);
                  setValidationErrors({ ...validationErrors, [e.target.name]: error });
                }}
                className={validationErrors.comboPrice ? "error" : ""}
                required
                min="0"
                step="0.01"
              />
              {validationErrors.comboPrice && (
                <ErrorMessage>{validationErrors.comboPrice}</ErrorMessage>
              )}
            </FormGroup>
          </>
        )}

        {formData.offerType === "festive" && (
          <>
            <FormGroup>
              <FormLabel>Festival Name</FormLabel>
              <FormInput
                type="text"
                name="festivalName"
                placeholder="e.g. Diwali, Christmas"
                value={formData.festivalName}
                onChange={handleChange}
                required
              />
            </FormGroup>

            <FormGroup>
              <FormLabel>Eligibility</FormLabel>
              <FormInput
                as="select"
                name="eligibility"
                value={formData.eligibility}
                onChange={handleChange}
                required
              >
                <option value="">Select Eligibility</option>
                <option value="order more than">Order More Than</option>
              </FormInput>
            </FormGroup>

            <FormGroup>
              <FormLabel>Discount Type</FormLabel>
              <FormInput
                as="select"
                name="discountType"
                value={formData.discountType}
                onChange={handleChange}
                required
              >
                <option value="">Select Discount Type</option>
                <option value="percentage off">Percentage Off</option>
                <option value="fixed amount off">Fixed Amount Off</option>
              </FormInput>
            </FormGroup>

            <FormGroup>
              <FormLabel>Discount Value</FormLabel>
              <FormInput
                type="number"
                name="discountValue"
                placeholder={formData.discountType === "percentage off" ? "0-100" : "Amount"}
                value={formData.discountValue}
                onChange={handleChange}
                onBlur={(e) => {
                  const error = validateField(e.target.name, e.target.value);
                  setValidationErrors({ ...validationErrors, [e.target.name]: error });
                }}
                className={validationErrors.discountValue ? "error" : ""}
                required
                min={formData.discountType === "percentage off" ? "0" : "1"}
                max={formData.discountType === "percentage off" ? "100" : ""}
              />
              {validationErrors.discountValue && (
                <ErrorMessage>{validationErrors.discountValue}</ErrorMessage>
              )}
            </FormGroup>

            <FormGroup>
              <FormLabel>Minimum Order Amount</FormLabel>
              <FormInput
                type="number"
                name="minimumOrderAmount"
                placeholder="Minimum order amount"
                value={formData.minimumOrderAmount}
                onChange={handleChange}
                min="0"
                required
              />
            </FormGroup>
          </>
        )}

        <SubmitButton type="submit" disabled={loading}>
          {loading ? "Updating Offer..." : "Update Offer"}
        </SubmitButton>
      </form>
    </FormContainer>
  );
}

export default EditOffer;