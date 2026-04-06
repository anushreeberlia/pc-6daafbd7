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
import { RootStackParamList, Exercise, WorkoutRecord, WorkoutSet, MuscleGroup } from '../App';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Props = NativeStackScreenProps<RootStackParamList, 'Workout'>;

interface WorkoutPlan {
  focus: string;
  totalTime: number;
  warmupTime: number;
  mainTime: number;
  cooldownTime: number;
  warmupExercises: Exercise[];
  mainExercises: Exercise[];
  cooldownExercises: Exercise[];
  cycleInfo: {
    isSmartSuggestion: boolean;
    targetGroup: MuscleGroup;
    willCompleteCycle: boolean;
  };
}

interface WorkoutCycle {
  completedGroups: MuscleGroup[];
  currentCycle: number;
  lastWorkoutDate: string;
}

const EXERCISES: Exercise[] = [
  // Chest
  { id: '1', name: 'Push-ups', category: 'chest', timeMinutes: 2, instructions: 'Keep your body straight, lower to chest level' },
  { id: '2', name: 'Dumbbell Bench Press', category: 'chest', timeMinutes: 3, equipment: 'Dumbbells', instructions: 'Control down, don\'t flare elbows too wide' },
  { id: '3', name: 'Chest Flyes', category: 'chest', timeMinutes: 3, equipment: 'Dumbbells', instructions: 'Squeeze at the top, controlled movement' },
  { id: '4', name: 'Incline Push-ups', category: 'chest', timeMinutes: 2, equipment: 'Bench', instructions: 'Hands on bench, target upper chest' },
  { id: '5', name: 'Decline Push-ups', category: 'chest', timeMinutes: 2, equipment: 'Bench', instructions: 'Feet elevated, target lower chest' },
  { id: '6', name: 'Diamond Push-ups', category: 'chest', timeMinutes: 2, instructions: 'Hands in diamond shape, inner chest focus' },
  
  // Back
  { id: '7', name: 'Pull-ups', category: 'back', timeMinutes: 2, instructions: 'Full hang to chin over bar' },
  { id: '8', name: 'One-Arm Dumbbell Rows', category: 'back', timeMinutes: 3, equipment: 'Dumbbells', instructions: 'Pull toward hip, keep back flat' },
  { id: '9', name: 'Lat Pulldowns', category: 'back', timeMinutes: 3, equipment: 'Cable', instructions: 'Pull to upper chest, control the negative' },
  { id: '10', name: 'Reverse Flyes', category: 'back', timeMinutes: 2, equipment: 'Dumbbells', instructions: 'Rear delt focus, controlled movement' },
  { id: '11', name: 'Superman', category: 'back', timeMinutes: 2, instructions: 'Lie prone, lift chest and legs simultaneously' },
  { id: '12', name: 'Bent-over Rows', category: 'back', timeMinutes: 3, equipment: 'Dumbbells', instructions: 'Hinge at hips, row to lower ribs' },
  
  // Legs
  { id: '13', name: 'Squats', category: 'legs', timeMinutes: 3, instructions: 'Depth below parallel, chest up' },
  { id: '14', name: 'Lunges', category: 'legs', timeMinutes: 3, instructions: 'Step back, knee to 90 degrees' },
  { id: '15', name: 'Deadlifts', category: 'legs', timeMinutes: 4, equipment: 'Barbell', instructions: 'Hinge at hips, straight back' },
  { id: '16', name: 'Wall Sits', category: 'legs', timeMinutes: 2, instructions: 'Back against wall, thighs parallel to floor' },
  { id: '17', name: 'Calf Raises', category: 'legs', timeMinutes: 2, instructions: 'Rise up on toes, slow descent' },
  { id: '18', name: 'Bulgarian Split Squats', category: 'legs', timeMinutes: 3, equipment: 'Bench', instructions: 'Rear foot elevated, single leg squats' },
  { id: '19', name: 'Jump Squats', category: 'legs', timeMinutes: 2, instructions: 'Explosive jump, soft landing' },
  { id: '20', name: 'Single Leg Glute Bridge', category: 'legs', timeMinutes: 2, instructions: 'One leg extended, bridge with other' },
  
  // Shoulders
  { id: '21', name: 'Shoulder Press', category: 'shoulders', timeMinutes: 3, equipment: 'Dumbbells', instructions: 'Core tight, no arching back' },
  { id: '22', name: 'Lateral Raises', category: 'shoulders', timeMinutes: 2, equipment: 'Dumbbells', instructions: 'Light weight, slow and controlled' },
  { id: '23', name: 'Front Raises', category: 'shoulders', timeMinutes: 2, equipment: 'Dumbbells', instructions: 'Forward to shoulder height, controlled' },
  { id: '24', name: 'Upright Rows', category: 'shoulders', timeMinutes: 2, equipment: 'Dumbbells', instructions: 'Pull up to chest level, elbows high' },
  { id: '25', name: 'Pike Push-ups', category: 'shoulders', timeMinutes: 2, instructions: 'Downward dog position, press up' },
  { id: '26', name: 'Arnold Press', category: 'shoulders', timeMinutes: 3, equipment: 'Dumbbells', instructions: 'Rotate palms during press motion' },
  
  // Arms
  { id: '27', name: 'Bicep Curls', category: 'arms', timeMinutes: 2, equipment: 'Dumbbells', instructions: 'Full range of motion, squeeze at top' },
  { id: '28', name: 'Tricep Dips', category: 'arms', timeMinutes: 2, instructions: 'Lower until 90 degrees, push back up' },
  { id: '29', name: 'Hammer Curls', category: 'arms', timeMinutes: 2, equipment: 'Dumbbells', instructions: 'Neutral grip, control both directions' },
  { id: '30', name: 'Overhead Tricep Extension', category: 'arms', timeMinutes: 2, equipment: 'Dumbbells', instructions: 'Lower behind head, extend overhead' },
  { id: '31', name: 'Close-Grip Push-ups', category: 'arms', timeMinutes: 2, instructions: 'Hands close together, tricep focus' },
  { id: '32', name: '21s Bicep Curls', category: 'arms', timeMinutes: 3, equipment: 'Dumbbells', instructions: '7 bottom half, 7 top half, 7 full range' },
  
  // Core
  { id: '33', name: 'Plank', category: 'core', timeMinutes: 1, instructions: 'Hold steady position, engage core' },
  { id: '34', name: 'Crunches', category: 'core', timeMinutes: 2, instructions: 'Slow controlled movement, focus on abs' },
  { id: '35', name: 'Russian Twists', category: 'core', timeMinutes: 2, instructions: 'Rotate side to side, engage obliques' },
  { id: '36', name: 'Mountain Climbers', category: 'core', timeMinutes: 2, instructions: 'Fast alternating knees, maintain plank' },
  { id: '37', name: 'Dead Bug', category: 'core', timeMinutes: 2, instructions: 'Opposite arm/leg, control the movement' },
  { id: '38', name: 'Bicycle Crunches', category: 'core', timeMinutes: 2, instructions: 'Elbow to opposite knee, alternating' },
  { id: '39', name: 'Leg Raises', category: 'core', timeMinutes: 2, instructions: 'Straight legs up, lower with control' },
  { id: '40', name: 'Side Plank', category: 'core', timeMinutes: 1, instructions: 'Hold side position, switch sides' },
];

const WARMUP_EXERCISES: Exercise[] = [
  { id: 'w1', name: 'Arm Circles', category: 'shoulders', timeMinutes: 1, instructions: '20 forward, 20 backward' },
  { id: 'w2', name: 'Light Push-ups', category: 'chest', timeMinutes: 1, instructions: 'Knee or full push-ups × 10' },
  { id: 'w3', name: 'Bodyweight Squats', category: 'legs', timeMinutes: 1, instructions: 'Light and controlled × 15' },
  { id: 'w4', name: 'Shoulder Shrugs', category: 'shoulders', timeMinutes: 1, instructions: 'Roll shoulders back and up' },
  { id: 'w5', name: 'Hip Circles', category: 'legs', timeMinutes: 1, instructions: '10 each direction' },
  { id: 'w6', name: 'Light Shoulder Press', category: 'shoulders', timeMinutes: 1, equipment: 'Light Dumbbells', instructions: 'Very light weight × 10' },
  { id: 'w7', name: 'Torso Twists', category: 'core', timeMinutes: 1, instructions: 'Gentle rotation, both directions' },
  { id: 'w8', name: 'Leg Swings', category: 'legs', timeMinutes: 1, instructions: 'Forward/back, side to side' },
];

const COOLDOWN_EXERCISES: Exercise[] = [
  { id: 'c1', name: 'Forward Fold Stretch', category: 'legs', timeMinutes: 1, instructions: 'Reach toward toes, hold 30s' },
  { id: 'c2', name: 'Chest Doorway Stretch', category: 'chest', timeMinutes: 1, instructions: 'Arm against doorway, lean forward' },
  { id: 'c3', name: 'Seated Spinal Twist', category: 'core', timeMinutes: 1, instructions: 'Twist gently each side' },
  { id: 'c4', name: 'Child\'s Pose', category: 'core', timeMinutes: 1, instructions: 'Sit back on heels, arms forward' },
  { id: 'c5', name: 'Shoulder Cross Stretch', category: 'shoulders', timeMinutes: 1, instructions: 'Pull arm across chest' },
  { id: 'c6', name: 'Deep Breathing', category: 'core', timeMinutes: 1, instructions: 'Slow inhale/exhale, relax' },
  { id: 'c7', name: 'Quad Stretch', category: 'legs', timeMinutes: 1, instructions: 'Pull heel to glute, hold' },
  { id: 'c8', name: 'Tricep Stretch', category: 'arms', timeMinutes: 1, instructions: 'Arm overhead, pull elbow back' },
];

const WorkoutScreen: React.FC<Props> = ({ route, navigation }) => {
  const { timeMinutes, targetMuscleGroup } = route.params;
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  const [currentSection, setCurrentSection] = useState<'warmup' | 'main' | 'cooldown'>('warmup');
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [completedSets, setCompletedSets] = useState<{ [key: string]: WorkoutSet[] }>({});
  const [isWorkoutComplete, setIsWorkoutComplete] = useState(false);
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutRecord[]>([]);
  const [suggestedWeight, setSuggestedWeight] = useState<number>(0);
  const [workoutCycle, setWorkoutCycle] = useState<WorkoutCycle>({
    completedGroups: [],
    currentCycle: 1,
    lastWorkoutDate: '',
  });

  useEffect(() => {
    loadHistoryAndGenerateWorkout();
  }, [timeMinutes, targetMuscleGroup]);

  const loadHistoryAndGenerateWorkout = async () => {
    try {
      const storedHistory = await AsyncStorage.getItem('workoutHistory');
      const storedCycle = await AsyncStorage.getItem('workoutCycle');
      const history: WorkoutRecord[] = storedHistory ? JSON.parse(storedHistory) : [];
      const cycle: WorkoutCycle = storedCycle ? JSON.parse(storedCycle) : {
        completedGroups: [],
        currentCycle: 1,
        lastWorkoutDate: '',
      };
      
      setWorkoutHistory(history);
      setWorkoutCycle(cycle);
      generateSmartWorkoutPlan(history, cycle);
    } catch (error) {
      console.error('Error loading history:', error);
      generateWorkoutPlan();
    }
  };

  const generateSmartWorkoutPlan = (history: WorkoutRecord[], cycle: WorkoutCycle) => {
    // Determine the target muscle group
    let focusGroup: MuscleGroup;
    let isSmartSuggestion = false;
    
    if (targetMuscleGroup) {
      focusGroup = targetMuscleGroup;
    } else {
      // Smart suggestion based on cycle
      const primaryGroups: MuscleGroup[] = ['chest', 'back', 'legs', 'shoulders', 'arms', 'core'];
      const remainingGroups = primaryGroups.filter(group => !cycle.completedGroups.includes(group));
      focusGroup = remainingGroups.length > 0 ? remainingGroups[0] : 'chest';
      isSmartSuggestion = true;
    }

    // Determine workout structure based on focus and time
    let focus = '';
    let primaryCategories: MuscleGroup[] = [];
    
    if (focusGroup === 'full-body') {
      focus = 'Full Body';
      primaryCategories = ['chest', 'back', 'legs', 'shoulders', 'arms', 'core'];
    } else if (focusGroup === 'upper-body') {
      focus = 'Upper Body';
      primaryCategories = ['chest', 'back', 'shoulders', 'arms'];
    } else if (focusGroup === 'lower-body') {
      focus = 'Lower Body + Core';
      primaryCategories = ['legs', 'core'];
    } else {
      // Single muscle group focus
      focus = focusGroup.charAt(0).toUpperCase() + focusGroup.slice(1) + ' Focus';
      primaryCategories = [focusGroup];
      
      // Add complementary groups based on time
      if (timeMinutes >= 45) {
        if (focusGroup === 'chest') primaryCategories.push('shoulders', 'arms');
        else if (focusGroup === 'back') primaryCategories.push('shoulders', 'arms');
        else if (focusGroup === 'legs') primaryCategories.push('core');
        else if (focusGroup === 'shoulders') primaryCategories.push('arms');
        else if (focusGroup === 'arms') primaryCategories.push('shoulders');
        else if (focusGroup === 'core') primaryCategories.push('legs');
      } else if (timeMinutes >= 30) {
        if (focusGroup === 'chest') primaryCategories.push('arms');
        else if (focusGroup === 'back') primaryCategories.push('arms');
        else if (focusGroup === 'legs') primaryCategories.push('core');
        else if (focusGroup === 'shoulders') primaryCategories.push('arms');
      }
    }

    createWorkoutPlan(focus, primaryCategories, history, {
      isSmartSuggestion,
      targetGroup: focusGroup,
      willCompleteCycle: isSmartSuggestion && !cycle.completedGroups.includes(focusGroup)
    });
  };

  const generateWorkoutPlan = () => {
    // Fallback for no history
    let focus = 'Upper Body';
    let primaryCategories: MuscleGroup[] = ['chest', 'back', 'shoulders'];
    
    if (timeMinutes >= 60) {
      focus = 'Full Body';
      primaryCategories = ['chest', 'back', 'legs', 'shoulders', 'arms', 'core'];
    }

    createWorkoutPlan(focus, primaryCategories, [], {
      isSmartSuggestion: false,
      targetGroup: 'chest',
      willCompleteCycle: false
    });
  };

  const createWorkoutPlan = (
    focus: string, 
    primaryCategories: MuscleGroup[], 
    history: WorkoutRecord[], 
    cycleInfo: { isSmartSuggestion: boolean; targetGroup: MuscleGroup; willCompleteCycle: boolean }
  ) => {
    // Calculate time allocation
    const warmupTime = Math.max(2, Math.min(5, Math.floor(timeMinutes * 0.15)));
    const cooldownTime = Math.max(2, Math.min(5, Math.floor(timeMinutes * 0.15)));
    const mainTime = timeMinutes - warmupTime - cooldownTime;
    
    // Select warmup exercises
    const warmupExercises = WARMUP_EXERCISES
      .filter(ex => primaryCategories.includes(ex.category) || ['shoulders', 'core'].includes(ex.category))
      .slice(0, warmupTime)
      .map(ex => ({ ...ex, timeMinutes: 1 }));
    
    // Fill remaining warmup time if needed
    while (warmupExercises.reduce((sum, ex) => sum + ex.timeMinutes, 0) < warmupTime && warmupExercises.length < WARMUP_EXERCISES.length) {
      const remaining = WARMUP_EXERCISES.filter(ex => !warmupExercises.find(w => w.id === ex.id));
      if (remaining.length > 0) {
        warmupExercises.push({ ...remaining[0], timeMinutes: 1 });
      } else {
        break;
      }
    }
    
    // Select main exercises with smart prioritization
    const exerciseStats = new Map<string, { lastPerformed: string; bestWeight: number; frequency: number }>();
    
    history.forEach(record => {
      const exerciseData = exerciseStats.get(record.exerciseId) || { lastPerformed: '1900-01-01', bestWeight: 0, frequency: 0 };
      if (record.date > exerciseData.lastPerformed) {
        exerciseData.lastPerformed = record.date;
      }
      const maxWeight = Math.max(...record.sets.map(s => s.weight));
      if (maxWeight > exerciseData.bestWeight) {
        exerciseData.bestWeight = maxWeight;
      }
      exerciseData.frequency += 1;
      exerciseStats.set(record.exerciseId, exerciseData);
    });
    
    const mainExercises: Exercise[] = [];
    let usedTime = 0;
    
    // Prioritize categories and select exercises with better distribution
    for (const category of primaryCategories) {
      if (usedTime >= mainTime) break;
      
      const categoryExercises = EXERCISES.filter(e => e.category === category)
        .sort((a, b) => {
          const aStats = exerciseStats.get(a.id);
          const bStats = exerciseStats.get(b.id);
          if (!aStats && !bStats) return 0;
          if (!aStats) return -1; // Never done = higher priority
          if (!bStats) return 1;
          
          const daysSinceA = Math.floor((new Date().getTime() - new Date(aStats.lastPerformed).getTime()) / (1000 * 60 * 60 * 24));
          const daysSinceB = Math.floor((new Date().getTime() - new Date(bStats.lastPerformed).getTime()) / (1000 * 60 * 60 * 24));
          return daysSinceB - daysSinceA;
        });
      
      // Determine how many exercises for this category
      const isMainFocus = category === cycleInfo.targetGroup;
      let categoryLimit: number;
      
      if (isMainFocus) {
        categoryLimit = Math.max(2, Math.min(4, Math.floor(mainTime / 4)));
      } else {
        categoryLimit = category === 'core' ? 1 : Math.min(2, Math.floor(mainTime / 6));
      }
      
      let categoryCount = 0;
      
      for (const exercise of categoryExercises) {
        if (usedTime + exercise.timeMinutes <= mainTime && categoryCount < categoryLimit) {
          mainExercises.push(exercise);
          usedTime += exercise.timeMinutes;
          categoryCount++;
        }
      }
    }
    
    // Select cooldown exercises
    const cooldownExercises = COOLDOWN_EXERCISES
      .filter(ex => primaryCategories.includes(ex.category) || ['core', 'legs'].includes(ex.category))
      .slice(0, cooldownTime)
      .map(ex => ({ ...ex, timeMinutes: 1 }));
    
    const plan: WorkoutPlan = {
      focus,
      totalTime: timeMinutes,
      warmupTime,
      mainTime,
      cooldownTime,
      warmupExercises,
      mainExercises,
      cooldownExercises,
      cycleInfo,
    };
    
    setWorkoutPlan(plan);
    setCurrentSection('warmup');
    setCurrentExerciseIndex(0);
    setCompletedSets({});
    
    // Set suggested weight for first main exercise
    if (mainExercises.length > 0) {
      updateSuggestedWeight(mainExercises[0]);
    }
  };

  const updateSuggestedWeight = (exercise: Exercise) => {
    const exerciseHistory = workoutHistory.filter(r => r.exerciseId === exercise.id);
    if (exerciseHistory.length === 0) {
      setSuggestedWeight(0);
      return;
    }
    
    const mostRecent = exerciseHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    const avgWeight = mostRecent.sets.reduce((sum, set) => sum + set.weight, 0) / mostRecent.sets.length;
    setSuggestedWeight(Math.round(avgWeight));
  };

  const updateWorkoutCycle = async (completedGroup: MuscleGroup) => {
    try {
      const primaryGroups: MuscleGroup[] = ['chest', 'back', 'legs', 'shoulders', 'arms', 'core'];
      
      if (primaryGroups.includes(completedGroup)) {
        const updatedCompletedGroups = workoutCycle.completedGroups.includes(completedGroup) 
          ? workoutCycle.completedGroups 
          : [...workoutCycle.completedGroups, completedGroup];
        
        let newCycle = workoutCycle.currentCycle;
        let finalCompletedGroups = updatedCompletedGroups;
        
        // Check if cycle is complete
        if (updatedCompletedGroups.length === primaryGroups.length) {
          newCycle += 1;
          finalCompletedGroups = []; // Reset for new cycle
        }
        
        const updatedCycle: WorkoutCycle = {
          completedGroups: finalCompletedGroups,
          currentCycle: newCycle,
          lastWorkoutDate: new Date().toISOString().split('T')[0],
        };
        
        await AsyncStorage.setItem('workoutCycle', JSON.stringify(updatedCycle));
        setWorkoutCycle(updatedCycle);
      }
    } catch (error) {
      console.error('Error updating workout cycle:', error);
    }
  };

  const startWorkout = () => {
    setShowPreview(false);
    if (workoutPlan?.mainExercises.length && workoutPlan.mainExercises.length > 0) {
      updateSuggestedWeight(workoutPlan.mainExercises[0]);
    }
  };

  const getCurrentExercises = () => {
    if (!workoutPlan) return [];
    switch (currentSection) {
      case 'warmup': return workoutPlan.warmupExercises;
      case 'main': return workoutPlan.mainExercises;
      case 'cooldown': return workoutPlan.cooldownExercises;
    }
  };

  const handleExerciseComplete = (sets: WorkoutSet[]) => {
    const currentExercises = getCurrentExercises();
    const currentExercise = currentExercises[currentExerciseIndex];
    
    // Only save workout records for main exercises
    if (currentSection === 'main') {
      setCompletedSets(prev => ({ ...prev, [currentExercise.id]: sets }));
      saveWorkoutRecord(currentExercise, sets);
    }
    
    // Move to next exercise or section
    if (currentExerciseIndex < currentExercises.length - 1) {
      const nextIndex = currentExerciseIndex + 1;
      setCurrentExerciseIndex(nextIndex);
      
      if (currentSection === 'main') {
        updateSuggestedWeight(currentExercises[nextIndex]);
      }
    } else {
      // Move to next section
      if (currentSection === 'warmup') {
        setCurrentSection('main');
        setCurrentExerciseIndex(0);
        if (workoutPlan?.mainExercises.length && workoutPlan.mainExercises.length > 0) {
          updateSuggestedWeight(workoutPlan.mainExercises[0]);
        }
      } else if (currentSection === 'main') {
        setCurrentSection('cooldown');
        setCurrentExerciseIndex(0);
        
        // Update workout cycle when main section is complete
        if (workoutPlan?.cycleInfo.willCompleteCycle) {
          updateWorkoutCycle(workoutPlan.cycleInfo.targetGroup);
        }
      } else {
        setIsWorkoutComplete(true);
      }
    }
  };

  const saveWorkoutRecord = async (exercise: Exercise, sets: WorkoutSet[]) => {
    const workoutRecord: WorkoutRecord = {
      id: Date.now().toString(),
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      category: exercise.category,
      date: new Date().toISOString().split('T')[0],
      sets: [...sets],
    };

    try {
      const existingRecords = await AsyncStorage.getItem('workoutHistory');
      const records = existingRecords ? JSON.parse(existingRecords) : [];
      records.push(workoutRecord);
      await AsyncStorage.setItem('workoutHistory', JSON.stringify(records));
      setWorkoutHistory(records);
    } catch (error) {
      console.error('Error saving workout:', error);
    }
  };

  const startRepCounter = () => {
    const currentExercises = getCurrentExercises();
    const currentExercise = currentExercises[currentExerciseIndex];
    
    if (currentSection === 'warmup' || currentSection === 'cooldown') {
      // For warmup/cooldown, just mark as complete
      Alert.alert(
        currentSection === 'warmup' ? 'Warmup Exercise' : 'Cooldown Exercise',
        `Complete: ${currentExercise.name}\n\n${currentExercise.instructions}`,
        [
          { text: 'Done', onPress: () => handleExerciseComplete([]) }
        ]
      );
    } else {
      // For main exercises, use rep counter
      navigation.navigate('RepCounter', {
        exercise: currentExercise,
        onComplete: handleExerciseComplete
      });
    }
  };

  const finishWorkout = () => {
    const completedMainExercises = workoutPlan?.mainExercises.length || 0;
    const cycleMessage = workoutPlan?.cycleInfo.willCompleteCycle 
      ? ` You've completed ${workoutPlan.cycleInfo.targetGroup} in your training cycle!` 
      : '';
    
    Alert.alert(
      'Workout Complete! 🎉',
      `Amazing work! You completed a ${workoutPlan?.focus} workout with ${completedMainExercises} main exercises.${cycleMessage} Your progress has been saved.`,
      [{ text: 'Return Home', onPress: () => navigation.navigate('Home') }]
    );
  };

  if (!workoutPlan) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.message}>Generating your workout plan...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (workoutPlan.mainExercises.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.message}>Not enough time for a proper workout.</Text>
          <Text style={styles.submessage}>Try allocating at least 15 minutes.</Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Show preview before starting workout
  if (showPreview) {
    const hasHistory = workoutHistory.length > 0;
    const exercisesWithHistory = workoutPlan.mainExercises.filter(ex => 
      workoutHistory.some(r => r.exerciseId === ex.id)
    );
    
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.previewHeader}>
            <Text style={styles.previewTitle}>Today's Workout Preview</Text>
            <Text style={styles.focusText}>{workoutPlan.focus}</Text>
            <Text style={styles.timeText}>⏱ {workoutPlan.totalTime} minutes total</Text>
            
            {workoutPlan.cycleInfo.isSmartSuggestion && (
              <View style={styles.smartCycleHint}>
                <Text style={styles.smartCycleText}>
                  🎯 Smart Cycle: {workoutPlan.cycleInfo.targetGroup.toUpperCase()} Focus
                </Text>
                {workoutPlan.cycleInfo.willCompleteCycle && (
                  <Text style={styles.cycleProgressText}>
                    ✨ This will advance your training cycle!
                  </Text>
                )}
              </View>
            )}
            
            {hasHistory && (
              <View style={styles.smartHint}>
                <Text style={styles.smartHintText}>
                  🧠 Smart recommendations: {exercisesWithHistory.length}/{workoutPlan.mainExercises.length} exercises based on your history
                </Text>
              </View>
            )}
          </View>

          <View style={styles.previewSection}>
            <View style={styles.previewSectionHeader}>
              <Text style={styles.previewSectionEmoji}>🔥</Text>
              <Text style={styles.previewSectionTitle}>Warm-up ({workoutPlan.warmupTime} min)</Text>
            </View>
            {workoutPlan.warmupExercises.map((exercise, index) => (
              <View key={exercise.id} style={styles.previewExercise}>
                <Text style={styles.previewExerciseName}>{exercise.name}</Text>
                <Text style={styles.previewExerciseInstructions}>{exercise.instructions}</Text>
              </View>
            ))}
          </View>

          <View style={styles.previewSection}>
            <View style={styles.previewSectionHeader}>
              <Text style={styles.previewSectionEmoji}>🏋️</Text>
              <Text style={styles.previewSectionTitle}>Main Strength ({workoutPlan.mainTime} min)</Text>
            </View>
            <View style={styles.mainInstructions}>
              <Text style={styles.mainInstructionsText}>Set timer → loop nonstop:</Text>
            </View>
            {workoutPlan.mainExercises.map((exercise, index) => {
              const hasExerciseHistory = workoutHistory.some(r => r.exerciseId === exercise.id);
              const exerciseHistory = workoutHistory.filter(r => r.exerciseId === exercise.id);
              let suggestedWeight = 0;
              if (exerciseHistory.length > 0) {
                const mostRecent = exerciseHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
                const avgWeight = mostRecent.sets.reduce((sum, set) => sum + set.weight, 0) / mostRecent.sets.length;
                suggestedWeight = Math.round(avgWeight);
              }
              
              return (
                <View key={exercise.id} style={styles.previewMainExercise}>
                  <View style={styles.previewMainHeader}>
                    <Text style={styles.previewMainNumber}>{index + 1}.</Text>
                    <View style={styles.previewMainContent}>
                      <View style={styles.previewMainNameRow}>
                        <Text style={styles.previewMainName}>{exercise.name}</Text>
                        {hasExerciseHistory && <Text style={styles.historyBadge}>⭐</Text>}
                      </View>
                      <Text style={styles.previewMainInstructions}>{exercise.instructions}</Text>
                      {exercise.equipment && (
                        <Text style={styles.previewEquipment}>Equipment: {exercise.equipment}</Text>
                      )}
                      {suggestedWeight > 0 && (
                        <Text style={styles.previewSuggestion}>💡 Last weight: {suggestedWeight} lbs</Text>
                      )}
                    </View>
                  </View>
                </View>
              );
            })}
            <View style={styles.workoutTip}>
              <Text style={styles.workoutTipText}>👉 Minimal rest, just flow exercise to exercise</Text>
            </View>
          </View>

          <View style={styles.previewSection}>
            <View style={styles.previewSectionHeader}>
              <Text style={styles.previewSectionEmoji}>🧘</Text>
              <Text style={styles.previewSectionTitle}>Cool-down ({workoutPlan.cooldownTime} min)</Text>
            </View>
            {workoutPlan.cooldownExercises.map((exercise, index) => (
              <View key={exercise.id} style={styles.previewExercise}>
                <Text style={styles.previewExerciseName}>{exercise.name}</Text>
                <Text style={styles.previewExerciseInstructions}>{exercise.instructions}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.startWorkoutButton} onPress={startWorkout}>
            <Text style={styles.startWorkoutButtonText}>Start Workout</Text>
          </TouchableOpacity>

          <View style={styles.bottomPadding} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (isWorkoutComplete) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.completeTitle}>🎉 Workout Complete!</Text>
          <Text style={styles.completeSubtitle}>{workoutPlan.focus} - {workoutPlan.totalTime} minutes</Text>
          
          {workoutPlan.cycleInfo.willCompleteCycle && (
            <View style={styles.cycleCompleteCard}>
              <Text style={styles.cycleCompleteTitle}>🎯 Cycle Progress!</Text>
              <Text style={styles.cycleCompleteText}>
                You completed {workoutPlan.cycleInfo.targetGroup.toUpperCase()} in your training cycle!
              </Text>
            </View>
          )}
          
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Today's Summary:</Text>
            <Text style={styles.summaryText}>✅ {workoutPlan.warmupTime}min warmup</Text>
            <Text style={styles.summaryText}>💪 {workoutPlan.mainTime}min strength training</Text>
            <Text style={styles.summaryText}>🧘 {workoutPlan.cooldownTime}min cooldown</Text>
            
            <Text style={styles.summaryTitle}>Main Exercises:</Text>
            {workoutPlan.mainExercises.map((exercise) => {
              const sets = completedSets[exercise.id] || [];
              const totalReps = sets.reduce((sum, set) => sum + set.reps, 0);
              return (
                <Text key={exercise.id} style={styles.summaryText}>
                  {exercise.name}: {sets.length} sets, {totalReps} total reps
                </Text>
              );
            })}
          </View>
          <TouchableOpacity style={styles.finishButton} onPress={finishWorkout}>
            <Text style={styles.finishButtonText}>Return to Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const currentExercises = getCurrentExercises();
  const currentExercise = currentExercises[currentExerciseIndex];
  
  // Calculate overall progress
  const totalExercises = workoutPlan.warmupExercises.length + workoutPlan.mainExercises.length + workoutPlan.cooldownExercises.length;
  let completedExercises = 0;
  
  if (currentSection === 'warmup') {
    completedExercises = currentExerciseIndex;
  } else if (currentSection === 'main') {
    completedExercises = workoutPlan.warmupExercises.length + currentExerciseIndex;
  } else {
    completedExercises = workoutPlan.warmupExercises.length + workoutPlan.mainExercises.length + currentExerciseIndex;
  }
  
  const progress = (completedExercises / totalExercises) * 100;
  const hasHistory = currentSection === 'main' && workoutHistory.some(r => r.exerciseId === currentExercise.id);

  const getSectionEmoji = (section: string) => {
    switch (section) {
      case 'warmup': return '🔥';
      case 'main': return '🏋️';
      case 'cooldown': return '🧘';
      default: return '💪';
    }
  };

  const getSectionTitle = (section: string) => {
    switch (section) {
      case 'warmup': return `Warm-up (${workoutPlan.warmupTime} min)`;
      case 'main': return `Main Strength (${workoutPlan.mainTime} min)`;
      case 'cooldown': return `Cool-down (${workoutPlan.cooldownTime} min)`;
      default: return 'Workout';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.focusText}>{workoutPlan.focus}</Text>
          <Text style={styles.timeText}>⏱ {workoutPlan.totalTime} minutes total</Text>
          <Text style={styles.progressText}>
            {getSectionEmoji(currentSection)} {getSectionTitle(currentSection)}
          </Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
        </View>

        <View style={styles.exerciseCard}>
          <View style={styles.exerciseHeader}>
            <Text style={styles.exerciseName}>{currentExercise.name}</Text>
            <Text style={styles.exerciseNumber}>
              {currentExerciseIndex + 1} of {currentExercises.length}
            </Text>
          </View>
          
          {currentExercise.equipment && (
            <Text style={styles.equipment}>Equipment: {currentExercise.equipment}</Text>
          )}
          
          {currentExercise.instructions && (
            <View style={styles.instructionsContainer}>
              <Text style={styles.instructionsTitle}>Instructions:</Text>
              <Text style={styles.instructions}>{currentExercise.instructions}</Text>
            </View>
          )}
          
          {currentSection === 'main' && suggestedWeight > 0 && (
            <View style={styles.suggestionContainer}>
              <Text style={styles.suggestionTitle}>💡 Suggested Weight:</Text>
              <Text style={styles.suggestionText}>{suggestedWeight} lbs (based on your history)</Text>
            </View>
          )}
          
          {hasHistory && (
            <View style={styles.historyHint}>
              <Text style={styles.historyHintText}>✨ You've done this exercise before!</Text>
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.actionButton} onPress={startRepCounter}>
          <Text style={styles.actionButtonText}>
            {currentSection === 'main' ? 'Start Rep Counter' : 'Mark Complete'}
          </Text>
        </TouchableOpacity>
        
        {/* Workout Structure Overview */}
        <View style={styles.structureCard}>
          <Text style={styles.structureTitle}>Today's Structure:</Text>
          <View style={styles.structureItem}>
            <Text style={styles.structureEmoji}>🔥</Text>
            <Text style={styles.structureText}>Warm-up ({workoutPlan.warmupTime} min)</Text>
          </View>
          <View style={styles.structureItem}>
            <Text style={styles.structureEmoji}>🏋️</Text>
            <Text style={styles.structureText}>Main Strength ({workoutPlan.mainTime} min)</Text>
          </View>
          <View style={styles.structureItem}>
            <Text style={styles.structureEmoji}>🧘</Text>
            <Text style={styles.structureText}>Cool-down ({workoutPlan.cooldownTime} min)</Text>
          </View>
        </View>
        
        {currentSection === 'main' && (
          <View style={styles.workoutOverview}>
            <Text style={styles.overviewTitle}>Main Exercises:</Text>
            {workoutPlan.mainExercises.map((exercise, index) => {
              const isCompleted = currentSection !== 'main' || (currentSection === 'main' && index < currentExerciseIndex);
              const isCurrent = currentSection === 'main' && index === currentExerciseIndex;
              return (
                <View key={exercise.id} style={[
                  styles.overviewItem,
                  isCompleted && styles.completedItem,
                  isCurrent && styles.currentItem
                ]}>
                  <Text style={[
                    styles.overviewText,
                    isCompleted && styles.completedText,
                    isCurrent && styles.currentText
                  ]}>
                    {index + 1}. {exercise.name} 
                    {isCompleted && ' ✓'}
                    {isCurrent && ' ← Current'}
                  </Text>
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
  message: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    marginBottom: 8,
  },
  submessage: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#6b7280',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Preview styles
  previewHeader: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
    marginBottom: 20,
  },
  previewTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  smartCycleHint: {
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#f59e0b',
    width: '100%',
  },
  smartCycleText: {
    fontSize: 16,
    color: '#92400e',
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cycleProgressText: {
    fontSize: 14,
    color: '#92400e',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  smartHint: {
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  smartHintText: {
    fontSize: 14,
    color: '#1e40af',
    textAlign: 'center',
    fontWeight: '500',
  },
  previewSection: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  previewSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#f3f4f6',
  },
  previewSectionEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  previewSectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  previewExercise: {
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  previewExerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  previewExerciseInstructions: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 18,
  },
  mainInstructions: {
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  mainInstructionsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400e',
    textAlign: 'center',
  },
  previewMainExercise: {
    marginBottom: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  previewMainHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  previewMainNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2563eb',
    marginRight: 12,
    marginTop: 2,
    minWidth: 24,
  },
  previewMainContent: {
    flex: 1,
  },
  previewMainNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  previewMainName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    flex: 1,
  },
  historyBadge: {
    fontSize: 16,
    marginLeft: 8,
  },
  previewMainInstructions: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 6,
    fontStyle: 'italic',
  },
  previewEquipment: {
    fontSize: 13,
    color: '#9ca3af',
    marginBottom: 4,
    fontWeight: '500',
  },
  previewSuggestion: {
    fontSize: 13,
    color: '#059669',
    fontWeight: '600',
    backgroundColor: '#d1fae5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  workoutTip: {
    backgroundColor: '#e0f2fe',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  workoutTipText: {
    fontSize: 14,
    color: '#0369a1',
    fontWeight: '500',
    textAlign: 'center',
  },
  startWorkoutButton: {
    backgroundColor: '#2563eb',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  startWorkoutButtonText: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  // Regular workout styles
  header: {
    padding: 20,
    paddingBottom: 16,
    alignItems: 'center',
  },
  focusText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 4,
  },
  timeText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 18,
    color: '#2563eb',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 12,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    width: '100%',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2563eb',
    borderRadius: 3,
  },
  exerciseCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  exerciseHeader: {
    alignItems: 'center',
    marginBottom: 12,
  },
  exerciseName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
  },
  exerciseNumber: {
    fontSize: 14,
    color: '#2563eb',
    textAlign: 'center',
    marginTop: 4,
    fontWeight: '600',
  },
  equipment: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  instructionsContainer: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  instructions: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  suggestionContainer: {
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  suggestionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 4,
  },
  suggestionText: {
    fontSize: 16,
    color: '#92400e',
    fontWeight: '600',
  },
  historyHint: {
    backgroundColor: '#d1fae5',
    borderRadius: 8,
    padding: 8,
  },
  historyHintText: {
    fontSize: 14,
    color: '#065f46',
    textAlign: 'center',
    fontWeight: '500',
  },
  actionButton: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  structureCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  structureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
    textAlign: 'center',
  },
  structureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  structureEmoji: {
    fontSize: 18,
    marginRight: 12,
  },
  structureText: {
    fontSize: 16,
    color: '#6b7280',
  },
  workoutOverview: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
  },
  overviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
    textAlign: 'center',
  },
  overviewItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 4,
  },
  completedItem: {
    backgroundColor: '#d1fae5',
  },
  currentItem: {
    backgroundColor: '#dbeafe',
  },
  overviewText: {
    fontSize: 14,
    color: '#6b7280',
  },
  completedText: {
    color: '#065f46',
    fontWeight: '500',
  },
  currentText: {
    color: '#1d4ed8',
    fontWeight: '600',
  },
  completeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 12,
  },
  completeSubtitle: {
    fontSize: 18,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  cycleCompleteCard: {
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    width: '100%',
    borderWidth: 2,
    borderColor: '#bbf7d0',
  },
  cycleCompleteTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#065f46',
    textAlign: 'center',
    marginBottom: 8,
  },
  cycleCompleteText: {
    fontSize: 14,
    color: '#059669',
    textAlign: 'center',
    fontWeight: '500',
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    width: '100%',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    textAlign: 'center',
  },
  summaryText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  finishButton: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  finishButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  bottomPadding: {
    height: 40,
  },
});

export default WorkoutScreen;