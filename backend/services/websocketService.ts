import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { Order, Product } from '../types/index.js';

interface ExtendedWebSocket extends WebSocket {
  isAlive: boolean;
  userId?: string;
  role?: string;
  rooms: Set<string>;
}

interface RealtimeMessage {
  type: string;
  payload?: any;
  room?: string;
  timestamp?: string;
}

let wss: WebSocketServer | null = null;
const clients: Set<ExtendedWebSocket> = new Set();

// Track simulated base shoppers + real connected clients for realistic live store atmosphere
const BASE_ACTIVE_SHOPPERS = 8;

export const getConnectedClientsCount = (): number => {
  return BASE_ACTIVE_SHOPPERS + clients.size;
};

export const initWebSocketServer = (server: HttpServer): WebSocketServer => {
  wss = new WebSocketServer({
    server,
    path: '/ws'
  });

  console.log('[WebSocket] Real-Time WebSocket Server initialized on path /ws');

  // Heartbeat interval to detect stale/dead connections
  const heartbeatInterval = setInterval(() => {
    if (!wss) return;
    wss.clients.forEach((ws) => {
      const extWs = ws as ExtendedWebSocket;
      if (extWs.isAlive === false) {
        clients.delete(extWs);
        return extWs.terminate();
      }
      extWs.isAlive = false;
      extWs.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(heartbeatInterval);
  });

  wss.on('connection', (ws: WebSocket, req) => {
    const extWs = ws as ExtendedWebSocket;
    extWs.isAlive = true;
    extWs.rooms = new Set(['global', 'inventory', 'orders']);
    clients.add(extWs);

    console.log(`[WebSocket] Client connected. Total active connections: ${clients.size}`);

    extWs.on('pong', () => {
      extWs.isAlive = true;
    });

    // Send welcome state with current presence count and server timestamp
    sendToSocket(extWs, {
      type: 'connected',
      payload: {
        message: 'Connected to ShopSphere Real-Time Network',
        activeShoppers: getConnectedClientsCount(),
        serverTime: new Date().toISOString()
      }
    });

    // Broadcast presence update to everyone
    broadcastPresence();

    extWs.on('message', (data: string) => {
      try {
        const message: RealtimeMessage = JSON.parse(data.toString());
        handleClientMessage(extWs, message);
      } catch (err) {
        console.warn('[WebSocket] Invalid JSON message received:', err);
      }
    });

    extWs.on('close', () => {
      clients.delete(extWs);
      console.log(`[WebSocket] Client disconnected. Active connections: ${clients.size}`);
      broadcastPresence();
    });

    extWs.on('error', (err) => {
      console.warn('[WebSocket] Client socket error:', err.message);
      clients.delete(extWs);
    });
  });

  return wss;
};

// Handle client-to-server messages (e.g. room subscriptions, auth)
const handleClientMessage = (ws: ExtendedWebSocket, message: RealtimeMessage) => {
  switch (message.type) {
    case 'subscribe':
      if (message.room) {
        ws.rooms.add(message.room);
        sendToSocket(ws, {
          type: 'subscribed',
          payload: { room: message.room }
        });
      }
      break;

    case 'unsubscribe':
      if (message.room) {
        ws.rooms.delete(message.room);
        sendToSocket(ws, {
          type: 'unsubscribed',
          payload: { room: message.room }
        });
      }
      break;

    case 'identify':
      if (message.payload?.userId) {
        ws.userId = message.payload.userId;
        ws.role = message.payload.role || 'customer';
        ws.rooms.add(`user:${ws.userId}`);
        if (ws.role === 'admin') {
          ws.rooms.add('admin');
        }
        sendToSocket(ws, {
          type: 'identified',
          payload: { userId: ws.userId, role: ws.role }
        });
      }
      break;

    case 'ping':
      sendToSocket(ws, { type: 'pong', timestamp: new Date().toISOString() });
      break;

    default:
      break;
  }
};

// Helper: send to a single socket safely
const sendToSocket = (ws: ExtendedWebSocket, message: RealtimeMessage) => {
  if (ws.readyState === WebSocket.OPEN) {
    message.timestamp = message.timestamp || new Date().toISOString();
    ws.send(JSON.stringify(message));
  }
};

// Broadcast to all connected clients
export const broadcast = (type: string, payload: any, room?: string) => {
  if (!wss) return;

  const message: RealtimeMessage = {
    type,
    payload,
    room,
    timestamp: new Date().toISOString()
  };

  const payloadStr = JSON.stringify(message);

  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      if (!room || client.rooms.has(room) || client.rooms.has('global')) {
        client.send(payloadStr);
      }
    }
  });
};

// Broadcast active shoppers presence
export const broadcastPresence = () => {
  broadcast('presence:update', {
    activeShoppers: getConnectedClientsCount(),
    timestamp: new Date().toISOString()
  });
};

// =========================================================================
// Real-Time Domain Events Emitters
// =========================================================================

// 1. When a new order is placed
export const broadcastNewOrder = (order: Order) => {
  console.log(`[WebSocket] Broadcasting order:new for #${order.orderNumber}`);

  // Broadcast to Admin channel for live order feed & revenue updates
  broadcast('order:new', order, 'admin');

  // Broadcast to user-specific channel
  broadcast('order:new', order, `user:${order.userId}`);

  // Broadcast global notification
  broadcast('notification:new', {
    id: `notif_${Date.now()}`,
    type: 'order',
    title: 'New Order Placed',
    message: `Order #${order.orderNumber} for ₹${order.totalAmount.toLocaleString('en-IN')} placed by ${order.userName}`,
    createdAt: new Date().toISOString(),
    orderId: order.id,
    orderNumber: order.orderNumber
  }, 'admin');
};

// 2. When order status is updated (Admin advances tracking or customer cancels)
export const broadcastOrderStatusUpdate = (order: Order, previousStatus?: string) => {
  console.log(`[WebSocket] Broadcasting order:status_update for #${order.orderNumber} -> ${order.orderStatus}`);

  // Broadcast to anyone tracking this specific order
  broadcast('order:status_update', {
    order,
    previousStatus,
    status: order.orderStatus,
    trackingTimeline: order.trackingTimeline
  });

  // Target notification to customer
  broadcast('notification:new', {
    id: `notif_${Date.now()}`,
    type: 'order_status',
    title: `Order Status: ${order.orderStatus}`,
    message: `Your Order #${order.orderNumber} is now ${order.orderStatus.toLowerCase()}!`,
    createdAt: new Date().toISOString(),
    orderId: order.id,
    orderNumber: order.orderNumber
  }, `user:${order.userId}`);
};

// 3. When product inventory stock changes (purchase, refund, restock)
export const broadcastStockUpdate = (productId: string, newStock: number, productName?: string) => {
  console.log(`[WebSocket] Broadcasting inventory:stock_update for ${productId}: ${newStock}`);
  broadcast('inventory:stock_update', {
    productId,
    stock: newStock,
    productName,
    updatedAt: new Date().toISOString()
  }, 'inventory');
};

// 4. When a product is created, updated, or deleted
export const broadcastProductUpdate = (product: Product, action: 'created' | 'updated' | 'deleted') => {
  broadcast('product:change', {
    action,
    product,
    updatedAt: new Date().toISOString()
  });
};
