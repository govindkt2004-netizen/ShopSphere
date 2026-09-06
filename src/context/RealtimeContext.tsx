import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { Order, Product } from '../types';

interface StockUpdatePayload {
  productId: string;
  stock: number;
  productName?: string;
  updatedAt: string;
}

interface OrderStatusPayload {
  order: Order;
  previousStatus?: string;
  status: string;
  trackingTimeline?: any[];
}

interface RealtimeContextType {
  isConnected: boolean;
  activeShoppers: number;
  lastStockUpdate: StockUpdatePayload | null;
  lastOrderUpdate: OrderStatusPayload | null;
  lastNewOrder: Order | null;
  subscribeToOrder: (orderId: string, callback: (payload: OrderStatusPayload) => void) => () => void;
  subscribeToStock: (productId: string, callback: (stock: number) => void) => () => void;
  subscribeToAdminOrders: (callback: (order: Order) => void) => () => void;
  sendCustomMessage: (type: string, payload?: any, room?: string) => void;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export const RealtimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [activeShoppers, setActiveShoppers] = useState(12);
  const [lastStockUpdate, setLastStockUpdate] = useState<StockUpdatePayload | null>(null);
  const [lastOrderUpdate, setLastOrderUpdate] = useState<OrderStatusPayload | null>(null);
  const [lastNewOrder, setLastNewOrder] = useState<Order | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const orderSubscribersRef = useRef<Map<string, Set<(payload: OrderStatusPayload) => void>>>(new Map());
  const stockSubscribersRef = useRef<Map<string, Set<(stock: number) => void>>>(new Map());
  const adminOrderSubscribersRef = useRef<Set<(order: Order) => void>>(new Set());

  const { user, isAdmin } = useAuth();
  const { info, success } = useToast();

  const connectWebSocket = useCallback(() => {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/ws`;

      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        console.log('[RealTime] WebSocket connection established successfully.');

        // Identify authenticated user or admin role
        if (user) {
          ws.send(
            JSON.stringify({
              type: 'identify',
              payload: { userId: user.id, role: user.role }
            })
          );
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const { type, payload } = data;

          switch (type) {
            case 'connected':
              if (payload?.activeShoppers) {
                setActiveShoppers(payload.activeShoppers);
              }
              break;

            case 'presence:update':
              if (payload?.activeShoppers) {
                setActiveShoppers(payload.activeShoppers);
              }
              break;

            case 'order:status_update': {
              const statusPayload = payload as OrderStatusPayload;
              setLastOrderUpdate(statusPayload);

              // Notify subscribers for this order
              if (statusPayload.order) {
                const orderId = statusPayload.order.id;
                const orderNum = statusPayload.order.orderNumber;

                const subs = orderSubscribersRef.current.get(orderId);
                if (subs) {
                  subs.forEach((cb) => cb(statusPayload));
                }
                const subsNum = orderSubscribersRef.current.get(orderNum);
                if (subsNum) {
                  subsNum.forEach((cb) => cb(statusPayload));
                }

                // If user owns this order, trigger toast alert
                if (user && statusPayload.order.userId === user.id) {
                  info(
                    `Order #${statusPayload.order.orderNumber} is now ${statusPayload.status}!`,
                    'Live Order Update'
                  );
                }
              }
              break;
            }

            case 'order:new': {
              const newOrder = payload as Order;
              setLastNewOrder(newOrder);

              // Notify admin listeners
              adminOrderSubscribersRef.current.forEach((cb) => cb(newOrder));

              if (isAdmin) {
                success(
                  `New Order #${newOrder.orderNumber} placed for ₹${newOrder.totalAmount.toLocaleString('en-IN')}`,
                  '⚡ Live Order Received'
                );
              }
              break;
            }

            case 'inventory:stock_update': {
              const stockData = payload as StockUpdatePayload;
              setLastStockUpdate(stockData);

              const subs = stockSubscribersRef.current.get(stockData.productId);
              if (subs) {
                subs.forEach((cb) => cb(stockData.stock));
              }
              break;
            }

            case 'notification:new':
              if (payload?.title && payload?.message) {
                info(payload.message, payload.title);
              }
              break;

            default:
              break;
          }
        } catch (err) {
          console.warn('[RealTime] Error parsing incoming WebSocket frame:', err);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        socketRef.current = null;
        console.log('[RealTime] WebSocket closed. Reconnecting in 3 seconds...');
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket();
        }, 3000);
      };

      ws.onerror = (err) => {
        console.warn('[RealTime] WebSocket connection error:', err);
        ws.close();
      };
    } catch (err) {
      console.warn('[RealTime] Failed to initiate WebSocket:', err);
      reconnectTimeoutRef.current = setTimeout(() => {
        connectWebSocket();
      }, 5000);
    }
  }, [user, isAdmin, info, success]);

  // Establish connection on mount
  useEffect(() => {
    connectWebSocket();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [connectWebSocket]);

  // Subscribe to specific order tracking updates
  const subscribeToOrder = useCallback((orderId: string, callback: (payload: OrderStatusPayload) => void) => {
    if (!orderSubscribersRef.current.has(orderId)) {
      orderSubscribersRef.current.set(orderId, new Set());
    }
    orderSubscribersRef.current.get(orderId)!.add(callback);

    // Send subscribe room to server
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: 'subscribe',
          room: `order:${orderId}`
        })
      );
    }

    return () => {
      const subs = orderSubscribersRef.current.get(orderId);
      if (subs) {
        subs.delete(callback);
        if (subs.size === 0) {
          orderSubscribersRef.current.delete(orderId);
        }
      }
    };
  }, []);

  // Subscribe to specific product stock updates
  const subscribeToStock = useCallback((productId: string, callback: (stock: number) => void) => {
    if (!stockSubscribersRef.current.has(productId)) {
      stockSubscribersRef.current.set(productId, new Set());
    }
    stockSubscribersRef.current.get(productId)!.add(callback);

    return () => {
      const subs = stockSubscribersRef.current.get(productId);
      if (subs) {
        subs.delete(callback);
        if (subs.size === 0) {
          stockSubscribersRef.current.delete(productId);
        }
      }
    };
  }, []);

  // Subscribe to admin new orders feed
  const subscribeToAdminOrders = useCallback((callback: (order: Order) => void) => {
    adminOrderSubscribersRef.current.add(callback);

    return () => {
      adminOrderSubscribersRef.current.delete(callback);
    };
  }, []);

  const sendCustomMessage = useCallback((type: string, payload?: any, room?: string) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type, payload, room }));
    }
  }, []);

  return (
    <RealtimeContext.Provider
      value={{
        isConnected,
        activeShoppers,
        lastStockUpdate,
        lastOrderUpdate,
        lastNewOrder,
        subscribeToOrder,
        subscribeToStock,
        subscribeToAdminOrders,
        sendCustomMessage
      }}
    >
      {children}
    </RealtimeContext.Provider>
  );
};

export const useRealtime = () => {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within RealtimeProvider');
  }
  return context;
};
