require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3001;

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

app.use(cors());
app.use(express.json());

// Debug middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Middleware to verify auth token
const authenticateUser = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    console.log('Auth token received:', token ? 'yes' : 'no');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      console.log('Auth error:', error);
      return res.status(401).json({ error: 'Invalid token' });
    }

    console.log('Authenticated user:', user.id);
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

// Get all interests
app.get('/api/interests', async (req, res) => {
  try {
    console.log('Fetching interests...');
    const { data, error } = await supabase
      .from('interests')
      .select('*')
      .order('category', { ascending: true });

    if (error) {
      console.error('Interests error:', error);
      return res.status(400).json({ error: error.message });
    }
    
    console.log('Interests found:', data.length);
    res.json(data);
  } catch (error) {
    console.error('Interests endpoint error:', error);
    res.status(500).json({ error: 'Failed to load interests' });
  }
});

// Get user profile - FIXED VERSION
app.get('/api/profile/:userId', authenticateUser, async (req, res) => {
  const { userId } = req.params;
  
  console.log('Loading profile for user:', userId);
  
  try {
    // Create authenticated Supabase client with user's token
    const token = req.headers.authorization?.split('Bearer ')[1];
    const userSupabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    );

    // First, check if profile exists
    let { data: profile, error: profileError } = await userSupabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    console.log('Profile query result:', profile, 'Error:', profileError);

    // If profile doesn't exist, create a basic one
    if (profileError && profileError.code === 'PGRST116') {
      console.log('Profile not found, creating new one...');
      
      const { data: newProfile, error: createError } = await userSupabase
        .from('profiles')
        .insert([
          { 
            id: userId, 
            username: req.user.user_metadata?.username || `user_${userId.slice(0, 8)}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (createError) {
        console.error('Error creating profile:', createError);
        return res.status(400).json({ error: `Failed to create profile: ${createError.message}` });
      }
      
      profile = newProfile;
      console.log('New profile created:', profile);
    } else if (profileError) {
      console.error('Error loading profile:', profileError);
      return res.status(400).json({ error: `Failed to load profile: ${profileError.message}` });
    }

    // Get user interests (using authenticated client)
    const { data: interests, error: interestsError } = await userSupabase
      .from('user_interests')
      .select('interest_id, interests(name)')
      .eq('user_id', userId);

    if (interestsError) {
      console.error('Error loading interests:', interestsError);
    }

    const response = {
      ...profile,
      interests: interests ? interests.map(i => ({ 
        id: i.interest_id, 
        name: i.interests?.name 
      })) : []
    };

    console.log('Sending profile response:', response);
    res.json(response);

  } catch (error) {
    console.error('Unexpected error in profile endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user profile - FIXED VERSION
app.put('/api/profile', authenticateUser, async (req, res) => {
  console.log('Updating profile for user:', req.user.id);
  console.log('Update data:', req.body);
  
  const { username, full_name, bio, age, location, interests, avatar_url } = req.body;

  try {
    // Create authenticated Supabase client with user's token
    const token = req.headers.authorization?.split('Bearer ')[1];
    const userSupabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    );

    // Update profile
    const { data: profile, error: profileError } = await userSupabase
      .from('profiles')
      .upsert({
        id: req.user.id,
        username: username || '',
        full_name: full_name || '',
        bio: bio || '',
        age: age ? parseInt(age) : null,
        location: location || '',
        avatar_url: avatar_url || '',
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (profileError) {
      console.error('Profile update error:', profileError);
      return res.status(400).json({ error: profileError.message });
    }

    console.log('Profile updated successfully:', profile);

    // Update interests if provided
    if (interests && Array.isArray(interests)) {
      console.log('Updating interests:', interests);
      
      // Delete existing interests
      const { error: deleteError } = await userSupabase
        .from('user_interests')
        .delete()
        .eq('user_id', req.user.id);

      if (deleteError) {
        console.error('Error deleting interests:', deleteError);
      }

      // Insert new interests if any are selected
      if (interests.length > 0) {
        const interestRecords = interests.map(interestId => ({
          user_id: req.user.id,
          interest_id: interestId
        }));

        const { error: interestsError } = await userSupabase
          .from('user_interests')
          .insert(interestRecords);

        if (interestsError) {
          console.error('Interests update error:', interestsError);
        } else {
          console.log('Interests updated successfully');
        }
      }
    }

    res.json(profile);

  } catch (error) {
    console.error('Unexpected error in profile update:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Find potential friends (matching interests)
app.get('/api/discover', authenticateUser, async (req, res) => {
  // Get current user's interests
  const { data: myInterests } = await supabase
    .from('user_interests')
    .select('interest_id')
    .eq('user_id', req.user.id);

  if (!myInterests || myInterests.length === 0) {
    return res.json([]);
  }

  const interestIds = myInterests.map(i => i.interest_id);

  // Find users with matching interests
  const { data: matches, error } = await supabase
    .from('user_interests')
    .select('user_id, profiles(id, username, full_name, bio, age, location), interests(name)')
    .in('interest_id', interestIds)
    .neq('user_id', req.user.id);

  if (error) return res.status(400).json({ error: error.message });

  // Group by user and count matching interests
  const userMatches = {};
  matches.forEach(match => {
    const userId = match.user_id;
    if (!userMatches[userId]) {
      userMatches[userId] = {
        ...match.profiles,
        matchingInterests: [],
        matchCount: 0
      };
    }
    userMatches[userId].matchingInterests.push(match.interests.name);
    userMatches[userId].matchCount++;
  });

  // Convert to array and sort by match count
  const result = Object.values(userMatches)
    .sort((a, b) => b.matchCount - a.matchCount)
    .slice(0, 20);

  res.json(result);
});

// Send friend request
app.post('/api/friend-request', authenticateUser, async (req, res) => {
  const { receiver_id } = req.body;

  try {
    // Create authenticated Supabase client with user's token
    const token = req.headers.authorization?.split('Bearer ')[1];
    const userSupabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    );

    const { data, error } = await userSupabase
      .from('friend_requests')
      .insert({
        sender_id: req.user.id,
        receiver_id,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      console.error('Friend request error:', error);
      return res.status(400).json({ error: error.message });
    }
    
    res.json(data);
  } catch (error) {
    console.error('Unexpected error sending friend request:', error);
    res.status(500).json({ error: 'Failed to send friend request' });
  }
});

// Get friend requests
app.get('/api/friend-requests', authenticateUser, async (req, res) => {
  try {
    // Create authenticated Supabase client with user's token
    const token = req.headers.authorization?.split('Bearer ')[1];
    const userSupabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    );

    const { data, error } = await userSupabase
      .from('friend_requests')
      .select('*, profiles!friend_requests_sender_id_fkey(id, username, full_name, bio, location, avatar_url)')
      .eq('receiver_id', req.user.id)
      .eq('status', 'pending');

    if (error) {
      console.error('Friend requests error:', error);
      return res.status(400).json({ error: error.message });
    }

    // Format the response to match frontend expectations
    const formattedData = data.map(request => ({
      id: request.id,
      sender_id: request.sender_id,
      sender_username: request.profiles?.username,
      sender_full_name: request.profiles?.full_name,
      sender_bio: request.profiles?.bio,
      sender_avatar_url: request.profiles?.avatar_url,
      status: request.status,
      created_at: request.created_at
    }));

    console.log('Friend requests:', formattedData);
    res.json(formattedData);
  } catch (error) {
    console.error('Unexpected error loading friend requests:', error);
    res.status(500).json({ error: 'Failed to load friend requests' });
  }
});

// Accept/reject friend request
app.post('/api/friend-request/respond', authenticateUser, async (req, res) => {
  const { request_id, accept } = req.body;

  try {
    // Create authenticated Supabase client with user's token
    const token = req.headers.authorization?.split('Bearer ')[1];
    const userSupabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    );

    const status = accept ? 'accepted' : 'rejected';

    // Update request status
    const { data: request, error } = await userSupabase
      .from('friend_requests')
      .update({ status })
      .eq('id', request_id)
      .eq('receiver_id', req.user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating friend request:', error);
      return res.status(400).json({ error: error.message });
    }

    // If accepted, create friendship
    if (status === 'accepted') {
      const [user1, user2] = [request.sender_id, request.receiver_id].sort();
      
      const { error: friendshipError } = await userSupabase
        .from('friendships')
        .insert({
          user1_id: user1,
          user2_id: user2
        });

      if (friendshipError) {
        console.error('Error creating friendship:', friendshipError);
        return res.status(400).json({ error: friendshipError.message });
      }
    }

    console.log('Friend request responded successfully');
    res.json(request);
  } catch (error) {
    console.error('Unexpected error responding to friend request:', error);
    res.status(500).json({ error: 'Failed to respond to friend request' });
  }
});

// Get friends list
app.get('/api/friends', authenticateUser, async (req, res) => {
  try {
    // Create authenticated Supabase client with user's token
    const token = req.headers.authorization?.split('Bearer ')[1];
    const userSupabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    );

    const { data: friendships, error } = await userSupabase
      .from('friendships')
      .select('*')
      .or(`user1_id.eq.${req.user.id},user2_id.eq.${req.user.id}`);

    if (error) {
      console.error('Friendships error:', error);
      return res.status(400).json({ error: error.message });
    }

    if (!friendships || friendships.length === 0) {
      return res.json([]);
    }

    // Get friend profiles
    const friendIds = friendships.map(f => 
      f.user1_id === req.user.id ? f.user2_id : f.user1_id
    );

    const { data: friends, error: friendsError } = await userSupabase
      .from('profiles')
      .select('*')
      .in('id', friendIds);

    if (friendsError) {
      console.error('Friends profiles error:', friendsError);
      return res.status(400).json({ error: friendsError.message });
    }
    
    // Add matching interests for each friend
    const friendsWithInterests = await Promise.all(
      friends.map(async (friend) => {
        const { data: interests } = await userSupabase
          .from('user_interests')
          .select('interests(name)')
          .eq('user_id', friend.id);

        return {
          ...friend,
          matchingInterests: interests ? interests.map(i => i.interests.name) : []
        };
      })
    );

    console.log('Friends with interests:', friendsWithInterests);
    res.json(friendsWithInterests);
  } catch (error) {
    console.error('Unexpected error loading friends:', error);
    res.status(500).json({ error: 'Failed to load friends' });
  }
});

// Remove friend
app.delete('/api/friends/:friendId', authenticateUser, async (req, res) => {
  const { friendId } = req.params;

  try {
    // Create authenticated Supabase client with user's token
    const token = req.headers.authorization?.split('Bearer ')[1];
    const userSupabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    );

    const { error } = await userSupabase
      .from('friendships')
      .delete()
      .or(`and(user1_id.eq.${req.user.id},user2_id.eq.${friendId}),and(user1_id.eq.${friendId},user2_id.eq.${req.user.id})`);

    if (error) {
      console.error('Remove friend error:', error);
      return res.status(400).json({ error: error.message });
    }

    console.log('Friend removed successfully');
    res.json({ message: 'Friend removed successfully' });
  } catch (error) {
    console.error('Unexpected error removing friend:', error);
    res.status(500).json({ error: 'Failed to remove friend' });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ message: 'FriendMatch API is running!' });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});