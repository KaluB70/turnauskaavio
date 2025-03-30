// src/app/components/bracket-roulette/bracket-roulette.component.ts
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TournamentService, Player } from '../../services/tournament.service';
import { trigger, state, style, animate, transition } from '@angular/animations';

interface PlayerPair {
  player1: Player | null;
  player2: Player | null;
  locked: boolean;
}

@Component({
  selector: 'bracket-roulette',
  standalone: true,
  imports: [CommonModule],
  animations: [
    trigger('cardFlip', [
      state('spinning', style({ 
        opacity: 0.7,
        transform: 'translateY(-8px)',
        backgroundColor: '#f0f9ff' 
      })),
      state('locked', style({ 
        opacity: 1,
        transform: 'translateY(0)',
        backgroundColor: '#bfdbfe'
      })),
      transition('spinning => locked', [
        animate('0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)')
      ])
    ]),
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('1s ease', style({ opacity: 1 })),
      ]),
    ])
  ],
  styles: [`
    .drumroll-container {
      position: relative;
      perspective: 1000px;
    }
    .player-pair {
      transition: all 0.3s ease;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    .player-card {
      transition: all 0.3s ease;
    }
    .name-roll {
      animation: nameChange 150ms linear infinite;
    }
    .slowing-down {
      animation-timing-function: ease-out;
    }
    @keyframes nameChange {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.7;
      }
    }
    .lock-animation {
      animation: lock 0.5s forwards;
    }
    .confetti {
      position: absolute;
      width: 10px;
      height: 10px;
      opacity: 0;
      animation: confetti-fall 3s ease-in-out forwards;
    }
    @keyframes confetti-fall {
      0% {
        transform: translateY(-20px) rotate(0deg);
        opacity: 1;
      }
      100% {
        transform: translateY(100px) rotate(360deg);
        opacity: 0;
      }
    }
  `],
  template: `
    <div class="bg-blue-100 p-6 rounded-lg shadow-lg relative overflow-hidden" @fadeIn>
      <h2 class="text-xl font-semibold mb-4 text-center">Generoidaan turnauskaavio</h2>
      
      <div class="text-center mb-6">
        <div class="text-3xl font-bold mb-2">{{ currentStep }}</div>
        <div class="text-lg text-blue-800">{{ currentAction }}</div>
      </div>
      
      <div class="drumroll-container">
        <div *ngFor="let confetti of confettis" 
             class="confetti"
             [style.left.px]="confetti.x"
             [style.top.px]="confetti.y"
             [style.background-color]="confetti.color"
             [style.transform]="'rotate(' + confetti.rotation + 'deg)'"></div>
             
        <!-- Player pairs being generated -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div *ngFor="let pair of playerPairs; let i = index" 
               class="player-pair bg-white p-4 rounded-lg border-2" 
               [class.border-blue-300]="!pair.locked"
               [class.border-green-500]="pair.locked"
               [@cardFlip]="pair.locked ? 'locked' : 'spinning'">
            
            <div class="flex justify-between items-center mb-2">
              <span class="text-sm text-gray-500">Ottelu {{ i + 1 }}</span>
              <span *ngIf="pair.locked" class="text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full">
                Lukittu!
              </span>
            </div>
            
            <div class="flex justify-between items-center">
              <div class="player-card flex-1 p-3 rounded-md" 
                   [class.bg-gray-100]="!pair.locked"
                   [class.bg-blue-50]="pair.locked && pair.player1">
                <span *ngIf="pair.player1">{{ pair.player1.name }}</span>
                <span *ngIf="!pair.player1 && pair.locked" class="text-gray-500">Bye</span>
                <span *ngIf="!pair.player1 && !pair.locked" class="text-gray-600">
                  <span class="inline-block name-roll" [style.animation-duration.ms]="getAnimationSpeed(i, 0)">
                    {{ getRollingName(i, 0) }}
                  </span>
                </span>
              </div>
              
              <div class="mx-2 text-lg font-bold">vs</div>
              
              <div class="player-card flex-1 p-3 rounded-md text-right" 
                   [class.bg-gray-100]="!pair.locked"
                   [class.bg-blue-50]="pair.locked && pair.player2">
                <span *ngIf="pair.player2">{{ pair.player2.name }}</span>
                <span *ngIf="!pair.player2 && pair.locked" class="text-gray-500">Bye</span>
                <span *ngIf="!pair.player2 && !pair.locked" class="text-gray-600">
                  <span class="inline-block name-roll" [style.animation-duration.ms]="getAnimationSpeed(i, 1)"
                        [class.slowing-down]="isSlowingDown(i)">
                    {{ getRollingName(i, 1) }}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="mt-8 text-center" *ngIf="allPairsLocked">
        <button 
          (click)="onStartTournament()" 
          class="bg-blue-600 text-white py-3 px-8 rounded-full text-xl font-bold hover:bg-blue-700 transition-colors">
          Aloita turnaus!
        </button>
      </div>
    </div>
  `
})
export class BracketRouletteComponent implements OnInit {
  @Input() players: Player[] = [];
  @Input() gameMode: string = '';
  @Input() bestOfLegs: number = 3;
  @Output() tournamentReady = new EventEmitter<void>();
  
  playerPairs: PlayerPair[] = [];
  confettis: { x: number; y: number; color: string; rotation: number }[] = [];
  allPairsLocked = false;
  
  // Animation progress states
  currentStep = 'Arvotaan parit';
  currentAction = 'Sekoitetaan pelaajalistaa...';
  
  // Colors for confetti
  confettiColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
  
  // For controlling animation speed
  private pairLockInterval = 1200; // ms between locking pairs
  private confettiInterval: any;
  private rollingNames: { [key: string]: string[] } = {}; // Store rolling names for each slot
  private rollingInterval: any;
  private drumrollAudio: HTMLAudioElement | null = null;
  
  constructor(private tournamentService: TournamentService) {}
  
  ngOnInit(): void {
    // Start audio at normal speed
    this.initAudio();
    this.playDrumroll(1.0);
    this.startRouletteAnimation();
  }
  
  initAudio(): void {
    // Create the audio element
    this.drumrollAudio = new Audio();
    this.drumrollAudio.src = 'assets/sounds/drumroll.mp3'; // You'll need to add this file
    this.drumrollAudio.loop = true;
    this.drumrollAudio.volume = 0.7;
    this.drumrollAudio.playbackRate = 1.0;
    
    // Preload the audio
    this.drumrollAudio.load();
  }
  
  playDrumroll(speed: number = 1.0): void {
    if (this.drumrollAudio) {
      this.drumrollAudio.playbackRate = speed;
      
      // If not already playing, start it
      if (this.drumrollAudio.paused) {
        this.drumrollAudio.play().catch(error => {
          console.warn('Audio playback failed:', error);
        });
      }
    }
  }
  
  stopDrumroll(): void {
    if (this.drumrollAudio && !this.drumrollAudio.paused) {
      this.drumrollAudio.pause();
      this.drumrollAudio.currentTime = 0;
    }
  }
  
  startRouletteAnimation(): void {
    // Calculate the number of pairs needed (power of 2)
    const playerCount = this.players.length;
    const rounds = Math.ceil(Math.log2(playerCount));
    const totalSlots = Math.pow(2, rounds);
    const pairCount = totalSlots / 2; // Always a power of 2
    const byeCount = totalSlots - playerCount;
    
    console.log(`Players: ${playerCount}, Pairs needed: ${pairCount}, Byes: ${byeCount}`);
    
    // Initialize empty pairs - always use the power of 2 count
    for (let i = 0; i < pairCount; i++) {
      this.playerPairs.push({
        player1: null,
        player2: null,
        locked: false
      });
      
      // Initialize rolling names for this pair
      this.rollingNames[`${i}-0`] = this.generateNameOptions();
      this.rollingNames[`${i}-1`] = this.generateNameOptions();
    }
    
    // Start the name rolling animation
    this.startNameRolling();
    
    // Schedule the animation steps
    setTimeout(() => {
      this.currentAction = 'Pelaajat sekoitettu!';
      setTimeout(() => this.assignPlayersAnimation(), 1000);
    }, 2000);
    
    // Start confetti effect
    this.startConfetti();
  }
  
  // Generate random name options for rolling effect
  generateNameOptions(): string[] {
    const options = [...this.players.map(p => p.name)];
    // Add some "Bye" options
    for (let i = 0; i < Math.ceil(this.players.length / 4); i++) {
      options.push("Bye");
    }
    
    // Shuffle the array
    const shuffled = [...options];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
  
  // Start the rolling name animation
  startNameRolling(): void {
    // Update rolling names at a rapid interval
    this.rollingInterval = setInterval(() => {
      Object.keys(this.rollingNames).forEach(key => {
        // Only roll if the pair isn't locked yet
        const [pairIndex, position] = key.split('-').map(Number);
        if (pairIndex < this.playerPairs.length && !this.playerPairs[pairIndex].locked) {
          // Rotate the array to create the rolling effect
          const arr = this.rollingNames[key];
          arr.push(arr.shift()!);
        }
      });
    }, 100);
  }
  
  // Get the current rolling name for a position
  getRollingName(pairIndex: number, position: number): string {
    const key = `${pairIndex}-${position}`;
    if (this.rollingNames[key] && this.rollingNames[key].length > 0) {
      return this.rollingNames[key][0];
    }
    return '...';
  }
  
  // Determine if we're in the slowing down phase for this pair
  isSlowingDown(pairIndex: number): boolean {
    // The next pair to be locked is slowing down
    const nextLockIndex = this.playerPairs.findIndex(pair => !pair.locked);
    return pairIndex === nextLockIndex;
  }
  
  // Get the animation speed - slow down as we approach locking
  getAnimationSpeed(pairIndex: number, position: number): number {
    if (this.isSlowingDown(pairIndex)) {
      // Return increasing duration to slow down the animation
      return 300 + (pairIndex * 50);
    }
    // Normal speed for pairs not being locked
    return 150;
  }
  
  startConfetti(): void {
    this.confettiInterval = setInterval(() => {
      if (this.confettis.length > 50) {
        this.confettis.shift(); // Remove oldest confetti
      }
      
      this.confettis.push({
        x: Math.random() * window.innerWidth * 0.8,
        y: Math.random() * 100,
        color: this.confettiColors[Math.floor(Math.random() * this.confettiColors.length)],
        rotation: Math.random() * 360
      });
    }, 200);
  }
  
  stopConfetti(): void {
    if (this.confettiInterval) {
      clearInterval(this.confettiInterval);
    }
    if (this.rollingInterval) {
      clearInterval(this.rollingInterval);
    }
  }
  
  ngOnDestroy(): void {
    this.stopConfetti();
    this.stopDrumroll();
  }
  
  assignPlayersAnimation(): void {
    let pairIndex = 0;
    this.playDrumroll(1.20 + (pairIndex * 0.25));
    this.currentStep = 'Luodaan otteluparit';
    this.currentAction = 'Valitaan pelaajat otteluihin...';
    
    // Shuffle player array for random pairings
    const shuffledPlayers = [...this.players].sort(() => Math.random() - 0.5);
    
    // Calculate total slots (power of 2)
    const rounds = Math.ceil(Math.log2(this.players.length));
    const totalSlots = Math.pow(2, rounds);
    const byeCount = totalSlots - shuffledPlayers.length;
    
    // Create seeded positions for players that guarantees optimal bye distribution
    // true = player position, false = bye position
    const seedPositions = this.createSeedPositions(totalSlots, byeCount);
    
    // Begin locking pairs one by one with delay
    let playerIndex = 0;
    
    // Processes each pair sequentially with delays between steps
    const lockNextPair = () => {
      if (pairIndex >= this.playerPairs.length) {
        // All pairs are locked
        this.finishAnimation();
        return;
      }
      
      const pair = this.playerPairs[pairIndex];
      
      // First, highlight that we're working on this pair
      this.currentAction = `Arvotaan ottelua ${pairIndex + 1}...`;
      
      // Speed up the audio as we're about to lock a pair
      this.playDrumroll(1.0 + (pairIndex * 0.15));
      
      // Get seed positions for this pair
      const pos1 = pairIndex * 2;
      const pos2 = pairIndex * 2 + 1;
      
      // Determine if positions should be players or byes
      const pos1IsBye = !seedPositions[pos1];
      const pos2IsBye = !seedPositions[pos2];
      
      // Assign players to positions that should have players
      if (!pos1IsBye && playerIndex < shuffledPlayers.length) {
        pair.player1 = shuffledPlayers[playerIndex++];
      }
      
      if (!pos2IsBye && playerIndex < shuffledPlayers.length) {
        pair.player2 = shuffledPlayers[playerIndex++];
      }
      
      // Force the correct names to appear in the rolling display during slowdown
      const key1 = `${pairIndex}-0`;
      const key2 = `${pairIndex}-1`;
      
            // Slowdown animation phase (3 seconds)
      if (pair.player1) {
        this.rollingNames[key1] = [pair.player1.name, ...this.rollingNames[key1].filter(n => n !== pair.player1?.name)];
      } else {
        this.rollingNames[key1] = ["Bye", ...this.rollingNames[key1].filter(n => n !== "Bye")];
      }
      
      if (pair.player2) {
        this.rollingNames[key2] = [pair.player2.name, ...this.rollingNames[key2].filter(n => n !== pair.player2?.name)];
      } else {
        this.rollingNames[key2] = ["Bye", ...this.rollingNames[key2].filter(n => n !== "Bye")];
      }
      
      // Further increase audio speed during the final locking moments
      this.playDrumroll(1.20 + (pairIndex * 0.25));
      
      // After slowdown, lock in the players (3 seconds)
      setTimeout(() => {
        // Lock the pair with dramatic pause
        pair.locked = true;
        this.currentAction = `Lukittu ottelu ${pairIndex + 1}!`;
        
        // Add a pause before moving to the next pair (2 seconds)
        pairIndex++;
        setTimeout(() => {
          lockNextPair(); // Process the next pair
        }, 2000);
      }, 3000);
    };
    
    // Start the sequential locking
    setTimeout(() => lockNextPair(), 1000);
  }
  
  // Creates optimal seed positions to ensure no bye vs bye
  createSeedPositions(totalPositions: number, byeCount: number): boolean[] {
    // Create array with all positions as players
    const positions = Array(totalPositions).fill(true);
    
    if (byeCount === 0) {
      return positions; // No byes needed
    }
    
    // Generate the seed positions in the correct order (1-indexed)
    const seedOrder: number[] = [];
    
    // Helper function to generate the seeding order recursively
    const generateOrder = (start: number, end: number): void => {
      if (start > end) return;
      
      const mid = Math.floor((start + end) / 2);
      seedOrder.push(mid);
      
      generateOrder(start, mid - 1);
      generateOrder(mid + 1, end);
    };
    
    generateOrder(1, totalPositions);
    
    // Mark the bye positions based on the seeding order
    // Place byes at the highest seeds first
    for (let i = 0; i < byeCount; i++) {
      // Convert 1-indexed seed to 0-indexed position
      const position = seedOrder[i] - 1;
      positions[position] = false; // This position is now a bye
    }
    
    // Crucial step: Ensure no bye vs bye matches
    for (let i = 0; i < totalPositions; i += 2) {
      if (!positions[i] && !positions[i + 1]) {
        // Found a bye vs bye match - fix it by moving one bye
        // Find the next match with two players and make one a bye
        for (let j = 0; j < totalPositions; j += 2) {
          if (positions[j] && positions[j + 1]) {
            // Found a match with two players, make one a bye
            positions[j] = false; // Convert to a bye
            positions[i] = true;  // Convert back to a player
            break;
          }
        }
      }
    }
    
    return positions;
  }
  
  shouldPlaceBye(pairIndex: number, position: number, byeCount: number, totalPairs: number): boolean {
    // This is a simplified version. In a real implementation, you'd need to
    // carefully distribute byes to ensure they don't face each other
    if (byeCount <= 0) return false;
    
    // Place byes starting from last pairs for this demo
    // In a real tournament, you'd want to distribute them according to seeding rules
    const positionInTotalSlots = pairIndex * 2 + position;
    const totalSlots = totalPairs * 2;
    
    // Distribute byes starting from the last positions
    return positionInTotalSlots >= totalSlots - byeCount;
  }
  
  finishAnimation(): void {
    this.currentStep = 'Turnauskaavio valmis!';
    this.currentAction = 'Kaikki pelaajat arvottu paikoilleen.';
    this.allPairsLocked = true;
    
    // Stop the drumroll and play a success sound
    this.stopDrumroll();
    this.playSuccessSound();
    
    // Stop the confetti animation
    this.stopConfetti();
  }
  
  playSuccessSound(): void {
    const successAudio = new Audio('assets/sounds/success.mp3');
    successAudio.volume = 0.7;
    successAudio.play().catch(error => {
      console.warn('Audio playback failed:', error);
    });
  }
  
  onStartTournament(): void {
    // Create exact pairings structure
    const pairings = this.playerPairs.map(pair => ({
      player1: pair.player1 ? pair.player1.name : null,
      player2: pair.player2 ? pair.player2.name : null
    }));
    
    // Save the game mode and best of settings
    const gameMode = this.tournamentService.gameMode;
    const bestOfLegs = this.bestOfLegs;
    
    // Reset and set up tournament with exact pairings
    this.tournamentService.resetTournament();
    this.tournamentService.registerPlayersWithPairings(pairings, gameMode, bestOfLegs);
    
    // Emit event to signal that tournament is ready
    this.tournamentReady.emit();
  }
}