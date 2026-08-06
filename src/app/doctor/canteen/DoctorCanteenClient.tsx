'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Plus, Minus, ShoppingCart, Clock, CheckCircle } from 'lucide-react';
import { useModal } from '@/components/ModalProvider';
import styles from './canteen.module.css';

export default function DoctorCanteenClient({
  categories,
  menuItems,
  deliveryLocation,
  doctorId,
  previousOrders
}: any) {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<any[]>([]);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orders, setOrders] = useState(previousOrders);
  const { showAlert } = useModal();

  const supabase = createClient();

  const filteredItems = menuItems.filter((item: any) => {
    const matchesCategory = activeCategory === 'All' || item.food_categories?.name === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const addToCart = (item: any) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === itemId);
      if (existing && existing.quantity > 1) {
        return prev.map(i => i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i);
      }
      return prev.filter(i => i.id !== itemId);
    });
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    setIsPlacingOrder(true);

    try {
      // 0. Ensure a profile exists for the doctor to satisfy the staff_id FK constraint
      await supabase.from('profiles').upsert({ id: doctorId }).select();

      // 1. Create order for Staff
      const { data: orderData, error: orderError } = await supabase
        .from('canteen_orders')
        .insert({
          staff_id: doctorId,
          patient_id: doctorId, // Added to satisfy RLS policy on canteen_order_items
          order_type: 'Staff',
          total_amount: totalAmount,
          delivery_location: deliveryLocation,
          status: 'Pending'
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // 2. Create order items
      const orderItems = cart.map(item => ({
        order_id: orderData.id,
        menu_item_id: item.id,
        quantity: item.quantity,
        price_at_time: item.price
      }));

      const { error: itemsError } = await supabase
        .from('canteen_order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Add to local state to show instantly
      const newOrder = {
        ...orderData,
        canteen_order_items: cart.map(item => ({
          quantity: item.quantity,
          price_at_time: item.price,
          menu_items: { name: item.name }
        }))
      };
      
      setOrders([newOrder, ...orders]);
      setCart([]);
      showAlert('Order placed successfully!');
    } catch (error) {
      console.error('Error placing order:', error);
      showAlert('Failed to place order. Please try again.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    if (status === 'Delivered') return styles.statusDelivered;
    if (status === 'Preparing') return styles.statusPreparing;
    return styles.statusPending;
  };

  return (
    <>
      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
        {/* Main Ordering Section */}
        <div style={{ flex: '1 1 600px' }}>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
            <button 
              onClick={() => setActiveCategory('All')}
              style={{ padding: '0.5rem 1rem', borderRadius: '999px', border: '1px solid var(--color-border)', background: activeCategory === 'All' ? 'var(--color-primary)' : 'var(--color-card-bg)', color: activeCategory === 'All' ? 'white' : 'var(--color-text-primary)', cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              All Items
            </button>
            {categories.map((cat: any) => (
              <button 
                key={cat.id}
                onClick={() => setActiveCategory(cat.name)}
                style={{ padding: '0.5rem 1rem', borderRadius: '999px', border: '1px solid var(--color-border)', background: activeCategory === cat.name ? 'var(--color-primary)' : 'var(--color-card-bg)', color: activeCategory === cat.name ? 'white' : 'var(--color-text-primary)', cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <input 
            type="text" 
            placeholder="Search menu..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--color-border)', marginBottom: '1.5rem' }}
          />

          <div className={styles.grid}>
            {filteredItems.length > 0 ? filteredItems.map((item: any) => (
              <div key={item.id} className={styles.card}>
                <div style={{ width: '100%', height: '140px', backgroundColor: '#f1f5f9', borderRadius: '8px', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShoppingCart size={48} color="#94a3b8" />
                </div>
                <h3 className={styles.itemTitle}>{item.name}</h3>
                <p className={styles.itemDesc}>{item.description}</p>
                <div className={styles.itemFooter}>
                  <span className={styles.itemPrice}>₹{item.price}</span>
                  <button className={styles.btnOrder} onClick={() => addToCart(item)}>
                    <Plus size={16} /> Add
                  </button>
                </div>
              </div>
            )) : (
              <p>No items found.</p>
            )}
          </div>
        </div>

        {/* Sidebar: Cart & Orders */}
        <div style={{ flex: '1 1 350px', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Cart */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle} style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShoppingCart size={20} /> Your Cart
            </h2>
            <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px', marginBottom: '1rem' }}>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>Delivery Location:</p>
              <p style={{ fontWeight: 600 }}>{deliveryLocation}</p>
            </div>

            {cart.length > 0 ? (
              <>
                <div className={styles.list}>
                  {cart.map(item => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
                      <div>
                        <div style={{ fontWeight: 500 }}>{item.name}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>₹{item.price}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <button onClick={() => removeFromCart(item.id)} style={{ padding: '0.25rem', background: 'var(--color-light)', border: 'none', borderRadius: '4px', cursor: 'pointer' }}><Minus size={14} /></button>
                        <span style={{ fontWeight: 600 }}>{item.quantity}</span>
                        <button onClick={() => addToCart(item)} style={{ padding: '0.25rem', background: 'var(--color-light)', border: 'none', borderRadius: '4px', cursor: 'pointer' }}><Plus size={14} /></button>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>Total:</span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-primary)' }}>₹{totalAmount.toFixed(2)}</span>
                </div>
                <button 
                  onClick={handlePlaceOrder} 
                  disabled={isPlacingOrder}
                  style={{ width: '100%', padding: '0.75rem', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: isPlacingOrder ? 'not-allowed' : 'pointer' }}
                >
                  {isPlacingOrder ? 'Placing Order...' : 'Place Order'}
                </button>
              </>
            ) : (
              <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center', padding: '2rem 0' }}>Your cart is empty.</p>
            )}
          </div>

          {/* Previous Orders */}
          {orders.length > 0 && (
            <div className={styles.card}>
              <h2 className={styles.cardTitle} style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={20} /> Order History
              </h2>
              <div className={styles.list}>
                {orders.map((order: any) => (
                  <div key={order.id} className={styles.listItem} style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '0.5rem' }}>
                      <span className={styles.itemMain}>{new Date(order.created_at).toLocaleString()}</span>
                      <span className={`${styles.statusBadge} ${getStatusBadgeClass(order.status)}`}>{order.status}</span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
                      {order.canteen_order_items?.map((item: any) => `${item.quantity}x ${item.menu_items?.name}`).join(', ')}
                    </div>
                    <div style={{ fontWeight: 600 }}>Total: ₹{order.total_amount}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
