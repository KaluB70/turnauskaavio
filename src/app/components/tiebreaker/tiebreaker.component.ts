import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TournamentService } from '../../services/tournament.service';

enum Multiplier {
	SINGLE = 'SINGLE',
	DOUBLE = 'DOUBLE',
	TRIPLE = 'TRIPLE'
}

@Component({
	selector: 'tiebreaker',
	standalone: true,
	imports: [ CommonModule, FormsModule ],
	styles: [ `
		.tiebreaker-bg {
			background: linear-gradient(135deg, #0f172a 0%, #1e293b 25%, #334155 75%, #475569 100%);
			min-height: 100vh;
			position: relative;
			overflow: hidden;
		}
		.tiebreaker-bg::before {
			content: '';
			position: absolute;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			background:
				radial-gradient(circle at 20% 20%, rgba(239, 68, 68, 0.15) 0%, transparent 50%),
				radial-gradient(circle at 80% 80%, rgba(220, 38, 38, 0.15) 0%, transparent 50%);
		}
		.glass-card {
			background: rgba(255, 255, 255, 0.1);
			backdrop-filter: blur(20px);
			border: 1px solid rgba(255, 255, 255, 0.2);
			box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
		}
		.round-display {
			background: rgba(255, 255, 255, 0.1);
			backdrop-filter: blur(10px);
			border: 2px solid rgba(255, 255, 255, 0.2);
			color: white;
			min-height: 60px;
			display: flex;
			align-items: center;
			justify-content: center;
			font-weight: bold;
			font-size: 1.25rem;
		}
		.dart-btn {
			backdrop-filter: blur(10px);
			border: 2px solid rgba(255, 255, 255, 0.2);
			color: white;
			transition: all 0.2s ease;
			font-weight: 600;
		}
		.dart-btn:hover {
			transform: scale(1.05);
		}
		.dart-btn.active {
			color: white !important;
			border-width: 2px !important;
			transform: scale(1.05);
			box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
		}
		.dart-btn.single { border-color: #10b981; }
		.dart-btn.double { border-color: #ef4444; }
		.dart-btn.triple { border-color: #f59e0b; }
		.dart-btn.special { border-color: #8b5cf6; }
		.current-player {
			background: linear-gradient(135deg, rgba(34, 197, 94, 0.3), rgba(21, 128, 61, 0.3));
			border-color: rgba(34, 197, 94, 0.5);
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
	` ],
	template: `
		<div class="tiebreaker-bg min-h-screen relative">
			<div class="w-full px-4 py-8 relative z-20">
				<div class="glass-card rounded-2xl p-8 shadow-xl max-w-4xl mx-auto">
					<h3 class="text-3xl font-bold mb-6 text-red-300 text-center">🎯 TASATILANTEEN RATKAISU</h3>

					<div class="mb-6 p-6 glass-card rounded-xl">
						<h4 class="font-semibold mb-4 text-white text-lg">⚡ Tilanne:</h4>
						<div class="text-sm text-slate-300 space-y-3">
							<p>Seuraavat pelaajat ovat tasapisteissä:</p>
							<div class="flex flex-wrap gap-3">
								<span *ngFor="let player of tournamentService.tiebreakerPlayers"
								      class="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-xl font-medium shadow-lg">
									{{ player.name }}
								</span>
							</div>
						</div>
					</div>

					<div
						class="mb-6 p-6 bg-gradient-to-r from-amber-500/20 to-amber-600/20 rounded-xl border border-amber-400/30">
						<h4 class="font-semibold mb-4 text-amber-200 text-lg">📋 Säännöt:</h4>
						<ol class="text-sm text-amber-100 space-y-2 list-decimal ml-4">
							<li>Jokainen pelaaja heittää <strong>9 tikkaa</strong></li>
							<li>Pistemäärät lasketaan yhteen (0-60 per tikka)</li>
							<li>Korkein pistemäärä voittaa</li>
							<li>Jos edelleen tasan → uusi kierros</li>
						</ol>
					</div>

					<!-- Current Player Turn -->
					<div class="mb-8 p-6 glass-card rounded-xl text-center">
						<h4 class="text-2xl font-bold mb-4 text-emerald-300">{{ getCurrentPlayerName() }}:n vuoro</h4>
						<p class="text-slate-300 mb-4">Kierros {{ currentRound + 1 }}/{{ isSingleRoundMode() ? 1 : 3 }} - Tikka {{ currentDart + 1 }}/3</p>
						<div class="text-lg text-white mb-3">
							Nykyinen kierros: <span class="font-bold text-emerald-300">{{ getCurrentRoundScore() }}
							pistettä</span>
						</div>
						<div class="text-sm text-slate-300">
							Heitetyt tikat:
							<span *ngFor="let dart of currentRoundDarts; let i = index"
							      class="inline-block bg-slate-700 px-2 py-1 rounded ml-1 font-mono">
								{{ dart }}
							</span>
						</div>
					</div>

					<!-- Dart Board -->
					<div class="mb-8 p-6 glass-card rounded-xl">
						<h4 class="text-xl font-bold mb-6 text-white text-center">🎯 Heittotaulu</h4>

						<!-- Toggle buttons -->
						<div class="flex justify-center gap-4 mb-6">
							<button [class]="'dart-btn py-3 px-6 rounded-xl font-bold text-lg transition-all ' + (isActive(Multiplier.SINGLE) ? 'active bg-gradient-to-r from-green-500 to-green-600' : '')"
							        [style.border-color]="isActive(Multiplier.SINGLE) ? '#10b981' : ''"
							        (click)="setMultiplier(Multiplier.SINGLE)">SINGLE
							</button>
							<button [class]="'dart-btn py-3 px-6 rounded-xl font-bold text-lg transition-all ' + (isActive(Multiplier.DOUBLE) ? 'active bg-gradient-to-r from-red-500 to-red-600' : '')"
							        [style.border-color]="isActive(Multiplier.DOUBLE) ? '#ef4444' : ''"
							        (click)="setMultiplier(Multiplier.DOUBLE)">DOUBLE
							</button>
							<button [class]="'dart-btn py-3 px-6 rounded-xl font-bold text-lg transition-all ' + (isActive(Multiplier.TRIPLE) ? 'active bg-gradient-to-r from-amber-500 to-amber-600' : '')"
							        [style.border-color]="isActive(Multiplier.TRIPLE) ? '#f59e0b' : ''"
							        (click)="setMultiplier(Multiplier.TRIPLE)">TRIPLE
							</button>
						</div>

						<!-- Numbers 1-20 -->
						<div class="grid grid-cols-5 gap-3 mb-6">
							<button *ngFor="let num of numbers"
							        class="dart-btn single py-3 px-4 rounded-xl font-bold text-lg"
							        (click)="addNumber(num)">{{ num }}
							</button>
						</div>

						<!-- Special buttons -->
						<div class="grid grid-cols-3 gap-4">
							<button class="dart-btn special py-3 px-4 rounded-xl font-bold" (click)="addScore('S25')">
								25
							</button>
							<button class="dart-btn special py-3 px-4 rounded-xl font-bold" (click)="addScore('BULL')">
								BULL
							</button>
							<button
								class="dart-btn special py-3 px-4 rounded-xl bg-gradient-to-r from-red-500/30 to-red-600/30 font-bold"
								(click)="addScore('MISS')">MISS
							</button>
						</div>

						<!-- Undo Button -->
						<div class="flex justify-center mt-4">
							<button
								(click)="undoLastDart()"
								[disabled]="!canUndo()"
								class="modern-btn bg-gradient-to-r from-amber-500 to-amber-600 text-white py-2 px-4 rounded-xl font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed relative z-10">
								↶ Kumoa tikka
							</button>
						</div>
					</div>

					<!-- Player Scores -->
					<div class="grid gap-4 mb-8">
						<div *ngFor="let player of tournamentService.tiebreakerPlayers"
						     class="p-6 glass-card rounded-xl"
						     [class.current-player]="isCurrentPlayer(player.id)">
							<h5 class="font-semibold mb-4 text-white text-lg">🎯 {{ player.name }}</h5>

							<div class="grid grid-cols-3 gap-3 mb-4">
								<div class="round-display rounded-xl">
									{{ getPlayerRoundScore(player.id, 0) || '—' }}
								</div>
								<div class="round-display rounded-xl">
									{{ getPlayerRoundScore(player.id, 1) || '—' }}
								</div>
								<div class="round-display rounded-xl">
									{{ getPlayerRoundScore(player.id, 2) || '—' }}
								</div>
							</div>

							<div *ngIf="getPlayerThrownDarts(player.id).length > 0" class="mb-4">
								<div class="text-sm text-slate-300 mb-2">Heidetyt tikka kierroksittain:</div>
								<div class="space-y-2">
									<div *ngFor="let round of (isSingleRoundMode() ? [0] : [0, 1, 2]); let roundIndex = index" class="flex items-center gap-2">
										<span class="text-xs text-slate-400 w-16">{{ (roundIndex * 3 + 1) }}-{{ (roundIndex + 1) * 3 }}:</span>
										<div class="flex flex-wrap gap-1">
											<span *ngFor="let dart of getPlayerDartsByRound(player.id, round)"
											      class="inline-block bg-slate-700 px-2 py-1 rounded text-xs font-mono text-white">
												{{dart}}
											</span>
											<span *ngIf="getPlayerDartsByRound(player.id, round).length === 0"
											      class="text-xs text-slate-500">—</span>
										</div>
									</div>
								</div>
							</div>

							<div
								class="text-xl font-bold text-center p-4 bg-gradient-to-r from-indigo-500/20 to-purple-600/20 rounded-xl border border-indigo-400/30">
								<span class="text-indigo-200">Yhteensä: </span>
								<span class="text-white">{{ getTotalScore(player.id) }} pistettä</span>
							</div>
						</div>
					</div>

					<div class="mt-8 flex justify-center gap-4 flex-wrap">
						<button
							(click)="clearAllScores()"
							class="modern-btn bg-gradient-to-r from-slate-500 to-slate-600 text-white py-3 px-6 rounded-xl font-semibold shadow-lg relative z-10">
							🗑️ Tyhjennä kaikki
						</button>

						<button
							(click)="resolveTiebreaker()"
							[disabled]="!allScoresEntered()"
							class="modern-btn bg-gradient-to-r from-red-500 to-red-600 text-white py-3 px-8 rounded-xl font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed relative z-10">
							🏆 Ratkaise tasatilanne
						</button>
					</div>

					<div *ngIf="showResults"
					     class="mt-8 p-6 bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 rounded-xl border border-emerald-400/30">
						<h4 class="font-semibold mb-4 text-emerald-200 text-xl text-center">🏆 Tulokset:</h4>
						<div class="space-y-3">
							<div *ngFor="let result of results; let i = index"
							     class="flex justify-between items-center p-3 bg-white/10 rounded-xl backdrop-blur-5">
								<span class="font-medium text-white">{{ i + 1 }}. {{ result.playerName }}</span>
								<span class="font-bold text-emerald-200 text-lg">{{ result.total }} pistettä</span>
							</div>
						</div>

						<div *ngIf="stillTied"
						     class="mt-4 p-4 bg-gradient-to-r from-amber-500/20 to-amber-600/20 rounded-xl text-amber-200 text-center border border-amber-400/30">
							⚠️ Edelleen tasatilanteessa! Heittäkää uusi kierros.
						</div>
					</div>
				</div>
			</div>
		</div>
	`
})
export class TiebreakerComponent {
	// Player and round tracking
	currentPlayerIndex = 0;
	currentRound = 0; // 0, 1, 2 for rounds 1-3, 4-6, 7-9
	currentDart = 0; // 0, 1, 2 for darts within round
	currentRoundDarts: string[] = []; // Track current round's dart descriptions

	// Multiplier state
	currentMultiplier: Multiplier = Multiplier.SINGLE;
	Multiplier = Multiplier;
	numbers = [ 1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20 ];

	// Score storage: playerId -> [round1Score, round2Score, round3Score]
	playerRoundScores: Record<number, number[]> = {};
	dartHistory: { playerId: number; round: number; dart: number; score: number; description: string }[] = [];

	get showResults(): boolean {
		return this.tournamentService.tiebreakerUIState.showResults;
	}

	get results(): { playerName: string; total: number }[] {
		return this.tournamentService.tiebreakerUIState.results;
	}

	get stillTied(): boolean {
		return this.tournamentService.tiebreakerUIState.stillTied;
	}

	constructor(public tournamentService: TournamentService) {
		this.initializeScores();
	}

	private initializeScores(): void {
		this.tournamentService.tiebreakerPlayers.forEach(player => {
			this.playerRoundScores[player.id] = [ 0, 0, 0 ];
		});
	}

	getCurrentPlayerName(): string {
		return this.tournamentService.tiebreakerPlayers[this.currentPlayerIndex]?.name || '';
	}

	getCurrentPlayerId(): number {
		return this.tournamentService.tiebreakerPlayers[this.currentPlayerIndex]?.id || 0;
	}

	isCurrentPlayer(playerId: number): boolean {
		return playerId === this.getCurrentPlayerId();
	}

	getCurrentRoundScore(): number {
		return this.currentRoundDarts.reduce((sum, dart) => sum + this.calculateDartScore(dart), 0);
	}

	getPlayerRoundScore(playerId: number, round: number): number {
		return this.playerRoundScores[playerId]?.[round] || 0;
	}

	getTotalScore(playerId: number): number {
		return this.playerRoundScores[playerId]?.reduce((sum, score) => sum + score, 0) || 0;
	}

	getPlayerThrownDarts(playerId: number): string[] {
		return this.dartHistory
			.filter(dart => dart.playerId === playerId)
			.map(dart => dart.description);
	}

	getPlayerDartsByRound(playerId: number, round: number): string[] {
		return this.dartHistory
			.filter(dart => dart.playerId === playerId && dart.round === round)
			.map(dart => dart.description);
	}

	private calculateDartScore(dartDescription: string): number {
		if (dartDescription === 'MISS') return 0;
		if (dartDescription === 'BULL') return 50;
		if (dartDescription === 'S25') return 25;

		const match = dartDescription.match(/([SDT])(\d+)/);
		if (!match) return 0;

		const [ , type, number ] = match;
		const num = parseInt(number);

		switch (type) {
			case 'S': return num;
			case 'D': return num * 2;
			case 'T': return num * 3;
			default: return 0;
		}
	}

	setMultiplier(multiplier: Multiplier): void {
		this.currentMultiplier = multiplier;
	}

	addNumber(num: number): void {
		let dartDescription: string;
		switch (this.currentMultiplier) {
			case Multiplier.DOUBLE:
				dartDescription = `D${num}`;
				break;
			case Multiplier.TRIPLE:
				dartDescription = `T${num}`;
				break;
			default:
				dartDescription = `S${num}`;
				break;
		}
		this.addScore(dartDescription);
	}

	isActive(multiplier: Multiplier): boolean {
		return this.currentMultiplier === multiplier;
	}

	addScore(dartDescription: string): void {
		if (this.currentDart >= 3) return;
		this.currentMultiplier = Multiplier.SINGLE;

		const score = this.calculateDartScore(dartDescription);
		this.currentRoundDarts.push(dartDescription);

		// Add to history
		this.dartHistory.push({
			playerId: this.getCurrentPlayerId(),
			round: this.currentRound,
			dart: this.currentDart,
			score: score,
			description: dartDescription
		});

		this.currentDart++;

		// Check if round is complete
		if (this.currentDart >= 3) {
			// Calculate round total
			const roundTotal = this.getCurrentRoundScore();
			this.playerRoundScores[this.getCurrentPlayerId()][this.currentRound] = roundTotal;

			// Move to next player or round
			this.nextTurn();

			// Check if all players finished all rounds - auto resolve
			if (this.allScoresEntered()) {
				setTimeout(() => this.resolveTiebreaker(), 500);
			}
		}
	}

	private nextTurn(): void {
		this.currentRoundDarts = [];
		this.currentDart = 0;
		this.currentPlayerIndex++;

		// Check if all players finished current round
		if (this.currentPlayerIndex >= this.tournamentService.tiebreakerPlayers.length) {
			this.currentPlayerIndex = 0;
			this.currentRound++;

			// Check if all rounds complete
			const totalRounds = this.isSingleRoundMode() ? 1 : 3;
			if (this.currentRound >= totalRounds) {
				// All done, can resolve
				return;
			}
		}
	}

	undoLastDart(): void {
		if (this.dartHistory.length === 0) return;

		const lastDart = this.dartHistory.pop()!;

		// Restore state
		this.currentPlayerIndex = this.tournamentService.tiebreakerPlayers.findIndex(p => p.id === lastDart.playerId);
		this.currentRound = lastDart.round;
		this.currentDart = lastDart.dart;

		// Rebuild current round darts
		this.currentRoundDarts = this.dartHistory
			.filter(d => d.playerId === lastDart.playerId && d.round === lastDart.round)
			.map(d => d.description);

		// Recalculate round score
		const roundScore = this.currentRoundDarts.reduce((sum, dart) => sum + this.calculateDartScore(dart), 0);
		this.playerRoundScores[lastDart.playerId][lastDart.round] = roundScore;
	}

	canUndo(): boolean {
		return this.dartHistory.length > 0;
	}

	allScoresEntered(): boolean {
		// Check if all players finished current format
		const totalRounds = this.isSingleRoundMode() ? 1 : 3;
		return this.currentRound >= totalRounds;
	}

	isSingleRoundMode(): boolean {
		// Check if we're in single round mode (only one round per player)
		return this.tournamentService.tiebreakerPlayers.every(player =>
			this.playerRoundScores[player.id]?.length === 1
		);
	}

	clearAllScores(): void {
		this.currentPlayerIndex = 0;
		this.currentRound = 0;
		this.currentDart = 0;
		this.currentRoundDarts = [];
		this.dartHistory = [];
		this.currentMultiplier = Multiplier.SINGLE;

		this.tournamentService.tiebreakerPlayers.forEach(player => {
			this.playerRoundScores[player.id] = [ 0, 0, 0 ];
		});

		this.tournamentService.updateTiebreakerUIState({
			showResults: false,
			results: [],
			stillTied: false
		});
	}

	resolveTiebreaker(): void {
		// Add scores to tournament service
		this.tournamentService.tiebreakerPlayers.forEach(player => {
			const total = this.getTotalScore(player.id);
			this.tournamentService.addTiebreakerScore(player.id, total);
		});

		// Get results
		const results = this.tournamentService.getTiebreakerTotals();

		// Check if still tied
		const stillTied = results.length >= 2 && results[0].total === results[1].total;

		// Update UI state
		this.tournamentService.updateTiebreakerUIState({
			showResults: true,
			results: results,
			stillTied: stillTied
		});

		if (stillTied) {
			// Start single round tiebreaker
			setTimeout(() => {
				this.startSingleRoundTiebreaker();
			}, 3000);
		} else {
			// Tie resolved, complete tournament immediately
			this.tournamentService.resolveTiebreaker();
		}
	}

	startSingleRoundTiebreaker(): void {
		// Reset to single round format
		this.currentPlayerIndex = 0;
		this.currentRound = 0;
		this.currentDart = 0;
		this.currentRoundDarts = [];
		this.dartHistory = [];
		this.currentMultiplier = Multiplier.SINGLE;

		// Initialize scores for single round only
		this.tournamentService.tiebreakerPlayers.forEach(player => {
			this.playerRoundScores[player.id] = [ 0 ];
		});

		// Update UI state
		this.tournamentService.updateTiebreakerUIState({
			showResults: false,
			results: [],
			stillTied: false
		});
	}
}
