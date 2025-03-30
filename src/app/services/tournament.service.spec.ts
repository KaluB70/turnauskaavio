// src/app/services/tournament.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { TournamentService } from './tournament.service';

describe('TournamentService', () => {
  let service: TournamentService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TournamentService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Bracket Generation', () => {
    // Helper method to access the private method for testing
    const generateOptimalSeedPositions = (totalSlots: number, playerCount: number) => {
      return (service as any).generateOptimalSeedPositions(totalSlots, playerCount);
    };

    // Helper to check for bye vs bye matches
    const hasNoByeVsByeMatches = (positions: boolean[]): boolean => {
      for (let i = 0; i < positions.length; i += 2) {
        if (!positions[i] && !positions[i+1]) {
          return false; // Found bye vs bye match
        }
      }
      return true; // No bye vs bye matches
    };

    // Helper to count total byes
    const countByes = (positions: boolean[]): number => {
      return positions.filter(pos => !pos).length;
    };

    it('should handle 2 players correctly', () => {
      const positions = generateOptimalSeedPositions(2, 2);
      expect(positions.length).toBe(2);
      expect(countByes(positions)).toBe(0);
      expect(hasNoByeVsByeMatches(positions)).toBeTrue();
    });

    it('should handle 3 players correctly', () => {
      const positions = generateOptimalSeedPositions(4, 3);
      expect(positions.length).toBe(4);
      expect(countByes(positions)).toBe(1);
      expect(hasNoByeVsByeMatches(positions)).toBeTrue();
    });

    it('should handle 4 players correctly', () => {
      const positions = generateOptimalSeedPositions(4, 4);
      expect(positions.length).toBe(4);
      expect(countByes(positions)).toBe(0);
      expect(hasNoByeVsByeMatches(positions)).toBeTrue();
    });

    it('should handle 5 players correctly', () => {
      const positions = generateOptimalSeedPositions(8, 5);
      expect(positions.length).toBe(8);
      expect(countByes(positions)).toBe(3);
      expect(hasNoByeVsByeMatches(positions)).toBeTrue();
    });

    it('should handle 6 players correctly', () => {
      const positions = generateOptimalSeedPositions(8, 6);
      expect(positions.length).toBe(8);
      expect(countByes(positions)).toBe(2);
      expect(hasNoByeVsByeMatches(positions)).toBeTrue();
      
      // Check that byes are correctly placed (positions 1 and 6 in 0-indexed)
      expect(positions[1]).toBeFalse();
      expect(positions[6]).toBeFalse();
    });

    it('should handle 7 players correctly', () => {
      const positions = generateOptimalSeedPositions(8, 7);
      expect(positions.length).toBe(8);
      expect(countByes(positions)).toBe(1);
      expect(hasNoByeVsByeMatches(positions)).toBeTrue();
    });

    it('should handle 9 players correctly', () => {
      const positions = generateOptimalSeedPositions(16, 9);
      expect(positions.length).toBe(16);
      expect(countByes(positions)).toBe(7);
      expect(hasNoByeVsByeMatches(positions)).toBeTrue();
    });

    it('should handle 13 players correctly', () => {
      const positions = generateOptimalSeedPositions(16, 13);
      expect(positions.length).toBe(16);
      expect(countByes(positions)).toBe(3);
      expect(hasNoByeVsByeMatches(positions)).toBeTrue();
    });
  });

  describe('Tournament Structure Verification', () => {
    // Helper to simulate bracket generation and verify the outcomes
    const verifyBracketForPlayerCount = (playerCount: number) => {
      // Reset tournament
      service.resetTournament();
      
      // Register players
      const playerNames = Array.from({ length: playerCount }, (_, i) => `Player ${i+1}`);
      service.registerPlayers(playerNames, '501', 3);
      
      // Get first round matches
      const firstRoundMatches = service.matches.filter(m => m.round === 0);
      
      // Count bye matches (matches with only one player)
      const byeMatches = firstRoundMatches.filter(
        m => (m.player1Id === null && m.player2Id !== null) || 
             (m.player1Id !== null && m.player2Id === null)
      );
      
      // Check for bye vs bye matches (matches with no players)
      const byeVsByeMatches = firstRoundMatches.filter(
        m => m.player1Id === null && m.player2Id === null
      );
      
      // All players should be assigned
      const assignedPlayers = firstRoundMatches.reduce(
        (count, match) => count + (match.player1Id !== null ? 1 : 0) + (match.player2Id !== null ? 1 : 0), 
        0
      );
      
      // Return validation results
      return {
        totalMatches: firstRoundMatches.length,
        byeMatches: byeMatches.length,
        byeVsByeMatches: byeVsByeMatches.length,
        assignedPlayers
      };
    };
    
    it('should create valid bracket for 2 players', () => {
      const result = verifyBracketForPlayerCount(2);
      expect(result.totalMatches).toBe(1);
      expect(result.byeMatches).toBe(0);
      expect(result.byeVsByeMatches).toBe(0);
      expect(result.assignedPlayers).toBe(2);
    });
    
    it('should create valid bracket for 3 players', () => {
      const result = verifyBracketForPlayerCount(3);
      expect(result.totalMatches).toBe(2);
      expect(result.byeMatches).toBe(1);
      expect(result.byeVsByeMatches).toBe(0);
      expect(result.assignedPlayers).toBe(3);
    });
    
    it('should create valid bracket for 6 players', () => {
      const result = verifyBracketForPlayerCount(6);
      expect(result.totalMatches).toBe(4);
      expect(result.byeMatches).toBe(2);
      expect(result.byeVsByeMatches).toBe(0);
      expect(result.assignedPlayers).toBe(6);
    });
    
    it('should create valid bracket for 7 players', () => {
      const result = verifyBracketForPlayerCount(7);
      expect(result.totalMatches).toBe(4);
      expect(result.byeMatches).toBe(1);
      expect(result.byeVsByeMatches).toBe(0);
      expect(result.assignedPlayers).toBe(7);
    });
  });
});