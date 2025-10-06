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
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Back to Dashboard Button */}
      <button
        onClick={() => onNavigate('dashboard')}
        className="flex items-center text-gray-600 hover:text-primary-600 mb-4 sm:mb-6 transition-colors"
      >
        <ArrowLeft size={20} className="mr-2" />
        <span className="hidden sm:inline">{t('backToDashboard')}</span>
        <span className="sm:hidden">Back</span>
      </button>
      
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          {t('collectPayments')}
        </h1>
        <p className="text-sm sm:text-base text-gray-600">
          Week of {formatDateRange(weekStart, weekEnd)}
        </p>
      </div>
      
      {/* Week Navigation */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center space-x-2 sm:space-x-4 overflow-x-auto">
            <button
              onClick={() => setSelectedWeek(subWeeks(selectedWeek, 1))}
              className="btn btn-secondary text-sm whitespace-nowrap"
            >
              <span className="hidden sm:inline">← Previous Week</span>
              <span className="sm:hidden">← Prev</span>
            </button>
            <button
              onClick={() => setSelectedWeek(new Date())}
              className="btn btn-secondary flex items-center text-sm whitespace-nowrap"
            >
              <Clock size={14} className="mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Current Week</span>
              <span className="sm:hidden">Current</span>
            </button>
            <button
              onClick={() => setSelectedWeek(addWeeks(selectedWeek, 1))}
              className="btn btn-secondary text-sm whitespace-nowrap"
              disabled={addWeeks(selectedWeek, 1) > new Date()}
            >
              <span className="hidden sm:inline">Next Week →</span>
              <span className="sm:hidden">Next →</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Payment Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div className="card p-3 sm:p-4 text-center">
          <div className="text-lg sm:text-2xl font-bold text-green-600 mb-1">{formatCurrency(totalCollected)}</div>
          <div className="text-xs sm:text-sm text-gray-600">Already Collected</div>
        </div>
        <div className="card p-3 sm:p-4 text-center">
          <div className="text-lg sm:text-2xl font-bold text-orange-600 mb-1">{formatCurrency(totalOutstanding)}</div>
          <div className="text-xs sm:text-sm text-gray-600">Outstanding</div>
        </div>
        <div className="card p-3 sm:p-4 text-center">
          <div className="text-lg sm:text-2xl font-bold text-blue-600 mb-1">{paymentData.filter(s => s.isPaid).length}</div>
          <div className="text-xs sm:text-sm text-gray-600">Sellers Paid</div>
        </div>
        <div className="card p-3 sm:p-4 text-center">
          <div className="text-lg sm:text-2xl font-bold text-purple-600 mb-1">{paymentData.filter(s => !s.isPaid && s.feeAmount > 0).length}</div>
          <div className="text-xs sm:text-sm text-gray-600">Pending Payment</div>
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
        <div className="space-y-3 sm:space-y-4">
          {paymentData.map((seller) => (
            <div
              key={seller.id}
              className={`card p-4 sm:p-6 ${
                seller.isPaid ? 'border-green-200 bg-green-50' : 
                seller.feeAmount > 0 ? 'border-orange-200 bg-orange-50' : 
                'border-gray-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {seller.name}
                    </h3>
                    {seller.isPaid && (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium self-start ${
                        seller.isJustPaid 
                          ? 'bg-blue-100 text-blue-800 animate-pulse' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        ✓ {seller.isJustPaid ? 'Just Paid' : 'Paid'}
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                    <div>
                      <span className="text-gray-600 text-xs">Product:</span>
                      <div className="font-medium">{seller.product}</div>
                    </div>
                    <div>
                      <span className="text-gray-600 text-xs">Days Worked:</span>
                      <div className="font-medium">{seller.attendanceDays} days</div>
                    </div>
                    <div>
                      <span className="text-gray-600 text-xs">Rate:</span>
                      <div className="font-medium">GHS {seller.feeRate}/day</div>
                    </div>
                    <div>
                      <span className="text-gray-600 text-xs">Total Due:</span>
                      <div className="font-bold text-base sm:text-lg text-gray-900">
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
                
                <div className="flex-shrink-0">
                  {seller.isPaid ? (
                    <button
                      onClick={() => alert('Payment already collected')}
                      className="btn btn-secondary flex items-center w-full sm:w-auto justify-center text-sm px-3 py-2"
                      disabled
                    >
                      <CheckCircle size={14} className="mr-1" />
                      <span className="hidden sm:inline">Collected</span>
                      <span className="sm:hidden">Paid</span>
                    </button>
                  ) : seller.feeAmount > 0 ? (
                    <button
                      onClick={() => openPaymentModal(seller)}
                      className="btn btn-primary flex items-center w-full sm:w-auto justify-center text-sm px-3 py-2"
                    >
                      <DollarSign size={14} className="mr-1" />
                      <span className="hidden sm:inline truncate">Collect</span>
                      <span className="sm:hidden">Collect</span>
                    </button>
                  ) : (
                    <div className="text-sm text-gray-500 text-center">
                      <div className="text-xs">No days worked</div>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-lg sm:rounded-lg shadow-xl w-full sm:max-w-md sm:w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                  Collect Payment
                </h2>
                <button
                  onClick={closePaymentModal}
                  className="p-2 text-gray-400 hover:text-gray-600 -mr-2"
                >
                  <X size={24} />
                </button>
              </div>
              
              {/* Payment Details */}
              <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">{showPaymentModal.name}</h3>
                <div className="grid grid-cols-2 gap-2 sm:gap-3 text-sm">
                  <div>
                    <span className="text-gray-600 text-xs">Product:</span>
                    <div className="font-medium">{showPaymentModal.product}</div>
                  </div>
                  <div>
                    <span className="text-gray-600 text-xs">Days:</span>
                    <div className="font-medium">{showPaymentModal.attendanceDays}</div>
                  </div>
                  <div>
                    <span className="text-gray-600 text-xs">Rate:</span>
                    <div className="font-medium">GHS {showPaymentModal.feeRate}/day</div>
                  </div>
                  <div>
                    <span className="text-gray-600 text-xs">Total:</span>
                    <div className="font-bold text-base sm:text-lg text-primary-600">{formatCurrency(showPaymentModal.feeAmount)}</div>
                  </div>
                </div>
              </div>
              
              {/* Photo Section */}
              <div className="mb-4 sm:mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Receipt Photo *
                </label>
                
                {photoPreview ? (
                  <div className="relative">
                    <img
                      src={photoPreview}
                      alt="Receipt preview"
                      className="w-full h-40 sm:h-48 object-cover rounded-lg border"
                    />
                    <button
                      onClick={() => {
                        setPhotoPreview(null);
                        setCapturedPhoto(null);
                      }}
                      className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleTakePhoto}
                    className="w-full p-6 sm:p-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 transition-colors active:bg-gray-50"
                  >
                    <Camera size={40} className="mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-600 text-sm sm:text-base">Tap to take receipt photo</p>
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
                  className="input text-sm"
                />
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={closePaymentModal}
                  className="flex-1 btn btn-secondary order-2 sm:order-1"
                  disabled={operationLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleCollectPayment(showPaymentModal)}
                  className="flex-1 btn btn-primary order-1 sm:order-2"
                  disabled={!capturedPhoto || operationLoading}
                >
                  {operationLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                      <span className="hidden sm:inline">Processing...</span>
                      <span className="sm:hidden">Processing...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <Save size={16} className="mr-2" />
                      <span className="hidden sm:inline">Collect Payment</span>
                      <span className="sm:hidden">Collect</span>
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
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          <div className="relative flex-1 flex items-center justify-center overflow-hidden">
            <video
              ref={videoRef}
              id="camera-video"
              className="w-full h-full object-cover"
              autoPlay
              playsInline
              muted
            />
            
            {/* Camera Header */}
            <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
              <div className="text-white text-sm font-medium bg-black bg-opacity-50 px-3 py-1 rounded-full">
                Receipt Photo
              </div>
              <button
                onClick={handleCloseCamera}
                className="p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all touch-manipulation"
              >
                <X size={24} />
              </button>
            </div>
            
            {/* Camera Frame Guide */}
            <div className="absolute inset-4 border-2 border-white border-opacity-50 rounded-lg pointer-events-none">
              <div className="absolute top-0 left-0 w-6 h-6 border-l-4 border-t-4 border-white rounded-tl-lg"></div>
              <div className="absolute top-0 right-0 w-6 h-6 border-r-4 border-t-4 border-white rounded-tr-lg"></div>
              <div className="absolute bottom-0 left-0 w-6 h-6 border-l-4 border-b-4 border-white rounded-bl-lg"></div>
              <div className="absolute bottom-0 right-0 w-6 h-6 border-r-4 border-b-4 border-white rounded-br-lg"></div>
            </div>
          </div>
          
          {/* Camera Controls */}
          <div className="bg-black bg-opacity-90 p-4 sm:p-6 flex justify-center items-center safe-area-bottom">
            <div className="flex items-center justify-between w-full max-w-xs">
              <button
                onClick={handleCloseCamera}
                className="p-3 bg-gray-700 text-white rounded-full hover:bg-gray-600 transition-all active:scale-95 touch-manipulation"
              >
                <X size={20} />
              </button>
              <button
                onClick={handleCapturePhoto}
                className="p-4 sm:p-5 bg-white text-gray-900 rounded-full hover:bg-gray-100 shadow-lg transition-all active:scale-95 touch-manipulation"
              >
                <Camera size={24} className="sm:w-7 sm:h-7" />
              </button>
              <div className="p-3 opacity-0">
                {/* Spacer for symmetry */}
                <div className="w-5 h-5"></div>
              </div>
            </div>
          </div>
          
          {/* Instructions */}
          <div className="absolute bottom-24 sm:bottom-28 left-4 right-4 text-center pointer-events-none">
            <p className="text-white text-xs sm:text-sm bg-black bg-opacity-60 px-3 sm:px-4 py-1 sm:py-2 rounded-full inline-block">
              Position receipt in frame and tap capture
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
