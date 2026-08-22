import React, { useState } from 'react';
import { Mail, Lock, ArrowRight, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../Api';
import { useNavigate } from 'react-router-dom';

export default function Login() {
    const navigate = useNavigate();

    // States
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    // Show toast
    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => {
            setToast({ show: false, message: '', type: 'success' });
        }, 4000);
    };

    // Handle input
    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Submit form
    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // API call
            const response = await fetch(`${api}/user/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const result = await response.json();

            if (response.ok) {
                showToast('Login successful!', 'success');

                // Save token
                if (result.token) {
                    localStorage.setItem("token", result.token);
                    localStorage.setItem("user", JSON.stringify(result.data));
                }

                // Redirect
                setTimeout(() => navigate('/dashboard'), 500);
            } else {
                showToast(result.message || 'Invalid credentials.', 'error');
            }
        } catch (error) {
            showToast('Server error.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        // Background color matched with AppLayout, added selection color
        <div className="relative min-h-screen bg-[#f8f9fc] flex flex-col items-center justify-center p-4 text-slate-800 font-sans overflow-hidden selection:bg-[#19b673] selection:text-white">

            {/* Background Glow Decorations (AI Theme Feel) */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[800px] h-[500px] bg-[#19b673]/10 blur-[100px] rounded-full pointer-events-none"></div>

            {/* Toast message - Updated with brand colors */}
            <div className={`fixed top-6 right-6 z-50 transition-all duration-300 transform ${toast.show ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0 pointer-events-none'}`}>
                <div className={`flex items-center gap-3 px-5 py-4 rounded-2xl shadow-xl border text-[15px] font-medium backdrop-blur-md ${toast.type === 'success' ? 'bg-white/95 text-slate-800 border-[#19b673]/30' : 'bg-white/95 text-slate-800 border-rose-200'}`}>
                    {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-[#19b673]" /> : <AlertCircle className="w-5 h-5 text-rose-500" />}
                    <span>{toast.message}</span>
                </div>
            </div>

            {/* Main card - Increased width, padding, and shadow */}
            <div className="relative bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] w-full max-w-[460px] p-8 sm:p-12 border border-slate-100/60 my-6 z-10">

                {/* Header - Bigger text */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#19b673]/10 text-[#19b673] text-[13px] font-bold mb-4 border border-[#19b673]/20">
                        <Sparkles className="w-4 h-4" /> AI Learning Platform
                    </div>
                    <h1 className="text-[28px] sm:text-3xl font-extrabold tracking-tight text-slate-900">Welcome back</h1>
                    <p className="text-[15px] text-slate-500 mt-2">Please enter your details to sign in.</p>
                </div>

                {/* Form */}
                <form onSubmit={handleLoginSubmit} className="space-y-6">

                    {/* Email */}
                    <div>
                        <label className="block text-[13px] font-bold uppercase tracking-wider text-slate-500 mb-2">Email Address</label>
                        <div className="relative group">
                            {/* Bigger icon */}
                            <Mail className="absolute inset-y-0 left-4 my-auto w-5 h-5 text-slate-400 group-focus-within:text-[#19b673] transition-colors" />
                            {/* Bigger input padding and font */}
                            <input
                                type="email"
                                name="email"
                                required
                                value={formData.email}
                                onChange={handleInputChange}
                                placeholder="rohit@gmail.com"
                                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-[15px] focus:outline-none focus:border-[#19b673] focus:bg-white focus:ring-4 focus:ring-[#19b673]/10 transition-all"
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-[13px] font-bold uppercase tracking-wider text-slate-500">Password</label>

                            {/* Forgot Password */}
                            <button type="button" onClick={() => navigate('/forgot')} className="text-[13px] font-bold text-[#19b673] hover:text-[#14955e] hover:underline transition-all">
                                Forgot password?
                            </button>
                        </div>
                        <div className="relative group">
                            {/* Bigger icon */}
                            <Lock className="absolute inset-y-0 left-4 my-auto w-5 h-5 text-slate-400 group-focus-within:text-[#19b673] transition-colors" />
                            {/* Bigger input padding and font */}
                            <input
                                type="password"
                                name="password"
                                required
                                value={formData.password}
                                onChange={handleInputChange}
                                placeholder="••••••••"
                                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-[15px] focus:outline-none focus:border-[#19b673] focus:bg-white focus:ring-4 focus:ring-[#19b673]/10 transition-all"
                            />
                        </div>
                    </div>

                    {/* Submit Button - Larger hit area */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-[#19b673] hover:bg-[#16a567] active:bg-[#14955e] text-white font-bold rounded-2xl flex items-center justify-center space-x-2 text-[16px] disabled:opacity-70 disabled:cursor-not-allowed transition-all mt-4 shadow-lg shadow-[#19b673]/25 hover:shadow-xl hover:shadow-[#19b673]/30"
                    >
                        <span>{loading ? 'Signing in...' : 'Sign in'}</span>
                        {!loading && <ArrowRight className="w-5 h-5" />}
                    </button>
                </form>

                {/* Signup link */}
                <div className="text-center mt-8">
                    <p className="text-[15px] text-slate-500">
                        Don't have an account?{' '}
                        <button type="button" onClick={() => navigate('/signup')} className="text-[#19b673] font-bold hover:underline transition-all">
                            Sign up
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}