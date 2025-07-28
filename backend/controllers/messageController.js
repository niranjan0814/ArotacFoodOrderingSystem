import Message from '../models/Message.js';

export const getConversation = async (req, res) => {
  try {
    const { managerId, deliveryPersonId } = req.query;
    console.log("Fetching conversation with params:", { managerId, deliveryPersonId });

    if (!managerId || !deliveryPersonId) {
      return res.status(400).json({ error: "Missing managerId or deliveryPersonId" });
    }

    const messages = await Message.find({
      $or: [
        { senderId: managerId, recipientId: deliveryPersonId },
        { senderId: deliveryPersonId, recipientId: managerId },
      ],
    }).sort({ timestamp: 1 });

    console.log("Fetched messages:", messages);
    res.status(200).json(messages);
  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const messageData = req.body;
    console.log("Saving message:", messageData);
    const message = new Message(messageData);
    await message.save();
    res.status(201).json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

export const markMessagesAsRead = async (req, res) => {
  try {
    const { userId, senderId, recipientType } = req.body;
    console.log("Marking messages as read:", { userId, senderId, recipientType });
    await Message.updateMany(
      { recipientId: userId, senderId, recipientType, read: false },
      { $set: { read: true } }
    );
    res.status(200).json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
};