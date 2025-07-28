import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import styled from '@emotion/styled';
import { FiSearch, FiDownload, FiEdit2, FiFileText, FiFile } from 'react-icons/fi';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { useNavigate } from 'react-router-dom';
import { FiPrinter } from "react-icons/fi";
import { jsPDF } from "jspdf";

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

  &.pending {
    background-color: #fefcbf;
    color: #744210;
  }

  &.completed {
    background-color: #c6f6d5;
    color: #22543d;
  }
    &.canceled {
    background-color:rgb(246, 198, 198);
    color:rgb(219, 45, 45);
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
`;
// ... (keep all your imports and styled components)

function OrderListPage() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, searchTerm, statusFilter]);

  const fetchOrders = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/orders');
      setOrders(response.data);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to fetch orders');
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let result = [...orders];

    if (searchTerm) {
      result = result.filter(order =>
        (order.orderNumber?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (order.customerName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (order.tableNumber?.toLowerCase() || '').includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter(order => order.status === statusFilter);
    }

    setFilteredOrders(result);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
  };

  // Fixed navigation handler
  const handleEditClick = (orderId) => {
    navigate(`/orders/edit/${orderId}`);
  };

  const generateBill = (order) => {
    if (!order?.items) {
      toast.error('Order data is incomplete');
      return;
    }

    const billContent = `
      <html>
        <head>
          <title>Bill</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 20px; }
            h1 { color: #333; font-size: 24px; margin-bottom: 5px; }
            .restaurant-name { font-size: 18px; font-weight: bold; color: #4a90e2; }
            .order-info { margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { padding: 12px 15px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background-color: #f8f9fa; font-weight: 600; }
            .total-row { font-weight: bold; }
            .total-amount { text-align: right; font-size: 18px; }
            .footer { text-align: center; margin-top: 30px; color: #777; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="restaurant-name">AroTac - </div>
            <h1>ORDER RECEIPT</h1>
            <div>${new Date(order.createdAt).toLocaleDateString()} • ${new Date(order.createdAt).toLocaleTimeString()}</div>
          </div>
          
          <div class="order-info">
            <div><strong>Order Type:</strong> ${order.orderType === 'dine-in' ? `Dine-In (Table ${order.tableNumber})` : 'Takeaway'}</div>
            <div><strong>Customer:</strong> ${order.customerName || 'Guest'}</div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${order.items.map(item => `
                <tr>
                  <td>${item.name || ''}</td>
                  <td>${item.quantity || 0}</td>
                  <td>Rs. ${item.price?.toFixed(2) || '0.00'}</td>
                  <td>Rs. ${((item.price || 0) * (item.quantity || 0)).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr class="total-row">
                <td colspan="3">Subtotal</td>
                <td>Rs. ${order.totalAmount?.toFixed(2) || '0.00'}</td>
              </tr>
              <tr class="total-row">
                <td colspan="3">Tax (10%)</td>
                <td>Rs. ${((order.totalAmount || 0) * 0.1).toFixed(2)}</td>
              </tr>
              <tr class="total-row">
                <td colspan="3">Total Amount</td>
                <td class="total-amount">Rs. ${((order.totalAmount || 0) * 1.1).toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
          
          <div class="footer">
            Thank you for dining with us!<br>
            Please visit again
          </div>
        </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.open();
    printWindow.document.write(billContent);
    printWindow.document.close();
    printWindow.print();
  };

  return (
      <TableContainer>
        <Header>
          <Title>Orders List</Title>
    
          <Controls>
            <SearchContainer>
              <SearchInput 
                type="text" 
                placeholder="Search..." 
                value={searchTerm}
                onChange={handleSearchChange}
              />
              <SearchIcon>
                <FiSearch />
              </SearchIcon>
            </SearchContainer>
    
            <FilterSelect 
              value={statusFilter} 
              onChange={handleStatusFilterChange}
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="canceled">Canceled</option>
            </FilterSelect>
          </Controls>
        </Header>
    
        {loading ? (
          <p>Loading orders...</p>
        ) : (
          <TableWrapper>
            <StyledTable>
              <TableHeader>
                <TableHeaderRow>
                  <TableHeaderCell>Order No</TableHeaderCell>
                  <TableHeaderCell>Customer</TableHeaderCell>
                  <TableHeaderCell>Table</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell>Total</TableHeaderCell>
                  <TableHeaderCell>Action</TableHeaderCell>
                </TableHeaderRow>
              </TableHeader>
    
              <TableBody>
                {filteredOrders.map(order => (
                  <TableRow key={order._id}>
                    <TableCell>{order.orderNumber || 'N/A'}</TableCell>
                    <TableCell>{order.customerName || 'Guest'}</TableCell>
                    <TableCell>{order.tableNumber || '-'}</TableCell>
                    <TableCell>
                      <StatusBadge className={order.status}>
                        {order.status}
                      </StatusBadge>
                    </TableCell>
                    <TableCell>Rs. {order.totalAmount?.toFixed(2) || '0.00'}</TableCell>
                    <TableCell>
                      <ActionButtons>
                        <ActionButton onClick={() => generateBill(order)}>
                          <FiPrinter /> Print Bill
                        </ActionButton>
                        <ActionButton 
                          className="edit" 
                          onClick={() => handleEditClick(order._id)}
                        >
                          <FiEdit2 /> Edit
                        </ActionButton>
                      </ActionButtons>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </StyledTable>
          </TableWrapper>
        )}
      </TableContainer>
    );
}

export default OrderListPage;