// import mongoose from "mongoose";

// const messageSchema = new mongoose.Schema({
//   senderId: String,         // Sender's ID (Delivery Person ID)
//   senderName: String,       // Sender's name
//   recipientId: String,      // Recipient's ID (Manager/Customer ID)
//   content: String,          // Message content
//   timestamp: Date,          // Message timestamp (changed to Date type)
//   recipientType: String,    // "manager", "customer", or "deliveryPerson"
//   read: Boolean,            // Whether the message has been read
// });

// // Add indexes for better query performance
// messageSchema.index({ senderId: 1, recipientType: 1 });
// messageSchema.index({ recipientId: 1, recipientType: 1 });

// const Message = mongoose.model("Message", messageSchema);

import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema({
  senderId: { type: String, required: true },
  senderName: { type: String, required: true },
  recipientId: { type: String, required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, required: true, default: Date.now }, // Add default timestamp
  recipientType: { type: String, required: true },
  senderType: { type: String, required: true }, // Add senderType
  read: { type: Boolean, default: false },
});

const Message = mongoose.model("Message", MessageSchema);
export default Message;