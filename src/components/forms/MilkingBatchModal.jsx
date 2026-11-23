import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { Button } from '../common/Button.jsx';
import { X, Check } from 'lucide-react';

export function MilkingBatchModal({ isOpen, onClose, onSave }) {
  const { t, lang } = useLanguage();
  const [formData, setFormData] = useState({
    livestock_tag: 'BF-104 (Nili-Ravi Herd A)',
    animal_type: 'Buffalo',
    session: 'Morning',
    yield_liters: 280.0,
    fat_percentage: 6.8,
    snf_percentage: 9.2,
    chiller_temp_c: 3.8,
    milking_time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    recorded_by: 'Dr. Arshad (Vet Officer)'
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      await onSave({
        ...formData,
        yield_liters: Number(formData.yield_liters),
        fat_percentage: Number(formData.fat_percentage),
        snf_percentage: Number(formData.snf_percentage),
        chiller_temp_c: Number(formData.chiller_temp_c)
      });
      onClose();
    } catch (err) {
      console.error(err);
      setFormError(err.message || 'Unable to save this milking session.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 modal-elevation-3 border border-[#E2E8F0]">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E2E8F0]">
          <h3 className="text-lg font-bold text-[#14532D]">
            {lang === 'ur' ? 'نیا ملکنک بیچ سیشن درج کریں' : 'Record New Milking Session'}
          </h3>
          <button onClick={onClose} className="p-1 rounded text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-xs font-semibold text-[#14532D] block mb-1">
                {lang === 'ur' ? 'مویشی کا ٹیگ' : 'Livestock Tag / Breed'}
              </label>
              <input
                type="text"
                required
                value={formData.livestock_tag}
                onChange={(e) => setFormData({ ...formData, livestock_tag: e.target.value })}
                className="w-full h-11 px-3 bg-white border border-[#E2E8F0] rounded-md text-sm text-[#263238] dairy-input"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#14532D] block mb-1">
                {lang === 'ur' ? 'جانور کی قسم' : 'Animal Type'}
              </label>
              <select
                value={formData.animal_type}
                onChange={(e) => setFormData({ ...formData, animal_type: e.target.value })}
                className="w-full h-11 px-3 bg-white border border-[#E2E8F0] rounded-md text-sm text-[#263238] dairy-input"
              >
                <option value="Buffalo">Nili-Ravi Buffalo (بھینس)</option>
                <option value="Cow">Sahiwal Cow (گائے)</option>
                <option value="Goat">Beetal Goat (بکری)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#14532D] block mb-1">
                {lang === 'ur' ? 'سیشن' : 'Milking Session'}
              </label>
              <select
                value={formData.session}
                onChange={(e) => setFormData({ ...formData, session: e.target.value })}
                className="w-full h-11 px-3 bg-white border border-[#E2E8F0] rounded-md text-sm text-[#263238] dairy-input"
              >
                <option value="Morning">Morning (صبح)</option>
                <option value="Evening">Evening (شام)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#14532D] block mb-1">
                {lang === 'ur' ? 'کل پیداوار (لیٹر)' : 'Yield (Liters)'}
              </label>
              <input
                type="number"
                step="0.5"
                required
                value={formData.yield_liters}
                onChange={(e) => setFormData({ ...formData, yield_liters: e.target.value })}
                className="w-full h-11 px-3 bg-white border border-[#E2E8F0] rounded-md text-sm text-[#263238] dairy-input tabular-nums"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#14532D] block mb-1">
                {lang === 'ur' ? 'فیٹ چکنائی %' : 'Fat %'}
              </label>
              <input
                type="number"
                step="0.1"
                required
                value={formData.fat_percentage}
                onChange={(e) => setFormData({ ...formData, fat_percentage: e.target.value })}
                className="w-full h-11 px-3 bg-white border border-[#E2E8F0] rounded-md text-sm text-[#263238] dairy-input tabular-nums"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#14532D] block mb-1">
                {lang === 'ur' ? 'ایس این ایف %' : 'SNF %'}
              </label>
              <input
                type="number"
                step="0.1"
                required
                value={formData.snf_percentage}
                onChange={(e) => setFormData({ ...formData, snf_percentage: e.target.value })}
                className="w-full h-11 px-3 bg-white border border-[#E2E8F0] rounded-md text-sm text-[#263238] dairy-input tabular-nums"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#14532D] block mb-1">
                {lang === 'ur' ? 'چلر ٹمپریچر (°C)' : 'Chiller Temp (°C)'}
              </label>
              <input
                type="number"
                step="0.1"
                required
                value={formData.chiller_temp_c}
                onChange={(e) => setFormData({ ...formData, chiller_temp_c: e.target.value })}
                className="w-full h-11 px-3 bg-white border border-[#E2E8F0] rounded-md text-sm text-[#263238] dairy-input tabular-nums"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#14532D] block mb-1">
                {lang === 'ur' ? 'ڈاکٹر / آفیسر' : 'Verified By'}
              </label>
              <input
                type="text"
                required
                value={formData.recorded_by}
                onChange={(e) => setFormData({ ...formData, recorded_by: e.target.value })}
                className="w-full h-11 px-3 bg-white border border-[#E2E8F0] rounded-md text-sm text-[#263238] dairy-input"
              />
            </div>
          </div>

          {formError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{formError}</div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E2E8F0]">
            <Button variant="ghost" onClick={onClose}>
              {lang === 'ur' ? 'منسوخ' : 'Cancel'}
            </Button>
            <Button variant="primary" type="submit" disabled={submitting}>
              <Check className="w-4 h-4" />
              <span>{submitting ? 'Saving...' : (lang === 'ur' ? 'محفوظ کریں' : 'Save Milking Batch')}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
