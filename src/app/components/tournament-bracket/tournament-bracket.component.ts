import {Component} from '@angular/core';
import {CommonModule} from '@angular/common';
import {TournamentService, Match, Standing} from '../../services/tournament.service';

@Component({
	selector: 'tournament-bracket',
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
		.selectable-match {
			cursor: pointer;
			transition: all 0.2s ease;
		}
		.selectable-match:hover {
			background-color: #e0f2fe;
			transform: scale(1.02);
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
		.position-1 { background-color: #fef3c7; }
		.position-2 { background-color: #e5e7eb; }
		.position-3 { background-color: #fed7aa; }
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
			<div class="bg-blue-600 text-white p-4 rounded-lg">
				<div class="flex justify-between items-center">
					<div>
						<h2 class="text-xl font-semibold">🎯 Viikkokisat - Viikko {{ tournamentService.weekNumber }}</h2>
						<p class="text-blue-100">{{ tournamentService.getCurrentPhaseDescription() }}</p>
					</div>
					<div class="text-right">
						<div class="text-sm text-blue-100">Pelaajia: {{ tournamentService.players.length }}</div>
						<div class="text-sm text-blue-100">Otteluita: {{ tournamentService.matches.length }}</div>
						<div class="text-sm text-blue-100">{{ tournamentService.gameMode }} - BO{{ tournamentService.bestOfLegs }}</div>
					</div>
				</div>
			</div>

			<div *ngIf="tournamentService.currentPhase === 'group' || tournamentService.currentPhase === 'playoff'">
				<div *ngIf="tournamentService.tournamentType === 'round-robin'" class="bg-white p-6 rounded-lg shadow">
					<h3 class="text-lg font-semibold mb-4">
						{{ tournamentService.players.length === 3 ? 'Finaalin tulostaulukko' : 'Karsintojen tulostaulukko' }}
					</h3>
					<div class="overflow-x-auto">
						<table class="standings-table w-full">
							<thead>
							<tr class="bg-gray-50">
								<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sija</th>
								<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pelaaja</th>
								<th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Voitot</th>
								<th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Tappiot</th>
								<th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Legiero</th>
								<th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Pisteet</th>
								<th *ngIf="tournamentService.players.length > 3" class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
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
								<td *ngIf="tournamentService.players.length > 3" class="px-4 py-3 text-center text-sm">
									<span *ngIf="i < 3" class="finalist-badge">Finaaliin</span>
								</td>
							</tr>
							</tbody>
						</table>
					</div>
				</div>

				<div *ngIf="tournamentService.tournamentType === 'groups' || tournamentService.tournamentType === 'groups-3'"
				     class="grid gap-6"
				     [class.grid-cols-1]="[1, 3].includes(getGroupCount())"
				     [class.lg:grid-cols-2]="getGroupCount() === 2">
					<div *ngFor="let group of getGroupNumbers()" class="group-container p-6 rounded-lg">
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
										<span *ngIf="i === 0" class="text-xs bg-green-600 text-white px-2 py-1 rounded-full">
											{{ tournamentService.tournamentType === 'groups-3' ? 'Finaaliin' : 'Finaaliin' }}
										</span>
										<span *ngIf="i === 1 && tournamentService.tournamentType === 'groups'" class="text-xs bg-yellow-600 text-white px-2 py-1 rounded-full">Karsinta</span>
									</td>
								</tr>
								</tbody>
							</table>
						</div>
					</div>
				</div>
			</div>

			<div *ngIf="tournamentService.currentPhase === 'playoff'" class="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
				<h3 class="text-lg font-semibold mb-2">🏆 Karsintaottelu finaaliin</h3>
				<p class="text-sm text-gray-600">Lohkojen kakkospelaajat pelaavat kolmannesta finaalipaikasta (BO1)</p>
			</div>

			<div *ngIf="tournamentService.currentPhase !== 'final'" class="bg-white p-6 rounded-lg shadow">
				<div class="flex justify-between items-center mb-4">
					<h3 class="text-lg font-semibold">Ottelut</h3>
					<div class="text-xs text-gray-500 bg-blue-50 px-3 py-1 rounded-full">
						💡 Klikkaa ottelua muokataksesi tai vaihtaaksesi nykyistä ottelua
					</div>
				</div>

				<div *ngIf="tournamentService.currentPhase === 'group' && (tournamentService.tournamentType === 'groups' || tournamentService.tournamentType === 'groups-3')">
					<div *ngFor="let group of getGroupNumbers()" class="mb-6">
						<h4 class="font-medium mb-3 text-blue-600">Lohko {{ group }} ottelut</h4>
						<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
							<div *ngFor="let match of getGroupMatches(group)"
							     class="match-card p-4 bg-gray-50 rounded-lg border"
							     [class.completed-match]="match.isComplete"
							     [class.current-match]="isCurrentMatch(match)"
							     [class.selectable-match]="canSelectMatch(match)"
							     (click)="selectMatch(match)">
								<div class="flex justify-between items-center">
									<div class="text-sm font-medium">{{ tournamentService.getPlayerName(match.player1Id) }}</div>
									<div class="text-xs text-gray-500">vs</div>
									<div class="text-sm font-medium">{{ tournamentService.getPlayerName(match.player2Id) }}</div>
								</div>
								<div *ngIf="match.isComplete" class="mt-2 flex justify-between items-center text-xs">
									<span [class.winner-highlight]="match.winner === match.player1Id">{{ match.player1Legs }}</span>
									<span class="text-gray-400">-</span>
									<span [class.winner-highlight]="match.winner === match.player2Id">{{ match.player2Legs }}</span>
								</div>
								<div *ngIf="isCurrentMatch(match)" class="mt-2 text-xs text-amber-600 font-medium">⚡ Käynnissä</div>
								<div *ngIf="canEditMatch(match)" class="mt-2 text-xs text-blue-600 font-medium">✏️ Muokattava</div>
							</div>
						</div>
					</div>
				</div>

				<div *ngIf="tournamentService.tournamentType === 'round-robin' || (tournamentService.currentPhase !== 'group' && !tournamentService.is3WayFinal())">
					<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
						<div *ngFor="let match of getRelevantMatches()"
						     class="match-card p-4 bg-gray-50 rounded-lg border"
						     [class.completed-match]="match.isComplete"
						     [class.current-match]="isCurrentMatch(match)"
						     [class.selectable-match]="canSelectMatch(match)"
						     (click)="selectMatch(match)">

							<div class="flex justify-between items-center mb-2">
								<span class="text-xs text-gray-500">{{ getRoundText(match) }}</span>
								<span *ngIf="match.round === 'playoff'" class="text-xs bg-red-500 text-white px-2 py-1 rounded">BO1</span>
							</div>

							<div class="flex justify-between items-center">
								<div class="text-sm font-medium">{{ tournamentService.getPlayerName(match.player1Id) }}</div>
								<div class="text-xs text-gray-500">vs</div>
								<div class="text-sm font-medium">{{ tournamentService.getPlayerName(match.player2Id) }}</div>
							</div>

							<div *ngIf="match.isComplete" class="mt-2 flex justify-between items-center text-xs">
								<span [class.winner-highlight]="match.winner === match.player1Id">{{ match.player1Legs }}</span>
								<span class="text-gray-400">-</span>
								<span [class.winner-highlight]="match.winner === match.player2Id">{{ match.player2Legs }}</span>
							</div>

							<div *ngIf="isCurrentMatch(match)" class="mt-2 text-xs text-amber-600 font-medium">⚡ Käynnissä</div>
							<div *ngIf="canEditMatch(match)" class="mt-2 text-xs text-blue-600 font-medium">✏️ Muokattava</div>
						</div>
					</div>
				</div>

			</div>

			<div *ngIf="tournamentService.currentPhase === 'final' && tournamentService.is3WayFinal()" class="mt-4 p-4 bg-green-50 rounded-lg border-2 border-green-300">
				<h4 class="font-semibold mb-3 text-green-700">🏆 Finaali</h4>
				<div class="text-center text-sm text-gray-600 mb-3">Kaikki kolme pelaajaa pelaavat samassa ottelussa</div>

				<div *ngIf="tournamentService.currentMatch && !tournamentService.currentMatch.isComplete" class="text-center">
					<div class="flex flex-wrap justify-center gap-2 mb-3">
						<span *ngFor="let finalist of getAllFinalists()"
						      class="bg-blue-600 text-white px-3 py-1 rounded-full text-sm">
							{{ finalist.name }}
						</span>
					</div>
					<div class="text-amber-600 font-medium">
						⚡ Finaali käynnissä - turnaus päättyy kun 2 pelaajaa saavuttaa {{ Math.ceil(tournamentService.bestOfLegs / 2) }} legiä
					</div>
				</div>

				<div *ngIf="tournamentService.currentMatch && tournamentService.currentMatch.isComplete" class="text-center">
					<div class="mb-3">
						<div class="text-2xl mb-2">🎉</div>
						<div class="font-bold text-lg text-green-600 mb-2">Finaali päättynyt!</div>
						<div class="text-green-700 font-bold text-xl">
							🏆 Voittaja: {{ tournamentService.getPlayerName(tournamentService.currentMatch.winner!) }}
						</div>
					</div>
				</div>
			</div>

			<div class="bg-green-100 p-4 rounded-lg">
				<h3 class="font-semibold mb-2">💰 Illan palkinnot</h3>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
					<div>
						<div class="font-medium">Viikkopotti (voittajalle):</div>
						<div class="text-lg font-bold text-green-600">{{ tournamentService.players.length * 2.5 }}€</div>
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
		</div>
	`
})
export class TournamentBracketComponent {
	Math = Math;

	constructor(public tournamentService: TournamentService) {}

	getSortedStandings(): Standing[] {
		return this.tournamentService.getSortedStandings();
	}

	getGroupStandings(groupNumber: number): Standing[] {
		return this.tournamentService.getGroupStandings(groupNumber);
	}

	getGroupMatches(groupNumber: number): Match[] {
		return this.tournamentService.matches
			.filter(m => m.round === 'group' && m.group === groupNumber)
			.sort((a, b) => a.id - b.id);
	}

	getRelevantMatches(): Match[] {
		if (this.tournamentService.currentPhase === 'group') {
			return this.tournamentService.matches
				.filter(m => m.round === 'group')
				.sort((a, b) => a.id - b.id);
		} else if (this.tournamentService.currentPhase === 'playoff') {
			return this.tournamentService.matches
				.filter(m => m.round === 'playoff')
				.sort((a, b) => a.id - b.id);
		} else {
			return this.tournamentService.matches
				.filter(m => m.round === 'final')
				.sort((a, b) => a.id - b.id);
		}
	}

	getRoundText(match: Match): string {
		if (match.round === 'group') {
			if ((this.tournamentService.tournamentType === 'groups' || this.tournamentService.tournamentType === 'groups-3') && match.group) {
				return `Lohko ${match.group}`;
			}
			return this.tournamentService.players.length === 3 ? 'Finaali' : 'Karsinnat';
		}
		if (match.round === 'playoff') return 'Karsinta finaaliin';
		return 'Finaali';
	}

	isCurrentMatch(match: Match): boolean {
		return this.tournamentService.currentMatch?.id === match.id;
	}

	canSelectMatch(match: Match): boolean {
		// Can select any match that's not a final match or that's not complete
		return match.round !== 'final' || !match.isComplete;
	}

	canEditMatch(match: Match): boolean {
		return this.tournamentService.canEditMatch(match);
	}

	selectMatch(match: Match): void {
		if (this.canSelectMatch(match)) {
			// Reset match if it was completed and we're editing it
			if (match.isComplete && this.canEditMatch(match)) {
				match.isComplete = false;
				this.tournamentService.updateStandings();
			}

			this.tournamentService.setCurrentMatch(match.id);
		}
	}

	getGroupCount(): number {
		if (this.tournamentService.tournamentType === 'groups-3') return 3;
		if (this.tournamentService.tournamentType === 'groups') return 2;
		return 1;
	}

	getGroupNumbers(): number[] {
		const groupCount = this.getGroupCount();
		return Array.from({length: groupCount}, (_, i) => i + 1);
	}

	getAllFinalists(): any[] {
		// For 3-way finals, get all finalist data from the current match
		if (this.tournamentService.currentMatch?.player3Id) {
			return [
				{ id: this.tournamentService.currentMatch.player1Id, name: this.tournamentService.getPlayerName(this.tournamentService.currentMatch.player1Id) },
				{ id: this.tournamentService.currentMatch.player2Id, name: this.tournamentService.getPlayerName(this.tournamentService.currentMatch.player2Id) },
				{ id: this.tournamentService.currentMatch.player3Id, name: this.tournamentService.getPlayerName(this.tournamentService.currentMatch.player3Id) }
			];
		}
		return this.tournamentService.finalists;
	}
}
