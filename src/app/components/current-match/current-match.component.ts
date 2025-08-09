import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TournamentService } from '../../services/tournament.service';
import { MatchWinnerComponent } from '../match-winner/match-winner.component';

@Component({
	selector: 'current-match',
	standalone: true,
	imports: [ CommonModule, FormsModule, MatchWinnerComponent ],
	styles: [ `
		.match-bg {
			background: linear-gradient(135deg, #0f172a 0%, #1e293b 25%, #334155 75%, #475569 100%);
			min-height: 100vh;
			position: relative;
			overflow: hidden;
		}
		.match-bg::before {
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
		.player-finished {
			background: linear-gradient(135deg, #10b981 0%, #059669 100%);
			border: 3px solid #065f46 !important;
			color: white;
			position: relative;
			overflow: visible;
		}
		.player-finished::after {
			content: '';
			position: absolute;
			top: -5px;
			right: -5px;
			width: 30px;
			height: 30px;
			background: #fbbf24;
			border-radius: 50%;
			display: flex;
			align-items: center;
			justify-content: center;
			font-size: 16px;
			animation: confetti-bounce 2s infinite;
		}
		.rank-1::after { content: '🥇'; }
		.rank-2::after { content: '🥈'; }
		.rank-3::after { content: '🥉'; }
		@keyframes confetti-bounce {
			0%, 20%, 53%, 80%, 100% {
				transform: scale(1) rotate(0deg);
			}
			40%, 43% {
				transform: scale(1.2) rotate(5deg);
			}
			70% {
				transform: scale(1.1) rotate(-3deg);
			}
		}
		.confetti-overlay {
			position: absolute;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			pointer-events: none;
			background: radial-gradient(circle, rgba(251, 191, 36, 0.3) 0%, transparent 70%);
			animation: confetti-glow 3s ease-in-out infinite;
		}
		@keyframes confetti-glow {
			0%, 100% { opacity: 0; }
			50% { opacity: 1; }
		}
		.winner-text {
			color: #fbbf24;
			text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
			font-weight: bold;
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
		.badge-modern {
			background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
			backdrop-filter: blur(10px);
			border: 1px solid rgba(255, 255, 255, 0.3);
			transition: all 0.2s ease;
		}
		.badge-modern:hover {
			transform: translateY(-1px);
			box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
		}
		.result-row {
			background: rgba(255, 255, 255, 0.1);
			backdrop-filter: blur(5px);
			border: 1px solid rgba(255, 255, 255, 0.1);
			transition: all 0.2s ease;
		}
		.result-row:hover {
			background: rgba(255, 255, 255, 0.15);
		}
		.result-row.winner {
			background: linear-gradient(135deg, rgba(251, 191, 36, 0.3), rgba(245, 158, 11, 0.3));
			border-color: rgba(251, 191, 36, 0.4);
		}
		.result-row.second {
			background: linear-gradient(135deg, rgba(156, 163, 175, 0.3), rgba(107, 114, 128, 0.3));
			border-color: rgba(156, 163, 175, 0.4);
		}
		.result-row.third {
			background: linear-gradient(135deg, rgba(251, 146, 60, 0.3), rgba(249, 115, 22, 0.3));
			border-color: rgba(251, 146, 60, 0.4);
		}
	` ],
	template: `
		<match-winner *ngIf="tournamentService.showMatchWinner"></match-winner>

		<div class="match-bg min-h-screen relative">
			<div class="w-full px-4 py-8 relative z-20">
				<div class="glass-card rounded-2xl p-8 shadow-xl max-w-6xl mx-auto mb-8">
					<h2 class="text-4xl font-bold mb-8 text-white text-center">⚡ Nykyinen ottelu</h2>

			<div *ngIf="tournamentService.currentMatch; let match">
				<div class="mb-8 flex justify-center flex-wrap gap-3">
					<span class="badge-modern text-white py-2 px-4 rounded-xl text-sm font-medium shadow-lg">
						{{ getRoundText(match) }}
					</span>
					<span class="badge-modern text-white py-2 px-4 rounded-xl text-sm font-medium shadow-lg">
						BO{{ getEffectiveBestOf(match) }}
					</span>
					<span class="badge-modern text-white py-2 px-4 rounded-xl text-sm font-medium shadow-lg">
						{{ tournamentService.gameMode }}
					</span>
					<span *ngIf="match.round === 'playoff'"
					      class="bg-gradient-to-r from-red-500 to-red-600 text-white py-2 px-4 rounded-xl text-sm font-medium shadow-lg backdrop-blur-sm border border-white/20">
						⚡ KARSINTA
					</span>
				</div>

				<!-- 3-way Final -->
				<div *ngIf="tournamentService.is3WayFinal() && match.round === 'final'" class="mb-6">
					<div class="text-center mb-4">
						<h3 class="text-xl font-bold text-emerald-300">🏆 Finaali</h3>
						<p class="text-sm text-slate-300">Kolme pelaajaa samassa ottelussa</p>
						<p class="text-xs text-amber-300 font-medium mt-1">
							Turnaus päättyy kun 2 pelaajaa saavuttaa {{ getLegsToWin(match) }} legiä
						</p>
					</div>

					<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div class="text-center glass-card p-4 rounded-xl border-2 border-indigo-400/30 relative"
						     [class.player-finished]="isPlayerFinished(match.player1Id)"
						     [class.rank-1]="isPlayerFinished(match.player1Id) && getPlayerRank(match.player1Id) === 1"
						     [class.rank-2]="isPlayerFinished(match.player1Id) && getPlayerRank(match.player1Id) === 2"
						     [class.rank-3]="isPlayerFinished(match.player1Id) && getPlayerRank(match.player1Id) === 3">
							<div *ngIf="isPlayerFinished(match.player1Id)" class="confetti-overlay"></div>
							<div class="font-bold text-xl mb-2 text-white"
							     [class.winner-text]="isPlayerFinished(match.player1Id)">{{ tournamentService.getPlayerName(match.player1Id) }}</div>
							<div class="text-lg font-bold mb-3 text-white"
							     [class.winner-text]="isPlayerFinished(match.player1Id)">
								Legit: {{ match.player1Legs }}
								<span *ngIf="isPlayerFinished(match.player1Id)" class="ml-2 text-sm">✅ Valmis!</span>
							</div>
							<div class="flex justify-center space-x-3">
								<button (click)="adjustLegs(match, 'player1', -1)"
								        class="modern-btn bg-gradient-to-r from-slate-500 to-slate-600 text-white py-3 px-5 rounded-xl font-bold shadow-lg disabled:opacity-50 relative z-10 text-xl"
								        [disabled]="match.player1Legs <= 0">−</button>
								<button (click)="adjustLegs(match, 'player1', 1)"
								        class="modern-btn bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-3 px-5 rounded-xl font-bold shadow-lg relative z-10 text-xl">+</button>
							</div>
						</div>

						<div class="text-center glass-card p-4 rounded-xl border-2 border-indigo-400/30 relative"
						     [class.player-finished]="isPlayerFinished(match.player2Id)"
						     [class.rank-1]="isPlayerFinished(match.player2Id) && getPlayerRank(match.player2Id) === 1"
						     [class.rank-2]="isPlayerFinished(match.player2Id) && getPlayerRank(match.player2Id) === 2"
						     [class.rank-3]="isPlayerFinished(match.player2Id) && getPlayerRank(match.player2Id) === 3">
							<div *ngIf="isPlayerFinished(match.player2Id)" class="confetti-overlay"></div>
							<div class="font-bold text-xl mb-2 text-white"
							     [class.winner-text]="isPlayerFinished(match.player2Id)">{{ tournamentService.getPlayerName(match.player2Id) }}</div>
							<div class="text-lg font-bold mb-3 text-white"
							     [class.winner-text]="isPlayerFinished(match.player2Id)">
								Legit: {{ match.player2Legs }}
								<span *ngIf="isPlayerFinished(match.player2Id)" class="ml-2 text-sm">✅ Valmis!</span>
							</div>
							<div class="flex justify-center space-x-3">
								<button (click)="adjustLegs(match, 'player2', -1)"
								        class="modern-btn bg-gradient-to-r from-slate-500 to-slate-600 text-white py-3 px-5 rounded-xl font-bold shadow-lg disabled:opacity-50 relative z-10 text-xl"
								        [disabled]="match.player2Legs <= 0">−</button>
								<button (click)="adjustLegs(match, 'player2', 1)"
								        class="modern-btn bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-3 px-5 rounded-xl font-bold shadow-lg relative z-10 text-xl">+</button>
							</div>
						</div>

						<div *ngIf="match.player3Id"
						     class="text-center glass-card p-4 rounded-xl border-2 border-indigo-400/30 relative"
						     [class.player-finished]="isPlayerFinished(match.player3Id)"
						     [class.rank-1]="isPlayerFinished(match.player3Id) && getPlayerRank(match.player3Id) === 1"
						     [class.rank-2]="isPlayerFinished(match.player3Id) && getPlayerRank(match.player3Id) === 2"
						     [class.rank-3]="isPlayerFinished(match.player3Id) && getPlayerRank(match.player3Id) === 3">
							<div *ngIf="isPlayerFinished(match.player3Id)" class="confetti-overlay"></div>
							<div class="font-bold text-xl mb-2 text-white"
							     [class.winner-text]="isPlayerFinished(match.player3Id)">{{ tournamentService.getPlayerName(match.player3Id) }}</div>
							<div class="text-lg font-bold mb-3 text-white"
							     [class.winner-text]="isPlayerFinished(match.player3Id)">
								Legit: {{ match.player3Legs }}
								<span *ngIf="isPlayerFinished(match.player3Id)" class="ml-2 text-sm">✅ Valmis!</span>
							</div>
							<div class="flex justify-center space-x-3">
								<button (click)="adjustThirdPlayerLegs(-1)"
								        class="modern-btn bg-gradient-to-r from-slate-500 to-slate-600 text-white py-3 px-5 rounded-xl font-bold shadow-lg disabled:opacity-50 relative z-10 text-xl"
								        [disabled]="(match.player3Legs || 0) <= 0">−</button>
								<button (click)="adjustThirdPlayerLegs(1)"
								        class="modern-btn bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-3 px-5 rounded-xl font-bold shadow-lg relative z-10 text-xl">+</button>
							</div>
						</div>
					</div>
				</div>

				<!-- Regular 2-player Match -->
				<div *ngIf="!tournamentService.is3WayFinal() || match.round !== 'final'"
				     class="flex flex-col md:flex-row justify-between items-center mb-6">
					<div class="text-center w-full md:w-2/5 mb-4 md:mb-0">
						<div class="font-bold text-3xl text-white">{{ tournamentService.getPlayerName(match.player1Id) }}</div>
						<div class="mt-4 mb-3">
							<div class="text-2xl font-bold text-white">Legit: {{ match.player1Legs }}</div>
						</div>
						<div class="flex justify-center items-center mt-4 space-x-4">
							<button (click)="adjustLegs(match, 'player1', -1)"
							        class="modern-btn bg-gradient-to-r from-slate-500 to-slate-600 text-white py-3 px-6 rounded-xl font-bold shadow-lg disabled:opacity-50 relative z-10 text-2xl"
							        [disabled]="match.player1Legs <= 0">−</button>
							<button (click)="adjustLegs(match, 'player1', 1)"
							        class="modern-btn bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-3 px-6 rounded-xl font-bold shadow-lg relative z-10 text-2xl">+</button>
						</div>
					</div>

					<div class="text-3xl font-bold mb-4 md:mb-0 text-white">vs</div>

					<div class="text-center w-full md:w-2/5">
						<div class="font-bold text-3xl text-white">{{ tournamentService.getPlayerName(match.player2Id) }}</div>
						<div class="mt-4 mb-3">
							<div class="text-2xl font-bold text-white">Legit: {{ match.player2Legs }}</div>
						</div>
						<div class="flex justify-center items-center mt-4 space-x-4">
							<button (click)="adjustLegs(match, 'player2', -1)"
							        class="modern-btn bg-gradient-to-r from-slate-500 to-slate-600 text-white py-3 px-6 rounded-xl font-bold shadow-lg disabled:opacity-50 relative z-10 text-2xl"
							        [disabled]="match.player2Legs <= 0">−</button>
							<button (click)="adjustLegs(match, 'player2', 1)"
							        class="modern-btn bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-3 px-6 rounded-xl font-bold shadow-lg relative z-10 text-2xl">+</button>
						</div>
					</div>
				</div>

				<div class="text-center text-sm mb-8 text-slate-300 font-medium">
					🏆 Voittoon tarvitaan {{ getLegsToWin(match) }} legiä
				</div>
			</div>

			<div *ngIf="!tournamentService.currentMatch" class="text-center">
				<div class="text-xl font-bold text-emerald-300 mb-4">
					🎉 {{ getCompletionMessage() }}
				</div>

				<div *ngIf="isFullyComplete()">
					<div class="mb-4 p-6 glass-card rounded-xl">
						<h3 class="font-semibold mb-4 text-white text-lg">🏆 Illan tulokset:</h3>
						<div class="space-y-3">
							<div *ngFor="let standing of getFinalResults(); let i = index"
							     class="result-row flex justify-between items-center p-4 rounded-xl"
							     [class.winner]="i === 0"
							     [class.second]="i === 1"
							     [class.third]="i === 2">
								<div class="flex items-center">
									<span class="font-bold mr-3 text-white text-lg">{{ i + 1 }}.</span>
									<span class="text-white font-medium">{{ standing.playerName }}</span>
									<span *ngIf="i < 3" class="ml-3 text-xs bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-3 py-1 rounded-full font-medium shadow-sm">
										+{{ getWeeklyPoints(i + 1) }}p
									</span>
								</div>
								<div class="text-sm text-slate-300 font-medium">
									{{ standing.wins }}V - {{ standing.losses }}T
									({{ standing.legDifference >= 0 ? '+' : '' }}{{ standing.legDifference }})
								</div>
							</div>
						</div>

						<div class="mt-6 p-4 bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 rounded-xl text-center border border-emerald-400/30">
							<div class="font-semibold text-emerald-200 mb-1">💰 Viikkopotti voittajalle:</div>
							<div class="text-2xl font-bold text-emerald-300">{{ tournamentService.players.length * 2.5 }}€</div>
						</div>
					</div>

					<div class="flex justify-center mt-6 space-x-4">
						<button (click)="startNew()"
						        class="modern-btn bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold shadow-lg relative z-10">
							🏠 Etusivu
						</button>
						<button (click)="restartSame()"
						        class="modern-btn bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-3 px-6 rounded-xl font-semibold shadow-lg relative z-10">
							🔄 Uusi viikko samoilla pelaajilla
						</button>
					</div>
				</div>

				<div *ngIf="!isFullyComplete() && tournamentService.isStarted">
					<div class="text-lg text-indigo-300 mb-4 font-medium">
						🎯 {{ getPhaseTransitionMessage() }}
					</div>
					<button (click)="continueToNext()"
					        class="modern-btn bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 px-8 rounded-xl font-semibold shadow-lg relative z-10">
						➡️ Jatka seuraavaan vaiheeseen
					</button>
				</div>
			</div>

			<!-- Tournament Bracket Section -->
			<div class="w-full px-4 pb-8 relative z-20">
				<div class="glass-card rounded-2xl p-8 shadow-xl max-w-6xl mx-auto">
					<ng-content></ng-content>
				</div>
			</div>
		</div>
	`
})
export class CurrentMatchComponent {

	constructor(
		public tournamentService: TournamentService,
		private router: Router
	) {}

	isPlayerFinished(playerId: number): boolean {
		const match = this.tournamentService.currentMatch;
		if (!match || !this.tournamentService.is3WayFinal() || match.round !== 'final') {
			return false;
		}

		const legsToWin = this.getLegsToWin(match);
		if (match.player1Id === playerId) {
			return match.player1Legs >= legsToWin;
		} else if (match.player2Id === playerId) {
			return match.player2Legs >= legsToWin;
		} else if (match.player3Id === playerId) {
			return (match.player3Legs || 0) >= legsToWin;
		}
		return false;
	}

	getPlayerRank(playerId: number): number {
		const match = this.tournamentService.currentMatch;
		if (!match || !this.tournamentService.is3WayFinal() || match.round !== 'final') {
			return 0;
		}

		// Use finish order if available (more accurate than leg count)
		if (match.finishOrder && match.finishOrder.length > 0) {
			const finishPosition = match.finishOrder.indexOf(playerId);
			if (finishPosition !== -1) {
				return finishPosition + 1; // Convert 0-based index to 1-based rank
			}
		}

		// Fallback to leg-based ranking for players who haven't finished yet
		const legs = [
			{ id: match.player1Id, legs: match.player1Legs },
			{ id: match.player2Id, legs: match.player2Legs },
			{ id: match.player3Id!, legs: match.player3Legs || 0 }
		].sort((a, b) => b.legs - a.legs);

		return legs.findIndex(p => p.id === playerId) + 1;
	}

	adjustLegs(match: any, player: 'player1' | 'player2', delta: number): void {
		const legsToWin = this.getLegsToWin(match);
		const playerId = player === 'player1' ? match.player1Id : match.player2Id;

		if (player === 'player1') {
			const newLegs = Math.max(0, match.player1Legs + delta);
			if (newLegs > legsToWin) {
				return
			}
			match.player1Legs = newLegs
		} else {
			const newLegs = Math.max(0, match.player2Legs + delta);
			if (newLegs > legsToWin) {
				return
			}
			match.player2Legs = newLegs
		}

		// Handle finish order updates for 3-way finals
		if (this.tournamentService.is3WayFinal() && match.round === 'final') {
			this.updateFinishOrderForAdjustment(match, playerId, legsToWin);
		}

		if (delta > 0) {
			this.checkMatchCompletion();
		} else {
			// Save state when decreasing legs too
			this.tournamentService.saveTournamentState();
		}
	}

	adjustThirdPlayerLegs(delta: number): void {
		const match = this.tournamentService.currentMatch;
		if (!match || match.player3Legs === undefined) return;

		const legsToWin = this.getLegsToWin(match);
		const newLegs = Math.max(0, match.player3Legs + delta);
		if (delta > 0 && newLegs > legsToWin) {
			return;
		}

		match.player3Legs = newLegs;

		// Handle finish order updates for 3-way finals
		if (this.tournamentService.is3WayFinal() && match.round === 'final') {
			this.updateFinishOrderForAdjustment(match, match.player3Id!, legsToWin);
		}

		// Save state after leg adjustment
		this.tournamentService.saveTournamentState();
		if (delta > 0) {
			this.checkMatchCompletion();
		}
	}

	private updateFinishOrderForAdjustment(match: any, playerId: number, legsToWin: number): void {
		if (!match.finishOrder) {
			match.finishOrder = [];
		}

		const currentLegs = this.getCurrentLegsForPlayer(match, playerId);
		const wasFinished = match.finishOrder.includes(playerId);
		const isNowFinished = currentLegs >= legsToWin;

		if (wasFinished && !isNowFinished) {
			// Player was finished but now isn't - remove from finish order
			match.finishOrder = match.finishOrder.filter((id: number) => id !== playerId);
		}
		// Note: if player wasn't finished and now is, checkMatchCompletion() will handle adding them
	}

	private getCurrentLegsForPlayer(match: any, playerId: number): number {
		if (match.player1Id === playerId) return match.player1Legs;
		if (match.player2Id === playerId) return match.player2Legs;
		if (match.player3Id === playerId) return match.player3Legs || 0;
		return 0;
	}

	private checkMatchCompletion(): void {
		const match = this.tournamentService.currentMatch;
		if (!match) return;

		const legsToWin = this.getLegsToWin(match);

		if (this.tournamentService.is3WayFinal() && match.round === 'final') {
			// Initialize finish order if not exists
			if (!match.finishOrder) {
				match.finishOrder = [];
			}

			// Check each player and add to finish order when they reach required legs
			const playerIds = [ match.player1Id, match.player2Id, match.player3Id! ];
			const playerLegs = [ match.player1Legs, match.player2Legs, match.player3Legs || 0 ];

			playerIds.forEach((playerId, index) => {
				if (playerLegs[index] >= legsToWin && !match.finishOrder!.includes(playerId)) {
					match.finishOrder!.push(playerId);

					// Save state immediately when a player finishes
					this.tournamentService.saveTournamentState();
				}
			});

			// Tournament completes when 2 players have finished (determines all 3 positions)
			if (match.finishOrder.length >= 2) {
				// Winner is the first player to finish
				const winnerId = match.finishOrder[0];
				this.tournamentService.completeMatch(winnerId);
			}
		} else {
			if (match.player1Legs >= legsToWin || match.player2Legs >= legsToWin) {
				const winnerId = match.player1Legs >= legsToWin ? match.player1Id : match.player2Id;
				this.tournamentService.completeMatch(winnerId);
			}
		}
	}

	getRoundText(match: any): string {
		if (match.round === 'group') {
			if (this.tournamentService.tournamentType === 'groups' && match.group) {
				return `Lohko ${match.group}`;
			}
			return this.tournamentService.players.length === 3 ? 'Finaali' : 'Karsinnat';
		}
		if (match.round === 'playoff') return 'Karsinta finaaliin';
		return 'Finaali';
	}

	getEffectiveBestOf(match: any): number {
		return match.round === 'playoff' ? 1 : this.tournamentService.bestOfLegs;
	}

	getLegsToWin(match: any): number {
		return Math.ceil(this.getEffectiveBestOf(match) / 2);
	}

	getCompletionMessage(): string {
		if (this.isFullyComplete()) {
			return 'Viikkokisat päättyneet!';
		}

		switch (this.tournamentService.currentPhase) {
			case 'group': return 'Lohkopelit päättyneet';
			case 'playoff': return 'Karsinnat päättyneet';
			case 'final': return 'Finaali päättynyt';
			default: return 'Vaihe päättynyt';
		}
	}

	getPhaseTransitionMessage(): string {
		switch (this.tournamentService.currentPhase) {
			case 'group':
				return this.tournamentService.tournamentType === 'round-robin'
					? 'Karsinnat päättyneet - finalistit selvillä!'
					: 'Lohkopelit päättyneet - siirtymässä karsintaan';
			case 'playoff':
				return 'Karsinta päättynyt - siirtymässä finaaliin';
			default:
				return '';
		}
	}

	isFullyComplete(): boolean {
		if (this.tournamentService.currentPhase === 'final' && !this.tournamentService.currentMatch) {
			const finalMatches = this.tournamentService.matches.filter(m => m.round === 'final');
			return finalMatches.length > 0 && finalMatches.every(m => m.isComplete);
		}

		if (this.tournamentService.players.length === 3 &&
			this.tournamentService.tournamentType === 'round-robin' &&
			this.tournamentService.currentPhase === 'group' &&
			!this.tournamentService.currentMatch) {
			const groupMatches = this.tournamentService.matches.filter(m => m.round === 'group');
			return groupMatches.length > 0 && groupMatches.every(m => m.isComplete);
		}

		return false;
	}

	getFinalResults(): any[] {
		return this.tournamentService.getSortedStandings();
	}

	getWeeklyPoints(position: number): number {
		return [ 0, 5, 3, 1, 0 ][position] || 0;
	}

	continueToNext(): void {
		this.tournamentService.findNextMatch();
	}

	startNew(): void {
		this.tournamentService.reset();
		this.router.navigate([ '/' ]);
	}

	restartSame(): void {
		const playerNames = this.tournamentService.players.map(p => p.name);
		const gameMode = this.tournamentService.gameMode;
		const bestOfLegs = this.tournamentService.bestOfLegs;
		const weekNumber = this.tournamentService.weekNumber + 1;

		const tournamentId = this.tournamentService.register(playerNames, gameMode, bestOfLegs, weekNumber);
		this.router.navigate([ '/tournament', tournamentId ]);
	}
}
