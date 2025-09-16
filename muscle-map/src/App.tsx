import { useState, useCallback, useEffect } from 'react';
import './App.css';
import type { TabType, MuscleToggleState } from './types';
import { useConfig } from './hooks/useConfig';
import { useMuscleVisualization } from './hooks/useMuscleVisualization';
import { ExerciseView } from './components/ExerciseView';
import { ProgressionView } from './components/ProgressionView';
import { BodyVisualization } from './components/BodyVisualization';

function App() {
  const { config, loading, error } = useConfig();
  const [activeTab, setActiveTab] = useState<TabType>('exercise');
  const [currentExercise, setCurrentExercise] = useState<string>('');
  const [progression, setProgression] = useState<number>(50);
  const [colorPalette, setColorPalette] = useState<string[]>([
    '#E9FF70', '#B8D0EB', '#B298DC', '#A663CC', '#6F2DBD'
  ]);
  const [activeToggles, setActiveToggles] = useState<MuscleToggleState>({
    target: true,
    synergist: true,
    stabilizer: true,
    lengthening: true,
  });

  const {
    getMuscleColor,
    getAllActiveMuscles,
    muscleNameToId
  } = useMuscleVisualization(config, currentExercise, activeToggles);

  const handleTabSwitch = useCallback((tab: TabType) => {
    setActiveTab(tab);
  }, []);

  const handleExerciseChange = useCallback((exercise: string) => {
    setCurrentExercise(exercise);
  }, []);

  const handleToggleChange = useCallback((muscleType: keyof MuscleToggleState, checked: boolean) => {
    setActiveToggles(prev => ({ ...prev, [muscleType]: checked }));
  }, []);

  const handleProgressionChange = useCallback((value: number) => {
    setProgression(value);
  }, []);

  const handleColorChange = useCallback((index: number, color: string) => {
    setColorPalette(prev => {
      const newPalette = [...prev];
      newPalette[index] = color;
      return newPalette;
    });
  }, []);

  const handleAddColor = useCallback(() => {
    setColorPalette(prev => [...prev, '#808080']);
  }, []);

  const handleRemoveColor = useCallback(() => {
    if (colorPalette.length > 2) {
      setColorPalette(prev => prev.slice(0, -1));
    }
  }, [colorPalette.length]);

  const calculateProgressionColor = useCallback((progression: number): string => {
    if (colorPalette.length === 0) return '#808080';
    if (colorPalette.length === 1) return colorPalette[0];

    const bucketSize = 100 / colorPalette.length;
    const colorIndex = Math.min(
      Math.floor(progression / bucketSize),
      colorPalette.length - 1
    );

    return colorPalette[colorIndex];
  }, [colorPalette]);

  // Auto-select first exercise when config loads
  useEffect(() => {
    if (config && !currentExercise && Object.keys(config.exercises).length > 0) {
      const exercises = Object.entries(config.exercises).sort((a, b) =>
        a[1].name.localeCompare(b[1].name)
      );
      if (exercises.length > 0) {
        setCurrentExercise(exercises[0][0]);
      }
    }
  }, [config, currentExercise]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-gray-600 text-xl text-center">Loading configuration...</div>
        </div>
      </div>
    );
  }

  if (error || !config) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-red-600 text-xl text-center">
            Error loading configuration: {error || 'Unknown error'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600">
      <div className="max-w-[1400px] mx-auto p-5">
        {/* Header with Tab Navigation */}
        <header className="text-center bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h1 className="text-gray-800 mb-4 text-2xl md:text-4xl font-bold">
            Interactive Muscle Anatomy
          </h1>
          <div className="flex justify-center gap-3 flex-col md:flex-row">
            <button
              onClick={() => handleTabSwitch('exercise')}
              className={`px-6 py-3 font-bold border-2 border-blue-500 rounded-lg transition-all ${
                activeTab === 'exercise'
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'bg-white text-blue-500 hover:bg-gray-100 hover:-translate-y-0.5'
              }`}
            >
              Exercise View
            </button>
            <button
              onClick={() => handleTabSwitch('progression')}
              className={`px-6 py-3 font-bold border-2 border-blue-500 rounded-lg transition-all ${
                activeTab === 'progression'
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'bg-white text-blue-500 hover:bg-gray-100 hover:-translate-y-0.5'
              }`}
            >
              Progression View
            </button>
          </div>
        </header>

        {/* Tab Content */}
        {activeTab === 'exercise' && (
          <ExerciseView
            config={config}
            currentExercise={currentExercise}
            onExerciseChange={handleExerciseChange}
            activeToggles={activeToggles}
            onToggleChange={handleToggleChange}
          />
        )}

        {activeTab === 'progression' && (
          <ProgressionView
            progression={progression}
            onProgressionChange={handleProgressionChange}
            colorPalette={colorPalette}
            onColorChange={handleColorChange}
            onAddColor={handleAddColor}
            onRemoveColor={handleRemoveColor}
          />
        )}

        {/* Body Visualizations */}
        <div className="flex gap-8 justify-center flex-wrap mt-8 md:flex-row flex-col md:items-stretch items-center">
          <BodyVisualization
            view="front"
            config={config}
            getMuscleColor={getMuscleColor}
            getAllActiveMuscles={getAllActiveMuscles}
            muscleNameToId={muscleNameToId}
            progressionMode={activeTab === 'progression'}
            progressionColor={activeTab === 'progression' ? calculateProgressionColor(progression) : undefined}
          />
          <BodyVisualization
            view="back"
            config={config}
            getMuscleColor={getMuscleColor}
            getAllActiveMuscles={getAllActiveMuscles}
            muscleNameToId={muscleNameToId}
            progressionMode={activeTab === 'progression'}
            progressionColor={activeTab === 'progression' ? calculateProgressionColor(progression) : undefined}
          />
        </div>
      </div>
    </div>
  );
}

export default App;