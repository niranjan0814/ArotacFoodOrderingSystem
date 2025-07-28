import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from 'react-toastify';
import styled from '@emotion/styled';
import { FiCheck, FiX, FiDownload, FiPrinter, FiArrowLeft } from 'react-icons/fi';
import { QRCodeSVG } from 'qrcode.react';
import { jsPDF } from 'jspdf';

const FormContainer = styled.div`
  width: 1000px;
  margin: 5rem 5rem auto;
  padding: 3rem;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  overflow: hidden;

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

const FormSelect = styled.select`
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

const QRCodeContainer = styled.div`
  margin-top: 2rem;
  padding: 2rem;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
`;

const QRCodeActions = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
`;

const ActionButton = styled.button`
  padding: 0.8rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  border: none;
  
  &.download {
    background-color: #c19755;
    color: white;
    
    &:hover {
      background-color: #b38a4a;
    }
  }
  
  &.print {
    background-color: #2d3748;
    color: white;
    
    &:hover {
      background-color: #1a202c;
    }
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

function EditTable() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    status: "Active"
  });
  
  const [validationMessages, setValidationMessages] = useState({
    name: "",
  });
  
  const [fieldTouched, setFieldTouched] = useState({
    name: false,
  });

  useEffect(() => {
    const fetchTable = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/tables/${id}`);
        setFormData({
          name: response.data.table.name,
          status: response.data.table.status
        });
        setLoading(false);
      } catch (error) {
        toast.error('Failed to fetch table data');
        navigate('/tables');
      }
    };

    fetchTable();
  }, [id, navigate]);

  const validateField = (name, value) => {
    let message = "";
    switch (name) {
      case "name":
        if (!value.trim()) message = "Please enter a table name.";
        break;
      default:
        break;
    }
    return message;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (!fieldTouched[name]) {
      setFieldTouched(prev => ({ ...prev, [name]: true }));
    }

    const message = validateField(name, value);
    setValidationMessages(prev => ({ ...prev, [name]: message }));
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleBlur = (name) => {
    if (!fieldTouched[name]) {
      setFieldTouched(prev => ({ ...prev, [name]: true }));
    }
  };

  const validateForm = () => {
    const newValidationMessages = {
      name: validateField("name", formData.name),
    };
    
    setValidationMessages(newValidationMessages);
    setFieldTouched({
      name: true,
    });

    return !Object.values(newValidationMessages).some(message => message);
  };

  const checkTableNameAvailability = async (name) => {
  try {
    const response = await axios.get(`http://localhost:5000/api/tables/check-name?name=${name}&exclude=${id}`);
    return response.data.available;
  } catch (error) {
    console.error("Error checking table name:", error);
    return false;
  }
};

const handleSubmit = async (e) => {
  e.preventDefault();
  if (!validateForm()) return;

  // Get the original table data to compare
  const originalTableResponse = await axios.get(`http://localhost:5000/api/tables/${id}`);
  const originalTable = originalTableResponse.data.table;

  // Only check name availability if the name has changed
  if (formData.name !== originalTable.name) {
    const isAvailable = await checkTableNameAvailability(formData.name);
    if (!isAvailable) {
      toast.error("This table name is already taken. Please choose a different name.");
      return;
    }
  }

  setUpdating(true);

  try {
    await axios.put(`http://localhost:5000/api/tables/${id}`, formData);
    toast.success("Table updated successfully!");
    navigate('/table/view');
  } catch (error) {
    console.error("Error updating table", error);
    if (error.response?.data?.error?.includes('E11000 duplicate key error')) {
      toast.error("This table name is already taken. Please choose a different name.");
    } else {
      const errorMessage = error.response?.data?.message || "An error occurred while updating the table.";
      toast.error(errorMessage);
    }
  } finally {
    setUpdating(false);
  }
};

  if (loading) {
    return (
      <FormContainer>
        <FormHeader>Loading Table...</FormHeader>
      </FormContainer>
    );
  }

  return (
    <FormContainer>
      <BackButton onClick={() => navigate('/table/view')}>
        <FiArrowLeft /> Back to Tables
      </BackButton>
      
      <FormHeader>Edit Table</FormHeader>
      <form onSubmit={handleSubmit}>
        <FormGroup>
          <FormLabel>Table Name</FormLabel>
          <FormInput
            type="text"
            name="name"
            placeholder="e.g. Table 1, VIP Table, Family Table"
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
          <FormLabel>Status</FormLabel>
          <FormSelect
            name="status"
            value={formData.status}
            onChange={handleChange}
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </FormSelect>
        </FormGroup>

        <SubmitButton type="submit" disabled={updating}>
          {updating ? "Updating Table..." : "Update Table"}
        </SubmitButton>
      </form>
    </FormContainer>
  );
}

export default EditTable;