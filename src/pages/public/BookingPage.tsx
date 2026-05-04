import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import { supabase } from '../../lib/supabase';
import { Service, BusinessHour, BlockedDate, CoachingSettings, Appointment } from '../../types';
import { format, addMinutes, parseISO, isBefore, isAfter, startOfDay, addDays, getDay, addHours, isSameDay } from 'date-fns';
import { CheckCircle, Calendar, Clock, ArrowLeft, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

type Step = 'service' | 'datetime' | 'details' | 'success';

interface TimeSlot {
  start: Date;
  end: Date;
  label: string;
}

export default function BookingPage() {
  const { serviceId } = useParams();
  
  const [step, setStep] = useState<Step>('service');
  const [isLoading, setIsLoading] = useState(true);
  
  // Data
  const [services, setServices] = useState<Service[]>([]);
  const [businessHours, setBusinessHours] = useState<BusinessHour[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [settings, setSettings] = useState<CoachingSettings | null>(null);
  
  // Selections
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()));
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  
  // Form Details
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const [
        { data: svcData },
        { data: bhData },
        { data: bdData },
        { data: setData }
      ] = await Promise.all([
        supabase.from('services').select('*').eq('is_active', true).order('created_at'),
        supabase.from('business_hours').select('*'),
        supabase.from('blocked_dates').select('*'),
        supabase.from('coaching_settings').select('*').single()
      ]);

      if (svcData) setServices(svcData);
      if (bhData) setBusinessHours(bhData);
      if (bdData) setBlockedDates(bdData);
      if (setData) {
        setSettings(setData);
      } else {
        setSettings({
          id: 'temp',
          coaching_name: 'Axiom Coaching',
          coaching_email: '',
          coaching_phone: '',
          coaching_address: '',
          slot_interval_minutes: 30,
          booking_notice_hours: 24,
          created_at: new Date().toISOString()
        } as CoachingSettings);
      }

      if (serviceId && svcData) {
        const found = svcData.find(s => s.id === serviceId);
        if (found) {
          setSelectedService(found);
          setStep('datetime');
        }
      }
      setIsLoading(false);
    }
    loadData();
  }, [serviceId]);

  useEffect(() => {
    if (step === 'datetime' && selectedService && selectedDate && settings) {
      loadAvailableSlots();
    }
  }, [selectedService, selectedDate, step]);

  const loadAvailableSlots = async () => {
    if (!selectedService || !settings) return;
    setSlotsLoading(true);

    try {
      // 1. Check if date is blocked
      const isBlocked = blockedDates.some(bd => {
        return isSameDay(parseISO(bd.blocked_date), selectedDate);
      });

      if (isBlocked) {
        setAvailableSlots([]);
        return;
      }

      // 2. Get business hours for this weekday
      const dayOfWeek = getDay(selectedDate);
      const todayHours = businessHours.find(bh => bh.weekday === dayOfWeek);

      if (!todayHours || !todayHours.is_open) {
        setAvailableSlots([]);
        return;
      }

      // 3. Fetch existing appointments for this date
      const nextDay = addDays(selectedDate, 1);
      const { data: apts } = await supabase
        .from('appointments')
        .select('start_time, end_time, appointment_date')
        .in('status', ['pending', 'confirmed'])
        .gte('appointment_date', format(selectedDate, 'yyyy-MM-dd'))
        .lt('appointment_date', format(nextDay, 'yyyy-MM-dd'));

      // 4. Generate slots
      const startTimeParts = todayHours.start_time.split(':');
      const endTimeParts = todayHours.end_time.split(':');
      
      const dayStart = new Date(selectedDate);
      dayStart.setHours(parseInt(startTimeParts[0], 10), parseInt(startTimeParts[1], 10), 0, 0);
      
      const dayEnd = new Date(selectedDate);
      dayEnd.setHours(parseInt(endTimeParts[0], 10), parseInt(endTimeParts[1], 10), 0, 0);

      const noticeBoundary = addHours(new Date(), settings.booking_notice_hours || 0);

      const slots: TimeSlot[] = [];
      let currentSlotStart = new Date(dayStart);

      while (isBefore(currentSlotStart, dayEnd)) {
        const currentSlotEnd = addMinutes(currentSlotStart, selectedService.duration_minutes);
        
        if (isAfter(currentSlotEnd, dayEnd)) {
          break; // too long for remaining time
        }

        if (isAfter(currentSlotStart, noticeBoundary)) {
          // Check overlap
          const hasOverlap = apts?.some(apt => {
            const aptDate = parseISO(apt.appointment_date); // this is YYYY-MM-DD
            if (!isSameDay(aptDate, selectedDate)) return false;

            const astParts = apt.start_time.split(':');
            const aetParts = apt.end_time.split(':');
            
            const aptStart = new Date(selectedDate);
            aptStart.setHours(parseInt(astParts[0], 10), parseInt(astParts[1], 10), 0, 0);
            
            const aptEnd = new Date(selectedDate);
            aptEnd.setHours(parseInt(aetParts[0], 10), parseInt(aetParts[1], 10), 0, 0);

            // overlap condition
            return (currentSlotStart < aptEnd && currentSlotEnd > aptStart);
          });

          if (!hasOverlap) {
            slots.push({
              start: new Date(currentSlotStart),
              end: new Date(currentSlotEnd),
              label: format(currentSlotStart, 'h:mm a')
            });
          }
        }
        
        currentSlotStart = addMinutes(currentSlotStart, settings.slot_interval_minutes || 30);
      }

      setAvailableSlots(slots);
    } catch (err) {
      console.error("Error generating slots", err);
    } finally {
      setSlotsLoading(false);
    }
  };

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !selectedSlot) return;
    setBookingLoading(true);

    try {
      const { error } = await supabase.from('appointments').insert({
        full_name: name,
        email,
        phone,
        service_id: selectedService.id,
        appointment_date: format(selectedDate, 'yyyy-MM-dd'),
        start_time: format(selectedSlot.start, 'HH:mm:ss'),
        end_time: format(selectedSlot.end, 'HH:mm:ss'),
        status: 'pending',
        notes
      });

      if (error) throw error;
      setStep('success');
    } catch (err) {
      console.error(err);
      alert('Failed to book appointment. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#f5f2ed]"><Loader2 className="animate-spin text-slate-800 w-8 h-8" /></div>;
  }

  // Next 14 dates for simple calendar
  const dateOptions = Array.from({ length: 14 }).map((_, i) => addDays(new Date(), i));

  return (
    <div className="min-h-screen bg-[#f5f2ed] pt-12 pb-24 px-6 font-sans text-slate-900">
      <div className="max-w-3xl mx-auto">
        <Link to="/" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 mb-10 transition-colors uppercase tracking-widest hover:-translate-x-1">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
        </Link>
        
        <header className="mb-12">
          <h1 className="text-4xl font-serif mb-3 font-light">Schedule Your Session</h1>
          <p className="text-slate-600 font-light text-lg">
            {step === 'service' && 'Select an area of focus.'}
            {step === 'datetime' && 'Choose a suitable time.'}
            {step === 'details' && 'Provide your information.'}
          </p>
        </header>

        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-slate-100/50">
          
          {step === 'service' && (
            <div className="space-y-4">
              {services.map(svc => (
                <button
                  key={svc.id}
                  onClick={() => { setSelectedService(svc); setStep('datetime'); }}
                  className="w-full text-left p-6 rounded-2xl border border-slate-200 hover:border-slate-400 hover:bg-slate-50 transition-all flex items-start justify-between group"
                >
                  <div>
                    <h3 className="font-serif text-xl mb-1 group-hover:text-amber-700 transition-colors">{svc.name}</h3>
                    <p className="text-slate-500 font-light text-sm">{svc.duration_minutes} minutes</p>
                  </div>
                  <div className="text-lg font-medium">${svc.price}</div>
                </button>
              ))}
            </div>
          )}

          {step === 'datetime' && (
            <div className="grid md:grid-cols-2 gap-12">
              <div>
                <h3 className="text-sm font-medium uppercase tracking-widest text-slate-400 mb-6">1. Date</h3>
                <div className="grid grid-cols-2 gap-3">
                  {dateOptions.map((date) => {
                    const isSelected = isSameDay(date, selectedDate);
                    return (
                      <button
                        key={date.toISOString()}
                        onClick={() => { setSelectedDate(startOfDay(date)); setSelectedSlot(null); }}
                        className={cn(
                          "py-4 rounded-2xl border flex flex-col items-center justify-center transition-all",
                          isSelected 
                            ? "border-slate-900 bg-slate-900 text-white shadow-md shadow-slate-900/10" 
                            : "border-slate-200 hover:border-slate-400 text-slate-700 hover:bg-slate-50"
                        )}
                      >
                        <span className="text-xs uppercase tracking-wider mb-1 font-medium opacity-80">{format(date, 'EEE')}</span>
                        <span className="text-xl font-serif leading-none">{format(date, 'd')}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium uppercase tracking-widest text-slate-400 mb-6 flex justify-between items-center">
                  2. Time
                  {slotsLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                </h3>
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                  {!slotsLoading && availableSlots.length === 0 && (
                    <div className="p-6 text-center border border-dashed border-slate-300 rounded-2xl text-slate-500 text-sm">
                      No availability on this date.
                    </div>
                  )}
                  {!slotsLoading && availableSlots.map((slot, idx) => {
                    const isSelected = selectedSlot?.start.getTime() === slot.start.getTime();
                    return (
                      <button
                        key={idx}
                        onClick={() => setSelectedSlot(slot)}
                        className={cn(
                          "w-full text-left px-5 py-4 rounded-xl border transition-all flex items-center justify-between",
                          isSelected 
                            ? "border-slate-900 bg-slate-50 ring-1 ring-slate-900" 
                            : "border-slate-200 hover:border-slate-400"
                        )}
                      >
                        <span className="font-medium text-slate-900">{slot.label}</span>
                        {isSelected && <CheckCircle className="w-5 h-5 text-slate-900" />}
                      </button>
                    )
                  })}
                </div>

                {selectedSlot && (
                  <button 
                    onClick={() => setStep('details')}
                    className="w-full mt-8 py-4 rounded-full bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors flex items-center justify-center"
                  >
                    Continue
                    <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                  </button>
                )}
              </div>
            </div>
          )}

          {step === 'details' && (
            <div className="grid md:grid-cols-5 gap-12">
              <div className="md:col-span-3">
                <form onSubmit={handleBook} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
                    <input 
                      type="text" required
                      value={name} onChange={e => setName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
                    <input 
                      type="email" required
                      value={email} onChange={e => setEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number</label>
                    <input 
                      type="tel" required
                      value={phone} onChange={e => setPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Preparation Notes (Optional)</label>
                    <textarea 
                      rows={3}
                      value={notes} onChange={e => setNotes(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all resize-none"
                    ></textarea>
                  </div>
                  <div className="pt-4 flex items-center gap-4">
                     <button 
                        type="button"
                        onClick={() => setStep('datetime')}
                        className="px-6 py-3 rounded-full border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors"
                      >
                        Back
                      </button>
                    <button 
                      type="submit"
                      disabled={bookingLoading}
                      className="flex-1 py-3 rounded-full bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors disabled:opacity-50 flex justify-center items-center"
                    >
                      {bookingLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm Booking'}
                    </button>
                  </div>
                </form>
              </div>

              <div className="md:col-span-2 space-y-6">
                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                  <h4 className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-4">Session Summary</h4>
                  <div className="font-serif text-xl mb-4">{selectedService?.name}</div>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center text-slate-600">
                      <Calendar className="w-4 h-4 mr-3 text-slate-400" />
                      {format(selectedDate, 'EEEE, MMMM do, yyyy')}
                    </div>
                    <div className="flex items-center text-slate-600">
                      <Clock className="w-4 h-4 mr-3 text-slate-400" />
                      {selectedSlot?.label} ({selectedService?.duration_minutes} min)
                    </div>
                  </div>
                  
                  <div className="mt-6 pt-6 border-t border-slate-200 flex justify-between items-center font-medium">
                    <span className="text-slate-600">Total</span>
                    <span className="text-xl">${selectedService?.price}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center py-12 max-w-md mx-auto relative">
              <div className="absolute inset-0 bg-green-50 rounded-full blur-3xl opacity-50 -z-10 animate-pulse"></div>
              <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg shadow-green-500/20">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-serif text-slate-900 mb-4">Request Confirmed.</h2>
              <p className="text-slate-600 font-light leading-relaxed mb-8">
                Your consultation request for <strong>{format(selectedDate, 'MMMM do')} at {selectedSlot?.label}</strong> has been received. Our team will review and confirm shortly.
              </p>
              <Link 
                to="/"
                className="inline-flex px-8 py-3 rounded-full border border-slate-200 text-slate-900 font-medium hover:bg-slate-50 transition-colors"
              >
                Return to Home
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
