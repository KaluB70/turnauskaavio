# 🎯 Turnauskaavio - Finnish Darts Tournament Manager

A comprehensive Angular 17 application for managing Finnish darts weekly tournaments with multiple tournament formats, player tracking, and season standings.

## 🚀 Features

- **Multiple Tournament Formats**: Automatically selects format based on player count
  - 3-5 players: Round-robin → top 3 to final
  - 6-8 players: 2 groups → group winners + playoff → 3-way final  
  - 9+ players: 3 groups → group winners → 3-way final

- **Season Management**: Track players across multiple weeks with ranking points system
- **Google Drive Integration**: Import/export tournament data in JSON format
- **Prize Pool Calculation**: Automatic calculation of weekly and season prizes
- **Player Management**: Recent player suggestions with autocomplete
- **Match Tracking**: Complete match history with leg differences
- **Tiebreaker System**: 9-dart challenge for tied players
- **Responsive Design**: Mobile-friendly interface with Tailwind CSS

## 🛠️ Development

### Prerequisites
- Node.js (18+)
- Angular CLI (17.3.5)

### Setup
```bash
npm install
ng serve
```

Navigate to `http://localhost:4200/`

### Build
```bash
ng build
```

Build artifacts are stored in the `dist/` directory.

### Testing
```bash
ng test
```

## 🏗️ Architecture

### Core Components
- **AppComponent**: Main navigation and routing
- **PlayerRegistrationComponent**: Tournament setup and player management
- **TournamentBracketComponent**: Live tournament display and match tracking
- **StandingsComponent**: Season statistics and prize calculations
- **RouletteComponent**: Visual player/group randomization

### Services
- **TournamentService**: Core business logic and state management
- **DriveService**: Google Drive API integration
- **SoundService**: Audio feedback system

### Data Flow
1. Player registration → Tournament format determination
2. Match generation with alternating order algorithm
3. Live match tracking with automatic progression
4. Tiebreaker resolution via 9-dart challenge
5. Final rankings and prize distribution
6. Season statistics aggregation

## 📊 Tournament System

### Scoring
- **Match Points**: 3 for win, 0 for loss
- **Season Points**: 5-3-1-0 for positions 1-4
- **Best 7 weeks** count for season standings

### Prize Distribution
- **Weekly**: 50% to winner (€2.50 × player count)
- **Season**: 50%/30%/20% split for top 3 (€10 per unique player + €2.50 per participation)

## 🔧 Configuration

### Google Drive Setup
1. Enable Google Drive API in Google Cloud Console
2. Create API key with Drive API access
3. Configure in Settings → Google Drive Integration
4. Share JSON data file publicly for read access

### Local Storage
- Tournament data: `darts_tournaments`
- Season results: `darts_results` 
- Recent players: `darts_recent_players`
- Drive config: `drive_config`

## 🚨 Recent Updates

- ✅ Fixed tiebreaker infinite loop issues
- ✅ Improved weeks played counting for all participants
- ✅ Added Google Drive JSON integration
- ✅ Enhanced season standings with individual medal counts
- ✅ Added player lists to week details view
- ✅ Cleaned up code quality and removed duplications

## 📝 License

This project is for managing Finnish darts tournaments and is built with Angular 17.
