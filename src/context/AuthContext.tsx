import React, { createContext, useContext, useState, useCallback } from 'react';
import { User, UserRole, AuthState, LoginCredentials, ROLE_ROUTES } from '@/types/auth';
import { useNavigate } from 'react-router-dom';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  switchRole: (role: UserRole) => void; // Demo feature
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo users for each role
const DEMO_USERS: Record<UserRole, User> = {
  student: {
    id: 'STU001',
    email: 'student@demo.edu',
    name: 'Alex Johnson',
    role: 'student',
    institutionId: 'INST001',
    departmentId: 'DEPT001',
  },
  faculty: {
    id: 'FAC001',
    email: 'faculty@demo.edu',
    name: 'Dr. Sarah Williams',
    role: 'faculty',
    institutionId: 'INST001',
    departmentId: 'DEPT001',
  },
  institution: {
    id: 'INST001',
    email: 'admin@institution.edu',
    name: 'Prof. Michael Chen',
    role: 'institution',
    institutionId: 'INST001',
  },
  admin: {
    id: 'ADM001',
    email: 'superadmin@erp.com',
    name: 'System Administrator',
    role: 'admin',
  },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: false,
  });
  const navigate = useNavigate();

  const login = useCallback(async (credentials: LoginCredentials) => {
    setState(prev => ({ ...prev, isLoading: true }));

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Demo login logic - determine role from email
    let role: UserRole = 'student';

    // Check for specific admin and institution email IDs
    if (credentials.email === 'ADMINERP@gmail.com' || credentials.email.includes('admin')) {
      role = 'admin';
    } else if (credentials.email === 'INST@gmail.com' || credentials.email.includes('institution')) {
      role = 'institution';
    } else if (credentials.email.includes('STAFF') || credentials.email.includes('faculty')) {
      role = 'faculty';
    } else if (credentials.email.includes('STU') || credentials.email.includes('student')) {
      role = 'student';
    }

    const user = { ...DEMO_USERS[role], email: credentials.email };

    setState({
      user,
      isAuthenticated: true,
      isLoading: false,
    });

    navigate(ROLE_ROUTES[role]);
  }, [navigate]);

  const logout = useCallback(() => {
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
    navigate('/login');
  }, [navigate]);

  const switchRole = useCallback((role: UserRole) => {
    const user = DEMO_USERS[role];
    setState({
      user,
      isAuthenticated: true,
      isLoading: false,
    });
    navigate(ROLE_ROUTES[role]);
  }, [navigate]);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
