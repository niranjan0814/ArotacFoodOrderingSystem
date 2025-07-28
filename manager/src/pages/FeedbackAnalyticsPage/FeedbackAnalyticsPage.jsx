import { useState, useEffect } from "react";
import styled from "@emotion/styled";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import axios from "axios";
import { Card, CardHeader, CardContent, Typography, CircularProgress, Alert } from "@mui/material";
import { FiDownload, FiStar, FiMessageSquare, FiClock, FiTrendingUp } from "react-icons/fi";
import { FaRegStar, FaStar, FaStarHalfAlt } from "react-icons/fa";

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const AnalyticsContainer = styled.div`
  padding: 2rem;
  width: 1000px;
  margin: 5rem 5rem auto; /* Centered horizontally */
  padding: 3rem;
  background-color: #f8fafc;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding: 1rem;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
`;

const HeaderTitle = styled.h2`
  font-size: 1.8rem;
  font-weight: 700;
  color: #2d3748;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;

  &:before {
    content: "";
    display: block;
    width: 4px;
    height: 24px;
    background-color: #3b82f6;
    border-radius: 2px;
  }
`;

const ExportButtons = styled.div`
  display: flex;
  gap: 1rem;
`;

const ExportButton = styled.button`
  padding: 0.6rem 1.2rem;
  background-color: #f8fafc;
  color: #4a5568;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
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

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const StatCard = styled(Card)`
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border: none;
  overflow: hidden;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  }

  .MuiCardHeader-root {
    padding-bottom: 0;
    background-color: rgba(59, 130, 246, 0.05);
    border-bottom: 1px solid #e2e8f0;
  }

  .MuiCardHeader-title {
    font-size: 1.1rem;
    font-weight: 600;
    color: #4a5568;
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
  color: #2d3748 !important;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ChartCard = styled(Card)`
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  margin-bottom: 2rem;
  overflow: hidden;
  background: white;
`;

const ChartContainer = styled.div`
  height: 350px;
  padding: 1rem;
`;

const DataCard = styled(Card)`
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  margin-bottom: 2rem;
  overflow: hidden;
  background: white;
`;

const DataList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const DataListItem = styled.li`
  padding: 1rem;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: background-color 0.2s ease;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background-color: #f8fafc;
  }

  .item-name {
    font-weight: 500;
    color: #2d3748;
  }

  .item-value {
    font-weight: 600;
    color: #3b82f6;
  }
`;

const FeedbackItem = styled.li`
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  background-color: white;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }

  .feedback-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .feedback-user {
    font-weight: 600;
    color: #2d3748;
  }

  .feedback-rating {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    color: #f59e0b;
  }

  .feedback-comment {
    color: #4a5568;
    margin: 0.75rem 0;
    line-height: 1.5;
  }

  .feedback-reply {
    padding: 0.75rem;
    background-color: #f0fdf4;
    border-left: 3px solid #10b981;
    border-radius: 0 4px 4px 0;
    margin-top: 0.75rem;
    color: #065f46;

    &.no-reply {
      background-color: #fef2f2;
      border-left-color: #ef4444;
      color: #991b1b;
    }
  }

  .feedback-date {
    font-size: 0.875rem;
    color: #64748b;
    margin-top: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
  flex-direction: column;
  gap: 1rem;
`;

const ErrorContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
`;

const renderStars = (rating) => {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;

  for (let i = 1; i <= 5; i++) {
    if (i <= fullStars) {
      stars.push(<FaStar key={i} />);
    } else if (i === fullStars + 1 && hasHalfStar) {
      stars.push(<FaStarHalfAlt key={i} />);
    } else {
      stars.push(<FaRegStar key={i} />);
    }
  }

  return stars;
};

function FeedbackAnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:5000/api/feedback/analytics");
      setAnalyticsData(response.data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (loading) return (
    <LoadingContainer>
      <CircularProgress size={60} />
      <Typography variant="h6" color="textSecondary">Loading analytics data...</Typography>
    </LoadingContainer>
  );

  if (error) return (
    <ErrorContainer>
      <Alert severity="error" sx={{ width: '100%', maxWidth: 600 }}>
        Error loading analytics: {error}
      </Alert>
    </ErrorContainer>
  );

  // Calculate analytics
  const overallAverageRating = analyticsData.overallAverageRating.toFixed(2);
  const averageRatingsPerItem = analyticsData.averageRatingsPerItem;
  const totalFeedbacks = analyticsData.totalFeedbacks;
  const feedbacksPerItem = analyticsData.feedbacksPerItem;
  const ratingsBreakdown = analyticsData.ratingsBreakdown;
  const recentFeedbacks = analyticsData.recentFeedbacks.slice(0, 5);
  const mostReviewedItems = analyticsData.mostReviewedItems.slice(0, 5);
  const pendingReplies = analyticsData.pendingReplies;

  // Chart Data for Ratings Breakdown
  const chartData = {
    labels: ["1 Star", "2 Stars", "3 Stars", "4 Stars", "5 Stars"],
    datasets: [
      {
        label: "Number of Ratings",
        data: [
          ratingsBreakdown[1] || 0,
          ratingsBreakdown[2] || 0,
          ratingsBreakdown[3] || 0,
          ratingsBreakdown[4] || 0,
          ratingsBreakdown[5] || 0,
        ],
        backgroundColor: [
          '#ef4444',
          '#f97316',
          '#f59e0b',
          '#84cc16',
          '#10b981'
        ],
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: { 
        display: true, 
        text: "Ratings Distribution", 
        font: { size: 16 },
        padding: { bottom: 20 }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.raw}`;
          }
        }
      }
    },
    scales: {
      y: { 
        beginAtZero: true, 
        title: { 
          display: true, 
          text: "Number of Ratings",
          font: { weight: 'bold' }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    },
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.setTextColor(59, 130, 246);
    doc.text("Feedback Analytics Report", 14, 15);

    // Add a decorative line
    doc.setDrawColor(59, 130, 246);
    doc.setLineWidth(0.5);
    doc.line(14, 20, 196, 20);

    doc.setFontSize(12);
    doc.setTextColor(100, 116, 139);
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, 30);

    autoTable(doc, {
      startY: 40,
      head: [["Metric", "Value"]],
      body: [
        ["Overall Average Rating", overallAverageRating],
        ["Total Feedbacks", totalFeedbacks],
        ["Pending Replies", pendingReplies],
      ],
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

    doc.setTextColor(59, 130, 246);
    doc.setFontSize(14);
    doc.text("Average Ratings Per Item", 14, doc.lastAutoTable.finalY + 15);
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 20,
      head: [["Menu Item", "Average Rating"]],
      body: averageRatingsPerItem.map((item) => [item.name, item.averageRating.toFixed(2)]),
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
        1: { halign: 'right' }
      }
    });

    doc.text("Feedbacks Per Item", 14, doc.lastAutoTable.finalY + 15);
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 20,
      head: [["Menu Item", "Feedback Count"]],
      body: feedbacksPerItem.map((item) => [item.name, item.count]),
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
        1: { halign: 'right' }
      }
    });

    doc.text("Most Reviewed Items", 14, doc.lastAutoTable.finalY + 15);
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 20,
      head: [["Menu Item", "Feedback Count"]],
      body: mostReviewedItems.map((item) => [item.name, item.count]),
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
        1: { halign: 'right' }
      }
    });

    doc.save("feedback_analytics_report.pdf");
  };

  const exportToExcel = () => {
    const workbook = XLSX.utils.book_new();
    
    // Summary sheet
    const summaryData = [
      ["Feedback Analytics Summary", "", ""],
      ["Generated on", new Date().toLocaleDateString(), ""],
      ["", "", ""],
      ["Metric", "Value", ""],
      ["Overall Average Rating", overallAverageRating, ""],
      ["Total Feedbacks", totalFeedbacks, ""],
      ["Pending Replies", pendingReplies, ""]
    ];
    
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");
    
    // Average Ratings sheet
    const ratingsData = [
      ["Menu Item", "Average Rating"],
      ...averageRatingsPerItem.map(item => [item.name, item.averageRating.toFixed(2)])
    ];
    const ratingsSheet = XLSX.utils.json_to_sheet(ratingsData, { skipHeader: true });
    XLSX.utils.book_append_sheet(workbook, ratingsSheet, "Average Ratings");
    
    // Feedback Counts sheet
    const countsData = [
      ["Menu Item", "Feedback Count"],
      ...feedbacksPerItem.map(item => [item.name, item.count])
    ];
    const countsSheet = XLSX.utils.json_to_sheet(countsData, { skipHeader: true });
    XLSX.utils.book_append_sheet(workbook, countsSheet, "Feedback Counts");
    
    // Recent Feedback sheet
    const feedbackData = [
      ["Name", "Rating", "Comment", "Reply", "Date"],
      ...recentFeedbacks.map(feedback => [
        feedback.name,
        feedback.rating,
        feedback.comment,
        feedback.reply || "N/A",
        new Date(feedback.createdAt).toLocaleDateString()
      ])
    ];
    const feedbackSheet = XLSX.utils.json_to_sheet(feedbackData, { skipHeader: true });
    XLSX.utils.book_append_sheet(workbook, feedbackSheet, "Recent Feedback");
    
    // Formatting
    workbook.Props = {
      Title: "Feedback Analytics Report",
      Author: "Restaurant Admin",
      CreatedDate: new Date()
    };
    
    XLSX.writeFile(workbook, "feedback_analytics_report.xlsx");
  };

  return (
    <AnalyticsContainer>
      <Header>
        <HeaderTitle>Feedback Analytics Dashboard</HeaderTitle>
        <ExportButtons>
          <ExportButton className="pdf" onClick={exportToPDF}>
            <FiDownload /> Export PDF
          </ExportButton>
          <ExportButton className="excel" onClick={exportToExcel}>
            <FiDownload /> Export Excel
          </ExportButton>
        </ExportButtons>
      </Header>

      <StatsGrid>
        <StatCard>
  <CardHeader 
    title="Overall Average Rating" 
    avatar={<FiStar size={24} color="#F59E0B" />}
  />
  <CardContent>
    <StatValue>
      {overallAverageRating}
      <div style={{ display: 'flex', gap: '2px', marginLeft: '8px' }}>
        {renderStars(parseFloat(overallAverageRating))}
      </div>
    </StatValue>
  </CardContent>
</StatCard>
        <StatCard>
          <CardHeader 
            title="Total Feedbacks" 
            avatar={<FiMessageSquare size={24} color="#3B82F6" />}
          />
          <CardContent>
            <StatValue>{totalFeedbacks}</StatValue>
          </CardContent>
        </StatCard>
        <StatCard>
          <CardHeader 
            title="Pending Replies" 
            avatar={<FiClock size={24} color="#EF4444" />}
          />
          <CardContent>
            <StatValue>{pendingReplies}</StatValue>
          </CardContent>
        </StatCard>
      </StatsGrid>

      <ChartCard>
        <CardHeader title="Ratings Distribution" />
        <CardContent>
          <ChartContainer>
            <Bar data={chartData} options={chartOptions} />
          </ChartContainer>
        </CardContent>
      </ChartCard>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <DataCard>
  <CardHeader 
    title="Top Rated Items" 
    avatar={<FiTrendingUp size={24} color="#10B981" />}
  />
  <CardContent>
    <DataList>
      {averageRatingsPerItem
        .sort((a, b) => b.averageRating - a.averageRating)
        .slice(0, 5)
        .map((item) => (
          <DataListItem key={item.foodId}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span className="item-name">{item.name}</span>
              <div style={{ display: 'flex', gap: '2px', marginTop: '4px' }}>
                {renderStars(item.averageRating)}
              </div>
            </div>
            <span className="item-value">{item.averageRating.toFixed(2)}</span>
          </DataListItem>
        ))}
    </DataList>
  </CardContent>
</DataCard>

       <DataCard>
  <CardHeader 
    title="Most Reviewed Items" 
    avatar={<FiMessageSquare size={24} color="#3B82F6" />}
  />
  <CardContent>
    <DataList>
      {mostReviewedItems.map((item) => (
        <DataListItem key={item.foodId}>
          <span className="item-name">{item.name}</span>
          <span className="item-value">{item.count} reviews</span>
        </DataListItem>
      ))}
    </DataList>
  </CardContent>
</DataCard>
      </div>

      <DataCard>
  <CardHeader 
    title="Recent Feedback" 
    avatar={<FiClock size={24} color="#6366F1" />}
  />
  <CardContent>
    <DataList>
      {recentFeedbacks.map((feedback) => (
        <FeedbackItem key={feedback._id}>
          <div className="feedback-header">
            <div className="feedback-user">{feedback.name}</div>
            <div style={{ display: 'flex', gap: '2px' }}>
              {renderStars(feedback.rating)}
            </div>
          </div>
          <div className="feedback-comment">{feedback.comment}</div>
          <div className={`feedback-reply ${!feedback.reply ? 'no-reply' : ''}`}>
            {feedback.reply || "No reply yet"}
          </div>
          <div className="feedback-date">
            <FiClock size={14} />
            {new Date(feedback.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </FeedbackItem>
      ))}
    </DataList>
  </CardContent>
</DataCard>
    </AnalyticsContainer>
  );
}

export default FeedbackAnalyticsPage;