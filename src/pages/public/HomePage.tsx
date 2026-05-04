import React, { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { supabase } from '../../lib/supabase';
import { Service, CoachingSettings } from '../../types';
import { ArrowRight, Clock, Star, Users, MapPin, Phone, Mail } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function HomePage() {
  const [services, setServices] = useState<Service[]>([]);
  const [settings, setSettings] = useState<CoachingSettings | null>(null);

  useEffect(() => {
    supabase
      .from('services')
      .select('*')
      .eq('is_active', true)
      .order('created_at')
      .then(({ data }) => {
        if (data) setServices(data);
      });

    supabase
      .from('coaching_settings')
      .select('*')
      .single()
      .then(({ data }) => {
        if (data) {
          setSettings(data);
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
      });
  }, []);

  const coachName = settings?.coaching_name && settings.coaching_name !== 'Premium Coaching' ? settings.coaching_name : 'Axiom Coaching';
  const tagLine = 'Clarity, Strategy, and Direction for Your Next Chapter';

  return (
    <div className="flex flex-col min-h-screen bg-[#FAFAF8]">
      {/* Navbar */}
      <header className="fixed w-full top-0 z-50 bg-[#FAFAF8]/90 backdrop-blur-md border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="font-serif text-2xl tracking-tight text-slate-900 font-medium">
            {coachName}
          </div>
          <nav className="hidden md:flex gap-8 items-center text-sm font-medium text-slate-600">
            <a href="#services" className="hover:text-slate-900 transition-colors">Services</a>
            <a href="#about" className="hover:text-slate-900 transition-colors">About</a>
            <Link 
              to="/book" 
              className="px-6 py-2.5 rounded-full bg-slate-900 text-white hover:bg-slate-800 transition-colors"
            >
              Book Session
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-grow pt-20">
        {/* Hero Section */}
        <section className="relative w-full min-h-[90vh] flex items-center">
          <div className="absolute inset-0 bg-slate-900/5 z-10" />
          <div className="absolute inset-0">
            <img 
              src="https://images.unsplash.com/photo-1544928147-79a2dbc1f389?q=80&w=2000&auto=format&fit=crop" 
              alt="Consultation meeting" 
              className="w-full h-full object-cover object-[center_30%]"
            />
          </div>
          
          <div className="relative z-20 w-full max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 pt-20">
            <div className="bg-[#FAFAF8]/95 backdrop-blur-sm p-10 md:p-14 rounded-3xl shadow-xl max-w-xl">
              <div className="inline-block px-4 py-1.5 rounded-full border border-slate-200 text-xs uppercase tracking-widest font-semibold text-slate-500 mb-6">
                Strategic Guidance
              </div>
              <h1 className="font-serif text-5xl md:text-6xl text-slate-900 leading-[1.1] mb-6">
                Navigate the complex with confidence.
              </h1>
              <p className="text-lg text-slate-600 mb-10 leading-relaxed font-light">
                {tagLine}. Partner with an experienced advisor to overcome obstacles and accelerate your professional growth.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link 
                  to="/book" 
                  className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-slate-900 text-white font-medium hover:bg-slate-800 transition-all hover:shadow-lg hover:shadow-slate-900/20"
                >
                  Schedule a Consultation
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section id="services" className="py-32 bg-[#FAFAF8]">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center max-w-2xl mx-auto mb-20">
              <h2 className="font-serif text-4xl text-slate-900 mb-4">Areas of Practice</h2>
              <p className="text-slate-600 text-lg">
                Structured sessions designed to provide immediate clarity and long-term momentum.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {services.length > 0 ? services.map((service, index) => {
                const serviceImages = [
                  "https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&q=80&w=800", // discussion / coaching
                  "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=800", // strategy / planning
                  "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&q=80&w=800", // professional environment
                  "https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&q=80&w=800",
                ];
                const bgImage = serviceImages[index % serviceImages.length];

                return (
                <div key={service.id} className="group flex flex-col relative bg-white border border-slate-100 rounded-3xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  <div className="h-48 w-full relative overflow-hidden">
                    <img src={bgImage} alt={service.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <div className="absolute bottom-4 left-6 text-white">
                      <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center mb-2">
                        <Clock className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-8 flex flex-col flex-grow">
                    <h3 className="text-xl font-serif text-slate-900 mb-3">{service.name}</h3>
                    <p className="text-slate-600 mb-8 flex-grow leading-relaxed line-clamp-3">
                      {service.description}
                    </p>
                    
                    <div className="flex items-center justify-between mt-auto pt-6 border-t border-slate-100">
                      <div className="flex flex-col">
                        <span className="text-sm text-slate-500 font-medium">{service.duration_minutes} min</span>
                        <span className="text-lg text-slate-900 font-semibold">${service.price}</span>
                      </div>
                      <Link 
                        to={`/book/${service.id}`}
                        className="px-5 py-2.5 rounded-full border border-slate-200 text-slate-900 font-medium hover:bg-slate-50 transition-colors"
                      >
                        Book
                      </Link>
                    </div>
                  </div>
                </div>
              )}) : (
                <div className="col-span-full py-12 text-center text-slate-500">
                  Loading services or no active services available.
                </div>
              )}
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="py-32 bg-white">
          <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <div className="absolute inset-0 bg-slate-100 rounded-3xl translate-x-4 translate-y-4" />
              <img 
                src="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=80&w=1200" 
                alt="Strategy planning" 
                className="relative z-10 w-full rounded-3xl object-cover aspect-[4/5] shadow-lg"
              />
            </div>
            <div className="max-w-lg">
              <h2 className="font-serif text-4xl text-slate-900 mb-6">
                Guiding leaders through pivotal decisions.
              </h2>
              <p className="text-slate-600 text-lg mb-6 leading-relaxed">
                I partner with driven professionals, founders, and executives to untangle complex challenges and build actionable strategies.
              </p>
              <p className="text-slate-600 text-lg mb-10 leading-relaxed">
                Whether you're looking to scale your business, transition your career, or simply gain clarity on your next major move, a targeted consultation provides the perspective required to act decisively.
              </p>
              <div className="space-y-4">
                <div className="flex items-center text-slate-900 font-medium">
                  <Star className="w-5 h-5 text-slate-400 mr-3" /> Dedicated 1:1 Focus
                </div>
                <div className="flex items-center text-slate-900 font-medium">
                  <Users className="w-5 h-5 text-slate-400 mr-3" /> Unbiased Perspective
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 py-20 text-white">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-12">
          <div>
            <div className="font-serif text-2xl font-medium mb-6">
              {coachName}
            </div>
            <p className="text-slate-400 max-w-xs leading-relaxed">
              Premium consultation and coaching to accelerate your professional growth.
            </p>
          </div>
          <div>
            <h4 className="text-lg font-medium mb-6">Contact</h4>
            <div className="space-y-4 text-slate-400">
              {settings?.coaching_email && (
                <div className="flex items-center">
                  <Mail className="w-4 h-4 mr-3" /> {settings.coaching_email}
                </div>
              )}
              {settings?.coaching_phone && (
                <div className="flex items-center">
                  <Phone className="w-4 h-4 mr-3" /> {settings.coaching_phone}
                </div>
              )}
              {settings?.coaching_address && (
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-3" /> {settings.coaching_address}
                </div>
              )}
            </div>
          </div>
          <div>
            <h4 className="text-lg font-medium mb-6">Admin</h4>
            <Link to="/admin/login" className="text-slate-400 hover:text-white transition-colors">
              Coach Login
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
