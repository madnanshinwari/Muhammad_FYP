import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { Button } from '../common/Button.jsx';
import { X, Check } from 'lucide-react';

export function ProductModal({ isOpen, onClose, product = null, onSave }) {
  const { lang } = useLanguage();
  const [formData, setFormData] = useState({
    name_en: '',
    name_ur: '',
    category: 'milk',
    description_en: '',
    description_ur: '',
    fat_percentage: 6.5,
    snf_percentage: 9.0,
    base_price: 240,
    unit_type: 'L',
    available_units: '["0.5", "1.0", "2.0", "5.0"]',
    stock_quantity: 100,
    image_url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=800&q=80',
    is_fresh_batch: 1,
    is_organic: 1
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (product) {
      setFormData({
        name_en: product.name_en || '',
        name_ur: product.name_ur || '',
        category: product.category || 'milk',
        description_en: product.description_en || '',
        description_ur: product.description_ur || '',
        fat_percentage: product.fat_percentage ?? 6.5,
        snf_percentage: product.snf_percentage ?? 9.0,
        base_price: product.base_price ?? 240,
        unit_type: product.unit_type || 'L',
        available_units: typeof product.available_units === 'string' 
          ? product.available_units 
          : JSON.stringify(product.available_units || ["1.0"]),
        stock_quantity: product.stock_quantity ?? 100,
        image_url: product.image_url || '',
        is_fresh_batch: product.is_fresh_batch ?? 1,
        is_organic: product.is_organic ?? 1
      });
    } else {
      setFormData({
        name_en: '',
        name_ur: '',
        category: 'milk',
        description_en: '',
        description_ur: '',
        fat_percentage: 6.5,
        snf_percentage: 9.0,
        base_price: 240,
        unit_type: 'L',
        available_units: '["0.5", "1.0", "2.0", "5.0"]',
        stock_quantity: 100,
        image_url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=800&q=80',
        is_fresh_batch: 1,
        is_organic: 1
      });
    }
    setFormError('');
  }, [product, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      const units = JSON.parse(formData.available_units);
      if (!Array.isArray(units) || units.length === 0) throw new Error('not a list');
    } catch {
      setFormError('Available units must be a list like ["0.5", "1.0", "5.0"].');
      return;
    }
    setSubmitting(true);
    try {
      await onSave({
        ...formData,
        base_price: Number(formData.base_price),
        stock_quantity: Number(formData.stock_quantity),
        fat_percentage: Number(formData.fat_percentage),
        snf_percentage: Number(formData.snf_percentage)
      });
      onClose();
    } catch (err) {
      console.error(err);
      setFormError(err.message || 'Unable to save this product.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 modal-elevation-3 border border-[#E2E8F0]">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E2E8F0]">
          <h3 className="text-lg font-bold text-[#14532D]">
            {product ? (lang === 'ur' ? 'پراڈکٹ تبدیل کریں' : 'Edit Product SKU') : (lang === 'ur' ? 'نئی پراڈکٹ شامل کریں' : 'Add New Product SKU')}
          </h3>
          <button onClick={onClose} className="p-1 rounded text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-xs font-semibold text-[#14532D] block mb-1">
                Product Name (English)
              </label>
              <input
                type="text"
                required
                value={formData.name_en}
                onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                className="w-full h-11 px-3 bg-white border border-[#E2E8F0] rounded-md text-sm text-[#263238] dairy-input"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#14532D] block mb-1 font-urdu">
                پراڈکٹ کا نام (اردو)
              </label>
              <input
                type="text"
                required
                value={formData.name_ur}
                onChange={(e) => setFormData({ ...formData, name_ur: e.target.value })}
                className="w-full h-11 px-3 bg-white border border-[#E2E8F0] rounded-md text-sm text-[#263238] font-urdu dairy-input text-right"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#14532D] block mb-1">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full h-11 px-3 bg-white border border-[#E2E8F0] rounded-md text-sm text-[#263238] dairy-input"
              >
                <option value="milk">Fresh Raw Milk</option>
                <option value="ghee_butter">Desi Ghee & Butter</option>
                <option value="yogurt_cream">Yogurt & Cream</option>
                <option value="cheese">Artisanal Paneer</option>
                <option value="specials">Farm Specials & Khoya</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#14532D] block mb-1">
                Base Price (Rs. per 1.0 unit)
              </label>
              <input
                type="number"
                required
                value={formData.base_price}
                onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                className="w-full h-11 px-3 bg-white border border-[#E2E8F0] rounded-md text-sm text-[#263238] dairy-input tabular-nums"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#14532D] block mb-1">
                Unit Type
              </label>
              <select
                value={formData.unit_type}
                onChange={(e) => setFormData({ ...formData, unit_type: e.target.value })}
                className="w-full h-11 px-3 bg-white border border-[#E2E8F0] rounded-md text-sm text-[#263238] dairy-input"
              >
                <option value="L">Liters (L)</option>
                <option value="kg">Kilograms (kg)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#14532D] block mb-1">
                Stock In Hand
              </label>
              <input
                type="number"
                required
                value={formData.stock_quantity}
                onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                className="w-full h-11 px-3 bg-white border border-[#E2E8F0] rounded-md text-sm text-[#263238] dairy-input tabular-nums"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#14532D] block mb-1">
                Fat % (Chiknai)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.fat_percentage}
                onChange={(e) => setFormData({ ...formData, fat_percentage: e.target.value })}
                className="w-full h-11 px-3 bg-white border border-[#E2E8F0] rounded-md text-sm text-[#263238] dairy-input tabular-nums"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#14532D] block mb-1">
                SNF % (Solid-Non-Fat)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.snf_percentage}
                onChange={(e) => setFormData({ ...formData, snf_percentage: e.target.value })}
                className="w-full h-11 px-3 bg-white border border-[#E2E8F0] rounded-md text-sm text-[#263238] dairy-input tabular-nums"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#14532D] block mb-1">
              Available Units JSON (e.g. ["0.5", "1.0", "5.0"])
            </label>
            <input
              type="text"
              required
              value={formData.available_units}
              onChange={(e) => setFormData({ ...formData, available_units: e.target.value })}
              className="w-full h-11 px-3 bg-white border border-[#E2E8F0] rounded-md text-sm text-[#263238] font-mono text-xs dairy-input"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#14532D] block mb-1">
              Image URL
            </label>
            <input
              type="text"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              className="w-full h-11 px-3 bg-white border border-[#E2E8F0] rounded-md text-sm text-[#263238] dairy-input"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#14532D] block mb-1">
              Description (English)
            </label>
            <textarea
              rows={2}
              value={formData.description_en}
              onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
              className="w-full p-2.5 bg-white border border-[#E2E8F0] rounded-md text-sm text-[#263238] dairy-input"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#14532D] block mb-1 font-urdu">
              تفصیل (اردو)
            </label>
            <textarea
              rows={2}
              value={formData.description_ur}
              onChange={(e) => setFormData({ ...formData, description_ur: e.target.value })}
              className="w-full p-2.5 bg-white border border-[#E2E8F0] rounded-md text-sm text-[#263238] font-urdu dairy-input text-right"
            />
          </div>

          {formError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{formError}</div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E2E8F0]">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={submitting}>
              <Check className="w-4 h-4" />
              <span>{submitting ? 'Saving...' : 'Save Product'}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
