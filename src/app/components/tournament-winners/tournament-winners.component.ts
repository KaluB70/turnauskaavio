// src/app/components/tournament-winners/tournament-winners.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TournamentService } from '../../services/tournament.service';
import { WeeklyTournamentService } from '../../services/weekly-tournament.service';

@Component({
  selector: 'tournament-winners',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <!-- Weekly Tournament Results -->
      <div *ngIf="weeklyTournamentService.weeklyResults.length > 0" class="bg-blue-50 p-6 rounded-lg shadow border border-blue-200">
        <h2 class="text-xl font-semibold mb-4 flex items-center">
          <span class="mr-2">🎯</span>
          Viikkokisojen tulokset
        </h2>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div *ngFor="let result of getRecentWeeklyResults(); let i = index"
               class="bg-white p-4 rounded-lg shadow-sm"
               [class.border-2]="i === 0"
               [class.border-blue-400]="i === 0">

            <div class="flex items-center justify-between mb-2">
              <div class="font-bold text-lg text-blue-600">
                Viikko {{ result.weekNumber }}
              </div>
              <div *ngIf="i === 0" class="text-blue-500">
                ⭐
              </div>
            </div>

            <div class="text-sm text-gray-600 space-y-1 mb-3">
              <div class="flex justify-between">
                <span>Voittaja:</span>
                <span class="font-medium text-green-600">{{ result.finalRanking[0]?.playerName }}</span>
              </div>
              <div class="flex justify-between">
                <span>Pelaajia:</span>
                <span class="font-medium">{{ result.players.length }}</span>
              </div>
              <div class="flex justify-between">
                <span>Pelimuoto:</span>
                <span class="font-medium">{{ result.gameMode }}</span>
              </div>
              <div class="flex justify-between">
                <span>Päivä:</span>
                <span class="font-medium">{{ result.date | date:'dd.MM.yyyy' }}</span>
              </div>
            </div>

            <!-- Top 3 Results -->
            <div class="space-y-1">
              <div *ngFor="let ranking of result.finalRanking.slice(0, 3); let pos = index"
                   class="flex justify-between items-center text-xs p-1 rounded"
                   [class.bg-yellow-100]="pos === 0"
                   [class.bg-gray-100]="pos === 1"
                   [class.bg-orange-100]="pos === 2">
                <span>{{ pos + 1 }}. {{ ranking.playerName }}</span>
                <span class="font-medium">+{{ ranking.points }}p</span>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-6 text-center">
          <button
            (click)="clearWeeklyHistory()"
            class="text-sm text-red-600 hover:text-red-800 underline mr-4">
            Tyhjennä viikkokisat
          </button>
        </div>
      </div>

      <!-- Elimination Tournament Winners -->
      <div *ngIf="tournamentService.tournamentWinners.length > 0" class="bg-yellow-50 p-6 rounded-lg shadow border border-yellow-200">
        <h2 class="text-xl font-semibold mb-4 flex items-center">
          <span class="mr-2">🏆</span>
          Pudotusturnausten voittajat
        </h2>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div *ngFor="let winner of tournamentService.tournamentWinners.slice().reverse(); let i = index"
               class="bg-white p-4 rounded-lg shadow-sm"
               [class.border-2]="i === 0"
               [class.border-yellow-400]="i === 0">

            <div class="flex items-center justify-between mb-2">
              <div class="font-bold text-lg text-yellow-600">
                {{ winner.playerName }}
              </div>
              <div *ngIf="i === 0" class="text-yellow-500">
                👑
              </div>
            </div>

            <div class="text-sm text-gray-600 space-y-1">
              <div class="flex justify-between">
                <span>Pelaajia:</span>
                <span class="font-medium">{{ winner.playerCount }}</span>
              </div>
              <div class="flex justify-between">
                <span>Pelimuoto:</span>
                <span class="font-medium">{{ winner.gameMode }}</span>
              </div>
              <div class="flex justify-between">
                <span>Päivä:</span>
                <span class="font-medium">{{ winner.date | date:'dd.MM.yyyy' }}</span>
              </div>
            </div>

            <div class="mt-3 text-center">
              <span class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                🥇 Mestari
              </span>
            </div>
          </div>
        </div>

        <div class="mt-6 text-center">
          <button
            (click)="clearEliminationHistory()"
            class="text-sm text-red-600 hover:text-red-800 underline">
            Tyhjennä pudotusturnauset
          </button>
        </div>
      </div>

      <!-- No Results Message -->
      <div *ngIf="tournamentService.tournamentWinners.length === 0 && weeklyTournamentService.weeklyResults.length === 0"
           class="text-center text-gray-500 py-8 bg-gray-50 rounded-lg">
        Ei vielä turnausvoittajia
      </div>
    </div>
  `
})
export class TournamentWinnersComponent {
  constructor(
    public tournamentService: TournamentService,
    public weeklyTournamentService: WeeklyTournamentService
  ) {}

  getRecentWeeklyResults(): any[] {
    return this.weeklyTournamentService.weeklyResults
      .sort((a, b) => b.weekNumber - a.weekNumber)
      .slice(0, 6); // Show last 6 weeks
  }

  clearEliminationHistory(): void {
    if (confirm('Haluatko varmasti tyhjentää pudotusturnausten historian?')) {
      this.tournamentService.tournamentWinners = [];
      this.tournamentService.matchHistory = [];
      // Save to localStorage
      try {
        localStorage.setItem('darts_tournament_winners', JSON.stringify([]));
        localStorage.setItem('darts_match_history', JSON.stringify([]));
      } catch (error) {
        console.error('Error clearing elimination history from localStorage:', error);
      }
    }
  }

  clearWeeklyHistory(): void {
    if (confirm('Haluatko varmasti tyhjentää viikkokisojen historian?')) {
      this.weeklyTournamentService.weeklyResults = [];
      // Save to localStorage
      try {
        localStorage.setItem('darts_weekly_results', JSON.stringify([]));
      } catch (error) {
        console.error('Error clearing weekly history from localStorage:', error);
      }
    }
  }
}
