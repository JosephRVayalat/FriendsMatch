import React, { useState } from 'react';
import supabase from '../../Services/supabase';

function AuthScreen({ onSignIn }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        // Simple sign up - no email verification
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { username }
          }
        });

        if (error) {
          alert(`Sign up failed: ${error.message}`);
        } else {
          alert('Account created successfully! Signing you in...');
          
          // Immediately sign in after sign up
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password
          });

          if (signInError) {
            alert('Account created! Please sign in manually.');
            setIsSignUp(false);
            setPassword('');
          } else {
            onSignIn();
          }
        }
      } else {
        // Simple sign in - just email and password
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) {
          alert(`Sign in failed: ${error.message}`);
        } else {
          onSignIn();
        }
      }
    } catch (error) {
      alert('Something went wrong. Please try again.');
      console.error('Auth error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div>
        <div>
          <h1>FriendMatch</h1>
          <p>Connect with people who share your interests</p>
        </div>

        <form onSubmit={handleSubmit}>
          {isSignUp && (
            <div>
              <label>Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={loading}
                placeholder="Choose a username"
              />
            </div>
          )}
          <div>
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              placeholder="your@email.com"
            />
          </div>
          <div>
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              placeholder="At least 6 characters"
              minLength="6"
            />
          </div>
          <button type="submit" disabled={loading}>
            {loading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Sign In')}
          </button>
        </form>

        <div>
          <button 
            onClick={() => {
              setIsSignUp(!isSignUp);
              if (isSignUp) {
                setUsername('');
              }
            }}
            disabled={loading}
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AuthScreen;