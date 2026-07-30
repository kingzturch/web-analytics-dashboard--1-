import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface UserSession {
  id: string;
  email: string;
  role: 'owner' | 'admin' | 'viewer';
  name?: string;
  avatar_url?: string;
}

const DEFAULT_DEMO_USER: UserSession = {
  id: 'usr_owner_01',
  email: 'admin@mycompany.io',
  name: 'Lead Analytics Engineer',
  role: 'owner',
  avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
};

export class AuthService {
  private static currentUser: UserSession | null = DEFAULT_DEMO_USER;
  private static listeners: Array<(user: UserSession | null) => void> = [];

  public static async getCurrentUser(): Promise<UserSession | null> {
    if (isSupabaseConfigured() && supabase) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        return {
          id: session.user.id,
          email: session.user.email || 'user@supabase.io',
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Analytics User',
          role: 'owner',
          avatar_url: session.user.user_metadata?.avatar_url || DEFAULT_DEMO_USER.avatar_url,
        };
      }
    }
    return this.currentUser;
  }

  public static async loginWithEmail(email: string): Promise<UserSession> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.auth.signInWithOtp({ email });
      if (error) throw error;
    }
    const user: UserSession = {
      id: `usr_${Math.random().toString(36).substring(2, 9)}`,
      email,
      name: email.split('@')[0],
      role: 'owner',
      avatar_url: DEFAULT_DEMO_USER.avatar_url,
    };
    this.currentUser = user;
    this.notifyListeners();
    return user;
  }

  public static async logout(): Promise<void> {
    if (isSupabaseConfigured() && supabase) {
      await supabase.auth.signOut();
    }
    this.currentUser = null;
    this.notifyListeners();
  }

  public static subscribe(callback: (user: UserSession | null) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  private static notifyListeners() {
    this.listeners.forEach((l) => l(this.currentUser));
  }
}
