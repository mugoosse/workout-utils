# Workout Utils

A collection of tools for extracting exercise data and muscle information from the Muscle and Motion Strength app, along with an interactive muscle anatomy visualizer.

## Interactive Muscle Visualizer

The visualizer provides an interactive anatomy view showing which muscles are targeted, synergist, stabilizer, or lengthening during different exercises. The visualizer dynamically loads exercise data from CSV files containing 940+ exercises from the Muscle and Motion database.

### Running the Visualizer

#### Quick Start with Helper Script
```bash
uv run run_visualizer.py
```
This will:
- Generate the configuration from CSV files
- Start a local web server
- Open the visualizer in your browser

#### Manual Method

1. **Generate configuration from CSV data**:
   ```bash
   uv run generate_config.py
   ```
   This creates `visualizer/config_generated.json` from the exercise and muscle CSV files.

2. **Start a local server**:
   ```bash
   cd visualizer
   python3 -m http.server 8000
   ```

3. **Open in browser**:
   Navigate to `http://localhost:8000`

### Features

- **940+ exercises**: Full database from Muscle and Motion app
- **Dynamic data loading**: Exercise data loaded from CSV files, not hardcoded
- **Interactive muscle groups**: Toggle different muscle function types on/off
- **Muscle mapping**: Automatic mapping from muscle names to SVG anatomy elements
- **Color-coded visualization**:
  - Red: Target muscles (primary movers)
  - Orange: Synergist muscles (assisters)
  - Yellow: Stabilizer muscles
  - Blue: Lengthening muscles (antagonists)
- **Anatomical accuracy**: Based on professional muscle anatomy SVGs
- **Responsive design**: Works on desktop and mobile devices

### Data Pipeline

1. **Source Data**:
   - `muscle_and_motion_exercises_full.csv` - Contains all exercise definitions
   - `muscles_mapped.csv` - Maps muscle names to visualization groups

2. **Config Generation** (`generate_config.py`):
   - Reads exercise data from CSV
   - Creates muscle name to SVG ID mappings
   - Outputs `config_generated.json` for the visualizer

3. **Visualization** (`visualizer/`):
   - Loads generated config
   - Dynamically populates exercise dropdown
   - Highlights muscles in SVG based on selected exercise

## Muscle and Motion Scraper Setup

### 1. Configure Login Credentials (Optional)

For automatic login, create a `.env` file with your credentials:

```bash
cp .env.example .env
```

Then edit `.env` and add your Muscle and Motion email and password:

```
MUSCLE_MOTION_EMAIL=your_email@example.com
MUSCLE_MOTION_PASSWORD=your_password
```

If you don't provide credentials, the script will open a browser window and wait for you to log in manually.

### 2. Install Playwright browsers

Before running the script, you need to install the Chromium browser for Playwright:

```bash
uv run --with playwright python -m playwright install chromium
```

## Muscle and Motion Scraper Usage

This script can be run as a standalone uv script. First, make sure you have [uv](https://github.com/astral-sh/uv) installed.

### Exercise Scraping (Two-Step Process)

**Step 1: Collect all exercise links** (fast operation):
```bash
uv run scrape_muscle_and_motion_v2.py links
```

**Step 2: Extract detailed information** from collected links:
```bash
uv run scrape_muscle_and_motion_v2.py details
```

**Run both steps at once**:
```bash
uv run scrape_muscle_and_motion_v2.py
```

### Muscle Collection

**Collect muscles and their groups**:
```bash
uv run scrape_muscle_and_motion_v2.py muscles
```

This command will:
- Navigate to the A-Z page and click the "Muscular Anatomy" filter
- Collect all muscle names and URLs
- For muscles with parentheses (e.g., "Buccinator (10)"), extract muscle group information using URL pattern matching
- Export results to CSV files

### Configuration

Edit the `MAX_EXERCISES` variable in `scrape_muscle_and_motion_v2.py` to control batch size:

- `MAX_EXERCISES = None` - Process all remaining exercises (can take several hours)
- `MAX_EXERCISES = 50` - Process next 50 exercises (recommended for batch processing)
- `MAX_EXERCISES = 10` - Process next 10 exercises (useful for testing)

The script will:
- Automatically log in if credentials are provided in `.env` (runs headless)
- Open a browser window for manual login if no credentials are set

**Operation modes:**
1. **Links mode**: Navigate to A-Z page with Exercises filter, collect all exercise titles and paths, save to `exercise_links.csv`
2. **Details mode**: Process each exercise path, extract muscles/equipment/descriptions, save to `muscle_and_motion_exercises_full.csv`
3. **Muscles mode**: Navigate to A-Z page with Muscular Anatomy filter, collect muscle names and groups, save to muscle CSV files

## Output Files

The scraper creates multiple CSV files:

### Exercise Files

#### `exercise_links.csv` (from links command)
- `title`: Exercise name
- `exercise_path`: Relative path to exercise page

#### `muscle_and_motion_exercises_full.csv` (from details command)
- `title`: Exercise name
- `exercise_path`: Relative path to exercise page  
- `url`: Full URL to the exercise page
- `target_muscles`: Primary muscles targeted
- `synergist_muscles`: Supporting muscles involved
- `stabilizer_muscles`: Stabilizing muscles used
- `description`: Complete exercise instructions
- `equipment`: Inferred equipment needed (Barbell, Dumbbell, etc.)

### Muscle Files

#### `muscle_links.csv` (from muscles command)
- `muscle`: Muscle name
- `url`: Full URL to the muscle page

#### `muscles_full.csv` (from muscles command)
- `muscle`: Muscle name (e.g., "Buccinator (10)")
- `url`: Full URL to the muscle page
- `muscle_group`: Muscle group extracted from individual muscle pages (e.g., "Muscles of Facial Expression")

#### `muscles_final.csv` (muscle mapping file)
- `muscle`: Muscle name
- `url`: Full URL to the muscle page
- `muscle_group`: Original muscle group from scraping
- `svg_muscle_group`: Mapped to specific SVG muscle groups for visualization (36 options)
- `broad_muscle_group`: Mapped to broad functional categories for strength training (11 options: chest, shoulders, triceps, biceps, upper_back, lats, glutes, quadriceps, hamstrings, calves, abs)

This file provides a comprehensive mapping from the original scraped muscle list to standardized anatomical classifications suitable for fitness applications and muscle visualization.

## Notes

### Exercise Collection
- The browser runs headless if credentials are provided, otherwise opens for manual login
- Link collection: Automatically scrolls through A-Z page to load all 1,160+ exercises
- Detail extraction: Processes each exercise page to extract comprehensive information
- **Resume capability**: If the details extraction is interrupted, simply run the command again and it will automatically resume from where it left off
- Equipment inference: Based on keywords in title and description
- Non-standard CSS classes (jss*) are avoided for reliable extraction

### Muscle Collection
- Uses the "Muscular Anatomy" filter on the A-Z page
- Automatically detects muscles with parentheses (e.g., "Buccinator (10)") 
- For parentheses muscles: extracts muscle group using URL pattern matching (e.g., URL ending in `.10` maps to parent group URL)
- For muscles without parentheses: no additional processing required
- Muscle group examples: "Muscles of Facial Expression", "Sole of Foot (1st Plantar Layer)", "Wrist Flexors", etc.

## Resume Feature

The details extraction supports automatic resume:
- If `muscle_and_motion_exercises_full.csv` exists, the script will read it and skip already processed exercises
- Progress is saved after each exercise, so you can safely interrupt with Ctrl+C
- To start fresh, delete the CSV file before running
- Perfect for handling network interruptions or processing in batches

### Batch Processing Strategy

Due to potential network timeouts and server rate limiting, it's recommended to process exercises in batches:

1. Set `MAX_EXERCISES = 50` in the script
2. Run `uv run scrape_muscle_and_motion_v2.py details`
3. Wait for completion (approximately 2-3 minutes per exercise)
4. Repeat until all exercises are processed

The script will show progress like:
```
>>> Resuming: 337 exercises already processed
>>> 823 exercises remaining to process
>>> Processing first 50 exercises for testing
[338/387] Processing: Hip Abductor Stretch
[339/387] Processing: Hip Adduction (Cable)
...
```

### Monitoring Progress

The script includes comprehensive logging to both console and file:

**To run and monitor in real-time:**
1. **Start the scraper**: `uv run scrape_muscle_and_motion_v2.py details`
2. **In a new terminal window**: `tail -f scraper.log`

**Log format:**
```
2025-08-25 19:30:45 | INFO | [789/1160] Processing: Hip Thrust (Barbell)
2025-08-25 19:30:48 | INFO | [789] ✓ Completed: Hip Thrust (Barbell) (muscles: 3)
2025-08-25 19:30:50 | ERROR | [790] ERROR processing Invalid Exercise: timeout
```

**Log file locations:**
- `scraper.log` - Complete log with timestamps
- Console output - Real-time progress display

### Performance Notes

- Each exercise takes approximately 2-3 seconds under ideal conditions
- Network timeouts may occur and are handled gracefully
- Processing all 1,160 exercises can take 1-3 hours depending on connection
- The script continues processing even after individual exercise failures
- All progress is logged with detailed timestamps for debugging