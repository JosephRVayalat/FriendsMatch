import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fkctwsvdojskcstlqflp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZrY3R3c3Zkb2pza2NzdGxxZmxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1OTQxOTAsImV4cCI6MjA3NjE3MDE5MH0.dAzvbqqXJNGN5MGBvgQ_P0vGccHEBGPwYhEW-p5GSeA';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;