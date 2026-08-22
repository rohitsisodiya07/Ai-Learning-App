import React, { useState, useRef, useEffect } from 'react';
import { User, Mail, Lock, ArrowRight, BrainCircuit, Sparkles, CheckCircle2, UploadCloud, X, ShieldCheck, AlertCircle, Clock } from 'lucide-react';
import api from '../Api';
import { useNavigate } from 'react-router-dom';

export default function Signup() {
    const navigate = useNavigate();

    const [step, setStep] = useState('signup');
    const [formData, setFormData] = useState({
        userName: '',
        email: '',
        password: '',
    });

    const [otp, setOtp] = useState('');
    const [profileImage, setProfileImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);

    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    const [timeLeft, setTimeLeft] = useState(300);
    const [timerActive, setTimerActive] = useState(false);

    const fileInputRef = useRef(null);

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => {
            setToast({ show: false, message: '', type: 'success' });
        }, 4000);
    };

    useEffect(() => {
        let interval;
        if (timerActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prevTime) => prevTime - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            setTimerActive(false);
        }
        return () => clearInterval(interval);
    }, [timerActive, timeLeft]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const handleInputChange = (e) => {
        const fieldName = e.target.name;
        const fieldValue = e.target.value;
        setFormData({ ...formData, [fieldName]: fieldValue });
    };

    const handleImageSelection = (event) => {
        const file = event.target.files[0];

        if (file) {
            if (!file.type.startsWith('image/')) {
                showToast('Please select a valid image file.', 'error');
                return;
            }
            if (file.size > 512 * 1024) {
                showToast('Image size should be less than 512kb.', 'error');
                return;
            }

            setProfileImage(file);

            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = (e) => {
        e.stopPropagation();
        setProfileImage(null);
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSignupSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const submitData = new FormData();
            submitData.append('userName', formData.userName);
            submitData.append('email', formData.email);
            submitData.append('password', formData.password);
            if (profileImage) {
                submitData.append('profileImage', profileImage);
            }

            const response = await fetch(`${api}/user/sendOTP`, {
                method: 'POST',
                body: submitData,
            });

            const result = await response.json();

            if (response.ok) {
                showToast('OTP sent successfully to your email!', 'success');
                setTimeout(() => {
                    setStep('verify-otp');
                    setTimeLeft(300);
                    setTimerActive(true);
                }, 1000);
            } else {
                showToast(result.message || 'Registration failed.', 'error');
            }
        } catch (error) {
            showToast('Server connection error. Please check your backend.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleOtpSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch(`${api}/user/verifyOTP`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: formData.email,
                    otp: otp,
                }),
            });

            const result = await response.json();

            if (response.ok) {
                showToast('Account verified successfully!', 'success');
                setTimerActive(false);
                navigate('/');
            } else {
                showToast(result.message || 'Invalid or expired OTP.', 'error');
            }
        } catch (error) {
            showToast('Server connection error during verification.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const getTimerColorClass = () => {
        if (timeLeft > 60) return 'bg-[#19b673]/10 text-[#19b673] border-[#19b673]/20';
        if (timeLeft > 10) return 'bg-amber-50 text-amber-600 border-amber-200';
        return 'bg-rose-50 text-rose-600 border-rose-200 animate-pulse font-bold';
    };

    return (
        <div className="relative min-h-screen bg-[#f8f9fc] flex flex-col items-center justify-center p-4 text-slate-800 font-sans overflow-hidden selection:bg-[#19b673] selection:text-white">

            {/* Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[800px] h-[500px] bg-[#19b673]/10 blur-[100px] rounded-full pointer-events-none"></div>

            {/* Toast Message */}
            <div className={`fixed top-6 right-6 z-50 transition-all duration-300 transform ${toast.show ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0 pointer-events-none'}`}>
                <div className={`flex items-center gap-3 px-5 py-4 rounded-2xl shadow-xl border text-[15px] font-medium backdrop-blur-md ${toast.type === 'success' ? 'bg-white/95 text-slate-800 border-[#19b673]/30' : 'bg-white/95 text-slate-800 border-rose-200'}`}>
                    {toast.type === 'success' ? (
                        <CheckCircle2 className="w-5 h-5 text-[#19b673]" />
                    ) : (
                        <AlertCircle className="w-5 h-5 text-rose-500" />
                    )}
                    <span>{toast.message}</span>
                </div>
            </div>

            {/* Main Card */}
            <div className="relative bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] w-full max-w-[460px] p-8 sm:p-12 border border-slate-100/60 my-6 z-10">

                {/* Header Section */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#19b673]/10 text-[#19b673] text-[13px] font-bold mb-4 border border-[#19b673]/20">
                        <Sparkles className="w-4 h-4" /> AI Learning Platform
                    </div>

                    {step === 'signup' ? (
                        <>
                            <h1 className="text-[28px] sm:text-3xl font-extrabold tracking-tight text-slate-900">Create account</h1>
                            <p className="text-[15px] text-slate-500 mt-2">Start your AI-powered learning journey</p>
                        </>
                    ) : (
                        <>
                            <h1 className="text-[28px] sm:text-3xl font-extrabold tracking-tight text-slate-900">Verify email</h1>
                            <p className="text-[15px] text-slate-500 mt-2">Enter the OTP sent to <span className="font-bold text-slate-700">{formData.email}</span></p>
                        </>
                    )}
                </div>

                {step === 'signup' && (
                    <form onSubmit={handleSignupSubmit} className="space-y-6">

                        {/* Profile Image Upload Box */}
                        <div className="flex flex-col items-center mb-6">
                            <label className="block text-[13px] font-bold uppercase tracking-wider text-slate-500 mb-3 w-full text-left">
                                Profile Picture (Optional, max 512kb)
                            </label>

                            <input type="file" ref={fileInputRef} onChange={handleImageSelection} accept="image/*" className="hidden" />

                            <div
                                onClick={() => fileInputRef.current.click()}
                                className={`relative w-28 h-28 sm:w-32 sm:h-32 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-all overflow-hidden ${imagePreview ? 'border-[#19b673] bg-[#19b673]/5' : 'border-slate-300 hover:border-[#19b673]/50 bg-slate-50 hover:bg-slate-100'}`}
                            >
                                {imagePreview ? (
                                    <>
                                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                        <button type="button" onClick={removeImage} className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full text-rose-500 hover:bg-white shadow-md transition-all">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <UploadCloud className="w-8 h-8 text-slate-400" />
                                        <span className="text-[13px] text-slate-500 font-semibold">Upload</span>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Username Input */}
                        <div>
                            <label className="block text-[13px] font-bold uppercase tracking-wider text-slate-500 mb-2">Username</label>
                            <div className="relative group">
                                <User className="absolute inset-y-0 left-4 my-auto w-5 h-5 text-slate-400 group-focus-within:text-[#19b673] transition-colors" />
                                <input type="text" name="userName" required value={formData.userName} onChange={handleInputChange} placeholder="Rohit Sisodiya" className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-[15px] focus:outline-none focus:border-[#19b673] focus:bg-white focus:ring-4 focus:ring-[#19b673]/10 transition-all" />
                            </div>
                        </div>

                        {/* Email Input */}
                        <div>
                            <label className="block text-[13px] font-bold uppercase tracking-wider text-slate-500 mb-2">Email Address</label>
                            <div className="relative group">
                                <Mail className="absolute inset-y-0 left-4 my-auto w-5 h-5 text-slate-400 group-focus-within:text-[#19b673] transition-colors" />
                                <input type="email" name="email" required value={formData.email} onChange={handleInputChange} placeholder="rohit@gmail.com" className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-[15px] focus:outline-none focus:border-[#19b673] focus:bg-white focus:ring-4 focus:ring-[#19b673]/10 transition-all" />
                            </div>
                        </div>

                        {/* Password Input */}
                        <div>
                            <label className="block text-[13px] font-bold uppercase tracking-wider text-slate-500 mb-2">Password</label>
                            <div className="relative group">
                                <Lock className="absolute inset-y-0 left-4 my-auto w-5 h-5 text-slate-400 group-focus-within:text-[#19b673] transition-colors" />
                                <input type="password" name="password" required value={formData.password} onChange={handleInputChange} placeholder="••••••••" className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-[15px] focus:outline-none focus:border-[#19b673] focus:bg-white focus:ring-4 focus:ring-[#19b673]/10 transition-all" />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button type="submit" disabled={loading} className="w-full py-4 bg-[#19b673] hover:bg-[#16a567] active:bg-[#14955e] text-white font-bold rounded-2xl flex items-center justify-center space-x-2 text-[16px] disabled:opacity-70 transition-all mt-4 shadow-lg shadow-[#19b673]/25 hover:shadow-xl hover:shadow-[#19b673]/30">
                            <span>{loading ? 'Sending OTP...' : 'Create account'}</span>
                            {!loading && <ArrowRight className="w-5 h-5" />}
                        </button>
                    </form>
                )}

                {step === 'verify-otp' && (
                    <form onSubmit={handleOtpSubmit} className="space-y-6">

                        {/* Timer Box */}
                        <div className="flex items-center justify-between px-5 py-3.5 rounded-2xl border text-[13px] font-medium bg-slate-50/50">
                            <span className="flex items-center gap-2 text-slate-500 font-bold">
                                <Clock className="w-4 h-4" /> OTP Expires in:
                            </span>
                            <span className={`px-3 py-1 rounded-lg border text-sm font-bold shadow-sm ${getTimerColorClass()}`}>
                                {formatTime(timeLeft)}
                            </span>
                        </div>

                        {/* OTP Input */}
                        <div>
                            <label className="block text-[13px] font-bold uppercase tracking-wider text-slate-500 mb-2">Enter OTP Code</label>
                            <div className="relative group">
                                <ShieldCheck className="absolute inset-y-0 left-5 my-auto w-6 h-6 text-slate-400 group-focus-within:text-[#19b673] transition-colors" />
                                <input type="text" required maxLength="6" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="123456" className="w-full pl-14 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xl tracking-[0.5em] text-center font-extrabold focus:outline-none focus:border-[#19b673] focus:bg-white focus:ring-4 focus:ring-[#19b673]/10 transition-all" />
                            </div>
                        </div>

                        {/* Verify Button */}
                        <button type="submit" disabled={loading} className="w-full py-4 bg-[#19b673] hover:bg-[#16a567] active:bg-[#14955e] text-white font-bold rounded-2xl flex items-center justify-center space-x-2 text-[16px] disabled:opacity-70 transition-all mt-4 shadow-lg shadow-[#19b673]/25 hover:shadow-xl hover:shadow-[#19b673]/30">
                            <span>{loading ? 'Verifying...' : 'Verify OTP'}</span>
                            {!loading && <ArrowRight className="w-5 h-5" />}
                        </button>

                        {/* Back Button */}
                        <div className="text-center pt-2">
                            <button type="button" onClick={() => setStep('signup')} className="text-[14px] font-semibold text-slate-500 hover:text-[#19b673] transition-colors">
                                ← Back to registration
                            </button>
                        </div>
                    </form>
                )}

                {step === 'signup' && (
                    <div className="text-center mt-8">
                        <p className="text-[15px] text-slate-500">
                            Already have an account?{' '}
                            <button type="button" onClick={() => navigate('/')} className="text-[#19b673] font-bold hover:underline transition-all">
                                Sign in
                            </button>
                        </p>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="mt-6 text-center z-10">
                <p className="text-[13px] text-slate-400 font-medium">
                    By continuing, you agree to our <span className="underline cursor-pointer hover:text-slate-600">Terms</span> & <span className="underline cursor-pointer hover:text-slate-600">Privacy Policy</span>
                </p>
            </div>
        </div>
    );
}