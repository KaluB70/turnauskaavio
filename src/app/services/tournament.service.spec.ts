import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Match, TournamentService } from './tournament.service';
import { DriveService } from './drive.service';

describe('TournamentService - Comprehensive Tournament Logic Tests', () => {
	let service: TournamentService;

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [ HttpClientTestingModule ],
			providers: [
				TournamentService,
				{ provide: DriveService, useValue: jasmine.createSpyObj('DriveService', [ 'setConfig', 'fetchFileContent', 'testConnection', 'listFiles', 'getFileMetadata' ]) }
			]
		});
		service = TestBed.inject(TournamentService);
		localStorage.clear();
		// Mock setTimeout to avoid async issues in tests
		jasmine.clock().install();
	});

	afterEach(() => {
		localStorage.clear();
		jasmine.clock().uninstall();
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});

	describe('Registration and Tournament Type Selection', () => {
		it('should register 3 players for round robin tournament', () => {
			const players = [ 'Alice', 'Bob', 'Charlie' ];
			const tournamentId = service.register(players, '301', 3, 1);

			expect(service.players.length).toBe(3);
			expect(service.tournamentType).toBe('round-robin');
			expect(service.matches.length).toBe(3); // C(3,2) = 3 matches
			expect(service.showRoulette).toBe(true);
			expect(tournamentId).toBeTruthy();
		});

		it('should register 4-5 players for round robin tournament', () => {
			const players = [ 'P1', 'P2', 'P3', 'P4', 'P5' ];
			service.register(players, '501', 5, 2);

			expect(service.players.length).toBe(5);
			expect(service.tournamentType).toBe('round-robin');
			expect(service.matches.length).toBe(10); // C(5,2) = 10 matches
			expect(service.gameMode).toBe('501');
			expect(service.bestOfLegs).toBe(5);
		});

		it('should register 6+ players for group tournament', () => {
			const players = [ 'P1', 'P2', 'P3', 'P4', 'P5', 'P6' ];
			service.register(players, '301', 3, 1);

			expect(service.players.length).toBe(6);
			expect(service.tournamentType).toBe('groups');
			expect(service.showRoulette).toBe(true);

			// Check group distribution
			const group1Players = service.players.filter(p => p.group === 1);
			const group2Players = service.players.filter(p => p.group === 2);

			expect(group1Players.length).toBe(3);
			expect(group2Players.length).toBe(3);

			// Check matches for each group
			const group1Matches = service.matches.filter(m => m.group === 1);
			const group2Matches = service.matches.filter(m => m.group === 2);
			expect(group1Matches.length).toBe(3); // C(3,2) = 3
			expect(group2Matches.length).toBe(3); // C(3,2) = 3
		});

		it('should throw error for insufficient players', () => {
			expect(() => {
				service.register([ 'P1', 'P2' ], '301', 3, 1);
			}).toThrowError('Vähintään 3 pelaajaa tarvitaan');
		});
	});

	describe('Match Completion and Standings Updates', () => {
		beforeEach(() => {
			service.register([ 'Alice', 'Bob', 'Charlie' ], '301', 3, 1);
			service.startTournament();
		});

		it('should complete a match and update standings correctly', () => {
			const match = service.currentMatch!;
			const winnerId = match.player1Id;
			const loserId = match.player2Id;

			// Set leg scores
			match.player1Legs = 2;
			match.player2Legs = 1;

			service.completeMatch(winnerId);

			// Match should be marked as complete
			expect(match.isComplete).toBe(true);
			expect(match.winner).toBe(winnerId);

			// Standings should be updated
			const winnerStanding = service.standings.find(s => s.playerId === winnerId)!;
			const loserStanding = service.standings.find(s => s.playerId === loserId)!;

			expect(winnerStanding.wins).toBe(1);
			expect(winnerStanding.points).toBe(3);
			expect(winnerStanding.legDifference).toBe(1); // 2-1 = +1

			expect(loserStanding.losses).toBe(1);
			expect(loserStanding.points).toBe(0);
			expect(loserStanding.legDifference).toBe(-1); // 1-2 = -1
		});

		it('should handle different leg score scenarios', () => {
			const match = service.currentMatch!;
			const winnerId = match.player1Id;

			// Test with different leg scores
			match.player1Legs = 3;
			match.player2Legs = 0;

			service.completeMatch(winnerId);

			const winnerStanding = service.standings.find(s => s.playerId === winnerId)!;
			expect(winnerStanding.legDifference).toBe(3); // 3-0 = +3
		});
	});

	describe('3-Player Round Robin Tournament Flow', () => {
		let matches: Match[];

		beforeEach(() => {
			service.register([ 'Alice', 'Bob', 'Charlie' ], '301', 3, 1);
			service.startTournament();
			matches = service.matches.filter(m => m.round === 'group');
		});

		it('should complete tournament with clear winner', () => {
			// Complete matches with Alice as clear winner

			// Alice (ID 1) beats Bob (ID 2): 2-0
			let currentMatch = matches.find(m =>
				(m.player1Id === 1 && m.player2Id === 2) || (m.player1Id === 2 && m.player2Id === 1)
			)!;
			currentMatch.player1Legs = currentMatch.player1Id === 1 ? 2 : 0;
			currentMatch.player2Legs = currentMatch.player1Id === 1 ? 0 : 2;
			service.setCurrentMatch(currentMatch.id);
			service.completeMatch(1);

			// Alice (ID 1) beats Charlie (ID 3): 2-1
			currentMatch = matches.find(m =>
				(m.player1Id === 1 && m.player2Id === 3) || (m.player1Id === 3 && m.player2Id === 1)
			)!;
			currentMatch.player1Legs = currentMatch.player1Id === 1 ? 2 : 1;
			currentMatch.player2Legs = currentMatch.player1Id === 1 ? 1 : 2;
			service.setCurrentMatch(currentMatch.id);
			service.completeMatch(1);

			// Bob (ID 2) beats Charlie (ID 3): 2-0
			currentMatch = matches.find(m =>
				(m.player1Id === 2 && m.player2Id === 3) || (m.player1Id === 3 && m.player2Id === 2)
			)!;
			currentMatch.player1Legs = currentMatch.player1Id === 2 ? 2 : 0;
			currentMatch.player2Legs = currentMatch.player1Id === 2 ? 0 : 2;
			service.setCurrentMatch(currentMatch.id);
			service.completeMatch(2);

			// Check final standings
			const sorted = service.getSortedStandings();
			expect(sorted[0].playerId).toBe(1); // Alice should be first with 6 points
			expect(sorted[0].points).toBe(6);
			expect(sorted[1].playerId).toBe(2); // Bob should be second with 3 points
			expect(sorted[1].points).toBe(3);
			expect(sorted[2].playerId).toBe(3); // Charlie should be third with 0 points
			expect(sorted[2].points).toBe(0);

			// Tournament should be complete (for 3-player round robin)
			expect(service.isTournamentComplete()).toBe(true);
		});

		it('should detect perfect 3-way tie requiring tiebreaker', () => {
			// Create perfect circular wins: Alice beats Bob, Bob beats Charlie, Charlie beats Alice
			// All with 2-0 scores to create 0 leg difference for all

			// Alice (ID 1) beats Bob (ID 2): 2-0
			let currentMatch = matches.find(m =>
				(m.player1Id === 1 && m.player2Id === 2) || (m.player1Id === 2 && m.player2Id === 1)
			)!;
			currentMatch.player1Legs = currentMatch.player1Id === 1 ? 2 : 0;
			currentMatch.player2Legs = currentMatch.player1Id === 1 ? 0 : 2;
			service.setCurrentMatch(currentMatch.id);
			service.completeMatch(1);

			// Charlie (ID 3) beats Alice (ID 1): 2-0
			currentMatch = matches.find(m =>
				(m.player1Id === 1 && m.player2Id === 3) || (m.player1Id === 3 && m.player2Id === 1)
			)!;
			currentMatch.player1Legs = currentMatch.player1Id === 3 ? 2 : 0;
			currentMatch.player2Legs = currentMatch.player1Id === 3 ? 0 : 2;
			service.setCurrentMatch(currentMatch.id);
			service.completeMatch(3);

			// Bob (ID 2) beats Charlie (ID 3): 2-0
			currentMatch = matches.find(m =>
				(m.player1Id === 2 && m.player2Id === 3) || (m.player1Id === 3 && m.player2Id === 2)
			)!;
			currentMatch.player1Legs = currentMatch.player1Id === 2 ? 2 : 0;
			currentMatch.player2Legs = currentMatch.player1Id === 2 ? 0 : 2;
			service.setCurrentMatch(currentMatch.id);
			service.completeMatch(2);

			// Check that we have a perfect tie
			const sorted = service.getSortedStandings();
			expect(sorted[0].points).toBe(3); // All players have 1 win
			expect(sorted[1].points).toBe(3);
			expect(sorted[2].points).toBe(3);
			expect(sorted[0].legDifference).toBe(0); // All have 0 leg difference
			expect(sorted[1].legDifference).toBe(0);
			expect(sorted[2].legDifference).toBe(0);

			// This should trigger tiebreaker requirement
			expect(service.requiresTiebreaker).toBe(true);
			expect(service.tiebreakerPlayers.length).toBe(3);
		});

		it('should handle head-to-head resolution for 2-way ties', () => {
			// Alice beats both Bob and Charlie, Bob beats Charlie
			// Alice: 6 points, Bob: 3 points, Charlie: 0 points

			// Alice (ID 1) beats Bob (ID 2): 2-1
			let currentMatch = matches.find(m =>
				(m.player1Id === 1 && m.player2Id === 2) || (m.player1Id === 2 && m.player2Id === 1)
			)!;
			currentMatch.player1Legs = currentMatch.player1Id === 1 ? 2 : 1;
			currentMatch.player2Legs = currentMatch.player1Id === 1 ? 1 : 2;
			service.setCurrentMatch(currentMatch.id);
			service.completeMatch(1);

			// Alice (ID 1) beats Charlie (ID 3): 2-0
			currentMatch = matches.find(m =>
				(m.player1Id === 1 && m.player2Id === 3) || (m.player1Id === 3 && m.player2Id === 1)
			)!;
			currentMatch.player1Legs = currentMatch.player1Id === 1 ? 2 : 0;
			currentMatch.player2Legs = currentMatch.player1Id === 1 ? 0 : 2;
			service.setCurrentMatch(currentMatch.id);
			service.completeMatch(1);

			// Bob (ID 2) beats Charlie (ID 3): 2-1
			currentMatch = matches.find(m =>
				(m.player1Id === 2 && m.player2Id === 3) || (m.player1Id === 3 && m.player2Id === 2)
			)!;
			currentMatch.player1Legs = currentMatch.player1Id === 2 ? 2 : 1;
			currentMatch.player2Legs = currentMatch.player1Id === 2 ? 1 : 2;
			service.setCurrentMatch(currentMatch.id);
			service.completeMatch(2);

			const sorted = service.getSortedStandings();
			expect(sorted[0].playerId).toBe(1); // Alice first with 6 points
			expect(sorted[0].points).toBe(6);
			expect(sorted[1].playerId).toBe(2); // Bob second with 3 points
			expect(sorted[1].points).toBe(3);
			expect(sorted[2].playerId).toBe(3); // Charlie third with 0 points
			expect(sorted[2].points).toBe(0);
		});
	});

	describe('Tiebreaker System', () => {
		beforeEach(() => {
			service.register([ 'Alice', 'Bob', 'Charlie' ], '301', 3, 1);

			// Create perfect 3-way tie scenario
			service.requiresTiebreaker = true;
			service.tiebreakerPlayers = [
				{ id: 1, name: 'Alice' },
				{ id: 2, name: 'Bob' },
				{ id: 3, name: 'Charlie' }
			];
			service.initializeTiebreaker();
		});

		it('should initialize tiebreaker scores correctly', () => {
			expect(service.tiebreakerScores[1]).toEqual([]);
			expect(service.tiebreakerScores[2]).toEqual([]);
			expect(service.tiebreakerScores[3]).toEqual([]);
		});

		it('should add tiebreaker scores and calculate totals', () => {
			service.addTiebreakerScore(1, 180); // Alice perfect 9-dart finish
			service.addTiebreakerScore(2, 150); // Bob good score
			service.addTiebreakerScore(3, 120); // Charlie decent score

			const totals = service.getTiebreakerTotals();

			expect(totals.length).toBe(3);
			expect(totals[0].total).toBe(180);
			expect(totals[0].playerName).toBe('Alice');
			expect(totals[1].total).toBe(150);
			expect(totals[1].playerName).toBe('Bob');
			expect(totals[2].total).toBe(120);
			expect(totals[2].playerName).toBe('Charlie');
		});

		it('should resolve tiebreaker when scores are different', () => {
			service.addTiebreakerScore(1, 180);
			service.addTiebreakerScore(2, 150);
			service.addTiebreakerScore(3, 120);

			service.resolveTiebreaker();

			expect(service.requiresTiebreaker).toBe(false);
			expect(service.tournamentCompleted).toBe(true);
		});

		it('should require another tiebreaker round when scores are tied', () => {
			// Two players tie for first place
			service.addTiebreakerScore(1, 150);
			service.addTiebreakerScore(2, 150); // Tied with Alice
			service.addTiebreakerScore(3, 120);

			service.resolveTiebreaker();

			expect(service.requiresTiebreaker).toBe(true);
			expect(service.tournamentCompleted).toBe(false);

			// Scores should be reset for next round
			expect(service.tiebreakerScores[1]).toEqual([]);
			expect(service.tiebreakerScores[2]).toEqual([]);
			expect(service.tiebreakerScores[3]).toEqual([]);
		});
	});

	describe('4-5 Player Round Robin Tournament', () => {
		beforeEach(() => {
			service.register([ 'Alice', 'Bob', 'Charlie', 'Dave' ], '301', 3, 1);
			service.startTournament();
		});

		it('should create correct match structure', () => {
			const groupMatches = service.matches.filter(m => m.round === 'group');
			expect(groupMatches.length).toBe(6); // C(4,2) = 6 matches
			expect(service.currentPhase).toBe('group');
		});

		it('should progress to finals with top 3 players', () => {
			// Complete all group matches with predictable results
			const groupMatches = service.matches.filter(m => m.round === 'group');

			// Complete all matches - player1 always wins for simplicity
			groupMatches.forEach(match => {
				match.player1Legs = 2;
				match.player2Legs = 0;
				service.setCurrentMatch(match.id);
				service.completeMatch(match.player1Id);

				// Advance timer to handle setTimeout in completeMatch
				jasmine.clock().tick(3000);
			});

			// After all group matches, should progress to final phase
			expect(service.currentPhase).toBe('final');
			expect(service.finalists.length).toBe(3);
		});
	});

	describe('Group Tournament (6+ Players)', () => {
		beforeEach(() => {
			service.register([ 'P1', 'P2', 'P3', 'P4', 'P5', 'P6' ], '301', 3, 1);
			service.startTournament();
		});

		it('should create separate group matches', () => {
			const group1Matches = service.matches.filter(m => m.group === 1);
			const group2Matches = service.matches.filter(m => m.group === 2);

			expect(group1Matches.length).toBe(3); // C(3,2) = 3
			expect(group2Matches.length).toBe(3); // C(3,2) = 3
		});

		it('should track group standings separately', () => {
			// Complete one match in group 1
			const group1Matches = service.matches.filter(m => m.group === 1);
			const match = group1Matches[0];

			match.player1Legs = 2;
			match.player2Legs = 1;
			service.setCurrentMatch(match.id);
			service.completeMatch(match.player1Id);

			const group1Standings = service.getGroupStandings(1);
			expect(group1Standings.length).toBe(3);

			const winner = group1Standings.find(s => s.wins === 1);
			expect(winner?.points).toBe(3);
			expect(winner?.legDifference).toBe(1);
		});
	});

	describe('Tournament State Management', () => {
		it('should save and load tournament state correctly', () => {
			const players = [ 'Alice', 'Bob', 'Charlie' ];
			const tournamentId = service.register(players, '301', 3, 1);

			service.startTournament();

			// Complete a match to change state
			const match = service.currentMatch!;
			match.player1Legs = 2;
			match.player2Legs = 1;
			service.completeMatch(match.player1Id);

			// Create new service instance and load
			const mockSheetsService = jasmine.createSpyObj('SheetsService', [ 'setConfig', 'fetchSheetData', 'testConnection' ]);
			const newService = new TournamentService(mockSheetsService);
			const loaded = newService.loadTournament(tournamentId);

			expect(loaded).toBe(true);
			expect(newService.players.length).toBe(3);
			expect(newService.isStarted).toBe(true);
			expect(newService.matches.filter(m => m.isComplete).length).toBe(1);
		});

		it('should handle invalid tournament IDs', () => {
			const loaded = service.loadTournament('invalid-id-12345');
			expect(loaded).toBe(false);
		});

		it('should reset tournament state completely', () => {
			service.register([ 'Alice', 'Bob', 'Charlie' ], '301', 3, 1);
			service.startTournament();

			service.reset();

			expect(service.players.length).toBe(0);
			expect(service.matches.length).toBe(0);
			expect(service.standings.length).toBe(0);
			expect(service.isStarted).toBe(false);
			expect(service.currentMatch).toBeNull();
			expect(service.requiresTiebreaker).toBe(false);
			expect(service.tournamentCompleted).toBe(false);
		});
	});

	describe('Season Statistics', () => {
		beforeEach(() => {
			// Set up sample week results
			service.weekResults = [
				{
					weekNumber: 1,
					players: [ { id: 1, name: 'Alice' }, { id: 2, name: 'Bob' } ],
					finalRanking: [
						{ playerId: 1, playerName: 'Alice', position: 1, points: 5 },
						{ playerId: 2, playerName: 'Bob', position: 2, points: 3 }
					],
					matches: [],
					date: new Date('2024-01-01'),
					gameMode: '301'
				},
				{
					weekNumber: 2,
					players: [ { id: 1, name: 'Alice' }, { id: 2, name: 'Bob' } ],
					finalRanking: [
						{ playerId: 2, playerName: 'Bob', position: 1, points: 5 },
						{ playerId: 1, playerName: 'Alice', position: 2, points: 3 }
					],
					matches: [],
					date: new Date('2024-01-08'),
					gameMode: '301'
				}
			];
		});

		it('should calculate season standings correctly', () => {
			const standings = service.getSeasonStandings();

			expect(standings.length).toBe(2);

			// Bob: 3+5 = 8 points total
			// Alice: 5+3 = 8 points total
			const bob = standings.find(s => s.playerName === 'Bob')!;
			const alice = standings.find(s => s.playerName === 'Alice')!;

			expect(bob.totalPoints).toBe(8);
			expect(alice.totalPoints).toBe(8);
			expect(bob.wins).toBe(1);
			expect(alice.wins).toBe(1);
		});

		it('should apply 7-week best results rule', () => {
			// Add more weeks with varying scores
			for (let week = 3; week <= 10; week++) {
				service.weekResults.push({
					weekNumber: week,
					players: [ { id: 1, name: 'Alice' } ],
					finalRanking: [
						{ playerId: 1, playerName: 'Alice', position: 1, points: week % 2 === 0 ? 5 : 1 }
					],
					matches: [],
					date: new Date(`2024-01-${week}`),
					gameMode: '301'
				});
			}

			const standings = service.getSeasonStandings();
			const alice = standings.find(s => s.playerName === 'Alice')!;

			// Should only count 7 best weeks
			expect(alice.totalPoints).toBeGreaterThan(20); // More than worst case
			expect(alice.totalPoints).toBeLessThan(35); // Less than all high scores
		});
	});

	describe('Utility Functions', () => {
		beforeEach(() => {
			service.register([ 'Alice', 'Bob', 'Charlie' ], '301', 3, 1);
		});

		it('should get player names correctly', () => {
			expect(service.getPlayerName(1)).toBe('Alice');
			expect(service.getPlayerName(999)).toBe('Unknown');
		});

		it('should provide correct phase descriptions', () => {
			service.currentPhase = 'group';
			service.tournamentType = 'round-robin';
			expect(service.getCurrentPhaseDescription()).toBe('Karsinnat');

			service.tournamentType = 'groups';
			expect(service.getCurrentPhaseDescription()).toBe('Lohkopelit');

			service.currentPhase = 'playoff';
			expect(service.getCurrentPhaseDescription()).toBe('Karsinta finaaliin');

			service.currentPhase = 'final';
			expect(service.getCurrentPhaseDescription()).toBe('Finaali');
		});

		it('should detect if tournament has results', () => {
			expect(service.hasResults()).toBe(false);

			service.weekResults.push({
				weekNumber: 1,
				players: [],
				finalRanking: [],
				matches: [],
				date: new Date(),
				gameMode: '301'
			});

			expect(service.hasResults()).toBe(true);
		});

		it('should handle 3-way final detection', () => {
			// Set up a match with 3rd player to test 3-way final
			service.currentMatch = {
				id: 1,
				player1Id: 1,
				player2Id: 2,
				player3Id: 3,
				player1Legs: 0,
				player2Legs: 0,
				player3Legs: 0,
				winner: null,
				isComplete: false,
				round: 'final'
			};
			expect(service.is3WayFinal()).toBe(true);

			service.currentMatch.player3Id = undefined;
			expect(service.is3WayFinal()).toBe(false);
		});
	});

	describe('Edge Cases and Error Handling', () => {
		it('should handle registration edge cases gracefully', () => {
			expect(() => {
				service.register([ '', '  ', 'ValidName' ], '301', 3, 1);
			}).not.toThrow();
		});

		it('should handle match operations with invalid data', () => {
			service.register([ 'Alice', 'Bob', 'Charlie' ], '301', 3, 1);
			service.startTournament();

			// Complete with invalid winner should still complete the match
			service.completeMatch(999);
			expect(service.currentMatch?.isComplete).toBe(true);
		});

		it('should handle localStorage errors gracefully', () => {
			// Mock localStorage to throw errors
			spyOn(Storage.prototype, 'setItem').and.throwError('Storage full');

			expect(() => {
				service.register([ 'Alice', 'Bob', 'Charlie' ], '301', 3, 1);
			}).not.toThrow();
		});
	});
});
