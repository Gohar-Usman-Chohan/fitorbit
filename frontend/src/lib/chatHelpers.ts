/** Normalize a user/message id whether stored as string or populated document. */
export function normalizeId(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'object') {
    const obj = value as { _id?: unknown; id?: unknown };
    return String(obj._id ?? obj.id ?? '');
  }
  return String(value);
}

export function mapApiMessage(msg: any) {
  const senderId = normalizeId(msg.senderId);
  return {
    ...msg,
    id: msg.id || msg._id?.toString?.() || msg._id,
    _id: msg._id || msg.id,
    senderId,
    content: msg.messageContent || msg.content,
  };
}

export function isOwnMessage(message: { senderId?: unknown }, currentUserId?: unknown) {
  if (!currentUserId) return false;
  return normalizeId(message.senderId) === normalizeId(currentUserId);
}

export function appendMessageDeduped(prev: any[], incoming: any) {
  const normalized = mapApiMessage(incoming);
  const incomingId = normalizeId(normalized._id || normalized.id);
  if (incomingId && prev.some((m) => normalizeId(m._id || m.id) === incomingId)) {
    return prev;
  }
  return [...prev, normalized];
}
