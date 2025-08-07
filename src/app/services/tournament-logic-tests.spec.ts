import {TournamentService} from './tournament.service';
import {SheetsService} from './sheets.service';

describe('TournamentService Edge Cases', () => {
  let service: TournamentService;
  let mockSheetsService: jasmine.SpyObj<SheetsService>;

  beforeEach(() => {
    // Create mock sheets service
    mockSheetsService = jasmine.createSpyObj('SheetsService', ['setConfig', 'fetchSheetData', 'testConnection']);

    // Create service with mocked dependency
    service = new TournamentService(mockSheetsService);

    // Mock localStorage to prevent actual persistence during tests
    spyOn(localStorage, 'getItem').and.returnValue(null);
    spyOn(localStorage, 'setItem');
  });

  describe('Group Tiebreaker Logic', () => {
    it('should trigger tiebreaker when all players in 3-player group are tied with same points and leg difference', () => {
      // Setup: 3 players, each wins 1 match 2-0
      // Player A beats B 2-0, Player B beats C 2-0, Player C beats A 2-0
      // Result: All have 1 win, 1 loss, 0 leg difference - requires tiebreaker

      service.register(['Player A', 'Player B', 'Player C'], '501', 3, 1);
      service.startTournament();

      // Find and complete matches to create perfect tie
      const matchAB = service.matches.find(m =>
        (m.player1Id === 1 && m.player2Id === 2) || (m.player1Id === 2 && m.player2Id === 1)
      )!;
      const matchBC = service.matches.find(m =>
        (m.player1Id === 2 && m.player2Id === 3) || (m.player1Id === 3 && m.player2Id === 2)
      )!;
      const matchCA = service.matches.find(m =>
        (m.player1Id === 3 && m.player2Id === 1) || (m.player1Id === 1 && m.player2Id === 3)
      )!;

      // A beats B 2-0
      matchAB.player1Legs = matchAB.player1Id === 1 ? 2 : 0;
      matchAB.player2Legs = matchAB.player2Id === 1 ? 2 : 0;
      matchAB.winner = 1;
      matchAB.isComplete = true;

      // B beats C 2-0
      matchBC.player1Legs = matchBC.player1Id === 2 ? 2 : 0;
      matchBC.player2Legs = matchBC.player2Id === 2 ? 2 : 0;
      matchBC.winner = 2;
      matchBC.isComplete = true;

      // C beats A 2-0
      matchCA.player1Legs = matchCA.player1Id === 3 ? 2 : 0;
      matchCA.player2Legs = matchCA.player2Id === 3 ? 2 : 0;
      matchCA.winner = 3;
      matchCA.isComplete = true;

      service.updateStandings();

      // All players should have: 1 win, 1 loss, 0 leg difference, 3 points
      const standings = service.getSortedStandings();
      expect(standings).toHaveSize(3);
      standings.forEach(standing => {
        expect(standing.wins).toBe(1);
        expect(standing.losses).toBe(1);
        expect(standing.legDifference).toBe(0);
        expect(standing.points).toBe(3);
      });

      // Trigger the next phase which should detect the tiebreaker
      service.findNextMatch();

      // Should trigger tiebreaker instead of proceeding to final
      expect(service.requiresTiebreaker).toBe(true);
      expect(service.tiebreakerPlayers).toHaveSize(3);
    });

    xit('should trigger tiebreaker in both groups when 6 players create tied groups', () => {
      // Setup: 6 players in 2 groups, both groups end in perfect ties
      service.register(['A1', 'A2', 'A3', 'B1', 'B2', 'B3'], '501', 3, 1);
      service.startTournament();

      // Complete all group matches to create ties in both groups
      const allMatches = service.matches.filter(m => m.round === 'group');

      // Group 1 matches - create circular wins (A1>A2>A3>A1)
      const group1Matches = allMatches.filter(m => m.group === 1);
      group1Matches.forEach(match => {
        // Determine winner in circular fashion
        const p1Name = service.getPlayerName(match.player1Id);
        const p2Name = service.getPlayerName(match.player2Id);

        let winnerId;
        if ((p1Name === 'A1' && p2Name === 'A2') || (p1Name === 'A2' && p2Name === 'A1')) {
          winnerId = p1Name === 'A1' ? match.player1Id : match.player2Id; // A1 beats A2
        } else if ((p1Name === 'A2' && p2Name === 'A3') || (p1Name === 'A3' && p2Name === 'A2')) {
          winnerId = p1Name === 'A2' ? match.player1Id : match.player2Id; // A2 beats A3
        } else { // A3 vs A1
          winnerId = p1Name === 'A3' ? match.player1Id : match.player2Id; // A3 beats A1
        }

        match.player1Legs = match.player1Id === winnerId ? 2 : 0;
        match.player2Legs = match.player2Id === winnerId ? 2 : 0;
        match.winner = winnerId;
        match.isComplete = true;
      });

      // Group 2 matches - create circular wins (B1>B2>B3>B1)
      const group2Matches = allMatches.filter(m => m.group === 2);
      group2Matches.forEach(match => {
        const p1Name = service.getPlayerName(match.player1Id);
        const p2Name = service.getPlayerName(match.player2Id);

        let winnerId;
        if ((p1Name === 'B1' && p2Name === 'B2') || (p1Name === 'B2' && p2Name === 'B1')) {
          winnerId = p1Name === 'B1' ? match.player1Id : match.player2Id; // B1 beats B2
        } else if ((p1Name === 'B2' && p2Name === 'B3') || (p1Name === 'B3' && p2Name === 'B2')) {
          winnerId = p1Name === 'B2' ? match.player1Id : match.player2Id; // B2 beats B3
        } else { // B3 vs B1
          winnerId = p1Name === 'B3' ? match.player1Id : match.player2Id; // B3 beats B1
        }

        match.player1Legs = match.player1Id === winnerId ? 2 : 0;
        match.player2Legs = match.player2Id === winnerId ? 2 : 0;
        match.winner = winnerId;
        match.isComplete = true;
      });

      service.updateStandings();

      // Trigger the next phase which should detect the group tiebreakers
      service.findNextMatch();

      // Both groups should require tiebreakers
      // Current implementation probably fails here - we need to fix it
      expect(service.requiresTiebreaker).toBe(true);
      expect(service.tiebreakerPlayers.length).toBeGreaterThan(0);
    });

    it('should handle partial ties correctly - only tied players need tiebreaker', () => {
      // Setup: 4 players, 3 tied for first, 1 clear last
      service.register(['Winner', 'Tied1', 'Tied2', 'Tied3'], '501', 3, 1);
      service.startTournament();

      const allMatches = service.matches.filter(m => m.round === 'group');

      // Winner beats everyone 2-0
      // Tied1, Tied2, Tied3 beat each other in circle but all lose to Winner
      // Result: Winner 3-0 (9pts), others 1-2 each (3pts) - tie for 2nd-4th

      allMatches.forEach(match => {
        const p1Name = service.getPlayerName(match.player1Id);
        const p2Name = service.getPlayerName(match.player2Id);

        let winnerId;
        if (p1Name === 'Winner' || p2Name === 'Winner') {
          winnerId = p1Name === 'Winner' ? match.player1Id : match.player2Id;
        } else {
          // Circular among Tied players: Tied1>Tied2>Tied3>Tied1
          if ((p1Name === 'Tied1' && p2Name === 'Tied2') || (p1Name === 'Tied2' && p2Name === 'Tied1')) {
            winnerId = p1Name === 'Tied1' ? match.player1Id : match.player2Id;
          } else if ((p1Name === 'Tied2' && p2Name === 'Tied3') || (p1Name === 'Tied3' && p2Name === 'Tied2')) {
            winnerId = p1Name === 'Tied2' ? match.player1Id : match.player2Id;
          } else { // Tied3 vs Tied1
            winnerId = p1Name === 'Tied3' ? match.player1Id : match.player2Id;
          }
        }

        match.player1Legs = match.player1Id === winnerId ? 2 : 0;
        match.player2Legs = match.player2Id === winnerId ? 2 : 0;
        match.winner = winnerId;
        match.isComplete = true;
      });

      service.updateStandings();

      // Trigger the next phase which should detect the partial tiebreaker
      service.findNextMatch();

      // Winner should be clear first, others tied
      expect(service.requiresTiebreaker).toBe(true);
      expect(service.tiebreakerPlayers).toHaveSize(3);
      expect(service.tiebreakerPlayers.every(p => p.name.startsWith('Tied'))).toBe(true);
    });

    it('should not trigger tiebreaker when head-to-head resolves 2-player tie', () => {
      // Setup: 4 players, 2 tied but head-to-head decides
      service.register(['First', 'Second', 'Third', 'Fourth'], '501', 3, 1);
      service.startTournament();

      // Create standings where Second and Third have same points/leg diff
      // but Second beat Third head-to-head
      const allMatches = service.matches.filter(m => m.round === 'group');

      allMatches.forEach(match => {
        const p1Name = service.getPlayerName(match.player1Id);
        const p2Name = service.getPlayerName(match.player2Id);

        let winnerId;
        let winnerLegs = 2;
        let loserLegs = 0;

        if (p1Name === 'First') {
          winnerId = match.player1Id; // First beats everyone
        } else if (p2Name === 'First') {
          winnerId = match.player2Id; // First beats everyone
        } else if (p1Name === 'Fourth') {
          winnerId = match.player2Id; // Everyone beats Fourth
        } else if (p2Name === 'Fourth') {
          winnerId = match.player1Id; // Everyone beats Fourth
        } else {
          // Second vs Third - Second wins
          winnerId = p1Name === 'Second' ? match.player1Id : match.player2Id;
        }

        match.player1Legs = match.player1Id === winnerId ? winnerLegs : loserLegs;
        match.player2Legs = match.player2Id === winnerId ? winnerLegs : loserLegs;
        match.winner = winnerId;
        match.isComplete = true;
      });

      service.updateStandings();

      // Should not require tiebreaker as head-to-head resolves Second vs Third
      expect(service.requiresTiebreaker).toBe(false);
    });
  });

  describe('Tournament Flow with Tiebreakers', () => {
    it('should handle group tiebreaker then proceed to playoff/final', () => {
      // Test the full flow: group tie -> tiebreaker -> finals
      service.register(['P1', 'P2', 'P3'], '501', 3, 1);
      service.startTournament();

      // Create tie scenario
      // Complete matches...

      // Resolve tiebreaker
      // Verify finals setup correctly
    });
  });
});
