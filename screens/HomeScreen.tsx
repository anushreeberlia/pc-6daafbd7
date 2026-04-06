import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootStackParamList, WorkoutRecord, ExerciseStats, MuscleGroup } from '../App';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

interface MuscleGroupOption {
  id: MuscleGroup;
  name: string;
  emoji: string;
  description: string;
}

const MUSCLE_GROUP_OPTIONS: MuscleGroupOption[] = [
  { id: 'chest', name: 'Chest', emoji: '💪', description: 'Pectorals & Push' },
  { id: 'back', name: 'Back', emoji: '🔙', description: 'Lats & Pull' },
  { id: 'legs', name: 'Legs', emoji: '🦵', description: 'Quads, Glutes & Calves' },
  { id: 'shoulders', name: 'Shoulders', emoji: '🏋️', description: 'Deltoids & Traps' },
  { id: 'arms', name: 'Arms', emoji: '💪', description: 'Biceps & Triceps' },
  { id: 'core', name: 'Core', emoji: '🔥', description: 'Abs & Obliques' },
  { id: 'full-body', name: 'Full Body', emoji: '🏃', description: 'Complete Workout' },
  { id: 'upper-body', name: 'Upper Body', emoji: '💪', description: 'Chest, Back, Arms' },
  { id: 'lower-body', name: 'Lower Body', emoji: '🦵', description: 'Legs & Glutes' },
];

interface WorkoutCycle {
  completedGroups: MuscleGroup[];
  currentCycle: number;
  lastWorkoutDate: string;
}

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const [timeInput, setTimeInput] = useState('');
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<MuscleGroup | null>(null);
  const [stats, setStats] = useState<ExerciseStats[]>([]);
  const [totalWorkouts, setTotalWorkouts] = useState(0);
  const [lastWorkoutDate, setLastWorkoutDate] = useState<string | null>(null);
  const [workoutCycle, setWorkoutCycle] = useState<WorkoutCycle>({
    completedGroups: [],
    currentCycle: 1,
    lastWorkoutDate: '',
  });
  const [suggestedMuscleGroup, setSuggestedMuscleGroup] = useState<MuscleGroup | null>(null);
  const [showMuscleGroupSelector, setShowMuscleGroupSelector] = useState(false);

  const loadStats = async () => {
    try {
      const storedHistory = await AsyncStorage.getItem('workoutHistory');
      const storedCycle = await AsyncStorage.getItem('workoutCycle');
      
      if (storedHistory) {
        const history: WorkoutRecord[] = JSON.parse(storedHistory);
        
        // Calculate stats
        const exerciseMap = new Map<string, ExerciseStats>();
        
        history.forEach(record => {
          const existing = exerciseMap.get(record.exerciseId);
          const bestWeight = Math.max(...record.sets.map(s => s.weight));
          const bestReps = Math.max(...record.sets.map(s => s.reps));
          
          if (existing) {
            existing.totalSessions += 1;
            existing.bestWeight = Math.max(existing.bestWeight, bestWeight);
            existing.bestReps = Math.max(existing.bestReps, bestReps);
            if (record.date > existing.lastPerformed) {
              existing.lastPerformed = record.date;
            }
          } else {
            exerciseMap.set(record.exerciseId, {
              exerciseId: record.exerciseId,
              lastPerformed: record.date,
              totalSessions: 1,
              bestWeight,
              bestReps,
              category: record.category || '',
            });
          }
        });
        
        setStats(Array.from(exerciseMap.values()));
        setTotalWorkouts(history.length);
        
        // Find most recent workout date
        if (history.length > 0) {
          const mostRecent = history.reduce((latest, record) => 
            record.date > latest ? record.date : latest, history[0].date
          );
          setLastWorkoutDate(mostRecent);
        }
      }
      
      // Load workout cycle
      if (storedCycle) {
        const cycle: WorkoutCycle = JSON.parse(storedCycle);
        setWorkoutCycle(cycle);
        calculateSuggestedMuscleGroup(cycle);
      } else {
        // Initialize cycle for first time users
        const initialCycle: WorkoutCycle = {
          completedGroups: [],
          currentCycle: 1,
          lastWorkoutDate: '',
        };
        setWorkoutCycle(initialCycle);
        calculateSuggestedMuscleGroup(initialCycle);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const calculateSuggestedMuscleGroup = (cycle: WorkoutCycle) => {
    const primaryGroups: MuscleGroup[] = ['chest', 'back', 'legs', 'shoulders', 'arms', 'core'];
    const remainingGroups = primaryGroups.filter(group => !cycle.completedGroups.includes(group));
    
    if (remainingGroups.length > 0) {
      // Suggest the first remaining group in the cycle
      setSuggestedMuscleGroup(remainingGroups[0]);
    } else {
      // All groups completed, start new cycle
      setSuggestedMuscleGroup('chest'); // Start with chest for new cycle
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadStats();
    }, [])
  );

  const handleStartWorkout = () => {
    const timeMinutes = parseInt(timeInput);
    if (isNaN(timeMinutes) || timeMinutes < 10) {
      Alert.alert('Invalid Time', 'Please enter at least 10 minutes for a workout.');
      return;
    }
    if (timeMinutes > 180) {
      Alert.alert('Long Workout', 'Consider breaking this into multiple sessions for better results.');
    }
    
    const targetMuscleGroup = selectedMuscleGroup || suggestedMuscleGroup;
    navigation.navigate('Workout', { timeMinutes, targetMuscleGroup });
  };

  const selectMuscleGroup = (group: MuscleGroup) => {
    setSelectedMuscleGroup(group);
    setShowMuscleGroupSelector(false);
  };

  const clearMuscleGroupSelection = () => {
    setSelectedMuscleGroup(null);
  };

  const quickWorkoutOptions = [15, 30, 45, 60, 90];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const getMuscleGroupName = (group: MuscleGroup) => {
    return MUSCLE_GROUP_OPTIONS.find(option => option.id === group)?.name || group;
  };

  const getMuscleGroupEmoji = (group: MuscleGroup) => {
    return MUSCLE_GROUP_OPTIONS.find(option => option.id === group)?.emoji || '💪';
  };

  const getCycleProgress = () => {
    const totalGroups = 6; // chest, back, legs, shoulders, arms, core
    const completed = workoutCycle.completedGroups.length;
    return `${completed}/${totalGroups}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Ready to Train?</Text>
          <Text style={styles.subtitle}>AI-powered workouts with muscle group cycling</Text>
        </View>

        {totalWorkouts > 0 && (
          <View style={styles.statsCard}>
            <Text style={styles.statsTitle}>Your Progress</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{totalWorkouts}</Text>
                <Text style={styles.statLabel}>Exercises\nCompleted</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{stats.length}</Text>
                <Text style={styles.statLabel}>Different\nExercises</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {lastWorkoutDate ? formatDate(lastWorkoutDate) : 'Never'}
                </Text>
                <Text style={styles.statLabel}>Last\nWorkout</Text>
              </View>
            </View>
            
            {workoutCycle.completedGroups.length > 0 && (
              <View style={styles.cycleProgress}>
                <Text style={styles.cycleTitle}>Current Cycle Progress</Text>
                <Text style={styles.cycleText}>Cycle {workoutCycle.currentCycle} - {getCycleProgress()} muscle groups completed</Text>
                <View style={styles.completedGroups}>
                  {workoutCycle.completedGroups.map(group => (
                    <View key={group} style={styles.completedGroupBadge}>
                      <Text style={styles.completedGroupText}>
                        {getMuscleGroupEmoji(group)} {getMuscleGroupName(group)}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        <View style={styles.inputSection}>
          <Text style={styles.label}>Minutes Available:</Text>
          <TextInput
            style={styles.input}
            value={timeInput}
            onChangeText={setTimeInput}
            keyboardType="numeric"
            placeholder="Enter minutes"
            placeholderTextColor="#9ca3af"
          />
          
          {/* Muscle Group Selection */}
          <View style={styles.muscleGroupSection}>
            <Text style={styles.label}>Target Muscle Group:</Text>
            
            {suggestedMuscleGroup && !selectedMuscleGroup && (
              <View style={styles.suggestedGroup}>
                <Text style={styles.suggestedTitle}>🎯 Suggested (Smart Cycling):</Text>
                <View style={styles.suggestedGroupCard}>
                  <Text style={styles.suggestedGroupText}>
                    {getMuscleGroupEmoji(suggestedMuscleGroup)} {getMuscleGroupName(suggestedMuscleGroup)}
                  </Text>
                  <Text style={styles.suggestedReason}>
                    Next in your training cycle
                  </Text>
                </View>
              </View>
            )}
            
            {selectedMuscleGroup ? (
              <View style={styles.selectedGroupCard}>
                <Text style={styles.selectedGroupText}>
                  {getMuscleGroupEmoji(selectedMuscleGroup)} {getMuscleGroupName(selectedMuscleGroup)}
                </Text>
                <TouchableOpacity 
                  style={styles.changeGroupButton}
                  onPress={clearMuscleGroupSelection}
                >
                  <Text style={styles.changeGroupText}>Change</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.selectGroupButton}
                onPress={() => setShowMuscleGroupSelector(!showMuscleGroupSelector)}
              >
                <Text style={styles.selectGroupText}>
                  {showMuscleGroupSelector ? 'Hide Options' : 'Choose Specific Group'}
                </Text>
              </TouchableOpacity>
            )}
            
            {showMuscleGroupSelector && (
              <View style={styles.muscleGroupGrid}>
                {MUSCLE_GROUP_OPTIONS.map(option => (
                  <TouchableOpacity
                    key={option.id}
                    style={styles.muscleGroupOption}
                    onPress={() => selectMuscleGroup(option.id)}
                  >
                    <Text style={styles.muscleGroupEmoji}>{option.emoji}</Text>
                    <Text style={styles.muscleGroupName}>{option.name}</Text>
                    <Text style={styles.muscleGroupDesc}>{option.description}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
          
          <TouchableOpacity style={styles.startButton} onPress={handleStartWorkout}>
            <Text style={styles.startButtonText}>
              {selectedMuscleGroup ? 'Generate Custom Workout' : 'Generate Smart Workout'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.quickOptions}>
          <Text style={styles.quickTitle}>Quick Options:</Text>
          <View style={styles.quickButtonsRow}>
            {quickWorkoutOptions.map((minutes) => (
              <TouchableOpacity
                key={minutes}
                style={styles.quickButton}
                onPress={() => {
                  const targetMuscleGroup = selectedMuscleGroup || suggestedMuscleGroup;
                  navigation.navigate('Workout', { timeMinutes: minutes, targetMuscleGroup });
                }}
              >
                <Text style={styles.quickButtonText}>{minutes}m</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {totalWorkouts > 0 && (
          <View style={styles.recommendationCard}>
            <Text style={styles.recommendationTitle}>💡 Smart Cycling System</Text>
            <Text style={styles.recommendationText}>
              Our AI ensures balanced training by cycling through all muscle groups. 
              Once you complete all 6 primary muscle groups, a new cycle begins with progressive difficulty.
            </Text>
            {workoutCycle.completedGroups.length === 6 && (
              <Text style={styles.cycleCompleteText}>
                🎉 Cycle {workoutCycle.currentCycle} Complete! Ready for the next level.
              </Text>
            )}
          </View>
        )}

        <TouchableOpacity 
          style={styles.historyButton}
          onPress={() => navigation.navigate('History')}
        >
          <Text style={styles.historyButtonText}>View Workout History</Text>
        </TouchableOpacity>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  statsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 24,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 16,
  },
  cycleProgress: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 16,
  },
  cycleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    marginBottom: 8,
  },
  cycleText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 12,
  },
  completedGroups: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  completedGroupBadge: {
    backgroundColor: '#d1fae5',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  completedGroupText: {
    fontSize: 12,
    color: '#065f46',
    fontWeight: '500',
  },
  inputSection: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    marginBottom: 16,
    textAlign: 'center',
  },
  muscleGroupSection: {
    marginBottom: 16,
  },
  suggestedGroup: {
    marginBottom: 12,
  },
  suggestedTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
    marginBottom: 8,
  },
  suggestedGroupCard: {
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#bbf7d0',
  },
  suggestedGroupText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#065f46',
    textAlign: 'center',
    marginBottom: 4,
  },
  suggestedReason: {
    fontSize: 14,
    color: '#059669',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  selectedGroupCard: {
    backgroundColor: '#dbeafe',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#93c5fd',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedGroupText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1d4ed8',
  },
  changeGroupButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  changeGroupText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  selectGroupButton: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  selectGroupText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  muscleGroupGrid: {
    marginTop: 12,
    gap: 12,
  },
  muscleGroupOption: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  muscleGroupEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  muscleGroupName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  muscleGroupDesc: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  startButton: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  startButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  quickOptions: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  quickTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
    textAlign: 'center',
  },
  quickButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  quickButton: {
    backgroundColor: '#e5e7eb',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  quickButtonText: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 16,
  },
  recommendationCard: {
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 8,
  },
  recommendationText: {
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
    marginBottom: 8,
  },
  cycleCompleteText: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '600',
    textAlign: 'center',
    backgroundColor: '#f0fdf4',
    padding: 8,
    borderRadius: 8,
  },
  historyButton: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 20,
  },
  historyButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 40,
  },
});

export default HomeScreen;