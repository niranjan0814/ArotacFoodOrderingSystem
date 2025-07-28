import React, { useState } from 'react';
import { Typography, Card, CardContent, TextField } from '@mui/material';
import './ItemsPopup.css';

function ItemsPopup({ items, title, onClose }) {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter items based on search term
  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.recommendedItems && item.recommendedItems.some(rec => 
      rec.name.toLowerCase().includes(searchTerm.toLowerCase())
    ))
  );

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
          placeholder="Search items..."
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
              <Card key={item._id} className="hover:bg-gray-50">
                <CardContent className="flex items-start p-3">
                  {item.imageUrl ? (
                    <img 
                      src={item.imageUrl} 
                      alt={item.name} 
                      className="w-16 h-16 object-cover rounded-md mr-4"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-200 rounded-md mr-4 flex items-center justify-center">
                      <span className="text-gray-400">No Image</span>
                    </div>
                  )}
                  <div className="flex-grow">
                    <Typography variant="h6" className="font-medium">{item.name}</Typography>
                    <Typography variant="body2" className="text-gray-500">{item.category}</Typography>
                    <Typography variant="body2" className="font-semibold">Rs. {item.price}</Typography>
                    
                    {/* Show recommendations if they exist */}
                    {item.recommendedItems && item.recommendedItems.length > 0 && (
                      <div className="mt-2">
                        <Typography variant="body2" className="text-gray-600">
                          Recommended with:
                        </Typography>
                        <ul className="list-disc pl-5">
                          {item.recommendedItems.map(rec => (
                            <li key={rec._id}>
                              <Typography variant="body2">{rec.name}</Typography>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
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