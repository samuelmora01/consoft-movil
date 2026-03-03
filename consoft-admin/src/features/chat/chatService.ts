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
  // Queremos UN chat por usuario → rooms dm:<email>
  const emailToConv: Record<string, Conversation> = {};
  const pushUser = (u: any) => {
    const email = (u?.email || '').toLowerCase();
    if (!email) return;
    if (!emailToConv[email]) {
      emailToConv[email] = {
        id: `dm:${email}`,
        title: u?.name || u?.fullName || u?.email,
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
  const basePaths = isDm
    ? [
        `/api/chat/messages?roomId=${encodeURIComponent(id)}`,
        `/api/messages?roomId=${encodeURIComponent(id)}`,
        `/api/chat/rooms/${encodeURIComponent(id)}/messages`,
        `/api/chat/${encodeURIComponent(id)}/messages`,
        `/api/chat/conversations/${encodeURIComponent(id)}/messages`,
      ]
    : [`/api/orders/${id}/messages`, `/api/quotations/${id}/messages`, `/api/chat/conversations/${encodeURIComponent(id)}/messages`];
  const paths = isDm ? basePaths : [...basePaths, `/api/chat/messages?roomId=${encodeURIComponent(id)}`];
  for (const p of paths) {
    try {
      const res = await fetch(`${API}${p}`, { credentials: 'include' as any } as RequestInit);
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
    } catch {}
  }
  return [];
}

export async function sendConversationMessage(id: string, message: string): Promise<void> {
  if (!API || !message) return;
  const isDm = id?.startsWith('dm:');
  const body = isDm
    ? { roomId: id, to: id.slice(3), message }
    : { message };
  const candidates = isDm
    ? [
        { path: '/api/chat/messages', method: 'POST' as const, body },
        { path: `/api/chat/rooms/${encodeURIComponent(id)}/messages`, method: 'POST' as const, body: { message } },
      ]
    : [
        { path: `/api/orders/${id}/messages`, method: 'POST' as const, body },
        { path: `/api/quotations/${id}/messages`, method: 'POST' as const, body },
      ];
  for (const c of candidates) {
    try {
      const res = await fetch(`${API}${c.path}`, {
        method: c.method,
        credentials: 'include' as any,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(c.body),
      } as RequestInit);
      if (res.ok) return;
    } catch {}
  }
}


