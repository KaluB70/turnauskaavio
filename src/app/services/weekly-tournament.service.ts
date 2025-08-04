// src/app/services/weekly-tournament.service.ts
import {Injectable} from '@angular/core';

export interface WeeklyPlayer {
	id: number;
	name: string;
	group?: number; // For group-based tournaments
}

export interface WeeklyMatch {
	id: number;
	player1Id: number;
	player2Id: number;
	player1Legs: number;
	player2Legs: number;
	winner: number | null;
	isComplete: boolean;
	isByeMatch: boolean;
	round: 'group' | 'playoff' | 'final';
	group?: number; // For group matches
}

export interface GroupStanding {
	playerId: number;
	playerName: string;
	wins: number;
	losses: number;
	legDifference: number;
	points: number; // 3 for win, 0 for loss
	group: number;
}

export interface WeeklyTournamentResult {
	weekNumber: number;
	players: WeeklyPlayer[];
	finalRanking: { playerId: number; playerName: string; position: number; points: number }[];
	date: Date;
	gameMode: string;
}

export type WeeklyGameMode = '301' | '501' | '701' | 'Cricket';

const WEEKLY_RESULTS_KEY = 'darts_weekly_results';

@Injectable({
	providedIn: 'root'
})
export class WeeklyTournamentService {
	players: WeeklyPlayer[] = [];
	matches: WeeklyMatch[] = [];
	currentMatch: WeeklyMatch | null = null;
	isStarted = false;
	gameMode: WeeklyGameMode = '301';
	bestOfLegs = 3;
	weekNumber = 1;

	// Tournament state
	tournamentType: 'round-robin' | 'group-based' = 'round-robin';
	groupStandings: GroupStanding[] = [];
	finalists: WeeklyPlayer[] = [];
	currentPhase: 'group' | 'playoff' | 'final' = 'group';
	thirdFinalPlayer: WeeklyPlayer | null = null; // For 3-way finals

	// Animation states
	showMatchWinnerAnimation = false;
	lastWinnerName = '';

	// Results storage
	weeklyResults: WeeklyTournamentResult[] = [];

	constructor() {
		this.loadFromLocalStorage();
	}

	private loadFromLocalStorage(): void {
		try {
			const savedResults = localStorage.getItem(WEEKLY_RESULTS_KEY);
			if (savedResults) {
				const parsedResults = JSON.parse(savedResults);
				this.weeklyResults = parsedResults.map((item: any) => ({
					...item,
					date: new Date(item.date)
				}));
			}
		} catch (error) {
			console.error('Error loading weekly results from localStorage:', error);
		}
	}

	private saveToLocalStorage(): void {
		try {
			localStorage.setItem(WEEKLY_RESULTS_KEY, JSON.stringify(this.weeklyResults));
		} catch (error) {
			console.error('Error saving weekly results to localStorage:', error);
		}
	}

	resetTournament(): void {
		this.players = [];
		this.matches = [];
		this.currentMatch = null;
		this.isStarted = false;
		this.groupStandings = [];
		this.finalists = [];
		this.currentPhase = 'group';
		this.thirdFinalPlayer = null;
		this.showMatchWinnerAnimation = false;
		this.lastWinnerName = '';
	}

	registerPlayers(
		playerNames: string[],
		gameMode: WeeklyGameMode,
		bestOfLegs: number,
		weekNumber: number
	): void {
		this.resetTournament();

		this.players = playerNames
			.filter(name => name.trim() !== '')
			.map((name, index) => ({
				id: index + 1,
				name: name.trim()
			}));

		if (this.players.length < 3) {
			throw new Error('At least 3 players are required for weekly tournament');
		}

		this.gameMode = gameMode;
		this.bestOfLegs = bestOfLegs;
		this.weekNumber = weekNumber;

		// Determine tournament type
		if (this.players.length <= 5) {
			this.tournamentType = 'round-robin';
			this.setupRoundRobin();
		} else {
			this.tournamentType = 'group-based';
			this.setupGroupBased();
		}

		this.isStarted = true;
		this.findNextMatch();
	}

	private setupRoundRobin(): void {
		// Create matches for all players against each other
		for (let i = 0; i < this.players.length; i++) {
			for (let j = i + 1; j < this.players.length; j++) {
				this.matches.push({
					id: this.matches.length + 1,
					player1Id: this.players[i].id,
					player2Id: this.players[j].id,
					player1Legs: 0,
					player2Legs: 0,
					winner: null,
					isComplete: false,
					isByeMatch: false,
					round: 'group'
				});
			}
		}

		// Initialize standings
		this.groupStandings = this.players.map(player => ({
			playerId: player.id,
			playerName: player.name,
			wins: 0,
			losses: 0,
			legDifference: 0,
			points: 0,
			group: 1
		}));
	}

	private setupGroupBased(): void {
		// Shuffle players randomly
		const shuffledPlayers = [...this.players].sort(() => Math.random() - 0.5);

		// Divide into 2 groups
		const group1Size = Math.ceil(shuffledPlayers.length / 2);
		const group1Players = shuffledPlayers.slice(0, group1Size);
		const group2Players = shuffledPlayers.slice(group1Size);

		// Assign group numbers
		group1Players.forEach(player => player.group = 1);
		group2Players.forEach(player => player.group = 2);

		// Create alternating group matches
		this.createAlternatingGroupMatches(group1Players, group2Players);

		// Initialize standings
		this.groupStandings = this.players.map(player => ({
			playerId: player.id,
			playerName: player.name,
			wins: 0,
			losses: 0,
			legDifference: 0,
			points: 0,
			group: player.group || 1
		}));
	}

	private createAlternatingGroupMatches(group1Players: WeeklyPlayer[], group2Players: WeeklyPlayer[]): void {
		// Create all matches for each group first
		const group1Matches: { player1: WeeklyPlayer; player2: WeeklyPlayer }[] = [];
		const group2Matches: { player1: WeeklyPlayer; player2: WeeklyPlayer }[] = [];

		// Generate group 1 matches
		for (let i = 0; i < group1Players.length; i++) {
			for (let j = i + 1; j < group1Players.length; j++) {
				group1Matches.push({
					player1: group1Players[i],
					player2: group1Players[j]
				});
			}
		}

		// Generate group 2 matches
		for (let i = 0; i < group2Players.length; i++) {
			for (let j = i + 1; j < group2Players.length; j++) {
				group2Matches.push({
					player1: group2Players[i],
					player2: group2Players[j]
				});
			}
		}

		// Mix matches from both groups for alternating play
		const totalMatches = group1Matches.length + group2Matches.length;
		let group1Index = 0;
		let group2Index = 0;

		for (let i = 0; i < totalMatches; i++) {
			let matchToAdd: WeeklyMatch | null = null;

			// Alternate between groups when possible
			if (i % 2 === 0 && group1Index < group1Matches.length) {
				const match = group1Matches[group1Index++];
				matchToAdd = {
					id: this.matches.length + 1,
					player1Id: match.player1.id,
					player2Id: match.player2.id,
					player1Legs: 0,
					player2Legs: 0,
					winner: null,
					isComplete: false,
					isByeMatch: false,
					round: 'group',
					group: 1  // Set a group number explicitly
				};
			} else if (group2Index < group2Matches.length) {
				const match = group2Matches[group2Index++];
				matchToAdd = {
					id: this.matches.length + 1,
					player1Id: match.player1.id,
					player2Id: match.player2.id,
					player1Legs: 0,
					player2Legs: 0,
					winner: null,
					isComplete: false,
					isByeMatch: false,
					round: 'group',
					group: 2  // Set group number explicitly
				};
			} else if (group1Index < group1Matches.length) {
				// If no group 2 matches left, add remaining group 1 matches
				const match = group1Matches[group1Index++];
				matchToAdd = {
					id: this.matches.length + 1,
					player1Id: match.player1.id,
					player2Id: match.player2.id,
					player1Legs: 0,
					player2Legs: 0,
					winner: null,
					isComplete: false,
					isByeMatch: false,
					round: 'group',
					group: 1  // Set group number explicitly
				};
			}

			if (matchToAdd) {
				this.matches.push(matchToAdd);
			}
		}
	}

	findNextMatch(): void {
		// Wait for animation to complete
		if (this.showMatchWinnerAnimation) {
			return;
		}

		if (this.currentPhase === 'group') {
			// Find next incomplete group match
			const incompleteMatches = this.matches.filter(
				m => !m.isComplete && m.round === 'group'
			);

			if (incompleteMatches.length > 0) {
				this.currentMatch = incompleteMatches[0];
				return;
			}

			// All group matches complete
			this.currentMatch = null;

			// For 3-player round robin, complete the tournament
			if (this.tournamentType === 'round-robin' && this.players.length === 3) {
				this.completeTournament();
				return;
			}

			// Otherwise, check phase transition
			this.checkPhaseTransition();
			return;
		} else if (this.currentPhase === 'playoff') {
			// Find next playoff match
			const playoffMatches = this.matches.filter(
				m => !m.isComplete && m.round === 'playoff'
			);

			if (playoffMatches.length > 0) {
				this.currentMatch = playoffMatches[0];
				return;
			}

			// Playoffs complete but no match found - this shouldn't happen
			// But if it does, transition to final
			this.currentMatch = null;
			this.currentPhase = 'final';
			this.moveToFinals(3); // Move all 3 finalists
			return;
		} else if (this.currentPhase === 'final') {
			// Find final matches
			const finalMatches = this.matches.filter(
				m => !m.isComplete && m.round === 'final'
			);

			if (finalMatches.length > 0) {
				this.currentMatch = finalMatches[0];
				return;
			}

			// Tournament complete - but this should be handled in completeMatch
			this.currentMatch = null;
			this.completeTournament();
			return;
		}

		this.currentMatch = null;
	}

	// 4. Fix the checkPhaseTransition method
	private checkPhaseTransition(): void {
		this.updateStandings();

		if (this.tournamentType === 'round-robin') {
			if (this.players.length === 3) {
				// With 3 players, complete tournament directly
				this.completeTournament();
				return;
			} else {
				// Move top 3 to finals
				this.moveToFinals(3);
				return;
			}
		} else {
			// Group-based: move group winners to final, 2nd places to playoff
			this.setupPlayoffs();
			return;
		}
	}

	private moveToFinals(count: number): void {
		const sortedStandings = this.getSortedStandings();
		this.finalists = sortedStandings.slice(0, count).map(standing =>
			this.players.find(p => p.id === standing.playerId)!
		);

		// Create a single 3-way final match if we have 3 finalists
		if (this.finalists.length === 3) {
			this.matches.push({
				id: this.matches.length + 1,
				player1Id: this.finalists[0].id,
				player2Id: this.finalists[1].id, // We'll handle the 3rd player differently
				player1Legs: 0,
				player2Legs: 0,
				winner: null,
				isComplete: false,
				isByeMatch: false,
				round: 'final'
			});

			// Store the third player for the 3-way match
			this.thirdFinalPlayer = this.finalists[2];
		} else {
			// Create final round-robin matches between finalists for other cases
			for (let i = 0; i < this.finalists.length; i++) {
				for (let j = i + 1; j < this.finalists.length; j++) {
					this.matches.push({
						id: this.matches.length + 1,
						player1Id: this.finalists[i].id,
						player2Id: this.finalists[j].id,
						player1Legs: 0,
						player2Legs: 0,
						winner: null,
						isComplete: false,
						isByeMatch: false,
						round: 'final'
					});
				}
			}
		}

		this.currentPhase = 'final';
		this.findNextMatch();
	}

	private setupPlayoffs(): void {
		const group1Standings = this.getGroupStandings(1);
		const group2Standings = this.getGroupStandings(2);

		// Group winners go directly to final
		const group1Winner = group1Standings[0];
		const group2Winner = group2Standings[0];

		// 2nd places play each other (BO1) for 3rd final spot
		const group1Second = group1Standings[1];
		const group2Second = group2Standings[1];

		if (group1Second && group2Second) {
			// Create playoff match (BO1)
			this.matches.push({
				id: this.matches.length + 1,
				player1Id: group1Second.playerId,
				player2Id: group2Second.playerId,
				player1Legs: 0,
				player2Legs: 0,
				winner: null,
				isComplete: false,
				isByeMatch: false,
				round: 'playoff'
			});

			this.currentPhase = 'playoff';

			// IMPORTANT: Find the playoff match immediately
			this.findNextMatch();
		} else {
			// No second place players (shouldn't happen in normal flow)
			// Move directly to finals
			this.currentPhase = 'final';
			this.moveToFinals(2);
		}

		// Prepare finalists (winners + playoff winner will be added later)
		this.finalists = [
			this.players.find(p => p.id === group1Winner.playerId)!,
			this.players.find(p => p.id === group2Winner.playerId)!
		];
	}

	private getGroupStandings(groupNumber: number): GroupStanding[] {
		return this.groupStandings
			.filter(s => s.group === groupNumber)
			.sort((a, b) => {
				if (a.points !== b.points) return b.points - a.points;
				// Head-to-head comparison
				const headToHead = this.getHeadToHeadResult(a.playerId, b.playerId);
				if (headToHead !== 0) return headToHead;
				// Leg difference
				return b.legDifference - a.legDifference;
			});
	}

	completeMatch(winnerId: number): void {
		if (!this.currentMatch) return;

		const match = this.currentMatch;
		match.winner = winnerId;
		match.isComplete = true;

		// Store winner name for animation
		this.lastWinnerName = this.getPlayerName(winnerId);

		// Update standings
		this.updateStandings();

		// If this was a playoff match, add winner to finalists and create final match
		if (match.round === 'playoff') {
			const playoffWinner = this.players.find(p => p.id === winnerId)!;
			this.finalists.push(playoffWinner);

			// Create single 3-way final match
			this.matches.push({
				id: this.matches.length + 1,
				player1Id: this.finalists[0].id,
				player2Id: this.finalists[1].id,
				player1Legs: 0,
				player2Legs: 0,
				winner: null,
				isComplete: false,
				isByeMatch: false,
				round: 'final'
			});

			// Store the third player for the 3-way match
			this.thirdFinalPlayer = this.finalists[2];

			// Show animation and continue
			this.showMatchWinnerAnimation = true;
			setTimeout(() => {
				this.showMatchWinnerAnimation = false;
				this.findNextMatch();
			}, 3000);
			return;
		}

		// Check if this is the final match
		const isFinalMatch = match.round === 'final';

		if (isFinalMatch) {
			// For 3-way final or when all finals are complete
			if (this.is3WayFinal() || this.allFinalMatchesComplete()) {
				// Show animation then complete tournament
				this.showMatchWinnerAnimation = true;
				setTimeout(() => {
					this.showMatchWinnerAnimation = false;
					this.completeTournament();
				}, 3000);
				return;
			} else {
				// More final matches to play
				this.showMatchWinnerAnimation = true;
				setTimeout(() => {
					this.showMatchWinnerAnimation = false;
					this.findNextMatch();
				}, 3000);
				return;
			}
		} else {
			// Show winner animation for non-final matches
			this.showMatchWinnerAnimation = true;
			setTimeout(() => {
				this.showMatchWinnerAnimation = false;
				this.findNextMatch();
			}, 3000);
		}
	}

	private allFinalMatchesComplete(): boolean {
		const finalMatches = this.matches.filter(m => m.round === 'final');
		return finalMatches.length > 0 && finalMatches.every(m => m.isComplete);
	}


	private updateStandings(): void {
		// Reset standings
		this.groupStandings.forEach(standing => {
			standing.wins = 0;
			standing.losses = 0;
			standing.legDifference = 0;
			standing.points = 0;
		});

		// Calculate from completed matches
		const completedMatches = this.matches.filter(m => m.isComplete);

		for (const match of completedMatches) {
			const player1Standing = this.groupStandings.find(s => s.playerId === match.player1Id);
			const player2Standing = this.groupStandings.find(s => s.playerId === match.player2Id);

			if (!player1Standing || !player2Standing) continue;

			// Update leg difference
			player1Standing.legDifference += match.player1Legs - match.player2Legs;
			player2Standing.legDifference += match.player2Legs - match.player1Legs;

			// Update wins/losses and points
			if (match.winner === match.player1Id) {
				player1Standing.wins++;
				player1Standing.points += 3;
				player2Standing.losses++;
			} else if (match.winner === match.player2Id) {
				player2Standing.wins++;
				player2Standing.points += 3;
				player1Standing.losses++;
			}
		}
	}

	private getHeadToHeadResult(player1Id: number, player2Id: number): number {
		const headToHeadMatch = this.matches.find(m =>
			m.isComplete &&
			((m.player1Id === player1Id && m.player2Id === player2Id) ||
				(m.player1Id === player2Id && m.player2Id === player1Id))
		);

		if (!headToHeadMatch) return 0;

		if (headToHeadMatch.winner === player1Id) return -1; // Player 1 wins (should be sorted higher)
		if (headToHeadMatch.winner === player2Id) return 1;  // Player 2 wins
		return 0;
	}

	getSortedStandings(): GroupStanding[] {
		this.updateStandings();
		return [...this.groupStandings].sort((a, b) => {
			if (a.points !== b.points) return b.points - a.points;

			// Head-to-head comparison
			const headToHead = this.getHeadToHeadResult(a.playerId, b.playerId);
			if (headToHead !== 0) return headToHead;

			// Leg difference
			return b.legDifference - a.legDifference;
		});
	}

	private completeTournament(): void {
		const finalRanking = this.getSortedStandings().map((standing, index) => ({
			playerId: standing.playerId,
			playerName: standing.playerName,
			position: index + 1,
			points: this.calculateWeeklyPoints(index + 1)
		}));

		// Save weekly result
		this.weeklyResults.push({
			weekNumber: this.weekNumber,
			players: [...this.players],
			finalRanking,
			date: new Date(),
			gameMode: this.gameMode
		});

		this.saveToLocalStorage();
	}

	private calculateWeeklyPoints(position: number): number {
		// Points based on position: 1st: +5, 2nd: +3, 3rd: +1
		switch (position) {
			case 1:
				return 5;
			case 2:
				return 3;
			case 3:
				return 1;
			default:
				return 0;
		}
	}

	getPlayerName(playerId: number): string {
		const player = this.players.find(p => p.id === playerId);
		return player ? player.name : 'Unknown';
	}

	getCurrentPhaseDescription(): string {
		switch (this.currentPhase) {
			case 'group':
				if (this.tournamentType === 'round-robin') {
					return this.players.length === 3 ? 'Finaalikarsinnat' : 'Karsinnat';
				}
				return 'Lohkopelit';
			case 'playoff':
				return 'Karsintaottelu finaaliin';
			case 'final':
				return 'Finaali';
			default:
				return '';
		}
	}

	is3WayFinal(): boolean {
		return this.thirdFinalPlayer !== null;
	}

	isPlayoffMatch(match: WeeklyMatch): boolean {
		return match.round === 'playoff';
	}

	getRoundForMatch(match: WeeklyMatch): string {
		if (match.round === 'group') {
			if (this.tournamentType === 'group-based' && match.group) {
				return `Lohko ${match.group}`;
			}
			return this.players.length === 3 ? 'Finaali' : 'Karsinnat';
		} else if (match.round === 'playoff') {
			return 'Karsinta finaaliin';
		} else {
			return this.is3WayFinal() ? '3-way Finaali' : 'Finaali';
		}
	}

}

export interface WeeklyMatch {
	id: number;
	player1Id: number;
	player2Id: number;
	player1Legs: number;
	player2Legs: number;
	winner: number | null;
	isComplete: boolean;
	isByeMatch: boolean;
	round: 'group' | 'playoff' | 'final';
	group?: number; // Add this property to track which group the match belongs to
}
