import React, { useState, useEffect } from 'react';
import { api } from '../../Services/api';
import supabase from '../../Services/supabase';

function RequestView({ user }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      const { data } = await api.get('/friend-requests', token);
      console.log('Requests loaded:', data);
      setRequests(data || []);
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const respondToRequest = async (requestId, accept) => {
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      await api.post('/friend-request/respond', { request_id: requestId, accept }, token);
      loadRequests();
      alert(`Request ${accept ? 'accepted' : 'declined'}!`);
    } catch (error) {
      console.error('Error responding to request:', error);
      alert('Error responding to request');
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
    return <div className="p-4">Loading friend requests...</div>;
  }

  if (requests.length === 0) {
    return (
      <div className="p-4">
        <h2 className="text-2xl font-bold mb-4">Friend Requests</h2>
        <p className="text-gray-600">No pending friend requests.</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Friend Requests</h2>
      <div className="space-y-4">
        {requests.map(request => (
          <div key={request.id} className="border rounded-lg p-4 shadow-sm flex items-center justify-between">
            <div className="flex items-center">
              <img
                src={getProfilePicture(request.sender_avatar_url, request.sender_username)}
                alt={request.sender_username}
                className="w-12 h-12 rounded-full object-cover mr-3"
                onError={(e) => {
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(request.sender_username || 'User')}&background=random&size=200`;
                }}
              />
              <div>
                <p className="font-semibold">{request.sender_username}</p>
                {request.sender_full_name && (
                  <p className="text-sm text-gray-600">{request.sender_full_name}</p>
                )}
                {request.sender_bio && (
                  <p className="text-sm text-gray-500 mt-1">{request.sender_bio}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(request.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => respondToRequest(request.id, true)}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                Accept
              </button>
              <button
                onClick={() => respondToRequest(request.id, false)}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                Decline
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default RequestView;