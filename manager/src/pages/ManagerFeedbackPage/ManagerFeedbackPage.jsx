import { useState, useEffect } from "react";
import styled from "@emotion/styled";
import { FiSearch, FiDownload, FiTrash2, FiEdit2, FiFilter } from "react-icons/fi";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import ConfirmationPopup from "./ConfirmationPopup";
import axios from "axios";

const FeedbackContainer = styled.div`
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
    content: "";
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

const FilterContainer = styled.div`
  position: relative;
  min-width: 200px;
`;

const FilterButton = styled.button`
  padding: 0.6rem 1rem 0.6rem 2.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.95rem;
  transition: all 0.2s ease;
  width: 100%;
  background-color: #f8fafc;
  text-align: left;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &:focus {
    outline: none;
    border-color: #c19755;
    box-shadow: 0 0 0 2px rgba(193, 151, 85, 0.2);
    background-color: white;
  }

  &:hover {
    background-color: #edf2f7;
    border-color: #cbd5e0;
  }
`;

const FilterIcon = styled.div`
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #718096;
`;

const FilterDropdown = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  background-color: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  max-height: 200px;
  overflow-y: auto;
  z-index: 10;
`;

const FilterOption = styled.div`
  padding: 0.6rem 1rem;
  cursor: pointer;
  font-size: 0.95rem;
  color: #4a5568;

  &:hover {
    background-color: #f8fafc;
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

const MenuItemBlock = styled.div`
  margin-bottom: 2rem;
  padding: 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background-color: #f8fafc;
`;

const MenuItemTitle = styled.h3`
  font-size: 1.5rem;
  color: #2d3748;
  margin: 0 0 1rem 0;
`;

const FeedbackCard = styled.div`
  padding: 1rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  margin-bottom: 1rem;
  background-color: white;
`;

const FeedbackContent = styled.div`
  margin-bottom: 0.5rem;
`;

const FeedbackImage = styled.img`
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 4px;
  margin-top: 0.5rem;
`;

const FeedbackDate = styled.p`
  color: #999;
  font-size: 0.9em;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
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

  &.reply {
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

const ReplyInput = styled.textarea`
  width: 100%;
  padding: 0.5rem;
  margin-top: 0.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  resize: vertical;
`;

const PopupOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const PopupContent = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 8px;
  text-align: center;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 1.5rem;
`;

const Button = styled.button`
  padding: 0.6rem 1.2rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.95rem;
  transition: all 0.2s ease;

  &.confirm {
    background-color: #28a745;
    color: white;

    &:hover {
      background-color: #218838;
    }
  }

  &.cancel {
    background-color: #edf2f7;
    color: #4a5568;

    &:hover {
      background-color: #e2e8f0;
    }
  }
`;

function ManagerFeedbackPage() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [filteredFeedbacks, setFilteredFeedbacks] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMenuItem, setSelectedMenuItem] = useState("All Items");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [showSubmitPopup, setShowSubmitPopup] = useState(false);
  const [feedbackToDelete, setFeedbackToDelete] = useState(null);
  const [feedbackToReply, setFeedbackToReply] = useState(null);
  const [replyText, setReplyText] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterFeedbacks();
  }, [feedbacks, searchTerm, selectedMenuItem]);

  const fetchData = async () => {
    try {
      const feedbackResponse = await axios.get("http://localhost:5000/api/feedback");
      setFeedbacks(feedbackResponse.data);

      const menuResponse = await axios.get("http://localhost:5000/api/menu");
      setMenuItems(menuResponse.data);

      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      setLoading(false);
    }
  };

  const filterFeedbacks = () => {
    let result = [...feedbacks];

    // Filter by search term (name, comment, or menu item name)
    if (searchTerm) {
      result = result.filter((feedback) => {
        const name = feedback.name || "";
        const comment = feedback.comment || "";
        const menuItem = menuItems.find((item) => item._id === feedback.foodId.toString());
        const menuItemName = menuItem ? menuItem.name : "Unknown Item";
        return (
          name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
          menuItemName.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }

    // Filter by selected menu item
    if (selectedMenuItem !== "All Items") {
      result = result.filter((feedback) => {
        const menuItem = menuItems.find((item) => item._id === feedback.foodId.toString());
        const menuItemName = menuItem ? menuItem.name : "Unknown Item";
        return menuItemName === selectedMenuItem;
      });
    }

    setFilteredFeedbacks(result);
  };

  const groupFeedbackByMenuItem = () => {
    const grouped = {};
    filteredFeedbacks.forEach((feedback) => {
      const menuItem = menuItems.find((item) => item._id === feedback.foodId.toString());
      const menuItemName = menuItem ? menuItem.name : "Unknown Item";
      if (!grouped[menuItemName]) {
        grouped[menuItemName] = [];
      }
      grouped[menuItemName].push(feedback);
    });
    return grouped;
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterSelect = (menuItemName) => {
    setSelectedMenuItem(menuItemName);
    setShowFilterDropdown(false);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Feedback List", 105, 15, { align: "center" });
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, 22, { align: "center" });

    const headers = [["Name", "Rating", "Comment", "Reply", "Created At"]];
    const data = filteredFeedbacks.map((feedback) => [
      feedback.name,
      feedback.rating,
      feedback.comment,
      feedback.reply || "N/A",
      new Date(feedback.createdAt).toLocaleDateString(),
    ]);

    autoTable(doc, {
      head: headers,
      body: data,
      startY: 30,
      styles: {
        halign: "center",
        cellPadding: 3,
        fontSize: 10,
      },
      headStyles: {
        fillColor: [193, 151, 85],
        textColor: [255, 255, 255],
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
    });

    doc.save("feedback_list.pdf");
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filteredFeedbacks.map((feedback) => ({
        Name: feedback.name,
        Rating: feedback.rating,
        Comment: feedback.comment,
        Reply: feedback.reply || "N/A",
        "Created At": new Date(feedback.createdAt).toLocaleDateString(),
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Feedback");
    XLSX.writeFile(workbook, "feedback_list.xlsx");
  };

  const handleDeleteClick = (feedback) => {
    setFeedbackToDelete(feedback);
    setShowDeletePopup(true);
  };

  const handleReplyClick = (feedback) => {
    setFeedbackToReply(feedback);
    setReplyText(feedback.reply || "");
    setShowSubmitPopup(true);
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`http://localhost:5000/api/feedback/${feedbackToDelete._id}`);
      setFeedbacks(feedbacks.filter((f) => f._id !== feedbackToDelete._id));
      setShowDeletePopup(false);
      setFeedbackToDelete(null);
    } catch (error) {
      console.error("Failed to delete feedback:", error);
    }
  };

  const cancelDelete = () => {
    setShowDeletePopup(false);
    setFeedbackToDelete(null);
  };

  const confirmSubmit = async () => {
    try {
      const response = await axios.put(
        `http://localhost:5000/api/feedback/reply/${feedbackToReply._id}`,
        { reply: replyText }
      );
      setFeedbacks(
        feedbacks.map((f) =>
          f._id === feedbackToReply._id ? response.data : f
        )
      );
      setShowSubmitPopup(false);
      setFeedbackToReply(null);
      setReplyText("");
    } catch (error) {
      console.error("Failed to update reply:", error);
    }
  };

  const cancelSubmit = () => {
    setShowSubmitPopup(false);
    setFeedbackToReply(null);
    setReplyText("");
  };

  const groupedFeedback = groupFeedbackByMenuItem();

  return (
    <FeedbackContainer>
      <Header>
        <Title>Manage Feedback</Title>
        <Controls>
          <SearchContainer>
            <SearchIcon>
              <FiSearch />
            </SearchIcon>
            <SearchInput
              type="text"
              placeholder="Search by name, comment, or menu item..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </SearchContainer>
          <FilterContainer>
            <FilterIcon>
              <FiFilter />
            </FilterIcon>
            <FilterButton onClick={() => setShowFilterDropdown(!showFilterDropdown)}>
              {selectedMenuItem}
            </FilterButton>
            {showFilterDropdown && (
              <FilterDropdown>
                <FilterOption onClick={() => handleFilterSelect("All Items")}>
                  All Items
                </FilterOption>
                {menuItems.map((item) => (
                  <FilterOption
                    key={item._id}
                    onClick={() => handleFilterSelect(item.name)}
                  >
                    {item.name}
                  </FilterOption>
                ))}
              </FilterDropdown>
            )}
          </FilterContainer>
          <ExportButtons>
            <ExportButton className="pdf" onClick={exportToPDF}>
              <FiDownload /> PDF
            </ExportButton>
            <ExportButton className="excel" onClick={exportToExcel}>
              <FiDownload /> Excel
            </ExportButton>
          </ExportButtons>
        </Controls>
      </Header>

      {loading ? (
        <div style={{ textAlign: "center" }}>Loading...</div>
      ) : Object.keys(groupedFeedback).length === 0 ? (
        <div style={{ textAlign: "center" }}>No feedback found</div>
      ) : (
        Object.keys(groupedFeedback).map((menuItemName) => (
          <MenuItemBlock key={menuItemName}>
            <MenuItemTitle>{menuItemName}</MenuItemTitle>
            {groupedFeedback[menuItemName].map((feedback) => (
              <FeedbackCard key={feedback._id}>
                <FeedbackContent>
                  <p><strong>By:</strong> {feedback.name}</p>
                  <p>
                    <strong>Rating:</strong>{" "}
                    {[...Array(5)].map((_, index) => (
                      <span
                        key={index}
                        className={`star ${index < feedback.rating ? "filled" : ""}`}
                        style={{
                          color: index < feedback.rating ? "#f39c12" : "#ccc",
                          fontSize: "20px",
                        }}
                      >
                        ★
                      </span>
                    ))}
                  </p>
                  <p><strong>Comment:</strong> {feedback.comment}</p>
                  {feedback.imageUrl && (
                    <FeedbackImage src={feedback.imageUrl} alt="Feedback" />
                  )}
                  <p><strong>Reply:</strong> {feedback.reply || "No reply"}</p>
                  <FeedbackDate>
                    {new Date(feedback.createdAt).toLocaleDateString()}
                  </FeedbackDate>
                </FeedbackContent>
                <ActionButtons>
                  <ActionButton
                    className="reply"
                    onClick={() => handleReplyClick(feedback)}
                  >
                    <FiEdit2 /> Reply
                  </ActionButton>
                  <ActionButton
                    className="delete"
                    onClick={() => handleDeleteClick(feedback)}
                  >
                    <FiTrash2 /> Delete
                  </ActionButton>
                </ActionButtons>
              </FeedbackCard>
            ))}
          </MenuItemBlock>
        ))
      )}

      {showDeletePopup && (
        <ConfirmationPopup
          message={`Are you sure you want to delete feedback from "${feedbackToDelete?.name}"?`}
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
        />
      )}

      {showSubmitPopup && feedbackToReply && (
        <PopupOverlay>
          <PopupContent>
            <h3>Reply to Feedback</h3>
            <p>Feedback by: {feedbackToReply.name}</p>
            <ReplyInput
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Enter your reply..."
            />
            <ButtonGroup>
              <Button className="confirm" onClick={confirmSubmit}>
                Submit
              </Button>
              <Button className="cancel" onClick={cancelSubmit}>
                Cancel
              </Button>
            </ButtonGroup>
          </PopupContent>
        </PopupOverlay>
      )}
    </FeedbackContainer>
  );
}

export default ManagerFeedbackPage;