// src/app/components/weekly-current-match/weekly-current-match.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WeeklyTournamentService } from '../../services/weekly-tournament.service';
import { WeeklyMatchWinnerComponent } from '../weekly-match-winner/weekly-match-winner.component';

@Component({
  selector: 'weekly-current-match',
  standalone: true,
  imports: [CommonModule, FormsModule, WeeklyMatchWinnerComponent],
  template: `
    <div class="bg-blue-100 p-6 rounded-lg shadow border-2 border-blue-300 relative">
      <h2 class="text-xl font-semibold mb-4">Nykyinen ottelu</h2>

      <!-- Match Winner Animation -->
      <weekly-match-winner
        *ngIf="weeklyTournamentService.showMatchWinnerAnimation"
        [winnerName]="weeklyTournamentService.lastWinnerName">
      </weekly-match-winner>

      <div *ngIf="weeklyTournamentService.currentMatch; let match">
        <div class="mb-4 text-center">
          <span class="text-sm bg-blue-600 text-white py-1 px-3 rounded-full">
            {{ weeklyTournamentService.getRoundForMatch(match) }}
          </span>
          <span class="ml-2 text-sm bg-green-600 text-white py-1 px-3 rounded-full">
            BO{{ getEffectiveBestOf(match) }}
          </span>
          <span class="ml-2 text-sm bg-purple-600 text-white py-1 px-3 rounded-full">
            {{ weeklyTournamentService.gameMode }}
          </span>
          <span *ngIf="weeklyTournamentService.isPlayoffMatch(match)" class="ml-2 text-sm bg-red-600 text-white py-1 px-3 rounded-full">
            KARSINTA
          </span>
        </div>

        <!-- 3-way Final Display -->
        <div *ngIf="weeklyTournamentService.is3WayFinal() && match.round === 'final'" class="mb-6">
          <div class="text-center mb-4">
            <h3 class="text-xl font-bold text-green-600">3-way Finaali</h3>
            <p class="text-sm text-gray-600">Kaikki kolme pelataan samassa ottelussa</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <!-- Player 1 -->
            <div class="text-center bg-white p-4 rounded-lg border-2 border-blue-300">
              <div class="font-bold text-xl mb-2">{{ weeklyTournamentService.getPlayerName(match.player1Id) }}</div>
              <div class="text-lg font-bold mb-3">Legit: {{ match.player1Legs }}</div>
              <div class="flex justify-center space-x-2">
                <button
                  (click)="decreasePlayer1Legs()"
                  class="bg-gray-200 text-gray-800 py-1 px-3 rounded-md hover:bg-gray-300 font-bold"
                  [disabled]="match.player1Legs <= 0">
                  -
                </button>
                <button
                  (click)="increasePlayer1Legs()"
                  class="bg-blue-600 text-white py-1 px-3 rounded-md hover:bg-blue-700 font-bold">
                  +
                </button>
              </div>
            </div>

            <!-- Player 2 -->
            <div class="text-center bg-white p-4 rounded-lg border-2 border-blue-300">
              <div class="font-bold text-xl mb-2">{{ weeklyTournamentService.getPlayerName(match.player2Id) }}</div>
              <div class="text-lg font-bold mb-3">Legit: {{ match.player2Legs }}</div>
              <div class="flex justify-center space-x-2">
                <button
                  (click)="decreasePlayer2Legs()"
                  class="bg-gray-200 text-gray-800 py-1 px-3 rounded-md hover:bg-gray-300 font-bold"
                  [disabled]="match.player2Legs <= 0">
                  -
                </button>
                <button
                  (click)="increasePlayer2Legs()"
                  class="bg-blue-600 text-white py-1 px-3 rounded-md hover:bg-blue-700 font-bold">
                  +
                </button>
              </div>
            </div>

            <!-- Player 3 -->
            <div *ngIf="weeklyTournamentService.thirdFinalPlayer" class="text-center bg-white p-4 rounded-lg border-2 border-blue-300">
              <div class="font-bold text-xl mb-2">{{ weeklyTournamentService.thirdFinalPlayer.name }}</div>
              <div class="text-lg font-bold mb-3">Legit: {{ thirdPlayerLegs }}</div>
              <div class="flex justify-center space-x-2">
                <button
                  (click)="decreaseThirdPlayerLegs()"
                  class="bg-gray-200 text-gray-800 py-1 px-3 rounded-md hover:bg-gray-300 font-bold"
                  [disabled]="thirdPlayerLegs <= 0">
                  -
                </button>
                <button
                  (click)="increaseThirdPlayerLegs()"
                  class="bg-blue-600 text-white py-1 px-3 rounded-md hover:bg-blue-700 font-bold">
                  +
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Regular 2-player Match Display -->
        <div *ngIf="!weeklyTournamentService.is3WayFinal() || match.round !== 'final'" class="flex flex-col md:flex-row justify-between items-center mb-6">
          <div class="text-center w-full md:w-2/5 mb-4 md:mb-0">
            <div class="font-bold text-3xl">{{ weeklyTournamentService.getPlayerName(match.player1Id) }}</div>

            <div class="mt-4 mb-3">
              <div class="text-2xl font-bold">Legit: {{ match.player1Legs }}</div>
            </div>

            <div class="flex justify-center items-center mt-4">
              <button
                (click)="decreasePlayer1Legs()"
                class="bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 mr-2 text-lg font-bold"
                [disabled]="match.player1Legs <= 0">
                -
              </button>
              <button
                (click)="increasePlayer1Legs()"
                class="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 text-lg font-bold">
                +
              </button>
            </div>
          </div>

          <div class="text-3xl font-bold mb-4 md:mb-0">vs</div>

          <div class="text-center w-full md:w-2/5">
            <div class="font-bold text-3xl">{{ weeklyTournamentService.getPlayerName(match.player2Id) }}</div>

            <div class="mt-4 mb-3">
              <div class="text-2xl font-bold">Legit: {{ match.player2Legs }}</div>
            </div>

            <div class="flex justify-center items-center mt-4">
              <button
                (click)="decreasePlayer2Legs()"
                class="bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 mr-2 text-lg font-bold"
                [disabled]="match.player2Legs <= 0">
                -
              </button>
              <button
                (click)="increasePlayer2Legs()"
                class="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 text-lg font-bold">
                +
              </button>
            </div>
          </div>
        </div>

        <!-- Match progress indicator -->
        <div class="mb-4 text-center">
          <div class="text-sm text-gray-600 mb-2">
            Voittoon tarvitaan {{ getLegsToWin(match) }} legiä
          </div>
          <div *ngIf="!weeklyTournamentService.is3WayFinal() || match.round !== 'final'" class="flex justify-center space-x-1">
            <div *ngFor="let i of getProgressDots(match.player1Legs, getLegsToWin(match))"
                 class="w-3 h-3 rounded-full"
                 [class.bg-blue-600]="i <= match.player1Legs"
                 [class.bg-gray-300]="i > match.player1Legs"></div>
            <div class="w-6"></div>
            <div *ngFor="let i of getProgressDots(match.player2Legs, getLegsToWin(match))"
                 class="w-3 h-3 rounded-full"
                 [class.bg-blue-600]="i <= match.player2Legs"
                 [class.bg-gray-300]="i > match.player2Legs"></div>
          </div>
          <div *ngIf="weeklyTournamentService.is3WayFinal() && match.round === 'final'" class="grid grid-cols-3 gap-4">
            <div class="flex justify-center space-x-1">
              <div *ngFor="let i of getProgressDots(match.player1Legs, getLegsToWin(match))"
                   class="w-3 h-3 rounded-full"
                   [class.bg-blue-600]="i <= match.player1Legs"
                   [class.bg-gray-300]="i > match.player1Legs"></div>
            </div>
            <div class="flex justify-center space-x-1">
              <div *ngFor="let i of getProgressDots(match.player2Legs, getLegsToWin(match))"
                   class="w-3 h-3 rounded-full"
                   [class.bg-blue-600]="i <= match.player2Legs"
                   [class.bg-gray-300]="i > match.player2Legs"></div>
            </div>
            <div class="flex justify-center space-x-1">
              <div *ngFor="let i of getProgressDots(thirdPlayerLegs, getLegsToWin(match))"
                   class="w-3 h-3 rounded-full"
                   [class.bg-blue-600]="i <= thirdPlayerLegs"
                   [class.bg-gray-300]="i > thirdPlayerLegs"></div>
            </div>
          </div>
        </div>
      </div>

      <div *ngIf="!weeklyTournamentService.currentMatch" class="text-center">
        <div class="text-xl font-bold text-green-700 mb-4">
          {{ getTournamentCompleteMessage() }}
        </div>

        <div *ngIf="weeklyTournamentService.matches.length > 0 && isFullyComplete()">
          <div class="mb-4 p-4 bg-green-50 rounded-lg">
            <h3 class="font-semibold mb-3">🏆 Illan tulokset:</h3>
            <div class="space-y-2">
              <div *ngFor="let standing of getFinalResults(); let i = index"
                   class="flex justify-between items-center p-2 rounded"
                   [class.bg-yellow-200]="i === 0"
                   [class.bg-gray-100]="i === 1"
                   [class.bg-orange-100]="i === 2">
                <div class="flex items-center">
                  <span class="font-bold mr-2">{{ i + 1 }}.</span>
                  <span>{{ standing.playerName }}</span>
                  <span *ngIf="i < 3" class="ml-2 text-xs bg-green-600 text-white px-2 py-1 rounded-full">
                    +{{ getWeeklyPoints(i + 1) }}p
                  </span>
                </div>
                <div class="text-sm text-gray-600">
                  {{ standing.wins }}V - {{ standing.losses }}T ({{ standing.legDifference >= 0 ? '+' : '' }}{{ standing.legDifference }})
                </div>
              </div>
            </div>

            <div class="mt-4 p-3 bg-green-200 rounded-lg text-center">
              <div class="font-semibold">💰 Viikkopotti voittajalle:</div>
              <div class="text-xl font-bold text-green-700">{{ weeklyTournamentService.players.length * 2.5 }}€</div>
            </div>
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
              Uusi viikko samoilla pelaajilla
            </button>
          </div>
        </div>

        <!-- Tournament in progress but no current match -->
        <div *ngIf="!isFullyComplete() && weeklyTournamentService.isStarted">
          <div class="text-lg text-blue-600 mb-4">
            {{ getPhaseTransitionMessage() }}
          </div>
          <button
            (click)="continueToNextPhase()"
            class="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700">
            Jatka seuraavaan vaiheeseen
          </button>
        </div>
      </div>
    </div>
  `
})
export class WeeklyCurrentMatchComponent {
  thirdPlayerLegs = 0; // Track third player's legs for 3-way final

  constructor(public weeklyTournamentService: WeeklyTournamentService) {}

  increasePlayer1Legs(): void {
    if (!this.weeklyTournamentService.currentMatch) return;
    this.weeklyTournamentService.currentMatch.player1Legs++;
    this.checkForMatchCompletion();
  }

  decreasePlayer1Legs(): void {
    if (!this.weeklyTournamentService.currentMatch || this.weeklyTournamentService.currentMatch.player1Legs <= 0) return;
    this.weeklyTournamentService.currentMatch.player1Legs--;
  }

  increasePlayer2Legs(): void {
    if (!this.weeklyTournamentService.currentMatch) return;
    this.weeklyTournamentService.currentMatch.player2Legs++;
    this.checkForMatchCompletion();
  }

  decreasePlayer2Legs(): void {
    if (!this.weeklyTournamentService.currentMatch || this.weeklyTournamentService.currentMatch.player2Legs <= 0) return;
    this.weeklyTournamentService.currentMatch.player2Legs--;
  }

  checkForMatchCompletion(): void {
    if (!this.weeklyTournamentService.currentMatch) return;

    const match = this.weeklyTournamentService.currentMatch;
    const legsToWin = this.getLegsToWin(match);

    // Check for 3-way final completion
    if (this.weeklyTournamentService.is3WayFinal() && match.round === 'final') {
      const legs = [match.player1Legs, match.player2Legs, this.thirdPlayerLegs];
      const maxLegs = Math.max(...legs);

      if (maxLegs >= legsToWin) {
        // Determine winner
        let winnerId: number;
        if (match.player1Legs === maxLegs) {
          winnerId = match.player1Id;
        } else if (match.player2Legs === maxLegs) {
          winnerId = match.player2Id;
        } else {
          winnerId = this.weeklyTournamentService.thirdFinalPlayer!.id;
        }

        this.weeklyTournamentService.completeMatch(winnerId);
        return;
      }
    }

    // Regular 2-player match completion
    if (match.player1Legs >= legsToWin || match.player2Legs >= legsToWin) {
      const winnerId = match.player1Legs >= legsToWin ? match.player1Id : match.player2Id;
      this.weeklyTournamentService.completeMatch(winnerId);
    }
  }

  increaseThirdPlayerLegs(): void {
    this.thirdPlayerLegs++;
    this.checkForMatchCompletion();
  }

  decreaseThirdPlayerLegs(): void {
    if (this.thirdPlayerLegs <= 0) return;
    this.thirdPlayerLegs--;
  }

  getEffectiveBestOf(match: any): number {
    // Playoff matches are BO1
    if (this.weeklyTournamentService.isPlayoffMatch(match)) {
      return 1;
    }
    return this.weeklyTournamentService.bestOfLegs;
  }

  getLegsToWin(match: any): number {
    const bestOf = this.getEffectiveBestOf(match);
    return Math.ceil(bestOf / 2);
  }

  getProgressDots(currentLegs: number, maxLegs: number): number[] {
    return Array.from({ length: maxLegs }, (_, i) => i + 1);
  }

  getTournamentCompleteMessage(): string {
    if (!this.weeklyTournamentService.isStarted) {
      return 'Turnaus ei ole alkanut';
    }

    if (this.isFullyComplete()) {
      return 'Viikkokisat päättyneet!';
    }

    switch (this.weeklyTournamentService.currentPhase) {
      case 'group':
        return 'Lohkopelit päättyneet';
      case 'playoff':
        return 'Karsinnat päättyneet';
      case 'final':
        return 'Finaali päättynyt';
      default:
        return 'Vaihe päättynyt';
    }
  }

  getPhaseTransitionMessage(): string {
    switch (this.weeklyTournamentService.currentPhase) {
      case 'group':
        if (this.weeklyTournamentService.tournamentType === 'round-robin') {
          return this.weeklyTournamentService.players.length === 3
            ? 'Kaikki ottelut pelattu!'
            : 'Karsinnat päättyneet - finalistit selvillä!';
        }
        return 'Lohkopelit päättyneet - siirtymässä karsintaan';
      case 'playoff':
        return 'Karsinta päättynyt - siirtymässä finaaliin';
      default:
        return '';
    }
  }

  isFullyComplete(): boolean {
    if (this.weeklyTournamentService.currentPhase === 'final' && !this.weeklyTournamentService.currentMatch) {
      const finalMatches = this.weeklyTournamentService.matches.filter(m => m.round === 'final');
      return finalMatches.length > 0 && finalMatches.every(m => m.isComplete);
    }

    // For 3-player round robin, complete when all group matches are done
    if (this.weeklyTournamentService.players.length === 3 &&
      this.weeklyTournamentService.tournamentType === 'round-robin' &&
      this.weeklyTournamentService.currentPhase === 'group' &&
      !this.weeklyTournamentService.currentMatch) {
      const groupMatches = this.weeklyTournamentService.matches.filter(m => m.round === 'group');
      return groupMatches.length > 0 && groupMatches.every(m => m.isComplete);
    }

    return false;
  }

  getFinalResults(): any[] {
    return this.weeklyTournamentService.getSortedStandings();
  }

  getWeeklyPoints(position: number): number {
    switch (position) {
      case 1: return 5;
      case 2: return 3;
      case 3: return 1;
      default: return 0;
    }
  }

  continueToNextPhase(): void {
    // This will trigger the phase transition logic
    this.weeklyTournamentService.findNextMatch();
  }

  startNewTournament(): void {
    this.weeklyTournamentService.resetTournament();
  }

  restartWithSamePlayers(): void {
    const playerNames = this.weeklyTournamentService.players.map(p => p.name);
    const gameMode = this.weeklyTournamentService.gameMode;
    const bestOfLegs = this.weeklyTournamentService.bestOfLegs;
    const weekNumber = this.weeklyTournamentService.weekNumber + 1; // Next week

    this.weeklyTournamentService.resetTournament();
    this.weeklyTournamentService.registerPlayers(playerNames, gameMode, bestOfLegs, weekNumber);
  }
}
