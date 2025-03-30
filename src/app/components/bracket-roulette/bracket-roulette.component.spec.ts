// src/app/components/bracket-roulette/bracket-roulette.component.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BracketRouletteComponent } from './bracket-roulette.component';
import { TournamentService } from '../../services/tournament.service';
import { CommonModule } from '@angular/common';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

// Create Audio mock directly in the test
class AudioMock {
  src: string = '';
  loop: boolean = false;
  volume: number = 0;
  playbackRate: number = 0;
  paused: boolean = true;
  currentTime: number = 0;

  constructor() {}
  
  load(): void {}
  
  play(): Promise<void> {
    return Promise.resolve();
  }
  
  pause(): void {
    this.paused = true;
  }
}

describe('BracketRouletteComponent', () => {
  let component: BracketRouletteComponent;
  let fixture: ComponentFixture<BracketRouletteComponent>;
  let tournamentService: TournamentService;

  beforeEach(async () => {
    // Mock Audio object
    window.Audio = AudioMock as any;
    
    await TestBed.configureTestingModule({
      imports: [
        CommonModule,
        BracketRouletteComponent,
        BrowserAnimationsModule // Add animations module
      ],
      providers: [TournamentService]
    }).compileComponents();

    tournamentService = TestBed.inject(TournamentService);
    fixture = TestBed.createComponent(BracketRouletteComponent);
    component = fixture.componentInstance;
    
    // Mock the audio methods directly
    spyOn(component, 'initAudio').and.returnValue();
    spyOn(component, 'playDrumroll').and.returnValue();
    spyOn(component, 'stopDrumroll').and.returnValue();
    spyOn(component, 'startConfetti').and.returnValue();
    spyOn(component, 'stopConfetti').and.returnValue();
  });

  afterEach(() => {
    // Clean up intervals and timeouts
    component.ngOnDestroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Bracket Generation', () => {
    // Helper to check for bye vs bye pairs
    const hasNoByeVsByePairs = (pairs: any[]): boolean => {
      // Check each pair in our generated bracket
      for (const pair of pairs) {
        // If both sides of a pair are empty (bye), it's a bye vs bye match
        if (pair.player1 === null && pair.player2 === null) {
          return false; // Found bye vs bye match
        }
      }
      return true; // No bye vs bye matches
    };
    
    // Helper to count total assigned players
    const countAssignedPlayers = (pairs: any[]): number => {
      let count = 0;
      for (const pair of pairs) {
        if (pair.player1) count++;
        if (pair.player2) count++;
      }
      return count;
    };
    
    // Helper to test bracket generation with different player counts
    const testBracketGeneration = (playerCount: number) => {
      // Create input players
      const players = Array.from({ length: playerCount }, (_, i) => ({
        id: i + 1,
        name: `Player ${i + 1}`
      }));
      
      // Set up component with players
      component.players = players;
      
      // Initialize and call our bracket generation method directly
      component.generateBracketStructure(playerCount);
      
      // Create the pairs directly for testing
      component.playerPairs = [];
      const bracketStructure = component.generateBracketStructure(playerCount);
      
      // Apply the structure to create pairs for testing
      const { firstRoundMatches, byePositions, shuffledPlayers } = bracketStructure;
      let playerIndex = 0;
      
      for (let i = 0; i < firstRoundMatches.length; i++) {
        const match = firstRoundMatches[i];
        
        // Create a new pair
        const pair = {
          player1: null as any,
          player2: null as any,
          player1Locked: false,
          player2Locked: false,
          fullyLocked: false,
          isBye: false,
          matchNumber: match.matchNumber
        };
        
        // Check if position 1 is a bye
        const pos1IsBye = byePositions.includes(match.position1);
        // Check if position 2 is a bye
        const pos2IsBye = byePositions.includes(match.position2);
        
        // Assign players based on bye positions
        if (!pos1IsBye && playerIndex < shuffledPlayers.length) {
          pair.player1 = shuffledPlayers[playerIndex++];
        }
        
        if (!pos2IsBye && playerIndex < shuffledPlayers.length) {
          pair.player2 = shuffledPlayers[playerIndex++];
        }
        
        // Mark if this is a bye match
        pair.isBye = (pair.player1 === null || pair.player2 === null);
        component.playerPairs.push(pair);
      }
      
      // Verify pairs
      expect(component.playerPairs.length).toBeGreaterThan(0);
      
      // No bye vs bye matches
      expect(hasNoByeVsByePairs(component.playerPairs)).toBeTrue();
      
      // All players should be assigned
      expect(countAssignedPlayers(component.playerPairs)).toBe(playerCount);
    };
    
    it('should generate valid bracket for 2 players', () => {
      testBracketGeneration(2);
    });
    
    it('should generate valid bracket for 3 players', () => {
      testBracketGeneration(3);
    });
    
    it('should generate valid bracket for 4 players', () => {
      testBracketGeneration(4);
    });
    
    it('should generate valid bracket for 5 players', () => {
      testBracketGeneration(5);
    });
    
    it('should generate valid bracket for 6 players', () => {
      testBracketGeneration(6);
    });
    
    it('should generate valid bracket for 7 players', () => {
      testBracketGeneration(7);
    });
  });

  describe('Bye Position Calculation', () => {
    // Helper to check if bye positions can create a bye vs bye match
    const hasByeVsByeMatch = (byePositions: number[], totalSlots: number): boolean => {
      // Convert to 0-indexed
      const zeroIndexedPositions = byePositions.map(p => p - 1);
      
      // Check every pair (positions 0-1, 2-3, 4-5, etc.)
      for (let i = 0; i < totalSlots; i += 2) {
        const pos1 = i;
        const pos2 = i + 1;
        
        // If both positions in a pair are byes, it's a bye vs bye match
        if (zeroIndexedPositions.includes(pos1) && zeroIndexedPositions.includes(pos2)) {
          return true;
        }
      }
      
      return false;
    };
    
    it('should calculate correct bye positions for 3 players (1 bye)', () => {
      const byePositions = component.calculateByePositions(4, 1);
      expect(byePositions.length).toBe(1);
      expect(hasByeVsByeMatch(byePositions, 4)).toBeFalse();
    });
    
    it('should calculate correct bye positions for 5 players (3 byes)', () => {
      const byePositions = component.calculateByePositions(8, 3);
      expect(byePositions.length).toBe(3);
      expect(hasByeVsByeMatch(byePositions, 8)).toBeFalse();
    });
    
    it('should calculate correct bye positions for 6 players (2 byes)', () => {
      const byePositions = component.calculateByePositions(8, 2);
      expect(byePositions.length).toBe(2);
      expect(byePositions).toEqual([2, 7]); // These are the optimal positions
      expect(hasByeVsByeMatch(byePositions, 8)).toBeFalse();
    });
    
    it('should calculate correct bye positions for 7 players (1 bye)', () => {
      const byePositions = component.calculateByePositions(8, 1);
      expect(byePositions.length).toBe(1);
      expect(hasByeVsByeMatch(byePositions, 8)).toBeFalse();
    });
    
    it('should calculate correct bye positions for 10 players (6 byes)', () => {
      const byePositions = component.calculateByePositions(16, 6);
      expect(byePositions.length).toBe(6);
      expect(hasByeVsByeMatch(byePositions, 16)).toBeFalse();
    });
  });
});