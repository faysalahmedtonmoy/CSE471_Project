import mongoose from "mongoose";

const ConversationSchema = new mongoose.Schema(
  {
    participants: [{
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      joinedAt: { type: Date, default: Date.now },
      lastSeen: { type: Date, default: Date.now },
      isOnline: { type: Boolean, default: false }
    }],
    lastMessage: {
      messageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
      content: { type: String },
      senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      timestamp: { type: Date }
    },
    conversationType: {
      type: String,
      enum: ['direct', 'service_inquiry'],
      default: 'direct'
    },
    serviceContext: {
      serviceId: { type: mongoose.Schema.Types.ObjectId },
      serviceType: { type: String }, // 'listing', 'job', 'service', etc.
      serviceTitle: { type: String }
    },
    unreadCount: {
      type: Map,
      of: Number,
      default: new Map()
    },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

// Index for efficient querying
ConversationSchema.index({ 'participants.userId': 1 });
ConversationSchema.index({ updatedAt: -1 });

const Conversation = mongoose.models.Conversation || mongoose.model('Conversation', ConversationSchema);
export default Conversation;