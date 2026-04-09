const Notification = require('../models/Notification');
const mongoose = require('mongoose');

exports.getNotifications = async (req, res) => {
  try {
    // Security: Validate Auth Token Payload
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: 'Unauthorized access.' });
    }

    // Security: Prevent NoSQL Injection by strictly validating ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.user._id)) {
       return res.status(400).json({ success: false, message: 'Invalid user ID format.' });
    }

    // Security & Reliability: Broaden the query to catch schema type mismatches (String vs ObjectId)
    const query = {
      $or: [
        { userId: req.user._id },
        { userId: new mongoose.Types.ObjectId(req.user._id) }
      ]
    };
    if (req.user.email) {
      query.$or.push({ email: req.user.email });
    }

    // Performance: .lean() removes heavy Mongoose wrapper objects, limit(50) prevents memory bloat
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return res.status(200).json({
      success: true,
      data: notifications || []
    });
  } catch (error) {
    console.error('[GET NOTIFICATIONS ERROR]:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};