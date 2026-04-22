import { Router } from 'express';
import Notification from '../models/Notification.js';

const router = Router();

// Get notifications for user
router.get('/', async (req, res) => {
  try {
    const userId = req.user.userId;

    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ notifications });
  } catch (error) {
    console.error('Notifications GET error:', error);
    res.status(500).json({ message: 'Unable to load notifications' });
  }
});

// Create notification (internal use)
router.post('/', async (req, res) => {
  try {
    const { userId, type, title, message, data = {} } = req.body;

    const notification = await Notification.create({
      userId,
      type,
      title,
      message,
      data
    });

    res.status(201).json({ notification });
  } catch (error) {
    console.error('Notification POST error:', error);
    res.status(500).json({ message: 'Unable to create notification' });
  }
});

// Mark notifications as read
router.put('/', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { notificationIds } = req.body;

    await Notification.updateMany(
      { _id: { $in: notificationIds }, userId },
      { read: true, readAt: new Date() }
    );

    res.json({ message: 'Notifications marked as read' });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ message: 'Unable to mark notifications as read' });
  }
});

export default router;