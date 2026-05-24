import { normalizeId } from '@/lib/chatHelpers';

type Conversation = {
  id?: string;
  conversationId?: string;
  otherUserId?: string;
  clientName?: string;
  expertName?: string;
  otherUser?: {
    _id?: string;
    id?: string;
    firstName?: string;
    lastName?: string;
  };
};

export function findConversationByDeepLink(
  conversations: Conversation[],
  conversationId?: string | null,
  clientId?: string | null
): Conversation | null {
  if (conversationId) {
    const match = conversations.find(
      (c) => normalizeId(c.conversationId || c.id) === normalizeId(conversationId)
    );
    if (match) return match;
  }

  if (clientId) {
    const match = conversations.find(
      (c) => normalizeId(c.otherUserId) === normalizeId(clientId)
    );
    if (match) return match;
  }

  return null;
}

export function buildClientConversationStub(client: {
  _id?: string;
  id?: string;
  firstName?: string;
  lastName?: string;
}): Conversation {
  const clientId = String(client._id || client.id || '');
  const clientName = `${client.firstName || ''} ${client.lastName || ''}`.trim() || 'Client';

  return {
    otherUserId: clientId,
    clientName,
    expertName: clientName,
    otherUser: client,
  };
}
