import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// User type based on your database schema
// Define the base profile type from the database
interface Profile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  created_at: string;
}

// Extend the base profile with our additional fields
interface User extends Profile {
  phone?: string | null;
}

// Test data as fallback
const testUsers: User[] = [
  { 
    id: '1', 
    email: 'test1@example.com', 
    first_name: 'Test',
    last_name: 'User 1',
    phone: '+1234567890',
    created_at: new Date().toISOString()
  },
  { 
    id: '2', 
    email: 'test2@example.com',
    first_name: 'Test',
    last_name: 'User 2',
    phone: '+1987654321',
    created_at: new Date().toISOString()
  },
];

// Simple test component with Supabase integration
export function TestUsers() {
  const [users, setUsers] = useState<User[]>(testUsers);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        
        // Get profiles data from the public schema
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, email, first_name, last_name, created_at')
          .order('created_at', { ascending: false });

        if (profilesError) throw profilesError;

        // If no profiles found, use test data
        if (!profiles || profiles.length === 0) {
          setUsers(testUsers);
          return;
        }

        // Process profiles to include phone numbers if available
        const processProfiles = async () => {
          try {
            const processedProfiles = [...profiles] as User[];
            
            // Get current user's phone if available
            if (user) {
              try {
                const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
                
                if (userError) throw userError;
                
                const currentUserPhone = currentUser?.phone || null;
                
                if (currentUserPhone) {
                  const currentUserIndex = processedProfiles.findIndex(p => p.id === user.id);
                  if (currentUserIndex !== -1) {
                    processedProfiles[currentUserIndex] = {
                      ...processedProfiles[currentUserIndex],
                      phone: currentUserPhone
                    };
                  }
                }
              } catch (err) {
                console.error('Error fetching current user phone:', err);
                // Continue with profiles even if phone fetch fails
              }
            }
            
            return processedProfiles;
          } catch (err) {
            console.error('Error processing profiles:', err);
            throw err;
          }
        };
        
        const processedUsers = await processProfiles();
        setUsers(processedUsers);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Failed to load users. Using test data.');
        // Fallback to test data on error
        setUsers(testUsers);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [user]);

  if (loading) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">Loading Users...</h2>
        <div className="animate-pulse space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Users</h2>
        <div className="text-sm text-gray-500">
          {users.length} user{users.length !== 1 ? 's' : ''} found
        </div>
      </div>
      
      {error && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
          <div className="flex">
            <div className="text-yellow-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="space-y-2">
        {users.map(user => (
          <div key={user.id} className="border p-4 rounded hover:bg-gray-50 transition-colors">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">
                      {user.first_name || user.last_name 
                        ? `${user.first_name || ''} ${user.last_name || ''}`.trim() 
                        : 'Unnamed User'}
                    </div>
                    <div className="text-sm text-gray-600">{user.email}</div>
                  </div>
                  {user.phone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      {user.phone}
                    </div>
                  )}
                </div>
                <div className="mt-2 flex justify-between items-center">
                  {user.created_at && (
                    <div className="text-xs text-gray-500">
                      <span className="font-medium">Joined:</span> {new Date(user.created_at).toLocaleDateString()}
                    </div>
                  )}
                  {!user.phone && (
                    <span className="text-xs text-gray-400">No phone number</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TestUsers;
