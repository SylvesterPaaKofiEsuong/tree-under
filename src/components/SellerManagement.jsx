import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useCollection, useFirestore } from '../hooks/useFirestore';
import { 
  Users, 
  UserPlus, 
  Edit, 
  Trash2, 
  Search, 
  Filter,
  CheckCircle,
  XCircle,
  Save,
  X,
  AlertCircle,
  ArrowLeft
} from 'lucide-react';
import { orderBy } from 'firebase/firestore';

export default function SellerManagement({ onNavigate }) {
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSeller, setEditingSeller] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  // Fetch all sellers (both active and inactive)
  const { data: sellers, loading, error } = useCollection('sellers', [orderBy('name')]);
  const { addDocument, updateDocument, deleteDocument, loading: operationLoading } = useFirestore('sellers');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    feeRate: 10,
    product: '',
    schedule: [],
    active: true
  });

  const days = [
    { key: 'Mon', label: t('monday') },
    { key: 'Tue', label: t('tuesday') },
    { key: 'Wed', label: t('wednesday') },
    { key: 'Thu', label: t('thursday') },
    { key: 'Fri', label: t('friday') },
    { key: 'Sat', label: t('saturday') }
  ];

  // Filter sellers based on search and active status
  const filteredSellers = sellers.filter(seller => {
    const matchesSearch = seller.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         seller.product.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterActive === 'all' || 
                         (filterActive === 'active' && seller.active) ||
                         (filterActive === 'inactive' && !seller.active);
    return matchesSearch && matchesFilter;
  });

  const resetForm = () => {
    setFormData({
      name: '',
      feeRate: 10,
      product: '',
      schedule: [],
      active: true
    });
    setEditingSeller(null);
    setShowAddForm(false);
  };

  const handleEdit = (seller) => {
    setFormData({
      name: seller.name,
      feeRate: seller.feeRate,
      product: seller.product,
      schedule: seller.schedule || [],
      active: seller.active
    });
    setEditingSeller(seller.id);
    setShowAddForm(true);
  };

  const handleScheduleChange = (day) => {
    setFormData(prev => ({
      ...prev,
      schedule: prev.schedule.includes(day)
        ? prev.schedule.filter(d => d !== day)
        : [...prev.schedule, day]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const sellerData = {
        ...formData,
        addedBy: currentUser.uid,
        lastModifiedBy: currentUser.uid
      };

      if (editingSeller) {
        await updateDocument(editingSeller, sellerData);
      } else {
        await addDocument(sellerData);
      }
      resetForm();
    } catch (error) {
      console.error('Error saving seller:', error);
    }
  };

  const handleDelete = async (sellerId) => {
    try {
      await deleteDocument(sellerId);
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting seller:', error);
    }
  };

  const toggleSellerStatus = async (seller) => {
    try {
      await updateDocument(seller.id, {
        active: !seller.active,
        lastModifiedBy: currentUser.uid
      });
    } catch (error) {
      console.error('Error updating seller status:', error);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <AlertCircle size={64} className="mx-auto text-red-400 mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">{t('error')}</h2>
          <p className="text-red-600">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 btn btn-primary"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        {/* Back to Dashboard Button */}
        <button
          onClick={() => onNavigate('dashboard')}
          className="flex items-center text-gray-600 hover:text-primary-600 mb-4 transition-colors"
        >
          <ArrowLeft size={20} className="mr-2" />
          {t('backToDashboard')}
        </button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {t('manageSellers')}
            </h1>
            <p className="text-gray-600">
              {filteredSellers.length} {filteredSellers.length === 1 ? 'seller' : 'sellers'}
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="btn btn-primary flex items-center"
          >
            <UserPlus size={20} className="mr-2" />
            {t('addSeller')}
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={`${t('search')} sellers...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter size={20} className="text-gray-400" />
          <select
            value={filterActive}
            onChange={(e) => setFilterActive(e.target.value)}
            className="input w-auto"
          >
            <option value="all">{t('all')}</option>
            <option value="active">{t('active')}</option>
            <option value="inactive">{t('inactive')}</option>
          </select>
        </div>
      </div>

      {/* Sellers Grid */}
      {filteredSellers.length === 0 ? (
        <div className="text-center py-12">
          <Users size={64} className="mx-auto text-gray-400 mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            {searchTerm || filterActive !== 'all' ? 'No sellers found' : 'No sellers yet'}
          </h2>
          <p className="text-gray-600 mb-4">
            {searchTerm || filterActive !== 'all' 
              ? 'Try adjusting your search or filter criteria' 
              : 'Add your first seller to get started'}
          </p>
          {!searchTerm && filterActive === 'all' && (
            <button
              onClick={() => setShowAddForm(true)}
              className="btn btn-primary"
            >
              <UserPlus size={20} className="mr-2" />
              {t('addSeller')}
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSellers.map((seller) => (
            <div key={seller.id} className={`card p-6 ${
              seller.active ? '' : 'opacity-75 border-gray-300'
            }`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {seller.name}
                  </h3>
                  <p className="text-gray-600 mb-2">{seller.product}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>GHS {seller.feeRate}/day</span>
                    <span className={`flex items-center ${
                      seller.active ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {seller.active ? (
                        <CheckCircle size={16} className="mr-1" />
                      ) : (
                        <XCircle size={16} className="mr-1" />
                      )}
                      {seller.active ? t('active') : t('inactive')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Schedule */}
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">{t('schedule')}:</p>
                <div className="flex flex-wrap gap-1">
                  {seller.schedule?.length > 0 ? (
                    seller.schedule.map(day => (
                      <span key={day} className="bg-primary-100 text-primary-700 px-2 py-1 rounded text-xs">
                        {day}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500 text-sm">No schedule set</span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <button
                  onClick={() => toggleSellerStatus(seller)}
                  className={`text-sm font-medium ${
                    seller.active ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'
                  }`}
                  disabled={operationLoading}
                >
                  {seller.active ? 'Deactivate' : 'Activate'}
                </button>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(seller)}
                    className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-md"
                    title={t('edit')}
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(seller.id)}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md"
                    title={t('delete')}
                    disabled={operationLoading}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Seller Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingSeller ? t('editSeller') : t('addSeller')}
                </h2>
                <button
                  onClick={resetForm}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('sellerName')} *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="input"
                    required
                    placeholder="Enter seller name"
                  />
                </div>

                {/* Product */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('product')} *
                  </label>
                  <input
                    type="text"
                    value={formData.product}
                    onChange={(e) => setFormData(prev => ({ ...prev, product: e.target.value }))}
                    className="input"
                    required
                    placeholder="e.g., Porridge, Rice, Banku"
                  />
                </div>

                {/* Fee Rate */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('feeRate')} *
                  </label>
                  <select
                    value={formData.feeRate}
                    onChange={(e) => setFormData(prev => ({ ...prev, feeRate: parseInt(e.target.value) }))}
                    className="input"
                    required
                  >
                    <option value={5}>GHS 5 (Small seller)</option>
                    <option value={10}>GHS 10 (Standard seller)</option>
                  </select>
                </div>

                {/* Schedule */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('schedule')}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {days.map(day => (
                      <label key={day.key} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.schedule.includes(day.key)}
                          onChange={() => handleScheduleChange(day.key)}
                          className="rounded text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm">{day.key}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Active Status */}
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="active"
                    checked={formData.active}
                    onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                    className="rounded text-primary-600 focus:ring-primary-500"
                  />
                  <label htmlFor="active" className="text-sm font-medium text-gray-700">
                    {t('active')}
                  </label>
                </div>

                {/* Submit Buttons */}
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 btn btn-secondary"
                    disabled={operationLoading}
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 btn btn-primary"
                    disabled={operationLoading}
                  >
                    {operationLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                        {t('saving')}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <Save size={16} className="mr-2" />
                        {editingSeller ? t('update') : t('save')}
                      </div>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <AlertCircle size={24} className="text-red-500 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900">
                {t('confirm')} {t('delete')}
              </h2>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this seller? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 btn btn-secondary"
                disabled={operationLoading}
              >
                {t('cancel')}
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="flex-1 btn btn-danger"
                disabled={operationLoading}
              >
                {operationLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    {t('deleting')}
                  </div>
                ) : (
                  t('delete')
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
