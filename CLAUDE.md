/us# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Finnish darts tournament management system ("Turnauskaavio") built with Angular 17. It manages weekly darts competitions with different tournament formats, player tracking, and season standings.
More info of the tournament can be found at Darts_viikkokisat.md.

## Core Commands

- **Development server**: `ng serve` (runs on localhost:4200)
- **Build**: `ng build` (outputs to dist/turnaus)
- **Tests**: `ng test` (runs via Karma)
- **Watch mode**: `ng build --watch --configuration development`

## Architecture Overview

### Tournament Flow
The application follows a tournament lifecycle:
1. Player registration with game settings (301/501, best-of legs)
2. Tournament format determination (round-robin ≤5 players, 2 groups 6-8 players, 3 groups 9+ players)
3. Match progression through phases: group → playoff → final
4. Results storage and season tracking with prize calculations

### Core Components
- **AppComponent**: Main navigation between tournament and standings views
- **HomeComponent**: Displays ongoing tournaments with deletion capability
- **PlayerRegistrationComponent**: Handles player input, game settings, recent player suggestions with autocomplete
- **RouletteComponent**: Visual randomizer for match orders and groups (supports 2 or 3 groups)
- **TournamentViewComponent**: Tournament display with routing (tournament/:id)
- **TournamentBracketComponent**: Displays tournament brackets and standings for different formats
- **CurrentMatchComponent**: Handles match play including 3-way finals with leg tracking
- **MatchWinnerComponent**: Animated winner display with skip functionality (click/space/enter)
- **StandingsComponent**: Season statistics with individual medals, expanded week details, and Google Drive integration
- **SettingsComponent**: Google Drive configuration and data import/export management

### Core Services  
- **TournamentService**: Central business logic, localStorage persistence, tournament state management, tiebreaker resolution
- **DriveService**: Google Drive API integration for JSON data import/export
- **SoundService**: Audio feedback system for enhanced user experience

### Data Architecture
- **Tournament State**: Players, matches, standings, current phase tracking with tiebreaker resolution
- **Persistence**: localStorage with separate keys for results (`darts_results`), active tournaments (`darts_tournaments`), recent players (`darts_recent_players`), and Google Drive config (`drive_config`)
- **Season Tracking**: Week results with ranking points (5-3-1-0 system), best 7 weeks count for season, individual medal tracking
- **Prize System**: Total prize pool (10€ per unique player + 2.5€ per participation), weekly prizes (50% to winner), season distribution (50%/30%/20% for top 3)
- **Google Drive Integration**: JSON format import/export with automatic data merging and player population

### Tournament Formats
- **3-5 players**: Round-robin → top 3 to final
- **6-8 players**: 2 groups → group winners to final + playoff for 3rd place
- **9+ players**: 3 groups → group winners to final (3-way final)

### Match Scheduling
- **Alternating Order**: Sophisticated algorithm prevents consecutive matches for same players
- **Group Interleaving**: Matches from different groups are interleaved for better flow
- **3-Way Finals**: Special handling where tournament completes when 2 players reach winning legs (determines 2nd/3rd place)

### Component Patterns
- Standalone components with explicit imports
- Service injection for shared state (TournamentService)
- Template-driven forms with ngModel
- Conditional rendering with *ngIf
- LocalStorage integration for persistence
- CSS animations and transitions for visual feedback
- Responsive grid layouts with Tailwind CSS

## Key Features
- Real-time tournament progression with match-by-match updates
- Automatic tournament format selection based on player count (3 different formats)
- Season standings with prize pool calculations and weekly prize tracking
- Match winner animations with skip functionality
- Alternating match order to prevent consecutive games for same players
- Tournament state persistence with UUID-based sharing
- Active tournament management on homepage with deletion capability
- Data export/import via JSON for external analysis and Google Drive integration
- Recent player suggestions with autocomplete
- Responsive design with Tailwind CSS
- Tiebreaker system for tied players (9-dart challenge)

## Recent Improvements

### Code Quality Enhancements
- ✅ **Removed duplicated methods**: Eliminated `hasGroupTie()` duplicate and unused `getPlayerIdByName()` helper
- ✅ **Simplified merge logic**: Streamlined `mergeWeekResults()` with cleaner error handling
- ✅ **Consolidated phase descriptions**: Unified `getCurrentPhaseDescription()` to reuse existing logic
- ✅ **Optimized player population**: Improved `populateRecentPlayersFromData()` with better null checks

### Tournament Logic Fixes
- ✅ **Fixed tiebreaker infinite loop**: Updated `findUnresolvableTies()` to include tiebreaker scores in grouping key
- ✅ **Improved weeks played counting**: Now counts ALL tournament participants, not just finalists
- ✅ **Enhanced season standings**: Added individual medal tracking (🥇🥈🥉) instead of combined counts
- ✅ **Added player lists to week details**: Shows all participants in expanded week cards

### Data Integration
- ✅ **Google Drive API migration**: Moved from Sheets API to Drive API with JSON format
- ✅ **Automatic player population**: Recent players are populated from imported/loaded data
- ✅ **Improved data merging**: Better conflict resolution and data validation

## Development Notes
- Uses Angular standalone components (no modules)
- TailwindCSS for styling with custom CSS animations
- TypeScript with strict mode
- Finnish language UI
- Browser localStorage for all data persistence
- Component-level CSS with hover effects and transforms
- Event handling with proper focus management and user interaction validation

## Code Quality Standards
- No unused imports or methods
- No duplicated logic
- Simplified error handling with try-catch blocks
- Consistent variable naming and code structure
- Comprehensive documentation in CLAUDE.md and README.md
