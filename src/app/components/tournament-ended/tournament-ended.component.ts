import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Router} from '@angular/router';
import {trigger, transition, style, animate} from '@angular/animations';
import {TournamentService} from '../../services/tournament.service';

@Component({
	selector: 'tournament-ended',
	standalone: true,
	imports: [CommonModule],
	animations: [
		trigger('slideIn', [
			transition(':enter', [
				style({transform: 'translateY(100%)', opacity: 0}),
				animate('0.8s ease-out', style({transform: 'translateY(0)', opacity: 1}))
			])
		]),
		trigger('fadeIn', [
			transition(':enter', [
				style({opacity: 0, transform: 'scale(0.8)'}),
				animate('0.6s 0.3s ease-out', style({opacity: 1, transform: 'scale(1)'}))
			])
		]),
		trigger('bounce', [
			transition(':enter', [
				style({transform: 'scale(0)'}),
				animate('0.5s 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55)', style({transform: 'scale(1)'}))
			])
		])
	],
	styles: [`
		.celebration-bg {
			background: linear-gradient(135deg, #10b981 0%, #059669 30%, #047857 100%);
			min-height: 100vh;
			position: relative;
			overflow: hidden;
		}
		.confetti {
			position: absolute;
			width: 10px;
			height: 10px;
			background: #fbbf24;
			animation: confetti-fall 3s linear infinite;
		}
		.confetti:nth-child(odd) {
			background: #f59e0b;
			animation-delay: -0.5s;
		}
		.confetti:nth-child(even) {
			background: #ef4444;
			animation-delay: -1s;
		}
		@keyframes confetti-fall {
			0% {
				transform: translateY(-100vh) rotate(0deg);
				opacity: 1;
			}
			100% {
				transform: translateY(100vh) rotate(360deg);
				opacity: 0;
			}
		}
		.trophy-glow {
			text-shadow: 0 0 20px rgba(251, 191, 36, 0.8);
			animation: glow 2s ease-in-out infinite alternate;
		}
		@keyframes glow {
			from { text-shadow: 0 0 20px rgba(251, 191, 36, 0.8); }
			to { text-shadow: 0 0 30px rgba(251, 191, 36, 1), 0 0 40px rgba(251, 191, 36, 0.8); }
		}
		.money-animation {
			animation: money-bounce 2s ease-in-out infinite;
		}
		@keyframes money-bounce {
			0%, 100% { transform: translateY(0) rotate(-5deg); }
			50% { transform: translateY(-10px) rotate(5deg); }
		}
	`],
	template: `
		<div class="celebration-bg text-white relative">
			<!-- Confetti -->
			<div class="confetti" style="left: 10%; animation-delay: 0s;"></div>
			<div class="confetti" style="left: 20%; animation-delay: -0.3s;"></div>
			<div class="confetti" style="left: 30%; animation-delay: -0.6s;"></div>
			<div class="confetti" style="left: 40%; animation-delay: -0.9s;"></div>
			<div class="confetti" style="left: 50%; animation-delay: -1.2s;"></div>
			<div class="confetti" style="left: 60%; animation-delay: -1.5s;"></div>
			<div class="confetti" style="left: 70%; animation-delay: -1.8s;"></div>
			<div class="confetti" style="left: 80%; animation-delay: -2.1s;"></div>
			<div class="confetti" style="left: 90%; animation-delay: -2.4s;"></div>

			<div class="container mx-auto px-4 py-8 relative z-10">
				<!-- Header -->
				<div class="text-center mb-8" @slideIn>
					<div class="trophy-glow text-8xl mb-4">🏆</div>
					<h1 class="text-5xl md:text-6xl font-bold mb-2">VIIKKOKISAT</h1>
					<h2 class="text-3xl md:text-4xl font-semibold mb-4">PÄÄTTYNYT!</h2>
					<div class="text-xl opacity-90">Viikko {{ tournamentService.weekNumber }}</div>
				</div>

				<!-- Winner Section -->
				<div class="text-center mb-8" @fadeIn>
					<div class="bg-yellow-400 text-green-900 rounded-full px-8 py-4 inline-block mb-4 transform shadow-2xl">
						<div class="text-2xl font-bold mb-1">🥇 VOITTAJA</div>
						<div class="text-4xl font-bold">{{ getWinner()?.playerName || 'Tuntematon' }}</div>
					</div>
				</div>

				<!-- Final Rankings -->
				<div class="max-w-2xl mx-auto mb-8" @fadeIn>
					<div class="bg-black bg-opacity-30 rounded-xl p-6 backdrop-blur-sm">
						<h3 class="text-2xl font-bold mb-4 text-center">🏅 LOPPUTULOKSET</h3>
						<div class="space-y-3">
							<div *ngFor="let result of getFinalRanking(); let i = index"
							     class="flex items-center justify-between p-3 rounded-lg"
							     [class.bg-yellow-500]="i === 0"
							     [class.bg-gray-300]="i === 1"
							     [class.bg-orange-400]="i === 2"
							     [class.bg-black]="i > 2"
							     [class.text-green-900]="i === 0"
							     [class.text-gray-800]="i === 1"
							     [class.text-white]="i === 2 || i > 2">

								<div class="flex items-center space-x-3">
									<div class="text-2xl font-bold">
										{{ i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i + 1) + '.' }}
									</div>
									<div class="text-xl font-semibold">{{ result.playerName }}</div>
								</div>
								<div class="text-right">
									<div class="text-lg font-bold">+{{ result.points }} pistettä</div>
									<div class="text-sm opacity-75">Rankingiin</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				<!-- Prize Money -->
				<div class="text-center mb-8" @bounce>
					<div class="bg-green-600 rounded-xl p-6 inline-block shadow-2xl money-animation">
						<div class="text-3xl mb-2">💰</div>
						<div class="text-lg font-semibold mb-1">VIIKKOPOTTI</div>
						<div class="text-4xl font-bold text-yellow-300">{{ getWeeklyPot() }}€</div>
						<div class="text-sm opacity-90 mt-1">Voittajalle: {{ getWinner()?.playerName }}</div>
					</div>
				</div>

				<!-- Tournament Stats -->
				<div class="max-w-xl mx-auto mb-8" @fadeIn>
					<div class="bg-black bg-opacity-30 rounded-xl p-6 backdrop-blur-sm">
						<h3 class="text-xl font-bold mb-4 text-center">📊 TURNAUKSEN TILASTOT</h3>
						<div class="grid grid-cols-2 gap-4 text-center">
							<div>
								<div class="text-2xl font-bold">{{ tournamentService.players.length }}</div>
								<div class="text-sm opacity-75">Pelaajaa</div>
							</div>
							<div>
								<div class="text-2xl font-bold">{{ getCompletedMatchCount() }}</div>
								<div class="text-sm opacity-75">Ottelua</div>
							</div>
							<div>
								<div class="text-2xl font-bold">{{ tournamentService.gameMode }}</div>
								<div class="text-sm opacity-75">Pelimuoto</div>
							</div>
							<div>
								<div class="text-2xl font-bold">BO{{ tournamentService.bestOfLegs }}</div>
								<div class="text-sm opacity-75">Ottelut</div>
							</div>
						</div>
					</div>
				</div>

				<!-- Season Progress -->
				<div class="text-center mb-8" @fadeIn>
					<div class="bg-blue-600 rounded-xl p-4 inline-block">
						<div class="text-lg font-semibold mb-2">🗓️ KAUDEN TILANNE</div>
						<div class="text-sm opacity-90">
							Viikko {{ tournamentService.weekNumber }}/10 suoritettu
						</div>
						<div class="w-48 bg-blue-800 rounded-full h-2 mt-2">
							<div class="bg-yellow-400 h-2 rounded-full"
							     [style.width.%]="getSeasonProgress()"></div>
						</div>
					</div>
				</div>

				<!-- Actions -->
				<div class="text-center space-x-4" @fadeIn>
					<button
						(click)="viewSeasonStandings()"
						class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-colors shadow-lg">
						📈 Katso kauden tilastot
					</button>
					<button
						(click)="startNewWeek()"
						class="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg transition-colors shadow-lg">
						🎯 Uudet viikkokisat
					</button>
				</div>

				<!-- Footer -->
				<div class="text-center mt-8 opacity-75">
					<div class="text-sm">
						Kiitos osallistumisesta! 🎯
					</div>
				</div>
			</div>
		</div>
	`
})
export class TournamentEndedComponent implements OnInit {
	constructor(
		public tournamentService: TournamentService,
		private router: Router
	) {}

	ngOnInit(): void {
		// Auto-advance to season standings after 15 seconds
		setTimeout(() => {
			this.viewSeasonStandings();
		}, 15000);
	}

	getWinner() {
		const rankings = this.getFinalRanking();
		return rankings.length > 0 ? rankings[0] : null;
	}

	getFinalRanking() {
		// Get the latest completed week result
		const latestResult = this.tournamentService.weekResults
			.filter(w => w.weekNumber === this.tournamentService.weekNumber)[0];

		return latestResult ? latestResult.finalRanking : [];
	}

	getWeeklyPot(): number {
		return this.tournamentService.players.length * 2.5;
	}

	getCompletedMatchCount(): number {
		return this.tournamentService.matches.filter(m => m.isComplete).length;
	}

	getSeasonProgress(): number {
		return (this.tournamentService.weekNumber / 10) * 100;
	}

	viewSeasonStandings(): void {
		this.router.navigate(['/standings']);
	}

	startNewWeek(): void {
		this.tournamentService.reset();
		this.router.navigate(['/']);
	}
}
