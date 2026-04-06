import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { registerRootComponent } from 'expo';

import HomeScreen from './screens/HomeScreen';
import WorkoutScreen from './screens/WorkoutScreen';
import HistoryScreen from './screens/HistoryScreen';
import RepCounterScreen from './screens/RepCounterScreen';

export type RootStackParamList = {
  Home: undefined;
  Workout: { timeMinutes: number };
  History: undefined;
  RepCounter: { 
    exercise: Exercise;
    onComplete: (sets: WorkoutSet[]) => void;
  };
};

export interface Exercise {
  id: string;
  name: string;
  category: 'chest' | 'back' | 'legs' | 'shoulders' | 'arms' | 'core';
  timeMinutes: number;
  equipment?: string;
  instructions?: string;
}

export interface WorkoutSet {
  weight: number;
  reps: number;
}

export interface WorkoutRecord {
  id: string;
  exerciseId: string;
  exerciseName: string;
  date: string;
  sets: WorkoutSet[];
}

export interface ExerciseStats {
  exerciseId: string;
  lastPerformed: string;
  totalSessions: number;
  bestWeight: number;
  bestReps: number;
  category: string;
}

const Stack = createNativeStackNavigator<RootStackParamList>();

function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="auto" />
        <Stack.Navigator 
          initialRouteName="Home"
          screenOptions={{
            headerStyle: {
              backgroundColor: '#2563eb',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        >
          <Stack.Screen 
            name="Home" 
            component={HomeScreen} 
            options={{ title: 'Smart Gym Trainer' }}
          />
          <Stack.Screen 
            name="Workout" 
            component={WorkoutScreen} 
            options={{ title: 'Today\'s Workout' }}
          />
          <Stack.Screen 
            name="History" 
            component={HistoryScreen} 
            options={{ title: 'Workout History' }}
          />
          <Stack.Screen 
            name="RepCounter" 
            component={RepCounterScreen} 
            options={{ title: 'Rep Counter' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default registerRootComponent(App);