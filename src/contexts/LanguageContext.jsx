import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export function useLanguage() {
  return useContext(LanguageContext);
}

const translations = {
  en: {
    // Authentication
    welcome: 'Welcome',
    loginDescription: 'Canteen Fee Tracking System',
    enterPin: 'Enter your PIN',
    login: 'Login',
    loggingIn: 'Logging in...',
    logout: 'Logout',
    pinHint: 'Enter the 4-6 digit PIN provided by your administrator',
    appVersion: 'Version',

    // Navigation
    dashboard: 'Dashboard',
    attendance: 'Attendance',
    payments: 'Payments',
    reports: 'Reports',
    sellers: 'Sellers',
    settings: 'Settings',

    // Dashboard
    totalSellers: 'Total Sellers',
    presentToday: 'Present Today',
    weeklyCollection: 'Weekly Collection',
    outstandingFees: 'Outstanding Fees',
    quickActions: 'Quick Actions',
    markAttendance: 'Mark Attendance',
    collectPayment: 'Collect Payment',
    viewReports: 'View Reports',
    manageSellers: 'Manage Sellers',

    // Attendance
    markDailyAttendance: 'Mark Daily Attendance',
    selectDate: 'Select Date',
    presentSellers: 'Present Sellers',
    absentSellers: 'Absent Sellers',
    markPresent: 'Mark Present',
    markAbsent: 'Mark Absent',
    attendanceMarked: 'Attendance marked successfully',
    attendanceError: 'Failed to mark attendance',

    // Payments
    collectPayments: 'Collect Payments',
    weeklyFees: 'Weekly Fees',
    paymentAmount: 'Payment Amount',
    daysWorked: 'Days Worked',
    takePhoto: 'Take Receipt Photo',
    retakePhoto: 'Retake Photo',
    usePhoto: 'Use This Photo',
    collectFee: 'Collect Fee',
    paymentCollected: 'Payment collected successfully',
    paymentError: 'Failed to collect payment',

    // Sellers
    addSeller: 'Add Seller',
    editSeller: 'Edit Seller',
    sellerName: 'Seller Name',
    feeRate: 'Fee Rate (GHS)',
    product: 'Product',
    schedule: 'Schedule',
    active: 'Active',
    inactive: 'Inactive',
    saveSeller: 'Save Seller',
    deleteSeller: 'Delete Seller',
    sellerSaved: 'Seller saved successfully',
    sellerDeleted: 'Seller deleted successfully',

    // Reports
    weeklyReport: 'Weekly Report',
    monthlyReport: 'Monthly Report',
    exportData: 'Export Data',
    totalCollected: 'Total Collected',
    totalOutstanding: 'Total Outstanding',
    collectionRate: 'Collection Rate',

    // Common
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    confirm: 'Confirm',
    yes: 'Yes',
    no: 'No',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    date: 'Date',
    amount: 'Amount',
    status: 'Status',
    actions: 'Actions',
    search: 'Search',
    filter: 'Filter',
    all: 'All',
    
    // Days
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    
    // Months
    january: 'January',
    february: 'February',
    march: 'March',
    april: 'April',
    may: 'May',
    june: 'June',
    july: 'July',
    august: 'August',
    september: 'September',
    october: 'October',
    november: 'November',
    december: 'December',

    // Offline
    offline: 'You are offline',
    onlineAgain: 'Back online',
    syncingData: 'Syncing data...'
  },
  tw: {
    // Authentication
    welcome: 'Akwaaba',
    loginDescription: 'Canteen Fee Tracking System',
    enterPin: 'Fa wo PIN no',
    login: 'Kɔ mu',
    loggingIn: 'Rekɔ mu...',
    logout: 'Fi adi',
    pinHint: 'Fa nɔma 4-6 a wo admin de ama wo no',
    appVersion: 'Version',

    // Navigation
    dashboard: 'Dashboard',
    attendance: 'Attendance',
    payments: 'Sika a wɔde ba',
    reports: 'Amanneɛbɔ',
    sellers: 'Atɔnfoɔ',
    settings: 'Nhyehyɛe',

    // Dashboard
    totalSellers: 'Atɔnfoɔ dodoɔ',
    presentToday: 'Wɔn a wɔwɔ hɔ ɛnnɛ',
    weeklyCollection: 'Dapɛn biara sika a wɔde ba',
    outstandingFees: 'Sika a ɛda so',
    quickActions: 'Ntɛm dwumadie',
    markAttendance: 'Hyɛ attendance',
    collectPayment: 'Gye sika',
    viewReports: 'Hwɛ amanneɛbɔ',
    manageSellers: 'Di atɔnfoɔ so',

    // Attendance
    markDailyAttendance: 'Hyɛ da biara attendance',
    selectDate: 'Yi da',
    presentSellers: 'Atɔnfoɔ a wɔwɔ hɔ',
    absentSellers: 'Atɔnfoɔ a wɔnni hɔ',
    markPresent: 'Hyɛ sɛ ɔwɔ hɔ',
    markAbsent: 'Hyɛ sɛ ɔnni hɔ',
    attendanceMarked: 'Attendance a wɔahyɛ no yɛ',
    attendanceError: 'Attendance hyɛ no ansi yie',

    // Payments
    collectPayments: 'Gye sika',
    weeklyFees: 'Dapɛn biara sika',
    paymentAmount: 'Sika dodoɔ',
    daysWorked: 'Nna a ɔyɛɛ adwuma',
    takePhoto: 'Twe mfonini foto',
    retakePhoto: 'Twe bio',
    usePhoto: 'Fa foto yi di dwuma',
    collectFee: 'Gye sika no',
    paymentCollected: 'Sika no a wɔde baeɛ no yɛ',
    paymentError: 'Sika gye no ansi yie',

    // Sellers
    addSeller: 'Fa atɔnni foforɔ ka ho',
    editSeller: 'Sesa atɔnni',
    sellerName: 'Atɔnni din',
    feeRate: 'Sika dodoɔ (GHS)',
    product: 'Adeɛ a ɔtɔn',
    schedule: 'Ne dwuma berɛ',
    active: 'Ɔyɛ adwuma',
    inactive: 'Ɔnyɛ adwuma',
    saveSeller: 'Kora atɔnni',
    deleteSeller: 'Yi atɔnni fi hɔ',
    sellerSaved: 'Atɔnni a wɔakora no yɛ',
    sellerDeleted: 'Atɔnni a wɔayi no yɛ',

    // Reports
    weeklyReport: 'Dapɛn biara amanneɛbɔ',
    monthlyReport: 'Bosome biara amanneɛbɔ',
    exportData: 'Yi data fi hɔ',
    totalCollected: 'Sika a wɔde baeɛ nyinaa',
    totalOutstanding: 'Sika a ɛda so nyinaa',
    collectionRate: 'Sika ba kwan',

    // Common
    save: 'Kora',
    cancel: 'Twa to',
    delete: 'Yi fi hɔ',
    edit: 'Sesa',
    confirm: 'Gye di',
    yes: 'Aane',
    no: 'Daabi',
    loading: 'Ɛrekɔ so...',
    error: 'Mfomsoɔ',
    success: 'Yɛ',
    date: 'Da',
    amount: 'Sika dodoɔ',
    status: 'Tebea',
    actions: 'Nneyɛeɛ',
    search: 'Hwehwɛ',
    filter: 'Nhyɛ mu',
    all: 'Nyinaa',
    
    // Days
    monday: 'Dwowda',
    tuesday: 'Benada',
    wednesday: 'Wukuda',
    thursday: 'Yawda',
    friday: 'Fida',
    saturday: 'Memenda',
    
    // Months (keeping English names as commonly used)
    january: 'January',
    february: 'February',
    march: 'March',
    april: 'April',
    may: 'May',
    june: 'June',
    july: 'July',
    august: 'August',
    september: 'September',
    october: 'October',
    november: 'November',
    december: 'December',

    // Offline
    offline: 'Wonni internet',
    onlineAgain: 'Internet aba bio',
    syncingData: 'Ɛre sync data...'
  }
};

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('en');

  // Load saved language from localStorage
  useEffect(() => {
    const savedLanguage = localStorage.getItem('tuc_language');
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'tw')) {
      setLanguage(savedLanguage);
    }
  }, []);

  const switchLanguage = (newLanguage) => {
    if (newLanguage === 'en' || newLanguage === 'tw') {
      setLanguage(newLanguage);
      localStorage.setItem('tuc_language', newLanguage);
    }
  };

  const t = (key) => {
    return translations[language][key] || translations.en[key] || key;
  };

  const value = {
    language,
    switchLanguage,
    t,
    isEnglish: language === 'en',
    isTwi: language === 'tw'
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export default LanguageProvider;