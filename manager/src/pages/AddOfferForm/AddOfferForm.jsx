import React, { useState, useEffect } from "react";
import axios from "axios";
import Select from "react-select";
import { toast } from 'react-toastify';
import styled from '@emotion/styled';
import { FiUpload, FiPlus, FiX, FiCheck, FiCalendar, FiTag, FiShoppingCart, FiGift } from 'react-icons/fi';
import {FiArrowLeft } from 'react-icons/fi';
import {  useNavigate } from "react-router-dom";


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

const TabContainer = styled.div`
  display: flex;
  margin-bottom: 2rem;
  border-bottom: 1px solid #e2e8f0;
`;

const TabButton = styled.button`
  flex: 1;
  padding: 0.8rem;
  border: none;
  background: none;
  font-weight: 600;
  color: #718096;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  position: relative;

  &:hover {
    color: #2d3748;
  }

  &.active {
    color: #c19755;

    &::after {
      content: '';
      position: absolute;
      bottom: -1px;
      left: 0;
      right: 0;
      height: 3px;
      background: #c19755;
      border-radius: 3px 3px 0 0;
    }
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

const customSelectStyles = {
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected ? '#c19755' : state.isFocused ? '#f0f4f8' : 'white',
    color: state.isSelected ? 'white' : '#2d3748'
  })
};

function AddOfferForm() {
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const [activeTab, setActiveTab] = useState("Delivery");
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
  });
  const [totalComboPrice, setTotalComboPrice] = useState(0);
  const [fileSize, setFileSize] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/menu");
      const visibleItems = response.data.filter(item => item.isVisible !== false);
      setMenuItems(visibleItems.map((item) => ({ 
        value: item._id, 
        label: item.name, 
        price: item.price 
      })));
    } catch (error) {
      console.error("Error fetching menu items:", error);
      toast.error("Error fetching menu items");
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    
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
      setFormData({
        ...formData,
        [name]: file,
      });
    } else {
      // Special handling for delivery offer type changes
      if (name === "deliveryOfferType") {
        let discountType = "";
        if (value === "free delivery" || value === "discount off") {
          discountType = "fixed amount off";
        } else if (value === "percentage off") {
          discountType = "percentage off";
        }
        
        setFormData({
          ...formData,
          deliveryOfferType: value,
          discountType: discountType
        });
      } else {
        setFormData({
          ...formData,
          [name]: type === "checkbox" ? checked : value,
        });
      }
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
      case "comboPrice":
        if (formData.offerType === "combo" && parseFloat(value) > totalComboPrice) {
          error = "Combo price must be less than or equal to the total price of selected items";
        }
        break;
      case "discountValue":
        if (formData.discountType === "percentage off" && parseFloat(value) >= 100) {
          error = "Discount percentage cannot exceed 100%";
        }
        break;
      default:
        break;
    }
    return error;
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    setErrors({ ...errors, [name]: error });
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = {};
    
    // Validate required fields
    if (!formData.name) {
      newErrors.name = "Name is required";
      isValid = false;
    }
    
    if (!formData.description) {
      newErrors.description = "Description is required";
      isValid = false;
    }
    
    if (!formData.startDate) {
      newErrors.startDate = "Start Date is required";
      isValid = false;
    }
    
    if (!formData.endDate) {
      newErrors.endDate = "End Date is required";
      isValid = false;
    }
    
    // Delivery offer specific validations
    if (formData.offerType === "delivery") {
      if (!formData.deliveryOfferType) {
        toast.error("Please select a Delivery Offer Type");
        isValid = false;
      }
      
      if (!formData.discountType) {
        toast.error("Please select a Discount Type");
        isValid = false;
      }
      
      if (!formData.discountValue) {
        toast.error("Please enter a Discount Value");
        isValid = false;
      } else if (formData.discountType === "percentage off" && parseFloat(formData.discountValue) >= 100) {
        toast.error("Discount percentage cannot exceed 100%");
        isValid = false;
      }
      
      if (!formData.minimumOrderAmount) {
        toast.error("Please enter a Minimum Order Amount");
        isValid = false;
      }
    }
    
    // Combo offer specific validations
    if (formData.offerType === "combo") {
      if (formData.comboItems.length === 0) {
        toast.error("Please select at least one item for the combo");
        isValid = false;
      }
      
      if (!formData.comboPrice) {
        toast.error("Please enter a Combo Price");
        isValid = false;
      } else if (parseFloat(formData.comboPrice) > totalComboPrice) {
        toast.error("Combo price must be less than or equal to the total price of selected items");
        isValid = false;
      }
    }
    
    // Festive offer specific validations
    if (formData.offerType === "festive") {
      if (!formData.festivalName) {
        toast.error("Please enter a Festival Name");
        isValid = false;
      }
      
      if (!formData.discountValue) {
        toast.error("Please enter a Discount Value");
        isValid = false;
      }
      
      if (!formData.minimumOrderAmount) {
        toast.error("Please enter a Minimum Order Amount");
        isValid = false;
      }
    }
    
    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
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
      const response = await axios.post("http://localhost:5000/api/offers/add", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success(response.data.message);
      setFormData({
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
      });
      document.getElementById("imageInput").value = "";
      setFileSize("");
    } catch (error) {
      console.error("Error adding offer:", error);
      toast.error(error.response?.data?.message || "Failed to add offer");
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
            <FormHeader></FormHeader>
      <FormHeader>Create New Offer</FormHeader>
      
      <TabContainer>
        <TabButton
          className={activeTab === "Delivery" ? "active" : ""}
          onClick={() => {
            setActiveTab("Delivery");
            setFormData({ ...formData, offerType: "delivery", applicable: "home" });
          }}
        >
          <FiShoppingCart /> Delivery Offer
        </TabButton>
        <TabButton
          className={activeTab === "Combo" ? "active" : ""}
          onClick={() => {
            setActiveTab("Combo");
            setFormData({ ...formData, offerType: "combo", applicable: "all" });
          }}
        >
          <FiTag /> Combo Offer
        </TabButton>
        <TabButton
          className={activeTab === "Festive" ? "active" : ""}
          onClick={() => {
            setActiveTab("Festive");
            setFormData({ ...formData, offerType: "festive", applicable: "all" });
          }}
        >
          <FiGift /> Festive Offer
        </TabButton>
      </TabContainer>

      <form onSubmit={handleSubmit}>
        <FormGroup>
          <FormLabel>Offer Name</FormLabel>
          <FormInput
            type="text"
            name="name"
            placeholder="e.g. Weekend Special, Diwali Discount"
            value={formData.name}
            onChange={handleChange}
            onBlur={handleBlur}
          />
          {errors.name && <ErrorMessage>{errors.name}</ErrorMessage>}
        </FormGroup>

        <FormGroup>
          <FormLabel>Description</FormLabel>
          <TextArea
            name="description"
            placeholder="Describe the offer details"
            value={formData.description}
            onChange={handleChange}
            onBlur={handleBlur}
          />
          {errors.description && <ErrorMessage>{errors.description}</ErrorMessage>}
        </FormGroup>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <FormGroup>
            <FormLabel>Start Date</FormLabel>
            <FormInput
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              onBlur={handleBlur}
            />
            {errors.startDate && <ErrorMessage>{errors.startDate}</ErrorMessage>}
          </FormGroup>

          <FormGroup>
            <FormLabel>End Date</FormLabel>
            <FormInput
              type="date"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              onBlur={handleBlur}
            />
            {errors.endDate && <ErrorMessage>{errors.endDate}</ErrorMessage>}
          </FormGroup>
        </div>

        <FormGroup>
          <FormLabel>Offer Image</FormLabel>
          <FileUploadContainer>
            <FileUploadLabel htmlFor="imageInput">
              <FileUploadIcon>
                <FiUpload />
              </FileUploadIcon>
              <div>Click to upload or drag and drop</div>
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

        {activeTab === "Delivery" && (
          <>
            <FormGroup>
              <FormLabel>Delivery Offer Type</FormLabel>
              <FormInput
                as="select"
                name="deliveryOfferType"
                value={formData.deliveryOfferType}
                onChange={handleChange}
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
                disabled={formData.deliveryOfferType === "free delivery" || 
                          formData.deliveryOfferType === "discount off" || 
                          formData.deliveryOfferType === "percentage off"}
              >
                <option value="">Select Discount Type</option>
                <option value="fixed amount off">Fixed Amount Off</option>
                <option value="percentage off">Percentage Off</option>
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
                onBlur={handleBlur}
                min={formData.discountType === "percentage off" ? "0" : "1"}
                max={formData.discountType === "percentage off" ? "100" : ""}
              />
              {errors.discountValue && <ErrorMessage>{errors.discountValue}</ErrorMessage>}
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
              />
            </FormGroup>
          </>
        )}

        {activeTab === "Combo" && (
          <>
            <FormGroup>
              <FormLabel>Combo Items</FormLabel>
              <SelectContainer>
                <Select
                  options={menuItems}
                  isMulti
                  isSearchable
                  onChange={handleComboItemsChange}
                  value={formData.comboItems.map((itemId) => ({
                    value: itemId,
                    label: menuItems.find((item) => item.value === itemId)?.label,
                    price: menuItems.find((item) => item.value === itemId)?.price,
                  }))}
                  placeholder="Select items for combo..."
                  classNamePrefix="react-select"
                  styles={customSelectStyles}
                />
              </SelectContainer>
              <ComboPriceInfo>
                <span>Total items price: Rs. {totalComboPrice.toFixed(2)}</span>
                {formData.comboPrice && (
                  <ComboSavings>
                    You save: Rs. {comboDiscount.toFixed(2)} ({comboDiscountPercentage}%)
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
                onBlur={handleBlur}
                min="0"
                step="0.01"
              />
              {errors.comboPrice && <ErrorMessage>{errors.comboPrice}</ErrorMessage>}
            </FormGroup>
          </>
        )}

        {activeTab === "Festive" && (
          <>
            <FormGroup>
              <FormLabel>Festival Name</FormLabel>
              <FormInput
                type="text"
                name="festivalName"
                placeholder="e.g. Diwali, Christmas, New Year"
                value={formData.festivalName}
                onChange={handleChange}
              />
            </FormGroup>

            <FormGroup>
              <FormLabel>Eligibility</FormLabel>
              <FormInput
                as="select"
                name="eligibility"
                value={formData.eligibility}
                onChange={handleChange}
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
              >
                <option value="">Select Discount Type</option>
                <option value="fixed amount off">Fixed Amount Off</option>
                <option value="percentage off">Percentage Off</option>
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
                onBlur={handleBlur}
                min={formData.discountType === "percentage off" ? "0" : "1"}
                max={formData.discountType === "percentage off" ? "100" : ""}
              />
              {errors.discountValue && <ErrorMessage>{errors.discountValue}</ErrorMessage>}
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
              />
            </FormGroup>
          </>
        )}

        <SubmitButton type="submit" disabled={loading}>
          {loading ? "Creating Offer..." : "Create Offer"}
        </SubmitButton>
      </form>
    </FormContainer>
  );
}

export default AddOfferForm;