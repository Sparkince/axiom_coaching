import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { CoachingSettings } from '../../types';
import { Loader2 } from 'lucide-react';

export default function SettingsMenu() {
  const [settings, setSettings] = useState<CoachingSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    const { data } = await supabase.from('coaching_settings').select('*').limit(1).single();
    if (data) {
      setSettings(data);
    } else {
      // Create default if none exists
      const fallback = {
        coaching_name: 'Axiom Coaching',
        coaching_email: '',
        coaching_phone: '',
        coaching_address: '',
        slot_interval_minutes: 30,
        booking_notice_hours: 24,
      };
      setSettings(fallback as CoachingSettings);
    }
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);

    try {
      if (settings.id) {
        await supabase.from('coaching_settings').update(settings).eq('id', settings.id);
      } else {
        const { data, error } = await supabase.from('coaching_settings').insert([settings]).select().single();
        if (!error && data) setSettings(data);
      }
      alert('Settings saved successfully.');
    } catch (err) {
      console.error(err);
      alert('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;
  if (!settings) return null;

  return (
    <div className="max-w-4xl">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-serif text-slate-900 mb-2">Coaching Settings</h1>
          <p className="text-slate-500 font-light">Manage your brand and booking preferences.</p>
        </div>
      </header>

      <form onSubmit={handleSave} className="space-y-8">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
          <h2 className="text-lg font-medium text-slate-900 mb-6">Profile & Contact</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-xs uppercase tracking-widest text-slate-500 font-semibold mb-2">Practice Name</label>
              <input 
                type="text" required
                value={settings.coaching_name} onChange={e => setSettings({...settings, coaching_name: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-slate-500 font-semibold mb-2">Email Address</label>
              <input 
                type="email"
                value={settings.coaching_email} onChange={e => setSettings({...settings, coaching_email: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-slate-500 font-semibold mb-2">Phone Number</label>
              <input 
                type="text"
                value={settings.coaching_phone} onChange={e => setSettings({...settings, coaching_phone: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-colors"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs uppercase tracking-widest text-slate-500 font-semibold mb-2">Office Address</label>
              <input 
                type="text"
                value={settings.coaching_address} onChange={e => setSettings({...settings, coaching_address: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-colors"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
          <h2 className="text-lg font-medium text-slate-900 mb-6">Booking Preferences</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs uppercase tracking-widest text-slate-500 font-semibold mb-2">Slot Interval (Minutes)</label>
              <p className="text-sm text-slate-500 mb-3">How often start times appear (e.g. every 30 or 60 mins).</p>
              <input 
                type="number" required min="15" step="15"
                value={settings.slot_interval_minutes} onChange={e => setSettings({...settings, slot_interval_minutes: parseInt(e.target.value)})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-slate-500 font-semibold mb-2">Minimum Booking Notice (Hours)</label>
              <p className="text-sm text-slate-500 mb-3">How much notice is required before an appointment.</p>
              <input 
                type="number" required min="0" step="1"
                value={settings.booking_notice_hours} onChange={e => setSettings({...settings, booking_notice_hours: parseInt(e.target.value)})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-colors"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end border-t border-slate-200 pt-8">
          <button 
            type="submit" disabled={saving}
            className="px-8 py-3 rounded-full bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
