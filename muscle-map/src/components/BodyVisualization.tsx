import { useEffect, useRef, useState, useCallback } from 'react';
import type { Config } from '../types';

interface BodyVisualizationProps {
  view: 'front' | 'back';
  config: Config | null;
  getMuscleColor: (muscleName: string) => string;
  getAllActiveMuscles: () => Set<string>;
  muscleNameToId: (muscleName: string) => string;
  progressionMode?: boolean;
  progressionColor?: string;
}

export function BodyVisualization({
  view,
  config,
  getMuscleColor,
  getAllActiveMuscles,
  muscleNameToId,
  progressionMode = false,
  progressionColor
}: BodyVisualizationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Load SVG content
  useEffect(() => {
    async function loadSVG() {
      try {
        setLoading(true);
        const svgPath = `/assets/anatomy-svgs/${view}-body-muscles.svg`;
        const response = await fetch(svgPath);

        if (!response.ok) {
          console.warn(`Could not load SVG: ${svgPath}`);
          return;
        }

        const svgText = await response.text();
        setSvgContent(svgText);
      } catch (error) {
        console.error(`Error loading SVG ${view}:`, error);
      } finally {
        setLoading(false);
      }
    }

    loadSVG();
  }, [view]);

  const applyMuscleStyle = useCallback((muscleGroup: SVGGElement, color: string, opacity: string) => {
    const paths = muscleGroup.querySelectorAll('path');
    paths.forEach((path) => {
      (path as SVGPathElement).style.fill = color;
      (path as SVGPathElement).style.opacity = opacity;
    });
    muscleGroup.style.display = 'block';
  }, []);

  const applyMuscleColors = useCallback((svgElement: SVGSVGElement) => {
    // First, reset all muscle groups to inactive
    const allGroups = svgElement.querySelectorAll('g[id]');
    allGroups.forEach((group) => {
      const element = group as SVGGElement;
      if (element.id && element.id !== 'Layer_1') {
        applyMuscleStyle(element, config!.muscle_colors.inactive, '0.6');
      }
    });

    // Apply colors to active muscles
    const activeMuscles = getAllActiveMuscles();
    activeMuscles.forEach((muscleName) => {
      const muscleId = muscleNameToId(muscleName);
      const muscleGroup = svgElement.querySelector(`#${muscleId}`) as SVGGElement;

      if (muscleGroup) {
        const color = getMuscleColor(muscleName);
        const opacity = color === config!.muscle_colors.inactive ? '0.6' : '0.8';
        applyMuscleStyle(muscleGroup, color, opacity);
      }
    });
  }, [config, getAllActiveMuscles, getMuscleColor, muscleNameToId, applyMuscleStyle]);

  const applyProgressionColors = useCallback((svgElement: SVGSVGElement, color: string, viewType: 'front' | 'back') => {
    const frontMuscleIds = [
      'triceps_brachii', 'pectoralis_major', 'deltoids', 'biceps_brachii', 'trapezius',
      'sternocleidomastoid', 'omohyoid', 'brachialis', 'external_obliques', 'serratus_anterior',
      'rectus_abdominis', 'brachioradialis', 'flexor_carpi_radialis', 'extensor_carpi_radialis',
      'adductor_longus_and_pectineus', 'sartorius', 'rectus_femoris', 'vastus_medialis',
      'vastus_lateralis', 'gastrocnemius', 'soleus', 'peroneus_longus', 'tensor_fasciae_latae'
    ];

    const backMuscleIds = [
      'rhomboid_muscles', 'trapezius', 'gracilis', 'tensor_fasciae_latae', 'erector_spinae',
      'flexor_carpi_radialis', 'biceps_femoris', 'adductor_magnus', 'semitendinosus',
      'gluteus_medius', 'gluteus_maximus', 'flexor_carpi_ulnaris', 'extensor_carpi_radialis',
      'brachioradialis', 'serratus_anterior', 'external_obliques', 'triceps_brachii',
      'latissimus_dorsi', 'teres_major', 'infraspinatus', 'lower_trapezius', 'deltoids',
      'gastrocnemius', 'soleus'
    ];

    const muscleIds = viewType === 'front' ? frontMuscleIds : backMuscleIds;

    // First reset all to inactive color
    muscleIds.forEach(muscleId => {
      const muscleGroup = svgElement.querySelector(`#${muscleId}`) as SVGGElement;
      if (muscleGroup) {
        applyMuscleStyle(muscleGroup, '#D3D3D3', '0.6');
      }
    });

    // Then apply progression color
    muscleIds.forEach(muscleId => {
      const muscleGroup = svgElement.querySelector(`#${muscleId}`) as SVGGElement;
      if (muscleGroup) {
        applyMuscleStyle(muscleGroup, color, '0.8');
      }
    });
  }, [applyMuscleStyle]);

  // Apply muscle styling when content changes
  useEffect(() => {
    if (!containerRef.current || !svgContent || !config) return;

    const svgElement = containerRef.current.querySelector('svg');
    if (!svgElement) return;

    if (progressionMode && progressionColor) {
      applyProgressionColors(svgElement, progressionColor, view);
    } else {
      applyMuscleColors(svgElement);
    }
  }, [svgContent, config, progressionMode, progressionColor, view, applyMuscleColors, applyProgressionColors]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px] bg-gray-50 rounded-lg border-2 border-gray-200">
        <div className="text-gray-500 text-lg">Loading {view} body...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-5 flex-1 min-w-[300px] md:min-w-[400px] max-w-full md:max-w-[600px]">
      <h2 className="text-center text-gray-800 mb-6 text-2xl font-bold capitalize">
        {view} View
      </h2>
      <div
        ref={containerRef}
        className="body-view relative min-h-[600px] flex items-center justify-center bg-gray-50 rounded-lg border-2 border-gray-200 overflow-hidden p-5"
        dangerouslySetInnerHTML={{ __html: svgContent }}
      />
    </div>
  );
}