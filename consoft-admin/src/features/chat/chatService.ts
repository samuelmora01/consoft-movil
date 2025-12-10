import { API } from '../../config';
import { OrdersApi } from '../../api/client';

export type Conversation = {
  id: string;
  title: string;
  lastMessage?: string;
  updatedAt?: string;
};

export async function listAdminConversations(): Promise<Conversation[]> {
  if (!API) return [];
  try {
    // Prefer admin list of orders if available
    const res = await fetch(`${API}/api/orders`, { credentials: 'include' as any } as RequestInit);
    if (res.ok) {
      const data: any = await res.json().catch(() => ({}));
      const arr: any[] = data?.orders || data || [];
      return arr.map((o, idx) => ({
        id: o._id || o.id || String(idx),
        title: (o.user && (o.user.name || o.user.email)) || (o.code ? `Pedido #${o.code}` : 'Pedido'),
        lastMessage: o.lastMessage?.message,
        updatedAt: o.updatedAt || o.modifiedAt,
      }));
    }
  } catch {}
  try {
    // Fallback to mine if admin endpoint not available
    const mine = await OrdersApi(API).mine();
    const arr: any[] = (mine as any).orders || [];
    return arr.map((o: any, idx: number) => ({
      id: o._id || o.id || String(idx),
      title: (o.user && (o.user.name || o.user.email)) || (o.code ? `Pedido #${o.code}` : 'Pedido'),
      lastMessage: o.lastMessage?.message,
      updatedAt: o.updatedAt || o.modifiedAt,
    }));
  } catch {}
  return [];
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

export async function fetchConversationHistory(orderId: string): Promise<Array<{ _id: string; sender: any; message: string; sentAt: string }>> {
  if (!API) return [];
  // try orders messages, fallback to quotations messages
  const paths = [`/api/orders/${orderId}/messages`, `/api/quotations/${orderId}/messages`];
  for (const p of paths) {
    try {
      const res = await fetch(`${API}${p}`, { credentials: 'include' as any } as RequestInit);
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        return (data && (data.messages || data)) || [];
      }
    } catch {}
  }
  return [];
}


