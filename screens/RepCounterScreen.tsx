import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  Vibration,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootStackParamList, WorkoutSet } from '../App';

type Props = NativeStackScreenProps<RootStackParamList, 'RepCounter'>;

const RepCounterScreen: React.FC<Props> = ({ route, navigation }) => {
  const { exercise, onComplete } = route.params;
  const [currentReps, setCurrentReps] = useState(0);
  const [currentWeight, setCurrentWeight] = useState('');
  const [sets, setSets] = useState<WorkoutSet[]>([]);
  const [restTimer, setRestTimer] = useState(0);
  const [isResting, setIsResting] = useState(false);

  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isResting && restTimer > 0) {
      interval = setInterval(() => {
        setRestTimer(prev => {
          if (prev <= 1) {
            setIsResting(false);
            Vibration.vibrate([100, 50, 100]); // Vibrate when rest is done
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isResting, restTimer]);

  const incrementReps = () => {
    setCurrentReps(prev => prev + 1);
    Vibration.vibrate(50); // Light haptic feedback
  };

  const decrementReps = () => {
    if (currentReps > 0) {
      setCurrentReps(prev => prev - 1);
      Vibration.vibrate(50);
    }
  };

  const resetReps = () => {
    setCurrentReps(0);
  };

  const addSet = () => {
    if (currentReps === 0) {
      Alert.alert('No Reps', 'Please count some reps before adding a set.');
      return;
    }

    const weight = parseFloat(currentWeight) || 0;
    const newSet: WorkoutSet = { weight, reps: currentReps };
    const updatedSets = [...sets, newSet];
    setSets(updatedSets);
    
    // Reset for next set
    setCurrentReps(0);
    
    // Start rest timer (60-90 seconds based on set number)
    const restTime = updatedSets.length === 1 ? 60 : 90;
    setRestTimer(restTime);
    setIsResting(true);
    
    Vibration.vibrate([200, 100, 200]); // Success vibration
  };

  const removeLastSet = () => {
    if (sets.length > 0) {
      setSets(prev => prev.slice(0, -1));
    }
  };

  const startRestTimer = (seconds: number) => {
    setRestTimer(seconds);
    setIsResting(true);
  };

  const completeExercise = () => {
    if (sets.length === 0) {
      Alert.alert('No Sets Recorded', 'Please complete at least one set.');
      return;
    }

    Alert.alert(
      'Complete Exercise?',
      `You completed ${sets.length} sets. Ready to move on?`,
      [
        { text: 'Add Another Set', style: 'cancel' },
        { text: 'Complete Exercise', onPress: () => {
          onComplete(sets);
          navigation.goBack();
        }}
      ]
    );
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.exerciseName}>{exercise.name}</Text>
          <Text style={styles.exerciseCategory}>{exercise.category.toUpperCase()}</Text>
        </View>

        {/* Rest Timer */}
        {isResting && (
          <View style={styles.restContainer}>
            <Text style={styles.restTitle}>Rest Time</Text>
            <Text style={styles.restTimer}>{formatTime(restTimer)}</Text>
            <TouchableOpacity 
              style={styles.skipRestButton}
              onPress={() => {
                setIsResting(false);
                setRestTimer(0);
              }}
            >
              <Text style={styles.skipRestText}>Skip Rest</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Weight Input */}
        <View style={styles.weightSection}>
          <Text style={styles.sectionTitle}>Weight (lbs)</Text>
          <TextInput
            style={styles.weightInput}
            value={currentWeight}
            onChangeText={setCurrentWeight}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="#9ca3af"
          />
          <Text style={styles.weightHint}>Leave empty for bodyweight exercises</Text>
        </View>

        {/* Rep Counter */}
        <View style={styles.counterSection}>
          <Text style={styles.sectionTitle}>Reps</Text>
          <View style={styles.counterContainer}>
            <TouchableOpacity 
              style={styles.counterButton}
              onPress={decrementReps}
              disabled={currentReps === 0}
            >
              <Text style={[styles.counterButtonText, currentReps === 0 && styles.disabledText]}>−</Text>
            </TouchableOpacity>
            
            <View style={styles.repDisplay}>
              <Text style={styles.repCount}>{currentReps}</Text>
            </View>
            
            <TouchableOpacity style={styles.counterButton} onPress={incrementReps}>
              <Text style={styles.counterButtonText}>+</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.counterControls}>
            <TouchableOpacity style={styles.resetButton} onPress={resetReps}>
              <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.addSetButton} 
              onPress={addSet}
              disabled={currentReps === 0}
            >
              <Text style={[styles.addSetButtonText, currentReps === 0 && styles.disabledText]}>
                Add Set
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Rest Buttons */}
        {!isResting && sets.length > 0 && (
          <View style={styles.quickRestSection}>
            <Text style={styles.sectionTitle}>Quick Rest Timer</Text>
            <View style={styles.quickRestButtons}>
              <TouchableOpacity 
                style={styles.quickRestButton}
                onPress={() => startRestTimer(30)}
              >
                <Text style={styles.quickRestText}>30s</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.quickRestButton}
                onPress={() => startRestTimer(60)}
              >
                <Text style={styles.quickRestText}>1m</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.quickRestButton}
                onPress={() => startRestTimer(90)}
              >
                <Text style={styles.quickRestText}>1m 30s</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Completed Sets */}
        {sets.length > 0 && (
          <View style={styles.setsSection}>
            <View style={styles.setsSectionHeader}>
              <Text style={styles.sectionTitle}>Completed Sets ({sets.length})</Text>
              <TouchableOpacity style={styles.removeSetButton} onPress={removeLastSet}>
                <Text style={styles.removeSetText}>Remove Last</Text>
              </TouchableOpacity>
            </View>
            
            {sets.map((set, index) => (
              <View key={index} style={styles.setRow}>
                <Text style={styles.setNumber}>Set {index + 1}</Text>
                <Text style={styles.setDetails}>
                  {set.weight > 0 ? `${set.weight} lbs` : 'Bodyweight'} × {set.reps} reps
                </Text>
              </View>
            ))}
            
            <View style={styles.setsSummary}>
              <Text style={styles.summaryText}>
                Total Volume: {sets.reduce((sum, set) => sum + (set.weight * set.reps), 0)} lbs
              </Text>
              <Text style={styles.summaryText}>
                Total Reps: {sets.reduce((sum, set) => sum + set.reps, 0)}
              </Text>
            </View>
          </View>
        )}

        {/* Complete Exercise Button */}
        <TouchableOpacity 
          style={[styles.completeButton, sets.length === 0 && styles.disabledButton]}
          onPress={completeExercise}
          disabled={sets.length === 0}
        >
          <Text style={[styles.completeButtonText, sets.length === 0 && styles.disabledText]}>
            Complete Exercise
          </Text>
        </TouchableOpacity>
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
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
    marginBottom: 20,
  },
  exerciseName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
  },
  exerciseCategory: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '600',
    marginTop: 4,
  },
  restContainer: {
    backgroundColor: '#fee2e2',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#fecaca',
  },
  restTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#dc2626',
    marginBottom: 8,
  },
  restTimer: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#dc2626',
    fontFamily: 'monospace',
    marginBottom: 12,
  },
  skipRestButton: {
    backgroundColor: '#dc2626',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  skipRestText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  weightSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
    textAlign: 'center',
  },
  weightInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 8,
  },
  weightHint: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  counterSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  counterButton: {
    backgroundColor: '#2563eb',
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
  },
  counterButtonText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  repDisplay: {
    backgroundColor: '#f8fafc',
    borderWidth: 3,
    borderColor: '#2563eb',
    borderRadius: 20,
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  repCount: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#2563eb',
    fontFamily: 'monospace',
  },
  counterControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  resetButton: {
    backgroundColor: '#6b7280',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  resetButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  addSetButton: {
    backgroundColor: '#10b981',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  addSetButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  quickRestSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  quickRestButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  quickRestButton: {
    backgroundColor: '#f59e0b',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  quickRestText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  setsSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  setsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  removeSetButton: {
    backgroundColor: '#ef4444',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  removeSetText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  setRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  setNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  setDetails: {
    fontSize: 16,
    color: '#6b7280',
  },
  setsSummary: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: '#e5e7eb',
  },
  summaryText: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  completeButton: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginHorizontal: 20,
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
  },
  completeButtonText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  disabledText: {
    color: '#9ca3af',
  },
});

export default RepCounterScreen;