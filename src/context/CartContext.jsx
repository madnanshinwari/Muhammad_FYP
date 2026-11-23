import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem('as_dairy_cart');
    if (!saved) return [];
    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      localStorage.removeItem('as_dairy_cart');
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('as_dairy_cart', JSON.stringify(items));
  }, [items]);

  // Compute price based on unit multiplier
  const computePrice = (basePrice, unit) => {
    const num = parseFloat(unit);
    if (!isNaN(num)) {
      return Math.round(basePrice * num);
    }
    return basePrice;
  };

  const addItem = (product, unit = '1.0', qty = 1) => {
    const unitPrice = computePrice(product.base_price, unit);
    setItems(prev => {
      const existingIndex = prev.findIndex(
        item => item.productId === product.id && item.unit === unit
      );
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].qty += qty;
        return updated;
      } else {
        return [
          ...prev,
          {
            productId: product.id,
            name: product.name_en,
            name_ur: product.name_ur,
            unitType: product.unit_type,
            unit: unit,
            price: unitPrice,
            qty: qty,
            image_url: product.image_url,
            isMilk: product.category === 'milk'
          }
        ];
      }
    });
  };

  const updateQty = (productId, unit, delta) => {
    setItems(prev => {
      return prev
        .map(item => {
          if (item.productId === productId && item.unit === unit) {
            const newQty = item.qty + delta;
            return newQty > 0 ? { ...item, qty: newQty } : null;
          }
          return item;
        })
        .filter(Boolean);
    });
  };

  const removeItem = (productId, unit) => {
    setItems(prev => prev.filter(item => !(item.productId === productId && item.unit === unit)));
  };

  const getItemQty = (productId, unit) => {
    const found = items.find(item => item.productId === productId && item.unit === unit);
    return found ? found.qty : 0;
  };

  const clearCart = () => {
    setItems([]);
  };

  // Subtotal calculation
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.qty), 0);

  // Returnable glass bottle deposit (Rs 50 per bottle - 1 bottle per milk item)
  const bottleCount = items
    .filter((item) => item.isMilk)
    .reduce((count, item) => count + item.qty, 0);
  const bottleDeposit = bottleCount * 50;
  const totalAmount = subtotal + bottleDeposit;
  const totalItems = items.reduce((sum, item) => sum + item.qty, 0);

  return (
    <CartContext.Provider value={{
      items,
      isCartOpen,
      setIsCartOpen,
      addItem,
      updateQty,
      removeItem,
      getItemQty,
      clearCart,
      subtotal,
      bottleCount,
      bottleDeposit,
      totalAmount,
      totalItems
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
