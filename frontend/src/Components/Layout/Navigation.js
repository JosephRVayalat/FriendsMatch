import React from 'react';
import { Users, Settings, LogOut, Search, UserPlus } from 'lucide-react';

function Navigation({ currentView, setCurrentView, handleSignOut }) {
  return (
    <nav style={{ padding: '20px', borderBottom: '1px solid #ccc', marginBottom: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0 }}>FriendMatch</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => setCurrentView('discover')}
            style={{ 
              padding: '10px', 
              backgroundColor: currentView === 'discover' ? '#007bff' : 'transparent',
              color: currentView === 'discover' ? 'white' : 'black',
              border: '1px solid #ccc',
              cursor: 'pointer'
            }}
          >
            <Search size={20} />
            Discover
          </button>
          <button 
            onClick={() => setCurrentView('requests')}
            style={{ 
              padding: '10px', 
              backgroundColor: currentView === 'requests' ? '#007bff' : 'transparent',
              color: currentView === 'requests' ? 'white' : 'black',
              border: '1px solid #ccc',
              cursor: 'pointer'
            }}
          >
            <UserPlus size={20} />
            Requests
          </button>
          <button 
            onClick={() => setCurrentView('friends')}
            style={{ 
              padding: '10px', 
              backgroundColor: currentView === 'friends' ? '#007bff' : 'transparent',
              color: currentView === 'friends' ? 'white' : 'black',
              border: '1px solid #ccc',
              cursor: 'pointer'
            }}
          >
            <Users size={20} />
            Friends
          </button>
          <button 
            onClick={() => setCurrentView('profile')}
            style={{ 
              padding: '10px', 
              backgroundColor: currentView === 'profile' ? '#007bff' : 'transparent',
              color: currentView === 'profile' ? 'white' : 'black',
              border: '1px solid #ccc',
              cursor: 'pointer'
            }}
          >
            <Settings size={20} />
            Profile
          </button>
          <button 
            onClick={handleSignOut}
            style={{ 
              padding: '10px', 
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <LogOut size={20} />
            Sign Out
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navigation;