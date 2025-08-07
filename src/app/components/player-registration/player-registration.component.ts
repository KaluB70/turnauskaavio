import {Component, OnInit, ElementRef, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {Router} from '@angular/router';
import {TournamentService, GameMode} from '../../services/tournament.service';

const RECENT_PLAYERS_KEY = 'darts_recent_players';

@Component({
	selector: 'player-registration',
	standalone: true,
	imports: [CommonModule, FormsModule ],
	template: `
		<div *ngIf="!tournamentService.showRoulette" class="bg-gray-100 p-6 rounded-lg shadow">
			<h2 class="text-xl font-semibold mb-4">🎯 Viikkokisat - Viikko {{ weekNumber }}</h2>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
				<div>
					<div class="mb-4">
						<label for="weekNumber" class="block mb-2 font-medium">Viikko</label>
						<input
							type="number"
							id="weekNumber"
							class="w-full p-2 border border-gray-300 rounded-md"
							[(ngModel)]="weekNumber"
							[min]="getNextWeek()"
							max="10">
					</div>

					<div class="mb-4">
						<label for="playerName" class="block mb-2 font-medium">Lisää Pelaaja</label>
						<div class="flex">
							<input
								type="text"
								id="playerName"
								class="w-full p-2 border border-gray-300 rounded-l-md"
								[(ngModel)]="currentPlayerName"
								(keyup)="onKeyUp($event)"
								(keyup.enter)="addPlayer()"
								#playerInput
								placeholder="Nimi...">
							<button
								(click)="addPlayer()"
								class="bg-blue-600 text-white py-2 px-4 rounded-r-md hover:bg-blue-700">
								Lisää
							</button>
						</div>

						<div *ngIf="suggestions.length > 0 && currentPlayerName.trim()"
						     class="bg-white border border-gray-300 rounded-md mt-1 absolute z-10 w-64 shadow-lg">
							<div *ngFor="let suggestion of suggestions"
							     (click)="selectSuggestion(suggestion)"
							     class="p-2 hover:bg-gray-100 cursor-pointer border-b border-gray-200">
								{{ suggestion }}
							</div>
						</div>
					</div>

					<div *ngIf="getAvailableRecentPlayers().length > 0" class="mb-4">
						<label class="block mb-2 font-medium">Viimeisimmät Pelaajat:</label>
						<div class="flex flex-wrap gap-2">
							<span *ngFor="let player of getAvailableRecentPlayers()"
							      class="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm cursor-pointer hover:bg-blue-200"
							      (click)="selectRecentPlayer(player)">
								{{ player }}
							</span>
						</div>
					</div>

					<div *ngIf="players.length > 0" class="mb-4">
						<label class="block mb-2 font-medium">Illan Pelaajat ({{ players.length }}):</label>
						<div class="bg-white rounded-md border border-gray-300 overflow-hidden">
							<div *ngFor="let player of players; let i = index"
							     class="flex justify-between items-center px-4 py-2 border-b border-gray-200 last:border-b-0">
								<span>{{ player }}</span>
								<button
									(click)="removePlayer(i)"
									class="text-red-600 hover:text-red-800 text-sm">
									Poista
								</button>
							</div>
						</div>
					</div>
				</div>

				<div>
					<div *ngIf="players.length >= 3" class="mb-4 p-4 bg-blue-50 rounded-lg">
						<h3 class="font-semibold mb-2">Turnausmuoto:</h3>
						<div class="text-sm">
							<div class="font-medium mb-1">
								{{ getTournamentFormatTitle() }}
								({{ players.length }} pelaajaa)
							</div>
							<ul class="text-xs text-gray-600 space-y-1">
								<li *ngIf="players.length === 3">• Kaikki kaikkia vastaan (finaali)</li>
								<li *ngIf="players.length > 3 && players.length <= 5">• Kaikki kaikkia vastaan → 3 parasta finaaliin</li>
								<li *ngIf="players.length >= 6 && players.length <= 8">• 2 lohkoa → lohkovoittajat + karsinta → 3-way finaali</li>
								<li *ngIf="players.length >= 9">• 3 lohkoa → lohkovoittajat → 3-way finaali</li>
							</ul>
						</div>
					</div>

					<div class="mb-4">
						<label class="block mb-2 font-medium">Pelimuoto</label>
						<div class="grid grid-cols-2 gap-2">
							<button
								*ngFor="let mode of gameModes"
								[class]="getButtonClass(mode === selectedGameMode)"
								(click)="selectedGameMode = mode">
								{{ mode }}
							</button>
						</div>
					</div>

					<div class="mb-4">
						<label class="block mb-2 font-medium">Best of {{ selectedBestOf }}</label>
						<div class="grid grid-cols-3 gap-2">
							<button
								*ngFor="let option of bestOfOptions"
								[class]="getButtonClass(option === selectedBestOf)"
								(click)="selectedBestOf = option">
								{{ option }}
							</button>
						</div>
					</div>

					<div *ngIf="players.length >= 3" class="mb-4 p-3 bg-green-50 rounded-lg text-sm">
						<div class="font-medium mb-1">💰 Illan palkinnot:</div>
						<div class="text-xs text-gray-600">
							<div>Viikkopotti: {{ players.length * 2.5 }}€ (voittajalle)</div>
							<div class="mt-1">Rankingpisteet: 1. sija: +5p, 2. sija: +3p, 3. sija: +1p</div>
						</div>
					</div>
				</div>
			</div>

			<div class="mt-6 flex space-x-3">
				<button
					(click)="startTournament()"
					class="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700"
					[disabled]="players.length < 3">
					Aloita Viikkokisat
				</button>

				<button
					(click)="clearPlayers()"
					class="bg-gray-300 text-gray-800 py-2 px-6 rounded-md hover:bg-gray-400"
					[disabled]="players.length === 0">
					Tyhjennä
				</button>
			</div>

			<div *ngIf="errorMessage" class="mt-4 text-red-600">
				{{ errorMessage }}
			</div>
		</div>
	`
})
export class PlayerRegistrationComponent implements OnInit {
	currentPlayerName = '';
	players: string[] = [];
	errorMessage = '';
	weekNumber = 1;

	gameModes: GameMode[] = ['301', '501'];
	selectedGameMode: GameMode = '301';
	bestOfOptions = [1, 3, 5];
	selectedBestOf = 3;

	recentPlayers: string[] = [];
	suggestions: string[] = [];

	@ViewChild('playerInput') playerInput!: ElementRef;

	constructor(
		public tournamentService: TournamentService,
		private router: Router
	) {}

	ngOnInit(): void {
		this.loadRecentPlayers();
		this.weekNumber = this.getNextWeek();
	}

	private loadRecentPlayers(): void {
		try {
			const saved = localStorage.getItem(RECENT_PLAYERS_KEY);
			if (saved) {
				this.recentPlayers = JSON.parse(saved);
			}
		} catch (error) {
			this.recentPlayers = [];
		}
	}

	private saveRecentPlayer(name: string): void {
		if (!name.trim()) return;

		this.recentPlayers = this.recentPlayers.filter(p =>
			p.toLowerCase() !== name.toLowerCase()
		);
		this.recentPlayers.unshift(name.trim());

		if (this.recentPlayers.length > 15) {
			this.recentPlayers = this.recentPlayers.slice(0, 15);
		}

		try {
			localStorage.setItem(RECENT_PLAYERS_KEY, JSON.stringify(this.recentPlayers));
		} catch (error) {
			console.error('Failed to save recent players');
		}
	}

	getNextWeek(): number {
		const completedWeeks = new Set(this.tournamentService.weekResults.map(r => r.weekNumber));
		return completedWeeks.size + 1;
	}

	onKeyUp(event: KeyboardEvent): void {
		if (['ArrowUp', 'ArrowDown', 'Escape'].includes(event.key)) return;

		const search = this.currentPlayerName.toLowerCase().trim();
		this.suggestions = search ?
			this.recentPlayers.filter(name => name.toLowerCase().includes(search)).slice(0, 5) :
			[];
	}

	selectSuggestion(suggestion: string): void {
		this.currentPlayerName = suggestion;
		this.suggestions = [];
		this.addPlayer();
	}

	selectRecentPlayer(player: string): void {
		this.currentPlayerName = player;
		this.addPlayer();
	}

	addPlayer(): void {
		const name = this.currentPlayerName.trim();
		if (!name) return;

		if (this.players.some(p => p.toLowerCase() === name.toLowerCase())) {
			this.errorMessage = `Pelaaja "${name}" on jo lisätty.`;
			return;
		}

		this.players.push(name);
		this.saveRecentPlayer(name);
		this.currentPlayerName = '';
		this.errorMessage = '';
		this.suggestions = [];

		setTimeout(() => this.playerInput.nativeElement.focus(), 0);
	}

	removePlayer(index: number): void {
		this.players.splice(index, 1);
	}

	clearPlayers(): void {
		this.players = [];
	}

	getAvailableRecentPlayers(): string[] {
		return this.recentPlayers.filter(p =>
			!this.players.some(existing => existing.toLowerCase() === p.toLowerCase())
		);
	}

	getButtonClass(active: boolean): string {
		const base = 'py-2 px-3 rounded-md text-center';
		return active ?
			`${base} bg-blue-600 text-white` :
			`${base} bg-gray-200 text-gray-800 hover:bg-gray-300`;
	}

	getTournamentFormatTitle(): string {
		if (this.players.length <= 5) return '🔄 Round Robin';
		if (this.players.length <= 8) return '🏆 Lohkomuoto (2 lohkoa)';
		return '🏆 Lohkomuoto (3 lohkoa)';
	}

	startTournament(): void {
		try {
			this.errorMessage = '';

			if (this.players.length < 3) {
				this.errorMessage = 'Vähintään 3 pelaajaa tarvitaan.';
				return;
			}

			if (this.weekNumber < 1 || this.weekNumber > 10) {
				this.errorMessage = 'Viikko numeron täytyy olla 1-10 välillä.';
				return;
			}

			this.players.forEach(name => this.saveRecentPlayer(name));
			const tournamentId = this.tournamentService.register(this.players, this.selectedGameMode, this.selectedBestOf, this.weekNumber);
			void this.router.navigate(['/tournament', tournamentId]);
		} catch (error) {
			this.errorMessage = (error as Error).message;
		}
	}
}
