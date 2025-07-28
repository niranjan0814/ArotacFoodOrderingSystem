import { useState, useEffect } from "react";
import axios from "axios";
import Select from "react-select";
import { toast } from 'react-toastify';
import styled from '@emotion/styled';
import { FiUpload, FiPlus, FiX, FiCheck } from 'react-icons/fi';
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
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const ValidationMessage = styled.div`
  font-size: 0.8rem;
  margin-top: 0.3rem;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;

  &.error {
    color: #e53e3e;
    background-color: rgba(229, 62, 62, 0.05);
  }

  &.success {
    color: #38a169;
    background-color: rgba(56, 161, 105, 0.05);
  }
`;

const CharacterCount = styled.div`
  font-size: 0.8rem;
  color: #718096;
  text-align: right;
  margin-top: 0.3rem;
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

  &.error {
    border-color: #e53e3e;
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

const customSelectStyles = {
  control: (provided, state) => ({
    ...provided,
    minHeight: '44px',
    borderColor: state.selectProps.error ? '#e53e3e' : '#e2e8f0',
    borderRadius: '8px',
    boxShadow: state.isFocused ? '0 0 0 2px rgba(193, 151, 85, 0.2)' : 'none',
    '&:hover': {
      borderColor: state.selectProps.error ? '#e53e3e' : '#cbd5e0'
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

function AddMenuItem() {
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
  });
  const [showPopup, setShowPopup] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [validationMessages, setValidationMessages] = useState({
    name: "",
    price: "",
    category: "",
    description: "",
    image: "",
  });
  const [fieldTouched, setFieldTouched] = useState({
    name: false,
    price: false,
    category: false,
    description: false,
    image: false,
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchCategories();
    fetchMenuItems();
  }, []);

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

  const validateField = (name, value) => {
    let message = "";
     switch (name) {
    case "name":
      if (!value.trim()) {
        message = "Please enter a name for the menu item.";
      } else if (/^\d/.test(value.trim())) {
        message = "Name cannot start with a number.";
      } else if (/^\d+$/.test(value.trim())) {
        message = "Name cannot be just a number.";
      } else if (/^[^a-zA-Z0-9]+$/.test(value.trim())) {
        message = "Name cannot be just symbols.";
      } else if (value.trim().length < 3) {
        message = "Name must be at least 3 characters long.";
      }
      break;
      case "price":
        if (!value) {
          message = "Please enter a price for the menu item.";
        } else if (isNaN(value)) {
          message = "Price must be a valid number.";
        } else if (Number(value) <= 0) {
          message = "Price must be greater than 0.";
        }
        break;
      case "category":
        if (!value) message = "Please select a category for the menu item.";
        break;
      case "description":
        if (!value.trim()) {
          message = "Please enter a description for the menu item.";
        } else if (value.length > 150) {
          message = "Description must be 150 characters or less.";
        }
        break;
      case "image":
        if (!value) {
          message = "Please upload an image for the menu item.";
        } else if (value.size > 5 * 1024 * 1024) {
          message = "Image size must be less than 5MB.";
        } else if (!["image/jpeg", "image/png"].includes(value.type)) {
          message = "Only JPG, JPEG and PNG images are allowed.";
        }
        break;
      default:
        break;
    }
    return message;
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    
    // Mark field as touched when it changes
    if (!fieldTouched[name]) {
      setFieldTouched(prev => ({ ...prev, [name]: true }));
    }

    if (name === "image") {
      const file = files[0];
      const message = validateField(name, file);
      setValidationMessages(prev => ({ ...prev, [name]: message }));
      setFormData(prev => ({ ...prev, image: file }));
    } else {
      const message = validateField(name, value);
      setValidationMessages(prev => ({ ...prev, [name]: message }));
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleBlur = (name) => {
    // Mark field as touched when it loses focus
    if (!fieldTouched[name]) {
      setFieldTouched(prev => ({ ...prev, [name]: true }));
    }
  };

  const handleCategoryChange = (selectedOption) => {
    // Mark category as touched when it changes
    if (!fieldTouched.category) {
      setFieldTouched(prev => ({ ...prev, category: true }));
    }

    if (selectedOption?.value === "add-new") {
      setShowPopup(true);
    } else {
      const message = validateField("category", selectedOption?.value || "");
      setValidationMessages(prev => ({ ...prev, category: message }));
      setFormData(prev => ({ ...prev, category: selectedOption?.value || "" }));
    }
  };

  const addNewCategory = async () => {
    try {
      const response = await axios.post("http://localhost:5000/api/categories/add", {
        name: newCategoryName,
      });
      toast.success(response.data.message);
      fetchCategories();
      setFormData(prev => ({ ...prev, category: newCategoryName }));
      setValidationMessages(prev => ({ ...prev, category: "" }));
      setShowPopup(false);
      setNewCategoryName("");
    } catch (error) {
      console.error("Error adding new category:", error);
      toast.error("Error adding category: " + (error.response?.data?.error || error.message));
    }
  };

  const handleRecommendedItemsChange = (selectedOptions) => {
    const recommendedItems = selectedOptions ? selectedOptions.map(option => option.value) : [];
    setFormData(prev => ({ ...prev, recommendedItems }));
  };

  const validateForm = () => {
    // Validate all fields before submission
    const newValidationMessages = {
      name: validateField("name", formData.name),
      price: validateField("price", formData.price),
      category: validateField("category", formData.category),
      description: validateField("description", formData.description),
      image: validateField("image", formData.image),
    };
    
    setValidationMessages(newValidationMessages);
    setFieldTouched({
      name: true,
      price: true,
      category: true,
      description: true,
      image: true,
    });

    return !Object.values(newValidationMessages).some(message => message);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
  
    setLoading(true);
  
    const data = new FormData();
    data.append("name", formData.name);
    data.append("price", formData.price);
    data.append("category", formData.category);
    data.append("description", formData.description);
    data.append("image", formData.image);
    if (formData.recommendedItems.length > 0) {
      data.append("recommendedItems", JSON.stringify(formData.recommendedItems));
    }
  
    try {
      const response = await axios.post("http://localhost:5000/api/menu/add-menu-item", data);
      toast.success(response.data.message);
      setFormData({
        name: "",
        price: "",
        category: "",
        description: "",
        image: null,
        recommendedItems: [],
      });
      setFieldTouched({
        name: false,
        price: false,
        category: false,
        description: false,
        image: false,
      });
      document.getElementById("imageInput").value = "";
    } catch (error) {
      console.error("Error adding menu item", error);
      const errorMessage = error.response?.data?.message || "An error occurred while adding the menu item.";
      toast.error(errorMessage);
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
      <FormHeader>Add New Menu Item</FormHeader>
      <form onSubmit={handleSubmit}>
        <FormGroup>
          <FormLabel>Item Name</FormLabel>
          <FormInput
            type="text"
            name="name"
            placeholder="e.g. Margherita Pizza"
            value={formData.name}
            onChange={handleChange}
            onBlur={() => handleBlur("name")}
            className={fieldTouched.name && validationMessages.name ? "error" : ""}
          />
          {fieldTouched.name && validationMessages.name && (
            <ValidationMessage className="error">
              <FiX /> {validationMessages.name}
            </ValidationMessage>
          )}
        </FormGroup>

        <FormGroup>
          <FormLabel>Price</FormLabel>
          <FormInput
            type="number"
            name="price"
            placeholder="e.g. 12.99"
            value={formData.price}
            onChange={handleChange}
            onBlur={() => handleBlur("price")}
            className={fieldTouched.price && validationMessages.price ? "error" : ""}
            min="1"
            step="0.01"
          />
          {fieldTouched.price && validationMessages.price && (
            <ValidationMessage className="error">
              <FiX /> {validationMessages.price}
            </ValidationMessage>
          )}
        </FormGroup>

        <FormGroup>
          <FormLabel>Category</FormLabel>
          <Select
            options={categoryOptions}
            isClearable
            isSearchable
            onChange={handleCategoryChange}
            onBlur={() => handleBlur("category")}
            value={formData.category ? { value: formData.category, label: formData.category } : null}
            placeholder="Select a category..."
            styles={customSelectStyles}
            error={fieldTouched.category && validationMessages.category}
            classNamePrefix="react-select"
          />
          {fieldTouched.category && validationMessages.category && (
            <ValidationMessage className="error">
              <FiX /> {validationMessages.category}
            </ValidationMessage>
          )}
        </FormGroup>

        <FormGroup>
          <FormLabel>Description</FormLabel>
          <TextArea
            name="description"
            placeholder="Describe the menu item (max 150 characters)"
            value={formData.description}
            onChange={handleChange}
            onBlur={() => handleBlur("description")}
            className={fieldTouched.description && validationMessages.description ? "error" : ""}
            maxLength={150}
          />
          <CharacterCount>
            {formData.description.length}/150 characters
          </CharacterCount>
          {fieldTouched.description && validationMessages.description && (
            <ValidationMessage className="error">
              <FiX /> {validationMessages.description}
            </ValidationMessage>
          )}
        </FormGroup>

        <FormGroup>
          <FormLabel>Recommended Pairings</FormLabel>
          <Select
            options={menuItems}
            isMulti
            isSearchable
            onChange={handleRecommendedItemsChange}
            placeholder="Select items that pair well with this..."
            styles={customSelectStyles}
            classNamePrefix="react-select"
          />
        </FormGroup>

        <FormGroup>
          <FormLabel>Item Image</FormLabel>
          <FileUploadContainer className={fieldTouched.image && validationMessages.image ? "error" : ""}>
            <FileUploadLabel htmlFor="imageInput">
              <FileUploadIcon>
                <FiUpload />
              </FileUploadIcon>
              <div>Drag & drop your image here or click to browse</div>
              <FileTypeInfo>JPG or PNG (Max 5MB)</FileTypeInfo>
            </FileUploadLabel>
            <input
              type="file"
              name="image"
              onChange={handleChange}
              onBlur={() => handleBlur("image")}
              id="imageInput"
              accept=".jpg, .jpeg, .png"
              style={{ display: 'none' }}
            />
          </FileUploadContainer>
          {fieldTouched.image && validationMessages.image ? (
            <ValidationMessage className="error">
              <FiX /> {validationMessages.image}
            </ValidationMessage>
          ) : formData.image && (
            <ValidationMessage className="success">
              <FiCheck /> Image uploaded: {formData.image.name} ({(formData.image.size / 1024).toFixed(2)} KB)
            </ValidationMessage>
          )}
        </FormGroup>

        <SubmitButton type="submit" disabled={loading}>
          {loading ? (
            <>Adding Item...</>
          ) : (
            <>Add Menu Item</>
          )}
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

export default AddMenuItem;