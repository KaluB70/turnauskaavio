// src/app/components/bracket/bracket.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TournamentService, Match } from '../../services/tournament.service';

@Component({
  selector: 'bracket',
  standalone: true,
  imports: [CommonModule],
  styles: [`
    .bracket-container {
      overflow-x: auto;
    }
    .round {
      min-width: 220px;
    }
    .match-connector {
      position: relative;
    }
    .match-connector:before {
      content: '';
      position: absolute;
      top: 50%;
      right: -25px;
      width: 25px;
      height: 2px;
      background-color: #ccc;
    }
    .match-connector:after {
      content: '';
      position: absolute;
      top: 25%;
      right: -25px;
      width: 2px;
      height: 50%;
      background-color: #ccc;
    }
    .round:last-child .match-connector:before,
    .round:last-child .match-connector:after {
      display: none;
    }
    .player-card {
      min-height: 60px;
      display: flex;
      align-items: center;
      padding: 12px 16px;
      border-radius: 8px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
      margin-bottom: 8px;
      background: white;
      position: relative;
    }
    .bracket-rounds {
      display: flex;
    }
    .bracket-final {
      display: flex;
      flex-direction: column;
      justify-content: space-evenly; /* Center the final match vertically */
    }
  `],
  template: `
    <div class="bg-gray-100 p-6 rounded-lg shadow">
      <h2 class="text-xl font-semibold mb-4">Turnauskaavio</h2>
      
      <div class="bracket-container">
        <div class="bracket-rounds">
          <!-- All rounds except the final -->
          <div *ngFor="let roundMatches of matchesByRound.slice(0, -1); let roundIndex = index" 
               class="round flex flex-col px-4 py-2"
               [style.justify-content]="getJustifyContent(roundIndex)">
            <div class="text-center font-medium mb-4 text-lg">
              {{ tournamentService.getRound(roundIndex, true) }}
            </div>
            
            <div *ngFor="let match of roundMatches; let i = index" 
                 class="mb-8 match-container">
              
              <div class="player-card match-connector" 
                   [class.border-l-4]="match.winner === match.player1Id" 
                   [class.border-green-500]="match.winner === match.player1Id"
                   [class.border-l-4]="match.player1Id === null" 
                   [class.border-green-500]="match.player1Id === null">
                <div [class]="getPlayerClass(match, match.player1Id)" class="flex-grow">
                  {{ getPlayerName(match.player1Id) }}
                </div>
                <div *ngIf="match.player1Legs > 0" class="font-bold text-lg" [class.text-green-600]="match.winner === match.player1Id">
                  {{ match.player1Legs }}
                </div>
              </div>
              
              <div class="player-card match-connector" 
                   [class.border-l-4]="match.winner === match.player2Id" 
                   [class.border-green-500]="match.winner === match.player2Id"
                   [class.border-l-4]="match.player2Id === null" 
                   [class.border-green-500]="match.player2Id === null">
                <div [class]="getPlayerClass(match, match.player2Id)" class="flex-grow">
                  {{ getPlayerName(match.player2Id) }}
                </div>
                <div *ngIf="match.player2Legs > 0" class="font-bold text-lg" [class.text-green-600]="match.winner === match.player2Id">
                  {{ match.player2Legs }}
                </div>
              </div>
            </div>
          </div>
          
          <!-- Final round centered -->
          <div *ngIf="matchesByRound.length > 0" class="bracket-final round px-4 py-2">
            <div class="text-center font-medium mb-4 text-lg">
              {{ tournamentService.getRound(matchesByRound.length - 1) }}
            </div>
            
            <div *ngFor="let match of matchesByRound[matchesByRound.length - 1]; let i = index" [ngStyle]="getFinalMatchContainerStyle()">
              
              <div class="player-card" 
                   [class.border-l-4]="match.winner === match.player1Id" 
                   [class.border-green-500]="match.winner === match.player1Id"
                   [class.border-l-4]="match.player1Id === null" 
                   [class.border-green-500]="match.player1Id === null">
                <div [class]="getPlayerClass(match, match.player1Id)" class="flex-grow">
                  {{ getPlayerName(match.player1Id) }}
                </div>
                <div *ngIf="match.player1Legs > 0" class="font-bold text-lg" [class.text-green-600]="match.winner === match.player1Id">
                  {{ match.player1Legs }}
                </div>
              </div>
              
              <div class="player-card" 
                   [class.border-l-4]="match.winner === match.player2Id" 
                   [class.border-green-500]="match.winner === match.player2Id"
                   [class.border-l-4]="match.player2Id === null" 
                   [class.border-green-500]="match.player2Id === null">
                <div [class]="getPlayerClass(match, match.player2Id)" class="flex-grow">
                  {{ getPlayerName(match.player2Id) }}
                </div>
                <div *ngIf="match.player2Legs > 0" class="font-bold text-lg" [class.text-green-600]="match.winner === match.player2Id">
                  {{ match.player2Legs }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="mt-6" *ngIf="tournamentService.matchHistory.length > 0">
        <button 
          (click)="undoLastMatch()" 
          class="bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 text-sm">
          Peruuta viimeinen ottelu
        </button>
      </div>
    </div>
  `
})
export class BracketComponent {
  get matchesByRound(): Match[][] {
    const rounds: Match[][] = [];
    const matchesCopy = [...this.tournamentService.matches].sort((a, b) => {
      if (a.round !== b.round) return a.round - b.round;
      return a.position - b.position;
    });
    
    for (const match of matchesCopy) {
      if (!rounds[match.round]) {
        rounds[match.round] = [];
      }
      rounds[match.round].push(match);
    }
    
    return rounds;
  }
  
  constructor(public tournamentService: TournamentService) {}
  
  getPlayerName(playerId: number | null): string {
    if (playerId === null) return 'TBD';
    return this.tournamentService.getPlayerName(playerId);
  }
  
  getPlayerClass(match: Match, playerId: number | null): string {
    if (match.winner === playerId) {
      return 'font-bold text-green-600';
    } else if (match.winner !== null && match.winner !== playerId) {
      return 'text-gray-500';
    }
    return '';
  }
  
  getJustifyContent(roundIndex: number): string {
    // Distribute matches evenly for better spacing
    const totalRounds = this.matchesByRound.length;
    if (roundIndex > 0) {
      return 'space-evenly';
    }
    return 'flex-start';
  }
  
  getFinalMatchContainerStyle(): { [klass: string]: any; } {
    // Dynamically adjust the margin based on the number of rounds
    const totalRounds = this.matchesByRound.length;
    
    if (totalRounds === 2) {  // Semifinals and Finals only
      return { 'margin-bottom': '4.5rem' }; // 4.5rem
    } else if (totalRounds === 3) {  // QF, SF, and Finals
      return { 'margin-bottom': '6.5rem' }; // 6.5rem
    } else if (totalRounds >= 4) {  // R1, QF, SF, and Finals
      return { 'margin-bottom': '8.5rem' }; // 8.5rem
    }
    
    return { 'margin-bottom': '2rem' }; // Default
  }
  
  undoLastMatch(): void {
    this.tournamentService.undoLastMatch();
  }
}
