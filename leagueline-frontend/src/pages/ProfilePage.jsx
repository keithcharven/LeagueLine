import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { profileService } from '../services/profileService';
import { useAuth } from '../hooks/useAuth';

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,72}$/;

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const { refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    fullName: '',
    displayName: '',
    organization: '',
    phoneNumber: '',
    bio: '',
  });
  const [profileMessage, setProfileMessage] = useState(null);
  const [profileError, setProfileError] = useState(null);

  // Change password state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordMessage, setPasswordMessage] = useState(null);
  const [passwordError, setPasswordError] = useState(null);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['my-profile'],
    queryFn: profileService.getProfile,
  });

  useEffect(() => {
    if (profile) {
      setProfileForm({
        fullName: profile.fullName || '',
        displayName: profile.displayName || '',
        organization: profile.organization || '',
        phoneNumber: profile.phoneNumber || '',
        bio: profile.bio || '',
      });
    }
  }, [profile]);

  const updateProfileMutation = useMutation({
    mutationFn: profileService.updateProfile,
    onSuccess: async (updated) => {
      queryClient.setQueryData(['my-profile'], updated);
      if (typeof refreshUser === 'function') {
        await refreshUser();
      }
      setProfileError(null);
      setProfileMessage('Profile updated and saved to the database.');
    },
    onError: (err) => {
      setProfileMessage(null);
      setProfileError(
        err.response?.data?.message ||
          Object.values(err.response?.data?.errors || {})[0] ||
          'Unable to update profile.'
      );
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: profileService.changePassword,
    onSuccess: (res) => {
      setPasswordError(null);
      setPasswordMessage(res.message || 'Password updated successfully.');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    },
    onError: (err) => {
      setPasswordMessage(null);
      setPasswordError(
        err.response?.data?.message ||
          Object.values(err.response?.data?.errors || {})[0] ||
          'Unable to change password.'
      );
    },
  });

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    setProfileMessage(null);
    setProfileError(null);

    if (profileForm.fullName.trim().length < 2) {
      setProfileError('Full name must be at least 2 characters.');
      return;
    }
    updateProfileMutation.mutate(profileForm);
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    setPasswordMessage(null);
    setPasswordError(null);

    if (!passwordForm.currentPassword) {
      setPasswordError('Please enter your current password.');
      return;
    }
    if (!PASSWORD_REGEX.test(passwordForm.newPassword)) {
      setPasswordError('New password must be 8+ characters with an uppercase letter, lowercase letter, and number.');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }
    changePasswordMutation.mutate(passwordForm);
  };

  if (isLoading) {
    return <div className="p-6 text-slate-400">Loading your profile...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-white">Account &amp; Security</h1>
          <p className="text-sm text-slate-400">
            Manage your LeagueLine profile details and update your password.
          </p>
        </div>
        {profile?.role && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 w-fit">
            {profile.role.replace('_', ' ')}
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            activeTab === 'profile'
              ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Profile Details
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('password')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            activeTab === 'password'
              ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Change Password
        </button>
      </div>

      {activeTab === 'profile' ? (
        <form
          onSubmit={handleProfileSubmit}
          className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-5"
        >
          {profileMessage && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm">
              {profileMessage}
            </div>
          )}
          {profileError && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
              {profileError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1.5">
                Email Address (Read-only)
              </label>
              <input
                type="email"
                value={profile?.email || ''}
                disabled
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950/70 border border-slate-800 text-slate-400 cursor-not-allowed text-sm"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1.5">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={profileForm.fullName}
                onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1.5">
                Display Name / IGN
              </label>
              <input
                type="text"
                placeholder="e.g., KCharven"
                value={profileForm.displayName}
                onChange={(e) => setProfileForm({ ...profileForm, displayName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1.5">
                School / Esports Org
              </label>
              <input
                type="text"
                placeholder="e.g., CIT-U Wildcats"
                value={profileForm.organization}
                onChange={(e) => setProfileForm({ ...profileForm, organization: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1.5">
                Contact Number
              </label>
              <input
                type="tel"
                placeholder="+63 912 345 6789"
                value={profileForm.phoneNumber}
                onChange={(e) => setProfileForm({ ...profileForm, phoneNumber: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1.5">
                Bio
              </label>
              <textarea
                rows={3}
                maxLength={300}
                placeholder="Tell teams and organizers about yourself..."
                value={profileForm.bio}
                onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-400"
              />
              <p className="text-xs text-slate-500 mt-1 text-right">
                {profileForm.bio.length}/300
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={updateProfileMutation.isPending}
              className="px-5 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-semibold text-sm transition"
            >
              {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      ) : (
        <form
          onSubmit={handlePasswordSubmit}
          className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-5"
        >
          {passwordMessage && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm">
              {passwordMessage}
            </div>
          )}
          {passwordError && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
              {passwordError}
            </div>
          )}

          <div>
            <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1.5">
              Current Password *
            </label>
            <input
              type="password"
              required
              value={passwordForm.currentPassword}
              onChange={(e) =>
                setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
              }
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1.5">
              New Password *
            </label>
            <input
              type="password"
              required
              value={passwordForm.newPassword}
              onChange={(e) =>
                setPasswordForm({ ...passwordForm, newPassword: e.target.value })
              }
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-400"
            />
            <p className="text-xs text-slate-500 mt-1">
              Minimum 8 characters with uppercase, lowercase, and a number.
            </p>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1.5">
              Confirm New Password *
            </label>
            <input
              type="password"
              required
              value={passwordForm.confirmPassword}
              onChange={(e) =>
                setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
              }
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={changePasswordMutation.isPending}
              className="px-5 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-semibold text-sm transition"
            >
              {changePasswordMutation.isPending ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}