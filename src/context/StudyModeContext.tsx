import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { isAlwaysFreeMode } from '../lib/permissions';
import type { StudyMode } from '../types/courseHierarchy';

interface StudyModeContextType {
  mode: StudyMode;
  setMode: (mode: StudyMode) => void;
  isFreeMode: boolean;
  isToggleVisible: boolean;
}

const StudyModeContext = createContext<StudyModeContextType | undefined>(undefined);

export const StudyModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { memberships, profile } = useAuth();
  const alwaysFree = isAlwaysFreeMode(memberships, profile);

  const [mode, setModeState] = useState<StudyMode>(() => {
    if (alwaysFree) return 'free';
    const saved = localStorage.getItem('studyMode');
    return saved === 'free' ? 'free' : 'guided';
  });

  // Force free mode for teachers/superadmins
  useEffect(() => {
    if (alwaysFree && mode !== 'free') {
      setModeState('free');
    }
  }, [alwaysFree]);

  const setMode = (newMode: StudyMode) => {
    if (alwaysFree) return; // Teachers/superadmins can't change mode
    setModeState(newMode);
    localStorage.setItem('studyMode', newMode);
  };

  const value = useMemo(() => ({
    mode,
    setMode,
    isFreeMode: mode === 'free',
    isToggleVisible: !alwaysFree,
  }), [mode, alwaysFree]);

  return (
    <StudyModeContext.Provider value={value}>
      {children}
    </StudyModeContext.Provider>
  );
};

export const useStudyMode = () => {
  const context = useContext(StudyModeContext);
  if (context === undefined) {
    throw new Error('useStudyMode must be used within a StudyModeProvider');
  }
  return context;
};
