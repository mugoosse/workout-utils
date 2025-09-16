import type { Config, MuscleToggleState } from '../types';

interface ExerciseViewProps {
  config: Config | null;
  currentExercise: string;
  onExerciseChange: (exercise: string) => void;
  activeToggles: MuscleToggleState;
  onToggleChange: (muscleType: keyof MuscleToggleState, checked: boolean) => void;
}

export function ExerciseView({
  config,
  currentExercise,
  onExerciseChange,
  activeToggles,
  onToggleChange
}: ExerciseViewProps) {
  if (!config) return null;

  const exercises = Object.entries(config.exercises).sort((a, b) =>
    a[1].name.localeCompare(b[1].name)
  );

  const legendItems = [
    {
      key: 'target' as const,
      label: 'Target Muscles (Primary Movers)',
      color: config.muscle_colors.target,
    },
    {
      key: 'synergist' as const,
      label: 'Synergist Muscles (Assisters)',
      color: config.muscle_colors.synergist,
    },
    {
      key: 'stabilizer' as const,
      label: 'Stabilizer Muscles',
      color: config.muscle_colors.stabilizer,
    },
    {
      key: 'lengthening' as const,
      label: 'Lengthening Muscles (Antagonists)',
      color: config.muscle_colors.lengthening,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Exercise Selector */}
      <div className="flex items-center justify-center gap-4 bg-white rounded-2xl shadow-lg p-6 flex-col md:flex-row">
        <label htmlFor="exercise-select" className="font-bold text-gray-700 text-lg">
          Select Exercise:
        </label>
        <select
          id="exercise-select"
          value={currentExercise}
          onChange={(e) => onExerciseChange(e.target.value)}
          className="px-5 py-3 text-base border-2 border-blue-500 rounded-lg bg-white cursor-pointer transition-all hover:border-blue-600 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-300"
        >
          <option value="">Select an exercise...</option>
          {exercises.map(([key, exercise]) => (
            <option key={key} value={key}>
              {exercise.name}
            </option>
          ))}
        </select>
      </div>

      {/* Legend */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-center text-gray-800 mb-4 text-xl font-bold">
          Muscle Function Legend
        </h3>
        <div className="flex justify-around flex-wrap gap-4 md:flex-row flex-col md:items-stretch items-center">
          {legendItems.map((item) => (
            <div
              key={item.key}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all cursor-pointer hover:bg-gray-100 ${
                activeToggles[item.key]
                  ? 'bg-gray-50 border-gray-300'
                  : 'bg-gray-100 border-gray-400 opacity-50'
              }`}
            >
              <input
                type="checkbox"
                id={`toggle-${item.key}`}
                checked={activeToggles[item.key]}
                onChange={(e) => onToggleChange(item.key, e.target.checked)}
                className="w-5 h-5 cursor-pointer accent-blue-500"
              />
              <label
                htmlFor={`toggle-${item.key}`}
                className="flex items-center gap-3 cursor-pointer transition-opacity"
              >
                <div
                  className={`w-6 h-6 rounded border border-gray-800 transition-opacity ${
                    activeToggles[item.key] ? 'opacity-100' : 'opacity-30'
                  }`}
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm font-medium text-gray-700">{item.label}</span>
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}