import {Component} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {TournamentService} from '../../services/tournament.service';

@Component({
	selector: 'tiebreaker',
	standalone: true,
	imports: [CommonModule, FormsModule],
	template: `
		<div class="bg-red-50 p-6 rounded-lg border-2 border-red-200 mb-6">
			<h3 class="text-xl font-bold mb-4 text-red-700">🎯 TASATILANTEEN RATKAISU</h3>

			<div class="mb-4 p-4 bg-white rounded-lg border">
				<h4 class="font-semibold mb-2">Tilanne:</h4>
				<div class="text-sm text-gray-600 space-y-1">
					<p>Seuraavat pelaajat ovat tasapisteissä:</p>
					<div class="flex flex-wrap gap-2">
						<span *ngFor="let player of tournamentService.tiebreakerPlayers"
						      class="bg-red-100 text-red-700 px-2 py-1 rounded">
							{{ player.name }}
						</span>
					</div>
				</div>
			</div>

			<div class="mb-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
				<h4 class="font-semibold mb-2 text-yellow-700">📋 Säännöt:</h4>
				<ol class="text-sm text-gray-700 space-y-1 list-decimal ml-4">
					<li>Jokainen pelaaja heittää <strong>9 tikkaa</strong></li>
					<li>Pistemäärät lasketaan yhteen (0-60 per tikka)</li>
					<li>Korkein pistemäärä voittaa</li>
					<li>Jos edelleen tasan → uusi kierros</li>
				</ol>
			</div>

			<div class="grid gap-4">
				<div *ngFor="let player of tournamentService.tiebreakerPlayers"
				     class="p-4 bg-white rounded-lg border">
					<h5 class="font-semibold mb-2">{{ player.name }}</h5>

					<div class="grid grid-cols-3 gap-2 mb-3">
						<input *ngFor="let dart of [1,2,3]; trackBy: trackByIndex"
						       type="number"
						       class="border rounded px-2 py-1 text-center"
						       placeholder="0"
						       min="0"
						       max="60"
						       [(ngModel)]="dartScores[player.id][dart-1]"
						       (input)="updateTotal(player.id)">
					</div>

					<div class="grid grid-cols-3 gap-2 mb-3">
						<input *ngFor="let dart of [4,5,6]; trackBy: trackByIndex"
						       type="number"
						       class="border rounded px-2 py-1 text-center"
						       placeholder="0"
						       min="0"
						       max="60"
						       [(ngModel)]="dartScores[player.id][dart-1]"
						       (input)="updateTotal(player.id)">
					</div>

					<div class="grid grid-cols-3 gap-2 mb-3">
						<input *ngFor="let dart of [7,8,9]; trackBy: trackByIndex"
						       type="number"
						       class="border rounded px-2 py-1 text-center"
						       placeholder="0"
						       min="0"
						       max="60"
						       [(ngModel)]="dartScores[player.id][dart-1]"
						       (input)="updateTotal(player.id)">
					</div>

					<div class="text-lg font-bold text-center p-2 bg-blue-50 rounded">
						Yhteensä: {{ getTotalScore(player.id) }} pistettä
					</div>
				</div>
			</div>

			<div class="mt-6 flex justify-between items-center">
				<button
					(click)="clearAllScores()"
					class="bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600">
					Tyhjennä pisteet
				</button>

				<button
					(click)="resolveTiebreaker()"
					[disabled]="!allScoresEntered()"
					class="bg-red-600 text-white py-2 px-6 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed">
					Ratkaise tasatilanne
				</button>
			</div>

			<div *ngIf="showResults" class="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
				<h4 class="font-semibold mb-2 text-green-700">🏆 Tulokset:</h4>
				<div *ngFor="let result of results; let i = index"
				     class="flex justify-between items-center py-1">
					<span class="font-medium">{{ i + 1 }}. {{ result.playerName }}</span>
					<span class="font-bold">{{ result.total }} pistettä</span>
				</div>

				<div *ngIf="stillTied" class="mt-3 p-2 bg-yellow-100 rounded text-yellow-700 text-sm">
					⚠️ Edelleen tasatilanteessa! Heittäkää uusi kierros.
				</div>
			</div>
		</div>
	`
})
export class TiebreakerComponent {
	get dartScores(): { [playerId: number]: number[] } {
		return this.tournamentService.tiebreakerUIState.currentRoundScores;
	}
	
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

	trackByIndex(index: number): number {
		return index;
	}

	private initializeScores(): void {
		// Only initialize if not already initialized
		const needsInit = this.tournamentService.tiebreakerPlayers.some(player => 
			!this.tournamentService.tiebreakerUIState.currentRoundScores[player.id]
		);
		
		if (needsInit) {
			const newScores = { ...this.tournamentService.tiebreakerUIState.currentRoundScores };
			this.tournamentService.tiebreakerPlayers.forEach(player => {
				if (!newScores[player.id]) {
					newScores[player.id] = new Array(9).fill(0);
				}
			});
			this.tournamentService.updateTiebreakerUIState({ currentRoundScores: newScores });
		}
	}

	updateTotal(playerId: number): void {
		// Force number conversion and validation
		const validatedScores = this.dartScores[playerId].map(score => {
			const num = Number(score);
			return (num >= 0 && num <= 60) ? num : 0;
		});
		
		const newScores = { ...this.tournamentService.tiebreakerUIState.currentRoundScores };
		newScores[playerId] = validatedScores;
		this.tournamentService.updateTiebreakerUIState({ currentRoundScores: newScores });
	}

	getTotalScore(playerId: number): number {
		return this.dartScores[playerId]?.reduce((sum, score) => sum + (Number(score) || 0), 0) || 0;
	}

	allScoresEntered(): boolean {
		return this.tournamentService.tiebreakerPlayers.every(player => {
			const scores = this.dartScores[player.id];
			return scores && scores.every(score => {
				const num = Number(score);
				return num >= 0 && num <= 60 && score !== null && score != null;
			});
		});
	}

	clearAllScores(): void {
		const clearedScores: { [playerId: number]: number[] } = {};
		this.tournamentService.tiebreakerPlayers.forEach(player => {
			clearedScores[player.id] = new Array(9).fill(0);
		});
		
		this.tournamentService.updateTiebreakerUIState({
			currentRoundScores: clearedScores,
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
			// Clear scores for next round
			setTimeout(() => {
				this.clearAllScores();
			}, 5000);
		} else {
			// Tie resolved, complete tournament immediately
			this.tournamentService.resolveTiebreaker();
		}
	}
}
