import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback
} from 'react';
import { CartItem, Product } from '../types';
import { api } from '../services/api';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

interface AppliedCoupon {
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  description: string;
}

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  shippingFee: number;
  tax: number;
  discountAmount: number;
  total: number;
  freeShippingThreshold: number;
  freeShippingProgress: number;
  appliedCoupon: AppliedCoupon | null;
  isCartDrawerOpen: boolean;
  openCartDrawer: () => void;
  closeCartDrawer: () => void;
  addToCart: (product: Product, quantity?: number) => Promise<boolean>;
  updateQuantity: (
    itemIdOrProductId: string,
    quantity: number
  ) => Promise<void>;
  removeFromCart: (itemIdOrProductId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  applyCoupon: (code: string) => boolean;
  removeCoupon: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [appliedCoupon, setAppliedCoupon] =
    useState<AppliedCoupon | null>(null);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);

  const { isAuthenticated, user } = useAuth();
  const { success, error, info } = useToast();

  /**
   * Load cart from server for authenticated users
   */
  const syncCartFromServer = useCallback(async () => {
    if (!isAuthenticated) {
      setItems([]);
      return;
    }

    try {
      const serverCart = await api.cart.get();

      if (serverCart && Array.isArray(serverCart.items)) {
        setItems(serverCart.items);
        localStorage.setItem(
          'shopsphere_cart',
          JSON.stringify(serverCart.items)
        );
      }
    } catch (err) {
      console.warn('Could not sync cart from server:', err);
    }
  }, [isAuthenticated]);

  /**
   * Sync cart whenever authentication changes
   */
  useEffect(() => {
    if (isAuthenticated) {
      syncCartFromServer();
    } else {
      // Clear guest/local cart when user is not signed in
      setItems([]);
      localStorage.removeItem('shopsphere_cart');
    }
  }, [isAuthenticated, user?.id, syncCartFromServer]);

  /**
   * Keep localStorage synchronized for authenticated cart
   */
  useEffect(() => {
    if (isAuthenticated) {
      localStorage.setItem(
        'shopsphere_cart',
        JSON.stringify(items)
      );
    }
  }, [items, isAuthenticated]);

  const openCartDrawer = () => {
    setIsCartDrawerOpen(true);
  };

  const closeCartDrawer = () => {
    setIsCartDrawerOpen(false);
  };

  /**
   * ADD TO CART
   * User MUST be authenticated.
   */
  const addToCart = async (
    product: Product,
    quantity = 1
  ): Promise<boolean> => {
    // -------------------------------------------------
    // STEP 1: Require login
    // -------------------------------------------------
    if (!isAuthenticated) {
      info(
        'Please sign in to add items to your cart.',
        'Sign In Required'
      );

      // Tell App.tsx to navigate to login page
      window.dispatchEvent(
        new CustomEvent('shopsphere:navigate', {
          detail: 'login'
        })
      );

      return false;
    }

    // -------------------------------------------------
    // STEP 2: Check stock
    // -------------------------------------------------
    if (product.stock <= 0) {
      error(
        `"${product.name}" is currently out of stock.`,
        'Out of Stock'
      );

      return false;
    }

    // -------------------------------------------------
    // STEP 3: Add item to server cart
    // -------------------------------------------------
    try {
      const updated = await api.cart.add(
        product.id,
        quantity
      );

      setItems(updated.items);

      success(
        `Added "${product.name}" to cart!`,
        'Cart Updated'
      );

      openCartDrawer();

      return true;
    } catch (err: any) {
      error(
        err?.message || 'Failed to add item to cart',
        'Error'
      );

      return false;
    }
  };

  /**
   * UPDATE CART QUANTITY
   */
  const updateQuantity = async (
    itemIdOrProductId: string,
    quantity: number
  ): Promise<void> => {
    // Guests should not have a cart
    if (!isAuthenticated) {
      info(
        'Please sign in to manage your cart.',
        'Sign In Required'
      );

      window.dispatchEvent(
        new CustomEvent('shopsphere:navigate', {
          detail: 'login'
        })
      );

      return;
    }

    if (quantity <= 0) {
      await removeFromCart(itemIdOrProductId);
      return;
    }

    try {
      const updated = await api.cart.updateItem(
        itemIdOrProductId,
        quantity
      );

      setItems(updated.items);
    } catch (err: any) {
      error(
        err?.message || 'Failed to update quantity',
        'Error'
      );
    }
  };

  /**
   * REMOVE ITEM FROM CART
   */
  const removeFromCart = async (
    itemIdOrProductId: string
  ): Promise<void> => {
    if (!isAuthenticated) {
      info(
        'Please sign in to manage your cart.',
        'Sign In Required'
      );

      window.dispatchEvent(
        new CustomEvent('shopsphere:navigate', {
          detail: 'login'
        })
      );

      return;
    }

    try {
      const updated = await api.cart.removeItem(
        itemIdOrProductId
      );

      setItems(updated.items);

      info('Item removed from cart');
    } catch (err: any) {
      error(
        err?.message || 'Failed to remove item',
        'Error'
      );
    }
  };

  /**
   * CLEAR CART
   */
  const clearCart = async (): Promise<void> => {
    if (!isAuthenticated) {
      setItems([]);
      setAppliedCoupon(null);
      localStorage.removeItem('shopsphere_cart');
      return;
    }

    try {
      await api.cart.clear();
    } catch (err) {
      console.warn(
        'Failed to clear server cart:',
        err
      );
    }

    setItems([]);
    setAppliedCoupon(null);
    localStorage.removeItem('shopsphere_cart');
  };

  /**
   * APPLY COUPON
   */
  const applyCoupon = (code: string): boolean => {
    const cleanCode = code.toUpperCase().trim();

    if (cleanCode === 'SAVE10') {
      setAppliedCoupon({
        code: 'SAVE10',
        type: 'percent',
        value: 10,
        description: '10% Off Storewide Promotion'
      });

      success(
        'Coupon "SAVE10" applied! You get 10% off.',
        'Discount Applied'
      );

      return true;
    }

    if (
      cleanCode === 'WELCOME500' ||
      cleanCode === 'SPHERE500'
    ) {
      setAppliedCoupon({
        code: cleanCode,
        type: 'fixed',
        value: 500,
        description: '₹500 Instant Welcome Discount'
      });

      success(
        `Coupon "${cleanCode}" applied! You get ₹500 off.`,
        'Discount Applied'
      );

      return true;
    }

    if (cleanCode === 'SPHERE20') {
      setAppliedCoupon({
        code: 'SPHERE20',
        type: 'percent',
        value: 20,
        description: '20% Mega Savings Discount'
      });

      success(
        'Coupon "SPHERE20" applied! You get 20% off.',
        'Discount Applied'
      );

      return true;
    }

    if (cleanCode === 'FREESHIP') {
      setAppliedCoupon({
        code: 'FREESHIP',
        type: 'fixed',
        value: 99,
        description: 'Free Standard Delivery Waiver'
      });

      success(
        'Coupon "FREESHIP" applied! Shipping fee waived.',
        'Discount Applied'
      );

      return true;
    }

    error(
      'Invalid coupon code. Try "SAVE10", "WELCOME500", or "SPHERE20".',
      'Invalid Code'
    );

    return false;
  };

  /**
   * REMOVE COUPON
   */
  const removeCoupon = () => {
    setAppliedCoupon(null);
    info('Coupon code removed.');
  };

  // -------------------------------------------------
  // CART CALCULATIONS
  // -------------------------------------------------

  const itemCount = items.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const subtotal = Number(
    items
      .reduce(
        (sum, item) =>
          sum + item.price * item.quantity,
        0
      )
      .toFixed(2)
  );

  const freeShippingThreshold = 999;

  const freeShippingProgress = Math.min(
    100,
    Math.round(
      (subtotal / freeShippingThreshold) * 100
    )
  );

  const rawShipping =
    subtotal > 0 && subtotal < freeShippingThreshold
      ? 99
      : 0;

  let discountAmount = 0;

  if (appliedCoupon) {
    if (appliedCoupon.type === 'percent') {
      discountAmount = Number(
        (
          (subtotal * appliedCoupon.value) /
          100
        ).toFixed(2)
      );
    } else if (appliedCoupon.type === 'fixed') {
      discountAmount = Math.min(
        subtotal,
        appliedCoupon.value
      );
    }
  }

  const shippingFee =
    appliedCoupon?.code === 'FREESHIP'
      ? 0
      : rawShipping;

  const taxableAmount = Math.max(
    0,
    subtotal - discountAmount
  );

  const tax = Number(
    (taxableAmount * 0.12).toFixed(2)
  );

  const total = Number(
    Math.max(
      0,
      subtotal -
        discountAmount +
        shippingFee +
        tax
    ).toFixed(2)
  );

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        subtotal,
        shippingFee,
        tax,
        discountAmount,
        total,
        freeShippingThreshold,
        freeShippingProgress,
        appliedCoupon,
        isCartDrawerOpen,
        openCartDrawer,
        closeCartDrawer,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        applyCoupon,
        removeCoupon
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(
      'useCart must be used within CartProvider'
    );
  }

  return context;
};