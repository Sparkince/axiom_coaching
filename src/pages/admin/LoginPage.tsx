import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Navigate } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { user, isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  if (user && isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      // Note: AuthContext handles checking if they are an admin via onAuthStateChange
      
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8] px-6">
      <div className="w-full max-w-md bg-white rounded-3xl p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
        <div className="text-center mb-10">
          <h1 className="text-2xl font-serif text-slate-900 mb-2">Coach Portal</h1>
          <p className="text-slate-500 font-light text-sm">Sign in to manage your appointments and services.</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm mb-6 border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-xs uppercase tracking-widest text-slate-500 font-semibold mb-2">Email</label>
            <input 
              type="email" required
              value={email} onChange={e => setEmail(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-slate-500 font-semibold mb-2">Password</label>
            <input 
              type="password" required
              value={password} onChange={e => setPassword(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
            />
          </div>
          <button 
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-full bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center justify-center mt-4"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
