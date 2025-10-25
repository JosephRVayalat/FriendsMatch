import React, { useState, useEffect } from 'react';
import supabase from '../../Services/supabase';
import { api } from '../../Services/api';

function FriendsView({ user }) {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFriends();
  }, []);

  const loadFriends = async () => {
    try {
      setLoading(true);
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      const { data } = await api.get('/friends', token);
      console.log('Friends loaded:', data);
      setFriends(data || []);
    } catch (error) {
      console.error('Error loading friends:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFriend = async (friendId) => {
    if (!window.confirm('Are you sure you want to remove this friend?')) {
      return;
    }

    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      await api.delete(`/friends/${friendId}`, token);
      loadFriends();
      alert('Friend removed');
    } catch (error) {
      console.error('Error removing friend:', error);
      alert('Error removing friend');
    }
  };

  // Function to get profile picture URL from Supabase storage
  const getProfilePicture = (avatarUrl, username) => {
    if (avatarUrl) {
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(avatarUrl);
      
      return data.publicUrl;
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(username || 'User')}&background=random&size=200`;
  };

  if (loading) {
    return <div className="p-4">Loading friends...</div>;
  }

  if (friends.length === 0) {
    return (
      <div className="p-4">
        <h2 className="text-2xl font-bold mb-4">Your Friends</h2>
        <p className="text-gray-600">You haven't added any friends yet. Check out the Discover page to find friends!</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Your Friends ({friends.length})</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {friends.map(friend => (
          <div key={friend.id} className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
            {/* Profile Picture */}
            <div className="flex items-center mb-3">
              <img
                src={getProfilePicture(friend.avatar_url, friend.username || friend.full_name)}
                alt={friend.username || friend.full_name}
                className="w-16 h-16 rounded-full object-cover mr-3"
                onError={(e) => {
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(friend.username || 'User')}&background=random&size=200`;
                }}
              />
              <div>
                <h3 className="font-bold text-lg">{friend.username || friend.full_name}</h3>
                {friend.full_name && friend.username !== friend.full_name && (
                  <p className="text-gray-600 text-sm">{friend.full_name}</p>
                )}
              </div>
            </div>

            {friend.bio && <p className="text-sm text-gray-700 mt-2 mb-2">{friend.bio}</p>}
            
            <div className="mt-2">
              {friend.age && <span className="text-sm text-gray-600">Age: {friend.age}</span>}
              {friend.location && <span className="text-sm text-gray-600 ml-2">📍 {friend.location}</span>}
            </div>

            {/* Matching Interests */}
            {friend.matchingInterests && friend.matchingInterests.length > 0 && (
              <div className="mt-3">
                <p className="text-sm font-semibold">Shared interests:</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {friend.matchingInterests.slice(0, 3).map((interest, idx) => (
                    <span key={idx} className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                      {interest}
                    </span>
                  ))}
                  {friend.matchingInterests.length > 3 && (
                    <span className="text-xs text-gray-500">
                      +{friend.matchingInterests.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            )}

            <button
              onClick={() => removeFriend(friend.id)}
              className="mt-4 w-full py-2 px-4 rounded bg-red-500 text-white hover:bg-red-600"
            >
              Remove Friend
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default FriendsView;