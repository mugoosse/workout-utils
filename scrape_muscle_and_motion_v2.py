#!/usr/bin/env python
# /// script
# requires-python = ">=3.9"
# dependencies = [
#     "playwright",
#     "python-dotenv",
#     "pandas",
# ]
# ///

import asyncio
import csv
import logging
import os
import re
from datetime import datetime
from pathlib import Path
from urllib.parse import urljoin

from dotenv import load_dotenv
from playwright.async_api import async_playwright, TimeoutError

load_dotenv()

BASE = "https://app.strength.muscleandmotion.com"
A2Z_URL = f"{BASE}/a-z"
LOGIN_URL = f"{BASE}/login"

# Output files
LINKS_CSV = Path("exercise_links.csv")
FULL_CSV = Path("muscle_and_motion_exercises_full.csv")

# Get credentials from environment variables
EMAIL = os.getenv("MUSCLE_MOTION_EMAIL")
PASSWORD = os.getenv("MUSCLE_MOTION_PASSWORD")

# Number of exercises to collect (set to None to collect all)
MAX_EXERCISES = None  # Examples: None for all, 10 for first 10, etc.

# Debug mode
DEBUG_MODE = False

# Set up logging
LOG_FILE = Path("scraper.log")

def setup_logging():
    """Set up logging to both file and console"""
    # Create formatter
    formatter = logging.Formatter(
        '%(asctime)s | %(levelname)s | %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
    # Create logger
    logger = logging.getLogger('scraper')
    logger.setLevel(logging.INFO)
    
    # Remove any existing handlers
    logger.handlers = []
    
    # File handler
    file_handler = logging.FileHandler(LOG_FILE, encoding='utf-8')
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)
    
    # Console handler  
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)
    
    return logger

# Initialize logger
logger = setup_logging()

# Simple helper to clean text
def clean(txt: str) -> str:
    if not txt:
        return ""
    return re.sub(r"\s+", " ", txt).strip()

# Try to infer equipment (best-effort: title hints, common terms in description)
def infer_equipment(title: str, description: str) -> str:
    title_l = title.lower()
    desc_l = (description or "").lower()
    candidates = []
    # Map lowercase keywords to properly formatted equipment names
    equipment_map = {
        "barbell": "Barbell",
        "battle rope": "Battle Rope",
        "bench": "Bench",
        "bodyweight": "Bodyweight",
        "bosu": "BOSU",
        "cable": "Cable",
        "cable bar": "Cable Bar",
        "dumbbell": "Dumbbell",
        "foam roller": "Foam Roller",
        "hurdle": "Hurdle",
        "kettlebell": "Kettlebell",
        "landmine": "Landmine",
        "machine": "Machine",
        "medicine-ball": "Medicine-Ball",
        "parallettes": "Parallettes",
        "plyo box": "Plyo Box",
        "resistance band": "Resistance Band",
        "sandbag": "Sandbag",
        "sliders": "Sliders",
        "stability ball": "Stability Ball",
        "straps": "Straps",
        "weight sled": "Weight Sled"
    }

    for keyword, equipment_name in equipment_map.items():
        if keyword in title_l or keyword in desc_l:
            candidates.append(equipment_name)
    # de-dup while preserving order
    seen = set()
    dedup = [c for c in candidates if not (c in seen or seen.add(c))]
    return "; ".join(dedup)

async def login(page):
    """Automatically log in to Muscle and Motion"""
    await page.goto(LOGIN_URL, wait_until="networkidle")
    
    # Wait for page to load
    await page.wait_for_timeout(2000)
    
    # First click "Have an account?" to show the login form
    try:
        have_account_btn = page.get_by_text("Have an account?")
        if await have_account_btn.count() > 0:
            await have_account_btn.click()
            await page.wait_for_timeout(1000)  # Wait for form to appear
    except Exception as e:
        logger.warning(f"Could not find 'Have an account?' button: {e}")
    
    # Fill in login form
    await page.fill('input[name="email"]', EMAIL)
    await page.fill('input[name="password"]', PASSWORD)
    
    # Click login button
    await page.locator('#AuthRegComponent_login_btn').click()
    
    # Wait for navigation to complete and check if logged in
    try:
        await page.wait_for_timeout(3000)  # Give login time to process
        
        # Check if we're logged in by looking for "Hi Guest" vs user menu
        page_text = await page.content()
        if "Hi Guest" in page_text:
            logger.error("Login failed - still showing as Guest")
        else:
            logger.info("Login successful")
            
        # Navigate to A-Z page after login
        await page.goto(A2Z_URL, wait_until="networkidle")
        await page.wait_for_timeout(2000)
        
    except TimeoutError:
        print(">>> Login may have failed or is taking longer than expected")

async def collect_exercise_links_only(page):
    """
    Collect only exercise titles and paths from the A-Z page.
    Returns list of (title, exercise_path) tuples.
    """
    await page.goto(A2Z_URL, wait_until="domcontentloaded")
    
    # Click the Exercises filter button
    try:
        exercises_btn = page.locator("button:has-text('Exercises')")
        if await exercises_btn.count() > 0:
            btn_class = await exercises_btn.first.get_attribute("class")
            if "active" not in str(btn_class):
                await exercises_btn.first.click()
                await page.wait_for_timeout(1000)
                print(">>> Clicked Exercises filter")
    except Exception as e:
        print(f">>> Error clicking Exercises filter: {e}")
    
    await page.wait_for_timeout(2000)
    
    # Wait for content to load first
    await page.wait_for_timeout(3000)
    
    # Take a screenshot to debug
    if DEBUG_MODE:
        await page.screenshot(path="debug_a2z_page.png")
        print(">>> Saved screenshot: debug_a2z_page.png")
    
    # Scroll to load all exercises
    logger.info("Scrolling to load all exercises...")
    prev_height = 0
    scroll_attempts = 0
    max_scroll_attempts = 50  # Increased attempts
    
    while scroll_attempts < max_scroll_attempts:
        height = await page.evaluate("document.body.scrollHeight")
        if DEBUG_MODE and scroll_attempts % 10 == 0:
            logger.debug(f"Scroll attempt {scroll_attempts}, height: {height}")
            
        if height == prev_height:
            if scroll_attempts > 10:  # Give more attempts before breaking
                break
        else:
            prev_height = height
        
        await page.mouse.wheel(0, 3000)  # Larger scroll
        await page.wait_for_timeout(800)  # Longer wait
        scroll_attempts += 1
    
    # Wait a bit more for all content to load
    await page.wait_for_timeout(2000)
    
    # Collect all exercise links
    logger.info("Collecting exercise links...")
    exercise_links = []
    
    # Get all anchors and filter for exercise links
    all_anchors = await page.locator("a").all()
    print(f">>> Found {len(all_anchors)} total anchors")
    
    for anchor in all_anchors:
        try:
            href = await anchor.get_attribute("href")
            if DEBUG_MODE and href:
                print(f">>> Found href: {href}")
                
            if href and href.startswith("/exercise/"):
                if DEBUG_MODE:
                    print(f">>> Processing exercise link: {href}")
                    
                # Get the title - try different methods
                title = ""
                
                # Try to get from span elements
                spans = await anchor.locator("span").all()
                if DEBUG_MODE:
                    print(f">>> Found {len(spans)} spans in this anchor")
                    
                for span in spans:
                    span_text = clean(await span.inner_text())
                    if DEBUG_MODE:
                        print(f">>> Span text: '{span_text}'")
                    # Skip "Exercises" text
                    if span_text and span_text != "Exercises" and len(span_text) > 3:
                        title = span_text
                        break
                
                # Fallback to anchor text
                if not title:
                    anchor_text = clean(await anchor.inner_text())
                    if DEBUG_MODE:
                        print(f">>> Anchor text: '{anchor_text}'")
                    if anchor_text and "Exercise" not in anchor_text:
                        title = anchor_text
                
                if title:
                    # Clean up title
                    title = title.replace(" Exercises", "").strip()
                    exercise_links.append((title, href))
                    if DEBUG_MODE:
                        print(f">>> Added: {title} -> {href}")
        except Exception as e:
            if DEBUG_MODE:
                print(f">>> Error processing anchor: {e}")
    
    logger.info(f"Found {len(exercise_links)} exercise links before deduplication")
    
    # Deduplicate by path
    seen_paths = set()
    unique_links = []
    for title, path in exercise_links:
        if path not in seen_paths:
            seen_paths.add(path)
            unique_links.append((title, path))
    
    # Sort alphabetically by title
    unique_links.sort(key=lambda x: x[0].lower())
    
    logger.info(f"Found {len(unique_links)} unique exercises")
    return unique_links

async def extract_exercise_details(page, title, exercise_path):
    """
    Extract detailed information from a single exercise page.
    """
    url = urljoin(BASE, exercise_path)
    await page.goto(url, wait_until="domcontentloaded")
    
    # Wait for page to load
    try:
        await page.wait_for_selector("h1", timeout=8000)
    except TimeoutError:
        pass
    
    # Expand Active Muscles section
    try:
        active_muscles_btn = page.locator("button:has-text('Active Muscles:')")
        if await active_muscles_btn.count() > 0:
            await active_muscles_btn.first.click()
            await page.wait_for_timeout(1000)
    except Exception:
        pass
    
    # Extract description - target the specific content area with exercise instructions
    description = ""
    try:
        # Wait for content to load
        await page.wait_for_timeout(1000)
        
        # Strategy: Look for paragraphs that contain actual exercise instructions
        # These are typically longer paragraphs with action words
        all_paragraphs = await page.locator("p").all()
        desc_parts = []
        
        for p in all_paragraphs:
            try:
                text = clean(await p.inner_text())
                # Skip empty text, single characters, title duplicates
                if (text and text != title and text != "‎" and len(text) > 20 and
                    # Skip dialog window text and other UI elements
                    not any(skip_phrase in text.lower() for skip_phrase in [
                        "beginning of dialog window", "escape will cancel", "close the window",
                        "this is a modal window", "video player is loading"
                    ]) and
                    # Look for actual exercise instruction content
                    any(keyword in text.lower() for keyword in [
                        "sit on", "stand", "lie", "hold", "grip", "start with",
                        "press", "push", "pull", "lower", "raise", "lift",
                        "position", "arms", "legs", "chest", "back", "repeat",
                        "slowly", "control", "incline", "targets", "emphasis"
                    ])):
                    desc_parts.append(text)
            except Exception:
                continue
        
        # Join and clean up the description
        if desc_parts:
            description = " ".join(desc_parts)[:1000]
        else:
            description = ""
        
    except Exception as e:
        if DEBUG_MODE:
            print(f">>> Description extraction error: {e}")
        pass
    
    # Extract muscles
    target_muscles = []
    lengthening_muscles = []
    synergist_muscles = []
    stabilizer_muscles = []
    
    try:
        await page.wait_for_timeout(500)
        
        # Get the muscle groups container
        active_muscles_container = page.locator("text=Active Muscles").locator("xpath=../..")
        
        # Extract Lengthening muscles (for stretching exercises)
        try:
            lengthening_column = active_muscles_container.locator("text=Lengthening").locator("xpath=..")
            lengthening_text = await lengthening_column.inner_text()
            for line in lengthening_text.split('\n'):
                muscle = clean(line)
                if muscle and muscle not in ["Lengthening", "Lengthening:", "🔒", ""] and len(muscle) > 2:
                    lengthening_muscles.append(muscle)
            if lengthening_muscles:
                logger.info(f"  Found {len(lengthening_muscles)} lengthening muscles")
        except:
            pass
        
        # Extract Target muscles
        try:
            target_column = active_muscles_container.locator("text=Target").locator("xpath=..")
            target_text = await target_column.inner_text()
            for line in target_text.split('\n'):
                muscle = clean(line)
                if muscle and muscle not in ["Target", "Target:", "🔒", ""] and len(muscle) > 2:
                    target_muscles.append(muscle)
        except:
            pass
        
        # Extract Synergist muscles
        try:
            synergist_column = active_muscles_container.locator("text=Synergist").locator("xpath=..")
            synergist_text = await synergist_column.inner_text()
            for line in synergist_text.split('\n'):
                muscle = clean(line)
                if muscle and muscle not in ["Synergist", "Synergist:", "🔒", ""] and len(muscle) > 2:
                    synergist_muscles.append(muscle)
        except:
            pass
        
        # Extract Stabilizer muscles
        try:
            stabilizer_column = active_muscles_container.locator("text=Stabilizers").locator("xpath=..")
            stabilizer_text = await stabilizer_column.inner_text()
            for line in stabilizer_text.split('\n'):
                muscle = clean(line)
                if muscle and muscle not in ["Stabilizers", "Stabilizers:", "Stabilizer", "🔒", ""] and len(muscle) > 2:
                    stabilizer_muscles.append(muscle)
        except:
            pass
    except Exception:
        pass
    
    # Infer equipment
    equipment = infer_equipment(title, description)
    
    return {
        "title": title,
        "exercise_path": exercise_path,
        "url": url,
        "target_muscles": "; ".join(target_muscles),
        "lengthening_muscles": "; ".join(lengthening_muscles),
        "synergist_muscles": "; ".join(synergist_muscles),
        "stabilizer_muscles": "; ".join(stabilizer_muscles),
        "description": description,
        "equipment": equipment,
    }

async def collect_links_main():
    """Main function to collect all exercise links and save to CSV"""
    async with async_playwright() as pw:
        headless = bool(EMAIL and PASSWORD)
        browser = await pw.chromium.launch(headless=headless)
        ctx = await browser.new_context()
        page = await ctx.new_page()
        
        # Login if credentials provided
        if EMAIL and PASSWORD:
            await login(page)
        else:
            await page.goto(A2Z_URL)
            print(">>> Please log in manually...")
            try:
                await page.wait_for_selector("text=A-Z list", timeout=120000)
            except TimeoutError:
                pass
        
        # Collect exercise links
        links = await collect_exercise_links_only(page)
        
        # Apply limit if set
        if MAX_EXERCISES:
            links = links[:MAX_EXERCISES]
            print(f">>> Limited to {MAX_EXERCISES} exercises")
        
        # Save to CSV
        with LINKS_CSV.open("w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow(["title", "exercise_path"])
            for title, path in links:
                writer.writerow([title, path])
        
        logger.info(f"Saved {len(links)} exercise links to {LINKS_CSV}")
        await browser.close()

async def extract_details_main():
    """Main function to extract details for all exercises from links CSV"""
    
    # Check if links CSV exists
    if not LINKS_CSV.exists():
        logger.error(f"Error: {LINKS_CSV} not found. Run collect_links_main() first.")
        return
    
    # Read exercise links
    exercise_links = []
    with LINKS_CSV.open("r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            exercise_links.append((row["title"], row["exercise_path"]))
    
    # Check if we're resuming from an existing file
    processed_paths = set()
    resume_mode = FULL_CSV.exists()
    
    if resume_mode:
        # Read already processed exercise paths
        with FULL_CSV.open("r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                processed_paths.add(row["exercise_path"])
        logger.info(f"Resuming: {len(processed_paths)} exercises already processed")
        
        # Filter out already processed exercises
        exercise_links = [(title, path) for title, path in exercise_links 
                          if path not in processed_paths]
        logger.info(f"{len(exercise_links)} exercises remaining to process")
    
    # Apply MAX_EXERCISES limit for testing
    if MAX_EXERCISES:
        exercise_links = exercise_links[:MAX_EXERCISES]
        logger.info(f"Processing first {MAX_EXERCISES} exercises for testing")
    else:
        logger.info(f"Found {len(exercise_links)} exercises to process")
    
    async with async_playwright() as pw:
        headless = bool(EMAIL and PASSWORD)
        browser = await pw.chromium.launch(headless=headless)
        ctx = await browser.new_context()
        page = await ctx.new_page()
        
        # Login if credentials provided
        if EMAIL and PASSWORD:
            logger.info("Logging in...")
            await login(page)
        else:
            logger.info("Please log in manually...")
            await page.goto(A2Z_URL)
            try:
                await page.wait_for_selector("text=A-Z list", timeout=120000)
            except TimeoutError:
                pass
        
        # Open CSV in append mode if resuming, write mode if starting fresh
        mode = "a" if resume_mode else "w"
        with FULL_CSV.open(mode, newline="", encoding="utf-8") as f:
            fieldnames = ["title", "exercise_path", "url", "target_muscles", "lengthening_muscles",
                         "synergist_muscles", "stabilizer_muscles", "description", "equipment"]
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            
            # Only write header if starting fresh
            if not resume_mode:
                writer.writeheader()
            
            # Process each exercise
            total_to_process = len(exercise_links)
            starting_index = len(processed_paths) + 1 if resume_mode else 1
            
            for idx, (title, exercise_path) in enumerate(exercise_links, 1):
                actual_idx = starting_index + idx - 1
                
                # Double-check for duplicates before processing
                if exercise_path in processed_paths:
                    logger.info(f"[{actual_idx}] SKIP (already processed): {title}")
                    continue
                
                try:
                    logger.info(f"[{actual_idx}/{len(processed_paths) + total_to_process}] Processing: {title}")
                    data = await extract_exercise_details(page, title, exercise_path)
                    writer.writerow(data)
                    f.flush()  # Write immediately in case of interruption
                    
                    # Add to processed set to prevent duplicates within this session
                    processed_paths.add(exercise_path)
                    logger.info(f"[{actual_idx}] ✓ Completed: {title} (muscles: {len(data['target_muscles'].split(';') if data['target_muscles'] else [])})")
                    
                except Exception as e:
                    logger.error(f"[{actual_idx}] ERROR processing {title}: {e}")
        
        logger.info(f"Completed. Full details saved to {FULL_CSV}")
        await browser.close()

async def enrich_stretching_exercises():
    """Enrich exercises with empty target_muscles by extracting lengthening muscles"""
    
    # Check if CSV exists
    if not FULL_CSV.exists():
        logger.error(f"Error: {FULL_CSV} not found.")
        return
    
    # Read current data and find exercises with empty target_muscles
    import pandas as pd
    df = pd.read_csv(FULL_CSV)
    
    # Add lengthening_muscles column if it doesn't exist
    if 'lengthening_muscles' not in df.columns:
        # Add the column after target_muscles
        cols = df.columns.tolist()
        target_idx = cols.index('target_muscles')
        cols.insert(target_idx + 1, 'lengthening_muscles')
        df['lengthening_muscles'] = ''
        df = df[cols]
    
    # Find exercises with empty target_muscles that don't already have lengthening_muscles
    needs_enrichment = df[
        (df['target_muscles'].isna() | (df['target_muscles'] == '')) &
        (df['lengthening_muscles'].isna() | (df['lengthening_muscles'] == ''))
    ]
    logger.info(f"Found {len(needs_enrichment)} exercises that need lengthening muscle enrichment")
    
    if len(needs_enrichment) == 0:
        logger.info("No exercises need enrichment - all already have lengthening muscles")
        return
    
    # Limit to MAX_EXERCISES for testing if set
    if MAX_EXERCISES:
        needs_enrichment = needs_enrichment.head(MAX_EXERCISES)
        logger.info(f"Limited to first {MAX_EXERCISES} exercises for testing")
    
    empty_target = needs_enrichment  # Keep the original variable name for the rest of the function
    
    async with async_playwright() as pw:
        headless = bool(EMAIL and PASSWORD)
        browser = await pw.chromium.launch(headless=headless)
        ctx = await browser.new_context()
        page = await ctx.new_page()
        
        # Login if credentials provided
        if EMAIL and PASSWORD:
            logger.info("Logging in for enrichment...")
            await login(page)
        else:
            logger.info("Please log in manually...")
            await page.goto(A2Z_URL)
            try:
                await page.wait_for_selector("text=A-Z list", timeout=120000)
            except TimeoutError:
                pass
        
        # Process each exercise
        enriched_count = 0
        for idx, row in empty_target.iterrows():
            try:
                logger.info(f"[{enriched_count+1}/{len(empty_target)}] Enriching: {row['title']}")
                
                # Extract exercise details with lengthening muscles
                data = await extract_exercise_details(page, row['title'], row['exercise_path'])
                
                # Update the dataframe
                if data['lengthening_muscles']:
                    df.at[idx, 'lengthening_muscles'] = data['lengthening_muscles']
                    df.at[idx, 'target_muscles'] = data['target_muscles']  # In case any target muscles were found
                    logger.info(f"  ✓ Found lengthening muscles: {data['lengthening_muscles']}")
                    enriched_count += 1
                    
                    # Save incrementally every 5 exercises
                    if enriched_count % 5 == 0:
                        df.to_csv(FULL_CSV, index=False)
                        logger.info(f"  💾 Progress saved ({enriched_count} exercises enriched)")
                else:
                    logger.info(f"  ⚠ No lengthening muscles found")
                    
            except Exception as e:
                logger.error(f"  ERROR enriching {row['title']}: {e}")
        
        # Save the final enriched data
        df.to_csv(FULL_CSV, index=False)
        logger.info(f"Enrichment complete! Updated {enriched_count} exercises in {FULL_CSV}")
        
        await browser.close()

async def main():
    """Combined main function - collects links then extracts details"""
    # First collect links
    await collect_links_main()
    
    # Then extract details
    await extract_details_main()

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        if sys.argv[1] == "links":
            # Just collect links
            asyncio.run(collect_links_main())
        elif sys.argv[1] == "details":
            # Extract details from existing links
            asyncio.run(extract_details_main())
        elif sys.argv[1] == "enrich":
            # Enrich stretching exercises with lengthening muscles
            asyncio.run(enrich_stretching_exercises())
        else:
            print("Usage: python scrape_muscle_and_motion_v2.py [links|details|enrich]")
            print("  links   - Collect exercise links only")
            print("  details - Extract details from collected links")
            print("  enrich  - Enrich exercises with empty target_muscles (add lengthening muscles)")
            print("  (no arg) - Run both steps")
    else:
        # Run both steps
        asyncio.run(main())