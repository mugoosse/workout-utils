class MuscleAnatomyApp {
  constructor() {
    this.config = null;
    this.currentExercise = null;
    this.frontBodySVG = null;
    this.backBodySVG = null;
    this.activeToggles = {
      target: true,
      synergist: true,
      stabilizer: true,
      lengthening: true,
    };
    this.activeTab = "exercise";
    this.currentProgression = 50;
    this.colorPalette = ["#BC4749", "#F2E8CF", "#A7C957", "#6A994E", "#386641"];
    this.init();
  }

  async init() {
    await this.loadConfig();
    this.populateExerciseList();
    this.setupEventListeners();
    this.initProgressionMode();
    await this.loadBodySVGs();
    if (this.currentExercise) {
      this.updateVisualization();
    }
  }

  async loadConfig() {
    try {
      const response = await fetch("config_generated.json");
      this.config = await response.json();
    } catch (error) {
      console.error("Error loading config:", error);
    }
  }

  populateExerciseList() {
    if (!this.config || !this.config.exercises) return;

    const exerciseSelect = document.getElementById("exercise-select");
    exerciseSelect.innerHTML = "";

    // Get all exercises and sort them alphabetically
    const exercises = Object.entries(this.config.exercises).sort((a, b) =>
      a[1].name.localeCompare(b[1].name)
    );

    // Add default option
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "Select an exercise...";
    exerciseSelect.appendChild(defaultOption);

    // Add all exercises
    exercises.forEach(([key, exercise]) => {
      const option = document.createElement("option");
      option.value = key;
      option.textContent = exercise.name;
      exerciseSelect.appendChild(option);
    });

    // Set first real exercise as default
    if (exercises.length > 0) {
      this.currentExercise = exercises[0][0];
      exerciseSelect.value = this.currentExercise;
    }
  }

  setupEventListeners() {
    // Tab switching
    document
      .getElementById("exercise-tab")
      .addEventListener("click", () => this.switchTab("exercise"));
    document
      .getElementById("progression-tab")
      .addEventListener("click", () => this.switchTab("progression"));

    // Exercise view listeners
    const exerciseSelect = document.getElementById("exercise-select");
    exerciseSelect.addEventListener("change", (e) => {
      this.currentExercise = e.target.value;
      if (this.currentExercise) {
        this.updateVisualization();
      }
    });

    // Setup toggle event listeners
    const toggles = document.querySelectorAll(".muscle-toggle");
    toggles.forEach((toggle) => {
      toggle.addEventListener("change", (e) => {
        const muscleType = e.target.id.replace("toggle-", "");
        this.activeToggles[muscleType] = e.target.checked;
        this.updateVisualization();
      });
    });

    // Progression view listeners
    const progressionSlider = document.getElementById("progression-slider");
    progressionSlider.addEventListener("input", (e) => {
      this.currentProgression = parseInt(e.target.value);
      document.getElementById("progression-value").textContent =
        this.currentProgression;
      if (this.activeTab === "progression") {
        this.updateProgressionVisualization();
      }
    });

    // Color palette listeners
    document
      .getElementById("add-color-btn")
      .addEventListener("click", () => this.addColorToPalette());
    document
      .getElementById("remove-color-btn")
      .addEventListener("click", () => this.removeColorFromPalette());
  }

  // Convert muscle name to standardized SVG ID using comprehensive mapping
  muscleNameToId(muscleName) {
    // First check if we have a muscle_to_svg_id mapping from the config
    if (
      this.config &&
      this.config.muscle_to_svg_id &&
      this.config.muscle_to_svg_id[muscleName]
    ) {
      return this.config.muscle_to_svg_id[muscleName];
    }

    // Fallback to hardcoded mapping for any missing entries
    const muscleMapping = {
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
      Deltoids: "deltoids",

      // Serratus
      "Serratus Anterior": "serratus_anterior",

      // Trapezius variations
      Trapezius: "trapezius",
      "Lower Trapezius": "lower_trapezius",

      // Rhomboids
      "Rhomboid major": "rhomboid_muscles",
      "Rhomboid muscles": "rhomboid_muscles",

      // Abdominals
      "Rectus Abdominus": "rectus_abdominis",
      "External obliques": "external_obliques",

      // Latissimus (fix typo)
      "Lattisimus dorsi": "latissimus_dorsi",
      "Latissimus dorsi": "latissimus_dorsi",

      // Infraspinatus
      Infraspinatus: "infraspinatus",

      // Teres
      "Teres major": "teres_major",

      // Glutes
      "Gluteus maximus": "gluteus_maximus",
      "Gluteus medius": "gluteus_medius",

      // Hamstrings
      "Biceps fermoris": "biceps_femoris", // Fix typo
      "Biceps femoris": "biceps_femoris",
      Semitendinosus: "semitendinosus",

      // Adductors
      "Adductor magnus": "adductor_magnus",
      "Adductor Longus and Pectineus": "adductor_longus_and_pectineus",

      // Calves
      "Gastrocnemius (calf)": "gastrocnemius",
      "Gastrocnemius, medial head": "gastrocnemius",
      "Gastrocnemius, lateral head": "gastrocnemius",
      Gastrocnemius: "gastrocnemius",
      Soleus: "soleus",

      // Quadriceps
      "Rectus femoris": "rectus_femoris",
      "Vastus Lateralis": "vastus_lateralis",
      "Vastus Medialis": "vastus_medialis",

      // Biceps and arm muscles
      "Biceps brachii": "biceps_brachii",
      Brachialis: "brachialis",
      Brachioradialis: "brachioradialis",

      // Other muscles from the standardized list
      "Extensor carpi radialis": "extensor_carpi_radialis",
      "Flexor carpi radialis": "flexor_carpi_radialis",
      "Flexor carpi ulnaris": "flexor_carpi_ulnaris",
      Gracilis: "gracilis",
      Omohyoid: "omohyoid",
      "Peroneus longus": "peroneus_longus",
      Sartorius: "sartorius",
      Sternocleidomastoid: "sternocleidomastoid",
      "Tensor fasciae latae": "tensor_fasciae_latae",
      "Erector Spinae": "erector_spinae",
    };

    // Return mapped value or fallback to original normalization
    return (
      muscleMapping[muscleName] ||
      muscleName.toLowerCase().replace(/\s+/g, "_").replace(/[(),]/g, "")
    );
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
    const frontContainer = document.getElementById("front-body");
    const backContainer = document.getElementById("back-body");

    frontContainer.innerHTML =
      '<div class="loading">Loading front body...</div>';
    backContainer.innerHTML = '<div class="loading">Loading back body...</div>';

    // Load front body SVG from assets
    const frontSVGPath = "assets/anatomy-svgs/front-body-muscles.svg";
    const frontSVGContent = await this.loadSVG(frontSVGPath);

    if (frontSVGContent) {
      frontContainer.innerHTML = frontSVGContent;
      this.frontBodySVG = frontContainer.querySelector("svg");
    }

    // Load back body SVG from assets
    const backSVGPath = "assets/anatomy-svgs/back-body-muscles.svg";
    const backSVGContent = await this.loadSVG(backSVGPath);

    if (backSVGContent) {
      backContainer.innerHTML = backSVGContent;
      this.backBodySVG = backContainer.querySelector("svg");
    }

    // Apply initial styling to SVGs
    if (this.frontBodySVG) {
      this.frontBodySVG.style.width = "100%";
      this.frontBodySVG.style.height = "100%";
      this.frontBodySVG.style.objectFit = "contain";
    }

    if (this.backBodySVG) {
      this.backBodySVG.style.width = "100%";
      this.backBodySVG.style.height = "100%";
      this.backBodySVG.style.objectFit = "contain";
    }
  }

  getMuscleClassification(muscleName) {
    if (!this.config) return "inactive";

    const exercise = this.config.exercises[this.currentExercise];
    if (!exercise) return "inactive";

    // Check each category
    if (exercise.target_muscles.includes(muscleName)) {
      return "target";
    }

    if (exercise.synergist_muscles.includes(muscleName)) {
      return "synergist";
    }

    if (exercise.stabilizer_muscles.includes(muscleName)) {
      return "stabilizer";
    }

    if (exercise.lengthening_muscles.includes(muscleName)) {
      return "lengthening";
    }

    return "inactive";
  }

  updateVisualization() {
    if (
      !this.config ||
      !this.currentExercise ||
      !this.frontBodySVG ||
      !this.backBodySVG
    )
      return;

    const exercise = this.config.exercises[this.currentExercise];
    if (!exercise) return;
    const colors = this.config.muscle_colors;

    // Get all muscle names from config
    const allMuscles = new Set([
      ...exercise.target_muscles,
      ...exercise.synergist_muscles,
      ...exercise.stabilizer_muscles,
      ...exercise.lengthening_muscles,
    ]);

    // Update both front and back body muscles
    this.updateMusclesInSVG(this.frontBodySVG, allMuscles, colors);
    this.updateMusclesInSVG(this.backBodySVG, allMuscles, colors);

    // Update exercise name
    this.updateExerciseInfo();
  }

  updateMusclesInSVG(svgElement, allMuscles, colors) {
    // First, reset all muscle groups to inactive
    const allGroups = svgElement.querySelectorAll("g[id]");
    allGroups.forEach((group) => {
      if (group.id && group.id !== "Layer_1") {
        this.applyMuscleStyle(group, "inactive", colors);
      }
    });

    // Apply colors to active muscles (only if their type is toggled on)
    allMuscles.forEach((muscleName) => {
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
    const paths = muscleGroup.querySelectorAll("path");

    const color = colors[classification];
    const opacity = classification === "inactive" ? "0.6" : "0.8";

    paths.forEach((path) => {
      path.style.fill = color;
      path.style.opacity = opacity;
    });

    // Always show the group
    muscleGroup.style.display = "block";
  }

  updateExerciseInfo() {
    const exercise = this.config.exercises[this.currentExercise];
    if (exercise) {
      document.title = `Interactive Muscle Anatomy - ${exercise.name}`;
    }
  }

  // Debug function to help identify muscle group IDs
  debugMuscleGroups() {
    console.log("Front body muscle groups:");
    if (this.frontBodySVG) {
      const groups = this.frontBodySVG.querySelectorAll("g[id]");
      groups.forEach((group) => {
        if (group.id && group.id !== "Layer_1") {
          console.log(`ID: ${group.id}`);
        }
      });
    }

    console.log("\nBack body muscle groups:");
    if (this.backBodySVG) {
      const groups = this.backBodySVG.querySelectorAll("g[id]");
      groups.forEach((group) => {
        if (group.id && group.id !== "Layer_1") {
          console.log(`ID: ${group.id}`);
        }
      });
    }
  }

  // Debug function to show muscle name to ID conversion
  debugMuscleMapping() {
    if (!this.config) return;

    console.log("Muscle name to ID mapping:");
    const exercise = this.config.exercises[this.currentExercise];
    const allMuscles = new Set([
      ...exercise.target_muscles,
      ...exercise.synergist_muscles,
      ...exercise.stabilizer_muscles,
      ...exercise.lengthening_muscles,
    ]);

    allMuscles.forEach((muscleName) => {
      const muscleId = this.muscleNameToId(muscleName);
      console.log(`"${muscleName}" → "${muscleId}"`);
    });
  }

  // Progression mode methods
  switchTab(tabName) {
    this.activeTab = tabName;

    // Update tab buttons
    document
      .querySelectorAll(".tab-button")
      .forEach((btn) => btn.classList.remove("active"));
    document.getElementById(`${tabName}-tab`).classList.add("active");

    // Update tab content
    document
      .querySelectorAll(".tab-content")
      .forEach((content) => content.classList.remove("active"));
    document.getElementById(`${tabName}-view`).classList.add("active");

    // Update visualization based on active tab
    if (tabName === "exercise") {
      this.updateVisualization();
    } else {
      this.updateProgressionVisualization();
    }
  }

  initProgressionMode() {
    this.renderColorPalette();
  }

  renderColorPalette() {
    const container = document.getElementById("color-palette-container");
    container.innerHTML = "";

    this.colorPalette.forEach((color, index) => {
      const colorItem = document.createElement("div");
      colorItem.className = "color-item";
      colorItem.innerHTML = `
                <div class="color-preview" style="background-color: ${color}"></div>
                <input type="text" class="color-input" value="${color}" data-index="${index}">
            `;
      container.appendChild(colorItem);

      // Add event listener for color input changes
      const input = colorItem.querySelector(".color-input");
      input.addEventListener("input", (e) =>
        this.updateColorFromInput(e, index)
      );
    });
  }

  updateColorFromInput(event, index) {
    const hexValue = event.target.value;

    // Validate hex color format
    if (/^#[0-9A-F]{6}$/i.test(hexValue)) {
      this.colorPalette[index] = hexValue;

      // Update preview
      const preview =
        event.target.parentElement.querySelector(".color-preview");
      preview.style.backgroundColor = hexValue;

      // Update visualization if in progression mode
      if (this.activeTab === "progression") {
        this.updateProgressionVisualization();
      }
    }
  }

  addColorToPalette() {
    const newColor = "#808080"; // Default gray
    this.colorPalette.push(newColor);
    this.renderColorPalette();

    if (this.activeTab === "progression") {
      this.updateProgressionVisualization();
    }
  }

  removeColorFromPalette() {
    if (this.colorPalette.length > 2) {
      // Keep minimum of 2 colors
      this.colorPalette.pop();
      this.renderColorPalette();

      if (this.activeTab === "progression") {
        this.updateProgressionVisualization();
      }
    }
  }

  calculateProgressionColor(progression) {
    if (this.colorPalette.length === 0) return "#808080";
    if (this.colorPalette.length === 1) return this.colorPalette[0];

    const bucketSize = 100 / this.colorPalette.length;
    const colorIndex = Math.min(
      Math.floor(progression / bucketSize),
      this.colorPalette.length - 1
    );

    return this.colorPalette[colorIndex];
  }

  updateProgressionVisualization() {
    if (!this.frontBodySVG || !this.backBodySVG) return;

    const progressionColor = this.calculateProgressionColor(
      this.currentProgression
    );

    // Apply progression color to all muscle groups in both SVGs
    this.applyProgressionColorToSVG(this.frontBodySVG, progressionColor);
    this.applyProgressionColorToSVG(this.backBodySVG, progressionColor);
  }

  applyProgressionColorToSVG(svgElement, color) {
    // Define the valid muscle IDs for front and back views
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

    // Determine which muscle list to use based on the SVG container
    const container = svgElement.closest('.view-container');
    const isFrontView = container && container.querySelector('h2').textContent.includes('Front');
    const muscleIds = isFrontView ? frontMuscleIds : backMuscleIds;

    // First reset all muscle groups to inactive color
    muscleIds.forEach(muscleId => {
      const muscleGroup = svgElement.querySelector(`#${muscleId}`);
      if (muscleGroup) {
        const paths = muscleGroup.querySelectorAll("path");
        paths.forEach((path) => {
          path.style.fill = '#D3D3D3'; // Light gray for inactive
          path.style.opacity = "0.6";
        });
        muscleGroup.style.display = "block";
      }
    });

    // Then apply progression color to all valid muscle groups
    muscleIds.forEach(muscleId => {
      const muscleGroup = svgElement.querySelector(`#${muscleId}`);
      if (muscleGroup) {
        const paths = muscleGroup.querySelectorAll("path");
        paths.forEach((path) => {
          path.style.fill = color;
          path.style.opacity = "0.8";
        });
        muscleGroup.style.display = "block";
      }
    });
  }
}

// Initialize the application when the page loads
document.addEventListener("DOMContentLoaded", () => {
  const app = new MuscleAnatomyApp();

  // Expose app to global scope for debugging
  window.muscleApp = app;

  // Add debug commands
  window.debugMuscleGroups = () => app.debugMuscleGroups();
  window.debugMuscleMapping = () => app.debugMuscleMapping();
});
