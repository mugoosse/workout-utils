class MuscleAnatomyApp {
    constructor() {
        this.config = null;
        this.currentExercise = 'bench_press';
        this.frontBodySVG = null;
        this.backBodySVG = null;
        this.activeToggles = {
            target: true,
            synergist: true,
            stabilizer: true,
            lengthening: true
        };
        this.init();
    }

    async init() {
        await this.loadConfig();
        this.setupEventListeners();
        await this.loadBodySVGs();
        this.updateVisualization();
    }

    async loadConfig() {
        try {
            const response = await fetch('config.json');
            this.config = await response.json();
        } catch (error) {
            console.error('Error loading config:', error);
        }
    }

    setupEventListeners() {
        const exerciseSelect = document.getElementById('exercise-select');
        exerciseSelect.addEventListener('change', (e) => {
            this.currentExercise = e.target.value;
            this.updateVisualization();
        });

        // Setup toggle event listeners
        const toggles = document.querySelectorAll('.muscle-toggle');
        toggles.forEach(toggle => {
            toggle.addEventListener('change', (e) => {
                const muscleType = e.target.id.replace('toggle-', '');
                this.activeToggles[muscleType] = e.target.checked;
                this.updateVisualization();
            });
        });
    }

    // Convert muscle name to standardized SVG ID using comprehensive mapping
    muscleNameToId(muscleName) {
        // Comprehensive mapping from config muscle names to standardized slugs
        const muscleMapping = {
            // Pectoralis variations
            "Pectoralis Major": "pectoralis_major",

            // Triceps variations
            "Triceps brachii, long head": "triceps_brachii",
            "Triceps brachii, medial head": "triceps_brachii",
            "Triceps Brachii ( long head, lateral head )": "triceps_brachii",
            "Triceps brachii": "triceps_brachii",

            // Deltoids
            "Deltoids": "deltoids",

            // Serratus
            "Serratus Anterior": "serratus_anterior",

            // Trapezius variations
            "Trapezius": "trapezius",
            "Lower Trapezius": "lower_trapezius",

            // Rhomboids
            "Rhomboid major": "rhomboid_muscles",
            "Rhomboid muscles": "rhomboid_muscles",

            // Abdominals
            "Rectus Abdominus": "rectus_abdominus",
            "External obliques": "external_obliques",

            // Latissimus (fix typo)
            "Lattisimus dorsi": "latissimus_dorsi",
            "Latissimus dorsi": "latissimus_dorsi",

            // Infraspinatus
            "Infraspinatus": "infraspinatus",

            // Teres
            "Teres major": "teres_major",

            // Glutes
            "Gluteus maximus": "gluteus_maximus",
            "Gluteus medius": "gluteus_medius",

            // Hamstrings
            "Biceps fermoris": "biceps_femoris", // Fix typo
            "Biceps femoris": "biceps_femoris",
            "Semitendinosus": "semitendinosus",

            // Adductors
            "Adductor magnus": "adductor_magnus",
            "Adductor Longus and Pectineus": "adductor_longus_and_pectineus",

            // Calves
            "Gastrocnemius (calf)": "gastrocnemius",
            "Gastrocnemius, medial head": "gastrocnemius",
            "Gastrocnemius, lateral head": "gastrocnemius",
            "Gastrocnemius": "gastrocnemius",
            "Soleus": "soleus",

            // Quadriceps
            "Rectus femoris": "rectus_femoris",
            "Vastus Lateralis": "vastus_lateralis",
            "Vastus Medialis": "vastus_medialis",

            // Biceps and arm muscles
            "Biceps brachii": "biceps_brachii",
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
            "Erector Spinae": "erector_spinae"
        };

        // Return mapped value or fallback to original normalization
        return muscleMapping[muscleName] || muscleName.toLowerCase()
            .replace(/\s+/g, '_')
            .replace(/[(),]/g, '');
    }

    async loadSVG(filePath) {
        try {
            const response = await fetch(filePath);
            if (!response.ok) {
                console.warn(`Could not load SVG: ${filePath}`);
                return null;
            }
            const svgText = await response.text();
            return svgText;
        } catch (error) {
            console.error(`Error loading SVG ${filePath}:`, error);
            return null;
        }
    }

    async loadBodySVGs() {
        const frontContainer = document.getElementById('front-body');
        const backContainer = document.getElementById('back-body');

        frontContainer.innerHTML = '<div class="loading">Loading front body...</div>';
        backContainer.innerHTML = '<div class="loading">Loading back body...</div>';

        // Load front body SVG from assets
        const frontSVGPath = 'assets/anatomy-svgs/front-body-muscles.svg';
        const frontSVGContent = await this.loadSVG(frontSVGPath);

        if (frontSVGContent) {
            frontContainer.innerHTML = frontSVGContent;
            this.frontBodySVG = frontContainer.querySelector('svg');
        }

        // Load back body SVG from assets
        const backSVGPath = 'assets/anatomy-svgs/back-body-muscles.svg';
        const backSVGContent = await this.loadSVG(backSVGPath);

        if (backSVGContent) {
            backContainer.innerHTML = backSVGContent;
            this.backBodySVG = backContainer.querySelector('svg');
        }

        // Apply initial styling to SVGs
        if (this.frontBodySVG) {
            this.frontBodySVG.style.width = '100%';
            this.frontBodySVG.style.height = '100%';
            this.frontBodySVG.style.objectFit = 'contain';
        }

        if (this.backBodySVG) {
            this.backBodySVG.style.width = '100%';
            this.backBodySVG.style.height = '100%';
            this.backBodySVG.style.objectFit = 'contain';
        }
    }

    getMuscleClassification(muscleName) {
        if (!this.config) return 'inactive';

        const exercise = this.config.exercises[this.currentExercise];
        if (!exercise) return 'inactive';

        // Check each category
        if (exercise.target_muscles.includes(muscleName)) {
            return 'target';
        }

        if (exercise.synergist_muscles.includes(muscleName)) {
            return 'synergist';
        }

        if (exercise.stabilizer_muscles.includes(muscleName)) {
            return 'stabilizer';
        }

        if (exercise.lengthening_muscles.includes(muscleName)) {
            return 'lengthening';
        }

        return 'inactive';
    }

    updateVisualization() {
        if (!this.config || !this.frontBodySVG || !this.backBodySVG) return;

        const exercise = this.config.exercises[this.currentExercise];
        const colors = this.config.muscle_colors;

        // Get all muscle names from config
        const allMuscles = new Set([
            ...exercise.target_muscles,
            ...exercise.synergist_muscles,
            ...exercise.stabilizer_muscles,
            ...exercise.lengthening_muscles
        ]);

        // Update both front and back body muscles
        this.updateMusclesInSVG(this.frontBodySVG, allMuscles, colors);
        this.updateMusclesInSVG(this.backBodySVG, allMuscles, colors);

        // Update exercise name
        this.updateExerciseInfo();
    }

    updateMusclesInSVG(svgElement, allMuscles, colors) {
        // First, reset all muscle groups to inactive
        const allGroups = svgElement.querySelectorAll('g[id]');
        allGroups.forEach(group => {
            if (group.id && group.id !== 'Layer_1') {
                this.applyMuscleStyle(group, 'inactive', colors);
            }
        });

        // Apply colors to active muscles (only if their type is toggled on)
        allMuscles.forEach(muscleName => {
            const muscleId = this.muscleNameToId(muscleName);
            const muscleGroup = svgElement.querySelector(`#${muscleId}`);

            if (muscleGroup) {
                const classification = this.getMuscleClassification(muscleName);

                // Only apply muscle-specific styling if this muscle type is toggled on
                if (this.activeToggles[classification]) {
                    this.applyMuscleStyle(muscleGroup, classification, colors);
                }
                // If toggled off, leave it as inactive (grey) from the reset above
            }
        });
    }

    applyMuscleStyle(muscleGroup, classification, colors) {
        // Apply color to all paths in the group
        const paths = muscleGroup.querySelectorAll('path');

        const color = colors[classification];
        const opacity = classification === 'inactive' ? '0.6' : '0.8';

        paths.forEach(path => {
            path.style.fill = color;
            path.style.opacity = opacity;
        });

        // Always show the group
        muscleGroup.style.display = 'block';
    }

    updateExerciseInfo() {
        const exercise = this.config.exercises[this.currentExercise];
        if (exercise) {
            document.title = `Interactive Muscle Anatomy - ${exercise.name}`;
        }
    }

    // Debug function to help identify muscle group IDs
    debugMuscleGroups() {
        console.log('Front body muscle groups:');
        if (this.frontBodySVG) {
            const groups = this.frontBodySVG.querySelectorAll('g[id]');
            groups.forEach(group => {
                if (group.id && group.id !== 'Layer_1') {
                    console.log(`ID: ${group.id}`);
                }
            });
        }

        console.log('\nBack body muscle groups:');
        if (this.backBodySVG) {
            const groups = this.backBodySVG.querySelectorAll('g[id]');
            groups.forEach(group => {
                if (group.id && group.id !== 'Layer_1') {
                    console.log(`ID: ${group.id}`);
                }
            });
        }
    }

    // Debug function to show muscle name to ID conversion
    debugMuscleMapping() {
        if (!this.config) return;

        console.log('Muscle name to ID mapping:');
        const exercise = this.config.exercises[this.currentExercise];
        const allMuscles = new Set([
            ...exercise.target_muscles,
            ...exercise.synergist_muscles,
            ...exercise.stabilizer_muscles,
            ...exercise.lengthening_muscles
        ]);

        allMuscles.forEach(muscleName => {
            const muscleId = this.muscleNameToId(muscleName);
            console.log(`"${muscleName}" → "${muscleId}"`);
        });
    }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const app = new MuscleAnatomyApp();

    // Expose app to global scope for debugging
    window.muscleApp = app;

    // Add debug commands
    window.debugMuscleGroups = () => app.debugMuscleGroups();
    window.debugMuscleMapping = () => app.debugMuscleMapping();

});