import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  FcAcceptDatabase, FcTemplate, FcRemoveImage 
} from "react-icons/fc";
import { FaEye, FaQuestion, FaListUl, FaFileExcel, FaFilePdf } from "react-icons/fa";
import { AiOutlineEyeInvisible } from "react-icons/ai";
import { Card, CardContent, CardHeader, Typography, CircularProgress } from '@mui/material';
import { Pie, Bar } from 'react-chartjs-2';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from "xlsx";
import { FiEdit2, FiTrash2, FiPlus, FiX, FiCheck, FiChevronRight } from 'react-icons/fi';
import { 
  Chart as ChartJS, 
  ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend 
} from 'chart.js';
import styled from '@emotion/styled';
import ConfirmationPopup from './ConfirmationPopup';
import './ConfirmationPopup.css';
import ItemsPopup from './ItemsPopup';

// Register ChartJS components
ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

// ========== STYLED COMPONENTS ========== //
const DashboardContainer = styled.div`
padding: 2rem;
  width: 1000px;
  margin: 5rem 5rem auto;
  background-color: #f8fafc;
  min-height: 100vh;
`;

const HeaderContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
`;

const Title = styled(Typography)`
  font-weight: 700 !important;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 0.75rem;

  &:before {
    content: "";
    display: block;
    width: 4px;
    height: 28px;
    background-color: #3b82f6;
    border-radius: 2px;
  }
`;

const ExportButtons = styled.div`
  display: flex;
  gap: 1rem;
`;

const ExportButton = styled.button`
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }

  &.excel {
    background-color: #10b981;
    color: white;

    &:hover {
      background-color: #059669;
    }
  }

  &.pdf {
    background-color: #3b82f6;
    color: white;

    &:hover {
      background-color: #2563eb;
    }
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const StatCard = styled(Card)`
  border-radius: 12px !important;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
  transition: transform 0.3s ease, box-shadow 0.3s ease !important;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%) !important;
  border: none !important;
  overflow: hidden;
  cursor: ${props => props.onClick ? 'pointer' : 'default'};

  &:hover {
    transform: ${props => props.onClick ? 'translateY(-5px)' : 'none'};
    box-shadow: ${props => props.onClick ? '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'} !important;
  }

  .MuiCardHeader-root {
    padding-bottom: 0;
    background-color: rgba(59, 130, 246, 0.05);
    border-bottom: 1px solid #e2e8f0;
  }

  .MuiCardHeader-title {
    font-size: 1.1rem !important;
    font-weight: 600 !important;
    color: #4a5568 !important;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .MuiCardContent-root {
    padding-top: 1rem;
  }
`;

const StatValue = styled(Typography)`
  font-size: 2rem !important;
  font-weight: 700 !important;
  color: #1e293b !important;
`;

const ChartGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const ChartCard = styled(Card)`
  border-radius: 12px !important;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
  background: white !important;
`;

const ChartContainer = styled.div`
  height: 300px;
  padding: 1rem;
`;

const RecentItemsCard = styled(Card)`
  border-radius: 12px !important;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
  background: white !important;
`;

const RecentItem = styled.div`
  display: flex;
  align-items: center;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 0.75rem;
  background-color: white;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }

  .item-image {
    width: 64px;
    height: 64px;
    object-fit: cover;
    border-radius: 8px;
    margin-right: 1rem;
    background-color: #e2e8f0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #94a3b8;
    font-size: 0.75rem;
  }

  .item-details {
    flex-grow: 1;

    h3 {
      font-size: 1.1rem;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 0.25rem;
    }

    .category {
      font-size: 0.875rem;
      color: #64748b;
      margin-bottom: 0.25rem;
    }

    .price {
      font-size: 1rem;
      font-weight: 600;
      color: #3b82f6;
    }
  }

  .item-arrow {
    color: #94a3b8;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 80vh;
  flex-direction: column;
  gap: 1rem;
`;

const ErrorContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 80vh;
`;

// ========== MODAL COMPONENTS ========== //
const ModalOverlay = styled.div`
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

const ModalContent = styled.div`
  background-color: white;
  padding: 2rem;
  border-radius: 12px;
  width: 100%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
`;

const CategoryItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  margin-bottom: 0.75rem;
  background-color: white;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #f8fafc;
  }

  .category-name {
    font-weight: 500;
    color: #1e293b;
  }

  .category-actions {
    display: flex;
    gap: 0.5rem;
  }
`;

const AddCategoryForm = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 1.5rem;
`;

const AddCategoryInput = styled.input`
  flex-grow: 1;
  padding: 0.75rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const AddCategoryButton = styled.button`
  padding: 0.75rem 1.25rem;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #2563eb;
  }
`;

// ========== MAIN COMPONENT ========== //
const MenuAnalytics = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showItemsPopup, setShowItemsPopup] = useState(false);
  const [popupItems, setPopupItems] = useState([]);
  const [popupTitle, setPopupTitle] = useState('');

  const fetchAnalyticsData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication required');

      const response = await axios.get('http://localhost:5000/api/analytics/menu-analytics', {
        headers: { Authorization: `Bearer ${token}` }
      });

      setAnalyticsData(response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      toast.error(err.response?.data?.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/categories/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCategories(response.data);
    } catch (err) {
      toast.error('Failed to fetch categories');
    }
  };

  const handleAddCategory = async (name) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/api/categories/add', 
        { name },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(response.data.message);
      fetchCategories();
      fetchAnalyticsData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add category');
    }
  };

  const handleUpdateCategory = async (id, name) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`http://localhost:5000/api/categories/${id}`,
        { name },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(response.data.message);
      fetchCategories();
      fetchAnalyticsData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update category');
    }
  };

  const handleDeleteCategory = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(`http://localhost:5000/api/categories/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(response.data.message);
      fetchCategories();
      fetchAnalyticsData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete category');
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const showItems = (filter, title, items) => {
    if (!analyticsData) {
      toast.error("Data not available");
      return;
    }

    let filteredItems = [];
    
    if (items) {
      filteredItems = items;
    } else {
      switch(filter) {
        case 'all':
          filteredItems = analyticsData.allItems;
          break;
        case 'visible':
          filteredItems = analyticsData.allItems.filter(item => item.isVisible);
          break;
        case 'hidden':
          filteredItems = analyticsData.allItems.filter(item => !item.isVisible);
          break;
        case 'withRecs':
          filteredItems = analyticsData.itemsWithRecommendations || [];
          break;
        case 'withoutRecs':
          filteredItems = analyticsData.itemsWithoutRecommendations || [];
          break;
        default:
          filteredItems = [];
      }
    }
  
    if (filteredItems.length === 0) {
      toast.info(`No ${title.toLowerCase()} found`);
      return;
    }
    
    setPopupItems(filteredItems);
    setPopupTitle(title);
    setShowItemsPopup(true);
  };

  // Handle pie chart click
  const handlePieClick = (event, elements) => {
    if (elements.length > 0) {
      const index = elements[0].index;
      const category = categoryData.labels[index];
      const itemsInCategory = analyticsData.allItems.filter(item => item.category === category);
      showItems(null, `Items in ${category}`, itemsInCategory);
    }
  };

  // Handle bar chart click
  const handleBarClick = (event, elements) => {
    if (elements.length > 0) {
      const index = elements[0].index;
      const priceRange = priceData.labels[index];
      const [min, max] = priceRange.split('-').map(Number);
      
      let itemsInRange;
      if (priceRange.endsWith('+')) {
        const minPrice = parseInt(priceRange.replace('+', ''));
        itemsInRange = analyticsData.allItems.filter(item => item.price >= minPrice);
      } else {
        itemsInRange = analyticsData.allItems.filter(item => item.price >= min && item.price <= max);
      }
      
      showItems(null, `Items in ${priceRange} LKR`, itemsInRange);
    }
  };

  if (loading) return (
    <LoadingContainer>
      <CircularProgress size={60} thickness={4} />
      <Typography variant="h6" color="textSecondary">Loading menu analytics...</Typography>
    </LoadingContainer>
  );

  if (error) return (
    <ErrorContainer>
      <Card sx={{ maxWidth: 500, textAlign: 'center', p: 3 }}>
        <Typography variant="h6" color="error" gutterBottom>
          Error Loading Data
        </Typography>
        <Typography variant="body1" color="textSecondary" paragraph>
          {error}
        </Typography>
        <button 
          onClick={fetchAnalyticsData}
          style={{
            backgroundColor: '#3b82f6',
            color: 'white',
            padding: '0.75rem 1.5rem',
            borderRadius: '8px',
            border: 'none',
            fontWeight: '500',
            cursor: 'pointer',
            marginTop: '1rem'
          }}
        >
          Retry
        </button>
      </Card>
    </ErrorContainer>
  );

  // Chart Data
  const categoryData = {
    labels: Object.keys(analyticsData.categoryDistribution),
    datasets: [{
      data: Object.values(analyticsData.categoryDistribution),
      backgroundColor: ['#3b82f6', '#06b6d4', '#8b5cf6', '#ec4899', '#f97316'],
      borderWidth: 1,
    }],
  };

  const priceData = {
    labels: Object.keys(analyticsData.priceDistribution),
    datasets: [{
      label: 'Number of Items',
      data: Object.values(analyticsData.priceDistribution),
      backgroundColor: '#3b82f6',
      borderWidth: 1,
      borderRadius: 4,
    }],
  };

  // Chart options with onClick handlers
  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    onClick: handlePieClick,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          boxWidth: 12,
          padding: 20,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.label}: ${context.raw} items (${((context.raw / analyticsData.stats.totalItems) * 100).toFixed(1)}%)`;
          }
        }
      }
    }
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    onClick: handleBarClick,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.raw} items`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  };

  // Stats Configuration
  const stats = [
    { 
      title: 'Total Menu Items', 
      value: analyticsData.stats.totalItems, 
      icon: <FcAcceptDatabase size={24} />, 
      color: 'bg-blue-100',
      onClick: () => showItems('all', 'All Menu Items')
    },
    { 
      title: 'Visible Items', 
      value: analyticsData.stats.visibleItems, 
      icon: <FaEye size={20} className="text-green-600" />, 
      color: 'bg-green-100',
      onClick: () => showItems('visible', 'Visible Items')
    },
    { 
      title: 'Hidden Items', 
      value: analyticsData.stats.hiddenItems, 
      icon: <AiOutlineEyeInvisible size={20} className="text-yellow-600" />, 
      color: 'bg-yellow-100',
      onClick: () => showItems('hidden', 'Hidden Items')
    },
    { 
      title: 'Categories', 
      value: analyticsData.stats.categoryCount, 
      icon: <FcTemplate size={24} />, 
      color: 'bg-purple-100',
      onClick: () => {
        fetchCategories();
        setShowCategoryModal(true);
      }
    },
    { 
      title: 'With Recommendations', 
      value: analyticsData.stats.itemsWithRecommendations, 
      icon: <FaListUl size={20} className="text-indigo-600" />, 
      color: 'bg-indigo-100',
      onClick: () => showItems('withRecs', 'Items With Recommendations')
    },
    { 
      title: 'Without Recommendations', 
      value: analyticsData.stats.itemsWithoutRecommendations, 
      icon: <FaQuestion size={20} className="text-red-600" />, 
      color: 'bg-red-100',
      onClick: () => showItems('withoutRecs', 'Items Without Recommendations')
    },
    { 
      title: 'No Image', 
      value: analyticsData.stats.itemsWithoutImages, 
      icon: <FcRemoveImage size={24} />, 
      color: 'bg-gray-100' 
    }
  ];

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet([{
      "Total Menu Items": analyticsData.stats.totalItems,
      "Visible Items": analyticsData.stats.visibleItems,
      "Hidden Items": analyticsData.stats.hiddenItems,
      "Categories": analyticsData.stats.categoryCount,
      "With Recommendations": analyticsData.stats.itemsWithRecommendations,
      "Without Recommendations": analyticsData.stats.itemsWithoutRecommendations,
      "No Image": analyticsData.stats.itemsWithoutImages,
    }]);

    XLSX.utils.sheet_add_json(worksheet, Object.entries(analyticsData.categoryDistribution).map(([category, count]) => ({ Category: category, Count: count })), { skipHeader: true, origin: -1 });
    XLSX.utils.sheet_add_json(worksheet, Object.entries(analyticsData.priceDistribution).map(([range, count]) => ({ "Price Range": range, "Item Count": count })), { skipHeader: true, origin: -1 });
    XLSX.utils.sheet_add_json(worksheet, analyticsData.recentlyAdded.map(item => ({
      Name: item.name,
      Price: `Rs. ${item.price}`,
      Category: item.category,
      Added: new Date(item.createdAt).toLocaleDateString()
    })), { skipHeader: true, origin: -1 });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Menu Analytics");
    XLSX.writeFile(workbook, "menu_analytics.xlsx");
    toast.success('Excel report downloaded successfully');
  };

  const exportToPDF = () => {
    try {
      const doc = new jsPDF({ orientation: "landscape" });
      
      // Title
      doc.setFontSize(18);
      doc.setTextColor(59, 130, 246);
      doc.text("Menu Analytics Dashboard", 14, 15);
      
      // Decorative line
      doc.setDrawColor(59, 130, 246);
      doc.setLineWidth(0.5);
      doc.line(14, 20, 196, 20);
      
      // Date
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, 30);

      // Stats table
      autoTable(doc, {
        startY: 40,
        head: [["Metric", "Value"]],
        body: stats.map(stat => [stat.title, stat.value]),
        theme: "grid",
        headStyles: { 
          fillColor: [59, 130, 246], 
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        margin: { horizontal: 14 },
        styles: {
          fontSize: 10,
          cellPadding: 5,
          halign: 'left'
        },
        columnStyles: {
          1: { halign: 'right' }
        }
      });

      // Category distribution
      doc.setFontSize(14);
      doc.setTextColor(59, 130, 246);
      doc.text("Category Distribution", 14, doc.lastAutoTable.finalY + 15);
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 20,
        head: [["Category", "Count", "Percentage"]],
        body: Object.entries(analyticsData.categoryDistribution).map(([category, count]) => [
          category, 
          count,
          `${((count / analyticsData.stats.totalItems) * 100).toFixed(1)}%`
        ]),
        theme: "grid",
        headStyles: { 
          fillColor: [59, 130, 246], 
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        margin: { horizontal: 14 },
        styles: {
          fontSize: 10,
          cellPadding: 5
        },
        columnStyles: {
          1: { halign: 'right' },
          2: { halign: 'right' }
        }
      });

      // Price distribution
      doc.text("Price Distribution (Rs.)", 14, doc.lastAutoTable.finalY + 15);
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 20,
        head: [["Price Range", "Item Count", "Percentage"]],
        body: Object.entries(analyticsData.priceDistribution).map(([range, count]) => [
          range, 
          count,
          `${((count / analyticsData.stats.totalItems) * 100).toFixed(1)}%`
        ]),
        theme: "grid",
        headStyles: { 
          fillColor: [59, 130, 246], 
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        margin: { horizontal: 14 },
        styles: {
          fontSize: 10,
          cellPadding: 5
        },
        columnStyles: {
          1: { halign: 'right' },
          2: { halign: 'right' }
        }
      });

      // Recently added items
      doc.text("Recently Added Items", 14, doc.lastAutoTable.finalY + 15);
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 20,
        head: [["Name", "Price", "Category", "Added On"]],
        body: analyticsData.recentlyAdded.map(item => [
          item.name,
          `Rs. ${item.price}`,
          item.category,
          new Date(item.createdAt).toLocaleDateString()
        ]),
        theme: "grid",
        headStyles: { 
          fillColor: [59, 130, 246], 
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        margin: { horizontal: 14 },
        styles: {
          fontSize: 10,
          cellPadding: 5
        }
      });

      doc.save("menu_analytics_report.pdf");
      toast.success('PDF report downloaded successfully');
    } catch (error) {
      toast.error("Failed to generate PDF report");
    }
  };

  return (
    <DashboardContainer>
      <HeaderContainer>
        <Title variant="h4">Menu Analytics Dashboard</Title>
        <ExportButtons>
          <ExportButton className="excel" onClick={exportToExcel}>
            <FaFileExcel /> Export to Excel
          </ExportButton>
          <ExportButton className="pdf" onClick={exportToPDF}>
            <FaFilePdf /> Export to PDF
          </ExportButton>
        </ExportButtons>
      </HeaderContainer>

      <StatsGrid>
        {stats.map((stat, index) => (
          <StatCard key={index} onClick={stat.onClick || null}>
            <CardHeader 
              title={stat.title} 
              avatar={stat.icon}
            />
            <CardContent>
              <StatValue>{stat.value}</StatValue>
            </CardContent>
          </StatCard>
        ))}
      </StatsGrid>

      <ChartGrid>
        <ChartCard>
          <CardHeader 
            title="Category Distribution" 
            subheader="Click on a sector to view items in that category"
          />
          <CardContent>
            <ChartContainer>
              <Pie data={categoryData} options={pieOptions} />
            </ChartContainer>
          </CardContent>
        </ChartCard>

        <ChartCard>
          <CardHeader 
            title="Price Distribution" 
            subheader="Click on a bar to view items in that price range"
          />
          <CardContent>
            <ChartContainer>
              <Bar data={priceData} options={barOptions} />
            </ChartContainer>
          </CardContent>
        </ChartCard>
      </ChartGrid>

      <RecentItemsCard>
        <CardHeader title="Recently Added Items" subheader="Last 5 menu items added" />
        <CardContent>
          {analyticsData.recentlyAdded.map((item) => (
            <RecentItem key={item._id} onClick={() => showItems(null, item.name, [item])}>
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.name} className="item-image" />
              ) : (
                <div className="item-image">No Image</div>
              )}
              <div className="item-details">
                <h3>{item.name}</h3>
                <div className="category">{item.category}</div>
                <div className="price">Rs. {item.price}</div>
              </div>
              <FiChevronRight className="item-arrow" size={20} />
            </RecentItem>
          ))}
        </CardContent>
      </RecentItemsCard>

      {/* Category Management Modal */}
      <CategoryModal 
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        categories={categories}
        onAdd={handleAddCategory}
        onUpdate={handleUpdateCategory}
        onDelete={handleDeleteCategory}
      />
      
      {/* Items Popup */}
      {showItemsPopup && (
        <ItemsPopup
          items={popupItems}
          title={popupTitle}
          onClose={() => setShowItemsPopup(false)}
        />
      )}
    </DashboardContainer>
  );
};

// Category Management Modal Component
const CategoryModal = ({ isOpen, onClose, categories, onAdd, onUpdate, onDelete }) => {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  const handleAdd = () => {
    if (newCategoryName.trim()) {
      onAdd(newCategoryName);
      setNewCategoryName('');
    }
  };

  const handleUpdate = () => {
    if (editCategoryName.trim()) {
      onUpdate(editingCategory._id, editCategoryName);
      setEditingCategory(null);
      setEditCategoryName('');
    }
  };

  const handleDeleteRequest = (id) => {
    setCategoryToDelete(id);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    onDelete(categoryToDelete);
    setShowDeleteConfirm(false);
    setCategoryToDelete(null);
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setCategoryToDelete(null);
  };

  if (!isOpen) return null;

  return (
    <>
      <ModalOverlay>
        <ModalContent>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <Typography variant="h6" style={{ fontWeight: 600 }}>Manage Categories</Typography>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem' }}>
              <FiX />
            </button>
          </div>
          
          <div style={{ marginBottom: '1.5rem' }}>
            {categories.map(category => (
              <CategoryItem key={category._id}>
                {editingCategory?._id === category._id ? (
                  <>
                    <input
                      style={{ flexGrow: 1, padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '4px' }}
                      value={editCategoryName}
                      onChange={(e) => setEditCategoryName(e.target.value)}
                      autoFocus
                    />
                    <div className="category-actions">
                      <button 
                        onClick={handleUpdate}
                        style={{ background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', padding: '0.5rem', cursor: 'pointer' }}
                      >
                        <FiCheck />
                      </button>
                      <button 
                        onClick={() => setEditingCategory(null)}
                        style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', padding: '0.5rem', cursor: 'pointer' }}
                      >
                        <FiX />
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="category-name">{category.name}</span>
                    <div className="category-actions">
                      <button 
                        onClick={() => {
                          setEditingCategory(category);
                          setEditCategoryName(category.name);
                        }}
                        style={{ background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', padding: '0.5rem', cursor: 'pointer' }}
                      >
                        <FiEdit2 />
                      </button>
                      <button 
                        onClick={() => handleDeleteRequest(category._id)}
                        style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', padding: '0.5rem', cursor: 'pointer' }}
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </>
                )}
              </CategoryItem>
            ))}
          </div>

          <AddCategoryForm>
            <AddCategoryInput
              placeholder="New category name"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
            />
            <AddCategoryButton onClick={handleAdd}>
              <FiPlus /> Add Category
            </AddCategoryButton>
          </AddCategoryForm>
        </ModalContent>
      </ModalOverlay>
      
      {showDeleteConfirm && (
        <ConfirmationPopup
          message="Are you sure you want to delete this category?"
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />
      )}
    </>
  );
};

export default MenuAnalytics;