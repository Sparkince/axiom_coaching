import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { BusinessHour } from '../../types';
import { Loader2 } from 'lucide-react';

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function BusinessHours() {
  const [hours, setHours] = useState<BusinessHour[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchHours();
  }, []);

  const fetchHours = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('business_hours').select('*').order('weekday', { ascending: true });
    
    if (error) {
      console.error("Error fetching business_hours:", error);
    }
    
    // Fill missing days if necessary for UI representation
    const fullWeek = WEEKDAYS.map((_, index) => {
      const existing = data?.find(h => h.weekday === index);
      return existing || {
        id: `temp-${index}`,
        weekday: index,
        is_open: index > 0 && index < 6, // default Mon-Fri open
        start_time: '09:00:00',
        end_time: '17:00:00'
      } as BusinessHour;
    });

    setHours(fullWeek);
    setLoading(false);
  };

  const handleToggle = (index: number) => {
    setHours(prev => prev.map((h, i) => i === index ? { ...h, is_open: !h.is_open } : h));
  };

  const handleTimeChange = (index: number, field: 'start_time' | 'end_time', value: string) => {
    setHours(prev => prev.map((h, i) => i === index ? { ...h, [field]: value.length === 5 ? value + ':00' : value } : h));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const toUpsert = hours.map(h => {
        const payload: any = {
          weekday: h.weekday,
          is_open: h.is_open,
          start_time: h.start_time,
          end_time: h.end_time
        };
        // if id doesn't start with temp-, include it
        if (h.id && !String(h.id).startsWith('temp-')) {
          payload.id = h.id;
        }
        return payload;
      });

      const { error } = await supabase.from('business_hours').upsert(toUpsert, { onConflict: 'weekday' });
      if (error) throw error;
      
      await fetchHours();
      alert('Business hours saved successfully.');
    } catch (err) {
      console.error(err);
      alert('Failed to save business hours.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;

  return (
    <div className="max-w-4xl">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-serif text-slate-900 mb-2">Business Hours</h1>
          <p className="text-slate-500 font-light">Set your weekly recurring availability.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="px-8 py-3 rounded-full bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </header>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 space-y-4">
        <div className="grid grid-cols-12 gap-4 pb-4 border-b border-slate-100 text-xs uppercase tracking-widest text-slate-400 font-semibold px-4">
          <div className="col-span-4">Day</div>
          <div className="col-span-8 grid grid-cols-2 gap-4">
            <div>Start Time</div>
            <div>End Time</div>
          </div>
        </div>

        {hours.map((hour, index) => (
          <div key={hour.weekday} className="grid grid-cols-12 gap-4 items-center p-4 rounded-xl hover:bg-slate-50 transition-colors">
            <div className="col-span-4 flex items-center">
              <label className="relative inline-flex items-center cursor-pointer mr-4">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={hour.is_open}
                  onChange={() => handleToggle(index)}
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-900"></div>
              </label>
              <span className={`font-medium ${hour.is_open ? 'text-slate-900' : 'text-slate-400'}`}>
                {WEEKDAYS[hour.weekday]}
              </span>
            </div>
            
            <div className={`col-span-8 grid grid-cols-2 gap-4 transition-opacity ${hour.is_open ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
              <input 
                type="time" 
                value={hour.start_time ? String(hour.start_time).substring(0, 5) : '09:00'} 
                onChange={(e) => handleTimeChange(index, 'start_time', e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
              <input 
                type="time" 
                value={hour.end_time ? String(hour.end_time).substring(0, 5) : '17:00'} 
                onChange={(e) => handleTimeChange(index, 'end_time', e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
