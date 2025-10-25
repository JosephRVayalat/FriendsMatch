import React, { useState, useEffect } from 'react';
import supabase from '../../Services/supabase';
import { api } from '../../Services/api';

function DiscoverView({ user }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sentRequests, setSentRequests] = useState(new Set());

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    try {
      setLoading(true);
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      const { data } = await api.get('/discover', token);
      console.log('Matches loaded:', data);
      setMatches(data || []);
    } catch (error) {
      console.error('Error loading matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendRequest = async (receiverId) => {
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      
      console.log('Sending friend request to:', receiverId);
      const response = await api.post('/friend-request', { receiver_id: receiverId }, token);
      console.log('Friend request response:', response);
      
      setSentRequests(prev => new Set([...prev, receiverId]));
      alert('Friend request sent!');
    } catch (error) {
      console.error('Error sending friend request:', error);
      console.error('Error details:', error.response?.data);
      alert(error.response?.data?.error || 'Error sending request');
    }
  };

  // Function to get profile picture URL from Supabase storage
  const getProfilePicture = (avatarUrl, username) => {
    if (avatarUrl) {
      // Get public URL from Supabase storage bucket
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(avatarUrl);
      
      return data.publicUrl;
    }
    // Default avatar using username
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(username || 'User')}&background=random&size=200`;
  };

  if (loading) {
    return <div className="p-4">Loading matches...</div>;
  }

  if (matches.length === 0) {
    return (
      <div className="p-4">
        <h2 className="text-2xl font-bold mb-4">Discover Friends</h2>
        <p className="text-gray-600">
          No matches found. Make sure you have selected interests in your profile!
        </p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Discover Friends</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {matches.map(match => (
          <div key={match.id} className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
            {/* Profile Picture */}
            <div className="flex items-center mb-3">
              <img
                src={getProfilePicture(match.avatar_url, match.username || match.full_name)}
                alt={match.username || match.full_name}
                className="w-16 h-16 rounded-full object-cover mr-3"
                onError={(e) => {
                  // Fallback if image fails to load
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(match.username || 'User')}&background=random&size=200`;
                }}
              />
              <div>
                <h3 className="font-bold text-lg">{match.username || match.full_name}</h3>
                {match.full_name && match.username !== match.full_name && (
                  <p className="text-gray-600 text-sm">{match.full_name}</p>
                )}
              </div>
            </div>

            {match.bio && <p className="text-sm text-gray-700 mt-2 mb-2">{match.bio}</p>}
            
            <div className="mt-2">
              {match.age && <span className="text-sm text-gray-600">Age: {match.age}</span>}
              {match.location && <span className="text-sm text-gray-600 ml-2">📍 {match.location}</span>}
            </div>

            <div className="mt-3">
              <p className="text-sm font-semibold">
                {match.matchCount} matching interest{match.matchCount !== 1 ? 's' : ''}:
              </p>
              <div className="flex flex-wrap gap-1 mt-1">
                {match.matchingInterests?.slice(0, 3).map((interest, idx) => (
                  <span key={idx} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                    {interest}
                  </span>
                ))}
                {match.matchingInterests?.length > 3 && (
                  <span className="text-xs text-gray-500">
                    +{match.matchingInterests.length - 3} more
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={() => sendRequest(match.id)}
              disabled={sentRequests.has(match.id)}
              className={`mt-4 w-full py-2 px-4 rounded ${
                sentRequests.has(match.id)
                  ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              {sentRequests.has(match.id) ? 'Request Sent' : 'Send Friend Request'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default DiscoverView;