declare module '@react-native-async-storage/async-storage' {
  const AsyncStorage: {
    getItem: (key: string) => Promise<string | null>;
    setItem: (key: string, value: string) => Promise<void>;
    removeItem: (key: string) => Promise<void>;
    clear: () => Promise<void>;
    getAllKeys: () => Promise<string[]>;
  };
  export default AsyncStorage;
}

declare module 'expo' {
  export function registerRootComponent<P>(component: React.ComponentType<P>): void;
}

declare module 'expo-status-bar' {
  import React from 'react';
  export interface StatusBarProps {
    style?: 'auto' | 'inverted' | 'light' | 'dark';
    backgroundColor?: string;
    translucent?: boolean;
    hidden?: boolean;
  }
  export const StatusBar: React.FC<StatusBarProps>;
}

declare module 'expo-constants' {
  interface ExpoConfig {
    name?: string;
    slug?: string;
    extra?: {
      cdnUrl?: string;
      supabaseUrl?: string;
      supabaseAnonKey?: string;
      [key: string]: any;
    };
    [key: string]: any;
  }
  interface Constants {
    expoConfig?: ExpoConfig;
    manifest?: any;
    [key: string]: any;
  }
  const Constants: Constants;
  export default Constants;
}

declare module 'expo-speech' {
  export interface SpeechOptions {
    language?: string;
    pitch?: number;
    rate?: number;
    voice?: string;
    onStart?: () => void;
    onDone?: () => void;
    onStopped?: () => void;
    onError?: (error: Error) => void;
  }
  export function speak(text: string, options?: SpeechOptions): void;
  export function stop(): void;
  export function isSpeakingAsync(): Promise<boolean>;
}

declare module 'expo-av' {
  export namespace Audio {
    export interface PlaybackStatus {
      isLoaded: boolean;
      isPlaying?: boolean;
      didJustFinish?: boolean;
      positionMillis?: number;
      durationMillis?: number;
      error?: string;
    }
    export class Sound {
      static createAsync(
        source: { uri: string } | number,
        initialStatus?: any,
        onPlaybackStatusUpdate?: (status: PlaybackStatus) => void
      ): Promise<{ sound: Sound; status: PlaybackStatus }>;
      playAsync(): Promise<any>;
      pauseAsync(): Promise<any>;
      stopAsync(): Promise<any>;
      unloadAsync(): Promise<any>;
    }
  }
}

declare module '@expo/vector-icons' {
  import React from 'react';
  export interface IconProps {
    name: string;
    size?: number;
    color?: string;
    style?: any;
  }
  export const Ionicons: React.FC<IconProps>;
  export const MaterialCommunityIcons: React.FC<IconProps>;
  export const Feather: React.FC<IconProps>;
}

declare module 'react-native-safe-area-context' {
  import React from 'react';
  export interface EdgeInsets {
    top: number;
    right: number;
    bottom: number;
    left: number;
  }
  export const SafeAreaView: React.FC<any>;
  export const SafeAreaProvider: React.FC<{ children?: React.ReactNode }>;
  export function useSafeAreaInsets(): EdgeInsets;
}

declare module 'react-native' {
  import * as React from 'react';

  export interface StyleProp<T> {}
  export type ViewStyle = any;
  export type TextStyle = any;
  export type ImageStyle = any;

  export namespace StyleSheet {
    export function create<T extends Record<string, any>>(styles: T): T;
    export const absoluteFillObject: any;
    export const hairlineWidth: number;
  }

  export const View: React.FC<any>;
  export const Text: React.FC<any>;
  export const TouchableOpacity: React.FC<any>;
  export const Pressable: React.FC<any>;
  export const ScrollView: React.FC<any>;
  export const TextInput: React.FC<any>;
  export const Image: React.FC<any>;
  export const Modal: React.FC<any>;
  export const ActivityIndicator: React.FC<any>;
  export const RefreshControl: React.FC<any>;
  export const Dimensions: {
    get: (dim: 'window' | 'screen') => { width: number; height: number; scale: number; fontScale: number };
  };
  export const Platform: {
    OS: 'ios' | 'android' | 'web';
    select: <T>(specifics: { ios?: T; android?: T; default?: T }) => T;
  };
  export const Alert: {
    alert: (title: string, message?: string, buttons?: any[]) => void;
  };
  export const AppState: {
    currentState: string;
    addEventListener: (type: 'change', listener: (state: string) => void) => { remove: () => void };
  };
}
