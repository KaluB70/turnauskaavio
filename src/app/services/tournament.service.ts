import { Injectable } from '@angular/core';
import { DriveService } from './drive.service';
import { firstValueFrom } from 'rxjs';

export interface Player {
	id: number;
	name: string;
	group?: number;
}

export interface Match {
	id: number;
	player1Id: number;
	player2Id: number;
	player1Legs: number;
	player2Legs: number;
	winner: number | null;
	isComplete: boolean;
	round: 'group' | 'playoff' | 'final';
	group?: number;
	// Optional 3rd player for finals (when 3+ finalists)
	player3Id?: number;
	player3Legs?: number;
	// Track finish order for 3-way finals
	finishOrder?: number[]; // [winnerId, 2ndPlaceId, 3rdPlaceId]
}

export interface Standing {
	playerId: number;
	playerName: string;
	wins: number;
	losses: number;
	legDifference: number;
	points: number;
	group: number;
	tiebreakerScore?: number; // Added to resolve tiebreaker results
}

export interface MatchResult {
	player1Name: string;
	player2Name: string;
	player1Legs: number;
	player2Legs: number;
	winnerName: string;
	round: 'group' | 'playoff' | 'final';
	group?: number;
}

export interface WeekResult {
	weekNumber: number;
	players: Player[];
	finalRanking: { playerId: number; playerName: string; position: number; points: number }[];
	matches: MatchResult[];
	date: Date;
	gameMode: string;
}

export interface SeasonStanding {
	playerName: string;
	totalPoints: number;
	weeksPlayed: number;
	wins: number;
	podiumFinishes: number;
	goldMedals: number;
	silverMedals: number;
	bronzeMedals: number;
	averagePosition: number;
	weeklyResults: { week: number; position: number; points: number }[];
}

export type GameMode = '301' | '501';

const RESULTS_KEY = 'darts_results';
const TOURNAMENTS_KEY = 'darts_tournaments';

@Injectable({
	providedIn: 'root'
})
export class TournamentService {
	players: Player[] = [];
	matches: Match[] = [];
	standings: Standing[] = [];
	finalists: Player[] = [];

	currentMatch: Match | null = null;
	isStarted = false;
	gameMode: GameMode = '301';
	bestOfLegs = 3;
	weekNumber = 1;
	tournamentId: string | null = null;

	tournamentType: 'round-robin' | 'groups' | 'groups-3' = 'round-robin';
	currentPhase: 'group' | 'playoff' | 'final' = 'group';

	showMatchWinner = false;
	showRoulette = false;
	winnerName = '';

	// Tiebreaker state
	requiresTiebreaker = false;
	tiebreakerPlayers: Player[] = [];
	tiebreakerScores: Record<number, number[]> = {};

	// Tiebreaker UI state (for refresh persistence)
	tiebreakerUIState = {
		currentRoundScores: {} as Record<number, number[]>,
		showResults: false,
		results: [] as { playerName: string; total: number }[],
		stillTied: false
	};

	// Tournament completion state
	tournamentCompleted = false;

	weekResults: WeekResult[] = [];

	constructor(private driveService: DriveService) {
		this.loadWeekResults();
	}

	private loadWeekResults(): void {
		try {
			const saved = localStorage.getItem(RESULTS_KEY);
			if (saved) {
				const data = JSON.parse(saved);
				this.weekResults = data.map((item: any) => ({
					...item,
					date: new Date(item.date),
					matches: item.matches || [] // Add backwards compatibility for existing data
				}));
			}
		} catch (error) {
			console.error('Error loading data:', error);
		}
	}


	/**
	 * Load season data from Google Drive JSON file (read-only)
	 * This will merge with localStorage data, preferring localStorage for newer data
	 */
	async loadSeasonDataFromDrive(): Promise<void> {
		try {
			const driveData = await firstValueFrom(this.driveService.fetchFileContent());

			if (driveData && driveData.weekResults && driveData.weekResults.length > 0) {
				// Convert drive data to WeekResult format
				const driveWeekResults = this.convertDriveToWeekResults(driveData.weekResults);

				// Merge with existing localStorage data
				// localStorage takes priority for same week numbers
				this.weekResults = this.mergeWeekResults(driveWeekResults, this.weekResults);

				// Persist the merged data back to localStorage
				this.saveWeekResults();

				// Populate recent players from the loaded data
				this.populateRecentPlayersFromData();

				console.log(`Loaded ${driveWeekResults.length} week results from Google Drive and persisted to localStorage`);
			}
		} catch (error) {
			console.warn('Failed to load data from Google Drive:', error);
			// Continue with localStorage data only
		}
	}

	private convertDriveToWeekResults(driveWeekResults: any[]): WeekResult[] {
		// Drive data is already in WeekResult format (JSON), just need to normalize dates and validate
		return driveWeekResults
			.filter(week => week && week.weekNumber && week.players && week.finalRanking)
			.map(week => ({
				...week,
				// Ensure date is properly converted from string if needed
				date: typeof week.date === 'string' ? new Date(week.date) : week.date || new Date(),
				// Ensure matches array exists
				matches: week.matches || [],
				// Validate game mode
				gameMode: week.gameMode || '501',
				// Ensure all required properties exist
				players: week.players || [],
				finalRanking: week.finalRanking || []
			}))
			.sort((a, b) => a.weekNumber - b.weekNumber);
	}


	private mergeWeekResults(driveResults: WeekResult[], localResults: WeekResult[]): WeekResult[] {
		const merged = [ ...localResults ];
		let newWeeksAdded = 0;

		driveResults.forEach(driveResult => {
			const existingIndex = merged.findIndex(r => r.weekNumber === driveResult.weekNumber);
			if (existingIndex === -1) {
				merged.push(driveResult);
				newWeeksAdded++;
			}
		});

		console.log(`Merge complete: ${newWeeksAdded} new weeks added`);
		return merged.sort((a, b) => a.weekNumber - b.weekNumber);
	}

	/**
	 * Load Google Drive config from localStorage with fallback to sheets config
	 */
	loadDriveConfig(): { apiKey: string; fileId?: string } | null {
		let saved = localStorage.getItem('drive_config');
		if (!saved) {
			saved = localStorage.getItem('sheets_config');
		}

		if (saved) {
			try {
				const config = JSON.parse(saved);
				return {
					apiKey: config.apiKey || '',
					fileId: config.fileId || config.spreadsheetId || ''
				};
			} catch {
				return null;
			}
		}
		return null;
	}

	/**
	 * Configure Google Drive integration
	 */
	configureGoogleDrive(apiKey: string, fileId?: string): void {
		this.driveService.setConfig({
			apiKey,
			fileId
		});
	}

	saveWeekResults(): void {
		try {
			localStorage.setItem(RESULTS_KEY, JSON.stringify(this.weekResults));
		} catch (error) {
			console.error('Error saving data:', error);
		}
	}

	/**
	 * Get recent players from localStorage
	 */
	getRecentPlayers(): string[] {
		const RECENT_PLAYERS_KEY = 'darts_recent_players';
		try {
			const saved = localStorage.getItem(RECENT_PLAYERS_KEY);
			return saved ? JSON.parse(saved) : [];
		} catch {
			return [];
		}
	}

	/**
	 * Add a player to recent players list
	 */
	addRecentPlayer(name: string): void {
		const RECENT_PLAYERS_KEY = 'darts_recent_players';
		const MAX_RECENT_PLAYERS = 15;

		if (!name?.trim()) return;

		let recentPlayers = this.getRecentPlayers();
		recentPlayers = recentPlayers.filter(p => p.toLowerCase() !== name.toLowerCase());
		recentPlayers.unshift(name.trim());
		recentPlayers = recentPlayers.slice(0, MAX_RECENT_PLAYERS);

		try {
			localStorage.setItem(RECENT_PLAYERS_KEY, JSON.stringify(recentPlayers));
		} catch (error) {
			console.error('Failed to save recent players:', error);
		}
	}

	/**
	 * Extract unique player names from week results and populate recent players
	 */
	populateRecentPlayersFromData(): void {
		const RECENT_PLAYERS_KEY = 'darts_recent_players';
		const MAX_RECENT_PLAYERS = 15;

		const allPlayers = new Set<string>();

		this.weekResults.forEach(week => {
			week.players.forEach(player => {
				if (player.name?.trim()) {
					allPlayers.add(player.name.trim());
				}
			});

			week.finalRanking.forEach(ranking => {
				if (ranking.playerName?.trim()) {
					allPlayers.add(ranking.playerName.trim());
				}
			});
		});

		const uniquePlayers = Array.from(allPlayers).sort();

		let recentPlayers: string[] = [];
		try {
			const saved = localStorage.getItem(RECENT_PLAYERS_KEY);
			recentPlayers = saved ? JSON.parse(saved) : [];
		} catch {
			recentPlayers = [];
		}

		uniquePlayers.forEach(player => {
			recentPlayers = recentPlayers.filter(p => p.toLowerCase() !== player.toLowerCase());
			recentPlayers.unshift(player);
		});

		recentPlayers = recentPlayers.slice(0, MAX_RECENT_PLAYERS);

		try {
			localStorage.setItem(RECENT_PLAYERS_KEY, JSON.stringify(recentPlayers));
			console.log(`Updated recent players with ${uniquePlayers.length} players`);
		} catch (error) {
			console.error('Failed to save recent players:', error);
		}
	}

	private generateUUID(): string {
		return 'xxxx-xxxx-4xxx-yxxx'.replace(/[xy]/g, function(c) {
			const r = Math.random() * 16 | 0;
			const v = c == 'x' ? r : (r & 0x3 | 0x8);
			return v.toString(16);
		});
	}

	createTournament(): string {
		const uuid = this.generateUUID();
		this.tournamentId = uuid;
		this.saveTournamentState();
		return uuid;
	}

	loadTournament(uuid: string): boolean {
		try {
			const saved = localStorage.getItem(TOURNAMENTS_KEY);

			if (saved) {
				const tournaments = JSON.parse(saved);
				const tournament = tournaments[uuid];

				if (tournament) {
					// Restore tournament state
					this.players = tournament.players || [];
					this.matches = tournament.matches || [];
					this.standings = tournament.standings || [];
					this.finalists = tournament.finalists || [];
					this.currentMatch = tournament.currentMatch;
					this.isStarted = tournament.isStarted || false;
					this.gameMode = tournament.gameMode;
					this.bestOfLegs = tournament.bestOfLegs;
					this.weekNumber = tournament.weekNumber;
					this.tournamentId = uuid;
					this.tournamentType = tournament.tournamentType;
					this.currentPhase = tournament.currentPhase;
					this.showMatchWinner = false; // Always reset animation states
					this.showRoulette = tournament.showRoulette || false;
					this.winnerName = tournament.winnerName || '';
					this.requiresTiebreaker = tournament.requiresTiebreaker || false;
					this.tiebreakerPlayers = tournament.tiebreakerPlayers || [];
					this.tiebreakerScores = tournament.tiebreakerScores || {};
					this.tiebreakerUIState = tournament.tiebreakerUIState || {
						currentRoundScores: {},
						showResults: false,
						results: [],
						stillTied: false
					};
					this.tournamentCompleted = tournament.tournamentCompleted || false;

					// Ensure tiebreaker is properly initialized if we're in tiebreaker mode
					if (this.requiresTiebreaker && this.tiebreakerPlayers.length > 0) {
						this.initializeTiebreaker();
					}

					// Safety check: if no current match but incomplete matches exist, find next match
					if (!this.currentMatch && this.isStarted && !this.requiresTiebreaker && !this.tournamentCompleted) {
						const incompleteMatch = this.matches.find(m => !m.isComplete);
						if (incompleteMatch) {
							this.currentMatch = incompleteMatch;
						}
					}

					return true;
				}
			}
		} catch (error) {
			console.error('Error loading tournament:', error);
		}
		return false;
	}

	saveTournamentState(): void {
		if (!this.tournamentId) return;

		try {
			const saved = localStorage.getItem(TOURNAMENTS_KEY);
			const tournaments = saved ? JSON.parse(saved) : {};

			tournaments[this.tournamentId] = {
				players: this.players,
				matches: this.matches,
				standings: this.standings,
				finalists: this.finalists,
				currentMatch: this.currentMatch,
				isStarted: this.isStarted,
				gameMode: this.gameMode,
				bestOfLegs: this.bestOfLegs,
				weekNumber: this.weekNumber,
				tournamentType: this.tournamentType,
				currentPhase: this.currentPhase,
				winnerName: this.winnerName,
				showRoulette: this.showRoulette,
				requiresTiebreaker: this.requiresTiebreaker,
				tiebreakerPlayers: this.tiebreakerPlayers,
				tiebreakerScores: this.tiebreakerScores,
				tiebreakerUIState: this.tiebreakerUIState,
				tournamentCompleted: this.tournamentCompleted,
				lastUpdated: new Date(),
			};

			localStorage.setItem(TOURNAMENTS_KEY, JSON.stringify(tournaments));
		} catch (error) {
			console.error('Error saving tournament state:', error);
		}
	}

	deleteTournament(uuid: string): void {
		try {
			const saved = localStorage.getItem(TOURNAMENTS_KEY);
			if (saved) {
				const tournaments = JSON.parse(saved);
				delete tournaments[uuid];
				localStorage.setItem(TOURNAMENTS_KEY, JSON.stringify(tournaments));
			}
		} catch (error) {
			console.error('Error deleting tournament:', error);
		}
	}

	reset(): void {
		this.players = [];
		this.matches = [];
		this.standings = [];
		this.finalists = [];
		this.currentMatch = null;
		this.isStarted = false;
		this.currentPhase = 'group';
		this.showMatchWinner = false;
		this.showRoulette = false;
		this.winnerName = '';
		this.tournamentId = null;
		this.requiresTiebreaker = false;
		this.tiebreakerPlayers = [];
		this.tiebreakerScores = {};
		this.tournamentCompleted = false;
	}

	hasResults(): boolean {
		return this.weekResults.length > 0;
	}

	register(playerNames: string[], gameMode: GameMode, bestOfLegs: number, weekNumber: number): string {
		this.reset();
		this.gameMode = gameMode;
		this.bestOfLegs = bestOfLegs;
		this.weekNumber = weekNumber;

		this.players = playerNames.map((name, index) => ({
			id: index + 1,
			name: name.trim()
		}));

		if (this.players.length < 3) {
			throw new Error('Vähintään 3 pelaajaa tarvitaan');
		}

		this.determineTournamentType();

		const uuid = this.createTournament();

		this.setupTournament();

		this.showRoulette = true;
		this.saveTournamentState();
		return uuid;
	}

	private determineTournamentType(): void {
		if (this.players.length <= 5) {
			this.tournamentType = 'round-robin';
		} else if (this.players.length <= 8) {
			this.tournamentType = 'groups';
		} else {
			this.tournamentType = 'groups-3';
		}
	}

	setupTournament(): void {
		if (this.tournamentType === 'round-robin') {
			this.setupRoundRobin();
		} else if (this.tournamentType === 'groups') {
			this.setupGroups();
		} else {
			this.setupThreeGroups();
		}
		this.saveTournamentState();
	}

	private setupRoundRobin(): void {
		this.matches = [];
		let matchId = 1;

		// Create all matches first
		const allMatches: {player1Id: number, player2Id: number}[] = [];
		for (let i = 0; i < this.players.length; i++) {
			for (let j = i + 1; j < this.players.length; j++) {
				allMatches.push({
					player1Id: this.players[i].id,
					player2Id: this.players[j].id
				});
			}
		}

		// Sort matches to alternate players better
		const sortedMatches = this.alternateMatchOrder(allMatches);

		// Create match objects
		sortedMatches.forEach(match => {
			this.matches.push({
				id: matchId++,
				player1Id: match.player1Id,
				player2Id: match.player2Id,
				player1Legs: 0,
				player2Legs: 0,
				winner: null,
				isComplete: false,
				round: 'group'
			});
		});

		this.standings = this.players.map(player => ({
			playerId: player.id,
			playerName: player.name,
			wins: 0,
			losses: 0,
			legDifference: 0,
			points: 0,
			group: 1
		}));
	}

	private setupGroups(): void {
		this.matches = [];
		const shuffled = [ ...this.players ].sort(() => Math.random() - 0.5);
		const group1Size = Math.ceil(shuffled.length / 2);

		shuffled.forEach((player, index) => {
			player.group = index < group1Size ? 1 : 2;
		});

		let matchId = 1;
		const allGroupMatches: {player1Id: number, player2Id: number, group: number}[] = [];

		// Create all matches for each group
		[ 1, 2 ].forEach(groupNum => {
			const groupPlayers = shuffled.filter(p => p.group === groupNum);
			const groupMatches: {player1Id: number, player2Id: number}[] = [];

			for (let i = 0; i < groupPlayers.length; i++) {
				for (let j = i + 1; j < groupPlayers.length; j++) {
					groupMatches.push({
						player1Id: groupPlayers[i].id,
						player2Id: groupPlayers[j].id
					});
				}
			}

			// Sort matches within each group for better alternation
			const sortedGroupMatches = this.alternateMatchOrder(groupMatches);
			sortedGroupMatches.forEach(match => {
				allGroupMatches.push({ ...match, group: groupNum });
			});
		});

		// Interleave matches between groups for better overall flow
		const interleavedMatches = this.interleaveGroupMatches(allGroupMatches);

		// Create match objects
		interleavedMatches.forEach(match => {
			this.matches.push({
				id: matchId++,
				player1Id: match.player1Id,
				player2Id: match.player2Id,
				player1Legs: 0,
				player2Legs: 0,
				winner: null,
				isComplete: false,
				round: 'group',
				group: match.group
			});
		});

		this.standings = this.players.map(player => ({
			playerId: player.id,
			playerName: player.name,
			wins: 0,
			losses: 0,
			legDifference: 0,
			points: 0,
			group: player.group || 1
		}));
	}

	private setupThreeGroups(): void {
		this.matches = [];
		const shuffled = [ ...this.players ].sort(() => Math.random() - 0.5);
		const playersPerGroup = Math.ceil(shuffled.length / 3);

		shuffled.forEach((player, index) => {
			player.group = Math.floor(index / playersPerGroup) + 1;
		});

		let matchId = 1;
		const allGroupMatches: {player1Id: number, player2Id: number, group: number}[] = [];

		// Create all matches for each group
		[ 1, 2, 3 ].forEach(groupNum => {
			const groupPlayers = shuffled.filter(p => p.group === groupNum);
			const groupMatches: {player1Id: number, player2Id: number}[] = [];

			for (let i = 0; i < groupPlayers.length; i++) {
				for (let j = i + 1; j < groupPlayers.length; j++) {
					groupMatches.push({
						player1Id: groupPlayers[i].id,
						player2Id: groupPlayers[j].id
					});
				}
			}

			// Sort matches within each group for better alternation
			const sortedGroupMatches = this.alternateMatchOrder(groupMatches);
			sortedGroupMatches.forEach(match => {
				allGroupMatches.push({ ...match, group: groupNum });
			});
		});

		// Interleave matches between groups for better overall flow
		const interleavedMatches = this.interleaveGroupMatches(allGroupMatches);

		// Create match objects
		interleavedMatches.forEach(match => {
			this.matches.push({
				id: matchId++,
				player1Id: match.player1Id,
				player2Id: match.player2Id,
				player1Legs: 0,
				player2Legs: 0,
				winner: null,
				isComplete: false,
				round: 'group',
				group: match.group
			});
		});

		this.standings = this.players.map(player => ({
			playerId: player.id,
			playerName: player.name,
			wins: 0,
			losses: 0,
			legDifference: 0,
			points: 0,
			group: player.group || 1
		}));
	}

	private alternateMatchOrder(matches: {player1Id: number, player2Id: number}[]): {player1Id: number, player2Id: number}[] {
		const result: {player1Id: number, player2Id: number}[] = [];
		const remaining = [ ...matches ];
		const playerLastMatchIndex: Record<number, number> = {};

		while (remaining.length > 0) {
			// Find the best match to add next - one where both players haven't played recently
			let bestMatchIndex = 0;
			let bestScore = -1;

			for (let i = 0; i < remaining.length; i++) {
				const match = remaining[i];
				const player1LastIndex = playerLastMatchIndex[match.player1Id] ?? -10;
				const player2LastIndex = playerLastMatchIndex[match.player2Id] ?? -10;

				// Score based on how long ago each player last played (higher is better)
				const score = (result.length - player1LastIndex) + (result.length - player2LastIndex);

				if (score > bestScore) {
					bestScore = score;
					bestMatchIndex = i;
				}
			}

			// Add the best match
			const selectedMatch = remaining.splice(bestMatchIndex, 1)[0];
			result.push(selectedMatch);
			playerLastMatchIndex[selectedMatch.player1Id] = result.length - 1;
			playerLastMatchIndex[selectedMatch.player2Id] = result.length - 1;
		}

		return result;
	}

	private interleaveGroupMatches(groupMatches: {player1Id: number, player2Id: number, group: number}[]): {player1Id: number, player2Id: number, group: number}[] {
		// Group matches by group number
		const matchesByGroup: Record<number, {player1Id: number, player2Id: number, group: number}[]> = {};
		groupMatches.forEach(match => {
			if (!matchesByGroup[match.group]) {
				matchesByGroup[match.group] = [];
			}
			matchesByGroup[match.group].push(match);
		});

		const result: {player1Id: number, player2Id: number, group: number}[] = [];
		const groups = Object.keys(matchesByGroup).map(Number).sort();
		let currentGroupIndex = 0;

		// Interleave matches from different groups
		while (Object.values(matchesByGroup).some(matches => matches.length > 0)) {
			const currentGroup = groups[currentGroupIndex];
			if (matchesByGroup[currentGroup] && matchesByGroup[currentGroup].length > 0) {
				result.push(matchesByGroup[currentGroup].shift()!);
			}
			currentGroupIndex = (currentGroupIndex + 1) % groups.length;
		}

		return result;
	}

	startTournament(): void {
		this.showRoulette = false;
		this.isStarted = true;
		this.findNextMatch();
		this.saveTournamentState();
	}

	findNextMatch(): void {
		if (this.showMatchWinner) return;

		if (this.currentPhase === 'group') {
			const nextMatch = this.matches.find(m => !m.isComplete && m.round === 'group');
			if (nextMatch) {
				this.currentMatch = nextMatch;
				return;
			}

			this.currentMatch = null;
			if (this.tournamentType === 'round-robin') {
				// Check for ties that need tiebreaker
				if (this.hasUnresolvableTie()) {
					// Tournament stuck waiting for tiebreaker resolution
					this.initializeTiebreaker();
					this.saveTournamentState();
					return;
				}

				// For 3-player tournaments, complete immediately since all matches are final
				if (this.players.length === 3) {
					this.completeTournament();
					return;
				}
			}

			this.transitionPhase();
		} else if (this.currentPhase === 'playoff') {
			const nextMatch = this.matches.find(m => !m.isComplete && m.round === 'playoff');
			if (nextMatch) {
				this.currentMatch = nextMatch;
				return;
			}

			this.currentMatch = null;
			this.currentPhase = 'final';
			this.createFinalMatch();
		} else if (this.currentPhase === 'final') {
			const nextMatch = this.matches.find(m => !m.isComplete && m.round === 'final');
			if (nextMatch) {
				this.currentMatch = nextMatch;
				return;
			}

			this.currentMatch = null;
			this.completeTournament();
		}
	}

	private transitionPhase(): void {
		this.updateStandings();

		// Check for group-level tiebreakers before proceeding
		if (this.requiresGroupTiebreakers()) {
			return; // Wait for tiebreaker resolution
		}

		if (this.tournamentType === 'round-robin') {
			this.createFinals(3);
		} else if (this.tournamentType === 'groups') {
			this.createPlayoff();
		} else {
			this.createThreeGroupFinals();
		}
	}

	private transitionPhaseAfterTiebreaker(): void {
		this.updateStandings();

		// Check if there are more group tiebreakers needed
		// The new logic will handle multiple group tiebreakers sequentially
		if (this.requiresGroupTiebreakers()) {
			return; // Another group needs tiebreaker resolution
		}

		// No more tiebreakers needed, proceed to next phase
		if (this.tournamentType === 'round-robin') {
			this.createFinals(3);
		} else if (this.tournamentType === 'groups') {
			this.createPlayoff();
		} else {
			this.createThreeGroupFinals();
		}
	}

	private createFinals(count: number): void {
		const sorted = this.getSortedStandings();
		this.finalists = sorted.slice(0, count).map(s =>
			this.players.find(p => p.id === s.playerId)!
		);

		if (this.finalists.length === 3) {
			const maxId = this.matches.length > 0 ? Math.max(...this.matches.map(m => m.id)) : 0;
			this.matches.push({
				id: maxId + 1,
				player1Id: this.finalists[0].id,
				player2Id: this.finalists[1].id,
				player1Legs: 0,
				player2Legs: 0,
				winner: null,
				isComplete: false,
				round: 'final',
				player3Id: this.finalists[2].id,
				player3Legs: 0
			});
		}

		this.currentPhase = 'final';
		this.saveTournamentState();
		this.findNextMatch();
	}

	private createPlayoff(): void {
		const group1 = this.getGroupStandings(1);
		const group2 = this.getGroupStandings(2);

		this.finalists = [
			this.players.find(p => p.id === group1[0].playerId)!,
			this.players.find(p => p.id === group2[0].playerId)!
		];

		if (group1[1] && group2[1]) {
			const maxId = this.matches.length > 0 ? Math.max(...this.matches.map(m => m.id)) : 0;
			this.matches.push({
				id: maxId + 1,
				player1Id: group1[1].playerId,
				player2Id: group2[1].playerId,
				player1Legs: 0,
				player2Legs: 0,
				winner: null,
				isComplete: false,
				round: 'playoff'
			});
		}

		this.currentPhase = 'playoff';
		this.saveTournamentState();
		this.findNextMatch();
	}

	private createThreeGroupFinals(): void {
		const group1 = this.getGroupStandings(1);
		const group2 = this.getGroupStandings(2);
		const group3 = this.getGroupStandings(3);

		this.finalists = [
			this.players.find(p => p.id === group1[0].playerId)!,
			this.players.find(p => p.id === group2[0].playerId)!,
			this.players.find(p => p.id === group3[0].playerId)!
		];

		this.currentPhase = 'final';
		this.saveTournamentState();
		this.createFinalMatch();
	}

	private createFinalMatch(): void {
		if (this.finalists.length === 3) {
			const maxId = this.matches.length > 0 ? Math.max(...this.matches.map(m => m.id)) : 0;
			this.matches.push({
				id: maxId + 1,
				player1Id: this.finalists[0].id,
				player2Id: this.finalists[1].id,
				player1Legs: 0,
				player2Legs: 0,
				winner: null,
				isComplete: false,
				round: 'final',
				player3Id: this.finalists[2].id,
				player3Legs: 0
			});
		}
		this.saveTournamentState();
		this.findNextMatch();
	}

	completeMatch(winnerId: number): void {
		if (!this.currentMatch) return;

		this.currentMatch.winner = winnerId;
		this.currentMatch.isComplete = true;
		this.winnerName = this.getPlayerName(winnerId);

		if (this.currentMatch.round === 'playoff') {
			this.finalists.push(this.players.find(p => p.id === winnerId)!);
		}

		this.updateStandings();

		// Check if this completes the tournament
		if (this.isTournamentComplete()) {
			this.completeTournament();
			return;
		}

		this.showMatchWinner = true;
		setTimeout(() => {
			this.showMatchWinner = false;
			this.findNextMatch();
		}, 3000);
	}

	updateStandings(): void {
		this.standings.forEach(s => {
			s.wins = 0;
			s.losses = 0;
			s.legDifference = 0;
			s.points = 0;
		});

		this.matches.filter(m => m.isComplete).forEach(match => {
			const p1 = this.standings.find(s => s.playerId === match.player1Id)!;
			const p2 = this.standings.find(s => s.playerId === match.player2Id)!;

			p1.legDifference += match.player1Legs - match.player2Legs;
			p2.legDifference += match.player2Legs - match.player1Legs;

			if (match.winner === match.player1Id) {
				p1.wins++;
				p1.points += 3;
				p2.losses++;
			} else {
				p2.wins++;
				p2.points += 3;
				p1.losses++;
			}
		});

		this.saveTournamentState();
	}

	private completeTournament(): void {
		this.updateStandings();

		// For 3-way finals, use the finish order from the final match
		let finalRanking;
		const finalMatch = this.matches.find(m => m.round === 'final' && m.isComplete);

		if (finalMatch && finalMatch.finishOrder && finalMatch.finishOrder.length >= 2) {
			// Build ranking based on finish order for 3-way final
			const rankedPlayers = [];

			// Add finished players in order
			finalMatch.finishOrder.forEach(playerId => {
				rankedPlayers.push({
					playerId,
					playerName: this.getPlayerName(playerId)
				});
			});

			// Add any remaining player (who didn't finish) as last
			const allFinalPlayers = [ finalMatch.player1Id, finalMatch.player2Id, finalMatch.player3Id! ];
			const unfinishedPlayer = allFinalPlayers.find(id => !finalMatch.finishOrder!.includes(id));
			if (unfinishedPlayer) {
				rankedPlayers.push({
					playerId: unfinishedPlayer,
					playerName: this.getPlayerName(unfinishedPlayer)
				});
			}

			finalRanking = rankedPlayers.map((player, index) => ({
				playerId: player.playerId,
				playerName: player.playerName,
				position: index + 1,
				points: [ 5, 3, 1, 0 ][index] || 0
			}));
		} else {
			// Use regular standings for non-3-way finals
			finalRanking = this.getSortedStandings().map((s, index) => ({
				playerId: s.playerId,
				playerName: s.playerName,
				position: index + 1,
				points: [ 5, 3, 1, 0 ][index] || 0
			}));
		}

		// Convert matches to MatchResult format for storage
		const matchResults: MatchResult[] = this.matches
			.filter(match => match.isComplete)
			.map(match => ({
				player1Name: this.getPlayerName(match.player1Id),
				player2Name: this.getPlayerName(match.player2Id),
				player1Legs: match.player1Legs,
				player2Legs: match.player2Legs,
				winnerName: this.getPlayerName(match.winner!),
				round: match.round,
				group: match.group
			}));

		this.weekResults.push({
			weekNumber: this.weekNumber,
			players: [ ...this.players ],
			finalRanking,
			matches: matchResults,
			date: new Date(),
			gameMode: this.gameMode
		});

		this.saveWeekResults();

		// Mark tournament as completed
		this.tournamentCompleted = true;
		this.saveTournamentState();

		// Delete the tournament from active tournaments since it's complete
		if (this.tournamentId) {
			setTimeout(() => {
				this.deleteTournament(this.tournamentId!);
			}, 1000);
		}
	}

	isTournamentComplete(): boolean {
		if (this.tournamentType === 'round-robin' && this.players.length === 3) {
			// For 3 players, complete when all group matches are done
			const groupMatches = this.matches.filter(m => m.round === 'group');
			const allMatchesComplete = groupMatches.length > 0 && groupMatches.every(m => m.isComplete);

			if (allMatchesComplete) {
				// Check for ties that require 9-dart tiebreaker
				if (this.hasUnresolvableTie()) {
					return false; // Tournament not complete until tie is resolved
				}
			}

			return allMatchesComplete;
		}

		if (this.currentPhase === 'final') {
			const finalMatches = this.matches.filter(m => m.round === 'final');
			return finalMatches.length > 0 && finalMatches.every(m => m.isComplete);
		}

		return false;
	}

	private requiresGroupTiebreakers(): boolean {
		// For group-based tournaments, check each group for unresolvable ties
		if (this.tournamentType === 'groups' || this.tournamentType === 'groups-3') {
			const groupCount = this.tournamentType === 'groups-3' ? 3 : 2;

			// First, check all groups for ties without setting up tiebreakers
			const groupsWithTies: number[] = [];
			for (let groupNum = 1; groupNum <= groupCount; groupNum++) {
				if (this.checkGroupHasTie(groupNum)) {
					groupsWithTies.push(groupNum);
				}
			}

			// If we found groups with ties, set up tiebreaker for the first one
			if (groupsWithTies.length > 0) {
				this.setupGroupTiebreaker(groupsWithTies[0]);
				return true;
			}
		} else if (this.tournamentType === 'round-robin' && this.players.length === 3) {
			// For 3-player round-robin, check for overall tie
			return this.hasUnresolvableTie();
		}

		return false;
	}

	private checkGroupHasTie(groupNum: number): boolean {
		// Check if a group has ties without setting up tiebreakers
		const groupStandings = this.getGroupStandings(groupNum);
		const tiedGroups = this.findUnresolvableTies(groupStandings);
		return tiedGroups.length > 0;
	}

	private setupGroupTiebreaker(groupNum: number): void {
		// Set up tiebreaker for a specific group
		const groupStandings = this.getGroupStandings(groupNum);
		const tiedGroups = this.findUnresolvableTies(groupStandings);

		if (tiedGroups.length > 0) {
			this.requiresTiebreaker = true;
			this.tiebreakerPlayers = tiedGroups.map(s =>
				this.players.find(p => p.id === s.playerId)!
			);
			this.initializeTiebreaker();
			this.saveTournamentState();
		}
	}


	private findUnresolvableTies(standings: Standing[]): Standing[] {
		// Group players by points, leg difference, and tiebreaker score
		const groups: Record<string, Standing[]> = {};

		standings.forEach(standing => {
			const tiebreakerScore = standing.tiebreakerScore || 0;
			const key = `${standing.points}-${standing.legDifference}-${tiebreakerScore}`;
			if (!groups[key]) {
				groups[key] = [];
			}
			groups[key].push(standing);
		});

		// Find the highest scoring group that has ties
		const sortedGroupKeys = Object.keys(groups).sort((a, b) => {
			const [ aPoints, aLegDiff ] = a.split('-').map(Number);
			const [ bPoints, bLegDiff ] = b.split('-').map(Number);
			if (aPoints !== bPoints) return bPoints - aPoints;
			return bLegDiff - aLegDiff;
		});

		for (const key of sortedGroupKeys) {
			const group = groups[key];
			if (group.length >= 2) {
				// Check if head-to-head can resolve the tie for 2-player ties
				if (group.length === 2 && this.canResolveByHeadToHead(group[0], group[1])) {
					continue; // This tie can be resolved by head-to-head
				}

				// Unresolvable tie found (3+ players or 2 players with no head-to-head resolution)
				return group;
			}
		}
		return [];
	}

	private canResolveByHeadToHead(player1: Standing, player2: Standing): boolean {
		const headToHeadResult = this.getHeadToHeadResult(player1.playerId, player2.playerId);
		return headToHeadResult !== null;
	}

	private hasUnresolvableTie(): boolean {
		this.updateStandings();
		const sorted = this.getSortedStandings();

		// Use the same logic as group tiebreakers to find any unresolvable ties
		const tiedPlayers = this.findUnresolvableTies(sorted);

		if (tiedPlayers.length > 0) {
			// Set up tiebreaker
			this.requiresTiebreaker = true;
			this.tiebreakerPlayers = tiedPlayers.map(s =>
				this.players.find(p => p.id === s.playerId)!
			);
			return true;
		}

		return false;
	}

	initializeTiebreaker(): void {
		// Initialize core tiebreaker data if not present
		if (!this.tiebreakerScores || Object.keys(this.tiebreakerScores).length === 0) {
			this.tiebreakerScores = {};
			this.tiebreakerPlayers.forEach(player => {
				this.tiebreakerScores[player.id] = [];
			});
		}

		// Initialize UI state only if it doesn't exist or is empty
		// This preserves state during page refreshes
		const hasExistingUIState = this.tiebreakerUIState.currentRoundScores &&
			Object.keys(this.tiebreakerUIState.currentRoundScores).length > 0;

		if (!hasExistingUIState) {
			this.tiebreakerUIState = {
				currentRoundScores: {},
				showResults: false,
				results: [],
				stillTied: false
			};

			this.tiebreakerPlayers.forEach(player => {
				this.tiebreakerUIState.currentRoundScores[player.id] = new Array(9).fill(0);
			});
		}
	}

	addTiebreakerScore(playerId: number, score: number): void {
		if (this.tiebreakerScores[playerId]) {
			this.tiebreakerScores[playerId].push(score);
		}
	}

	// Methods for tiebreaker UI state management
	updateTiebreakerUIState(uiState: {
		currentRoundScores?: Record<number, number[]>,
		showResults?: boolean,
		results?: { playerName: string; total: number }[],
		stillTied?: boolean
	}): void {
		this.tiebreakerUIState = { ...this.tiebreakerUIState, ...uiState };
		this.saveTournamentState();
	}

	getTiebreakerTotals(): { playerId: number; playerName: string; total: number }[] {
		return this.tiebreakerPlayers.map(player => ({
			playerId: player.id,
			playerName: player.name,
			total: this.tiebreakerScores[player.id]?.reduce((sum, score) => sum + score, 0) || 0
		})).sort((a, b) => b.total - a.total);
	}

	resolveTiebreaker(): void {
		const totals = this.getTiebreakerTotals();

		// Check if there's still a tie
		if (totals.length >= 2 && totals[0].total === totals[1].total) {
			// Still tied, need another round
			this.tiebreakerPlayers.forEach(player => {
				this.tiebreakerScores[player.id] = [];
			});
			return;
		}

		// Tie resolved
		this.requiresTiebreaker = false;
		this.tiebreakerPlayers = [];
		this.tiebreakerScores = {};
		// Clear UI state as well
		this.tiebreakerUIState = {
			currentRoundScores: {},
			showResults: false,
			results: [],
			stillTied: false
		};
		this.saveTournamentState();

		// Update standings to reflect tiebreaker results
		// The tiebreaker winner should be ranked higher in the final standings
		this.applyTiebreakerResults(totals);

		// Continue with tournament progression
		if (this.tournamentType === 'round-robin' && this.players.length === 3) {
			this.completeTournament();
		} else {
			// For all other cases, continue to next phase
			// Skip tiebreaker check since we just resolved one
			this.transitionPhaseAfterTiebreaker();
		}
	}

	private applyTiebreakerResults(totals: { playerId: number; playerName: string; total: number }[]): void {
		// Apply tiebreaker scores to standings to permanently resolve the tie
		totals.forEach((total, index) => {
			const standing = this.standings.find(s => s.playerId === total.playerId);
			if (standing) {
				// Set tiebreaker score: higher index = lower score (since totals are sorted by tiebreaker result)
				// This ensures the tiebreaker winner has the highest tiebreaker score
				standing.tiebreakerScore = 1000 - index; // 1000, 999, 998, etc.
			}
		});

		// Resort standings using the new tiebreaker scores
		this.updateStandings();
	}

	setCurrentMatch(matchId: number): void {
		const match = this.matches.find(m => m.id === matchId);
		if (match) {
			this.currentMatch = match;
			this.saveTournamentState();
		}
	}

	canEditMatch(match: Match): boolean {
		// Can edit any match except final matches that are complete
		return !(match.round === 'final' && match.isComplete);
	}

	getSortedStandings(): Standing[] {
		return [ ...this.standings ].sort((a, b) => {
			// First by points
			if (a.points !== b.points) return b.points - a.points;

			// If tied, check head-to-head for 2-player ties
			if (a.points === b.points && this.standings.filter(s => s.points === a.points).length === 2) {
				const headToHead = this.getHeadToHeadResult(a.playerId, b.playerId);
				if (headToHead !== null) return headToHead;
			}

			// Then by leg difference
			if (b.legDifference !== a.legDifference) return b.legDifference - a.legDifference;

			// If still tied, check tiebreaker scores (higher is better)
			const aTiebreaker = a.tiebreakerScore || 0;
			const bTiebreaker = b.tiebreakerScore || 0;
			if (aTiebreaker !== bTiebreaker) return bTiebreaker - aTiebreaker;

			// If still tied, requires manual tiebreaker (9 dart challenge)
			// For now, maintain current order as manual resolution needed
			return 0;
		});
	}

	getGroupStandings(groupNum: number): Standing[] {
		return this.getSortedStandings().filter(s => s.group === groupNum);
	}

	private getHeadToHeadResult(player1Id: number, player2Id: number): number | null {
		const match = this.matches.find(m =>
			m.isComplete &&
			((m.player1Id === player1Id && m.player2Id === player2Id) ||
			 (m.player1Id === player2Id && m.player2Id === player1Id))
		);

		if (!match) return null;

		// Return negative for player1 wins, positive for player2 wins
		if (match.winner === player1Id) return -1;
		if (match.winner === player2Id) return 1;
		return null;
	}

	getPlayerName(playerId: number): string {
		return this.players.find(p => p.id === playerId)?.name || 'Unknown';
	}

	getCurrentPhaseDescription(): string {
		return this.getPhaseDescription(this.currentPhase, this.tournamentType);
	}

	is3WayFinal(): boolean {
		return this.currentMatch?.player3Id !== undefined;
	}

	getSeasonStandings(): SeasonStanding[] {
		const playerStats: Record<string, SeasonStanding> = {};

		this.weekResults.forEach(week => {
			// Count weeks played by checking ALL players in the tournament
			week.players.forEach(player => {
				if (!playerStats[player.name]) {
					playerStats[player.name] = {
						playerName: player.name,
						totalPoints: 0,
						weeksPlayed: 0,
						wins: 0,
						podiumFinishes: 0,
						goldMedals: 0,
						silverMedals: 0,
						bronzeMedals: 0,
						averagePosition: 0,
						weeklyResults: []
					};
				}

				const playerStat = playerStats[player.name];
				playerStat.weeksPlayed++;

				// Now find this player's ranking in finalRanking for points/position
				const ranking = week.finalRanking.find(r => r.playerName === player.name);
				if (ranking) {
					playerStat.weeklyResults.push({
						week: week.weekNumber,
						position: ranking.position,
						points: ranking.points
					});

					if (ranking.position === 1) {
						playerStat.wins++;
						playerStat.goldMedals++;
					}
					if (ranking.position === 2) playerStat.silverMedals++;
					if (ranking.position === 3) playerStat.bronzeMedals++;
					if (ranking.position <= 3) playerStat.podiumFinishes++;
				} else {
					// Player participated but not in finalRanking (eliminated in groups)
					// Give them last position for average calculation
					const lastPosition = week.players.length;
					playerStat.weeklyResults.push({
						week: week.weekNumber,
						position: lastPosition,
						points: 0
					});
				}
			});
		});

		Object.values(playerStats).forEach(player => {
			player.weeklyResults.sort((a, b) => b.points - a.points);
			player.totalPoints = player.weeklyResults.slice(0, 7).reduce((sum, w) => sum + w.points, 0);
			player.averagePosition = player.weeklyResults.reduce((sum, w) => sum + w.position, 0) / player.weeksPlayed;
			player.weeklyResults.sort((a, b) => b.week - a.week);
		});

		return Object.values(playerStats).sort((a, b) => {
			if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
			return a.averagePosition - b.averagePosition;
		});
	}

	getTotalPrizePool(): number {
		const uniquePlayers = new Set<string>();
		let totalParticipants = 0;

		this.weekResults.forEach(week => {
			week.players.forEach(player => {
				uniquePlayers.add(player.name);
			});
			totalParticipants += week.players.length;
		});

		return uniquePlayers.size * 10 + totalParticipants * 2.5;
	}

	getWeeklyPrizesWon(playerName: string): number {
		let totalWon = 0;

		this.weekResults.forEach(week => {
			const winner = week.finalRanking.find(r => r.position === 1);
			if (winner && winner.playerName === playerName) {
				const weeklyPool = week.players.length * 2.5;
				totalWon += Math.round(weeklyPool * 0.5);
			}
		});

		return totalWon;
	}

	getActiveTournaments(): {id: string, players: string[], phase: string, lastUpdated: Date}[] {
		try {
			const saved = localStorage.getItem(TOURNAMENTS_KEY);
			if (!saved) return [];

			const tournaments = JSON.parse(saved);
			return Object.entries(tournaments).map(([ id, data ]: [string, any]) => ({
				id,
				players: data.players?.map((p: any) => p.name) || [],
				phase: this.getPhaseDescription(data.currentPhase, data.tournamentType),
				lastUpdated: new Date(data.lastUpdated || Date.now())
			}));
		} catch (error) {
			console.error('Error loading active tournaments:', error);
			return [];
		}
	}

	private getPhaseDescription(phase: string, tournamentType: string): string {
		switch (phase) {
			case 'group':
				if (tournamentType === 'round-robin') {
					return 'Karsinnat';
				}
				if (tournamentType === 'groups-3') return 'Lohkopelit (3 lohkoa)';
				return 'Lohkopelit';
			case 'playoff': return 'Karsinta finaaliin';
			case 'final': return 'Finaali';
			default: return 'Tuntematon';
		}
	}
}
