import React, { useState } from 'react';
import './ItemsPopup.css';
import { 
    Typography, 
    Card, 
    CardContent, 
    TextField,
    Chip // Add this import
  } from '@mui/material';

function ItemsPopup({ items, title, onClose }) {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter items based on search term
  const filteredItems = items.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    return (
      item.name.toLowerCase().includes(searchLower) ||
      (item.description && item.description.toLowerCase().includes(searchLower)) ||
      (item.offerType && item.offerType.toLowerCase().includes(searchLower)) ||
      (item.festivalName && item.festivalName.toLowerCase().includes(searchLower)) ||
      (item.comboItems && item.comboItems.some(i => i.name.toLowerCase().includes(searchLower))))});
;

  return (
    <div className="items-popup-overlay">
      <div className="items-popup-content">
        <div className="flex justify-between items-center mb-4">
          <Typography variant="h5" className="font-bold">
            {title} ({filteredItems.length} of {items.length})
          </Typography>
          <button onClick={onClose} className="text-xl">×</button>
        </div>
        
        {/* Search input */}
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search offers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mb-4"
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '8px',
            }
          }}
        />
        
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => (
              <Card key={item._id || item.name} className="hover:bg-gray-50">
                <CardContent className="p-3">
                  <div className="flex items-start">
                    {item.image && (
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        className="w-16 h-16 object-cover rounded-md mr-4"
                      />
                    )}
                    <div className="flex-grow">
                      <div className="flex justify-between items-start">
                        <Typography variant="h6" className="font-medium">{item.name}</Typography>
                        <Chip 
                          label={item.offerType} 
                          color={
                            item.offerType === 'delivery' ? 'primary' : 
                            item.offerType === 'combo' ? 'success' : 'warning'
                          } 
                          size="small"
                        />
                      </div>
                      
                      <Typography variant="body2" className="text-gray-500 mb-2">
                        {new Date(item.startDate).toLocaleDateString()} - {new Date(item.endDate).toLocaleDateString()}
                      </Typography>
                      
                      <Typography variant="body2" className="mb-2">{item.description}</Typography>
                      
                      {item.discountValue && (
                        <Typography variant="body2" className="font-semibold">
                          Discount: {item.discountValue}{item.discountType === 'percentage off' ? '%' : ' LKR'}
                        </Typography>
                      )}
                      
                      {item.comboPrice && (
                        <Typography variant="body2" className="font-semibold">
                          Combo Price: Rs. {item.comboPrice}
                        </Typography>
                      )}
                      
                      {item.comboItems && item.comboItems.length > 0 && (
                        <div className="mt-2">
                          <Typography variant="body2" className="text-gray-600">
                            Combo Items:
                          </Typography>
                          <ul className="list-disc pl-5">
                            {item.comboItems.map((item, idx) => (
                              <li key={idx}>
                                <Typography variant="body2">{item.name} (Rs. {item.price})</Typography>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Typography variant="body1" className="text-center py-4 text-gray-500">
              No items found matching your search
            </Typography>
          )}
        </div>
      </div>
    </div>
  );
}

export default ItemsPopup;