import type { Config } from '../types';

export function muscleNameToId(muscleName: string, config?: Config): string {
  // First check if we have a muscle_to_svg_id mapping from the config
  if (config?.muscle_to_svg_id && config.muscle_to_svg_id[muscleName]) {
    return config.muscle_to_svg_id[muscleName];
  }

  // Fallback to hardcoded mapping for any missing entries
  const muscleMapping: Record<string, string> = {
    // Pectoralis variations
    "Pectoralis Major": "pectoralis_major",
    "Pectoralis Major, Clavicular Head": "pectoralis_major",
    "Pectoralis Major, Sternal Head": "pectoralis_major",

    // Triceps variations
    "Triceps brachii, long head": "triceps_brachii",
    "Triceps brachii, medial head": "triceps_brachii",
    "Triceps Brachii ( long head, lateral head )": "triceps_brachii",
    "Triceps brachii": "triceps_brachii",
    "Triceps Brachii": "triceps_brachii",
    "Triceps Brachii, Long Head": "triceps_brachii_long_head",

    // Deltoids
    "Deltoids": "deltoids",
    "Deltoid": "deltoids",

    // Serratus
    "Serratus Anterior": "serratus_anterior",

    // Trapezius variations
    "Trapezius": "trapezius",
    "Lower Trapezius": "lower_trapezius",

    // Rhomboids
    "Rhomboid major": "rhomboid_muscles",
    "Rhomboid muscles": "rhomboid_muscles",

    // Abdominals
    "Rectus Abdominus": "rectus_abdominis",
    "Rectus Abdominis": "rectus_abdominis",
    "External obliques": "external_obliques",
    "External Oblique": "external_obliques",
    "Internal Oblique": "external_obliques", // Map to external for simplicity
    "Abdominal Muscles": "rectus_abdominis",

    // Latissimus
    "Lattisimus dorsi": "latissimus_dorsi",
    "Latissimus dorsi": "latissimus_dorsi",
    "Latissimus Dorsi (Respiration)": "latissimus_dorsi",

    // Infraspinatus
    "Infraspinatus": "infraspinatus",

    // Teres
    "Teres major": "teres_major",

    // Glutes
    "Gluteus maximus": "gluteus_maximus",
    "Gluteus Maximus": "gluteus_maximus",
    "Gluteus medius": "gluteus_medius",
    "Gluteus Medius": "gluteus_medius",
    "Gluteus Minimus": "gluteus_medius", // Map to medius for simplicity

    // Hamstrings
    "Biceps fermoris": "biceps_femoris", // Fix typo
    "Biceps femoris": "biceps_femoris",
    "Biceps Femoris": "biceps_femoris",
    "Semitendinosus": "semitendinosus",

    // Adductors
    "Adductor magnus": "adductor_magnus",
    "Adductor Longus and Pectineus": "adductor_longus_and_pectineus",
    "Hip Adductor Muscles": "adductor_longus_and_pectineus",

    // Calves
    "Gastrocnemius (calf)": "gastrocnemius",
    "Gastrocnemius, medial head": "gastrocnemius",
    "Gastrocnemius, lateral head": "gastrocnemius",
    "Gastrocnemius": "gastrocnemius",
    "Soleus": "soleus",

    // Quadriceps
    "Rectus femoris": "rectus_femoris",
    "Rectus Femoris": "rectus_femoris",
    "Vastus Lateralis": "vastus_lateralis",
    "Vastus Medialis": "vastus_medialis",
    "Quadriceps Femoris": "rectus_femoris", // Map to rectus femoris

    // Biceps and arm muscles
    "Biceps brachii": "biceps_brachii",
    "Biceps Brachii": "biceps_brachii",
    "Brachialis": "brachialis",
    "Brachioradialis": "brachioradialis",

    // Other muscles from the standardized list
    "Extensor carpi radialis": "extensor_carpi_radialis",
    "Flexor carpi radialis": "flexor_carpi_radialis",
    "Flexor carpi ulnaris": "flexor_carpi_ulnaris",
    "Gracilis": "gracilis",
    "Omohyoid": "omohyoid",
    "Peroneus longus": "peroneus_longus",
    "Sartorius": "sartorius",
    "Sternocleidomastoid": "sternocleidomastoid",
    "Tensor fasciae latae": "tensor_fasciae_latae",
    "Erector Spinae": "erector_spinae",

    // Additional mappings for common exercise muscles
    "Psoas Major": "rectus_femoris", // Map to visible quad muscle
    "Iliacus": "rectus_femoris", // Map to visible quad muscle
    "Anterior Deltoid": "deltoids",
    "Diaphragm": "rectus_abdominis", // Map to visible ab muscle
    "Pelvic Diaphragm": "rectus_abdominis", // Map to visible ab muscle
    "Transversus Abdominis": "rectus_abdominis", // Map to visible ab muscle
    "Pectoralis Minor (Respiration)": "pectoralis_major", // Map to visible pec muscle
    "Hip External Rotators (Deep Layer)": "gluteus_medius", // Map to visible glute muscle
  };

  // Return mapped value or fallback to original normalization
  return (
    muscleMapping[muscleName] ||
    muscleName.toLowerCase().replace(/\s+/g, "_").replace(/[(),]/g, "")
  );
}