import React, { useState, useEffect } from 'react';
import supabase from './Services/supabase';
import AuthScreen from './Components/Auth/AuthScreen';
import Navigation from './Components/Layout/Navigation';
import ProfileView from './Components/Profile/ProfileView';
import DiscoverView from './Components/Friends/DiscoverView';
import RequestView from './Components/Friends/RequestView';
import FriendsView from './Components/Friends/FriendsView';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('discover');

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user || null);
    setLoading(false);
  };

  const handleSignIn = async () => {
    await checkUser();
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  if (loading) return <div>Loading...</div>;
  if (!user) return <AuthScreen onSignIn={handleSignIn} />;

  return (
    <div>
      <Navigation 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
        handleSignOut={handleSignOut} 
      />
      <main>
        {currentView === 'discover' && <DiscoverView user={user} />}
        {currentView === 'requests' && <RequestView user={user} />}
        {currentView === 'friends' && <FriendsView user={user} />}
        {currentView === 'profile' && <ProfileView user={user} />}
      </main>
    </div>
  );
}

export default App;