import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";

// Minimal user type
interface SimpleUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

export function AdminUsers() {
  const [users, setUsers] = useState<SimpleUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        
        // Get users from auth
        const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
        
        if (authError) throw new Error('Failed to load users');
        if (!authData?.users?.length) throw new Error('No users found');
        
        // Transform to minimal user data
        const userList = authData.users.map(user => ({
          id: String(user.id || ''),
          email: String(user.email || ''),
          full_name: String(
            user.user_metadata?.full_name || 
            user.user_metadata?.name || 
            user.email?.split('@')[0] || 
            'User'
          ).substring(0, 50),
          role: String(user.user_metadata?.role || 'customer').toLowerCase()
        }));
        
        setUsers(userList);
      } catch (err) {
        console.error('Error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load users');
      } finally {
        setLoading(false);
      }
    };
    
    loadUsers();
  }, []);

  if (loading) return <div>Loading users...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;
  if (!users.length) return <div>No users found</div>;

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Users</h2>
      <div className="space-y-2">
        {users.map(user => (
          <div key={user.id} className="border p-4 rounded">
            <div className="font-medium">{user.full_name}</div>
            <div className="text-sm text-gray-600">{user.email}</div>
            <div className="text-sm">Role: {user.role}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
