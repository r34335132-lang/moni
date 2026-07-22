import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

export interface UserProfile {
  name: string;
  currency: string;
  currencySymbol: string;
}

const DEFAULT_PROFILE: UserProfile = {
  name: 'Rafa',
  currency: 'MXN',
  currencySymbol: '$',
};

const PROFILE_KEY = '@moni_profile_v2';

interface ProfileContextType {
  profile: UserProfile;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | null>(null);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);

  useEffect(() => {
    AsyncStorage.getItem(PROFILE_KEY).then((stored) => {
      if (stored) setProfile(JSON.parse(stored));
    });
  }, []);

  const updateProfile = async (updates: Partial<UserProfile>) => {
    const updated = { ...profile, ...updates };
    setProfile(updated);
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(updated));
  };

  return (
    <ProfileContext.Provider value={{ profile, updateProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used inside ProfileProvider');
  return ctx;
}
