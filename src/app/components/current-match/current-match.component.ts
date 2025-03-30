// src/app/components/current-match/current-match.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TournamentService } from '../../services/tournament.service';
import { MatchWinnerAnimationComponent } from '../match-winner-animation/match-winner-animation.component';

@Component({
  selector: 'current-match',
  standalone: true,
  imports: [CommonModule, FormsModule, MatchWinnerAnimationComponent],
  template: `
    <div class="bg-blue-100 p-6 rounded-lg shadow border-2 border-blue-300 relative">
      <h2 class="text-xl font-semibold mb-4">Nykyinen ottelu</h2>
      
      <div *ngIf="tournamentService.currentMatch; let match">
        <div class="mb-4 text-center">
          <span class="text-sm bg-blue-600 text-white py-1 px-3 rounded-full">
            {{ tournamentService.getRound(match.round) }} - Ottelu {{ match.position + 1 }}
          </span>
          <span class="ml-2 text-sm bg-green-600 text-white py-1 px-3 rounded-full">
            BO{{ tournamentService.bestOfLegs }}
          </span>
          <span class="ml-2 text-sm bg-purple-600 text-white py-1 px-3 rounded-full">
            {{ tournamentService.gameMode }}
          </span>
        </div>
        
        <div class="flex flex-col md:flex-row justify-between items-center mb-6">
          <div class="text-center w-full md:w-2/5 mb-4 md:mb-0">
            <div class="font-bold text-3xl">{{ tournamentService.getPlayerName(match.player1Id!) }}</div>
            
            <div class="mt-4 mb-3">
              <div class="text-2xl font-bold">Legit: {{ match.player1Legs }}</div>
            </div>
            
            <div class="flex justify-center items-center mt-4">
              <button 
                (click)="decreasePlayer1Legs()"
                class="bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 mr-2 text-lg font-bold"
                [disabled]="match.player1Legs <= 0 || tournamentService.showMatchVictoryAnimation">
                -
              </button>
              <button 
                (click)="increasePlayer1Legs()"
                class="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 text-lg font-bold"
                [disabled]="tournamentService.showMatchVictoryAnimation">
                +
              </button>
            </div>
          </div>
          
          <div class="text-3xl font-bold mb-4 md:mb-0">vs</div>
          
          <div class="text-center w-full md:w-2/5">
            <div class="font-bold text-3xl">{{ tournamentService.getPlayerName(match.player2Id!) }}</div>
            
            <div class="mt-4 mb-3">
              <div class="text-2xl font-bold">Legit: {{ match.player2Legs }}</div>
            </div>
            
            <div class="flex justify-center items-center mt-4">
              <button 
                (click)="decreasePlayer2Legs()"
                class="bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 mr-2 text-lg font-bold"
                [disabled]="match.player2Legs <= 0 || tournamentService.showMatchVictoryAnimation">
                -
              </button>
              <button 
                (click)="increasePlayer2Legs()"
                class="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 text-lg font-bold"
                [disabled]="tournamentService.showMatchVictoryAnimation">
                +
              </button>
            </div>
          </div>
        </div>
        
        <!-- Match winner animation will appear here when a match is completed -->
        <match-winner-animation
          *ngIf="tournamentService.showMatchVictoryAnimation"
          [winnerName]="winnerName">
        </match-winner-animation>
      </div>
      
      <div *ngIf="!tournamentService.currentMatch" class="text-center">
        <div class="text-xl font-bold text-green-700 mb-4">Turnaus valmis!</div>
        
        <div *ngIf="tournamentService.matches.length > 0">
          <div class="mb-2">Voittaja:</div>
          <div class="text-2xl font-bold text-blue-600">
            {{ getWinner() }}
          </div>
          
          <div class="flex justify-center mt-6 space-x-4">
            <button 
              (click)="startNewTournament()" 
              class="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700">
              Etusivu
            </button>
            
            <button 
              (click)="restartWithSamePlayers()" 
              class="bg-green-600 text-white py-2 px-6 rounded-md hover:bg-green-700">
              Aloita uudelleen samoilla pelaajalla/asetuksilla
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class CurrentMatchComponent {
  winnerName = '';
  
  constructor(public tournamentService: TournamentService) {}
  
  increasePlayer1Legs(): void {
    if (!this.tournamentService.currentMatch) return;
    this.tournamentService.currentMatch.player1Legs++;
    this.checkForMatchCompletion();
  }
  
  decreasePlayer1Legs(): void {
    if (!this.tournamentService.currentMatch || this.tournamentService.currentMatch.player1Legs <= 0) return;
    this.tournamentService.currentMatch.player1Legs--;
  }
  
  increasePlayer2Legs(): void {
    if (!this.tournamentService.currentMatch) return;
    this.tournamentService.currentMatch.player2Legs++;
    this.checkForMatchCompletion();
  }
  
  decreasePlayer2Legs(): void {
    if (!this.tournamentService.currentMatch || this.tournamentService.currentMatch.player2Legs <= 0) return;
    this.tournamentService.currentMatch.player2Legs--;
  }
  
  checkForMatchCompletion(): void {
    if (!this.tournamentService.currentMatch) return;
    
    const match = this.tournamentService.currentMatch;
    const legsToWin = Math.ceil(this.tournamentService.bestOfLegs / 2);
    
    // Check if either player has won enough legs
    if (match.player1Legs >= legsToWin || match.player2Legs >= legsToWin) {
      // Match is complete
      match.isComplete = true;
      match.winner = match.player1Legs >= legsToWin ? match.player1Id : match.player2Id;
      
      // Record match history
      this.tournamentService.matchHistory.push({
        matchId: match.id,
        player1Name: this.tournamentService.getPlayerName(match.player1Id!),
        player2Name: this.tournamentService.getPlayerName(match.player2Id!),
        player1Score: match.player1Legs,
        player2Score: match.player2Legs,
        player1Legs: match.player1Legs,
        player2Legs: match.player2Legs,
        winnerName: this.tournamentService.getPlayerName(match.winner!),
        timestamp: new Date(),
        gameMode: this.tournamentService.gameMode
      });
      
      // Store the winner name before advancing (for the animation)
      this.winnerName = this.tournamentService.getPlayerName(match.winner!);
      
      // Check if this is the final match
      const isFinalMatch = this.isFinalMatch(match);
      
      // Advance winner to next round
      this.tournamentService.advancePlayerToNextRound(match);
      
      if (isFinalMatch) {
        // If it's the final match, skip the animation and go directly to tournament end
        this.tournamentService.findNextMatch();
      } else {
        // Show winner animation for non-final matches
        this.tournamentService.showMatchVictoryAnimation = true;
        
        // Don't find the next match yet - this will be done after the animation completes
      }
    }
  }
  
  // Helper method to determine if the current match is the final match
  isFinalMatch(match: any): boolean {
    const totalRounds = Math.ceil(Math.log2(this.tournamentService.players.length));
    return match.round === totalRounds - 1;
  }
  
  startNewTournament(): void {
    this.tournamentService.resetTournament();
  }
  
  restartWithSamePlayers(): void {
    const playerNames = this.tournamentService.players.map(p => p.name);
    const gameMode = this.tournamentService.gameMode;
    const bestOfLegs = this.tournamentService.bestOfLegs;
    
    this.tournamentService.resetTournament();
    this.tournamentService.registerPlayers(playerNames, gameMode, bestOfLegs);
  }
  
  getWinner(): string {
    if (this.tournamentService.matches.length === 0) return '';
    
    const finalMatch = this.tournamentService.matches[this.tournamentService.matches.length - 1];
    if (finalMatch.winner) {
      return this.tournamentService.getPlayerName(finalMatch.winner);
    }
    return '';
  }
}