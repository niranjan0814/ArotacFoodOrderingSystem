import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  FcAcceptDatabase, FcTemplate, FcRemoveImage, 
  FcSalesPerformance, FcCustomerSupport, FcRating
} from "react-icons/fc";
import { 
  FaEye, FaQuestion, FaListUl, FaFileExcel, FaFilePdf, 
  FaUtensils, FaUsers, FaMoneyBillWave, FaChartLine 
} from "react-icons/fa";
import { AiOutlineEyeInvisible } from "react-icons/ai";
import { 
  Card, CardContent, CardHeader, Typography, CircularProgress, 
  Grid, Box, Paper, Divider 
} from '@mui/material';
import { Pie, Bar, Line } from 'react-chartjs-2';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from "xlsx";
import { 
  FiEdit2, FiTrash2, FiPlus, FiX, FiCheck, FiChevronRight,
  FiDollarSign, FiClock, FiTrendingUp, FiUser, FiShoppingCart
} from 'react-icons/fi';
import { 
  Chart as ChartJS, 
  ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend 
} from 'chart.js';
import styled from '@emotion/styled';
import { useNavigate } from 'react-router-dom';

// Register ChartJS components
ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

// ========== STYLED COMPONENTS ========== //
const DashboardContainer = styled.div`
  padding: 2rem;
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

const StatCard = styled(Card)`
  border-radius: 12px !important;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
  transition: transform 0.3s ease, box-shadow 0.3s ease !important;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%) !important;
  border: none !important;
  overflow: hidden;
  cursor: ${props => props.onClick ? 'pointer' : 'default'};
  height: 100%;

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

const StatChange = styled(Typography)`
  font-size: 0.875rem !important;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-top: 0.5rem;

  &.positive {
    color: #10b981 !important;
  }

  &.negative {
    color: #ef4444 !important;
  }
`;

const ChartCard = styled(Card)`
  border-radius: 12px !important;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
  background: white !important;
  height: 100%;
`;

const ChartContainer = styled.div`
  height: 300px;
  padding: 1rem;
`;

const RecentItemsCard = styled(Card)`
  border-radius: 12px !important;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
  background: white !important;
  height: 100%;
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

const DashboardCard = styled(Paper)`
  padding: 20px;
  height: 100%;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
`;

// ========== MAIN COMPONENT ========== //
const RestaurantDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication required');

      const response = await axios.get('http://localhost:5000/api/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });

      setDashboardData(response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      toast.error(err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const exportToExcel = () => {
    if (!dashboardData) return;

    const worksheet = XLSX.utils.json_to_sheet([
      {
        "Total Revenue": dashboardData.sales.totalRevenue,
        "Today's Revenue": dashboardData.sales.todayRevenue,
        "Monthly Revenue": dashboardData.sales.monthlyRevenue,
        "Total Orders": dashboardData.orders.totalOrders,
        "Today's Orders": dashboardData.orders.todayOrders,
        "Average Order Value": dashboardData.orders.averageOrderValue,
        "Total Customers": dashboardData.customers.totalCustomers,
        "New Customers (This Month)": dashboardData.customers.newCustomersThisMonth,
        "Total Menu Items": dashboardData.menu.totalItems,
        "Visible Items": dashboardData.menu.visibleItems,
        "Categories": dashboardData.menu.categoryCount
      }
    ]);

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Dashboard Summary");
    XLSX.writeFile(workbook, "restaurant_dashboard.xlsx");
    toast.success('Excel report downloaded successfully');
  };

  const exportToPDF = () => {
    if (!dashboardData) return;

    try {
      const doc = new jsPDF();
      
      // Title
      doc.setFontSize(18);
      doc.setTextColor(59, 130, 246);
      doc.text("Restaurant Dashboard Report", 14, 15);
      
      // Decorative line
      doc.setDrawColor(59, 130, 246);
      doc.setLineWidth(0.5);
      doc.line(14, 20, 196, 20);
      
      // Date
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, 30);

      // Sales Summary
      doc.setFontSize(14);
      doc.setTextColor(59, 130, 246);
      doc.text("Sales Summary", 14, 40);
      autoTable(doc, {
        startY: 45,
        head: [["Metric", "Value"]],
        body: [
          ["Total Revenue", `Rs. ${dashboardData.sales.totalRevenue.toFixed(2)}`],
          ["Today's Revenue", `Rs. ${dashboardData.sales.todayRevenue.toFixed(2)}`],
          ["Monthly Revenue", `Rs. ${dashboardData.sales.monthlyRevenue.toFixed(2)}`],
          ["Revenue Change (MoM)", `${dashboardData.sales.revenueChange}%`]
        ],
        theme: "grid",
        headStyles: { 
          fillColor: [59, 130, 246], 
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        margin: { horizontal: 14 }
      });

      // Orders Summary
      doc.text("Orders Summary", 14, doc.lastAutoTable.finalY + 15);
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 20,
        head: [["Metric", "Value"]],
        body: [
          ["Total Orders", dashboardData.orders.totalOrders],
          ["Today's Orders", dashboardData.orders.todayOrders],
          ["Average Order Value", `Rs. ${dashboardData.orders.averageOrderValue.toFixed(2)}`],
          ["Popular Payment Method", dashboardData.orders.popularPaymentMethod]
        ],
        theme: "grid",
        headStyles: { 
          fillColor: [59, 130, 246], 
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        margin: { horizontal: 14 }
      });

      // Customers Summary
      doc.text("Customers Summary", 14, doc.lastAutoTable.finalY + 15);
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 20,
        head: [["Metric", "Value"]],
        body: [
          ["Total Customers", dashboardData.customers.totalCustomers],
          ["New Customers (This Month)", dashboardData.customers.newCustomersThisMonth],
          ["Repeat Customers", dashboardData.customers.repeatCustomers],
          ["Average Rating", dashboardData.customers.averageRating.toFixed(1)]
        ],
        theme: "grid",
        headStyles: { 
          fillColor: [59, 130, 246], 
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        margin: { horizontal: 14 }
      });

      // Menu Summary
      doc.text("Menu Summary", 14, doc.lastAutoTable.finalY + 15);
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 20,
        head: [["Metric", "Value"]],
        body: [
          ["Total Menu Items", dashboardData.menu.totalItems],
          ["Visible Items", dashboardData.menu.visibleItems],
          ["Hidden Items", dashboardData.menu.hiddenItems],
          ["Categories", dashboardData.menu.categoryCount],
          ["Popular Category", dashboardData.menu.popularCategory]
        ],
        theme: "grid",
        headStyles: { 
          fillColor: [59, 130, 246], 
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        margin: { horizontal: 14 }
      });

      doc.save("restaurant_dashboard_report.pdf");
      toast.success('PDF report downloaded successfully');
    } catch (error) {
      toast.error("Failed to generate PDF report");
    }
  };

  if (loading) return (
    <LoadingContainer>
      <CircularProgress size={60} thickness={4} />
      <Typography variant="h6" color="textSecondary">Loading dashboard...</Typography>
    </LoadingContainer>
  );

  if (error) return (
    <ErrorContainer>
      <Card sx={{ maxWidth: 500, textAlign: 'center', p: 3 }}>
        <Typography variant="h6" color="error" gutterBottom>
          Error Loading Dashboard
        </Typography>
        <Typography variant="body1" color="textSecondary" paragraph>
          {error}
        </Typography>
        <button 
          onClick={fetchDashboardData}
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

  // Sales Chart Data
  const salesChartData = {
    labels: dashboardData.sales.last7Days.map(day => day.date),
    datasets: [{
      label: 'Daily Revenue (Rs.)',
      data: dashboardData.sales.last7Days.map(day => day.revenue),
      backgroundColor: 'rgba(59, 130, 246, 0.2)',
      borderColor: 'rgba(59, 130, 246, 1)',
      borderWidth: 2,
      tension: 0.4,
      fill: true
    }]
  };

  const salesChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `Rs. ${context.raw.toFixed(2)}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0, 0, 0, 0.05)' },
        ticks: {
          callback: function(value) {
            return `Rs. ${value}`;
          }
        }
      },
      x: { grid: { display: false } }
    }
  };

  // Orders Chart Data
  const ordersChartData = {
    labels: dashboardData.orders.last7Days.map(day => day.date),
    datasets: [{
      label: 'Daily Orders',
      data: dashboardData.orders.last7Days.map(day => day.count),
      backgroundColor: 'rgba(16, 185, 129, 0.2)',
      borderColor: 'rgba(16, 185, 129, 1)',
      borderWidth: 2,
      tension: 0.4,
      fill: true
    }]
  };

  const ordersChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.raw} orders`;
          }
        }
      }
    },
    scales: {
      y: { 
        beginAtZero: true,
        grid: { color: 'rgba(0, 0, 0, 0.05)' },
        ticks: { precision: 0 }
      },
      x: { grid: { display: false } }
    }
  };

  // Menu Category Distribution
  const menuCategoryData = {
    labels: Object.keys(dashboardData.menu.categoryDistribution),
    datasets: [{
      data: Object.values(dashboardData.menu.categoryDistribution),
      backgroundColor: ['#3b82f6', '#06b6d4', '#8b5cf6', '#ec4899', '#f97316'],
      borderWidth: 1,
    }],
  };

  const menuCategoryOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          boxWidth: 12,
          padding: 20,
          font: { size: 12 }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.label}: ${context.raw} items`;
          }
        }
      }
    }
  };

  return (
    <DashboardContainer>
      <HeaderContainer>
        <Title variant="h4">Restaurant Management Dashboard</Title>
        <ExportButtons>
          <ExportButton className="excel" onClick={exportToExcel}>
            <FaFileExcel /> Export to Excel
          </ExportButton>
          <ExportButton className="pdf" onClick={exportToPDF}>
            <FaFilePdf /> Export to PDF
          </ExportButton>
        </ExportButtons>
      </HeaderContainer>

      {/* Summary Stats */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Sales Stats */}
        <Grid item xs={12} md={6} lg={3}>
          <StatCard onClick={() => navigate('/sales')}>
            <CardHeader 
              title="Total Revenue" 
              avatar={<FcSalesPerformance size={24} />}
            />
            <CardContent>
              <StatValue>Rs. {dashboardData.sales.totalRevenue.toFixed(2)}</StatValue>
              <StatChange className={dashboardData.sales.revenueChange >= 0 ? 'positive' : 'negative'}>
                <FiTrendingUp />
                {dashboardData.sales.revenueChange}% from last month
              </StatChange>
            </CardContent>
          </StatCard>
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <StatCard onClick={() => navigate('/sales')}>
            <CardHeader 
              title="Today's Revenue" 
              avatar={<FaMoneyBillWave size={20} color="#3B82F6" />}
            />
            <CardContent>
              <StatValue>Rs. {dashboardData.sales.todayRevenue.toFixed(2)}</StatValue>
              <StatChange className={dashboardData.sales.todayRevenue >= dashboardData.sales.yesterdayRevenue ? 'positive' : 'negative'}>
                {dashboardData.sales.todayRevenue >= dashboardData.sales.yesterdayRevenue ? '↑' : '↓'} 
                {Math.abs(((dashboardData.sales.todayRevenue - dashboardData.sales.yesterdayRevenue) / dashboardData.sales.yesterdayRevenue * 100).toFixed(1))}% from yesterday
              </StatChange>
            </CardContent>
          </StatCard>
        </Grid>

        {/* Orders Stats */}
        <Grid item xs={12} md={6} lg={3}>
          <StatCard onClick={() => navigate('/orders')}>
            <CardHeader 
              title="Total Orders" 
              avatar={<FiShoppingCart size={20} color="#10B981" />}
            />
            <CardContent>
              <StatValue>{dashboardData.orders.totalOrders}</StatValue>
              <StatChange className={dashboardData.orders.orderChange >= 0 ? 'positive' : 'negative'}>
                <FiTrendingUp />
                {dashboardData.orders.orderChange}% from last month
              </StatChange>
            </CardContent>
          </StatCard>
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <StatCard onClick={() => navigate('/orders')}>
            <CardHeader 
              title="Today's Orders" 
              avatar={<FiClock size={20} color="#F59E0B" />}
            />
            <CardContent>
              <StatValue>{dashboardData.orders.todayOrders}</StatValue>
              <StatChange className={dashboardData.orders.todayOrders >= dashboardData.orders.yesterdayOrders ? 'positive' : 'negative'}>
                {dashboardData.orders.todayOrders >= dashboardData.orders.yesterdayOrders ? '↑' : '↓'} 
                {Math.abs(((dashboardData.orders.todayOrders - dashboardData.orders.yesterdayOrders) / dashboardData.orders.yesterdayOrders * 100).toFixed(1))}% from yesterday
              </StatChange>
            </CardContent>
          </StatCard>
        </Grid>
      </Grid>

      {/* Second Row Stats */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Customers Stats */}
        <Grid item xs={12} md={4}>
          <StatCard onClick={() => navigate('/customers')}>
            <CardHeader 
              title="Total Customers" 
              avatar={<FaUsers size={20} color="#8B5CF6" />}
            />
            <CardContent>
              <StatValue>{dashboardData.customers.totalCustomers}</StatValue>
              <StatChange className="positive">
                +{dashboardData.customers.newCustomersThisMonth} this month
              </StatChange>
            </CardContent>
          </StatCard>
        </Grid>

        <Grid item xs={12} md={4}>
          <StatCard onClick={() => navigate('/customers')}>
            <CardHeader 
              title="Customer Rating" 
              avatar={<FcRating size={24} />}
            />
            <CardContent>
              <StatValue>{dashboardData.customers.averageRating.toFixed(1)}/5</StatValue>
              <StatChange className={dashboardData.customers.ratingChange >= 0 ? 'positive' : 'negative'}>
                {dashboardData.customers.ratingChange >= 0 ? '↑' : '↓'} 
                {Math.abs(dashboardData.customers.ratingChange)} from last month
              </StatChange>
            </CardContent>
          </StatCard>
        </Grid>

        {/* Menu Stats */}
        <Grid item xs={12} md={4}>
          <StatCard onClick={() => navigate('/menu')}>
            <CardHeader 
              title="Menu Items" 
              avatar={<FaUtensils size={20} color="#EC4899" />}
            />
            <CardContent>
              <StatValue>{dashboardData.menu.totalItems}</StatValue>
              <Box display="flex" justifyContent="space-between" mt={1}>
                <Typography variant="body2" color="text.secondary">
                  <span style={{ color: '#10B981' }}>{dashboardData.menu.visibleItems}</span> visible
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <span style={{ color: '#F59E0B' }}>{dashboardData.menu.hiddenItems}</span> hidden
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <span style={{ color: '#8B5CF6' }}>{dashboardData.menu.categoryCount}</span> categories
                </Typography>
              </Box>
            </CardContent>
          </StatCard>
        </Grid>
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <ChartCard>
            <CardHeader title="7-Day Revenue Trend" />
            <CardContent>
              <ChartContainer>
                <Line data={salesChartData} options={salesChartOptions} />
              </ChartContainer>
            </CardContent>
          </ChartCard>
        </Grid>

        <Grid item xs={12} md={6}>
          <ChartCard>
            <CardHeader title="7-Day Orders Trend" />
            <CardContent>
              <ChartContainer>
                <Line data={ordersChartData} options={ordersChartOptions} />
              </ChartContainer>
            </CardContent>
          </ChartCard>
        </Grid>
      </Grid>

      {/* Bottom Row */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={5}>
          <ChartCard>
            <CardHeader title="Menu Category Distribution" />
            <CardContent>
              <ChartContainer>
                <Pie data={menuCategoryData} options={menuCategoryOptions} />
              </ChartContainer>
            </CardContent>
          </ChartCard>
        </Grid>

        <Grid item xs={12} md={7}>
          <RecentItemsCard>
            <CardHeader title="Recent Orders" subheader={`Last ${dashboardData.recentOrders.length} orders`} />
            <CardContent>
              {dashboardData.recentOrders.map((order) => (
                <RecentItem key={order._id} onClick={() => navigate(`/orders/${order._id}`)}>
                  <div className="item-image">
                    {order.items.length > 0 && order.items[0].image ? (
                      <img src={order.items[0].image} alt={order.items[0].name} />
                    ) : (
                      <FiShoppingCart size={24} />
                    )}
                  </div>
                  <div className="item-details">
                    <h3>Order #{order.orderNumber}</h3>
                    <div className="category">
                      {order.items.length} item{order.items.length !== 1 ? 's' : ''} • {order.status}
                    </div>
                    <div className="price">Rs. {order.totalAmount.toFixed(2)}</div>
                  </div>
                  <FiChevronRight className="item-arrow" size={20} />
                </RecentItem>
              ))}
            </CardContent>
          </RecentItemsCard>
        </Grid>
      </Grid>
    </DashboardContainer>
  );
};

export default RestaurantDashboard;