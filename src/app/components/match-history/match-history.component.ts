// src/app/components/match-history/match-history.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TournamentService } from '../../services/tournament.service';

@Component({
  selector: 'match-history',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-gray-100 p-6 rounded-lg shadow">
      <h2 class="text-xl font-semibold mb-4">Ottelupöytäkirja</h2>

      <div class="space-y-4">
        <div *ngFor="let result of tournamentService.matchHistory.slice().reverse(); let i = index"
             class="bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-500">
          <div class="flex justify-between items-start mb-2">
            <div class="font-medium">
              Ottelu {{ tournamentService.matchHistory.length - i }}
            </div>
            <div class="text-sm text-gray-500">
              {{ result.timestamp | date:'HH:mm' }}
            </div>
          </div>

          <div class="flex justify-between items-center">
            <div class="flex-1">
              <div class="text-lg" [class.font-bold]="result.winnerName === result.player1Name"
                   [class.text-green-600]="result.winnerName === result.player1Name">
                {{ result.player1Name }}
              </div>
            </div>

            <div class="mx-4 text-center">
              <div class="text-2xl font-bold">
                {{ result.player1Legs }} - {{ result.player2Legs }}
              </div>
              <div class="text-xs text-gray-500">
                {{ result.gameMode }}
              </div>
            </div>

            <div class="flex-1 text-right">
              <div class="text-lg" [class.font-bold]="result.winnerName === result.player2Name"
                   [class.text-green-600]="result.winnerName === result.player2Name">
                {{ result.player2Name }}
              </div>
            </div>
          </div>

          <div class="mt-2 text-center">
            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
              🏆 {{ result.winnerName }}
            </span>
          </div>
        </div>
      </div>

      <div *ngIf="tournamentService.matchHistory.length === 0" class="text-center text-gray-500 py-8">
        Ei vielä pelattuja otteluita
      </div>
    </div>
  `
})
export class MatchHistoryComponent {
  constructor(public tournamentService: TournamentService) {}
}
