import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import Select from "react-select";
import { toast } from 'react-toastify';
import styled from '@emotion/styled';
import {FiArrowLeft } from 'react-icons/fi';
import { FiUpload, FiPlus, FiX, FiCheck, FiEye, FiEyeOff } from 'react-icons/fi';


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
    left: 25%;
    right: 25%;
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
  margin-top: 1rem;
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

const FileInfo = styled.div`
  margin-top: 0.5rem;
  font-size: 0.9rem;
  color: #4a5568;
`;

const FileTypeInfo = styled.div`
  font-size: 0.75rem;
  color: #718096;
  margin-top: 0.5rem;
  text-align: center;
`;

const PopupOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const PopupContent = styled.div`
  background-color: white;
  padding: 2rem;
  border-radius: 12px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
`;

const PopupTitle = styled.h3`
  font-size: 1.3rem;
  margin-bottom: 1.5rem;
  text-align: center;
  color: #2d3748;
`;

const PopupInput = styled.input`
  width: 100%;
  padding: 0.8rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.95rem;
  margin-bottom: 1.5rem;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #c19755;
    box-shadow: 0 0 0 2px rgba(193, 151, 85, 0.2);
  }
`;

const PopupButton = styled.button`
  padding: 0.8rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
`;

const PopupPrimaryButton = styled(PopupButton)`
  background-color: #c19755;
  color: white;
  margin-right: 0.5rem;

  &:hover {
    background-color: #b38a4a;
    transform: translateY(-1px);
  }
`;

const PopupSecondaryButton = styled(PopupButton)`
  background-color: #e2e8f0;
  color: #4a5568;

  &:hover {
    background-color: #cbd5e0;
    transform: translateY(-1px);
  }
`;

const VisibilityToggle = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
  padding: 0.8rem;
  border-radius: 8px;
  background-color: #f8fafc;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: #f0f4f8;
  }

  input[type="checkbox"] {
    appearance: none;
    width: 18px;
    height: 18px;
    border: 2px solid #c19755;
    border-radius: 4px;
    cursor: pointer;
    position: relative;
    transition: all 0.2s ease;

    &:checked {
      background-color: #c19755;

      &::after {
        content: '✓';
        position: absolute;
        color: white;
        font-size: 0.8rem;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
      }
    }
  }

  label {
    cursor: pointer;
    font-weight: 500;
    color: #4a5568;
  }
`;

const customSelectStyles = {
  control: (provided, state) => ({
    ...provided,
    minHeight: '44px',
    borderColor: '#e2e8f0',
    borderRadius: '8px',
    boxShadow: state.isFocused ? '0 0 0 2px rgba(193, 151, 85, 0.2)' : 'none',
    '&:hover': {
      borderColor: '#cbd5e0'
    }
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected ? '#c19755' : state.isFocused ? '#f0f4f8' : 'white',
    color: state.isSelected ? 'white' : '#2d3748'
  }),
  multiValue: (provided) => ({
    ...provided,
    backgroundColor: '#f0f4f8'
  }),
  multiValueLabel: (provided) => ({
    ...provided,
    color: '#2d3748'
  }),
  multiValueRemove: (provided) => ({
    ...provided,
    color: '#718096',
    ':hover': {
      backgroundColor: '#e53e3e',
      color: 'white'
    }
  })
};

function EditMenuItem() {
  const { id } = useParams(); 
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    category: "",
    description: "",
    image: null,
    recommendedItems: [],
    isVisible: true,
    currentImageUrl: ""
  });
  const [showPopup, setShowPopup] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  

  useEffect(() => {
    fetchCategories();
    fetchMenuItems();
    fetchMenuItem();
  }, [id]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/categories");
      setCategories(response.data.map((cat) => ({ value: cat, label: cat })));
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Error fetching categories");
    }
  };

  const fetchMenuItems = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/menu");
      setMenuItems(response.data.map((item) => ({ value: item._id, label: item.name })));
    } catch (error) {
      console.error("Error fetching menu items:", error);
      toast.error("Error fetching menu items");
    }
  };

  const fetchMenuItem = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/menu/${id}`);
      setFormData({
        name: response.data.name,
        price: response.data.price,
        category: response.data.category,
        description: response.data.description,
        image: null,
        recommendedItems: response.data.recommendedItems || [],
        isVisible: response.data.isVisible || true,
        currentImageUrl: response.data.image || ""
      });
    } catch (error) {
      console.error("Error fetching menu item:", error);
      toast.error("Error fetching menu item. Please try again.");
    }
  };

  const handleChange = (e) => {
    if (e.target.name === "image") {
      setFormData({ ...formData, image: e.target.files[0] });
    } else if (e.target.name === "isVisible") {
      setFormData({ ...formData, isVisible: e.target.checked });
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  };

  const handleCategoryChange = (selectedOption) => {
    if (selectedOption?.value === "add-new") {
      setShowPopup(true);
    } else {
      setFormData({ ...formData, category: selectedOption?.value || "" });
    }
  };

  const handleRecommendedItemsChange = (selectedOptions) => {
    const recommendedItems = selectedOptions ? selectedOptions.map(option => option.value) : [];
    setFormData({ ...formData, recommendedItems });
  };

  const addNewCategory = async () => {
    try {
      const response = await axios.post("http://localhost:5000/api/categories/add", {
        name: newCategoryName,
      });
      toast.success(response.data.message);
      fetchCategories();
      setFormData({ ...formData, category: newCategoryName });
      setShowPopup(false);
      setNewCategoryName("");
    } catch (error) {
      console.error("Error adding new category:", error);
      toast.error("Error adding category: " + (error.response?.data?.error || error.message));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
  
    // Check if visibility is being changed to false and item is in active combo offers
    if (formData.isVisible === false) {
      try {
        const currentDate = new Date();
        const response = await axios.get(
          `http://localhost:5000/api/offers/check-combo/${id}?date=${currentDate.toISOString()}`
        );
        
        if (response.data.inUse) {
          toast.error("Cannot hide this item as it is currently used in active combo offers");
          setLoading(false);
          return;
        }
      } catch (error) {
        console.error("Error checking combo offers:", error);
        toast.error("Error verifying combo offers. Please try again.");
        setLoading(false);
        return;
      }
    }
  
    const data = new FormData();
    data.append("name", formData.name);
    data.append("price", formData.price);
    data.append("category", formData.category);
    data.append("description", formData.description);
    data.append("isVisible", formData.isVisible);
    if (formData.image) {
      data.append("image", formData.image);
    }
    if (formData.recommendedItems.length > 0) {
      data.append("recommendedItems", JSON.stringify(formData.recommendedItems)); 
    }
  
    try {
      const response = await axios.put(`http://localhost:5000/api/menu/${id}`, data);
      toast.success(response.data.message);
      navigate("/menu/view"); 
    } catch (error) {
      console.error("Error updating menu item:", error);
      toast.error("Error updating menu item. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const categoryOptions = [
    ...categories,
    { value: "add-new", label: "Add new category...", icon: <FiPlus /> },
  ];

  return (
    <FormContainer>
      <BackButton onClick={() => navigate('/menu/view')}>
                           <FiArrowLeft /> Back to Menu
                         </BackButton>
      <FormHeader>Edit Menu Item</FormHeader>
      <form onSubmit={handleSubmit}>
        <FormGroup>
          <FormLabel>Item Name</FormLabel>
          <FormInput
            type="text"
            name="name"
            placeholder="e.g. Margherita Pizza"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </FormGroup>

        <FormGroup>
          <FormLabel>Price</FormLabel>
          <FormInput
            type="number"
            name="price"
            placeholder="e.g. 12.99"
            value={formData.price}
            onChange={handleChange}
            min="1"
            step="0.01"
            required
          />
        </FormGroup>

        <FormGroup>
          <FormLabel>Category</FormLabel>
          <Select
            options={categoryOptions}
            isClearable
            isSearchable
            onChange={handleCategoryChange}
            value={formData.category ? { value: formData.category, label: formData.category } : null}
            placeholder="Select a category..."
            styles={customSelectStyles}
            classNamePrefix="react-select"
            required
          />
        </FormGroup>

        <FormGroup>
          <FormLabel>Description</FormLabel>
          <TextArea
            name="description"
            placeholder="Describe the menu item"
            value={formData.description}
            onChange={handleChange}
            required
          />
        </FormGroup>

        <FormGroup>
          <FormLabel>Recommended Pairings</FormLabel>
          <Select
            options={menuItems}
            isMulti
            isSearchable
            onChange={handleRecommendedItemsChange}
            value={formData.recommendedItems.map(itemId => ({
              value: itemId,
              label: menuItems.find(item => item.value === itemId)?.label || itemId
            }))}
            placeholder="Select items that pair well with this..."
            styles={customSelectStyles}
            classNamePrefix="react-select"
          />
        </FormGroup>

        <FormGroup>
          <FormLabel>Item Image</FormLabel>
          {formData.currentImageUrl && !formData.image && (
            <FileInfo>
              Current image: <a href={formData.currentImageUrl} target="_blank" rel="noopener noreferrer">View</a>
            </FileInfo>
          )}
          <FileUploadContainer>
            <FileUploadLabel htmlFor="imageInput">
              <FileUploadIcon>
                <FiUpload />
              </FileUploadIcon>
              <div>{formData.image ? formData.image.name : "Upload new image (optional)"}</div>
              <FileTypeInfo>JPG or PNG (Max 5MB)</FileTypeInfo>
            </FileUploadLabel>
            <input
              type="file"
              name="image"
              onChange={handleChange}
              id="imageInput"
              accept=".jpg, .jpeg, .png"
              style={{ display: 'none' }}
            />
          </FileUploadContainer>
        </FormGroup>

        <VisibilityToggle onClick={() => setFormData({...formData, isVisible: !formData.isVisible})}>
          <input
            type="checkbox"
            name="isVisible"
            id="isVisible"
            checked={formData.isVisible}
            onChange={handleChange}
          />
          <label htmlFor="isVisible">
            {formData.isVisible ? (
              <>
                <FiEye /> Visible for Sale
              </>
            ) : (
              <>
                <FiEyeOff /> Hidden from Menu
              </>
            )}
          </label>
        </VisibilityToggle>

        <SubmitButton type="submit" disabled={loading}>
          {loading ? "Updating..." : "Update Menu Item"}
        </SubmitButton>
      </form>

      {showPopup && (
        <PopupOverlay>
          <PopupContent>
            <PopupTitle>Create New Category</PopupTitle>
            <PopupInput
              type="text"
              placeholder="Enter category name"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              autoFocus
            />
            <div>
              <PopupPrimaryButton onClick={addNewCategory}>
                <FiPlus /> Add Category
              </PopupPrimaryButton>
              <PopupSecondaryButton onClick={() => setShowPopup(false)}>
                <FiX /> Cancel
              </PopupSecondaryButton>
            </div>
          </PopupContent>
        </PopupOverlay>
      )}
    </FormContainer>
  );
}

export default EditMenuItem;