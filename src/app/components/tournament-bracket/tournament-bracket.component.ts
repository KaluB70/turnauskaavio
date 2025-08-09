import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TournamentService, Match, Standing } from '../../services/tournament.service';

@Component({
	selector: 'tournament-bracket',
	standalone: true,
	imports: [ CommonModule ],
	styles: [ `
		.group-container {
			background: rgba(255, 255, 255, 0.1);
			backdrop-filter: blur(10px);
			border: 1px solid rgba(255, 255, 255, 0.2);
			border-left: 4px solid #6366f1;
		}
		.match-card {
			transition: all 0.2s ease;
			box-shadow: 0 2px 4px rgba(0,0,0,0.3);
			background: rgba(255, 255, 255, 0.08);
			backdrop-filter: blur(5px);
			border: 1px solid rgba(255, 255, 255, 0.1);
		}
		.match-card:hover {
			box-shadow: 0 4px 8px rgba(0,0,0,0.4);
			transform: translateY(-1px);
			background: rgba(255, 255, 255, 0.12);
		}
		.completed-match {
			background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.2));
			border-left: 4px solid #10b981;
			border-color: rgba(16, 185, 129, 0.5);
		}
		.current-match {
			background: linear-gradient(135deg, rgba(251, 191, 36, 0.3), rgba(245, 158, 11, 0.3));
			border-left: 4px solid #f59e0b;
			animation: pulse 2s infinite;
			border-color: rgba(251, 191, 36, 0.6);
		}
		.selectable-match {
			cursor: pointer;
			transition: all 0.2s ease;
		}
		.selectable-match:hover {
			background: rgba(255, 255, 255, 0.15);
			transform: scale(1.02);
		}
		@keyframes pulse {
			0%, 100% { opacity: 1; }
			50% { opacity: 0.8; }
		}
		.winner-highlight {
			background: linear-gradient(135deg, rgba(34, 197, 94, 0.3), rgba(21, 128, 61, 0.3));
			color: #ffffff;
			font-weight: 600;
			border-radius: 0.25rem;
			padding: 2px 4px;
		}
		.standings-table {
			border-collapse: separate;
			border-spacing: 0;
			background: rgba(255, 255, 255, 0.05);
		}
		.standings-row {
			transition: background-color 0.2s ease;
		}
		.standings-row:hover {
			background: rgba(255, 255, 255, 0.1);
		}
		.position-1 { background: linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(245, 158, 11, 0.2)); }
		.position-2 { background: linear-gradient(135deg, rgba(156, 163, 175, 0.2), rgba(107, 114, 128, 0.2)); }
		.position-3 { background: linear-gradient(135deg, rgba(251, 146, 60, 0.2), rgba(249, 115, 22, 0.2)); }
		.finalist-badge {
			background: linear-gradient(135deg, #10b981, #059669);
			color: white;
			font-size: 0.75rem;
			padding: 2px 6px;
			border-radius: 9999px;
		}
	` ],
	template: `
		<div class="space-y-6">
			<div class="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-xl backdrop-blur-10 border border-white/20">
				<div class="flex justify-between items-center">
					<div>
						<h2 class="text-xl font-semibold">🎯 Viikkokisat - Viikko {{ tournamentService.weekNumber }}</h2>
						<p class="text-indigo-100">{{ tournamentService.getCurrentPhaseDescription() }}</p>
					</div>
					<div class="text-right">
						<div class="text-sm text-indigo-100">Pelaajia: {{ tournamentService.players.length }}</div>
						<div class="text-sm text-indigo-100">Otteluita: {{ tournamentService.matches.length }}</div>
						<div class="text-sm text-indigo-100">{{ tournamentService.gameMode }} - BO{{ tournamentService.bestOfLegs }}</div>
					</div>
				</div>
			</div>

			<div *ngIf="tournamentService.currentPhase === 'group' || tournamentService.currentPhase === 'playoff'">
				<div *ngIf="tournamentService.tournamentType === 'round-robin'" class="group-container p-6 rounded-xl">
					<h3 class="text-lg font-semibold mb-4 text-white">
						{{ tournamentService.players.length === 3 ? '🏆 Finaalin tulostaulukko' : '⚡ Karsintojen tulostaulukko' }}
					</h3>
					<div class="overflow-x-auto">
						<table class="standings-table w-full">
							<thead>
							<tr class="bg-white/10">
								<th class="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase">Sija</th>
								<th class="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase">Pelaaja</th>
								<th class="px-4 py-3 text-center text-xs font-medium text-slate-300 uppercase">Voitot</th>
								<th class="px-4 py-3 text-center text-xs font-medium text-slate-300 uppercase">Tappiot</th>
								<th class="px-4 py-3 text-center text-xs font-medium text-slate-300 uppercase">Legiero</th>
								<th class="px-4 py-3 text-center text-xs font-medium text-slate-300 uppercase">Pisteet</th>
								<th *ngIf="tournamentService.players.length > 3" class="px-4 py-3 text-center text-xs font-medium text-slate-300 uppercase">Status</th>
							</tr>
							</thead>
							<tbody class="divide-y divide-white/10">
							<tr *ngFor="let standing of getSortedStandings(); let i = index"
							    class="standings-row"
							    [class.position-1]="i === 0"
							    [class.position-2]="i === 1"
							    [class.position-3]="i === 2">
								<td class="px-4 py-3 whitespace-nowrap text-sm font-medium text-white">{{ i + 1 }}.</td>
								<td class="px-4 py-3 whitespace-nowrap text-sm font-medium text-white">{{ standing.playerName }}</td>
								<td class="px-4 py-3 text-center text-sm text-white">{{ standing.wins }}</td>
								<td class="px-4 py-3 text-center text-sm text-white">{{ standing.losses }}</td>
								<td class="px-4 py-3 text-center text-sm text-white">{{ standing.legDifference >= 0 ? '+' : '' }}{{ standing.legDifference }}</td>
								<td class="px-4 py-3 text-center text-sm font-semibold text-white">{{ standing.points }}</td>
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
					<div *ngFor="let group of getGroupNumbers()" class="group-container p-6 rounded-xl">
						<h3 class="text-lg font-semibold mb-4 text-white">🏆 Lohko {{ group }}</h3>
						<div class="overflow-x-auto">
							<table class="standings-table w-full">
								<thead>
								<tr class="bg-white/10">
									<th class="px-3 py-2 text-left text-xs font-medium text-slate-300 uppercase">Sija</th>
									<th class="px-3 py-2 text-left text-xs font-medium text-slate-300 uppercase">Pelaaja</th>
									<th class="px-3 py-2 text-center text-xs font-medium text-slate-300 uppercase">V-T</th>
									<th class="px-3 py-2 text-center text-xs font-medium text-slate-300 uppercase">Legiero</th>
									<th class="px-3 py-2 text-center text-xs font-medium text-slate-300 uppercase">Pisteet</th>
									<th class="px-3 py-2 text-center text-xs font-medium text-slate-300 uppercase">Status</th>
								</tr>
								</thead>
								<tbody class="divide-y divide-white/10">
								<tr *ngFor="let standing of getGroupStandings(group); let i = index"
								    class="standings-row"
								    [class.position-1]="i === 0"
								    [class.position-2]="i === 1">
									<td class="px-3 py-2 whitespace-nowrap text-sm font-medium text-white">{{ i + 1 }}.</td>
									<td class="px-3 py-2 whitespace-nowrap text-sm font-medium text-white">{{ standing.playerName }}</td>
									<td class="px-3 py-2 text-center text-sm text-white">{{ standing.wins }}-{{ standing.losses }}</td>
									<td class="px-3 py-2 text-center text-sm text-white">{{ standing.legDifference >= 0 ? '+' : '' }}{{ standing.legDifference }}</td>
									<td class="px-3 py-2 text-center text-sm font-semibold text-white">{{ standing.points }}</td>
									<td class="px-3 py-2 text-center text-sm">
										<span *ngIf="i === 0" class="text-xs bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-2 py-1 rounded-full font-medium">
											{{ tournamentService.tournamentType === 'groups-3' ? 'Finaaliin' : 'Finaaliin' }}
										</span>
										<span *ngIf="i === 1 && tournamentService.tournamentType === 'groups'" class="text-xs bg-gradient-to-r from-amber-500 to-amber-600 text-white px-2 py-1 rounded-full font-medium">Karsinta</span>
									</td>
								</tr>
								</tbody>
							</table>
						</div>
					</div>
				</div>
			</div>

			<div *ngIf="tournamentService.currentPhase === 'playoff'" class="bg-gradient-to-r from-amber-500/20 to-amber-600/20 p-4 rounded-xl border border-amber-400/30">
				<h3 class="text-lg font-semibold mb-2 text-amber-200">🏆 Karsintaottelu finaaliin</h3>
				<p class="text-sm text-amber-100">Lohkojen kakkospelaajat pelaavat kolmannesta finaalipaikasta (BO1)</p>
			</div>

			<!-- Final phase standings -->
			<div *ngIf="tournamentService.currentPhase === 'final'" class="group-container p-6 rounded-xl">
				<h3 class="text-lg font-semibold mb-4 text-white">📊 Illan tulokset</h3>

				<div *ngIf="tournamentService.tournamentType === 'round-robin'" class="overflow-x-auto">
					<table class="standings-table w-full">
						<thead>
						<tr class="bg-white/10">
							<th class="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase">Sija</th>
							<th class="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase">Pelaaja</th>
							<th class="px-4 py-3 text-center text-xs font-medium text-slate-300 uppercase">Voitot</th>
							<th class="px-4 py-3 text-center text-xs font-medium text-slate-300 uppercase">Tappiot</th>
							<th class="px-4 py-3 text-center text-xs font-medium text-slate-300 uppercase">Legiero</th>
							<th class="px-4 py-3 text-center text-xs font-medium text-slate-300 uppercase">Pisteet</th>
						</tr>
						</thead>
						<tbody class="divide-y divide-white/10">
						<tr *ngFor="let standing of getSortedStandings(); let i = index"
						    class="standings-row"
						    [class.position-1]="i === 0"
						    [class.position-2]="i === 1"
						    [class.position-3]="i === 2">
							<td class="px-4 py-3 whitespace-nowrap text-sm font-medium text-white">{{ i + 1 }}.</td>
							<td class="px-4 py-3 whitespace-nowrap text-sm font-medium text-white">{{ standing.playerName }}</td>
							<td class="px-4 py-3 text-center text-sm text-white">{{ standing.wins }}</td>
							<td class="px-4 py-3 text-center text-sm text-white">{{ standing.losses }}</td>
							<td class="px-4 py-3 text-center text-sm text-white">{{ standing.legDifference >= 0 ? '+' : '' }}{{ standing.legDifference }}</td>
							<td class="px-4 py-3 text-center text-sm font-semibold text-white">{{ standing.points }}</td>
						</tr>
						</tbody>
					</table>
				</div>

				<div *ngIf="tournamentService.tournamentType === 'groups' || tournamentService.tournamentType === 'groups-3'"
				     class="grid gap-4"
				     [class.grid-cols-1]="[1, 3].includes(getGroupCount())"
				     [class.lg:grid-cols-2]="getGroupCount() === 2"
				     [class.lg:grid-cols-3]="getGroupCount() === 3">
					<div *ngFor="let group of getGroupNumbers()" class="group-container p-4 rounded-xl">
						<h4 class="font-medium mb-3 text-indigo-200">🏆 Lohko {{ group }} lopputulokset</h4>
						<div class="overflow-x-auto">
							<table class="standings-table w-full text-sm">
								<thead>
								<tr class="bg-white/10">
									<th class="px-3 py-2 text-left text-xs font-medium text-slate-300 uppercase">Sija</th>
									<th class="px-3 py-2 text-left text-xs font-medium text-slate-300 uppercase">Pelaaja</th>
									<th class="px-3 py-2 text-center text-xs font-medium text-slate-300 uppercase">V-T</th>
									<th class="px-3 py-2 text-center text-xs font-medium text-slate-300 uppercase">Legiero</th>
									<th class="px-3 py-2 text-center text-xs font-medium text-slate-300 uppercase">Pisteet</th>
								</tr>
								</thead>
								<tbody class="divide-y divide-white/10">
								<tr *ngFor="let standing of getGroupStandings(group); let i = index"
								    class="standings-row"
								    [class.position-1]="i === 0"
								    [class.position-2]="i === 1">
									<td class="px-3 py-2 whitespace-nowrap text-xs font-medium text-white">{{ i + 1 }}.</td>
									<td class="px-3 py-2 whitespace-nowrap text-xs font-medium text-white">{{ standing.playerName }}</td>
									<td class="px-3 py-2 text-center text-xs text-white">{{ standing.wins }}-{{ standing.losses }}</td>
									<td class="px-3 py-2 text-center text-xs text-white">{{ standing.legDifference >= 0 ? '+' : '' }}{{ standing.legDifference }}</td>
									<td class="px-3 py-2 text-center text-xs font-semibold text-white">{{ standing.points }}</td>
								</tr>
								</tbody>
							</table>
						</div>
					</div>
				</div>
			</div>

			<div class="group-container p-6 rounded-xl">
				<div class="flex justify-between items-center mb-4">
					<h3 class="text-lg font-semibold text-white">⚔️ Ottelut</h3>
					<div *ngIf="tournamentService.currentPhase !== 'final'" class="text-xs text-indigo-200 bg-indigo-500/20 px-3 py-1 rounded-full border border-indigo-400/30">
						💡 Klikkaa ottelua muokataksesi tai vaihtaaksesi nykyistä ottelua
					</div>
					<div *ngIf="tournamentService.currentPhase === 'final'" class="text-xs text-slate-300 bg-slate-500/20 px-3 py-1 rounded-full border border-slate-400/30">
						📜 Turnauksen ottelut
					</div>
				</div>

				<div *ngIf="(tournamentService.currentPhase === 'group' || tournamentService.currentPhase === 'final') && (tournamentService.tournamentType === 'groups' || tournamentService.tournamentType === 'groups-3')">
					<div *ngFor="let group of getGroupNumbers()" class="mb-6">
						<h4 class="font-medium mb-3 text-indigo-200">🏆 Lohko {{ group }} ottelut</h4>
						<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
							<div *ngFor="let match of getGroupMatches(group)"
							     class="match-card p-4 rounded-xl"
							     [class.completed-match]="match.isComplete"
							     [class.current-match]="isCurrentMatch(match)"
							     [class.selectable-match]="canSelectMatch(match) && tournamentService.currentPhase !== 'final'"
							     (click)="selectMatch(match)"
							     [style.pointer-events]="tournamentService.currentPhase === 'final' ? 'none' : 'auto'">
								<div class="flex justify-between items-center">
									<div class="text-sm font-medium text-white">{{ tournamentService.getPlayerName(match.player1Id) }}</div>
									<div class="text-xs text-slate-400">vs</div>
									<div class="text-sm font-medium text-white">{{ tournamentService.getPlayerName(match.player2Id) }}</div>
								</div>
								<div *ngIf="match.isComplete" class="mt-2 flex justify-between items-center text-xs">
									<span [class.winner-highlight]="match.winner === match.player1Id" class="text-white">{{ match.player1Legs }}</span>
									<span class="text-slate-400">-</span>
									<span [class.winner-highlight]="match.winner === match.player2Id" class="text-white">{{ match.player2Legs }}</span>
								</div>
								<div *ngIf="isCurrentMatch(match)" class="mt-2 text-xs text-amber-300 font-medium">⚡ Käynnissä</div>
								<div *ngIf="canEditMatch(match) && tournamentService.currentPhase !== 'final'" class="mt-2 text-xs text-indigo-200 font-medium">✏️ Muokattava</div>
							</div>
						</div>
					</div>
				</div>

				<div *ngIf="tournamentService.tournamentType === 'round-robin' || (tournamentService.currentPhase !== 'group' && !tournamentService.is3WayFinal()) || tournamentService.currentPhase === 'final'">
					<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
						<div *ngFor="let match of getRelevantMatches()"
						     class="match-card p-4 rounded-xl"
						     [class.completed-match]="match.isComplete"
						     [class.current-match]="isCurrentMatch(match)"
						     [class.selectable-match]="canSelectMatch(match) && tournamentService.currentPhase !== 'final'"
						     (click)="selectMatch(match)"
						     [style.pointer-events]="tournamentService.currentPhase === 'final' ? 'none' : 'auto'">

							<div class="flex justify-between items-center mb-2">
								<span class="text-xs text-slate-200">{{ getRoundText(match) }}</span>
								<span *ngIf="match.round === 'playoff'" class="text-xs bg-gradient-to-r from-red-500 to-red-600 text-white px-2 py-1 rounded-full font-medium">BO1</span>
							</div>

							<div class="flex justify-between items-center">
								<div class="text-sm font-medium text-white">{{ tournamentService.getPlayerName(match.player1Id) }}</div>
								<div class="text-xs text-slate-400">vs</div>
								<div class="text-sm font-medium text-white">{{ tournamentService.getPlayerName(match.player2Id) }}</div>
							</div>

							<div *ngIf="match.isComplete" class="mt-2 flex justify-between items-center text-xs">
								<span [class.winner-highlight]="match.winner === match.player1Id" class="text-white">{{ match.player1Legs }}</span>
								<span class="text-slate-400">-</span>
								<span [class.winner-highlight]="match.winner === match.player2Id" class="text-white">{{ match.player2Legs }}</span>
							</div>

							<div *ngIf="isCurrentMatch(match)" class="mt-2 text-xs text-amber-200 font-medium">⚡ Käynnissä</div>
							<div *ngIf="canEditMatch(match) && tournamentService.currentPhase !== 'final'" class="mt-2 text-xs text-indigo-100 font-medium">✏️ Muokattava</div>
						</div>
					</div>
				</div>

			</div>

			<div *ngIf="tournamentService.currentPhase === 'final' && tournamentService.is3WayFinal()" class="mt-4 p-4 bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 rounded-xl border border-emerald-400/30">
				<h4 class="font-semibold mb-3 text-emerald-200">🏆 Finaali</h4>
				<div class="text-center text-sm text-emerald-100 mb-3">Kaikki kolme pelaajaa pelaavat samassa ottelussa</div>

				<div *ngIf="tournamentService.currentMatch && !tournamentService.currentMatch.isComplete" class="text-center">
					<div class="flex flex-wrap justify-center gap-2 mb-3">
						<span *ngFor="let finalist of getAllFinalists()"
						      class="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg">
							{{ finalist.name }}
						</span>
					</div>
					<div class="text-amber-200 font-medium">
						⚡ Finaali käynnissä - turnaus päättyy kun 2 pelaajaa saavuttaa {{ Math.ceil(tournamentService.bestOfLegs / 2) }} legiä
					</div>
				</div>

				<div *ngIf="tournamentService.currentMatch && tournamentService.currentMatch.isComplete" class="text-center">
					<div class="mb-3">
						<div class="text-2xl mb-2">🎉</div>
						<div class="font-bold text-lg text-emerald-200 mb-2">Finaali päättynyt!</div>
						<div class="text-emerald-100 font-bold text-xl">
							🏆 Voittaja: {{ tournamentService.getPlayerName(tournamentService.currentMatch.winner!) }}
						</div>
					</div>
				</div>
			</div>

			<div class="bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 p-6 rounded-xl border border-emerald-400/30">
				<h3 class="font-semibold mb-4 text-emerald-200 text-lg">💰 Illan palkinnot</h3>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
					<div>
						<div class="font-medium text-emerald-100 mb-2">Viikkopotti (voittajalle):</div>
						<div class="text-2xl font-bold text-emerald-200">{{ tournamentService.players.length * 2.5 }}€</div>
					</div>
					<div>
						<div class="font-medium text-emerald-100 mb-2">Rankingpisteet:</div>
						<div class="space-y-1 text-sm text-emerald-100">
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
			// In final phase, show all completed matches (past ottelut), not the current final
			return this.tournamentService.matches
				.filter(m => m.isComplete && m.round !== 'final')
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
		return Array.from({ length: groupCount }, (_, i) => i + 1);
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
