import { useState, useRef } from 'react';

export function useCamera() {
  const [isOpen, setIsOpen] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [error, setError] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  async function openCamera() {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', // Back camera preferred
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsOpen(true);
    } catch (error) {
      console.error('Camera error:', error);
      let errorMessage = 'Camera access denied';
      
      if (error.name === 'NotFoundError') {
        errorMessage = 'No camera found on this device';
      } else if (error.name === 'NotAllowedError') {
        errorMessage = 'Camera permission denied. Please enable camera access in your browser settings.';
      } else if (error.name === 'NotSupportedError') {
        errorMessage = 'Camera not supported on this device';
      }
      
      setError(errorMessage);
    }
  }

  function capturePhoto() {
    if (!videoRef.current) return;
    
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    
    // Add timestamp watermark
    ctx.font = 'bold 24px Arial';
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 3;
    
    const timestamp = new Date().toLocaleString('en-GB', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    
    const x = 20;
    const y = canvas.height - 20;
    ctx.strokeText(timestamp, x, y);
    ctx.fillText(timestamp, x, y);
    
    // Convert to blob
    canvas.toBlob((blob) => {
      const photoUrl = URL.createObjectURL(blob);
      setPhoto({ blob, url: photoUrl });
      closeCamera();
    }, 'image/jpeg', 0.8);
  }

  function closeCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsOpen(false);
  }

  function resetPhoto() {
    if (photo?.url) {
      URL.revokeObjectURL(photo.url);
    }
    setPhoto(null);
    setError(null);
  }

  return {
    isOpen,
    photo,
    error,
    videoRef,
    openCamera,
    capturePhoto,
    closeCamera,
    resetPhoto
  };
}