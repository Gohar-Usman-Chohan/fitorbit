const mongoose = require('mongoose');
const Chat = require('../models/Chat');

const findConversationIdBetween = async (userA, userB) => {
  const idA = new mongoose.Types.ObjectId(String(userA));
  const idB = new mongoose.Types.ObjectId(String(userB));

  const existing = await Chat.findOne({
    $or: [
      { senderId: idA, receiverId: idB },
      { senderId: idB, receiverId: idA },
    ],
  })
    .sort({ createdAt: -1 })
    .select('conversationId');

  return existing?.conversationId?.toString() || null;
};

const buildExpertChatUrl = async ({ expertType, expertId, clientId }) => {
  const chatPath =
    expertType === 'nutritionist' ? '/nutritionist/chat' : '/trainer/chat';

  const conversationId = await findConversationIdBetween(expertId, clientId);
  const params = new URLSearchParams({ sessionReminder: '1' });

  if (conversationId) {
    params.set('conversationId', conversationId);
  } else {
    params.set('clientId', String(clientId));
  }

  return `${chatPath}?${params.toString()}`;
};

module.exports = {
  findConversationIdBetween,
  buildExpertChatUrl,
};
