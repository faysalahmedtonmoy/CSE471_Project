import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema(
  {
    conversationId: { type: String, required: true, index: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    messageType: {
      type: String,
      enum: ['text', 'image', 'file', 'location'],
      default: 'text'
    },
    attachments: [{
      filename: { type: String },
      url: { type: String },
      fileType: { type: String },
      size: { type: Number }
    }],
    status: {
      type: String,
      enum: ['sent', 'delivered', 'read'],
      default: 'sent'
    },
    readAt: { type: Date },
    deliveredAt: { type: Date },
    isTyping: { type: Boolean, default: false },
    replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  },
  { timestamps: true }
);

// Index for efficient querying
MessageSchema.index({ conversationId: 1, createdAt: -1 });
MessageSchema.index({ senderId: 1, receiverId: 1 });

const Message = mongoose.models.Message || mongoose.model('Message', MessageSchema);
export default Message;