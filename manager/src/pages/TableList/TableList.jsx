import { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import axios from 'axios';
import { toast } from 'react-toastify';
import styled from '@emotion/styled';
import { FiSearch, FiFilter, FiDownload, FiEdit2, FiTrash2, FiFileText, FiFile } from 'react-icons/fi';
import { QRCodeSVG } from 'qrcode.react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import QRCode from 'qrcode';
import ConfirmationPopup from './ConfirmationPopup';
import { useNavigate } from 'react-router-dom';

const TableContainer = styled.div`
  width: 1000px;
  margin: 5rem 5rem auto;
  max-width: 1200px;
  padding: 2rem;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
`;

const Title = styled.h2`
  font-size: 1.8rem;
  font-weight: 700;
  color: #2d3748;
  margin: 0;
  position: relative;
  padding-bottom: 0.5rem;

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 60px;
    height: 3px;
    background: linear-gradient(90deg, #c19755, #f3e9d2);
    border-radius: 3px;
  }
`;

const Controls = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
`;

const SearchContainer = styled.div`
  position: relative;
  min-width: 250px;
`;

const SearchInput = styled.input`
  padding: 0.6rem 1rem 0.6rem 2.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.95rem;
  transition: all 0.2s ease;
  width: 100%;
  background-color: #f8fafc;

  &:focus {
    outline: none;
    border-color: #c19755;
    box-shadow: 0 0 0 2px rgba(193, 151, 85, 0.2);
    background-color: white;
  }
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #718096;
`;

const FilterSelect = styled.select`
  padding: 0.6rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.95rem;
  transition: all 0.2s ease;
  background-color: #f8fafc;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #c19755;
    box-shadow: 0 0 0 2px rgba(193, 151, 85, 0.2);
    background-color: white;
  }
`;

const ExportButtons = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ExportButton = styled.button`
  padding: 0.6rem 1rem;
  background-color: #f8fafc;
  color: #4a5568;
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

  &.pdf {
    background-color: #f56565;
    color: white;
    border-color: #f56565;

    &:hover {
      background-color: #e53e3e;
      border-color: #e53e3e;
    }
  }

  &.excel {
    background-color: #48bb78;
    color: white;
    border-color: #48bb78;

    &:hover {
      background-color: #38a169;
      border-color: #38a169;
    }
  }
`;

const TableWrapper = styled.div`
  overflow-x: auto;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  min-width: 800px;
`;

const TableHeader = styled.thead`
  background-color: #f8fafc;
`;

const TableHeaderRow = styled.tr`
  border-bottom: 1px solid #e2e8f0;
`;

const TableHeaderCell = styled.th`
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: #4a5568;
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.05em;
`;

const TableBody = styled.tbody``;

const TableRow = styled.tr`
  border-bottom: 1px solid #e2e8f0;
  transition: all 0.2s ease;

  &:hover {
    background-color: #f8fafc;
  }

  &:last-child {
    border-bottom: none;
  }
`;

const TableCell = styled.td`
  padding: 1rem;
  color: #4a5568;
`;

const StatusBadge = styled.span`
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;

  &.active {
    background-color: #c6f6d5;
    color: #22543d;
  }

  &.inactive {
    background-color: #fed7d7;
    color: #822727;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ActionButton = styled.button`
  padding: 0.5rem;
  border-radius: 6px;
  border: none;
  background-color: transparent;
  color: #4a5568;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background-color: #edf2f7;
  }

  &.edit {
    color: #3182ce;

    &:hover {
      background-color: #ebf8ff;
    }
  }

  &.delete {
    color: #e53e3e;

    &:hover {
      background-color: #fff5f5;
    }
  }
`;

function TableList() {
  const [tables, setTables] = useState([]);
  const [filteredTables, setFilteredTables] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [tableToDelete, setTableToDelete] = useState(null);

  useEffect(() => {
    fetchTables();
  }, []);

  useEffect(() => {
    filterTables();
  }, [tables, searchTerm, statusFilter]);

  const fetchTables = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/tables');
      setTables(response.data.tables);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to fetch tables');
      setLoading(false);
    }
  };
  const navigate = useNavigate();
  const handleEditClick = (table) => {
    navigate(`/edit-table/${table._id}`);
  };

  const printQRCodePDF = (table) => {
    const doc = new jsPDF();
    const qrCodeSize = 100;
    const pageWidth = doc.internal.pageSize.getWidth();
    const xPos = (pageWidth - qrCodeSize) / 2;
    
    const tempDiv = document.createElement('div');
    document.body.appendChild(tempDiv);
    
    const root = createRoot(tempDiv);
    root.render(
      <QRCodeSVG 
        value={table.qrCodeLink} 
        size={qrCodeSize * 4}
        level="H"
        includeMargin={true}
      />
    );
    

    const svg = new XMLSerializer().serializeToString(qrCode);
    const img = new Image();
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
    
    img.onload = () => {
      canvas.width = qrCodeSize * 4;
      canvas.height = qrCodeSize * 4;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      
      // Add QR code to PDF
      doc.addImage(canvas, 'PNG', xPos, 30, qrCodeSize, qrCodeSize);
      
      // Add table name below QR code
      doc.setFontSize(16);
      doc.text(`Table: ${table.name}`, pageWidth / 2, 140, { align: 'center' });
      
      doc.save(`QRCode_Table_${table.name}.pdf`);
    };
  };



  const filterTables = () => {
    let result = [...tables];

    // Apply search filter
    if (searchTerm) {
      result = result.filter(table =>
        table.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(table => table.status === statusFilter);
    }

    setFilteredTables(result);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('Tables List', 105, 15, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, 22, { align: 'center' });
    
    const headers = [['Name', 'Status', 'Created At', 'QR Code Link']];
    const data = filteredTables.map(table => [
      table.name,
      table.status,
      new Date(table.createdAt).toLocaleDateString(),
      table.qrCodeLink
    ]);
    
    autoTable(doc, {
      head: headers,
      body: data,
      startY: 30,
      styles: {
        halign: 'center',
        cellPadding: 3,
        fontSize: 10
      },
      headStyles: {
        fillColor: [193, 151, 85],
        textColor: [255, 255, 255]
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      }
    });
    
    doc.save('tables_list.pdf');
  };
  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filteredTables.map(table => ({
        Name: table.name,
        Status: table.status,
        'QR Code Link': table.qrCodeLink,
        'Created At': new Date(table.createdAt).toLocaleDateString()
      }))
    );
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Tables');
    XLSX.writeFile(workbook, 'tables_list.xlsx');
  };

  const handleDeleteClick = (table) => {
    setTableToDelete(table);
    setShowDeletePopup(true);
  };

  const downloadQRCodePDF = async (table) => {
    try {
      // Generate QR code as data URL
      const qrCodeDataUrl = await QRCode.toDataURL(table.qrCodeLink, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm'
      });
      
      const qrCodeSize = 100;
      const pageWidth = doc.internal.pageSize.getWidth();
      const xPos = (pageWidth - qrCodeSize) / 2;
      
      // Add QR code to PDF
      const img = new Image();
      img.src = qrCodeDataUrl;
      
      img.onload = () => {
        doc.addImage(img, 'PNG', xPos, 30, qrCodeSize, qrCodeSize);
        
        // Add table name below QR code
        doc.setFontSize(16);
        doc.text(`Table: ${table.name}`, pageWidth / 2, 140, { align: 'center' });
        
        doc.save(`QRCode_Table_${table.name}.pdf`);
      };
    } catch (error) {
      toast.error('Failed to generate QR code PDF');
      console.error('QR code generation error:', error);
    }
  };
 


  const confirmDelete = async () => {
    try {
      await axios.delete(`http://localhost:5000/api/tables/${tableToDelete._id}`);
      toast.success('Table deleted successfully');
      fetchTables();
    } catch (error) {
      toast.error('Failed to delete table');
    } finally {
      setShowDeletePopup(false);
      setTableToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeletePopup(false);
    setTableToDelete(null);
  };

  return (
    <TableContainer>
      <Header>
        <Title>Manage Tables</Title>
        <Controls>
          <SearchContainer>
            <SearchIcon>
              <FiSearch />
            </SearchIcon>
            <SearchInput
              type="text"
              placeholder="Search tables..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </SearchContainer>

          <FilterSelect value={statusFilter} onChange={handleStatusFilterChange}>
            <option value="all">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </FilterSelect>

          <ExportButtons>
            <ExportButton className="pdf" onClick={exportToPDF}>
              <FiFileText /> PDF
            </ExportButton>
            <ExportButton className="excel" onClick={exportToExcel}>
              <FiFile /> Excel
            </ExportButton>
          </ExportButtons>
        </Controls>
      </Header>

      <TableWrapper>
        <StyledTable>
          <TableHeader>
            <TableHeaderRow>
              <TableHeaderCell>Table Name</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>QR Code Link</TableHeaderCell>
              <TableHeaderCell>QR Code PDF</TableHeaderCell>
              <TableHeaderCell>Created At</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </TableHeaderRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan="6" style={{ textAlign: 'center' }}>
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredTables.length === 0 ? (
              <TableRow>
                <TableCell colSpan="6" style={{ textAlign: 'center' }}>
                  No tables found
                </TableCell>
              </TableRow>
            ) : (
              filteredTables.map((table) => (
                <TableRow key={table._id}>
                  <TableCell>{table.name}</TableCell>
                  <TableCell>
                    <StatusBadge className={table.status.toLowerCase()}>
                      {table.status}
                    </StatusBadge>
                  </TableCell>
                  <TableCell>
                    <a 
                      href={table.qrCodeLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ color: '#3182ce', textDecoration: 'underline' }}
                    >
                      View QR Link
                    </a>
                  </TableCell>
                  <TableCell>
                    <ActionButton 
                      className="pdf" 
                      onClick={() =>  downloadQRCodePDF(table)}
                      style={{ color: '#e53e3e' }}
                    >
                      <FiDownload /> Download QR
                    </ActionButton>
                  </TableCell>
                  <TableCell>
                    {new Date(table.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <ActionButtons>
                    <ActionButton 
    className="edit" 
    title="Edit"
    onClick={() => handleEditClick(table)}
  >
                        <FiEdit2 />
                      </ActionButton>
                      <ActionButton 
                        className="delete" 
                        title="Delete"
                        onClick={() => handleDeleteClick(table)}
                      >
                        <FiTrash2 />
                      </ActionButton>
                    </ActionButtons>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </StyledTable>
      </TableWrapper>

      {showDeletePopup && (
        <ConfirmationPopup
          message={`Are you sure you want to delete table "${tableToDelete?.name}"?`}
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
        />
      )}
    </TableContainer>
  );
}

export default TableList;