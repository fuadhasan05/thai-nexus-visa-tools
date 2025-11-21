
import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { User, Mail, Plus, X, Link as LinkIcon, Facebook, Twitter, Instagram, Linkedin, Globe, Upload, Loader2 } from 'lucide-react';
import GlassCard from '@/components/GlassCard';
import { useError } from '@/components/ErrorNotification';
import { createPageUrl } from '@/utils';

const socialIcons = {
  facebook: { icon: Facebook, label: 'Facebook' },
  twitter: { icon: Twitter, label: 'Twitter' },
  instagram: { icon: Instagram, label: 'Instagram' },
  linkedin: { icon: Linkedin, label: 'LinkedIn' },
  website: { icon: Globe, label: 'Website' },
  other: { icon: LinkIcon, label: 'Other' }
};

export default function Settings() {
  const { addError, addSuccess } = useError();
  const queryClient = useQueryClient();

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['current-user-settings'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) return null;
        return data?.user ?? null;
      } catch (error) {
        return null;
      }
    },
    retry: false
  });

  const { data: profile } = useQuery({
    queryKey: ['user-profile-settings', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const { data, error } = await supabase
        .from('contributorapplications')
        .select('*')
        .eq('user_email', user.email)
        .limit(1);
      if (error) throw error;
      return data?.[0] ?? null;
    },
    enabled: !!user?.email
  });

  const [formData, setFormData] = useState({
    full_name: '',
    nickname: '',
    bio: '',
    avatar_url: '',
    profile_slug: '',
    profile_links: [],
    expertise_areas: '',
    profile_visible: true
  });

  const [uploadingImage, setUploadingImage] = useState(false);
  const [slugError, setSlugError] = useState('');
  const [checkingSlug, setCheckingSlug] = useState(false);

  React.useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        nickname: profile.nickname || '',
        bio: profile.bio || '',
        avatar_url: profile.avatar_url || '',
        profile_slug: profile.profile_slug || '',
        profile_links: profile.profile_links || [],
        expertise_areas: profile.expertise_areas?.join(', ') || '',
        profile_visible: profile.profile_visible !== false
      });
    }
  }, [profile]);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      addError('Please upload an image file');
      e.target.value = null; // Clear the input
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      addError('Image must be smaller than 5MB');
      e.target.value = null; // Clear the input
      return;
    }

    setUploadingImage(true);
    try {
      // Upload to Supabase Storage. Uses existing bucket naming convention seen elsewhere in the repo.
      const filename = `public/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
      const { error: uploadError } = await supabase.storage
        .from('base44-prod')
        .upload(filename, file, { cacheControl: '3600', upsert: false });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('base44-prod').getPublicUrl(filename);
      const publicUrl = urlData?.publicUrl ?? '';

      setFormData({ ...formData, avatar_url: publicUrl });
      addSuccess('Image uploaded successfully!');
    } catch (error) {
      addError('Failed to upload image: ' + (error.message || 'Unknown error'));
    } finally {
      setUploadingImage(false);
      e.target.value = null; // Clear the file input
    }
  };

  const validateSlug = (slug) => {
    // Reserved words that cannot be used as slugs
    const reservedWords = ['admin', 'new', 'edit', 'settings', 'profile', 'api', 'user', 'home', 'contributor', 'privacy', 'terms', 'contact', 'about', 'login', 'register', 'dashboard', 'feedback', 'help'];
    
    if (!slug) return true; // Empty is okay
    
    if (slug.length < 3) {
      return 'Slug must be at least 3 characters';
    }
    
    if (slug.length > 50) {
      return 'Slug must be less than 50 characters';
    }
    
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return 'Slug can only contain lowercase letters, numbers, and hyphens';
    }
    
    if (slug.startsWith('-') || slug.endsWith('-')) {
      return 'Slug cannot start or end with a hyphen';
    }
    
    if (reservedWords.includes(slug)) {
      return 'This slug is reserved and cannot be used';
    }
    
    return true;
  };

  const checkSlugAvailability = async (slug) => {
    if (!slug) {
      setSlugError(''); // Clear error if slug is empty
      return;
    }
    
    const validation = validateSlug(slug);
    if (validation !== true) {
      setSlugError(validation);
      return;
    }
    
    setCheckingSlug(true);
    setSlugError('');
    
    try {
      const { data: existing, error } = await supabase
        .from('contributorapplications')
        .select('id')
        .eq('profile_slug', slug)
        .limit(1);

      if (error) throw error;

      const isAvailable = !existing || existing.length === 0 || (profile && existing[0].id === profile.id);

      if (!isAvailable) {
        setSlugError('This custom URL is already taken');
      } else {
        setSlugError(''); // Clear any previous errors if it's now available
      }
    } catch (error) {
      console.error('Error checking slug:', error);
      setSlugError('Error checking slug availability.');
    } finally {
      setCheckingSlug(false);
    }
  };

  const updateProfileMutation = useMutation({
    mutationFn: async (data) => {
      // Validate slug before saving
      if (data.profile_slug) {
        const validation = validateSlug(data.profile_slug);
        if (validation !== true) {
          throw new Error(validation);
        }

        // Check availability one more time to prevent race conditions
        const { data: existing, error: existingError } = await supabase
          .from('contributorapplications')
          .select('id')
          .eq('profile_slug', data.profile_slug)
          .limit(1);
        if (existingError) throw existingError;

        const isAvailable = !existing || existing.length === 0 || (profile && existing[0].id === profile.id);
        if (!isAvailable) {
          throw new Error('This custom URL is already taken');
        }
      }

      const profileData = {
        ...data,
        user_email: user.email,
        expertise_areas: data.expertise_areas.split(',').map(s => s.trim()).filter(Boolean)
      };

      if (profile) {
        const { error } = await supabase
          .from('contributorapplications')
          .update(profileData)
          .eq('id', profile.id);
        if (error) throw error;
        return { ...profile, ...profileData };
      } else {
        const { data: inserted, error } = await supabase
          .from('contributorapplications')
          .insert(profileData)
          .select()
          .single();
        if (error) throw error;
        return inserted;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile-settings'] });
      queryClient.invalidateQueries({ queryKey: ['contributor-profile'] });
      addSuccess('Profile updated successfully!');
    },
    onError: (error) => {
      addError('Failed to update profile: ' + error.message);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (slugError || checkingSlug) {
      addError('Please resolve custom URL issues before saving.');
      return;
    }

    updateProfileMutation.mutate(formData);
  };

  const addSocialLink = () => {
    setFormData({
      ...formData,
      profile_links: [...formData.profile_links, { type: 'other', label: '', url: '', icon: '🔗' }]
    });
  };

  const removeSocialLink = (index) => {
    setFormData({
      ...formData,
      profile_links: formData.profile_links.filter((_, i) => i !== index)
    });
  };

  const updateSocialLink = (index, field, value) => {
    const newLinks = [...formData.profile_links];
    newLinks[index] = { ...newLinks[index], [field]: value };
    
    // Auto-set icon based on type
    if (field === 'type' && socialIcons[value]) {
      newLinks[index].icon = socialIcons[value].icon.name;
    }
    
    setFormData({ ...formData, profile_links: newLinks });
  };

  if (userLoading) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <GlassCard className="p-12 text-center">
          <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Login Required</h1>
          <Button onClick={() => supabase.auth.signInWithOAuth({ provider: 'google' })} className="bg-blue-600 hover:bg-blue-700">
            Login
          </Button>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <GlassCard className="p-8 bg-white border border-[#E7E7E7]" hover={false}>
        <h1 className="text-3xl font-bold text-[#272262] mb-2">Profile Settings</h1>
        <p className="text-[#454545]">Manage your profile and public information</p>
      </GlassCard>

      <form onSubmit={handleSubmit}>
        <GlassCard className="p-8 bg-white border border-[#E7E7E7]">
          <div className="space-y-6">
            <div>
              <Label className="text-[#272262] font-medium">Email Address</Label>
              <Input value={user.email} disabled className="bg-[#F8F9FA] border-[#E7E7E7]" />
              <p className="text-xs text-[#454545] mt-1">Email cannot be changed</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-[#272262] font-medium">Full Name</Label>
                <Input
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Your full name"
                  className="border-[#E7E7E7]"
                />
              </div>

              <div>
                <Label className="text-[#272262] font-medium">Nickname (Optional)</Label>
                <Input
                  value={formData.nickname}
                  onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                  placeholder="Display name"
                  className="border-[#E7E7E7]"
                />
              </div>
            </div>

            {/* Custom URL Slug */}
            <div>
              <Label className="text-[#272262] font-medium">Custom Profile URL</Label>
              <div className="flex items-start gap-2 mt-2">
                <div className="flex-1">
                  <div className="flex items-center">
                    <span className="px-3 py-2 bg-[#F8F9FA] border border-r-0 border-[#E7E7E7] rounded-l-lg text-sm text-[#454545]">
                      visa.thainexus.co.th/contributor/
                    </span>
                    <Input
                      value={formData.profile_slug}
                      onChange={(e) => {
                        const slug = e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9-]/g, '')
                          .replace(/--+/g, '-');
                        setFormData({ ...formData, profile_slug: slug });
                        setSlugError('');
                      }}
                      onBlur={(e) => checkSlugAvailability(e.target.value)}
                      placeholder="your-custom-url"
                      className="rounded-l-none border-[#E7E7E7]"
                    />
                  </div>
                  {slugError && (
                    <p className="text-xs text-[#BF1E2E] mt-1">{slugError}</p>
                  )}
                  {checkingSlug && (
                    <p className="text-xs text-[#454545] mt-1">Checking availability...</p>
                  )}
                  {!slugError && !checkingSlug && formData.profile_slug && (
                    <p className="text-xs text-green-600 mt-1">This URL is available</p>
                  )}
                  <p className="text-xs text-[#454545] mt-1">
                    Your custom profile URL. Use lowercase letters, numbers, and hyphens only. Leave empty to use your profile ID.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <Label className="text-[#272262] font-medium">Bio</Label>
              <Textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Tell others about yourself..."
                rows={4}
                className="border-[#E7E7E7]"
              />
            </div>

            <div>
              <Label className="text-[#272262] font-medium">Profile Photo</Label>
              <div className="flex items-start gap-4 mt-2">
                {formData.avatar_url && (
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-[#F8F9FA] border-2 border-[#E7E7E7] flex-shrink-0">
                    <img 
                      src={formData.avatar_url} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        if (e.target.parentElement) {
                           e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center text-gray-400 text-xs">No Image</div>';
                        }
                      }}
                    />
                  </div>
                )}
                
                <div className="flex-1">
                  <div className="space-y-2">
                    <div>
                      <input
                        type="file"
                        id="avatar-upload"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={uploadingImage}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('avatar-upload').click()}
                        disabled={uploadingImage}
                        size="sm"
                        className="border-[#E7E7E7] hover:bg-[#F8F9FA]"
                      >
                        {uploadingImage ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-2" />
                            Upload Photo
                          </>
                        )}
                      </Button>
                      <p className="text-xs text-[#454545] mt-1">Maximum 5MB • JPG, PNG, or GIF</p>
                    </div>
                    
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-xs text-[#454545]">
                        or URL:
                      </div>
                      <Input
                        value={formData.avatar_url}
                        onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                        placeholder="https://..."
                        className="pl-16 border-[#E7E7E7]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <Label className="text-[#272262] font-medium">Expertise Areas (comma-separated)</Label>
              <Input
                value={formData.expertise_areas}
                onChange={(e) => setFormData({ ...formData, expertise_areas: e.target.value })}
                placeholder="Retirement Visa, DTV, 90-Day Report"
                className="border-[#E7E7E7]"
              />
            </div>

            {/* Social Links */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-[#272262] font-medium">Social Media Links</Label>
                <Button type="button" onClick={addSocialLink} variant="outline" size="sm" className="border-[#E7E7E7]">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Link
                </Button>
              </div>
              
              {formData.profile_links.length === 0 ? (
                <p className="text-sm text-[#454545]">No social links added yet</p>
              ) : (
                <div className="space-y-3">
                  {formData.profile_links.map((link, index) => (
                    <div key={index} className="flex gap-2 items-start p-3 border border-[#E7E7E7] rounded-lg">
                      <select
                        value={link.type || 'other'}
                        onChange={(e) => updateSocialLink(index, 'type', e.target.value)}
                        className="w-32 p-2 border border-[#E7E7E7] rounded text-sm"
                      >
                        {Object.entries(socialIcons).map(([key, { label }]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
                      
                      <Input
                        value={link.label}
                        onChange={(e) => updateSocialLink(index, 'label', e.target.value)}
                        placeholder="Label"
                        className="flex-1 border-[#E7E7E7]"
                      />
                      
                      <Input
                        value={link.url}
                        onChange={(e) => updateSocialLink(index, 'url', e.target.value)}
                        placeholder="https://..."
                        className="flex-1 border-[#E7E7E7]"
                      />
                      
                      <Button
                        type="button"
                        onClick={() => removeSocialLink(index)}
                        variant="outline"
                        size="sm"
                        className="text-[#BF1E2E] border-[#E7E7E7]"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="profile_visible"
                checked={formData.profile_visible}
                onChange={(e) => setFormData({ ...formData, profile_visible: e.target.checked })}
                className="w-4 h-4"
              />
              <Label htmlFor="profile_visible" className="text-[#272262] cursor-pointer">
                Make my profile visible to others
              </Label>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={updateProfileMutation.isPending || uploadingImage || !!slugError || checkingSlug}
                className="bg-[#272262] hover:bg-[#3d3680] text-white"
              >
                {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => window.location.href = createPageUrl('Profile')}
                disabled={uploadingImage}
                className="border-[#E7E7E7] hover:bg-[#F8F9FA]"
              >
                Cancel
              </Button>
            </div>
          </div>
        </GlassCard>
      </form>
    </div>
  );
}
