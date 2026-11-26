import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { api } from '../../services/api.js';
import { Button } from '../../components/common/Button.jsx';
import { AlertCircle, Camera, ArrowLeft, Lock } from 'lucide-react';

export function EditProfilePage() {
  const { user, updateUser } = useAuth();
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: ''
  });

  const [previewImage, setPreviewImage] = useState(null);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    setFormData({
      name: user.name || '',
      phone: user.phone || '',
      address: user.address || ''
    });

    // Load profile image if exists
    if (user.profile_image_url) {
      setPreviewImage(user.profile_image_url);
    }
  }, [user, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result);
    };
    reader.readAsDataURL(file);
    setError('');
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((previous) => ({
      ...previous,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const hasPasswordChange = passwordData.currentPassword
        || passwordData.newPassword
        || passwordData.confirmPassword;

      if (hasPasswordChange) {
        if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
          throw new Error('Complete all password fields to change your password.');
        }
        if (passwordData.newPassword !== passwordData.confirmPassword) {
          throw new Error('New password and confirmation do not match.');
        }
      }

      const data = await api.updateProfile({
        ...formData,
        profile_image_url: previewImage
      });

      if (hasPasswordChange) {
        await api.changePassword(passwordData.currentPassword, passwordData.newPassword);
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      }

      updateUser(data.user);

      setSuccess(lang === 'ur' ? 'پروفائل کامیابی سے اپ ڈیٹ ہو گیا' : 'Profile updated successfully!');

      setTimeout(() => {
        navigate(user.role === 'admin' || user.role === 'farm_owner'
          ? '/admin'
          : user.role === 'rider' ? '/rider/profile' : '/');
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="container mx-auto px-4 py-12">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-[#14532D] hover:text-[#218838] mb-6 font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        {lang === 'ur' ? 'واپس جائیں' : 'Go Back'}
      </button>

      <div className="max-w-2xl mx-auto">
        <div className="card-elevation-2 rounded-3xl p-8 bg-white border border-[#E2E8F0] space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-extrabold text-[#111d23] mb-2">
              {lang === 'ur' ? 'پروفائل میں ترمیم کریں' : 'Edit Your Profile'}
            </h1>
            <p className="text-sm text-[#6f7a6c]">
              {lang === 'ur' ? 'اپنی معلومات اور تصویر اپ ڈیٹ کریں' : 'Update your personal information and profile picture'}
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-xs text-green-700">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile Picture Upload */}
            <div className="flex flex-col items-center">
              <div className="relative mb-4">
                <div className="w-24 h-24 rounded-full bg-[#F3F7F1] border-2 border-[#E2E8F0] flex items-center justify-center overflow-hidden">
                  {previewImage ? (
                    <img src={previewImage} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#218838] to-[#14532D] flex items-center justify-center text-white text-3xl font-bold">
                      {user.name?.[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#218838] text-white flex items-center justify-center hover:bg-[#14532D] transition-colors shadow-md"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              <p className="text-xs text-[#6f7a6c]">
                {lang === 'ur' ? 'تصویر تبدیل کرنے کے لیے کیمرہ بٹن دبائیں' : 'Click camera to change photo'}
              </p>
            </div>

            {/* Name Field */}
            <div>
              <label className="text-xs font-semibold text-[#14532D] block mb-2">
                {lang === 'ur' ? 'نام' : 'Full Name'}
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder={lang === 'ur' ? 'آپ کا نام درج کریں' : 'Enter your full name'}
                className="w-full h-11 px-3.5 rounded-md bg-white border border-[#E2E8F0] text-xs text-[#263238] dairy-input"
              />
            </div>

            {/* Phone Field */}
            <div>
              <label className="text-xs font-semibold text-[#14532D] block mb-2">
                {lang === 'ur' ? 'فون نمبر' : 'Phone Number'}
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder={lang === 'ur' ? '03001234567' : '+923001234567'}
                className="w-full h-11 px-3.5 rounded-md bg-white border border-[#E2E8F0] text-xs text-[#263238] dairy-input"
              />
            </div>

            {/* Address Field */}
            <div>
              <label className="text-xs font-semibold text-[#14532D] block mb-2">
                {lang === 'ur' ? 'پتہ' : 'Address'}
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder={lang === 'ur' ? 'اپنا مکمل پتہ درج کریں' : 'Enter your complete address'}
                rows="3"
                className="w-full px-3.5 py-2 rounded-md bg-white border border-[#E2E8F0] text-xs text-[#263238] dairy-input resize-none"
              />
            </div>

            {/* Password Fields */}
            <div className="space-y-4 border-t border-[#E2E8F0] pt-5">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#218838]" />
                <h2 className="text-sm font-bold text-[#14532D]">
                  {lang === 'ur' ? 'پاس ورڈ تبدیل کریں' : 'Change Password'}
                </h2>
              </div>
              <p className="text-xs text-[#6f7a6c]">
                {lang === 'ur'
                  ? 'پاس ورڈ تبدیل نہ کرنا ہو تو یہ خانے خالی چھوڑ دیں۔'
                  : 'Leave these fields empty if you do not want to change your password.'}
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <input
                  type="password"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  placeholder={lang === 'ur' ? 'موجودہ پاس ورڈ' : 'Current password'}
                  className="w-full h-11 px-3.5 rounded-md bg-white border border-[#E2E8F0] text-xs text-[#263238] dairy-input"
                />
                <input
                  type="password"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  placeholder={lang === 'ur' ? 'نیا پاس ورڈ' : 'New password'}
                  className="w-full h-11 px-3.5 rounded-md bg-white border border-[#E2E8F0] text-xs text-[#263238] dairy-input"
                />
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  placeholder={lang === 'ur' ? 'پاس ورڈ دوبارہ درج کریں' : 'Confirm password'}
                  className="w-full h-11 px-3.5 rounded-md bg-white border border-[#E2E8F0] text-xs text-[#263238] dairy-input"
                />
              </div>
            </div>

            {/* Submit Button */}
            <Button
              variant="primary"
              size="lg"
              type="submit"
              disabled={loading}
              className="w-full font-bold shadow-sm"
            >
              {loading ? (lang === 'ur' ? 'محفوظ ہو رہا ہے...' : 'Saving...') : (lang === 'ur' ? 'پروفائل محفوظ کریں' : 'Save Profile')}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
