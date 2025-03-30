// src/app/components/tournament-winners/tournament-winners.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TournamentService, GameMode, TournamentWinner } from '../../services/tournament.service';

interface WinnerStat {
  playerName: string;
  total: number;
  wins: {
    '301': number;
    '501': number;
    '701': number;
    'Cricket': number;
  };
}

@Component({
  selector: 'tournament-winners',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-gray-100 p-6 rounded-lg shadow">
      <h2 class="text-xl font-semibold mb-4">Voittajat</h2>
      
      <div *ngIf="winnerStats.length === 0" class="text-center py-4 text-gray-500">
        Ei vielä voittajia.
      </div>
      
      <div *ngIf="winnerStats.length > 0" class="overflow-x-auto">
        <table class="min-w-full bg-white rounded-lg overflow-hidden">
          <thead class="bg-gray-100">
            <tr>
              <th class="px-4 py-2 text-left">Pelaaja</th>
              <th class="px-4 py-2 text-center">Voitot yhteensä</th>
              <th class="px-4 py-2 text-center">301</th>
              <th class="px-4 py-2 text-center">501</th>
              <th class="px-4 py-2 text-center">701</th>
              <th class="px-4 py-2 text-center">Cricket</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let stat of winnerStats" class="border-t">
              <td class="px-4 py-2 font-semibold">{{ stat.playerName }}</td>
              <td class="px-4 py-2 text-center font-bold">{{ stat.total }}</td>
              <td class="px-4 py-2 text-center" [class.font-bold]="stat.wins['301'] > 0" [class.text-green-600]="stat.wins['301'] > 0">
                {{ stat.wins['301'] }}
              </td>
              <td class="px-4 py-2 text-center" [class.font-bold]="stat.wins['501'] > 0" [class.text-green-600]="stat.wins['501'] > 0">
                {{ stat.wins['501'] }}
              </td>
              <td class="px-4 py-2 text-center" [class.font-bold]="stat.wins['701'] > 0" [class.text-green-600]="stat.wins['701'] > 0">
                {{ stat.wins['701'] }}
              </td>
              <td class="px-4 py-2 text-center" [class.font-bold]="stat.wins['Cricket'] > 0" [class.text-green-600]="stat.wins['Cricket'] > 0">
                {{ stat.wins['Cricket'] }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div class="mt-6" *ngIf="tournamentService.tournamentWinners.length > 0">
        <h3 class="text-lg font-semibold mb-2">Viimeisimmät turnaukset</h3>
        <div class="bg-white rounded-lg p-4 divide-y">
          <div *ngFor="let winner of tournamentService.tournamentWinners.slice().reverse()" class="py-2">
            <div class="flex justify-between items-center">
              <div>
                <span class="font-bold">{{ winner.playerName }}</span> 
                voitti <span class="font-medium">{{ winner.gameMode }}</span> turnauksen
              </div>
              <div class="text-sm text-gray-600">
                {{ winner.date | date:'d.M.y' }} · {{ winner.playerCount }} pelaajaa
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class TournamentWinnersComponent {
  winnerStats: WinnerStat[] = [];
  
  constructor(public tournamentService: TournamentService) {
    this.updateWinnerStats();
  }
  
  ngDoCheck() {
    // Update stats when tournament winners change
    this.updateWinnerStats();
  }
  
  updateWinnerStats() {
    const winners = this.tournamentService.tournamentWinners;
    const stats: {[key: string]: WinnerStat} = {};
    
    // Count wins by player and game mode
    for (const winner of winners) {
      if (!stats[winner.playerName]) {
        stats[winner.playerName] = {
          playerName: winner.playerName,
          total: 0,
          wins: {
            '301': 0,
            '501': 0,
            '701': 0,
            'Cricket': 0
          }
        };
      }
      
      stats[winner.playerName].total++;
      stats[winner.playerName].wins[winner.gameMode as keyof typeof stats[string]['wins']]++;
    }
    
    // Convert to array and sort by total wins
    this.winnerStats = Object.values(stats).sort((a, b) => b.total - a.total);
  }
}