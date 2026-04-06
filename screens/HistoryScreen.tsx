import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootStackParamList, WorkoutRecord, ExerciseStats } from '../App';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

type Props = NativeStackScreenProps<RootStackParamList, 'History'>;

const HistoryScreen: React.FC<Props> = ({ navigation }) => {
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutRecord[]>([]);
  const [groupedHistory, setGroupedHistory] = useState<{ [key: string]: WorkoutRecord[] }>({});
  const [stats, setStats] = useState<ExerciseStats[]>([]);
  const [viewMode, setViewMode] = useState<'history' | 'stats'>('history');

  const loadWorkoutHistory = async () => {
    try {
      const storedHistory = await AsyncStorage.getItem('workoutHistory');
      if (storedHistory) {
        const history: WorkoutRecord[] = JSON.parse(storedHistory);
        setWorkoutHistory(history);
        
        // Group by date
        const grouped = history.reduce((acc, record) => {
          if (!acc[record.date]) {
            acc[record.date] = [];
          }
          acc[record.date].push(record);
          return acc;
        }, {} as { [key: string]: WorkoutRecord[] });
        
        setGroupedHistory(grouped);
        calculateStats(history);
      }
    } catch (error) {
      console.error('Error loading workout history:', error);
    }
  };

  const calculateStats = (history: WorkoutRecord[]) => {
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
          category: '', // We'll derive this from the exercise name
        });
      }
    });
    
    // Convert to array and sort by frequency
    const statsArray = Array.from(exerciseMap.entries()).map(([exerciseId, stats]) => ({
      ...stats,
      exerciseName: history.find(r => r.exerciseId === exerciseId)?.exerciseName || 'Unknown'
    })).sort((a, b) => b.totalSessions - a.totalSessions);
    
    setStats(statsArray);
  };

  useFocusEffect(
    React.useCallback(() => {
      loadWorkoutHistory();
    }, [])
  );

  const clearHistory = async () => {
    Alert.alert(
      'Clear All History?',
      'This will permanently delete all your workout data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete All', 
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('workoutHistory');
              setWorkoutHistory([]);
              setGroupedHistory({});
              setStats([]);
            } catch (error) {
              console.error('Error clearing history:', error);
            }
          }
        }
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getTotalVolume = (record: WorkoutRecord) => {
    return record.sets.reduce((total, set) => total + (set.weight * set.reps), 0);
  };

  const getTotalReps = (record: WorkoutRecord) => {
    return record.sets.reduce((total, set) => total + set.reps, 0);
  };

  const getDaysSince = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (workoutHistory.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>No Workout History</Text>
          <Text style={styles.emptySubtitle}>Complete some workouts to see your progress here!</Text>
          <TouchableOpacity 
            style={styles.startButton}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.startButtonText}>Start First Workout</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const sortedDates = Object.keys(groupedHistory).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  const totalVolume = workoutHistory.reduce((sum, record) => sum + getTotalVolume(record), 0);
  const totalReps = workoutHistory.reduce((sum, record) => sum + getTotalReps(record), 0);
  const uniqueDays = new Set(workoutHistory.map(r => r.date)).size;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.modeSelector}>
          <TouchableOpacity 
            style={[styles.modeButton, viewMode === 'history' && styles.activeModeButton]}
            onPress={() => setViewMode('history')}
          >
            <Text style={[styles.modeButtonText, viewMode === 'history' && styles.activeModeText]}>History</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.modeButton, viewMode === 'stats' && styles.activeModeButton]}
            onPress={() => setViewMode('stats')}
          >
            <Text style={[styles.modeButtonText, viewMode === 'stats' && styles.activeModeText]}>Stats</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity style={styles.clearButton} onPress={clearHistory}>
          <Text style={styles.clearButtonText}>Clear All</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {viewMode === 'stats' ? (
          <View>
            <View style={styles.overallStats}>
              <Text style={styles.statsTitle}>Overall Statistics</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>{workoutHistory.length}</Text>
                  <Text style={styles.statLabel}>Total Exercises</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>{uniqueDays}</Text>
                  <Text style={styles.statLabel}>Workout Days</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>{totalReps.toLocaleString()}</Text>
                  <Text style={styles.statLabel}>Total Reps</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>{totalVolume.toLocaleString()}</Text>
                  <Text style={styles.statLabel}>Total Volume (lbs)</Text>
                </View>
              </View>
            </View>

            <View style={styles.exerciseStats}>
              <Text style={styles.sectionTitle}>Exercise Performance</Text>
              {stats.map((stat, index) => (
                <View key={stat.exerciseId} style={styles.exerciseStatCard}>
                  <View style={styles.exerciseStatHeader}>
                    <Text style={styles.exerciseStatName}>{stat.exerciseName}</Text>
                    <Text style={styles.exerciseStatFreq}>{stat.totalSessions}x</Text>
                  </View>
                  <View style={styles.exerciseStatDetails}>
                    <Text style={styles.exerciseStatText}>Best: {stat.bestWeight > 0 ? `${stat.bestWeight} lbs` : 'Bodyweight'} × {stat.bestReps} reps</Text>
                    <Text style={styles.exerciseStatText}>Last: {getDaysSince(stat.lastPerformed)} days ago</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ) : (
          <View>
            {sortedDates.map((date) => {
              const dayWorkouts = groupedHistory[date];
              const dayVolume = dayWorkouts.reduce((sum, record) => sum + getTotalVolume(record), 0);
              const dayReps = dayWorkouts.reduce((sum, record) => sum + getTotalReps(record), 0);
              
              return (
                <View key={date} style={styles.dateGroup}>
                  <View style={styles.dateHeader}>
                    <Text style={styles.dateText}>{formatDate(date)}</Text>
                    <Text style={styles.dateSummary}>
                      {dayWorkouts.length} exercises • {dayReps} reps • {dayVolume} lbs
                    </Text>
                  </View>
                  
                  {dayWorkouts.map((record, index) => (
                    <View key={record.id} style={styles.recordCard}>
                      <View style={styles.recordHeader}>
                        <Text style={styles.exerciseName}>{record.exerciseName}</Text>
                        <Text style={styles.setsCount}>{record.sets.length} sets</Text>
                      </View>
                      
                      <View style={styles.setsContainer}>
                        {record.sets.map((set, setIndex) => (
                          <View key={setIndex} style={styles.setItem}>
                            <Text style={styles.setNumber}>Set {setIndex + 1}:</Text>
                            <Text style={styles.setDetails}>
                              {set.weight > 0 ? `${set.weight} lbs` : 'Bodyweight'} × {set.reps} reps
                            </Text>
                          </View>
                        ))}
                      </View>
                      
                      <View style={styles.summary}>
                        <Text style={styles.summaryText}>
                          Total: {getTotalReps(record)} reps
                          {getTotalVolume(record) > 0 && ` • ${getTotalVolume(record)} lbs volume`}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              );
            })}
          </View>
        )}
        
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
  },
  modeSelector: {
    flexDirection: 'row',
    backgroundColor: '#e5e7eb',
    borderRadius: 8,
    padding: 2,
  },
  modeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  activeModeButton: {
    backgroundColor: '#ffffff',
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  activeModeText: {
    color: '#2563eb',
  },
  clearButton: {
    backgroundColor: '#ef4444',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  clearButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  overallStats: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
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
  },
  exerciseStats: {
    marginHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 16,
  },
  exerciseStatCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  exerciseStatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  exerciseStatName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  exerciseStatFreq: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2563eb',
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  exerciseStatDetails: {
    gap: 4,
  },
  exerciseStatText: {
    fontSize: 14,
    color: '#6b7280',
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#374151',
    textAlign: 'center',
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  startButton: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dateGroup: {
    marginBottom: 24,
  },
  dateHeader: {
    marginHorizontal: 20,
    marginBottom: 12,
  },
  dateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
  },
  dateSummary: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  recordCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  setsCount: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  setsContainer: {
    marginBottom: 12,
  },
  setItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  setNumber: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  setDetails: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  summary: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 12,
  },
  summaryText: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '600',
    textAlign: 'center',
  },
  bottomPadding: {
    height: 40,
  },
});

export default HistoryScreen;