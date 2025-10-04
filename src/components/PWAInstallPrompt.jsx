import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if we're on iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Check if we're already in standalone mode
    const standalone = window.matchMedia('(display-mode: standalone)').matches 
      || window.navigator.standalone 
      || document.referrer.includes('android-app://');
    setIsStandalone(standalone);

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Show our custom install prompt after a delay
      setTimeout(() => {
        if (!standalone && !localStorage.getItem('pwa-install-dismissed')) {
          setShowPrompt(true);
        }
      }, 5000); // Show after 5 seconds
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if we should show iOS install instructions
    if (iOS && !standalone && !localStorage.getItem('pwa-install-dismissed')) {
      setTimeout(() => {
        setShowPrompt(true);
      }, 5000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Show the install prompt
      deferredPrompt.prompt();
      
      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        toast.success('App installed successfully! 🎉');
      } else {
        toast('Maybe next time! 👋');
      }
      
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
    toast('You can install the app anytime from your browser menu');
  };

  // Don't show if already installed or user dismissed
  if (isStandalone || !showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-2xl border border-gray-200 p-4 animation-bounce-in">
        <div className="flex items-start space-x-3">
          <div className="bg-primary-100 rounded-lg p-2 flex-shrink-0">
            <Smartphone size={24} className="text-primary-600" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 mb-1">
              Install Tree Under Checklist
            </h3>
            
            {isIOS ? (
              <div className="text-xs text-gray-600 mb-3">
                <p>Install this app on your iPhone:</p>
                <ol className="mt-1 ml-3 space-y-1">
                  <li>1. Tap the <strong>Share</strong> button</li>
                  <li>2. Tap <strong>"Add to Home Screen"</strong></li>
                  <li>3. Tap <strong>"Add"</strong></li>
                </ol>
              </div>
            ) : (
              <p className="text-xs text-gray-600 mb-3">
                Install this app for faster access and offline usage. Works just like a native app!
              </p>
            )}
            
            <div className="flex items-center space-x-2">
              {!isIOS && deferredPrompt && (
                <button
                  onClick={handleInstallClick}
                  className="flex items-center space-x-1 bg-primary-600 text-white px-3 py-1.5 rounded-md text-xs font-medium hover:bg-primary-700 transition-colors"
                >
                  <Download size={14} />
                  <span>Install</span>
                </button>
              )}
              
              <button
                onClick={handleDismiss}
                className="flex items-center space-x-1 text-gray-500 hover:text-gray-700 px-2 py-1.5 text-xs transition-colors"
              >
                <X size={14} />
                <span>Not now</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// CSS animation for bounce-in effect (add to your main CSS)
const styles = `
  .animation-bounce-in {
    animation: bounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  }
  
  @keyframes bounceIn {
    0% {
      transform: translateY(100%) scale(0.8);
      opacity: 0;
    }
    60% {
      transform: translateY(-10px) scale(1.05);
      opacity: 1;
    }
    100% {
      transform: translateY(0) scale(1);
      opacity: 1;
    }
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}