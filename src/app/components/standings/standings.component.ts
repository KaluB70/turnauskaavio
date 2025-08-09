import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SeasonStanding, TournamentService } from '../../services/tournament.service';

@Component({
	selector: 'standings',
	standalone: true,
	imports: [ CommonModule ],
	styles: [ `
		.standings-bg {
			background: linear-gradient(135deg, #0f172a 0%, #1e293b 25%, #334155 75%, #475569 100%);
			min-height: 100vh;
			position: relative;
			overflow: hidden;
		}
		.standings-bg::before {
			content: '';
			position: absolute;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			background:
				radial-gradient(circle at 20% 20%, rgba(99, 102, 241, 0.15) 0%, transparent 50%),
				radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.15) 0%, transparent 50%);
		}
		.glass-card {
			background: rgba(255, 255, 255, 0.1);
			backdrop-filter: blur(20px);
			border: 1px solid rgba(255, 255, 255, 0.2);
			box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
		}
		.standings-table {
			border-collapse: separate;
			border-spacing: 0;
		}
		.standings-container {
			-webkit-overflow-scrolling: touch;
		}
		.standings-row {
			transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
			background: rgba(255, 255, 255, 0.05);
		}
		.standings-row:hover {
			background: rgba(255, 255, 255, 0.15);
			box-shadow: inset 4px 0 0 0 #6366f1;
		}

		.position-1 {
			background: linear-gradient(135deg, rgba(251, 191, 36, 0.3), rgba(245, 158, 11, 0.3));
			border-left: 4px solid #fbbf24;
			font-weight: 600;
		}

		.position-2 {
			background: linear-gradient(135deg, rgba(156, 163, 175, 0.3), rgba(107, 114, 128, 0.3));
			border-left: 4px solid #9ca3af;
			font-weight: 600;
		}

		.position-3 {
			background: linear-gradient(135deg, rgba(251, 146, 60, 0.3), rgba(249, 115, 22, 0.3));
			border-left: 4px solid #f97316;
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

		.week-1 {
			background-color: #fbbf24;
			color: white;
		}

		.week-2 {
			background-color: #9ca3af;
			color: white;
		}

		.week-3 {
			background-color: #f97316;
			color: white;
		}

		.week-other {
			background-color: #e5e7eb;
			color: #374151;
		}

		.modern-btn {
			transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
			position: relative;
			overflow: hidden;
		}
		.modern-btn::before {
			content: '';
			position: absolute;
			top: 50%;
			left: 50%;
			width: 0;
			height: 0;
			background: rgba(255, 255, 255, 0.2);
			border-radius: 50%;
			transition: all 0.3s ease;
			transform: translate(-50%, -50%);
		}
		.modern-btn:hover:not(:disabled)::before {
			width: 300px;
			height: 300px;
		}
		.modern-btn:hover:not(:disabled) {
			transform: translateY(-1px);
			box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
		}

		@media (max-width: 768px) {
			.standings-container {
				border-radius: 0.5rem;
				border: 1px solid #e5e7eb;
			}

			.standings-table th,
			.standings-table td {
				padding: 8px 6px;
				font-size: 0.8rem;
			}

			.points-badge {
				padding: 2px 6px;
				font-size: 0.75rem;
			}
		}
	` ],
	template: `
		<div class="standings-bg min-h-screen relative">
			<div class="container mx-auto px-4 py-8 relative z-20">
				<div class="flex justify-between items-center mb-8">
					<h1 class="text-4xl font-bold text-white">🏆 Kauden tilastot</h1>
					<button
						(click)="goHome()"
						class="modern-btn glass-card text-white py-3 px-6 rounded-xl font-semibold relative z-10">
						← Takaisin päävalikkoon
					</button>
				</div>

				<div class="space-y-8">
					<div class="glass-card p-8 rounded-2xl shadow-xl">
						<h2 class="text-3xl font-bold mb-6 flex items-center text-white">
							<span class="mr-3">📊</span>
							Kauden tilastot
						</h2>

						<div class="grid grid-cols-2 md:grid-cols-5 gap-6 mb-6">
							<div class="text-center">
								<div class="text-4xl mb-2">📅</div>
								<div class="text-3xl font-bold text-indigo-300">{{ getCompletedWeeks() }}</div>
								<div class="text-sm text-slate-300">Pelattua viikkoa</div>
							</div>
							<div class="text-center">
								<div class="text-4xl mb-2">🎯</div>
								<div class="text-3xl font-bold text-emerald-300">{{ getUniquePlayers() }}</div>
								<div class="text-sm text-slate-300">Pelaajia</div>
							</div>
							<div class="text-center">
								<div class="text-4xl mb-2">⚔️</div>
								<div class="text-3xl font-bold text-purple-300">{{ getTotalMatches() }}</div>
								<div class="text-sm text-slate-300">Pelattu ottelua</div>
							</div>
							<div class="text-center">
								<div class="text-4xl mb-2">💰</div>
								<div class="text-3xl font-bold text-yellow-300">{{ getTotalPrizePool() }}€</div>
								<div class="text-sm text-slate-300">Palkintopotti</div>
							</div>
							<div class="text-center">
								<div class="text-4xl mb-2">🏆</div>
								<div class="text-3xl font-bold text-orange-300">{{ getCurrentLeader()?.playerName || '-' }}</div>
								<div class="text-sm text-slate-300">Kärjessä</div>
							</div>
						</div>
					</div>

					<div class="glass-card p-8 rounded-2xl shadow-xl">
						<div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
							<h3 class="text-2xl font-semibold flex items-center mb-2 md:mb-0 text-white">
								<span class="mr-3">🏆</span>
								Kauden kokonaistilanne
								<span class="ml-3 text-sm text-slate-300 bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm">✨ 7 parasta viikkoa lasketaan</span>
							</h3>
						</div>

						<div *ngIf="seasonStandings.length === 0" class="text-center text-slate-400 py-12">
							<div class="text-6xl mb-4">📋</div>
							<div class="text-xl">Ei vielä pelattuja viikkokisoja</div>
						</div>

						<div *ngIf="seasonStandings.length > 0" class="standings-container overflow-x-auto">
							<table class="standings-table w-full min-w-[1000px]">
								<thead>
								<tr class="bg-white/10 backdrop-blur-sm">
									<th class="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Sija</th>
									<th class="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Pelaaja</th>
									<th class="px-6 py-4 text-center text-xs font-medium text-slate-300 uppercase tracking-wider">Pisteet</th>
									<th class="px-6 py-4 text-center text-xs font-medium text-slate-300 uppercase tracking-wider">Palkinto-osuus</th>
									<th class="px-6 py-4 text-center text-xs font-medium text-slate-300 uppercase tracking-wider">Voitettu</th>
									<th class="px-6 py-4 text-center text-xs font-medium text-slate-300 uppercase tracking-wider">Viikkoja</th>
									<th class="px-6 py-4 text-center text-xs font-medium text-slate-300 uppercase tracking-wider">Podium</th>
									<th class="px-6 py-4 text-center text-xs font-medium text-slate-300 uppercase tracking-wider">Keskisija</th>
									<th class="px-6 py-4 text-center text-xs font-medium text-slate-300 uppercase tracking-wider">Viikottaiset tulokset</th>
								</tr>
								</thead>
								<tbody class="divide-y divide-white/10">
								<tr *ngFor="let player of seasonStandings; let i = index"
								    class="standings-row"
								    [class.position-1]="i === 0"
								    [class.position-2]="i === 1"
								    [class.position-3]="i === 2">

									<td class="px-6 py-4 whitespace-nowrap">
										<div class="flex items-center">
											<span class="text-lg font-bold text-white">{{ i + 1 }}.</span>
											<span *ngIf="i === 0" class="ml-2 text-yellow-400">🥇</span>
											<span *ngIf="i === 1" class="ml-2 text-slate-300">🥈</span>
											<span *ngIf="i === 2" class="ml-2 text-orange-400">🥉</span>
										</div>
									</td>

									<td class="px-6 py-4 whitespace-nowrap">
										<div class="font-semibold text-white">{{ player.playerName }}</div>
									</td>

									<td class="px-6 py-4 text-center">
										<span class="points-badge">{{ player.totalPoints }}</span>
									</td>

									<td class="px-6 py-4 text-center">
									<span *ngIf="getPrizeAmount(i) > 0" class="text-emerald-300 font-semibold">
										{{ getPrizeAmount(i) }}€
									</span>
										<span *ngIf="getPrizeAmount(i) === 0" class="text-slate-400">-</span>
									</td>

									<td class="px-6 py-4 text-center">
									<span *ngIf="getWeeklyPrizesWon(player.playerName) > 0"
									      class="text-blue-300 font-semibold">
										{{ getWeeklyPrizesWon(player.playerName) }}€
									</span>
										<span *ngIf="getWeeklyPrizesWon(player.playerName) === 0"
										      class="text-slate-400">-</span>
									</td>

									<td class="px-6 py-4 text-center text-sm text-slate-300">{{ player.weeksPlayed }}</td>

									<td class="px-6 py-4 text-center">
										<div class="flex items-center justify-center space-x-1">
											<span *ngIf="player.goldMedals > 0" class="flex items-center">
												<span class="text-yellow-400">🥇</span>
												<span class="text-xs font-semibold ml-0.5 text-white">{{ player.goldMedals }}</span>
											</span>
											<span *ngIf="player.silverMedals > 0" class="flex items-center">
												<span class="text-slate-300">🥈</span>
												<span class="text-xs font-semibold ml-0.5 text-white">{{ player.silverMedals }}</span>
											</span>
											<span *ngIf="player.bronzeMedals > 0" class="flex items-center">
												<span class="text-orange-400">🥉</span>
												<span class="text-xs font-semibold ml-0.5 text-white">{{ player.bronzeMedals }}</span>
											</span>
											<span *ngIf="player.podiumFinishes === 0" class="text-slate-400">-</span>
										</div>
									</td>

									<td class="px-6 py-4 text-center text-sm text-slate-300">{{ player.averagePosition.toFixed(1) }}</td>

									<td class="px-6 py-4">
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
											<span *ngIf="player.weeklyResults.length > 10"
											      class="text-xs text-slate-400 ml-2">
											+{{ player.weeklyResults.length - 10 }}
										</span>
										</div>
									</td>
								</tr>
								</tbody>
							</table>
						</div>
					</div>

					<div *ngIf="getRecentWeeks().length > 0" class="glass-card p-8 rounded-2xl shadow-xl">
						<h3 class="text-2xl font-semibold mb-6 text-white">📅 Viimeisimmät viikkokisat</h3>

						<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
							<div *ngFor="let week of getRecentWeeks()"
							     class="glass-card p-6 rounded-xl cursor-pointer hover:scale-105 transition-all duration-300 hover:shadow-lg"
							     (click)="toggleWeekDetails(week.weekNumber)">
								<div class="flex justify-between items-center mb-3">
									<span class="font-semibold text-indigo-300 text-lg">Viikko {{ week.weekNumber }}</span>
									<div class="flex items-center">
										<span class="text-xs text-slate-300 bg-white/10 px-2 py-1 rounded-full mr-2">{{ week.date | date:'dd.MM' }}</span>
										<span class="text-sm text-white" [innerHTML]="expandedWeek === week.weekNumber ? '▼' : '▶'"></span>
									</div>
								</div>

								<div class="space-y-2">
									<div *ngFor="let ranking of week.finalRanking.slice(0, 3); let pos = index"
									     class="flex justify-between items-center text-sm">
										<div class="flex items-center">
											<span class="w-4 text-center font-medium text-white">{{ pos + 1 }}.</span>
											<span class="ml-2 text-slate-200">{{ ranking.playerName }}</span>
											<span *ngIf="pos === 0" class="ml-2 text-yellow-300 font-medium text-xs">💰 {{ week.players.length * 2.5 }}€</span>
										</div>
										<span class="font-medium text-emerald-300">+{{ ranking.points }}p</span>
									</div>
								</div>

								<!-- Week details - shown when expanded -->
								<div *ngIf="expandedWeek === week.weekNumber"
								     class="mt-4 pt-4 border-t border-white/20">

									<!-- Players list -->
									<h4 class="font-semibold text-sm mb-3 text-white">Pelaajat ({{ week.players.length }}):</h4>
									<div class="flex flex-wrap gap-2 mb-4">
										<span *ngFor="let player of week.players"
										      class="bg-indigo-600/30 text-indigo-200 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm border border-indigo-400/20">
											{{ player.name }}
										</span>
									</div>

									<!-- Match details -->
									<div *ngIf="week.matches && week.matches.length > 0">
										<h4 class="font-semibold text-sm mb-3 text-white">Ottelut:</h4>
										<div class="space-y-2 mb-4">
											<div *ngFor="let match of week.matches" class="text-xs text-slate-300 bg-white/10 p-3 rounded-lg backdrop-blur-sm">
												<div class="flex justify-between items-center">
													<span>{{ match.player1Name }} vs {{ match.player2Name }}</span>
													<span class="font-medium text-white">{{ match.player1Legs }}-{{ match.player2Legs }}</span>
												</div>
												<div class="flex justify-between items-center mt-1">
													<span class="text-emerald-300">🏆 {{ match.winnerName }}</span>
													<span class="text-slate-400">{{ match.round }}{{ match.group ? ' (Lohko ' + match.group + ')' : '' }}</span>
												</div>
											</div>
										</div>
									</div>

									<div *ngIf="!week.matches || week.matches.length === 0" class="text-xs text-slate-400">
										Ottelutietoja ei ole saatavilla tälle viikolle
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	`
})
export class StandingsComponent implements OnInit {
	seasonStandings: SeasonStanding[] = [];
	expandedWeek: number | null = null;

	constructor(
		private tournamentService: TournamentService,
		private router: Router
	) {
	}

	ngOnInit(): void {
		this.seasonStandings = this.tournamentService.getSeasonStandings();
	}

	getCompletedWeeks(): number {
		return new Set(this.tournamentService.weekResults.map(r => r.weekNumber)).size;
	}

	getUniquePlayers(): number {
		const players = new Set();
		this.tournamentService.weekResults.forEach(result => {
			result.finalRanking.forEach(ranking => players.add(ranking.playerName));
		});
		return players.size;
	}

	getTotalMatches(): number {
		return this.tournamentService.weekResults.reduce((total, result) => {
			const playerCount = result.players.length;
			let matchesPerWeek: number;
			if (playerCount <= 5) {
				// Round robin: n(n-1)/2
				matchesPerWeek = (playerCount * (playerCount - 1)) / 2;
			} else if (playerCount <= 8) {
				// 2 groups + playoff: estimate based on group sizes
				matchesPerWeek = Math.floor(playerCount * 3.5);
			} else {
				// 3 groups: estimate based on 3 equal groups + final
				const avgGroupSize = Math.ceil(playerCount / 3);
				const groupMatches = 3 * ((avgGroupSize * (avgGroupSize - 1)) / 2);
				const finalMatches = 1; // Just 3-way final
				matchesPerWeek = groupMatches + finalMatches;
			}
			return total + matchesPerWeek;
		}, 0);
	}

	getCurrentLeader(): SeasonStanding | null {
		return this.seasonStandings.length > 0 ? this.seasonStandings[0] : null;
	}

	getTotalPrizePool(): number {
		return this.tournamentService.getTotalPrizePool();
	}

	getPrizeAmount(position: number): number {
		const totalPool = this.getTotalPrizePool();

		switch (position) {
			case 0:
				return Math.round(totalPool * 0.5); // 50%
			case 1:
				return Math.round(totalPool * 0.3); // 30%
			case 2:
				return Math.round(totalPool * 0.2); // 20%
			default:
				return 0;
		}
	}

	getWeeklyPrizesWon(playerName: string): number {
		return this.tournamentService.getWeeklyPrizesWon(playerName);
	}

	getRecentWeeks(): any[] {
		return this.tournamentService.weekResults
			.sort((a, b) => b.weekNumber - a.weekNumber)
			.slice(0, 6);
	}

	toggleWeekDetails(weekNumber: number): void {
		this.expandedWeek = this.expandedWeek === weekNumber ? null : weekNumber;
	}

	goHome(): void {
		void this.router.navigate([ '/' ]);
	}
}
