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
      <h2 class="text-xl font-semibold mb-4">Otteluhistoria</h2>
      
      <div class="overflow-x-auto">
        <table class="min-w-full bg-white rounded-lg overflow-hidden">
          <thead class="bg-gray-100">
            <tr>
              <th class="px-4 py-2 text-left">Ottelu</th>
              <th class="px-4 py-2 text-left">Pelaaja 1</th>
              <th class="px-4 py-2 text-center">Erät</th>
              <th class="px-4 py-2 text-left">Pelaaja 2</th>
              <th class="px-4 py-2 text-left">Voittaja</th>
              <th class="px-4 py-2 text-left">Pelimuoto</th>
              <th class="px-4 py-2 text-left">Aika</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let result of tournamentService.matchHistory.slice().reverse()" class="border-t">
              <td class="px-4 py-2">{{ result.matchId }}</td>
              <td class="px-4 py-2">{{ result.player1Name }}</td>
              <td class="px-4 py-2 text-center font-mono">
                {{ result.player1Legs }} - {{ result.player2Legs }}
              </td>
              <td class="px-4 py-2">{{ result.player2Name }}</td>
              <td class="px-4 py-2 font-bold text-green-600">{{ result.winnerName }}</td>
              <td class="px-4 py-2">{{ result.gameMode }}</td>
              <td class="px-4 py-2 text-sm text-gray-600">
                {{ result.timestamp | date:'short' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class MatchHistoryComponent {
  constructor(public tournamentService: TournamentService) {}
}
