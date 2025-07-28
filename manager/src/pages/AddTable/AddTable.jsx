import { useState, useEffect } from "react";
import axios from "axios";
import {  useNavigate } from "react-router-dom";
import { toast } from 'react-toastify';
import styled from '@emotion/styled';
import { FiCheck, FiX, FiDownload, FiPrinter } from 'react-icons/fi';
import { QRCodeSVG } from 'qrcode.react';
import { jsPDF } from 'jspdf';
import {FiArrowLeft } from 'react-icons/fi';

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

function AddTable() {
  const [loading, setLoading] = useState(false);
  const [tableCreated, setTableCreated] = useState(false);
  const [qrCodeData, setQrCodeData] = useState(null);
  const [tableData, setTableData] = useState(null);
  const navigate = useNavigate();
  
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
  
    setLoading(true);
  
    try {
      const response = await axios.post("http://localhost:5000/api/tables/add", formData);
      
      toast.success("Table created successfully!");
      setTableCreated(true);
      setQrCodeData(response.data.qrCodeData);
      setTableData(response.data.table);
      
      setFormData({
        name: "",
        status: "Active"
      });
      setFieldTouched({
        name: false,
      });
    } catch (error) {
      console.error("Error adding table", error);
      const errorMessage = error.response?.data?.message || "An error occurred while adding the table.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const downloadQRCodePDF = () => {
    if (!qrCodeData || !tableData) return;
    
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm'
    });
    
    // Add QR code to PDF
    doc.addImage(qrCodeData, 'PNG', 50, 30, 100, 100);
    
    // Add table name below QR code
    doc.setFontSize(16);
    doc.text(`Table: ${tableData.name}`, 105, 140, { align: 'center' });
    
    // Save the PDF
    doc.save(`QRCode_Table_${tableData.name}.pdf`);
  };

  const printQRCode = () => {
    if (!qrCodeData || !tableData) return;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Table QR Code - ${tableData.name}</title>
        <style>
          body { 
            display: flex; 
            flex-direction: column; 
            align-items: center; 
            justify-content: center; 
            height: 100vh; 
            margin: 0; 
            font-family: Arial, sans-serif;
          }
          .qr-code { 
            margin-bottom: 20px;
          }
          .table-name { 
            font-size: 20px; 
            font-weight: bold; 
          }
          @media print {
            body { height: auto; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="qr-code">
          <img src="${qrCodeData}" alt="QR Code" width="300" height="300">
        </div>
        <div class="table-name">Table: ${tableData.name}</div>
        <button onclick="window.print()" style="margin-top: 20px; padding: 10px 20px; background: #c19755; color: white; border: none; border-radius: 5px; cursor: pointer;">
          Print
        </button>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <FormContainer>
       
      <FormHeader>Add New Table</FormHeader>
      <form onSubmit={handleSubmit}>
      
        <FormGroup>
        <BackButton onClick={() => navigate('/table/view')}>
               <FiArrowLeft /> Back to Tables
             </BackButton>
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

        <SubmitButton type="submit" disabled={loading}>
          {loading ? "Creating Table..." : "Add Table"}
        </SubmitButton>
      </form>

      {tableCreated && qrCodeData && tableData && (
        <QRCodeContainer>
          <h3>Table QR Code</h3>
          <QRCodeSVG 
  value={tableData.qrCodeLink} 
  size={256}
  level="H"
  includeMargin={true}
/>
          <p>Table: {tableData.name}</p>
          <QRCodeActions>
            <ActionButton className="download" onClick={downloadQRCodePDF}>
              <FiDownload /> Download PDF
            </ActionButton>
            <ActionButton className="print" onClick={printQRCode}>
              <FiPrinter /> Print
            </ActionButton>
          </QRCodeActions>
        </QRCodeContainer>
      )}
    </FormContainer>
  );
}

export default AddTable;