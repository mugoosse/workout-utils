import { useMemo } from 'react';
import type { Config, MuscleType, MuscleToggleState } from '../types';
import { muscleNameToId } from '../utils/muscleMapping';

export function useMuscleVisualization(
  config: Config | null,
  currentExercise: string | null,
  activeToggles: MuscleToggleState
) {
  const muscleClassifications = useMemo(() => {
    if (!config || !currentExercise) return new Map<string, MuscleType>();

    const exercise = config.exercises[currentExercise];
    if (!exercise) return new Map<string, MuscleType>();

    const classifications = new Map<string, MuscleType>();

    // Classify muscles by type
    exercise.target_muscles.forEach(muscle => classifications.set(muscle, 'target'));
    exercise.synergist_muscles.forEach(muscle => classifications.set(muscle, 'synergist'));
    exercise.stabilizer_muscles.forEach(muscle => classifications.set(muscle, 'stabilizer'));
    exercise.lengthening_muscles.forEach(muscle => classifications.set(muscle, 'lengthening'));

    return classifications;
  }, [config, currentExercise]);

  const getMuscleClassification = (muscleName: string): MuscleType => {
    return muscleClassifications.get(muscleName) || 'inactive';
  };

  const shouldShowMuscle = (muscleName: string): boolean => {
    const classification = getMuscleClassification(muscleName);
    if (classification === 'inactive') return true; // Always show inactive muscles
    return activeToggles[classification];
  };

  const getMuscleColor = (muscleName: string): string => {
    if (!config) return '#BDC3C7';

    const classification = getMuscleClassification(muscleName);
    const shouldShow = shouldShowMuscle(muscleName);

    // If muscle type is toggled off, show as inactive
    if (!shouldShow && classification !== 'inactive') {
      return config.muscle_colors.inactive;
    }

    return config.muscle_colors[classification];
  };

  const getAllActiveMuscles = (): Set<string> => {
    if (!config || !currentExercise) return new Set();

    const exercise = config.exercises[currentExercise];
    if (!exercise) return new Set();

    return new Set([
      ...exercise.target_muscles,
      ...exercise.synergist_muscles,
      ...exercise.stabilizer_muscles,
      ...exercise.lengthening_muscles,
    ]);
  };

  return {
    getMuscleClassification,
    shouldShowMuscle,
    getMuscleColor,
    getAllActiveMuscles,
    muscleNameToId: (muscleName: string) => muscleNameToId(muscleName, config || undefined)
  };
}