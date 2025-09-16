export interface Exercise {
  name: string;
  target_muscles: string[];
  synergist_muscles: string[];
  stabilizer_muscles: string[];
  lengthening_muscles: string[];
}

export interface MuscleColors {
  target: string;
  synergist: string;
  stabilizer: string;
  lengthening: string;
  inactive: string;
}

export interface Config {
  exercises: Record<string, Exercise>;
  muscle_colors: MuscleColors;
  muscle_to_svg_id?: Record<string, string>;
}

export type MuscleType = 'target' | 'synergist' | 'stabilizer' | 'lengthening' | 'inactive';

export type TabType = 'exercise' | 'progression';

export interface MuscleToggleState {
  target: boolean;
  synergist: boolean;
  stabilizer: boolean;
  lengthening: boolean;
}