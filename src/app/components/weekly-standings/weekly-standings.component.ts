// src/app/components/weekly-standings/weekly-standings.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WeeklyTournamentService } from '../../services/weekly-tournament.service';

interface PlayerSeasonStats {
  playerName: string;
  totalPoints: number;
  weeksPlayed: number;
  wins: number;
  podiumFinishes: number; // Top 3 finishes
  averagePosition: number;
  bestWeek: number;
  worstWeek: number;
  weeklyResults: { week: number; position: number; points: number }[];
}

@Component({
  selector: 'weekly-standings',
  standalone: true,
  imports: [CommonModule],
  styles: [`
    .standings-table {
      border-collapse: separate;
      border-spacing: 0;
    }
    .standings-row {
      transition: all 0.2s ease;
    }
    .standings-row:hover {
      background-color: #f9fafb;
      transform: translateX(2px);
    }
    .position-1 {
      background: linear-gradient(135deg, #fef3c7 0%, #fbbf24 100%);
      font-weight: 600;
    }
    .position-2 {
      background: linear-gradient(135deg, #f3f4f6 0%, #9ca3af 100%);
      font-weight: 600;
    }
    .position-3 {
      background: linear-gradient(135deg, #fed7aa 0%, #f97316 100%);
      font-weight: 600;
    }
    .points-badge {
      background: linear-gradient(135deg, #3b82f6, #1d4ed8);
      color: white;
      padding: 4px 8px;
      border-radius: 12px;
      font-weight: 600;
      font-size: 0.875rem;
    }
    .stats-card {
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
      border-left: 4px solid #3b82f6;
    }
    .week-result {
      display: inline-block;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      font-size: 0.75rem;
      font-weight: 600;
      text-align: center;
      line-height: 24px;
      margin-right: 2px;
    }
    .week-1 { background-color: #fbbf24; color: white; }
    .week-2 { background-color: #9ca3af; color: white; }
    .week-3 { background-color: #f97316; color: white; }
    .week-other { background-color: #e5e7eb; color: #374151; }
  `],
  template: `
    <div class="space-y-6">
      <!-- Season Overview -->
      <div class="stats-card p-6 rounded-lg shadow">
        <h2 class="text-2xl font-bold mb-4 flex items-center">
          <span class="mr-3">📊</span>
          Kauden tilastot
        </h2>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div class="text-center">
            <div class="text-2xl font-bold text-blue-600">{{ getCompletedWeeks() }}</div>
            <div class="text-sm text-gray-600">Pelattua viikkoa</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-green-600">{{ getUniquePlayers() }}</div>
            <div class="text-sm text-gray-600">Eri pelaajaa</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-purple-600">{{ getTotalMatches() }}</div>
            <div class="text-sm text-gray-600">Pelattu ottelua</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-orange-600">{{ getCurrentLeader()?.playerName || '-' }}</div>
            <div class="text-sm text-gray-600">Kärjessä</div>
          </div>
        </div>
      </div>

      <!-- Season Standings -->
      <div class="bg-white p-6 rounded-lg shadow">
        <h3 class="text-xl font-semibold mb-4 flex items-center">
          <span class="mr-2">🏆</span>
          Kauden kokonaistilanne
          <span class="ml-auto text-sm text-gray-500">7 parasta viikkoa lasketaan</span>
        </h3>

        <div *ngIf="seasonStandings.length === 0" class="text-center text-gray-500 py-8">
          Ei vielä pelattuja viikkokisoja
        </div>

        <div *ngIf="seasonStandings.length > 0" class="overflow-x-auto">
          <table class="standings-table w-full">
            <thead>
              <tr class="bg-gray-50">
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sija</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pelaaja</th>
                <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Pisteet</th>
                <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Viikkoja</th>
                <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Voitot</th>
                <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Podium</th>
                <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Keskisija</th>
                <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Viikottaiset tulokset</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr *ngFor="let player of seasonStandings; let i = index"
                  class="standings-row"
                  [class.position-1]="i === 0"
                  [class.position-2]="i === 1"
                  [class.position-3]="i === 2">

                <td class="px-4 py-3 whitespace-nowrap">
                  <div class="flex items-center">
                    <span class="text-lg font-bold">{{ i + 1 }}.</span>
                    <span *ngIf="i === 0" class="ml-2 text-yellow-500">👑</span>
                    <span *ngIf="i === 1" class="ml-2 text-gray-400">🥈</span>
                    <span *ngIf="i === 2" class="ml-2 text-orange-500">🥉</span>
                  </div>
                </td>

                <td class="px-4 py-3 whitespace-nowrap">
                  <div class="font-semibold text-gray-900">{{ player.playerName }}</div>
                </td>

                <td class="px-4 py-3 text-center">
                  <span class="points-badge">{{ player.totalPoints }}</span>
                </td>

                <td class="px-4 py-3 text-center text-sm">
                  {{ player.weeksPlayed }}
                </td>

                <td class="px-4 py-3 text-center">
                  <div class="flex items-center justify-center">
                    <span class="font-semibold">{{ player.wins }}</span>
                    <span *ngIf="player.wins > 0" class="ml-1 text-yellow-500">🏆</span>
                  </div>
                </td>

                <td class="px-4 py-3 text-center">
                  <div class="flex items-center justify-center">
                    <span class="font-semibold">{{ player.podiumFinishes }}</span>
                    <span *ngIf="player.podiumFinishes > 0" class="ml-1 text-orange-500">🏅</span>
                  </div>
                </td>

                <td class="px-4 py-3 text-center text-sm">
                  {{ player.averagePosition.toFixed(1) }}
                </td>

                <td class="px-4 py-3">
                  <div class="flex flex-wrap">
                    <div *ngFor="let result of player.weeklyResults.slice(0, 10)"
                         class="week-result"
                         [class.week-1]="result.position === 1"
                         [class.week-2]="result.position === 2"
                         [class.week-3]="result.position === 3"
                         [class.week-other]="result.position > 3"
                         [title]="'Viikko ' + result.week + ': ' + result.position + '. sija (' + result.points + 'p)'">
                      {{ result.position }}
                    </div>
                    <span *ngIf="player.weeklyResults.length > 10" class="text-xs text-gray-400 ml-2">
                      +{{ player.weeklyResults.length - 10 }}
                    </span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Recent Weeks Summary -->
      <div *ngIf="getRecentWeeks().length > 0" class="bg-gray-50 p-6 rounded-lg">
        <h3 class="text-lg font-semibold mb-4">📅 Viimeisimmät viikkokisat</h3>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div *ngFor="let week of getRecentWeeks()" class="bg-white p-4 rounded-lg shadow-sm">
            <div class="flex justify-between items-center mb-2">
              <span class="font-semibold text-blue-600">Viikko {{ week.weekNumber }}</span>
              <span class="text-xs text-gray-500">{{ week.date | date:'dd.MM' }}</span>
            </div>

            <div class="space-y-1">
              <div *ngFor="let ranking of week.finalRanking.slice(0, 3); let pos = index"
                   class="flex justify-between items-center text-sm">
                <div class="flex items-center">
                  <span class="w-4 text-center font-medium">{{ pos + 1 }}.</span>
                  <span class="ml-2">{{ ranking.playerName }}</span>
                </div>
                <span class="font-medium text-green-600">+{{ ranking.points }}p</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Player Performance Chart Placeholder -->
      <div *ngIf="seasonStandings.length > 0" class="bg-white p-6 rounded-lg shadow">
        <h3 class="text-lg font-semibold mb-4">📈 Pistetilanne kehitys</h3>
        <div class="text-center text-gray-500 py-8">
          <p>Pistekehityksen kaavio tulossa...</p>
          <p class="text-sm mt-2">Näyttää pelaajien pistemäärän kehityksen viikkojen aikana</p>
        </div>
      </div>
    </div>
  `
})
export class WeeklyStandingsComponent implements OnInit {
  seasonStandings: PlayerSeasonStats[] = [];

  constructor(private weeklyTournamentService: WeeklyTournamentService) {}

  ngOnInit(): void {
    this.calculateSeasonStandings();
  }

  private calculateSeasonStandings(): void {
    const allResults = this.weeklyTournamentService.weeklyResults;
    const playerStats: { [playerName: string]: PlayerSeasonStats } = {};

    // Process each weekly result
    for (const weekResult of allResults) {
      for (const ranking of weekResult.finalRanking) {
        if (!playerStats[ranking.playerName]) {
          playerStats[ranking.playerName] = {
            playerName: ranking.playerName,
            totalPoints: 0,
            weeksPlayed: 0,
            wins: 0,
            podiumFinishes: 0,
            averagePosition: 0,
            bestWeek: 999,
            worstWeek: 1,
            weeklyResults: []
          };
        }

        const player = playerStats[ranking.playerName];
        player.weeksPlayed++;
        player.totalPoints += ranking.points;
        player.weeklyResults.push({
          week: weekResult.weekNumber,
          position: ranking.position,
          points: ranking.points
        });

        // Track wins and podium finishes
        if (ranking.position === 1) player.wins++;
        if (ranking.position <= 3) player.podiumFinishes++;

        // Track best and worst weeks
        if (ranking.position < player.bestWeek) player.bestWeek = ranking.position;
        if (ranking.position > player.worstWeek) player.worstWeek = ranking.position;
      }
    }

    // Calculate average positions and apply 7-best-weeks rule
    for (const playerName in playerStats) {
      const player = playerStats[playerName];

      // Sort weekly results by points (descending) and take top 7
      const bestWeeks = player.weeklyResults
        .sort((a, b) => b.points - a.points)
        .slice(0, 7);

      // Recalculate total points based on best 7 weeks
      player.totalPoints = bestWeeks.reduce((sum, week) => sum + week.points, 0);

      // Calculate average position
      const totalPositions = player.weeklyResults.reduce((sum, week) => sum + week.position, 0);
      player.averagePosition = totalPositions / player.weeksPlayed;

      // Sort weekly results by week number for display
      player.weeklyResults.sort((a, b) => b.week - a.week);
    }

    // Convert to array and sort by total points
    this.seasonStandings = Object.values(playerStats)
      .sort((a, b) => {
        if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
        return a.averagePosition - b.averagePosition; // Better average position as tiebreaker
      });
  }

  getCompletedWeeks(): number {
    return new Set(this.weeklyTournamentService.weeklyResults.map(r => r.weekNumber)).size;
  }

  getUniquePlayers(): number {
    const players = new Set();
    this.weeklyTournamentService.weeklyResults.forEach(result => {
      result.finalRanking.forEach(ranking => players.add(ranking.playerName));
    });
    return players.size;
  }

  getTotalMatches(): number {
    // Estimate based on average players per week
    return this.weeklyTournamentService.weeklyResults.reduce((total, result) => {
      const playerCount = result.players.length;
      // Rough estimate of matches per tournament based on player count
      let matchesPerWeek = 0;
      if (playerCount <= 5) {
        // Round robin: n*(n-1)/2
        matchesPerWeek = (playerCount * (playerCount - 1)) / 2;
      } else {
        // Group based: roughly 3-4 matches per player
        matchesPerWeek = Math.floor(playerCount * 3.5);
      }
      return total + matchesPerWeek;
    }, 0);
  }

  getCurrentLeader(): PlayerSeasonStats | null {
    return this.seasonStandings.length > 0 ? this.seasonStandings[0] : null;
  }

  getRecentWeeks(): any[] {
    return this.weeklyTournamentService.weeklyResults
      .sort((a, b) => b.weekNumber - a.weekNumber)
      .slice(0, 6);
  }
}
