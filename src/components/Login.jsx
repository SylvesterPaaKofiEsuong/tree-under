import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Eye, EyeOff, LogIn, Loader } from 'lucide-react';

export default function Login() {
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login, error } = useAuth();
  const { t } = useLanguage();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (pin.length < 4) return;
    
    setIsLoading(true);
    const result = await login(pin);
    setIsLoading(false);
    
    if (!result.success) {
      setPin('');
    }
  };

  const handlePinChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6); // Only digits, max 6 characters
    setPin(value);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl font-bold text-white">TUC</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t('welcome')}
          </h1>
          <p className="text-gray-600">
            {t('loginDescription')}
          </p>
        </div>

        {/* Login Form */}
        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* PIN Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('enterPin')}
              </label>
              <div className="relative">
                <input
                  type={showPin ? 'text' : 'password'}
                  value={pin}
                  onChange={handlePinChange}
                  className="input pr-12 text-center text-lg tracking-widest"
                  placeholder="••••"
                  maxLength={6}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPin ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={pin.length < 4 || isLoading}
              className="w-full btn btn-primary py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <Loader className="animate-spin mr-2" size={20} />
                  {t('loggingIn')}
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <LogIn className="mr-2" size={20} />
                  {t('login')}
                </div>
              )}
            </button>
          </form>

          {/* PIN Hint */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              {t('pinHint')}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            {t('appVersion')} 1.0.0
          </p>
        </div>
      </div>
    </div>
  );
}