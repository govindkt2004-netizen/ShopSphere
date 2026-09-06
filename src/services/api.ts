import { Product, Category, Cart, Order, User, DashboardStats, EmailLog } from '../types';

const API_BASE = '/api';

const getAuthHeader = () => {
  const token = localStorage.getItem('shopsphere_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...(options.headers || {})
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data as T;
}

// Normalizer to ensure Order conforms to frontend expectations
function normalizeOrder(o: any): Order {
  if (!o) return o;
  return {
    ...o,
    status: o.status || o.orderStatus || 'Order Placed',
    orderStatus: o.orderStatus || o.status || 'Order Placed',
    total: o.total !== undefined ? o.total : (o.totalAmount || 0),
    totalAmount: o.totalAmount !== undefined ? o.totalAmount : (o.total || 0),
    subtotal: o.subtotal !== undefined ? o.subtotal : (o.itemsPrice || 0),
    tax: o.tax !== undefined ? o.tax : (o.taxPrice || 0),
    shippingFee: o.shippingFee !== undefined ? o.shippingFee : (o.shippingPrice || 0),
    discount: o.discount !== undefined ? o.discount : (o.discountPrice || 0),
    timeline: o.timeline || o.trackingTimeline || []
  };
}

export const api = {
  // Authentication & Profile
  auth: {
    login: (credentials: { identifier?: string; email?: string; phone?: string; password: string }) =>
      request<{
        user?: User;
        token?: string;
        message?: string;
        requires2FA?: boolean;
        twoFactorToken?: string;
        maskedEmail?: string;
        maskedPhone?: string;
        smsDelivered?: boolean;
        smsProvider?: string;
        smsError?: string;
        adminContact?: string;
      }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials)
      }),

    sendPhoneOtp: (data: { phone: string; purpose?: string }) =>
      request<{
        success: boolean;
        smsConfigured?: boolean;
        maskedPhone?: string;
        message: string;
        expiresIn?: number;
        cooldown?: number;
      }>('/auth/phone/send-otp', {
        method: 'POST',
        body: JSON.stringify(data)
      }),

    verifyPhoneOtp: (data: { phone: string; otp: string; name?: string }) =>
      request<{
        success: boolean;
        user: User;
        token: string;
        message: string;
      }>('/auth/phone/verify-otp', {
        method: 'POST',
        body: JSON.stringify(data)
      }),

    verifyTwoFactor: (data: { twoFactorToken: string; otp: string }) =>
      request<{ user: User; token: string; message: string }>('/auth/verify-2fa', {
        method: 'POST',
        body: JSON.stringify(data)
      }),

    resendTwoFactor: (data: { twoFactorToken: string }) =>
      request<{
        message: string;
        maskedEmail?: string;
        maskedPhone?: string;
        smsDelivered?: boolean;
        smsProvider?: string;
        smsError?: string;
      }>('/auth/resend-2fa', {
        method: 'POST',
        body: JSON.stringify(data)
      }),

    getSmsStatus: () =>
      request<{
        configured: boolean;
        provider: string;
        details?: string;
      }>('/auth/sms-status', {
        method: 'GET'
      }),

    register: (userData: {
      name: string;
      email: string;
      phone: string;
      password: string;
      confirmPassword?: string;
      address?: any;
    }) =>
      request<{ user: User; token: string; message: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData)
      }),

    googleLogin: (payload: {
      email: string;
      name?: string;
      picture?: string;
      googleId?: string;
      idToken?: string;
      credential?: string;
    }) =>
      request<{
        user?: User;
        token?: string;
        message?: string;
        requires2FA?: boolean;
        twoFactorToken?: string;
        maskedEmail?: string;
        maskedPhone?: string;
        smsDelivered?: boolean;
        smsProvider?: string;
        smsError?: string;
        adminContact?: string;
      }>('/auth/google', {
        method: 'POST',
        body: JSON.stringify(payload)
      }),

    logout: () =>
      request<{ message: string }>('/auth/logout', {
        method: 'POST'
      }),

    getProfile: () => request<User>('/auth/profile'),

    verifyAdmin: () =>
      request<{ verified: boolean; role: string; user: User; timestamp?: string }>('/auth/verify-admin'),

    updateProfile: (data: Partial<User>) =>
      request<{ user: User; message: string }>('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(data)
      }),

    changePassword: (data: { currentPassword?: string; newPassword: string }) =>
      request<{ message: string }>('/auth/change-password', {
        method: 'PUT',
        body: JSON.stringify(data)
      }),

    forgotPassword: (identifier: string) =>
      request<{ message: string; debugResetToken?: string }>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ identifier })
      }),

    resetPassword: (data: { token: string; newPassword: string }) =>
      request<{ message: string }>('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify(data)
      }),

    deleteAccount: () =>
      request<{ message: string }>('/auth/account', {
        method: 'DELETE'
      })
  },

  // Products
  products: {
    getAll: async (params: {
      q?: string;
      category?: string;
      brand?: string;
      minPrice?: number;
      maxPrice?: number;
      minRating?: number;
      sort?: string;
      featured?: boolean;
      inStock?: boolean;
      page?: number;
      limit?: number;
    } = {}) => {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          query.append(key, String(val));
        }
      });
      const queryStr = query.toString() ? `?${query.toString()}` : '';
      const res = await request<any>(`/products${queryStr}`);
      return {
        products: (res.products || []).map((p: any) => ({
          ...p,
          features: p.features || (p.tags ? p.tags : [])
        })),
        total: res.total || 0,
        page: res.page || 1,
        pages: res.pages || 1,
        availableCategories: res.availableCategories || [],
        availableBrands: res.availableBrands || []
      };
    },
    getById: async (id: string) => {
      const res = await request<any>(`/products/${id}`);
      return {
        product: res.product || res,
        relatedProducts: res.relatedProducts || []
      };
    },
    create: (data: Partial<Product>) =>
      request<Product>('/admin/products', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    update: (id: string, data: Partial<Product>) =>
      request<Product>(`/admin/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    delete: (id: string) =>
      request<{ message: string; id: string }>(`/admin/products/${id}`, {
        method: 'DELETE'
      }),
    addReview: (productId: string, review: { rating: number; comment: string; userName?: string }) =>
      request<{ message: string; review: any; product: Product }>(`/products/${productId}/reviews`, {
        method: 'POST',
        body: JSON.stringify(review)
      }),
    deleteReview: (productId: string) =>
      request<{ message: string; product: Product }>(`/products/${productId}/reviews`, {
        method: 'DELETE'
      })
  },

  // Categories
  categories: {
    getAll: async () => {
      const cats = await request<any[]>('/categories');
      return cats.map((c) => ({
        ...c,
        productCount: c.productCount !== undefined ? c.productCount : (c.itemCount || 0)
      }));
    },
    create: (data: Partial<Category>) =>
      request<Category>('/admin/categories', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    update: (id: string, data: Partial<Category>) =>
      request<Category>(`/admin/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    delete: (id: string) =>
      request<{ message: string; id: string }>(`/admin/categories/${id}`, {
        method: 'DELETE'
      })
  },

  // Cart
  cart: {
    get: () => request<Cart>('/cart'),
    add: (productId: string, quantity = 1) =>
      request<Cart>('/cart', {
        method: 'POST',
        body: JSON.stringify({ productId, quantity })
      }),
    updateItem: (itemId: string, quantity: number) =>
      request<Cart>(`/cart/${itemId}`, {
        method: 'PUT',
        body: JSON.stringify({ quantity })
      }),
    removeItem: (itemId: string) =>
      request<Cart>(`/cart/${itemId}`, {
        method: 'DELETE'
      }),
    clear: () =>
      request<Cart>('/cart', {
        method: 'DELETE'
      })
  },

  // Orders
  orders: {
    create: async (orderData: {
      items: { productId: string; quantity: number; [key: string]: any }[];
      shippingAddress: any;
      paymentMethod: string;
      subtotal?: number;
      tax?: number;
      shippingFee?: number;
      discount?: number;
      total?: number;
      couponCode?: string;
    }) => {
      const res = await request<any>('/orders', {
        method: 'POST',
        body: JSON.stringify({
          items: orderData.items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            name: i.name,
            price: i.price,
            image: i.image
          })),
          shippingAddress: orderData.shippingAddress,
          paymentMethod: orderData.paymentMethod,
          discountPrice: orderData.discount || 0
        })
      });
      const orderObj = res.order || res;
      return {
        order: normalizeOrder(orderObj)
      };
    },
    getMyOrders: async () => {
      const orders = await request<any[]>('/orders/my-orders');
      return (orders || []).map(normalizeOrder);
    },
    cancel: async (orderId: string) => {
      const res = await request<any>(`/orders/${orderId}/cancel`, {
        method: 'PUT'
      });
      return {
        message: res.message,
        order: normalizeOrder(res.order || res)
      };
    },
    getById: async (idOrOrderNumber: string) => {
      const order = await request<any>(`/orders/${idOrOrderNumber}`);
      return normalizeOrder(order);
    },
    getAll: async (params: { status?: string; search?: string; page?: number; limit?: number } = {}) => {
      const query = new URLSearchParams();
      if (params.status) query.append('status', params.status);
      if (params.search) query.append('search', params.search);
      if (params.page) query.append('page', String(params.page));
      if (params.limit) query.append('limit', String(params.limit));
      const q = query.toString() ? `?${query.toString()}` : '';
      const res = await request<any>(`/orders${q}`);
      const rawOrders = Array.isArray(res) ? res : (res.orders || []);
      return rawOrders.map(normalizeOrder);
    },
    updateStatus: async (
      id: string,
      updateData: { status?: string; trackingNumber?: string; carrier?: string; estimatedDelivery?: string; paymentStatus?: string }
    ) => {
      const res = await request<any>(`/orders/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify(updateData)
      });
      return normalizeOrder(res);
    },
    delete: (id: string) =>
      request<{ message: string; id: string }>(`/orders/${id}`, {
        method: 'DELETE'
      })
  },

  // Users (Admin)
  users: {
    getAll: (params: { search?: string; role?: string; status?: string } = {}) => {
      const query = new URLSearchParams();
      if (params.search) query.append('search', params.search);
      if (params.role) query.append('role', params.role);
      if (params.status) query.append('status', params.status);
      const q = query.toString() ? `?${query.toString()}` : '';
      return request<User[]>(`/admin/users${q}`);
    },
    create: (userData: { name: string; email: string; password: string; role?: string; phone?: string }) =>
      request<User>('/admin/users', {
        method: 'POST',
        body: JSON.stringify(userData)
      }),
    update: (id: string, data: Partial<User>) =>
      request<User>(`/admin/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    delete: (id: string) =>
      request<{ message: string; id: string }>(`/admin/users/${id}`, {
        method: 'DELETE'
      })
  },

  // Admin Stats
  stats: {
    getDashboard: async (): Promise<DashboardStats> => {
      const data = await request<any>('/admin/dashboard');
      return {
        totalRevenue: data.totalRevenue || 0,
        totalOrders: data.totalOrders || 0,
        totalUsers: data.totalUsers || 0,
        totalProducts: data.totalProducts || 0,
        monthlySales: (data.monthlySales || []).map((m: any) => ({
          month: m.month,
          revenue: m.revenue !== undefined ? m.revenue : (m.sales || 0),
          orders: m.orders || 0
        })),
        orderStatusDistribution: data.orderStatusDistribution || data.orderStatusCounts || {},
        lowStockProducts: data.lowStockProducts || [],
        recentOrders: (data.recentOrders || []).map(normalizeOrder)
      };
    }
  },

  // Email Notifications & Live Mail Inbox
  notifications: {
    getMyEmails: () =>
      request<{ emails: EmailLog[]; unreadCount: number; totalCount: number }>(
        '/notifications/my-emails'
      ),
    getAllEmails: (params: { category?: string; search?: string; page?: number; limit?: number } = {}) => {
      const query = new URLSearchParams();
      if (params.category) query.append('category', params.category);
      if (params.search) query.append('search', params.search);
      if (params.page) query.append('page', params.page.toString());
      if (params.limit) query.append('limit', params.limit.toString());
      const q = query.toString() ? `?${query.toString()}` : '';
      return request<{ emails: EmailLog[]; total: number; page: number; pages: number }>(
        `/notifications/all-emails${q}`
      );
    },
    markAsRead: (id: string) =>
      request<{ message: string; email: EmailLog }>(`/notifications/read/${id}`, {
        method: 'PUT'
      }),
    markAllAsRead: () =>
      request<{ message: string }>('/notifications/read-all', {
        method: 'PUT'
      }),
    resend: (id: string) =>
      request<{ message: string; email: EmailLog }>(`/notifications/resend/${id}`, {
        method: 'POST'
      }),
    sendTest: (data: { to?: string; type: 'order_confirmation' | 'shipment_tracking' | 'security_alert' | '2fa_otp' | 'password_reset' }) =>
      request<{ message: string; email: EmailLog }>('/notifications/send-test', {
        method: 'POST',
        body: JSON.stringify(data)
      })
  }
};
