#!/usr/bin/env python3
# /// script
# dependencies = [
#   "pandas",
# ]
# ///

import pandas as pd
import json
import re

def slugify(text):
    """Convert muscle name to a standardized slug for SVG IDs"""
    if pd.isna(text):
        return ""
    # Remove parentheses and their contents
    text = re.sub(r'\([^)]*\)', '', text)
    # Convert to lowercase and replace spaces/special chars with underscores
    text = re.sub(r'[^a-z0-9]+', '_', text.lower())
    # Remove leading/trailing underscores
    text = text.strip('_')
    return text

def create_muscle_name_to_svg_id_mapping():
    """Create comprehensive mapping from muscle names to SVG element IDs"""
    return {
        # Abdominals
        "Abdominal Muscles": "rectus_abdominus",
        "Rectus Abdominis": "rectus_abdominus",
        "External Oblique": "external_obliques",
        "Internal Oblique": "external_obliques",  # Using external as fallback
        "External obliques": "external_obliques",
        "Internal obliques": "external_obliques",
        "Transversus Abdominis": "rectus_abdominus",

        # Pectoralis
        "Pectoralis Major": "pectoralis_major",
        "Pectoralis Major, Clavicular Head": "pectoralis_major",
        "Pectoralis Major, Sternal Head": "pectoralis_major",
        "Pectoralis Minor": "pectoralis_major",

        # Deltoids
        "Deltoid": "deltoids",
        "Deltoids": "deltoids",
        "Anterior Deltoid": "deltoids",
        "Middle Deltoid": "deltoids",
        "Posterior Deltoid": "deltoids",
        "Lateral Deltoid": "deltoids",

        # Biceps
        "Biceps Brachii": "biceps_brachii",
        "Biceps Brachii, long head": "biceps_brachii",
        "Biceps Brachii, short head": "biceps_brachii",

        # Triceps
        "Triceps Brachii": "triceps_brachii",
        "Triceps brachii": "triceps_brachii",
        "Triceps brachii, long head": "triceps_brachii_long_head",
        "Triceps brachii, medial head": "triceps_brachii",
        "Triceps Brachii ( long head, lateral head )": "triceps_brachii",
        "Triceps Brachii, Long Head": "triceps_brachii_long_head",

        # Back muscles
        "Latissimus Dorsi": "latissimus_dorsi",
        "Latissimus Dorsi (Respiration)": "latissimus_dorsi",
        "Trapezius": "trapezius",
        "Upper Trapezius": "trapezius",
        "Lower Trapezius": "lower_trapezius",
        "Rhomboid Muscles": "rhomboid_muscles",
        "Rhomboid Major": "rhomboid_muscles",
        "Rhomboid Minor": "rhomboid_muscles",
        "Erector Spinae": "erector_spinae",
        "Infraspinatus": "infraspinatus",
        "Teres Major": "teres_major",
        "Teres Minor": "teres_major",

        # Legs - Quadriceps
        "Quadriceps Femoris": "rectus_femoris",
        "Rectus Femoris": "rectus_femoris",
        "Vastus Lateralis": "rectus_femoris",
        "Vastus Medialis": "rectus_femoris",
        "Vastus Intermedius": "rectus_femoris",

        # Legs - Hamstrings
        "Hamstrings": "biceps_femoris",
        "Biceps Femoris": "biceps_femoris",
        "Biceps femoris": "biceps_femoris",
        "Biceps Femoris Long Head (Hamstring) (4)": "biceps_femoris",
        "Biceps Femoris Short Head (Hamstring) (3)": "biceps_femoris",
        "Semitendinosus": "semitendinosus",
        "Semimembranosus": "semitendinosus",

        # Glutes
        "Gluteus Maximus": "gluteus_maximus",
        "Gluteus Medius": "gluteus_medius",
        "Gluteus Minimus": "gluteus_medius",

        # Calves
        "Gastrocnemius": "gastrocnemius",
        "Gastrocnemius (calf)": "gastrocnemius",
        "Gastrocnemius, medial head": "gastrocnemius",
        "Gastrocnemius, lateral head": "gastrocnemius",
        "Soleus": "soleus",

        # Hip muscles
        "Hip Adductor Muscles": "adductor_magnus",
        "Adductor Magnus": "adductor_magnus",
        "Adductor Longus": "adductor_longus_and_pectineus",
        "Adductor Brevis": "adductor_longus_and_pectineus",
        "Gracilis": "gracilis",

        # Other muscles
        "Serratus Anterior": "serratus_anterior",
        "Brachialis": "brachialis",
        "Brachioradialis": "brachioradialis",
        "Tensor Fasciae Latae": "tensor_fasciae_latae",
        "Sartorius": "sartorius",
        "Sternocleidomastoid": "sternocleidomastoid",
        "Peroneus Longus": "peroneus_longus",
        "Flexor Carpi Radialis": "flexor_carpi_radialis",
        "Flexor Carpi Ulnaris": "flexor_carpi_ulnaris",
        "Extensor Carpi Radialis": "extensor_carpi_radialis",
        "Extensor Carpi Radialis Longus": "extensor_carpi_radialis",
        "Omohyoid": "omohyoid",

        # Wrist flexors/extensors
        "Wrist Flexors": "flexor_carpi_radialis",
        "Wrist Extensors": "extensor_carpi_radialis",

        # Hip flexors
        "Psoas Major": "rectus_femoris",  # Using rectus femoris as proxy
        "Iliacus": "rectus_femoris",

        # Stabilizers (map to core/abs)
        "Pelvic Diaphragm": "rectus_abdominus",
        "Diaphragm": "rectus_abdominus",
        "Transversospinales Muscles": "erector_spinae",
        "Multifidus": "erector_spinae",
        "Quadratus Lumborum": "erector_spinae",
    }

def parse_muscle_list(muscle_str):
    """Parse semicolon-separated muscle list"""
    if pd.isna(muscle_str) or muscle_str == "":
        return []
    return [m.strip() for m in muscle_str.split(';') if m.strip()]

def main():
    # Read CSV files
    exercises_df = pd.read_csv('muscle_and_motion_exercises_full.csv')
    muscles_df = pd.read_csv('muscles_mapped.csv')

    # Get the hardcoded muscle name to SVG ID mapping
    muscle_to_svg_id = create_muscle_name_to_svg_id_mapping()

    # Process exercises
    exercises = {}
    muscle_colors = {
        "target": "#E74C3C",
        "synergist": "#F39C12",
        "stabilizer": "#F1C40F",
        "lengthening": "#3498DB",
        "inactive": "#BDC3C7"
    }

    for _, row in exercises_df.iterrows():
        title = row['title']
        if pd.isna(title):
            continue

        # Create a simplified key from the title
        exercise_key = slugify(title).replace('_', '_')[:50]  # Limit length

        exercise_data = {
            "name": title,
            "target_muscles": parse_muscle_list(row.get('target_muscles', '')),
            "synergist_muscles": parse_muscle_list(row.get('synergist_muscles', '')),
            "stabilizer_muscles": parse_muscle_list(row.get('stabilizer_muscles', '')),
            "lengthening_muscles": parse_muscle_list(row.get('lengthening_muscles', ''))
        }

        # Only include exercises that have at least some muscle data
        if any(exercise_data[key] for key in ['target_muscles', 'synergist_muscles', 'stabilizer_muscles', 'lengthening_muscles']):
            exercises[exercise_key] = exercise_data

    # Create config structure
    config = {
        "exercises": exercises,
        "muscle_colors": muscle_colors,
        "muscle_to_svg_id": muscle_to_svg_id
    }

    # Write to visualizer config
    with open('visualizer/config_generated.json', 'w') as f:
        json.dump(config, f, indent=2)

    print(f"Generated config with {len(exercises)} exercises")
    print(f"Muscle to SVG ID mapping contains {len(muscle_to_svg_id)} entries")

if __name__ == "__main__":
    main()