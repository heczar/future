import fs from "fs";
import path from "path";

export interface MessageItem {
  id: string;
  sender: 'user' | 'admin';
  senderEmail: string;
  text: string;
  category?: string;
  createdAt: string;
}

export interface SupportTicketData {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadByAdmin: boolean;
  unreadByUser: boolean;
  status: 'open' | 'resolved';
  category: string;
  messages: MessageItem[];
}

// In-memory cache + persistent file fallback
const memoryTickets: Map<string, SupportTicketData> = new Map();

// Helper to determine storage path
function getStoragePath(): string {
  try {
    const dataDir = path.resolve(process.cwd(), ".data");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    return path.join(dataDir, "support_tickets.json");
  } catch (e) {
    return path.join(process.env.TEMP || "/tmp", "futura_support_tickets.json");
  }
}

function loadTickets(): Map<string, SupportTicketData> {
  if (memoryTickets.size > 0) return memoryTickets;
  try {
    const filePath = getStoragePath();
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf-8");
      const list: SupportTicketData[] = JSON.parse(raw);
      for (const t of list) {
        if (t && t.id) memoryTickets.set(t.id, t);
      }
    }
  } catch (e) {
    console.warn("[SUPPORT API] Could not load from disk:", e);
  }
  return memoryTickets;
}

function saveTickets() {
  try {
    const filePath = getStoragePath();
    const list = Array.from(memoryTickets.values());
    fs.writeFileSync(filePath, JSON.stringify(list, null, 2), "utf-8");
  } catch (e) {
    console.warn("[SUPPORT API] Could not save to disk:", e);
  }
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-user-id');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  loadTickets();

  const { action } = req.query || {};
  const method = req.method;

  try {
    // 1. GET ALL TICKETS (Admin)
    if (method === 'GET' && action === 'list') {
      const list = Array.from(memoryTickets.values()).sort(
        (a, b) => new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime()
      );
      return res.status(200).json({ success: true, tickets: list });
    }

    // 2. GET SINGLE USER TICKET
    if (method === 'GET' && action === 'get_user_ticket') {
      const userId = (req.query.userId || req.headers['x-user-id'] || '').toString();
      if (!userId) {
        return res.status(400).json({ error: "Falta el userId." });
      }
      const ticket = memoryTickets.get(userId) || null;
      return res.status(200).json({ success: true, ticket });
    }

    // 3. USER SENDS MESSAGE
    if (method === 'POST' && (action === 'send_message' || !action)) {
      const { userId, userEmail, userName, text, category } = req.body || {};
      if (!userId || !text) {
        return res.status(400).json({ error: "Faltan datos obligatorios (userId, text)." });
      }

      const nowISO = new Date().toISOString();
      const newMsg: MessageItem = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        sender: 'user',
        senderEmail: userEmail || 'usuario@futura.ai',
        text: text.trim(),
        category: category || 'duda',
        createdAt: nowISO,
      };

      let ticket = memoryTickets.get(userId);
      if (!ticket) {
        ticket = {
          id: userId,
          userId,
          userEmail: userEmail || 'usuario@futura.ai',
          userName: userName || (userEmail ? userEmail.split('@')[0] : 'Usuario'),
          lastMessage: text.trim(),
          lastMessageAt: nowISO,
          unreadByAdmin: true,
          unreadByUser: false,
          status: 'open',
          category: category || 'duda',
          messages: [newMsg],
        };
      } else {
        ticket.messages.push(newMsg);
        ticket.lastMessage = text.trim();
        ticket.lastMessageAt = nowISO;
        ticket.unreadByAdmin = true;
        ticket.unreadByUser = false;
        ticket.status = 'open';
        if (category) ticket.category = category;
        if (userEmail) ticket.userEmail = userEmail;
        if (userName) ticket.userName = userName;
      }

      memoryTickets.set(userId, ticket);
      saveTickets();

      console.log(`[SUPPORT API] User message received for ticket ${userId} from ${ticket.userEmail}`);
      return res.status(200).json({ success: true, ticket });
    }

    // 4. ADMIN REPLIES TO TICKET
    if (method === 'POST' && action === 'admin_reply') {
      const { ticketId, text, adminEmail } = req.body || {};
      if (!ticketId || !text) {
        return res.status(400).json({ error: "Faltan datos (ticketId, text)." });
      }

      const ticket = memoryTickets.get(ticketId);
      if (!ticket) {
        return res.status(404).json({ error: "Ticket no encontrado." });
      }

      const nowISO = new Date().toISOString();
      const newMsg: MessageItem = {
        id: `msg_admin_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        sender: 'admin',
        senderEmail: adminEmail || 'heczaroficial@gmail.com',
        text: text.trim(),
        createdAt: nowISO,
      };

      ticket.messages.push(newMsg);
      ticket.lastMessage = text.trim();
      ticket.lastMessageAt = nowISO;
      ticket.unreadByAdmin = false;
      ticket.unreadByUser = true;
      ticket.status = 'open';

      memoryTickets.set(ticketId, ticket);
      saveTickets();

      console.log(`[SUPPORT API] Admin reply sent to ticket ${ticketId}`);
      return res.status(200).json({ success: true, ticket });
    }

    // 5. UPDATE STATUS OR READ STATE
    if (method === 'POST' && action === 'update_state') {
      const { ticketId, unreadByAdmin, unreadByUser, status } = req.body || {};
      const ticket = memoryTickets.get(ticketId);
      if (ticket) {
        if (unreadByAdmin !== undefined) ticket.unreadByAdmin = unreadByAdmin;
        if (unreadByUser !== undefined) ticket.unreadByUser = unreadByUser;
        if (status !== undefined) ticket.status = status;
        memoryTickets.set(ticketId, ticket);
        saveTickets();
      }
      return res.status(200).json({ success: true, ticket });
    }

    return res.status(400).json({ error: "Acción no soportada." });
  } catch (error: any) {
    console.error("[SUPPORT API ERROR]:", error);
    return res.status(500).json({ error: error.message || "Error en el servidor de soporte." });
  }
}
