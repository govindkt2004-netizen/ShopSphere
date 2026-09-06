export interface UserAddress {
  id?: string;
  fullName?: string;
  phone?: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault?: boolean;
  label?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'customer';
  googleId?: string;
  authProvider?: 'local' | 'google';
  profileImage?: string;
  isActive?: boolean;
  emailVerified?: boolean;
  lastLogin?: string;
  phone?: string;
  address?: UserAddress;
  addresses?: UserAddress[];
  twoFactorEnabled?: boolean;
  createdAt?: string;
  updatedAt?: string;
  ordersCount?: number;
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  category: string;
  brand: string;
  images: string[];
  stock: number;
  rating: number;
  numReviews: number;
  reviews?: Review[];
  featured?: boolean;
  isBestSeller?: boolean;
  tags?: string[];
  features?: string[];
  specs?: Record<string, string>;
  createdAt?: string;
}

export interface Category {
  id: string;
  name: string;
  slug?: string;
  image: string;
  description?: string;
  productCount?: number;
  itemCount?: number;
}

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  quantity: number;
  stock: number;
  category: string;
}

export interface Cart {
  userId?: string;
  items: CartItem[];
  updatedAt?: string;
}

export type OrderStatus =
  | 'Order Placed'
  | 'Confirmed'
  | 'Processing'
  | 'Shipped'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Cancelled';

export interface TrackingStep {
  status: OrderStatus;
  title: string;
  description: string;
  timestamp?: string;
  completed: boolean;
  current: boolean;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

export interface ShippingAddress {
  fullName: string;
  phone?: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface Order {
  id: string;
  orderNumber?: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  items: OrderItem[];
  itemsPrice?: number;
  shippingPrice?: number;
  taxPrice?: number;
  discountPrice?: number;
  totalAmount?: number;
  // Convenience aliases for frontend
  subtotal?: number;
  tax?: number;
  shippingFee?: number;
  discount?: number;
  total: number;
  shippingAddress: ShippingAddress;
  paymentMethod: string;
  paymentStatus: 'Pending' | 'Paid' | 'Failed';
  orderStatus?: OrderStatus;
  status: OrderStatus;
  trackingTimeline?: TrackingStep[];
  timeline?: TrackingStep[];
  trackingNumber?: string;
  carrier?: string;
  estimatedDelivery?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalUsers: number;
  totalProducts: number;
  monthlySales: { month: string; revenue: number; orders: number }[];
  orderStatusDistribution: Record<string, number>;
  lowStockProducts: {
    id: string;
    name: string;
    stock: number;
    category?: string;
    price?: number;
    image?: string;
  }[];
  recentOrders: Order[];
}

export type AdminStats = DashboardStats;

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title?: string;
  message: string;
  duration?: number;
}

export type EmailCategory =
  | 'order_confirmation'
  | 'shipment_tracking'
  | 'status_update'
  | 'security_alert'
  | '2fa_otp'
  | 'password_reset'
  | 'account_lockout'
  | 'general';

export interface EmailLog {
  id: string;
  to: string;
  toName?: string;
  from: string;
  subject: string;
  category: EmailCategory;
  htmlBody: string;
  textBody?: string;
  previewText?: string;
  status: 'delivered' | 'sent' | 'simulated' | 'failed';
  metadata?: {
    orderId?: string;
    orderNumber?: string;
    trackingNumber?: string;
    carrier?: string;
    orderStatus?: string;
    ipAddress?: string;
    userAgent?: string;
    otp?: string;
    actionUrl?: string;
    [key: string]: any;
  };
  sentAt: string;
  read?: boolean;
}
