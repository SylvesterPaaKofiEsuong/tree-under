import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useCollection, useFirestore } from '../hooks/useFirestore';
import { useCamera } from '../hooks/useCamera';
import toast from 'react-hot-toast';
import { 
  CreditCard, 
  ArrowLeft, 
  Camera,
  Users,
  DollarSign,
  Calendar,
  CheckCircle,
  AlertCircle,
  Eye,
  Trash2,
  Save,
  X,
  Clock,
  Calculator
} from 'lucide-react';
import { orderBy, where } from 'firebase/firestore';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, isWithinInterval, parseISO } from 'date-fns';

export default function Payments({ onNavigate }) {
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [showPaymentModal, setShowPaymentModal] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [paymentNotes, setPaymentNotes] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [justPaidSellers, setJustPaidSellers] = useState(new Set());
  
  const { openCamera, closeCamera, capturePhoto, isOpen: cameraActive, videoRef, photo: cameraPhoto, error: cameraError } = useCamera();
  
  // Calculate week boundaries
  const weekStart = startOfWeek(selectedWeek, { weekStartsOn: 1 }); // Monday start
  const weekEnd = endOfWeek(selectedWeek, { weekStartsOn: 1 });
  const weekStartStr = format(weekStart, 'yyyy-MM-dd');
  const weekEndStr = format(weekEnd, 'yyyy-MM-dd');
  
  // Fetch active sellers
  const { data: sellers, loading: sellersLoading } = useCollection('sellers', [
    where('active', '==', true),
    orderBy('name')
  ]);
  
  // Fetch attendance for the selected week
  const { data: weekAttendance, loading: attendanceLoading } = useCollection('attendance', [
    where('weekStart', '==', weekStartStr)
  ]);
  
  // Fetch existing payments for the selected week
  const { data: existingPayments, loading: paymentsLoading } = useCollection('payments', [
    where('weekStart', '==', weekStartStr),
    orderBy('timestamp', 'desc')
  ]);
  
  const { addDocument, loading: operationLoading } = useFirestore('payments');
  
  // Calculate payment data for each seller
  const getPaymentData = () => {
    if (!sellers.length) return [];
    
    return sellers.map(seller => {
      // Count attendance days for this seller this week
      const attendanceDays = weekAttendance.filter(att => att.sellerId === seller.id).length;
      const feeAmount = attendanceDays * seller.feeRate;
      
      // Check if already paid this week or just paid
      const existingPayment = existingPayments.find(payment => payment.sellerId === seller.id);
      const isJustPaid = justPaidSellers.has(seller.id);
      
      // Seller is paid if they have an existing payment OR are in justPaidSellers
      const isPaid = !!existingPayment || isJustPaid;
      
      return {
        ...seller,
        attendanceDays,
        feeAmount,
        isPaid,
        paymentRecord: existingPayment,
        isJustPaid: isJustPaid && !existingPayment, // Only show "Just Paid" if no existing payment yet
        // Add a key for React to detect changes
        paymentStatus: isPaid ? 'paid' : (feeAmount > 0 ? 'pending' : 'no_work')
      };
    });
  };
  
  const paymentData = React.useMemo(() => getPaymentData(), [sellers, weekAttendance, existingPayments, justPaidSellers, refreshKey]);
  const totalCollectable = paymentData.reduce((sum, seller) => sum + (seller.isPaid ? 0 : seller.feeAmount), 0);
  const totalCollected = paymentData.reduce((sum, seller) => sum + (seller.isPaid ? seller.feeAmount : 0), 0);
  const totalOutstanding = totalCollectable;
  
  // Automatically clean up justPaidSellers when Firestore payments appear
  useEffect(() => {
    if (existingPayments.length > 0 && justPaidSellers.size > 0) {
      const existingPaymentSellerIds = new Set(existingPayments.map(p => p.sellerId));
      
      // Check if any justPaidSellers now have existing payments
      const sellersToRemove = [];
      justPaidSellers.forEach(sellerId => {
        if (existingPaymentSellerIds.has(sellerId)) {
          sellersToRemove.push(sellerId);
        }
      });
      
      if (sellersToRemove.length > 0) {
        setJustPaidSellers(prev => {
          const newSet = new Set(prev);
          sellersToRemove.forEach(sellerId => newSet.delete(sellerId));
          return newSet;
        });
      }
    }
  }, [existingPayments, justPaidSellers]);
  
  const handleTakePhoto = async () => {
    try {
      setShowCamera(true);
      await openCamera();
    } catch (error) {
      console.error('Camera error:', error);
      toast.error(cameraError || 'Unable to access camera. Please check permissions.');
      setShowCamera(false);
    }
  };
  
  const handleCapturePhoto = () => {
    capturePhoto();
  };
  
  // Watch for captured photo from camera hook
  useEffect(() => {
    if (cameraPhoto) {
      setCapturedPhoto(cameraPhoto.url);
      setPhotoPreview(cameraPhoto.url);
      setShowCamera(false);
    }
  }, [cameraPhoto]);
  
  const handleCloseCamera = () => {
    setShowCamera(false);
    closeCamera();
  };
  
  const handleCollectPayment = async (sellerData) => {
    if (!capturedPhoto) {
      toast.error('Please take a receipt photo first.');
      return;
    }
    
    // Show loading toast
    const loadingToast = toast.loading('Processing payment...');
    
    try {
      const paymentRecord = {
        sellerId: sellerData.id,
        sellerName: sellerData.name,
        weekStart: weekStartStr,
        weekEnd: weekEndStr,
        amount: sellerData.feeAmount,
        daysWorked: sellerData.attendanceDays,
        feeRate: sellerData.feeRate,
        photoDataUrl: capturedPhoto, // In production, upload to Firebase Storage
        notes: paymentNotes,
        collectedBy: currentUser.uid,
        collectedByName: currentUser.name,
        timestamp: new Date().toISOString()
      };
      
      // Wait for the document to be added to Firestore
      const newPayment = await addDocument(paymentRecord);
      
      // Mark seller as just paid for immediate UI feedback
      setJustPaidSellers(prev => new Set([...prev, sellerData.id]));
      
      // Reset form
      setShowPaymentModal(null);
      setCapturedPhoto(null);
      setPhotoPreview(null);
      setPaymentNotes('');
      
      // Don't automatically clear the "just paid" status
      // It will be cleared when we detect the Firestore payment exists
      
      // Dismiss loading toast and show success
      toast.dismiss(loadingToast);
      toast.success(`Payment of ${formatCurrency(sellerData.feeAmount)} collected successfully for ${sellerData.name}!`);
      
    } catch (error) {
      console.error('Payment collection error:', error);
      toast.dismiss(loadingToast);
      toast.error('Failed to record payment. Please try again.');
      
      // Remove from just paid if it was added
      setJustPaidSellers(prev => {
        const newSet = new Set(prev);
        newSet.delete(sellerData.id);
        return newSet;
      });
    }
  };
  
  const openPaymentModal = (sellerData) => {
    setShowPaymentModal(sellerData);
    setCapturedPhoto(null);
    setPhotoPreview(null);
    setPaymentNotes('');
  };
  
  const closePaymentModal = () => {
    setShowPaymentModal(null);
    setCapturedPhoto(null);
    setPhotoPreview(null);
    setPaymentNotes('');
    if (cameraActive) {
      closeCamera();
      setShowCamera(false);
    }
  };
  
  const formatCurrency = (amount) => `GHS ${amount.toFixed(2)}`;
  const formatDateRange = (start, end) => `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
  
  if (sellersLoading || attendanceLoading || paymentsLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">{t('loading')}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Back to Dashboard Button */}
      <button
        onClick={() => onNavigate('dashboard')}
        className="flex items-center text-gray-600 hover:text-primary-600 mb-6 transition-colors"
      >
        <ArrowLeft size={20} className="mr-2" />
        {t('backToDashboard')}
      </button>
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {t('collectPayments')}
        </h1>
        <p className="text-gray-600">
          Week of {formatDateRange(weekStart, weekEnd)}
        </p>
      </div>
      
      {/* Week Navigation */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSelectedWeek(subWeeks(selectedWeek, 1))}
              className="btn btn-secondary"
            >
              ← Previous Week
            </button>
            <button
              onClick={() => setSelectedWeek(new Date())}
              className="btn btn-secondary flex items-center"
            >
              <Clock size={16} className="mr-2" />
              Current Week
            </button>
            <button
              onClick={() => setSelectedWeek(addWeeks(selectedWeek, 1))}
              className="btn btn-secondary"
              disabled={addWeeks(selectedWeek, 1) > new Date()}
            >
              Next Week →
            </button>
          </div>
        </div>
      </div>
      
      {/* Payment Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-green-600 mb-1">{formatCurrency(totalCollected)}</div>
          <div className="text-sm text-gray-600">Already Collected</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-orange-600 mb-1">{formatCurrency(totalOutstanding)}</div>
          <div className="text-sm text-gray-600">Outstanding</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-blue-600 mb-1">{paymentData.filter(s => s.isPaid).length}</div>
          <div className="text-sm text-gray-600">Sellers Paid</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-purple-600 mb-1">{paymentData.filter(s => !s.isPaid && s.feeAmount > 0).length}</div>
          <div className="text-sm text-gray-600">Pending Payment</div>
        </div>
      </div>
      
      {/* Sellers Payment List */}
      {paymentData.length === 0 ? (
        <div className="text-center py-12">
          <Users size={64} className="mx-auto text-gray-400 mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            No Active Sellers
          </h2>
          <p className="text-gray-600 mb-4">
            Add some sellers first to collect payments
          </p>
          <button
            onClick={() => onNavigate('sellers')}
            className="btn btn-primary"
          >
            Manage Sellers
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {paymentData.map((seller) => (
            <div
              key={seller.id}
              className={`card p-6 ${
                seller.isPaid ? 'border-green-200 bg-green-50' : 
                seller.feeAmount > 0 ? 'border-orange-200 bg-orange-50' : 
                'border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {seller.name}
                    </h3>
                    {seller.isPaid && (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        seller.isJustPaid 
                          ? 'bg-blue-100 text-blue-800 animate-pulse' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        ✓ {seller.isJustPaid ? 'Just Paid' : 'Paid'}
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Product:</span>
                      <div className="font-medium">{seller.product}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Days Worked:</span>
                      <div className="font-medium">{seller.attendanceDays} days</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Rate:</span>
                      <div className="font-medium">GHS {seller.feeRate}/day</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Total Due:</span>
                      <div className="font-bold text-lg text-gray-900">
                        {formatCurrency(seller.feeAmount)}
                      </div>
                    </div>
                  </div>
                  
                  {seller.isPaid && seller.paymentRecord && (
                    <div className="mt-3 pt-3 border-t border-green-200">
                      <div className="text-xs text-green-700">
                        Paid on {format(new Date(seller.paymentRecord.timestamp), 'MMM d, yyyy h:mm a')} by {seller.paymentRecord.collectedByName}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="ml-6">
                  {seller.isPaid ? (
                    <button
                      onClick={() => alert('Payment already collected')}
                      className="btn btn-secondary flex items-center"
                      disabled
                    >
                      <CheckCircle size={16} className="mr-2" />
                      Collected
                    </button>
                  ) : seller.feeAmount > 0 ? (
                    <button
                      onClick={() => openPaymentModal(seller)}
                      className="btn btn-primary flex items-center"
                    >
                      <DollarSign size={16} className="mr-2" />
                      Collect {formatCurrency(seller.feeAmount)}
                    </button>
                  ) : (
                    <div className="text-sm text-gray-500 text-center">
                      No days worked
                      <div className="text-xs">No payment due</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Payment Collection Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Collect Payment
                </h2>
                <button
                  onClick={closePaymentModal}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
              
              {/* Payment Details */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">{showPaymentModal.name}</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Product: <span className="font-medium">{showPaymentModal.product}</span></div>
                  <div>Days: <span className="font-medium">{showPaymentModal.attendanceDays}</span></div>
                  <div>Rate: <span className="font-medium">GHS {showPaymentModal.feeRate}/day</span></div>
                  <div>Total: <span className="font-bold text-lg">{formatCurrency(showPaymentModal.feeAmount)}</span></div>
                </div>
              </div>
              
              {/* Photo Section */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Receipt Photo *
                </label>
                
                {photoPreview ? (
                  <div className="relative">
                    <img
                      src={photoPreview}
                      alt="Receipt preview"
                      className="w-full h-48 object-cover rounded-lg border"
                    />
                    <button
                      onClick={() => {
                        setPhotoPreview(null);
                        setCapturedPhoto(null);
                      }}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleTakePhoto}
                    className="w-full p-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 transition-colors"
                  >
                    <Camera size={48} className="mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-600">Tap to take receipt photo</p>
                  </button>
                )}
              </div>
              
              {/* Notes */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Any additional notes..."
                  rows={3}
                  className="input"
                />
              </div>
              
              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={closePaymentModal}
                  className="flex-1 btn btn-secondary"
                  disabled={operationLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleCollectPayment(showPaymentModal)}
                  className="flex-1 btn btn-primary"
                  disabled={!capturedPhoto || operationLoading}
                >
                  {operationLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                      Processing...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <Save size={16} className="mr-2" />
                      Collect Payment
                    </div>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Camera Modal */}
      {showCamera && (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
          <div className="relative w-full h-full">
            <video
              ref={videoRef}
              id="camera-video"
              className="w-full h-full object-cover"
              autoPlay
              playsInline
              muted
            />
            
            {/* Camera Controls */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-4">
              <button
                onClick={handleCloseCamera}
                className="p-3 bg-gray-600 text-white rounded-full hover:bg-gray-700"
              >
                <X size={24} />
              </button>
              <button
                onClick={handleCapturePhoto}
                className="p-4 bg-white text-gray-900 rounded-full hover:bg-gray-100 shadow-lg"
              >
                <Camera size={32} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
