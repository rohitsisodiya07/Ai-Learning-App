import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  User,
  Mail,
  Lock,
  Camera,
  Pencil,
  Save,
  X,
  Loader2,
  Eye,
  EyeOff,
  ShieldCheck,
  KeyRound,
  CheckCircle2
} from "lucide-react";

import api from "../../Api";

const ProfilePage = () => {
  // Profile States
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [profileImage, setProfileImage] = useState("");

  const [editMode, setEditMode] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  // Password States
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const token = localStorage.getItem("token");

  // Fetch Profile
  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${api}/user/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const user = response.data.data;
      setUsername(user.userName || "");
      setEmail(user.email || "");
      setProfileImage(user.profileImage || "");
    } catch (error) {
      console.error("Profile Error:", error);
      toast.error(error.response?.data?.message || "Failed to fetch profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchProfile();
    } else {
      setLoading(false);
      toast.error("Please login first");
    }
  }, [token]);

  // Image Change Handler
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      return toast.error("Please select a valid image");
    }

    if (file.size > 5 * 1024 * 1024) {
      return toast.error("Image size should be less than 5MB");
    }

    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  // Update Profile
  const handleUpdateProfile = async (e) => {
    e.preventDefault();

    if (!username.trim() || username.trim().length < 3) {
      return toast.error("Username must be at least 3 characters");
    }
    if (!email.trim()) {
      return toast.error("Email cannot be empty");
    }

    try {
      setSaving(true);
      const formData = new FormData();
      formData.append("userName", username.trim());
      formData.append("email", email.trim());
      if (selectedImage) formData.append("profileImage", selectedImage);

      const response = await axios.patch(`${api}/user/updateProfile`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const updatedUser = response.data.data;
      setUsername(updatedUser.userName || "");
      setEmail(updatedUser.email || "");
      setProfileImage(updatedUser.profileImage || "");

      setSelectedImage(null);
      setImagePreview("");
      setEditMode(false);

      toast.success(response.data.message || "Profile updated successfully");
    } catch (error) {
      console.error("Update Profile Error:", error);
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setSelectedImage(null);
    setImagePreview("");
    fetchProfile();
  };

  // Change Password
  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (!currentPassword) return toast.error("Please enter your current password");
    if (!newPassword || newPassword.length < 6) return toast.error("New password must be at least 6 characters");
    if (newPassword !== confirmPassword) return toast.error("Passwords do not match");

    try {
      setChangingPassword(true);
      const response = await axios.patch(
        `${api}/user/changePassword`,
        { currentPassword, newPassword, confirmPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(response.data.message || "Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Change Password Error:", error);
      toast.error(error.response?.data?.message || "Failed to change password");
    } finally {
      setChangingPassword(false);
    }
  };

  // Get correct image URL logic to prevent blob URL breaking
  const getDisplayImage = () => {
    if (imagePreview) return imagePreview;
    if (profileImage) return `${api}${profileImage}`;
    return null;
  };

  const currentDisplayImage = getDisplayImage();
  const profileInitial = username?.charAt(0)?.toUpperCase() || "U";

  // Loading State
  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-emerald-500">
          <Loader2 className="w-10 h-10 animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Profile Settings</h1>
          <p className="text-sm text-slate-500 mt-1.5 font-medium">Manage your personal information and account security.</p>
        </div>

        {/* Profile Card */}
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden transition-all hover:shadow-md">
          <form onSubmit={handleUpdateProfile}>
            {/* Top Banner / Avatar Section */}
            <div className="relative px-6 sm:px-10 pt-10 pb-8 bg-gradient-to-r from-emerald-50/50 to-teal-50/50 border-b border-slate-100 flex flex-col sm:flex-row items-center sm:items-start gap-6">

              {/* Avatar Container */}
              <div className="relative shrink-0">
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg border-4 border-white overflow-hidden ring-4 ring-emerald-50/50">
                  {currentDisplayImage ? (
                    <img src={currentDisplayImage} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl font-bold text-white">{profileInitial}</span>
                  )}
                </div>

                {/* Camera Button (Only in edit mode) */}
                {editMode && (
                  <label htmlFor="profileImage" className="absolute bottom-1 right-1 w-9 h-9 bg-emerald-500 hover:bg-emerald-600 rounded-full flex items-center justify-center text-white cursor-pointer shadow-md border-2 border-white transition-transform hover:scale-105">
                    <Camera className="w-4 h-4" />
                    <input id="profileImage" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  </label>
                )}
              </div>

              {/* User Info Overview */}
              <div className="text-center sm:text-left pt-2 sm:pt-4 flex-1">
                <h2 className="text-2xl font-bold text-slate-900">{username || "User"}</h2>
                <p className="text-sm text-slate-500 mt-1 flex items-center justify-center sm:justify-start gap-1.5 font-medium">
                  <Mail className="w-4 h-4" /> {email}
                </p>
                <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-full bg-emerald-100/50 border border-emerald-200/50">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide">Active Account</span>
                </div>
              </div>

              {/* Edit Toggle Button */}
              {!editMode && (
                <button
                  type="button"
                  onClick={() => setEditMode(true)}
                  className="sm:mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold transition-all active:scale-95 shadow-sm"
                >
                  <Pencil className="w-4 h-4" /> Edit Profile
                </button>
              )}
            </div>

            {/* Profile Form Details */}
            <div className="p-6 sm:p-10 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Username</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      disabled={!editMode || saving}
                      className="w-full h-12 pl-11 pr-4 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 font-medium outline-none transition-all focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={!editMode || saving}
                      className="w-full h-12 pl-11 pr-4 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 font-medium outline-none transition-all focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons for Edit Mode */}
              {editMode && (
                <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    disabled={saving}
                    className="h-12 px-6 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-bold hover:bg-slate-50 transition disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="h-12 px-8 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] disabled:opacity-60"
                  >
                    {saving ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                    ) : (
                      <><Save className="w-4 h-4" /> Save Changes</>
                    )}
                  </button>
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Change Password Card */}
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden transition-all hover:shadow-md">
          <div className="px-6 sm:px-10 py-6 border-b border-slate-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Change Password</h3>
              <p className="text-sm text-slate-500 font-medium mt-0.5">Ensure your account is using a long, random password to stay secure.</p>
            </div>
          </div>

          <form onSubmit={handleChangePassword} className="p-6 sm:p-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              <div className="md:col-span-2 max-w-lg">
                <label className="block text-sm font-bold text-slate-700 mb-2">Current Password</label>
                <div className="relative">
                  <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    disabled={changingPassword}
                    className="w-full h-12 pl-11 pr-12 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none transition-all focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:opacity-60"
                  />
                  <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    disabled={changingPassword}
                    className="w-full h-12 pl-11 pr-12 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none transition-all focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:opacity-60"
                  />
                  <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    disabled={changingPassword}
                    className="w-full h-12 pl-11 pr-12 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none transition-all focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:opacity-60"
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-8 pt-6 border-t border-slate-100">
              <button
                type="submit"
                disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
                className="h-12 px-8 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {changingPassword ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Updating...</>
                ) : (
                  <><ShieldCheck className="w-4 h-4" /> Update Password</>
                )}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
};

export default ProfilePage;