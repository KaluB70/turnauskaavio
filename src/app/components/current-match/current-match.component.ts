import {Component} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {Router} from '@angular/router';
import {TournamentService} from '../../services/tournament.service';
import {MatchWinnerComponent} from '../match-winner/match-winner.component';

@Component({
	selector: 'current-match',
	standalone: true,
	imports: [CommonModule, FormsModule, MatchWinnerComponent],
	styles: [`
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
	`],
	template: `
		<match-winner *ngIf="tournamentService.showMatchWinner"></match-winner>

		<div class="bg-blue-100 p-6 rounded-lg shadow border-2 border-blue-300">
			<h2 class="text-xl font-semibold mb-4">Nykyinen ottelu</h2>

			<div *ngIf="tournamentService.currentMatch; let match">
				<div class="mb-4 text-center">
					<span class="text-sm bg-blue-600 text-white py-1 px-3 rounded-full">
						{{ getRoundText(match) }}
					</span>
					<span class="ml-2 text-sm bg-green-600 text-white py-1 px-3 rounded-full">
						BO{{ getEffectiveBestOf(match) }}
					</span>
					<span class="ml-2 text-sm bg-purple-600 text-white py-1 px-3 rounded-full">
						{{ tournamentService.gameMode }}
					</span>
					<span *ngIf="match.round === 'playoff'"
					      class="ml-2 text-sm bg-red-600 text-white py-1 px-3 rounded-full">
						KARSINTA
					</span>
				</div>

				<!-- 3-way Final -->
				<div *ngIf="tournamentService.is3WayFinal() && match.round === 'final'" class="mb-6">
					<div class="text-center mb-4">
						<h3 class="text-xl font-bold text-green-600">🏆 Finaali</h3>
						<p class="text-sm text-gray-600">Kolme pelaajaa samassa ottelussa</p>
						<p class="text-xs text-amber-600 font-medium mt-1">
							Turnaus päättyy kun 2 pelaajaa saavuttaa {{ getLegsToWin(match) }} legiä
						</p>
					</div>

					<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div class="text-center bg-white p-4 rounded-lg border-2 border-blue-300 relative"
						     [class.player-finished]="isPlayerFinished(match.player1Id)"
						     [class.rank-1]="isPlayerFinished(match.player1Id) && getPlayerRank(match.player1Id) === 1"
						     [class.rank-2]="isPlayerFinished(match.player1Id) && getPlayerRank(match.player1Id) === 2"
						     [class.rank-3]="isPlayerFinished(match.player1Id) && getPlayerRank(match.player1Id) === 3">
							<div *ngIf="isPlayerFinished(match.player1Id)" class="confetti-overlay"></div>
							<div class="font-bold text-xl mb-2"
							     [class.winner-text]="isPlayerFinished(match.player1Id)">{{ tournamentService.getPlayerName(match.player1Id) }}</div>
							<div class="text-lg font-bold mb-3"
							     [class.winner-text]="isPlayerFinished(match.player1Id)">
								Legit: {{ match.player1Legs }}
								<span *ngIf="isPlayerFinished(match.player1Id)" class="ml-2 text-sm">✅ Valmis!</span>
							</div>
							<div class="flex justify-center space-x-2">
								<button (click)="adjustLegs(match, 'player1', -1)"
								        class="bg-gray-200 text-gray-800 py-1 px-3 rounded-md hover:bg-gray-300 font-bold"
								        [disabled]="match.player1Legs <= 0">-</button>
								<button (click)="adjustLegs(match, 'player1', 1)"
								        class="bg-blue-600 text-white py-1 px-3 rounded-md hover:bg-blue-700 font-bold">+</button>
							</div>
						</div>

						<div class="text-center bg-white p-4 rounded-lg border-2 border-blue-300 relative"
						     [class.player-finished]="isPlayerFinished(match.player2Id)"
						     [class.rank-1]="isPlayerFinished(match.player2Id) && getPlayerRank(match.player2Id) === 1"
						     [class.rank-2]="isPlayerFinished(match.player2Id) && getPlayerRank(match.player2Id) === 2"
						     [class.rank-3]="isPlayerFinished(match.player2Id) && getPlayerRank(match.player2Id) === 3">
							<div *ngIf="isPlayerFinished(match.player2Id)" class="confetti-overlay"></div>
							<div class="font-bold text-xl mb-2"
							     [class.winner-text]="isPlayerFinished(match.player2Id)">{{ tournamentService.getPlayerName(match.player2Id) }}</div>
							<div class="text-lg font-bold mb-3"
							     [class.winner-text]="isPlayerFinished(match.player2Id)">
								Legit: {{ match.player2Legs }}
								<span *ngIf="isPlayerFinished(match.player2Id)" class="ml-2 text-sm">✅ Valmis!</span>
							</div>
							<div class="flex justify-center space-x-2">
								<button (click)="adjustLegs(match, 'player2', -1)"
								        class="bg-gray-200 text-gray-800 py-1 px-3 rounded-md hover:bg-gray-300 font-bold"
								        [disabled]="match.player2Legs <= 0">-</button>
								<button (click)="adjustLegs(match, 'player2', 1)"
								        class="bg-blue-600 text-white py-1 px-3 rounded-md hover:bg-blue-700 font-bold">+</button>
							</div>
						</div>

						<div *ngIf="match.player3Id"
						     class="text-center bg-white p-4 rounded-lg border-2 border-blue-300 relative"
						     [class.player-finished]="isPlayerFinished(match.player3Id)"
						     [class.rank-1]="isPlayerFinished(match.player3Id) && getPlayerRank(match.player3Id) === 1"
						     [class.rank-2]="isPlayerFinished(match.player3Id) && getPlayerRank(match.player3Id) === 2"
						     [class.rank-3]="isPlayerFinished(match.player3Id) && getPlayerRank(match.player3Id) === 3">
							<div *ngIf="isPlayerFinished(match.player3Id)" class="confetti-overlay"></div>
							<div class="font-bold text-xl mb-2"
							     [class.winner-text]="isPlayerFinished(match.player3Id)">{{ tournamentService.getPlayerName(match.player3Id) }}</div>
							<div class="text-lg font-bold mb-3"
							     [class.winner-text]="isPlayerFinished(match.player3Id)">
								Legit: {{ match.player3Legs }}
								<span *ngIf="isPlayerFinished(match.player3Id)" class="ml-2 text-sm">✅ Valmis!</span>
							</div>
							<div class="flex justify-center space-x-2">
								<button (click)="adjustThirdPlayerLegs(-1)"
								        class="bg-gray-200 text-gray-800 py-1 px-3 rounded-md hover:bg-gray-300 font-bold"
								        [disabled]="(match.player3Legs || 0) <= 0">-</button>
								<button (click)="adjustThirdPlayerLegs(1)"
								        class="bg-blue-600 text-white py-1 px-3 rounded-md hover:bg-blue-700 font-bold">+</button>
							</div>
						</div>
					</div>
				</div>

				<!-- Regular 2-player Match -->
				<div *ngIf="!tournamentService.is3WayFinal() || match.round !== 'final'"
				     class="flex flex-col md:flex-row justify-between items-center mb-6">
					<div class="text-center w-full md:w-2/5 mb-4 md:mb-0">
						<div class="font-bold text-3xl">{{ tournamentService.getPlayerName(match.player1Id) }}</div>
						<div class="mt-4 mb-3">
							<div class="text-2xl font-bold">Legit: {{ match.player1Legs }}</div>
						</div>
						<div class="flex justify-center items-center mt-4">
							<button (click)="adjustLegs(match, 'player1', -1)"
							        class="bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 mr-2 text-lg font-bold"
							        [disabled]="match.player1Legs <= 0">-</button>
							<button (click)="adjustLegs(match, 'player1', 1)"
							        class="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 text-lg font-bold">+</button>
						</div>
					</div>

					<div class="text-3xl font-bold mb-4 md:mb-0">vs</div>

					<div class="text-center w-full md:w-2/5">
						<div class="font-bold text-3xl">{{ tournamentService.getPlayerName(match.player2Id) }}</div>
						<div class="mt-4 mb-3">
							<div class="text-2xl font-bold">Legit: {{ match.player2Legs }}</div>
						</div>
						<div class="flex justify-center items-center mt-4">
							<button (click)="adjustLegs(match, 'player2', -1)"
							        class="bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 mr-2 text-lg font-bold"
							        [disabled]="match.player2Legs <= 0">-</button>
							<button (click)="adjustLegs(match, 'player2', 1)"
							        class="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 text-lg font-bold">+</button>
						</div>
					</div>
				</div>

				<div class="text-center text-sm text-gray-600">
					Voittoon tarvitaan {{ getLegsToWin(match) }} legiä
				</div>
			</div>

			<div *ngIf="!tournamentService.currentMatch" class="text-center">
				<div class="text-xl font-bold text-green-700 mb-4">
					{{ getCompletionMessage() }}
				</div>

				<div *ngIf="isFullyComplete()">
					<div class="mb-4 p-4 bg-green-50 rounded-lg">
						<h3 class="font-semibold mb-3">🏆 Illan tulokset:</h3>
						<div class="space-y-2">
							<div *ngFor="let standing of getFinalResults(); let i = index"
							     class="flex justify-between items-center p-2 rounded"
							     [class.bg-yellow-200]="i === 0"
							     [class.bg-gray-100]="i === 1"
							     [class.bg-orange-100]="i === 2">
								<div class="flex items-center">
									<span class="font-bold mr-2">{{ i + 1 }}.</span>
									<span>{{ standing.playerName }}</span>
									<span *ngIf="i < 3" class="ml-2 text-xs bg-green-600 text-white px-2 py-1 rounded-full">
										+{{ getWeeklyPoints(i + 1) }}p
									</span>
								</div>
								<div class="text-sm text-gray-600">
									{{ standing.wins }}V - {{ standing.losses }}T
									({{ standing.legDifference >= 0 ? '+' : '' }}{{ standing.legDifference }})
								</div>
							</div>
						</div>

						<div class="mt-4 p-3 bg-green-200 rounded-lg text-center">
							<div class="font-semibold">💰 Viikkopotti voittajalle:</div>
							<div class="text-xl font-bold text-green-700">{{ tournamentService.players.length * 2.5 }}€</div>
						</div>
					</div>

					<div class="flex justify-center mt-6 space-x-4">
						<button (click)="startNew()"
						        class="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700">
							Etusivu
						</button>
						<button (click)="restartSame()"
						        class="bg-green-600 text-white py-2 px-6 rounded-md hover:bg-green-700">
							Uusi viikko samoilla pelaajilla
						</button>
					</div>
				</div>

				<div *ngIf="!isFullyComplete() && tournamentService.isStarted">
					<div class="text-lg text-blue-600 mb-4">
						{{ getPhaseTransitionMessage() }}
					</div>
					<button (click)="continueToNext()"
					        class="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700">
						Jatka seuraavaan vaiheeseen
					</button>
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
			const playerIds = [match.player1Id, match.player2Id, match.player3Id!];
			const playerLegs = [match.player1Legs, match.player2Legs, match.player3Legs || 0];

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
		return [0, 5, 3, 1, 0][position] || 0;
	}

	continueToNext(): void {
		this.tournamentService.findNextMatch();
	}

	startNew(): void {
		this.tournamentService.reset();
		this.router.navigate(['/']);
	}

	restartSame(): void {
		const playerNames = this.tournamentService.players.map(p => p.name);
		const gameMode = this.tournamentService.gameMode;
		const bestOfLegs = this.tournamentService.bestOfLegs;
		const weekNumber = this.tournamentService.weekNumber + 1;

		const tournamentId = this.tournamentService.register(playerNames, gameMode, bestOfLegs, weekNumber);
		this.router.navigate(['/tournament', tournamentId]);
	}
}
