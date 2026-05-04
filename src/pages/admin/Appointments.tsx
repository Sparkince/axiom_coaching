import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Appointment, Service } from '../../types';
import { Loader2, Search, Filter } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '../../lib/utils';

export default function AppointmentsMenu() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Record<string, Service>>({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const fetchAppointments = async () => {
    setLoading(true);
    const [aptsRes, svcsRes] = await Promise.all([
      supabase.from('appointments').select('*').order('appointment_date', { ascending: false }).order('start_time', { ascending: false }),
      supabase.from('services').select('*')
    ]);
    
    if (aptsRes.error) console.error("Error fetching appointments:", aptsRes.error);
    if (svcsRes.error) console.error("Error fetching services:", svcsRes.error);

    if (aptsRes.data) setAppointments(aptsRes.data);
    
    if (svcsRes.data) {
      const svcsMap: Record<string, Service> = {};
      svcsRes.data.forEach(s => svcsMap[s.id] = s);
      setServices(svcsMap);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    await supabase.from('appointments').update({ status: newStatus }).eq('id', id);
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: newStatus as any } : a));
  };

  const filteredAppointments = appointments.filter(a => statusFilter === 'all' || a.status === statusFilter);

  return (
    <div className="max-w-6xl">
      <header className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-serif text-slate-900 mb-2">Appointments</h1>
          <p className="text-slate-500 font-light">View and manage your bookings.</p>
        </div>
      </header>

      <div className="flex items-center gap-4 mb-8">
        <div className="flex bg-white rounded-full p-1 border border-slate-200">
          {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium capitalize transition-colors",
                statusFilter === status 
                  ? "bg-slate-900 text-white" 
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              )}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="p-8"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
      ) : (
        <div className="space-y-4">
          {filteredAppointments.map(apt => {
            const svc = services[apt.service_id];
            return (
              <div key={apt.id} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all hover:border-slate-300">
                <div className="flex-1 grid md:grid-cols-12 gap-6 items-center">
                  <div className="md:col-span-3">
                    <p className="font-semibold text-slate-900 mb-1">{apt.full_name}</p>
                    <p className="text-sm text-slate-500">{apt.email}</p>
                    <p className="text-sm text-slate-500">{apt.phone}</p>
                  </div>
                  
                  <div className="md:col-span-4">
                    <p className="text-sm font-medium text-slate-900 mb-1">{svc?.name || 'Unknown Service'}</p>
                    <p className="text-sm text-slate-500">
                      {format(parseISO(apt.appointment_date), 'EEEE, MMM do, yyyy')}
                    </p>
                    <p className="text-sm text-slate-500">
                      {apt.start_time ? String(apt.start_time).substring(0,5) : ''} - {apt.end_time ? String(apt.end_time).substring(0,5) : ''}
                    </p>
                  </div>

                  <div className="md:col-span-5 relative">
                    {apt.notes && (
                      <div className="bg-slate-50 rounded-xl p-3 text-sm text-slate-600 border border-slate-100">
                        <span className="font-semibold text-slate-400 text-xs uppercase tracking-wider block mb-1">Notes</span>
                        {apt.notes}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 md:border-l md:border-slate-100 md:pl-6">
                  <select 
                    value={apt.status}
                    onChange={(e) => handleUpdateStatus(apt.id, e.target.value)}
                    className={cn(
                      "text-sm font-medium px-4 py-2.5 rounded-full border appearance-none cursor-pointer pr-8 bg-no-repeat",
                      apt.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      apt.status === 'confirmed' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      apt.status === 'completed' ? 'bg-green-50 text-green-700 border-green-200' :
                      'bg-slate-50 text-slate-700 border-slate-200'
                    )}
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                      backgroundPosition: 'right 0.75rem center',
                      backgroundSize: '1rem'
                    }}
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            );
          })}
          
          {filteredAppointments.length === 0 && (
            <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center">
              <p className="text-slate-500">No appointments found matching this filter.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
