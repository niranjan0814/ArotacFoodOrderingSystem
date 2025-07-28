import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  FcSalesPerformance, FcCalendar, FcExpired, FcApproval 
} from "react-icons/fc";
import { 
  FaPercentage, FaMoneyBillWave, FaGift, FaMotorcycle, FaFileExcel, FaFilePdf 
} from "react-icons/fa";
import { 
  Card, CardContent, CardHeader, Typography, Chip, Alert, CircularProgress 
} from '@mui/material';
import { Pie, Bar, Line, Scatter } from 'react-chartjs-2';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from "xlsx";
import { 
  Chart as ChartJS, 
  ArcElement, BarElement, LineElement, PointElement, 
  CategoryScale, LinearScale, Tooltip, Legend, TimeScale 
} from 'chart.js';
import styled from '@emotion/styled';
import ItemsPopup from './ItemsPopup';
import 'chartjs-adapter-date-fns';

// Register ChartJS components
ChartJS.register(
  ArcElement, BarElement, LineElement, PointElement,
  CategoryScale, LinearScale, Tooltip, Legend, TimeScale
);

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

const AlertContainer = styled.div`
  margin-bottom: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

// ========== MAIN COMPONENT ========== //
const OfferAnalytics = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showItemsPopup, setShowItemsPopup] = useState(false);
  const [popupItems, setPopupItems] = useState([]);
  const [popupTitle, setPopupTitle] = useState('');

  const fetchAnalyticsData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication required');

      const response = await axios.get('http://localhost:5000/api/offer/analytics/offer-analytics', {
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

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const showItems = (items, title) => {
    if (!items || items.length === 0) {
      toast.info(`No ${title.toLowerCase()} found`);
      return;
    }
    
    setPopupItems(items);
    setPopupTitle(title);
    setShowItemsPopup(true);
  };

  if (loading) return (
    <LoadingContainer>
      <CircularProgress size={60} thickness={4} />
      <Typography variant="h6" color="textSecondary">Loading offer analytics...</Typography>
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

  if (!analyticsData) return null;

  // Chart Data
  const offerTypeData = {
    labels: Object.keys(analyticsData.stats.offerTypes),
    datasets: [{
      data: Object.values(analyticsData.stats.offerTypes),
      backgroundColor: ['#3b82f6', '#10b981', '#f59e0b'],
      borderWidth: 1,
    }],
  };

  const discountRangeData = {
    labels: Object.keys(analyticsData.discountRanges),
    datasets: [{
      label: 'Number of Offers',
      data: Object.values(analyticsData.discountRanges),
      backgroundColor: '#3b82f6',
      borderWidth: 1,
      borderRadius: 4,
    }],
  };

  // Prepare data for timeline chart
  const timelineData = {
    datasets: analyticsData.allOffers.map(offer => ({
      label: offer.name,
      data: [{
        x: new Date(offer.startDate),
        y: 1
      }, {
        x: new Date(offer.endDate),
        y: 1
      }],
      borderColor: offer.offerType === 'delivery' ? '#3b82f6' : 
                  offer.offerType === 'combo' ? '#10b981' : '#f59e0b',
      backgroundColor: offer.offerType === 'delivery' ? '#3b82f6' : 
                     offer.offerType === 'combo' ? '#10b981' : '#f59e0b',
      borderWidth: 2,
      pointRadius: 5
    }))
  };

  // Prepare data for combo offers scatter plot
  const comboOffers = analyticsData.allOffers.filter(o => o.offerType === 'combo');
  const scatterData = {
    datasets: [{
      label: 'Combo Offers',
      data: comboOffers.map(offer => ({
        x: offer.comboPrice,
        y: offer.comboItems.reduce((sum, item) => sum + item.price, 0) - offer.comboPrice,
        offer: offer
      })),
      backgroundColor: '#10b981',
    }]
  };

  // Stats Configuration
  const stats = [
    { 
      title: 'Total Offers', 
      value: analyticsData.stats.totalOffers, 
      icon: <FcSalesPerformance size={24} />, 
      color: 'bg-blue-100',
      onClick: () => showItems(analyticsData.allOffers, 'All Offers')
    },
    { 
      title: 'Active Offers', 
      value: analyticsData.stats.activeOffers, 
      icon: <FcApproval size={24} />, 
      color: 'bg-green-100',
      onClick: () => showItems(analyticsData.activeOffers, 'Active Offers')
    },
    { 
      title: 'Expired Offers', 
      value: analyticsData.stats.expiredOffers, 
      icon: <FcExpired size={24} />, 
      color: 'bg-red-100',
      onClick: () => showItems(analyticsData.expiredOffers, 'Expired Offers')
    },
    { 
      title: 'Upcoming Offers', 
      value: analyticsData.stats.upcomingOffers, 
      icon: <FcCalendar size={24} />, 
      color: 'bg-yellow-100',
      onClick: () => showItems(analyticsData.upcomingOffers, 'Upcoming Offers')
    },
    { 
      title: 'Max Discount', 
      value: `Rs. ${analyticsData.stats.maxDiscount.value}`, 
      icon: <FaPercentage size={20} className="text-indigo-600" />, 
      color: 'bg-indigo-100',
      onClick: () => analyticsData.stats.maxDiscount.offer && 
        showItems([analyticsData.stats.maxDiscount.offer], 'Max Discount Offer')
    },
    { 
      title: 'Soon to Expire', 
      value: analyticsData.soonToExpire.length, 
      icon: <FaMoneyBillWave size={20} className="text-orange-600" />, 
      color: 'bg-orange-100',
      onClick: () => showItems(analyticsData.soonToExpire, 'Offers Expiring Soon')
    }
  ];

  // Export Functions
  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet([{
      "Total Offers": analyticsData.stats.totalOffers,
      "Active Offers": analyticsData.stats.activeOffers,
      "Expired Offers": analyticsData.stats.expiredOffers,
      "Upcoming Offers": analyticsData.stats.upcomingOffers,
      "Max Discount": `Rs. ${analyticsData.stats.maxDiscount.value}`,
    }]);

    XLSX.utils.sheet_add_json(worksheet, Object.entries(analyticsData.stats.offerTypes).map(([type, count]) => ({ Type: type, Count: count })), { skipHeader: true, origin: -1 });
    XLSX.utils.sheet_add_json(worksheet, Object.entries(analyticsData.discountRanges).map(([range, count]) => ({ "Discount Range": range, "Offer Count": count })), { skipHeader: true, origin: -1 });
    XLSX.utils.sheet_add_json(worksheet, analyticsData.allOffers.map(offer => ({
      Name: offer.name,
      Type: offer.offerType,
      "Start Date": new Date(offer.startDate).toLocaleDateString(),
      "End Date": new Date(offer.endDate).toLocaleDateString(),
      Status: new Date() > new Date(offer.endDate) ? 'Expired' : 
             new Date() < new Date(offer.startDate) ? 'Upcoming' : 'Active',
      "Discount Value": offer.discountValue,
      "Discount Type": offer.discountType
    })), { skipHeader: true, origin: -1 });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Offer Analytics");
    XLSX.writeFile(workbook, "offer_analytics.xlsx");
    toast.success('Excel report downloaded successfully');
  };

  const exportToPDF = () => {
    try {
      const doc = new jsPDF({ orientation: "landscape" });
      
      // Title
      doc.setFontSize(18);
      doc.setTextColor(59, 130, 246);
      doc.text("Offer Analytics Dashboard", 14, 15);
      
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

      // Offer type distribution
      doc.setFontSize(14);
      doc.setTextColor(59, 130, 246);
      doc.text("Offer Type Distribution", 14, doc.lastAutoTable.finalY + 15);
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 20,
        head: [["Type", "Count", "Percentage"]],
        body: Object.entries(analyticsData.stats.offerTypes).map(([type, count]) => [
          type, 
          count,
          `${((count / analyticsData.stats.totalOffers) * 100).toFixed(1)}%`
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

      // Discount distribution
      doc.text("Discount Range Distribution", 14, doc.lastAutoTable.finalY + 15);
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 20,
        head: [["Discount Range", "Offer Count", "Percentage"]],
        body: Object.entries(analyticsData.discountRanges).map(([range, count]) => [
          range, 
          count,
          `${((count / analyticsData.stats.totalOffers) * 100).toFixed(1)}%`
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

      // All offers
      doc.text("All Offers", 14, doc.lastAutoTable.finalY + 15);
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 20,
        head: [["Name", "Type", "Start Date", "End Date", "Status", "Discount"]],
        body: analyticsData.allOffers.map(offer => [
          offer.name,
          offer.offerType,
          new Date(offer.startDate).toLocaleDateString(),
          new Date(offer.endDate).toLocaleDateString(),
          new Date() > new Date(offer.endDate) ? 'Expired' : 
          new Date() < new Date(offer.startDate) ? 'Upcoming' : 'Active',
          `${offer.discountValue}${offer.discountType === 'percentage off' ? '%' : ' LKR'}`
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

      doc.save("offer_analytics_report.pdf");
      toast.success('PDF report downloaded successfully');
    } catch (error) {
      toast.error("Failed to generate PDF report");
    }
  };

  return (
    <DashboardContainer>
      <HeaderContainer>
        <Title variant="h4">Offer Analytics Dashboard</Title>
        <ExportButtons>
          <ExportButton className="excel" onClick={exportToExcel}>
            <FaFileExcel /> Export to Excel
          </ExportButton>
          <ExportButton className="pdf" onClick={exportToPDF}>
            <FaFilePdf /> Export to PDF
          </ExportButton>
        </ExportButtons>
      </HeaderContainer>

      {/* Warnings Section */}
      <AlertContainer>
        {analyticsData.soonToExpire.length > 0 && (
          <Alert severity="warning" icon={false}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FcExpired size={24} />
              <span>
                {analyticsData.soonToExpire.length} offer{analyticsData.soonToExpire.length > 1 ? 's' : ''} will expire soon!
              </span>
            </div>
          </Alert>
        )}
        {analyticsData.highDiscountOffers.length > 0 && (
          <Alert severity="error" icon={false}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FaPercentage size={20} />
              <span>
                {analyticsData.highDiscountOffers.length} offer{analyticsData.highDiscountOffers.length > 1 ? 's' : ''} have discounts over 50% - please review!
              </span>
            </div>
          </Alert>
        )}
      </AlertContainer>

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
            title="Offer Type Distribution" 
            subheader="Click on a sector to view details"
          />
          <CardContent>
            <ChartContainer>
              <Pie 
                data={offerTypeData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
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
                          return `${context.label}: ${context.raw} offers (${((context.raw / analyticsData.stats.totalOffers) * 100).toFixed(1)}%)`;
                        }
                      }
                    }
                  }
                }}
              />
            </ChartContainer>
          </CardContent>
        </ChartCard>

        <ChartCard>
          <CardHeader 
            title="Discount Range Distribution" 
            subheader="Click on a bar to view details"
          />
          <CardContent>
            <ChartContainer>
              <Bar 
                data={discountRangeData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false
                    },
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          return `${context.raw} offers`;
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
                }}
              />
            </ChartContainer>
          </CardContent>
        </ChartCard>
      </ChartGrid>

      <ChartGrid>
        <ChartCard>
          <CardHeader 
            title="Offer Timeline" 
            subheader="Visualization of all offers' duration"
          />
          <CardContent>
            <ChartContainer>
              <Line 
                data={timelineData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    x: {
                      type: 'time',
                      time: {
                        unit: 'day'
                      },
                      title: {
                        display: true,
                        text: 'Date'
                      }
                    },
                    y: {
                      display: false
                    }
                  },
                  plugins: {
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          const offer = analyticsData.allOffers.find(o => o.name === context.dataset.label);
                          return [
                            `Name: ${offer.name}`,
                            `Type: ${offer.offerType}`,
                            `Start: ${new Date(offer.startDate).toLocaleDateString()}`,
                            `End: ${new Date(offer.endDate).toLocaleDateString()}`,
                            `Status: ${new Date() > new Date(offer.endDate) ? 'Expired' : 
                                     new Date() < new Date(offer.startDate) ? 'Upcoming' : 'Active'}`
                          ];
                        }
                      }
                    }
                  }
                }}
              />
            </ChartContainer>
          </CardContent>
        </ChartCard>

        {comboOffers.length > 0 && (
          <ChartCard>
            <CardHeader 
              title="Combo Offers Value Analysis" 
              subheader="Original price vs discounted price"
            />
            <CardContent>
              <ChartContainer>
                <Scatter 
                  data={scatterData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      x: {
                        title: {
                          display: true,
                          text: 'Combo Price (LKR)'
                        }
                      },
                      y: {
                        title: {
                          display: true,
                          text: 'Discount Amount (LKR)'
                        }
                      }
                    },
                    plugins: {
                      tooltip: {
                        callbacks: {
                          label: (context) => {
                            const offer = context.raw.offer;
                            return [
                              `Name: ${offer.name}`,
                              `Price: ${offer.comboPrice} LKR`,
                              `Discount: ${offer.discountValue}${offer.discountType === 'percentage off' ? '%' : ' LKR'}`,
                              `Items: ${offer.comboItems.map(i => i.name).join(', ')}`
                            ];
                          }
                        }
                      }
                    }
                  }}
                />
              </ChartContainer>
            </CardContent>
          </ChartCard>
        )}
      </ChartGrid>

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

export default OfferAnalytics;