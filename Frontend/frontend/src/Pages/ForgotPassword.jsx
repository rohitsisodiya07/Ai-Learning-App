import React, { useState, useEffect } from 'react';
import { Mail, Lock, ArrowRight, Sparkles, CheckCircle2, AlertCircle, ShieldCheck, Clock } from 'lucide-react';
import api from '../Api';
import { useNavigate } from 'react-router-dom';

export default function ForgotPassword() {
    const navigate = useNavigate();

    // States
    const [step, setStep] = useState('email'); // 'email', 'otp', or 'reset'
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [passwords, setPasswords] = useState({ password: '', confirmPassword: '' });

    // UI states
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    // Timer states
    const [timeLeft, setTimeLeft] = useState(300); // 5 mins
    const [timerActive, setTimerActive] = useState(false);

    // Show toast
    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
    };

    // Timer logic
    useEffect(() => {
        let interval;
        if (timerActive && timeLeft > 0) {
            interval = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
        } else if (timeLeft === 0) {
            setTimerActive(false);
        }
        return () => clearInterval(interval);
    }, [timerActive, timeLeft]);

    // Format time (MM:SS)
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    // Timer color
    const getTimerColorClass = () => {
        if (timeLeft > 60) return 'bg-[#19b673]/10 text-[#19b673] border-[#19b673]/20';
        if (timeLeft > 10) return 'bg-amber-50 text-amber-600 border-amber-200';
        return 'bg-rose-50 text-rose-600 border-rose-200 animate-pulse font-bold';
    };

    // 1. Send OTP
    const handleSendOTP = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch(`${api}/user/forgotPassword`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const result = await response.json();

            if (response.ok) {
                showToast('OTP sent to your email!', 'success');
                setStep('otp');
                setTimeLeft(300);
                setTimerActive(true);
            } else {
                showToast(result.message || 'Error sending OTP.', 'error');
            }
        } catch (error) {
            showToast('Server error.', 'error');
        } finally {
            setLoading(false);
        }
    };

    // 2. Verify OTP
    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch(`${api}/user/verifyForgotPassword`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp }),
            });
            const result = await response.json();

            if (response.ok) {
                showToast('OTP verified!', 'success');
                setTimerActive(false);
                setStep('reset');
            } else {
                showToast(result.message || 'Invalid OTP.', 'error');
            }
        } catch (error) {
            showToast('Server error.', 'error');
        } finally {
            setLoading(false);
        }
    };

    // 3. Reset Password
    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (passwords.password !== passwords.confirmPassword) {
            showToast('Passwords do not match.', 'error');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(`${api}/user/resetPassword`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    password: passwords.password,
                    confirmPassword: passwords.confirmPassword
                }),
            });
            const result = await response.json();

            if (response.ok) {
                showToast('Password reset successfully!', 'success');
                setTimeout(() => navigate('/login'), 1500); // Go to login
            } else {
                showToast(result.message || 'Error resetting password.', 'error');
            }
        } catch (error) {
            showToast('Server error.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen bg-[#f8f9fc] flex flex-col items-center justify-center p-4 text-slate-800 font-sans overflow-hidden selection:bg-[#19b673] selection:text-white">

            {/* Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[800px] h-[500px] bg-[#19b673]/10 blur-[100px] rounded-full pointer-events-none"></div>

            {/* Toast message */}
            <div className={`fixed top-6 right-6 z-50 transition-all duration-300 transform ${toast.show ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0 pointer-events-none'}`}>
                <div className={`flex items-center gap-3 px-5 py-4 rounded-2xl shadow-xl border text-[15px] font-medium backdrop-blur-md ${toast.type === 'success' ? 'bg-white/95 text-slate-800 border-[#19b673]/30' : 'bg-white/95 text-slate-800 border-rose-200'}`}>
                    {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-[#19b673]" /> : <AlertCircle className="w-5 h-5 text-rose-500" />}
                    <span>{toast.message}</span>
                </div>
            </div>

            {/* Main card */}
            <div className="relative bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] w-full max-w-[460px] p-8 sm:p-12 border border-slate-100/60 my-6 z-10">

                {/* Header */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#19b673]/10 text-[#19b673] text-[13px] font-bold mb-4 border border-[#19b673]/20">
                        <Sparkles className="w-4 h-4" /> Account Recovery
                    </div>

                    <h1 className="text-[28px] sm:text-3xl font-extrabold tracking-tight text-slate-900">
                        {step === 'email' && 'Forgot password?'}
                        {step === 'otp' && 'Verify OTP'}
                        {step === 'reset' && 'New password'}
                    </h1>
                    <p className="text-[15px] text-slate-500 mt-2">
                        {step === 'email' && "Enter your email to receive an OTP."}
                        {step === 'otp' && `Enter the OTP sent to `}
                        {step === 'otp' && <span className="font-bold text-slate-700">{email}</span>}
                        {step === 'reset' && "Create a new strong password."}
                    </p>
                </div>

                {/* Step 1: Email Form */}
                {step === 'email' && (
                    <form onSubmit={handleSendOTP} className="space-y-6">
                        <div>
                            <label className="block text-[13px] font-bold uppercase tracking-wider text-slate-500 mb-2">Email Address</label>
                            <div className="relative group">
                                <Mail className="absolute inset-y-0 left-4 my-auto w-5 h-5 text-slate-400 group-focus-within:text-[#19b673] transition-colors" />
                                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="rohit@gmail.com" className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-[15px] focus:outline-none focus:border-[#19b673] focus:bg-white focus:ring-4 focus:ring-[#19b673]/10 transition-all" />
                            </div>
                        </div>
                        <button type="submit" disabled={loading} className="w-full py-4 bg-[#19b673] hover:bg-[#16a567] active:bg-[#14955e] text-white font-bold rounded-2xl flex items-center justify-center space-x-2 text-[16px] disabled:opacity-70 transition-all mt-4 shadow-lg shadow-[#19b673]/25 hover:shadow-xl hover:shadow-[#19b673]/30">
                            <span>{loading ? 'Sending...' : 'Send OTP'}</span>
                            {!loading && <ArrowRight className="w-5 h-5" />}
                        </button>
                    </form>
                )}

                {/* Step 2: OTP Form */}
                {step === 'otp' && (
                    <form onSubmit={handleVerifyOTP} className="space-y-6">
                        <div className="flex items-center justify-between px-5 py-3.5 rounded-2xl border text-[13px] font-medium bg-slate-50/50">
                            <span className="flex items-center gap-2 text-slate-500 font-bold">
                                <Clock className="w-4 h-4" /> OTP Expires in:
                            </span>
                            <span className={`px-3 py-1 rounded-lg border text-sm font-bold shadow-sm ${getTimerColorClass()}`}>
                                {formatTime(timeLeft)}
                            </span>
                        </div>
                        <div>
                            <label className="block text-[13px] font-bold uppercase tracking-wider text-slate-500 mb-2">Enter OTP Code</label>
                            <div className="relative group">
                                <ShieldCheck className="absolute inset-y-0 left-5 my-auto w-6 h-6 text-slate-400 group-focus-within:text-[#19b673] transition-colors" />
                                <input type="text" required maxLength="6" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="123456" className="w-full pl-14 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xl tracking-[0.5em] text-center font-extrabold focus:outline-none focus:border-[#19b673] focus:bg-white focus:ring-4 focus:ring-[#19b673]/10 transition-all" />
                            </div>
                        </div>
                        <button type="submit" disabled={loading} className="w-full py-4 bg-[#19b673] hover:bg-[#16a567] active:bg-[#14955e] text-white font-bold rounded-2xl flex items-center justify-center space-x-2 text-[16px] disabled:opacity-70 transition-all mt-4 shadow-lg shadow-[#19b673]/25 hover:shadow-xl hover:shadow-[#19b673]/30">
                            <span>{loading ? 'Verifying...' : 'Verify OTP'}</span>
                            {!loading && <ArrowRight className="w-5 h-5" />}
                        </button>
                    </form>
                )}

                {/* Step 3: Reset Password Form */}
                {step === 'reset' && (
                    <form onSubmit={handleResetPassword} className="space-y-6">
                        <div>
                            <label className="block text-[13px] font-bold uppercase tracking-wider text-slate-500 mb-2">New Password</label>
                            <div className="relative group">
                                <Lock className="absolute inset-y-0 left-4 my-auto w-5 h-5 text-slate-400 group-focus-within:text-[#19b673] transition-colors" />
                                <input type="password" required value={passwords.password} onChange={(e) => setPasswords({ ...passwords, password: e.target.value })} placeholder="••••••••" className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-[15px] focus:outline-none focus:border-[#19b673] focus:bg-white focus:ring-4 focus:ring-[#19b673]/10 transition-all" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[13px] font-bold uppercase tracking-wider text-slate-500 mb-2">Confirm Password</label>
                            <div className="relative group">
                                <Lock className="absolute inset-y-0 left-4 my-auto w-5 h-5 text-slate-400 group-focus-within:text-[#19b673] transition-colors" />
                                <input type="password" required value={passwords.confirmPassword} onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })} placeholder="••••••••" className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-[15px] focus:outline-none focus:border-[#19b673] focus:bg-white focus:ring-4 focus:ring-[#19b673]/10 transition-all" />
                            </div>
                        </div>
                        <button type="submit" disabled={loading} className="w-full py-4 bg-[#19b673] hover:bg-[#16a567] active:bg-[#14955e] text-white font-bold rounded-2xl flex items-center justify-center space-x-2 text-[16px] disabled:opacity-70 transition-all mt-4 shadow-lg shadow-[#19b673]/25 hover:shadow-xl hover:shadow-[#19b673]/30">
                            <span>{loading ? 'Resetting...' : 'Reset Password'}</span>
                            {!loading && <ArrowRight className="w-5 h-5" />}
                        </button>
                    </form>
                )}

                {/* Back to Login link */}
                <div className="text-center mt-8">
                    <button type="button" onClick={() => navigate('/')} className="text-[15px] text-slate-500 hover:text-[#19b673] font-bold hover:underline transition-all">
                        Back to Login
                    </button>
                </div>
            </div>
        </div>
    );
}