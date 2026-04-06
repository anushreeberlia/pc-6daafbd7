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
import { RootStackParamList, WorkoutRecord, ExerciseStats } from '../App';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const [timeInput, setTimeInput] = useState('');
  const [stats, setStats] = useState<ExerciseStats[]>([]);
  const [totalWorkouts, setTotalWorkouts] = useState(0);
  const [lastWorkoutDate, setLastWorkoutDate] = useState<string | null>(null);

  const loadStats = async () => {
    try {
      const storedHistory = await AsyncStorage.getItem('workoutHistory');
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
              category: '', // Will be filled from exercise data
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
    } catch (error) {
      console.error('Error loading stats:', error);
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
    navigation.navigate('Workout', { timeMinutes });
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Ready to Train?</Text>
          <Text style={styles.subtitle}>AI-powered workouts based on your history</Text>
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
          <TouchableOpacity style={styles.startButton} onPress={handleStartWorkout}>
            <Text style={styles.startButtonText}>
              {totalWorkouts > 0 ? 'Generate Smart Workout' : 'Generate Workout'}
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
                onPress={() => navigation.navigate('Workout', { timeMinutes: minutes })}
              >
                <Text style={styles.quickButtonText}>{minutes}m</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {totalWorkouts > 0 && (
          <View style={styles.recommendationCard}>
            <Text style={styles.recommendationTitle}>💡 Smart Recommendations</Text>
            <Text style={styles.recommendationText}>
              Based on your history, we'll prioritize muscle groups you haven't trained recently
              and suggest weights based on your previous performances.
            </Text>
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