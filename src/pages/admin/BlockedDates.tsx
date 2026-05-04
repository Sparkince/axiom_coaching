import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { BlockedDate } from '../../types';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function BlockedDates() {
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [newDate, setNewDate] = useState('');
  const [reason, setReason] = useState('');
  const [adding, setAdding] = useState(false);

  const fetchBlockedDates = async () => {
    setLoading(true);
    const { data } = await supabase.from('blocked_dates').select('*').order('blocked_date', { ascending: true });
    if (data) setBlockedDates(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchBlockedDates();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDate) return;
    setAdding(true);
    
    try {
      await supabase.from('blocked_dates').insert([{
        blocked_date: newDate,
        reason
      }]);
      setNewDate('');
      setReason('');
      fetchBlockedDates();
    } catch (err) {
      console.error(err);
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from('blocked_dates').delete().eq('id', id);
    fetchBlockedDates();
  };

  if (loading) return <div className="p-8"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;

  const upcoming = blockedDates.filter(bd => new Date(bd.blocked_date) >= new Date());
  const past = blockedDates.filter(bd => new Date(bd.blocked_date) < new Date());

  return (
    <div className="max-w-4xl">
      <header className="mb-8">
        <h1 className="text-3xl font-serif text-slate-900 mb-2">Blocked Dates</h1>
        <p className="text-slate-500 font-light">Block out specific dates for holidays or time off.</p>
      </header>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 mb-8">
        <h2 className="text-lg font-medium text-slate-900 mb-6">Add New Block</h2>
        <form onSubmit={handleAdd} className="grid md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-4">
            <label className="block text-xs uppercase tracking-widest text-slate-500 font-semibold mb-2">Date</label>
            <input 
              type="date" required min={new Date().toISOString().split('T')[0]}
              value={newDate} onChange={e => setNewDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
          <div className="md:col-span-6">
            <label className="block text-xs uppercase tracking-widest text-slate-500 font-semibold mb-2">Reason</label>
            <input 
              type="text" placeholder="e.g. Vacation, Conference"
              value={reason} onChange={e => setReason(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
          <div className="md:col-span-2">
            <button 
              type="submit" disabled={adding}
              className="w-full py-3 rounded-xl bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors flex items-center justify-center disabled:opacity-50"
            >
              <Plus className="w-4 h-4 mr-2" /> Add
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50">
          <h3 className="font-semibold text-slate-900">Upcoming Blocked Dates</h3>
        </div>
        <ul className="divide-y divide-slate-100">
          {upcoming.map(bd => (
            <li key={bd.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div>
                <p className="font-medium text-slate-900">{format(parseISO(bd.blocked_date), 'EEEE, MMMM do, yyyy')}</p>
                {bd.reason && <p className="text-sm text-slate-500 mt-1">{bd.reason}</p>}
              </div>
              <button 
                onClick={() => handleDelete(bd.id)}
                className="p-3 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                title="Remove block"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </li>
          ))}
          {upcoming.length === 0 && (
            <li className="p-8 text-center text-slate-500">No upcoming blocked dates.</li>
          )}
        </ul>
      </div>
      
      {past.length > 0 && (
         <div className="mt-8 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden opacity-70">
          <div className="p-6 border-b border-slate-100 bg-slate-50">
            <h3 className="font-semibold text-slate-900">Past Blocked Dates</h3>
          </div>
          <ul className="divide-y divide-slate-100">
            {past.map(bd => (
              <li key={bd.id} className="p-6 flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900">{format(parseISO(bd.blocked_date), 'MMM do, yyyy')}</p>
                  {bd.reason && <p className="text-sm text-slate-500">{bd.reason}</p>}
                </div>
                 <button 
                  onClick={() => handleDelete(bd.id)}
                  className="p-3 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
