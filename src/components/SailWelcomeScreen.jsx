import { useState } from 'react'

export default function SailWelcomeScreen({ onGetStarted, onSignIn }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-between relative overflow-hidden">
      {/* Background gradient - ocean theme */}
      <div className="absolute inset-0 bg-gradient-to-b from-orange-100 via-orange-50 to-blue-500" />

      {/* Decorative wave with sun */}
      <div className="absolute inset-0 flex items-center justify-center">
        <svg
          viewBox="0 0 400 400"
          className="w-full h-full"
          style={{ maxHeight: '60vh' }}
        >
          {/* Sun */}
          <circle
            cx="250"
            cy="150"
            r="80"
            fill="url(#sunGradient)"
            className="drop-shadow-lg"
          />
          <defs>
            <linearGradient id="sunGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FB923C" />
              <stop offset="100%" stopColor="#F97316" />
            </linearGradient>
          </defs>

          {/* Wave */}
          <path
            d="M 0,280 Q 100,250 200,280 T 400,280 L 400,400 L 0,400 Z"
            fill="#3B82F6"
            className="drop-shadow-xl"
          />
          <path
            d="M 0,280 Q 100,250 200,280 T 400,280"
            fill="none"
            stroke="#60A5FA"
            strokeWidth="2"
            opacity="0.5"
          />
        </svg>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-between min-h-screen w-full px-6 py-12 pt-20">
        {/* Top spacing */}
        <div className="flex-1" />

        {/* Main content */}
        <div className="flex flex-col items-center gap-8 w-full max-w-md">
          {/* Brand */}
          <div className="flex flex-col items-center gap-3 text-center">
            <h1 className="text-4xl font-bold text-white">
              Sail Health
            </h1>
            <p className="text-lg font-medium text-white">
              Move back to the things you love
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col gap-4 w-full">
            <button
              onClick={onGetStarted}
              className="w-full bg-white text-blue-600 font-semibold text-lg py-4 px-6 rounded-2xl shadow-lg active:scale-95 transition-transform duration-150"
            >
              Get Started
            </button>

            <p className="text-center text-white">
              Already have an account?{' '}
              <button
                onClick={onSignIn}
                className="font-semibold underline text-white hover:opacity-90 transition-opacity"
              >
                Sign in
              </button>
            </p>
          </div>
        </div>

        {/* Footer disclaimer */}
        <div className="mt-12">
          <p className="text-sm text-white text-center">
            Not a replacement for medical care.
          </p>
        </div>
      </div>
    </div>
  )
}
