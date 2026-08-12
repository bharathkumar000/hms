'use client';
import { useModal } from '@/components/ModalProvider';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Truck, Plus, PackageOpen, CheckCircle } from 'lucide-react';
import styles from './purchases.module.css';

export default function PharmacyPurchases() {
  const { showAlert } = useModal();
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState('orders'); // orders, suppliers
  const [loading, setLoading] = useState(true);

  // Data
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [medicines, setMedicines] = useState<any[]>([]);

  // Modals
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);

  // Forms
  const [supplierForm, setSupplierForm] = useState({ name: '', contact_person: '', phone: '', email: '', address: '' });
  const [orderForm, setOrderForm] = useState({ supplier_id: '', medicine_id: '', quantity: 1, unit_price: 0, expected_date: '' });
  const [receiveForm, setReceiveForm] = useState({ batch_number: '', expiry_date: '' });
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    if (activeTab === 'suppliers') {
      const { data } = await supabase.from('suppliers').select('*').order('name');
      if (data) setSuppliers(data);
    } else {
      const { data: ord } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          suppliers(name),
          purchase_order_items(medicine_id, quantity, unit_price, medicines(name))
        `)
        .order('created_at', { ascending: false });
      if (ord) setOrders(ord);
      
      const { data: meds } = await supabase.from('medicines').select('id, name');
      if (meds) setMedicines(meds);
      
      const { data: supps } = await supabase.from('suppliers').select('id, name');
      if (supps) setSuppliers(supps);
    }
    setLoading(false);
  };

  const saveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('suppliers').insert([supplierForm]);
    if (!error) {
      setShowSupplierModal(false);
      setSupplierForm({ name: '', contact_person: '', phone: '', email: '', address: '' });
      fetchData();
      showAlert('Supplier added successfully!');
    } else {
      showAlert('Error: ' + error.message);
    }
  };

  const saveOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const total_amount = orderForm.quantity * orderForm.unit_price;
    
    // 1. Create Order
    const { data: newOrder, error: orderErr } = await supabase
      .from('purchase_orders')
      .insert([{ supplier_id: orderForm.supplier_id, status: 'Pending', total_amount, delivery_date: orderForm.expected_date || null }])
      .select()
      .single();

    if (orderErr) {
      showAlert('Error: ' + orderErr.message);
      return;
    }

    // 2. Add Order Item
    await supabase.from('purchase_order_items').insert([{
      order_id: newOrder.id,
      medicine_id: orderForm.medicine_id,
      quantity: orderForm.quantity,
      unit_price: orderForm.unit_price
    }]);

    setShowOrderModal(false);
    setOrderForm({ supplier_id: '', medicine_id: '', quantity: 1, unit_price: 0, expected_date: '' });
    fetchData();
    showAlert('Purchase order created successfully!');
  };

  const handleReceiveStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    const item = selectedOrder.purchase_order_items[0]; // Simplifying to 1 item per PO

    // 1. Create Medicine Batch
    const { data: batch, error: batchErr } = await supabase.from('medicine_batches').insert([{
      medicine_id: item.medicine_id,
      supplier_id: selectedOrder.supplier_id,
      batch_number: receiveForm.batch_number,
      quantity: item.quantity,
      expiry_date: receiveForm.expiry_date
    }]).select().single();

    if (batchErr) {
      showAlert('Error creating batch: ' + batchErr.message);
      return;
    }

    // 2. Record Stock Transaction (IN)
    await supabase.from('stock_transactions').insert([{
      medicine_id: item.medicine_id,
      batch_id: batch.id,
      transaction_type: 'IN',
      quantity: item.quantity,
      reference_type: 'Purchase Order',
      reference_id: selectedOrder.id,
      notes: `Received stock from PO ${selectedOrder.id}`
    }]);

    // 3. Update PO Status
    await supabase.from('purchase_orders').update({ status: 'Received' }).eq('id', selectedOrder.id);

    setShowReceiveModal(false);
    setReceiveForm({ batch_number: '', expiry_date: '' });
    fetchData();
    showAlert('Stock received and inventory updated successfully!');
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Purchase & Suppliers</h1>
          <p className={styles.details}>Manage suppliers, create purchase orders, and receive stock.</p>
        </div>
        <div className={styles.actions} style={{ backgroundColor: 'var(--color-light)', padding: '4px', borderRadius: '8px', display: 'flex', gap: '4px' }}>
          <button 
            type="button"
            className={activeTab === 'orders' ? styles.btnPrimary : styles.btnOutline} 
            style={activeTab === 'orders' ? { boxShadow: '0 2px 4px rgba(0,0,0,0.1)' } : { border: 'none', backgroundColor: 'transparent' }}
            onClick={() => setActiveTab('orders')}
          >
            Purchase Orders
          </button>
          <button 
            type="button"
            className={activeTab === 'suppliers' ? styles.btnPrimary : styles.btnOutline} 
            style={activeTab === 'suppliers' ? { boxShadow: '0 2px 4px rgba(0,0,0,0.1)' } : { border: 'none', backgroundColor: 'transparent' }}
            onClick={() => setActiveTab('suppliers')}
          >
            Suppliers
          </button>
        </div>
      </header>

      <div className={styles.card}>
        <div className={styles.filterGroup}>
          <h2 style={{ fontSize: '1.2rem', margin: 0, fontWeight: 700 }}>
            {activeTab === 'orders' ? 'Recent Purchase Orders' : 'Supplier Directory'}
          </h2>
          {activeTab === 'orders' ? (
            <button className={styles.btnPrimary} onClick={() => setShowOrderModal(true)}><Plus size={16} style={{display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom'}} /> New PO</button>
          ) : (
            <button className={styles.btnPrimary} onClick={() => setShowSupplierModal(true)}><Plus size={16} style={{display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom'}} /> Add Supplier</button>
          )}
        </div>

        {loading ? (
          <p>Loading data...</p>
        ) : activeTab === 'suppliers' ? (
          <div className={styles.list}>
            {suppliers.map(s => (
              <div key={s.id} className={styles.listItem}>
                <div>
                  <div className={styles.itemMain}><Truck size={18} style={{ display: 'inline', marginRight: '8px', color: 'var(--color-primary)' }}/>{s.name}</div>
                  <div className={styles.itemSub}>Contact: {s.contact_person} | {s.phone}</div>
                  <div className={styles.itemSub}>{s.email} | {s.address}</div>
                </div>
              </div>
            ))}
            {suppliers.length === 0 && <p>No suppliers found.</p>}
          </div>
        ) : (
          <div className={styles.list}>
            {orders.map(o => (
              <div key={o.id} className={styles.listItem}>
                <div>
                  <div className={styles.itemMain}>PO: {o.id.split('-')[0].toUpperCase()} - {o.suppliers?.name}</div>
                  <div className={styles.itemSub} style={{ fontWeight: 600 }}>
                    Item: {o.purchase_order_items[0]?.medicines?.name} x {o.purchase_order_items[0]?.quantity}
                  </div>
                  <div className={styles.itemSub}>Total: ₹{o.total_amount} | Date: {new Date(o.created_at).toLocaleDateString()}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                  <span className={`${styles.status} ${o.status === 'Received' ? styles.statusCompleted : styles.statusPending}`}>{o.status}</span>
                  {o.status === 'Pending' && (
                    <button className={styles.btnPrimary} onClick={() => { setSelectedOrder(o); setShowReceiveModal(true); }}>
                      <PackageOpen size={16} style={{display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom'}} /> Receive Stock
                    </button>
                  )}
                </div>
              </div>
            ))}
            {orders.length === 0 && <p>No purchase orders found.</p>}
          </div>
        )}
      </div>

      {showSupplierModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2 style={{marginBottom: '1.5rem'}}>Add New Supplier</h2>
            <form onSubmit={saveSupplier}>
              <div className={styles.formGroup}>
                <label>Supplier Name</label>
                <input required type="text" value={supplierForm.name} onChange={e => setSupplierForm({...supplierForm, name: e.target.value})} />
              </div>
              <div className={styles.formGroup}>
                <label>Contact Person</label>
                <input required type="text" value={supplierForm.contact_person} onChange={e => setSupplierForm({...supplierForm, contact_person: e.target.value})} />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className={styles.formGroup} style={{ flex: 1 }}>
                  <label>Phone</label>
                  <input required type="text" value={supplierForm.phone} onChange={e => setSupplierForm({...supplierForm, phone: e.target.value})} />
                </div>
                <div className={styles.formGroup} style={{ flex: 1 }}>
                  <label>Email</label>
                  <input type="email" value={supplierForm.email} onChange={e => setSupplierForm({...supplierForm, email: e.target.value})} />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label>Address</label>
                <input type="text" value={supplierForm.address} onChange={e => setSupplierForm({...supplierForm, address: e.target.value})} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" className={styles.btnOutline} onClick={() => setShowSupplierModal(false)}>Cancel</button>
                <button type="submit" className={styles.btnPrimary}>Save Supplier</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showOrderModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2 style={{marginBottom: '1.5rem'}}>Create Purchase Order</h2>
            <form onSubmit={saveOrder}>
              <div className={styles.formGroup}>
                <label>Supplier</label>
                <select required value={orderForm.supplier_id} onChange={e => setOrderForm({...orderForm, supplier_id: e.target.value})}>
                  <option value="">-- Select Supplier --</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Medicine</label>
                <select required value={orderForm.medicine_id} onChange={e => setOrderForm({...orderForm, medicine_id: e.target.value})}>
                  <option value="">-- Select Medicine --</option>
                  {medicines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className={styles.formGroup} style={{ flex: 1 }}>
                  <label>Quantity</label>
                  <input required type="number" min="1" value={orderForm.quantity || ''} onChange={e => setOrderForm({...orderForm, quantity: e.target.value ? parseInt(e.target.value) : '' as any})} />
                </div>
                <div className={styles.formGroup} style={{ flex: 1 }}>
                  <label>Unit Price (₹)</label>
                  <input required type="number" step="0.01" min="0.01" value={orderForm.unit_price || ''} onChange={e => setOrderForm({...orderForm, unit_price: e.target.value ? parseFloat(e.target.value) : '' as any})} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" className={styles.btnOutline} onClick={() => setShowOrderModal(false)}>Cancel</button>
                <button type="submit" className={styles.btnPrimary}>Create PO</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showReceiveModal && selectedOrder && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2 style={{marginBottom: '1.5rem'}}>Receive Stock</h2>
            <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: 'var(--color-light)', borderRadius: '8px' }}>
              <p style={{marginBottom: '0.5rem'}}><strong>Item:</strong> {selectedOrder.purchase_order_items[0]?.medicines?.name}</p>
              <p><strong>Quantity Received:</strong> {selectedOrder.purchase_order_items[0]?.quantity}</p>
            </div>
            <form onSubmit={handleReceiveStock}>
              <div className={styles.formGroup}>
                <label>Batch Number</label>
                <input required type="text" value={receiveForm.batch_number} onChange={e => setReceiveForm({...receiveForm, batch_number: e.target.value})} />
              </div>
              <div className={styles.formGroup}>
                <label>Expiry Date</label>
                <input required type="date" value={receiveForm.expiry_date} onChange={e => setReceiveForm({...receiveForm, expiry_date: e.target.value})} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" className={styles.btnOutline} onClick={() => setShowReceiveModal(false)}>Cancel</button>
                <button type="submit" className={styles.btnPrimary}><CheckCircle size={16} style={{ display:'inline', marginRight:'4px', verticalAlign:'text-bottom' }} /> Confirm Receipt</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
