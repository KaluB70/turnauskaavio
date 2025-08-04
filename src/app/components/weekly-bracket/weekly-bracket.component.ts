// src/app/components/weekly-bracket/weekly-bracket.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WeeklyTournamentService, WeeklyMatch, GroupStanding } from '../../services/weekly-tournament.service';

@Component({
  selector: 'weekly-bracket',
  standalone: true,
  imports: [CommonModule],
  styles: [`
    .group-container {
      background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
      border-left: 4px solid #3b82f6;
    }
    .match-card {
      transition: all 0.2s ease;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .match-card:hover {
      box-shadow: 0 4px 8px rgba(0,0,0,0.15);
      transform: translateY(-1px);
    }
    .completed-match {
      background-color: #f0f9ff;
      border-left: 4px solid #10b981;
    }
    .current-match {
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.8; }
    }
    .winner-highlight {
      background-color: #dcfce7;
      font-weight: 600;
    }
    .standings-table {
      border-collapse: separate;
      border-spacing: 0;
    }
    .standings-row {
      transition: background-color 0.2s ease;
    }
    .standings-row:hover {
      background-color: #f9fafb;
    }
    .position-1 { background-color: #fef3c7; } /* Gold */
    .position-2 { background-color: #e5e7eb; } /* Silver */
    .position-3 { background-color: #fed7aa; } /* Bronze */
    .finalist-badge {
      background-color: #10b981;
      color: white;
      font-size: 0.75rem;
      padding: 2px 6px;
      border-radius: 9999px;
    }
  `],
  template: `
    <div class="space-y-6">
      <!-- Tournament Header -->
      <div class="bg-blue-600 text-white p-4 rounded-lg">
        <div class="flex justify-between items-center">
          <div>
            <h2 class="text-xl font-semibold">🎯 Viikkokisat - Viikko {{ weeklyTournamentService.weekNumber }}</h2>
            <p class="text-blue-100">{{ weeklyTournamentService.getCurrentPhaseDescription() }}</p>
          </div>
          <div class="text-right">
            <div class="text-sm text-blue-100">Pelaajia: {{ weeklyTournamentService.players.length }}</div>
            <div class="text-sm text-blue-100">{{ weeklyTournamentService.gameMode }} - BO{{ weeklyTournamentService.bestOfLegs }}</div>
          </div>
        </div>
      </div>

      <!-- Group Phase Standings (Round Robin or Group Based) -->
      <div *ngIf="weeklyTournamentService.currentPhase === 'group' || weeklyTournamentService.currentPhase === 'playoff'">

        <!-- Round Robin Standings (3-5 players) -->
        <div *ngIf="weeklyTournamentService.tournamentType === 'round-robin'" class="bg-white p-6 rounded-lg shadow">
          <h3 class="text-lg font-semibold mb-4">
            {{ weeklyTournamentService.players.length === 3 ? 'Finaalin tulostaulukko' : 'Karsintojen tulostaulukko' }}
          </h3>
          <div class="overflow-x-auto">
            <table class="standings-table w-full">
              <thead>
              <tr class="bg-gray-50">
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sija</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pelaaja</th>
                <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Voitot</th>
                <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Tappiot</th>
                <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Legiero</th>
                <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Pisteet</th>
                <th *ngIf="weeklyTournamentService.players.length > 3" class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
              <tr *ngFor="let standing of getSortedStandings(); let i = index"
                  class="standings-row"
                  [class.position-1]="i === 0"
                  [class.position-2]="i === 1"
                  [class.position-3]="i === 2">
                <td class="px-4 py-3 whitespace-nowrap text-sm font-medium">{{ i + 1 }}.</td>
                <td class="px-4 py-3 whitespace-nowrap text-sm font-medium">{{ standing.playerName }}</td>
                <td class="px-4 py-3 text-center text-sm">{{ standing.wins }}</td>
                <td class="px-4 py-3 text-center text-sm">{{ standing.losses }}</td>
                <td class="px-4 py-3 text-center text-sm">{{ standing.legDifference >= 0 ? '+' : '' }}{{ standing.legDifference }}</td>
                <td class="px-4 py-3 text-center text-sm font-semibold">{{ standing.points }}</td>
                <td *ngIf="weeklyTournamentService.players.length > 3" class="px-4 py-3 text-center text-sm">
                  <span *ngIf="i < 3" class="finalist-badge">Finaaliin</span>
                </td>
              </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Group Based Standings (6+ players) -->
        <div *ngIf="weeklyTournamentService.tournamentType === 'group-based'" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div *ngFor="let group of [1, 2]" class="group-container p-6 rounded-lg">
            <h3 class="text-lg font-semibold mb-4">Lohko {{ group }}</h3>
            <div class="overflow-x-auto">
              <table class="standings-table w-full">
                <thead>
                <tr class="bg-gray-50">
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Sija</th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Pelaaja</th>
                  <th class="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">V-T</th>
                  <th class="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Legiero</th>
                  <th class="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Pisteet</th>
                  <th class="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                <tr *ngFor="let standing of getGroupStandings(group); let i = index"
                    class="standings-row"
                    [class.position-1]="i === 0"
                    [class.position-2]="i === 1">
                  <td class="px-3 py-2 whitespace-nowrap text-sm font-medium">{{ i + 1 }}.</td>
                  <td class="px-3 py-2 whitespace-nowrap text-sm font-medium">{{ standing.playerName }}</td>
                  <td class="px-3 py-2 text-center text-sm">{{ standing.wins }}-{{ standing.losses }}</td>
                  <td class="px-3 py-2 text-center text-sm">{{ standing.legDifference >= 0 ? '+' : '' }}{{ standing.legDifference }}</td>
                  <td class="px-3 py-2 text-center text-sm font-semibold">{{ standing.points }}</td>
                  <td class="px-3 py-2 text-center text-sm">
                    <span *ngIf="i === 0" class="text-xs bg-green-600 text-white px-2 py-1 rounded-full">Finaaliin</span>
                    <span *ngIf="i === 1" class="text-xs bg-yellow-600 text-white px-2 py-1 rounded-full">Karsinta</span>
                  </td>
                </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Group Based Standings (6+ players) -->
    <div *ngIf="weeklyTournamentService.tournamentType === 'group-based'" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div *ngFor="let group of [1, 2]" class="group-container p-6 rounded-lg">
        <h3 class="text-lg font-semibold mb-4">Lohko {{ group }}</h3>
        <div class="overflow-x-auto">
          <table class="standings-table w-full">
            <thead>
            <tr class="bg-gray-50">
              <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Sija</th>
              <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Pelaaja</th>
              <th class="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">V-T</th>
              <th class="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Legiero</th>
              <th class="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Pisteet</th>
            </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
            <tr *ngFor="let standing of getGroupStandings(group); let i = index"
                class="standings-row"
                [class.position-1]="i === 0"
                [class.position-2]="i === 1">
              <td class="px-3 py-2 whitespace-nowrap text-sm font-medium">{{ i + 1 }}.</td>
              <td class="px-3 py-2 whitespace-nowrap text-sm font-medium">{{ standing.playerName }}</td>
              <td class="px-3 py-2 text-center text-sm">{{ standing.wins }}-{{ standing.losses }}</td>
              <td class="px-3 py-2 text-center text-sm">{{ standing.legDifference >= 0 ? '+' : '' }}{{ standing.legDifference }}</td>
              <td class="px-3 py-2 text-center text-sm font-semibold">{{ standing.points }}</td>
            </tr>
            </tbody>
          </table>
        </div>
        <div class="mt-3 text-xs text-gray-600">
          <div *ngIf="getGroupStandings(group).length > 0">
            1. → Suoraan finaaliin
          </div>
          <div *ngIf="getGroupStandings(group).length > 1">
            2. → Karsinta finaaliin
          </div>
        </div>
      </div>
    </div>

    <!-- Playoff Phase Info -->
    <div *ngIf="weeklyTournamentService.currentPhase === 'playoff'" class="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
      <h3 class="text-lg font-semibold mb-2">🏆 Karsintaottelu finaaliin</h3>
      <p class="text-sm text-gray-600">Lohkojen kakkospelaajat pelaavat kolmannesta finaalipaikasta (BO1)</p>
    </div>

    <!-- Final Phase Info -->
    <div *ngIf="weeklyTournamentService.currentPhase === 'final'" class="bg-green-50 p-4 rounded-lg border border-green-200">
      <h3 class="text-lg font-semibold mb-2">🏆 Finaali</h3>
      <div class="flex flex-wrap gap-2">
          <span *ngFor="let finalist of weeklyTournamentService.finalists"
                class="bg-green-600 text-white px-3 py-1 rounded-full text-sm">
            {{ finalist.name }}
          </span>
      </div>
      <p class="text-sm text-gray-600 mt-2">
        {{ weeklyTournamentService.finalists.length === 3 ? 'Kaikki kaikkia vastaan finaalissa' : 'Finalistit pelaavat keskenään' }}
      </p>
    </div>

    <!-- Match List -->
    <div class="bg-white p-6 rounded-lg shadow">
      <h3 class="text-lg font-semibold mb-4">Ottelut</h3>

      <!-- Group matches by group -->
      <div *ngIf="weeklyTournamentService.currentPhase === 'group' && weeklyTournamentService.tournamentType === 'group-based'">
        <div *ngFor="let group of [1, 2]" class="mb-6">
          <h4 class="font-medium mb-3 text-blue-600">Lohko {{ group }} ottelut</h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div *ngFor="let match of getGroupMatches(group)"
                 class="match-card p-4 bg-gray-50 rounded-lg border"
                 [class.completed-match]="match.isComplete"
                 [class.current-match]="isCurrentMatch(match)">
              <div class="flex justify-between items-center">
                <div class="text-sm font-medium">
                  {{ weeklyTournamentService.getPlayerName(match.player1Id) }}
                </div>
                <div class="text-xs text-gray-500">vs</div>
                <div class="text-sm font-medium">
                  {{ weeklyTournamentService.getPlayerName(match.player2Id) }}
                </div>
              </div>
              <div *ngIf="match.isComplete" class="mt-2 flex justify-between items-center text-xs">
                  <span [class.winner-highlight]="match.winner === match.player1Id">
                    {{ match.player1Legs }}
                  </span>
                <span class="text-gray-400">-</span>
                <span [class.winner-highlight]="match.winner === match.player2Id">
                    {{ match.player2Legs }}
                  </span>
              </div>
              <div *ngIf="isCurrentMatch(match)" class="mt-2 text-xs text-amber-600 font-medium">
                ⚡ Käynnissä
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Round robin matches -->
      <div *ngIf="weeklyTournamentService.tournamentType === 'round-robin' || weeklyTournamentService.currentPhase !== 'group'">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <div *ngFor="let match of getRelevantMatches()"
               class="match-card p-4 bg-gray-50 rounded-lg border"
               [class.completed-match]="match.isComplete"
               [class.current-match]="isCurrentMatch(match)">

            <div class="flex justify-between items-center mb-2">
              <span class="text-xs text-gray-500">{{ weeklyTournamentService.getRoundForMatch(match) }}</span>
              <span *ngIf="weeklyTournamentService.isPlayoffMatch(match)" class="text-xs bg-red-500 text-white px-2 py-1 rounded">
                  BO1
                </span>
            </div>

            <div class="flex justify-between items-center">
              <div class="text-sm font-medium">
                {{ weeklyTournamentService.getPlayerName(match.player1Id) }}
              </div>
              <div class="text-xs text-gray-500">vs</div>
              <div class="text-sm font-medium">
                {{ weeklyTournamentService.getPlayerName(match.player2Id) }}
              </div>
            </div>

            <div *ngIf="match.isComplete" class="mt-2 flex justify-between items-center text-xs">
                <span [class.winner-highlight]="match.winner === match.player1Id">
                  {{ match.player1Legs }}
                </span>
              <span class="text-gray-400">-</span>
              <span [class.winner-highlight]="match.winner === match.player2Id">
                  {{ match.player2Legs }}
                </span>
            </div>

            <div *ngIf="isCurrentMatch(match)" class="mt-2 text-xs text-amber-600 font-medium">
              ⚡ Käynnissä
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Prize Pool Display -->
    <div class="bg-green-100 p-4 rounded-lg">
      <h3 class="font-semibold mb-2">💰 Illan palkinnot</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div>
          <div class="font-medium">Viikkopotti (voittajalle):</div>
          <div class="text-lg font-bold text-green-600">{{ weeklyTournamentService.players.length * 2.5 }}€</div>
        </div>
        <div>
          <div class="font-medium">Rankingpisteet:</div>
          <div class="space-y-1 text-xs">
            <div>🥇 1. sija: +5 pistettä</div>
            <div>🥈 2. sija: +3 pistettä</div>
            <div>🥉 3. sija: +1 piste</div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class WeeklyBracketComponent {
  constructor(public weeklyTournamentService: WeeklyTournamentService) {}

  getSortedStandings(): GroupStanding[] {
    return this.weeklyTournamentService.getSortedStandings();
  }

  getGroupStandings(groupNumber: number): GroupStanding[] {
    return this.weeklyTournamentService.getSortedStandings()
      .filter(s => s.group === groupNumber);
  }

  getGroupMatches(groupNumber: number): WeeklyMatch[] {
    return this.weeklyTournamentService.matches
      .filter(m => m.round === 'group' && m.group === groupNumber)
      .sort((a, b) => a.id - b.id);
  }

  getRelevantMatches(): WeeklyMatch[] {
    if (this.weeklyTournamentService.currentPhase === 'group') {
      return this.weeklyTournamentService.matches
        .filter(m => m.round === 'group')
        .sort((a, b) => a.id - b.id);
    } else if (this.weeklyTournamentService.currentPhase === 'playoff') {
      return this.weeklyTournamentService.matches
        .filter(m => m.round === 'playoff')
        .sort((a, b) => a.id - b.id);
    } else {
      return this.weeklyTournamentService.matches
        .filter(m => m.round === 'final')
        .sort((a, b) => a.id - b.id);
    }
  }

  isCurrentMatch(match: WeeklyMatch): boolean {
    return this.weeklyTournamentService.currentMatch?.id === match.id;
  }
}
