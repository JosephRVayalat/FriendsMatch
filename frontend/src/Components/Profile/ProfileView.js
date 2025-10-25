import React, { useState, useEffect, useCallback } from 'react';
import supabase from '../../Services/supabase';
import { api } from '../../Services/api';

function ProfileView({ user }) {
  const [interests, setInterests] = useState([]);
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    bio: '',
    age: '',
    location: ''
  });

  const loadInterests = async () => {
    try {
      const { data } = await api.get('/interests');
      setInterests(data);
    } catch (error) {
      console.error('Error loading interests:', error);
    }
  };

  const loadProfile = useCallback(async () => {
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      const { data } = await api.get(`/profile/${user.id}`, token);
      
      setFormData({
        username: data.username || '',
        full_name: data.full_name || '',
        bio: data.bio || '',
        age: data.age || '',
        location: data.location || ''
      });
      
      setAvatarUrl(data.avatar_url || '');
      setSelectedInterests(data.interests?.map(i => i.id) || []);
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  }, [user.id]);

  useEffect(() => {
    loadInterests();
    loadProfile();
  }, [loadProfile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      await api.put('/profile', { 
        ...formData, 
        interests: selectedInterests,
        avatar_url: avatarUrl 
      }, token);
      alert('Profile updated successfully!');
    } catch (error) {
      alert('Error updating profile');
    }
  };

  const toggleInterest = (id) => {
    setSelectedInterests(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const uploadAvatar = async (event) => {
  try {
    setUploading(true);

    const file = event.target.files[0];
    if (!file) return;

    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    console.log('Uploading file to Avatars bucket:', filePath);

    // Upload image to Supabase Storage - FIXED BUCKET NAME
    const { error: uploadError } = await supabase.storage
      .from('Avatars')  // ← CHANGE THIS LINE (capital A)
      .upload(filePath, file);

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw uploadError;
    }

    // Get public URL - FIXED BUCKET NAME
    const { data: urlData } = supabase.storage
      .from('Avatars')  // ← CHANGE THIS LINE (capital A)
      .getPublicUrl(filePath);

    console.log('Upload successful, URL:', urlData.publicUrl);
    setAvatarUrl(urlData.publicUrl);
    alert('Avatar uploaded successfully!');
    
  } catch (error) {
    console.error('Upload failed:', error);
    if (error.message.includes('Bucket not found')) {
      alert('Storage bucket not found. Make sure the bucket name matches exactly (case-sensitive).');
    } else {
      alert('Error uploading avatar: ' + error.message);
    }
  } finally {
    setUploading(false);
  }
};

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <h2>Your Profile</h2>
      
      {/* Avatar Upload */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
          Profile Picture
        </label>
        {avatarUrl && (
          <div>
            <img 
              src={avatarUrl} 
              alt="Avatar" 
              style={{ 
                width: '150px', 
                height: '150px', 
                borderRadius: '50%', 
                marginBottom: '10px',
                objectFit: 'cover',
                border: '2px solid #ddd'
              }}
            />
          </div>
        )}
        <div>
          <input
            type="file"
            accept="image/*"
            onChange={uploadAvatar}
            disabled={uploading}
            style={{ marginBottom: '10px' }}
          />
          {uploading && <p>Uploading...</p>}
        </div>
        <p style={{ fontSize: '12px', color: '#666' }}>
          Supported formats: JPG, PNG, GIF • Max size: 5MB
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Username *</label>
          <input
            type="text"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            required
            style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
            placeholder="Enter your username"
          />
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Full Name</label>
          <input
            type="text"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
            placeholder="Enter your full name"
          />
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Bio</label>
          <textarea
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            rows="4"
            placeholder="Tell others about yourself, your hobbies, interests..."
            style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', resize: 'vertical' }}
          />
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Age</label>
            <input
              type="number"
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              min="13"
              max="100"
              style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
              placeholder="Your age"
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
              placeholder="Your city or country"
            />
          </div>
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>Interests</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {interests.map(interest => (
              <button
                key={interest.id}
                type="button"
                onClick={() => toggleInterest(interest.id)}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  backgroundColor: selectedInterests.includes(interest.id) ? '#007bff' : '#e9ecef',
                  color: selectedInterests.includes(interest.id) ? 'white' : 'black',
                  fontSize: '14px',
                  transition: 'all 0.2s'
                }}
              >
                {interest.name}
              </button>
            ))}
          </div>
        </div>
        
        <button 
          type="submit"
          style={{
            padding: '12px 24px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            marginTop: '20px'
          }}
        >
          Save Profile
        </button>
      </form>
    </div>
  );
}

export default ProfileView;