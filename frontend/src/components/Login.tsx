import React, { useState, useEffect } from 'react';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import Pic1 from '../assets/pic1.jpg';
import Pic2 from '../assets/pic2.jpg';
import Pic3 from '../assets/pic3.jpg';
import Pic4 from '../assets/pic4.jpg';
import Pic5 from '../assets/pic5.jpg';

function Login({
  email,
  password,
  error,
  message,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  onCancel
}) {
  const [showPassword, setShowPassword] = useState(false);
  const images = [Pic1, Pic2, Pic3, Pic4, Pic5];
  const [bgIndex, setBgIndex] = useState(0);

  useEffect(() => {
    images.forEach((src) => { const img = new Image(); img.src = src; });
    const id = setInterval(() => setBgIndex(i => (i + 1) % images.length), 5000);
    return () => clearInterval(id);
  }, []);
  return (
    <section className="max-w-5xl mx-auto w-full min-h-[calc(100vh-72px)] px-4 md:px-0 py-8 flex items-center">
      <div className="w-full bg-white rounded-2xl shadow-md overflow-hidden grid md:grid-cols-[1.1fr_1fr]">
        <div className="text-white p-6 md:p-8 flex flex-col justify-center relative overflow-hidden">
          {images.map((src, i) => (
            <div
              key={i}
              className={`absolute inset-0 bg-center bg-cover transition-opacity duration-1000 ${i === bgIndex ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}`}
              style={{ backgroundImage: `url(${src})` }}
            />
          ))}
          <div className="absolute inset-0 bg-slate-900/70 transition-opacity duration-1000" />
          <div className="relative z-10">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Patient Access</p>
            <h2 className="text-3xl font-bold mt-3 leading-tight">Welcome Back</h2>
            <p className="text-slate-300 mt-3 text-sm leading-6">
              Sign in to continue and view languages added by admin.
            </p>
            <div className="mt-6 inline-flex items-center gap-2 bg-white/10 rounded-full px-3 py-1 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Secure Login
            </div>
          </div>
        </div>

        <div className="p-6 md:p-8">
          <h3 className="text-xl font-semibold text-slate-800">Login</h3>
          <p className="text-sm text-slate-500 mt-1">Enter your email and password.</p>

          <form onSubmit={onSubmit} className="grid gap-3 mt-5">
            <input
              type="email"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              placeholder="Enter your email"
              className="border border-slate-300 rounded-lg p-3"
              required
            />
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => onPasswordChange(e.target.value)}
                placeholder="Enter your password"
                className="border border-slate-300 rounded-lg p-3 pr-10 w-full"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-700 hover:text-slate-900 z-10 p-2 bg-transparent"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <FiEyeOff className="h-6 w-6" aria-hidden="true" />
                ) : (
                  <FiEye className="h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                className="bg-slate-900 text-white px-4 py-2 rounded-lg font-semibold"
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="bg-slate-200 text-slate-900 px-4 py-2 rounded-lg font-semibold"
              >
                Cancel
              </button>
            </div>
          </form>

          {error ? <p className="text-red-600 mt-4 text-sm">{error}</p> : null}
          {message ? <p className="text-emerald-700 mt-4 text-sm">{message}</p> : null}
        </div>
      </div>
    </section>
  );
}

export default Login;
