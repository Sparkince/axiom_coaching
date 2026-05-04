import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Appointment, Service } from '../../types';
import { Calendar, CheckCircle, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function Overview() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      const [{ data: apts }, { data: svcs }] = await Promise.all([
        supabase.from('appointments').select('*').order('appointment_date', { ascending: true }),
        supabase.from('services').select('*').eq('is_active', true)
      ]);
      if (apts) setAppointments(apts);
      if (svcs) setServices(svcs);
      setLoading(false);
    }
    loadStats();
  }, []);

  const pending = appointments.filter(a => a.status === 'pending');
  const upcoming = appointments.filter(a => a.status === 'confirmed' && new Date(a.appointment_date) >= new Date());
  const completed = appointments.filter(a => a.status === 'completed');

  if (loading) {
    return <div className="animate-pulse h-64 bg-slate-100 rounded-3xl" />;
  }

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-3xl font-serif text-slate-900 mb-2">Overview</h1>
        <p className="text-slate-500 font-light">Your coaching practice at a glance.</p>
      </header>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold mb-1">Pending Requests</p>
            <p className="text-4xl font-serif text-slate-900">{pending.length}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>
        
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold mb-1">Upcoming Confirmed</p>
            <p className="text-4xl font-serif text-slate-900">{upcoming.length}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold mb-1">Completed Sessions</p>
            <p className="text-4xl font-serif text-slate-900">{completed.length}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-green-600">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
        <h2 className="text-lg font-medium text-slate-900 mb-6">Recent Upcoming Appointments</h2>
        {upcoming.length === 0 ? (
          <p className="text-slate-500 font-light text-sm">No upcoming confirmed appointments.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {upcoming.slice(0, 5).map(apt => {
              const svc = services.find(s => s.id === apt.service_id);
              return (
                <div key={apt.id} className="py-4 flex justify-between items-center group">
                  <div>
                    <p className="font-medium text-slate-900 mb-1">{apt.full_name}</p>
                    <p className="text-sm text-slate-500">{svc?.name || 'Unknown Service'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-900 text-sm font-medium mb-1">
                      {format(parseISO(apt.appointment_date), 'MMM d, yyyy')}
                    </p>
                    <p className="text-slate-500 text-xs">
                      {apt.start_time ? String(apt.start_time).substring(0,5) : ''} - {apt.end_time ? String(apt.end_time).substring(0,5) : ''}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
