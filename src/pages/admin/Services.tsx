import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Service } from '../../types';
import { Plus, Edit2, Check, X, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function ServicesMenu() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration_minutes: 60,
    price: 150,
    is_active: true
  });
  const [saving, setSaving] = useState(false);

  const fetchServices = async () => {
    setLoading(true);
    const { data } = await supabase.from('services').select('*').order('created_at', { ascending: false });
    if (data) setServices(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleEdit = (svc: Service) => {
    setFormData({
      name: svc.name,
      description: svc.description,
      duration_minutes: svc.duration_minutes,
      price: svc.price,
      is_active: svc.is_active
    });
    setEditingId(svc.id);
    setShowForm(true);
  };

  const handleAddNew = () => {
    setFormData({
      name: '',
      description: '',
      duration_minutes: 60,
      price: 150,
      is_active: true
    });
    setEditingId(null);
    setShowForm(true);
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    await supabase.from('services').update({ is_active: !currentStatus }).eq('id', id);
    fetchServices();
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    if (editingId) {
      await supabase.from('services').update(formData).eq('id', editingId);
    } else {
      await supabase.from('services').insert([formData]);
    }
    setSaving(false);
    setShowForm(false);
    fetchServices();
  };

  if (loading) return <div className="p-8"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;

  return (
    <div className="max-w-5xl">
      <header className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-serif text-slate-900 mb-2">Services</h1>
          <p className="text-slate-500 font-light">Manage your coaching offerings and pricing.</p>
        </div>
        {!showForm && (
          <button 
            onClick={handleAddNew}
            className="flex items-center px-5 py-2.5 bg-slate-900 text-white rounded-full font-medium hover:bg-slate-800 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Service
          </button>
        )}
      </header>

      {showForm && (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm mb-8">
          <h2 className="text-xl font-serif mb-6">{editingId ? 'Edit Service' : 'Add New Service'}</h2>
          <form onSubmit={handleSave} className="grid md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-xs uppercase tracking-widest text-slate-500 font-semibold mb-2">Service Name</label>
              <input 
                type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs uppercase tracking-widest text-slate-500 font-semibold mb-2">Description</label>
              <textarea 
                rows={3} required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-slate-500 font-semibold mb-2">Duration (Minutes)</label>
              <input 
                type="number" required min="15" step="15" value={formData.duration_minutes} onChange={e => setFormData({...formData, duration_minutes: parseInt(e.target.value)})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-slate-500 font-semibold mb-2">Price ($)</label>
              <input 
                type="number" required min="0" value={formData.price} onChange={e => setFormData({...formData, price: parseInt(e.target.value)})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
            <div className="md:col-span-2 flex items-center mt-2">
              <input 
                type="checkbox" id="isActive" checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})}
                className="w-5 h-5 rounded border-gray-300 text-slate-900 focus:ring-slate-900"
              />
              <label htmlFor="isActive" className="ml-3 text-sm font-medium text-slate-700">Service is active and bookable</label>
            </div>
            <div className="md:col-span-2 flex justify-end gap-3 mt-4 pt-6 border-t border-slate-100">
              <button 
                type="button" onClick={() => setShowForm(false)}
                className="px-6 py-2.5 rounded-full text-slate-600 font-medium hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit" disabled={saving}
                className="px-8 py-2.5 rounded-full bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Service'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-4 text-xs tracking-widest uppercase font-semibold text-slate-500">Service Name</th>
              <th className="px-6 py-4 text-xs tracking-widest uppercase font-semibold text-slate-500">Duration</th>
              <th className="px-6 py-4 text-xs tracking-widest uppercase font-semibold text-slate-500">Price</th>
              <th className="px-6 py-4 text-xs tracking-widest uppercase font-semibold text-slate-500">Status</th>
              <th className="px-6 py-4 text-xs tracking-widest uppercase font-semibold text-slate-500 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {services.map(svc => (
              <tr key={svc.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-900">{svc.name}</td>
                <td className="px-6 py-4 text-slate-600">{svc.duration_minutes} min</td>
                <td className="px-6 py-4 text-slate-600">${svc.price}</td>
                <td className="px-6 py-4">
                  <span className={cn(
                    "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold",
                    svc.is_active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"
                  )}>
                    {svc.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      onClick={() => handleToggleActive(svc.id, svc.is_active)}
                      className="p-2 text-slate-400 hover:text-slate-900 transition-colors rounded-lg hover:bg-slate-100"
                      title={svc.is_active ? "Deactivate" : "Activate"}
                    >
                      {svc.is_active ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                    </button>
                    <button 
                      onClick={() => handleEdit(svc)}
                      className="p-2 text-slate-400 hover:text-slate-900 transition-colors rounded-lg hover:bg-slate-100"
                      title="Edit Service"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {services.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-500">No services found. Add one to get started.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
