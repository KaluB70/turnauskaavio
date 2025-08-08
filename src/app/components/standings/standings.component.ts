import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Router} from '@angular/router';
import {SeasonStanding, TournamentService} from '../../services/tournament.service';

@Component({
	selector: 'standings',
	standalone: true,
	imports: [CommonModule],
	styles: [`
		.standings-table {
			border-collapse: separate;
			border-spacing: 0;
		}

		.standings-container {
			-webkit-overflow-scrolling: touch;
		}

		.standings-row {
			transition: all 0.2s ease;
		}

		.standings-row:hover {
			background-color: #f9fafb;
			box-shadow: 4px 0 0 0 #3b82f6;
			transform: translateZ(0);
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
	`],
	template: `
		<div class="container mx-auto px-4 py-8">
			<div class="flex justify-between items-center mb-6">
				<h1 class="text-3xl font-bold">🏆 Kauden tilastot</h1>
				<button
					(click)="goHome()"
					class="bg-gray-600 text-white py-2 px-6 rounded-md hover:bg-gray-700">
					← Takaisin päävalikkoon
				</button>
			</div>

			<div class="space-y-6">
				<div class="stats-card p-6 rounded-lg shadow">
					<h2 class="text-2xl font-bold mb-4 flex items-center">
						<span class="mr-3">📊</span>
						Kauden tilastot
					</h2>

					<div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
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
							<div class="text-2xl font-bold text-yellow-600">{{ getTotalPrizePool() }}€</div>
							<div class="text-sm text-gray-600">Palkintopotti</div>
						</div>
						<div class="text-center">
							<div
								class="text-2xl font-bold text-orange-600">{{ getCurrentLeader()?.playerName || '-' }}
							</div>
							<div class="text-sm text-gray-600">Kärjessä</div>
						</div>
					</div>
				</div>

				<div class="bg-white p-6 rounded-lg shadow">
					<div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
						<h3 class="text-xl font-semibold flex items-center mb-2 md:mb-0">
							<span class="mr-2">🏆</span>
							Kauden kokonaistilanne
							<span class="ml-2 text-sm text-gray-500">7 parasta viikkoa lasketaan</span>
						</h3>
					</div>

					<div *ngIf="seasonStandings.length === 0" class="text-center text-gray-500 py-8">
						Ei vielä pelattuja viikkokisoja
					</div>

					<div *ngIf="seasonStandings.length > 0" class="standings-container overflow-x-auto">
						<table class="standings-table w-full min-w-[1000px]">
							<thead>
							<tr class="bg-gray-50">
								<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sija</th>
								<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pelaaja</th>
								<th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Pisteet
								</th>
								<th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
									Palkinto-osuus
								</th>
								<th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Voitettu
								</th>
								<th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Viikkoja
								</th>
								<th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Podium
								</th>
								<th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
									Keskisija
								</th>
								<th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
									Viikottaiset tulokset
								</th>
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
										<span *ngIf="i === 0" class="ml-2 text-yellow-500">🥇</span>
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

								<td class="px-4 py-3 text-center">
								<span *ngIf="getPrizeAmount(i) > 0" class="text-green-600 font-semibold">
									{{ getPrizeAmount(i) }}€
								</span>
									<span *ngIf="getPrizeAmount(i) === 0" class="text-gray-400">-</span>
								</td>

								<td class="px-4 py-3 text-center">
								<span *ngIf="getWeeklyPrizesWon(player.playerName) > 0"
								      class="text-blue-600 font-semibold">
									{{ getWeeklyPrizesWon(player.playerName) }}€
								</span>
									<span *ngIf="getWeeklyPrizesWon(player.playerName) === 0"
									      class="text-gray-400">-</span>
								</td>

								<td class="px-4 py-3 text-center text-sm">{{ player.weeksPlayed }}</td>


								<td class="px-4 py-3 text-center">
									<div class="flex items-center justify-center space-x-1">
										<span *ngIf="player.goldMedals > 0" class="flex items-center">
											<span class="text-yellow-500">🥇</span>
											<span class="text-xs font-semibold ml-0.5">{{ player.goldMedals }}</span>
										</span>
										<span *ngIf="player.silverMedals > 0" class="flex items-center">
											<span class="text-gray-400">🥈</span>
											<span class="text-xs font-semibold ml-0.5">{{ player.silverMedals }}</span>
										</span>
										<span *ngIf="player.bronzeMedals > 0" class="flex items-center">
											<span class="text-amber-600">🥉</span>
											<span class="text-xs font-semibold ml-0.5">{{ player.bronzeMedals }}</span>
										</span>
										<span *ngIf="player.podiumFinishes === 0" class="text-gray-400">-</span>
									</div>
								</td>

								<td class="px-4 py-3 text-center text-sm">{{ player.averagePosition.toFixed(1) }}</td>

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
										<span *ngIf="player.weeklyResults.length > 10"
										      class="text-xs text-gray-400 ml-2">
										+{{ player.weeklyResults.length - 10 }}
									</span>
									</div>
								</td>
							</tr>
							</tbody>
						</table>
					</div>
				</div>

				<div *ngIf="getRecentWeeks().length > 0" class="bg-gray-50 p-6 rounded-lg">
					<h3 class="text-lg font-semibold mb-4">📅 Viimeisimmät viikkokisat</h3>

					<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						<div *ngFor="let week of getRecentWeeks()" 
						     class="bg-white p-4 rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow duration-200"
						     (click)="toggleWeekDetails(week.weekNumber)">
							<div class="flex justify-between items-center mb-2">
								<span class="font-semibold text-blue-600">Viikko {{ week.weekNumber }}</span>
								<div class="flex items-center">
									<span class="text-xs text-gray-500 mr-2">{{ week.date | date:'dd.MM' }}</span>
									<span class="text-sm" [innerHTML]="expandedWeek === week.weekNumber ? '▼' : '▶'"></span>
								</div>
							</div>

							<div class="space-y-1">
								<div *ngFor="let ranking of week.finalRanking.slice(0, 3); let pos = index"
								     class="flex justify-between items-center text-sm">
									<div class="flex items-center">
										<span class="w-4 text-center font-medium">{{ pos + 1 }}.</span>
										<span class="ml-2">{{ ranking.playerName }}</span>
										<span *ngIf="pos === 0" class="ml-2 text-yellow-600 font-medium text-xs">💰 {{ week.players.length * 2.5 }}€</span>
									</div>
									<span class="font-medium text-green-600">+{{ ranking.points }}p</span>
								</div>
							</div>
							
							<!-- Week details - shown when expanded -->
							<div *ngIf="expandedWeek === week.weekNumber" 
							     class="mt-3 pt-3 border-t border-gray-200">
								
								<!-- Players list -->
								<h4 class="font-semibold text-sm mb-2">Pelaajat ({{ week.players.length }}):</h4>
								<div class="flex flex-wrap gap-1 mb-3">
									<span *ngFor="let player of week.players" 
									      class="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
										{{ player.name }}
									</span>
								</div>
								
								<!-- Match details -->
								<div *ngIf="week.matches && week.matches.length > 0">
									<h4 class="font-semibold text-sm mb-2">Ottelut:</h4>
									<div class="space-y-1 mb-3">
										<div *ngFor="let match of week.matches" class="text-xs text-gray-600 bg-gray-50 p-2 rounded">
											<div class="flex justify-between items-center">
												<span>{{ match.player1Name }} vs {{ match.player2Name }}</span>
												<span class="font-medium">{{ match.player1Legs }}-{{ match.player2Legs }}</span>
											</div>
											<div class="flex justify-between items-center mt-1">
												<span class="text-green-600">🏆 {{ match.winnerName }}</span>
												<span class="text-gray-500">{{ match.round }}{{ match.group ? ' (Lohko ' + match.group + ')' : '' }}</span>
											</div>
										</div>
									</div>
									
									<h4 class="font-semibold text-sm mb-2">Pelaajien legierot:</h4>
									<div class="grid grid-cols-2 gap-2">
										<div *ngFor="let ranking of week.finalRanking" class="text-xs bg-blue-50 p-2 rounded">
											<div class="flex justify-between items-center">
												<span class="font-medium">{{ ranking.playerName }}</span>
												<span class="font-mono" [class.text-green-600]="getWeeklyLegDifferenceNumber(week, ranking.playerName) > 0"
												      [class.text-red-600]="getWeeklyLegDifferenceNumber(week, ranking.playerName) < 0">
													{{ getWeeklyLegDifference(week, ranking.playerName) }}
												</span>
											</div>
										</div>
									</div>
								</div>
								
								<div *ngIf="!week.matches || week.matches.length === 0" class="text-xs text-gray-500">
									Ottelutietoja ei ole saatavilla tälle viikolle
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

	getWeeklyLegDifference(week: any, playerName: string): string {
		const difference = this.getWeeklyLegDifferenceNumber(week, playerName);
		return difference >= 0 ? `+${difference}` : `${difference}`;
	}

	getWeeklyLegDifferenceNumber(week: any, playerName: string): number {
		if (!week.matches || week.matches.length === 0) {
			return 0;
		}

		let legDifference = 0;
		
		week.matches.forEach((match: any) => {
			if (match.player1Name === playerName) {
				legDifference += (match.player1Legs - match.player2Legs);
			} else if (match.player2Name === playerName) {
				legDifference += (match.player2Legs - match.player1Legs);
			}
		});

		return legDifference;
	}

	toggleWeekDetails(weekNumber: number): void {
		this.expandedWeek = this.expandedWeek === weekNumber ? null : weekNumber;
	}

	goHome(): void {
		this.router.navigate(['/']);
	}
}
