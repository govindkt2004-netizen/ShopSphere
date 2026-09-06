import { User, Product, Category, Cart, Order, OrderStatus, TrackingStep, EmailLog } from '../types/index.js';
import { initialCategories, initialProducts, getInitialUsers, initialOrders, getInitialEmailLogs } from '../data/seedData.js';

class InMemoryDatabase {
  public users: User[] = [];
  public products: Product[] = [];
  public categories: Category[] = [];
  public carts: Map<string, Cart> = new Map();
  public orders: Order[] = [];
  public emailLogs: EmailLog[] = [];

  constructor() {
    this.seed();
  }

  public seed() {
    this.users = getInitialUsers();
    this.products = [...initialProducts];
    this.categories = [...initialCategories];
    this.orders = [...initialOrders];
    this.emailLogs = getInitialEmailLogs();

    // Seed default cart for customer 1
    this.carts.set('usr_cust1', {
      userId: 'usr_cust1',
      items: [
        {
          id: 'cart_item_1',
          productId: 'prod_3',
          name: 'Velocity Crimson Pro Running Sneakers',
          price: 159.99,
          originalPrice: 199.99,
          image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80',
          quantity: 1,
          stock: 18,
          category: 'Footwear & Shoes'
        }
      ],
      updatedAt: new Date().toISOString()
    });
  }

  public resetToDefault() {
    this.seed();
  }

  // Generate tracking timeline for a given status
  public static generateTimeline(status: OrderStatus, createdAtDate: string = new Date().toISOString()): TrackingStep[] {
    const statuses: { status: OrderStatus; title: string; description: string }[] = [
      {
        status: 'Order Placed',
        title: 'Order Placed',
        description: 'Your order was received and verified.'
      },
      {
        status: 'Confirmed',
        title: 'Payment Confirmed',
        description: 'Payment authorized and verified.'
      },
      {
        status: 'Processing',
        title: 'Order Packaged',
        description: 'Items assembled, securely packed, and barcoded.'
      },
      {
        status: 'Shipped',
        title: 'Handed to Courier',
        description: 'Package in transit with regional carrier.'
      },
      {
        status: 'Out for Delivery',
        title: 'Out for Delivery',
        description: 'Courier driver is en route to your shipping address.'
      },
      {
        status: 'Delivered',
        title: 'Delivered',
        description: 'Package delivered at your front door/mailbox.'
      }
    ];

    if (status === 'Cancelled') {
      return [
        {
          status: 'Order Placed',
          title: 'Order Placed',
          description: 'Order was placed.',
          timestamp: createdAtDate,
          completed: true,
          current: false
        },
        {
          status: 'Cancelled',
          title: 'Order Cancelled',
          description: 'Order was cancelled and refund initialized if paid.',
          timestamp: new Date().toISOString(),
          completed: true,
          current: true
        }
      ];
    }

    const targetIdx = statuses.findIndex((s) => s.status === status);
    const now = new Date();

    return statuses.map((item, idx) => {
      const isCompleted = idx <= targetIdx;
      const isCurrent = idx === targetIdx;

      let timestamp: string | undefined = undefined;
      if (isCompleted) {
        // synthesize plausible timestamp
        const timeOffsetHours = (targetIdx - idx) * 14;
        const d = new Date(now.getTime() - timeOffsetHours * 60 * 60 * 1000);
        timestamp = d.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });
      }

      return {
        status: item.status,
        title: item.title,
        description: item.description,
        timestamp,
        completed: isCompleted,
        current: isCurrent
      };
    });
  }
}

export const db = new InMemoryDatabase();
