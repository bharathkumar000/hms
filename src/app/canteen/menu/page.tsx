'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useModal } from '@/components/ModalProvider';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import styles from './menu.module.css';

const CATEGORIES = [
  'Breakfast', 'Lunch', 'Dinner', 'Snacks', 
  'Juices', 'Tea', 'Coffee', 'Healthy Meals', 'Patient Diet Meals'
];

export default function MenuManagement() {
  const { showAlert, showConfirm } = useModal();
  const supabase = createClient();
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Breakfast',
    is_available: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchMenu = async () => {
    const { data: cats } = await supabase.from('food_categories').select('*');
    if (cats) setCategories(cats);

    const { data } = await supabase.from('menu_items').select('*').order('name');
    if (data) setMenuItems(data);
    
    setLoading(false);
  };

  useEffect(() => {
    fetchMenu();
  }, [supabase]);

  const handleOpenModal = (item?: any) => {
    if (item) {
      setEditingItem(item.id);
      setFormData({
        name: item.name,
        description: item.description || '',
        price: item.price.toString(),
        category: item.category || 'Breakfast',
        is_available: item.is_available
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        category: 'Breakfast',
        is_available: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Find or create the category in food_categories
      let catId = categories.find(c => c.name === formData.category)?.id;
      
      if (!catId) {
        // If it doesn't exist, try to insert it (assuming RLS allows, or we just silently fail and leave it null if constraint is dropped)
        const { data: newCat, error: catErr } = await supabase.from('food_categories').insert({ name: formData.category }).select().single();
        if (newCat) {
          catId = newCat.id;
          setCategories(prev => [...prev, newCat]);
        }
      }

      if (editingItem) {
        const { error } = await supabase.from('menu_items')
          .update({
            name: formData.name,
            description: formData.description,
            price: Number(formData.price),
            category: formData.category,
            category_id: catId || undefined,
            is_available: formData.is_available
          })
          .eq('id', editingItem);
        
        if (error) throw error;
        showAlert('Menu item updated successfully');
      } else {
        const { error } = await supabase.from('menu_items')
          .insert([{
            name: formData.name,
            description: formData.description,
            price: Number(formData.price),
            category: formData.category,
            category_id: catId || undefined,
            is_available: formData.is_available
          }]);
        
        if (error) throw error;
        showAlert('Menu item created successfully');
      }
      setIsModalOpen(false);
      fetchMenu();
    } catch (err: any) {
      showAlert(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (await showConfirm('Are you sure you want to delete this menu item?')) {
      const { error } = await supabase.from('menu_items').delete().eq('id', id);
      if (error) showAlert(`Error: ${error.message}`);
      else fetchMenu();
    }
  };

  const toggleAvailability = async (id: string, current: boolean) => {
    const { error } = await supabase.from('menu_items').update({ is_available: !current }).eq('id', id);
    if (!error) fetchMenu();
  };

  if (loading) return <div>Loading menu...</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Menu Management</h1>
          <p className={styles.subtitle}>Manage all food and beverage items.</p>
        </div>
        <button className={styles.btnPrimary} onClick={() => handleOpenModal()}>
          <Plus size={18} /> Add Item
        </button>
      </header>

      <div className={styles.card}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>
                <th style={{ padding: '1rem' }}>Item Name</th>
                <th style={{ padding: '1rem' }}>Category</th>
                <th style={{ padding: '1rem' }}>Price (₹)</th>
                <th style={{ padding: '1rem' }}>Status</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {menuItems.map(item => (
                <tr key={item.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '1rem', fontWeight: 500 }}>
                    {item.name}
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontWeight: 400 }}>{item.description}</div>
                  </td>
                  <td style={{ padding: '1rem' }}>{item.category}</td>
                  <td style={{ padding: '1rem', fontWeight: 600 }}>₹{item.price}</td>
                  <td style={{ padding: '1rem' }}>
                    <button 
                      onClick={() => toggleAvailability(item.id, item.is_available)}
                      style={{ 
                        padding: '0.25rem 0.75rem', 
                        borderRadius: '999px', 
                        fontSize: '0.85rem', 
                        fontWeight: 600,
                        border: 'none',
                        cursor: 'pointer',
                        background: item.is_available ? '#dcfce7' : '#fee2e2',
                        color: item.is_available ? '#16a34a' : '#ef4444'
                      }}
                    >
                      {item.is_available ? 'Available' : 'Out of Stock'}
                    </button>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button onClick={() => handleOpenModal(item)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)' }}><Edit2 size={18} /></button>
                      <button onClick={() => handleDelete(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {menuItems.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>No menu items found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#fff', padding: '2rem', borderRadius: '1rem', width: '100%', maxWidth: '500px' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>{editingItem ? 'Edit Item' : 'Add Menu Item'}</h2>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Name</label>
                <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Description</label>
                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)' }} rows={3} />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Price (₹)</label>
                  <input required type="number" min="0" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Category</label>
                  <select required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)' }}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={formData.is_available} onChange={e => setFormData({...formData, is_available: e.target.checked})} />
                Item is available
              </label>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ flex: 1, padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={isSubmitting} style={{ flex: 1, padding: '0.75rem', borderRadius: '0.5rem', border: 'none', background: 'var(--color-primary)', color: 'white', fontWeight: 600, cursor: 'pointer' }}>
                  {isSubmitting ? 'Saving...' : 'Save Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
