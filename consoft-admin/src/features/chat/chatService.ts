import { API } from '../../config';
import { OrdersApi } from '../../api/client';

function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

function generateAvatarColor(email: string): string {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#FFD93D', '#6BCB77', '#4D96FF',
    '#FF6B9D', '#C44569', '#F8B195', '#F67280', '#355C7D'
  ];
  
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = email.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
}

export type Conversation = {
  id: string;
  title: string;
  email?: string;
  avatarInitials?: string;
  avatarColor?: string;
  lastMessage?: string;
  updatedAt?: string;
};

export async function listAdminConversations(): Promise<Conversation[]> {
  if (!API) return [];
  // Queremos UN chat por usuario → rooms dm:<email>
  const emailToConv: Record<string, Conversation> = {};
  const pushUser = (u: any) => {
    const email = (u?.email || '').toLowerCase();
    if (!email) return;
    if (!emailToConv[email]) {
      const name = u?.name || u?.fullName || u?.email;
      const initials = getInitials(name);
      const color = generateAvatarColor(email);
      
      emailToConv[email] = {
        id: `dm:${email}`,
        title: name,
        email: email,
        avatarInitials: initials,
        avatarColor: color,
        lastMessage: undefined,
        updatedAt: undefined,
      };
    }
  };
  try {
    // 1) Usuarios (asegura lista base)
    const resUsers = await fetch(`${API}/api/users`, { credentials: 'include' as any } as RequestInit);
    if (resUsers.ok) {
      const data: any = await resUsers.json().catch(() => ({}));
      const list: any[] = data?.users || data || [];
      list.forEach(pushUser);
    }
  } catch {}
  try {
    // 2) Conversaciones de cotizaciones/pedidos para inferir usuarios activos
    const [qRes, oRes] = await Promise.allSettled([
      fetch(`${API}/api/quotations`, { credentials: 'include' as any } as RequestInit),
      fetch(`${API}/api/orders`, { credentials: 'include' as any } as RequestInit),
    ]);
    if (qRes.status === 'fulfilled' && qRes.value.ok) {
      const data: any = await qRes.value.json().catch(() => ({}));
      const qs: any[] = data?.quotations || data || [];
      qs.forEach((q) => {
        if (q?.user) pushUser(q.user);
        const email = (q?.user?.email || '').toLowerCase();
        if (email && emailToConv[email]) {
          emailToConv[email].lastMessage = emailToConv[email].lastMessage || q.lastMessage?.message;
          emailToConv[email].updatedAt = emailToConv[email].updatedAt || q.updatedAt || q.modifiedAt || q.createdAt;
        }
      });
    }
    if (oRes.status === 'fulfilled' && oRes.value.ok) {
      const data: any = await oRes.value.json().catch(() => ({}));
      const os: any[] = data?.orders || data || [];
      os.forEach((o) => {
        if (o?.user) pushUser(o.user);
        const email = (o?.user?.email || '').toLowerCase();
        if (email && emailToConv[email]) {
          emailToConv[email].lastMessage = emailToConv[email].lastMessage || o.lastMessage?.message;
          emailToConv[email].updatedAt = emailToConv[email].updatedAt || o.updatedAt || o.modifiedAt || o.createdAt;
        }
      });
    }
  } catch {}
  return Object.values(emailToConv);
}

export async function listDmConversations(): Promise<Conversation[]> {
  if (!API) return [];
  try {
    const res = await fetch(`${API}/api/users`, { credentials: 'include' as any } as RequestInit);
    if (!res.ok) return [];
    const data: any = await res.json().catch(() => ({}));
    const list: any[] = data?.users || data || [];
    return list
      .filter((u) => u?.email)
      .map((u) => ({
        id: `dm:${u.email}`,
        title: u.name || u.email,
      }));
  } catch {
    return [];
  }
}

export async function fetchConversationHistory(id: string): Promise<Array<{ _id: string; sender: any; message: string; sentAt: string }>> {
  if (!API) return [];
  const isDm = id?.startsWith('dm:');
  
  // Según documento del backend:
  // - DM: GET /chat/dm/:userId
  // - Cotizaciones: GET /quotations/:quotationId/messages
  // - Pedidos: GET /orders/:orderId/messages (fallback)
  
  let path: string;
  if (isDm) {
    // Extraer userId del formato "dm:email@example.com"
    const userId = id.slice(3); // Remover "dm:"
    path = `/api/chat/dm/${encodeURIComponent(userId)}`;
  } else {
    // Intentar primero como cotización, luego como pedido
    path = `/api/quotations/${id}/messages`;
  }
  
  try {
    const res = await fetch(`${API}${path}`, { credentials: 'include' as any } as RequestInit);
    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      const arr: any[] = (data && (data.messages || data)) || [];
      return arr.map((m: any) => ({
        _id: m._id || m.id || String(Math.random()),
        sender: m.sender,
        message: m.message || m.text,
        sentAt: m.sentAt || m.createdAt || new Date().toISOString(),
      }));
    }
  } catch (err) {
    console.error('Error fetching conversation:', err);
  }
  
  // Fallback: intentar como pedido si no es DM
  if (!isDm) {
    try {
      const fallbackPath = `/api/orders/${id}/messages`;
      const res = await fetch(`${API}${fallbackPath}`, { credentials: 'include' as any } as RequestInit);
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        const arr: any[] = (data && (data.messages || data)) || [];
        return arr.map((m: any) => ({
          _id: m._id || m.id || String(Math.random()),
          sender: m.sender,
          message: m.message || m.text,
          sentAt: m.sentAt || m.createdAt || new Date().toISOString(),
        }));
      }
    } catch (err) {
      console.error('Error fetching order messages:', err);
    }
  }
  
  return [];
}

export async function sendConversationMessage(id: string, message: string): Promise<void> {
  if (!API || !message) return;
  const isDm = id?.startsWith('dm:');
  
  // Según documento del backend:
  // - DM: POST /chat/dm/:userId con body { message }
  // - Cotizaciones: POST /quotations/:quotationId/messages con body { message }
  // - Pedidos: POST /orders/:orderId/messages con body { message }
  
  let path: string;
  const body = { message };
  
  if (isDm) {
    const userId = id.slice(3); // Remover "dm:"
    path = `/api/chat/dm/${encodeURIComponent(userId)}`;
  } else {
    // Intentar primero como cotización
    path = `/api/quotations/${id}/messages`;
  }
  
  try {
    const res = await fetch(`${API}${path}`, {
      method: 'POST',
      credentials: 'include' as any,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    } as RequestInit);
    if (res.ok) return;
  } catch (err) {
    console.error('Error sending message:', err);
  }
  
  // Fallback: intentar como pedido si no es DM
  if (!isDm) {
    try {
      const fallbackPath = `/api/orders/${id}/messages`;
      const res = await fetch(`${API}${fallbackPath}`, {
        method: 'POST',
        credentials: 'include' as any,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      } as RequestInit);
      if (res.ok) return;
    } catch (err) {
      console.error('Error sending message to order:', err);
    }
  }
}


