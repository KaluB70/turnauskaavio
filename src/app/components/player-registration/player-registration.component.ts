import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TournamentService, GameMode } from '../../services/tournament.service';

@Component({
	selector: 'player-registration',
	standalone: true,
	imports: [ CommonModule, FormsModule ],
	styles: [ `
		.input-field {
			transition: all 0.2s ease;
			border: 2px solid transparent;
			background: rgba(255, 255, 255, 0.1);
			backdrop-filter: blur(10px);
			color: white;
		}
		.input-field:focus {
			border-color: #6366f1;
			box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
			background: rgba(255, 255, 255, 0.15);
		}
		.input-field::placeholder {
			color: rgba(255, 255, 255, 0.6);
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
		.modern-btn:hover::before {
			width: 300px;
			height: 300px;
		}
		.modern-btn:hover:not(:disabled) {
			transform: translateY(-1px);
			box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
		}
		.player-chip {
			background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
			transition: all 0.2s ease;
			backdrop-filter: blur(10px);
			border: 1px solid rgba(255, 255, 255, 0.2);
		}
		.player-chip:hover {
			transform: scale(1.05);
			box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
		}
		.player-list-item {
			background: rgba(255, 255, 255, 0.1);
			backdrop-filter: blur(10px);
			border: 1px solid rgba(255, 255, 255, 0.2);
			transition: all 0.2s ease;
		}
		.player-list-item:hover {
			background: rgba(255, 255, 255, 0.15);
		}
		.suggestions-dropdown {
			background: rgba(255, 255, 255, 0.95);
			backdrop-filter: blur(20px);
			border: 1px solid rgba(255, 255, 255, 0.3);
		}
		.glass-card {
			background: rgba(255, 255, 255, 0.1);
			backdrop-filter: blur(20px);
			border: 1px solid rgba(255, 255, 255, 0.2);
			box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
		}
		.selection-btn {
			transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
			position: relative;
			overflow: hidden;
		}
		.selection-btn::before {
			content: '';
			position: absolute;
			top: 50%;
			left: 50%;
			width: 0;
			height: 0;
			background: rgba(255, 255, 255, 0.2);
			border-radius: 50%;
			transition: all 0.2s ease;
			transform: translate(-50%, -50%);
		}
		.selection-btn:hover::before {
			width: 100px;
			height: 100px;
		}
	` ],
	template: `
		<div *ngIf="!tournamentService.showRoulette" class="relative z-10">
			<div class="text-center mb-8">
				<h2 class="text-3xl font-bold text-white mb-4">🎯 Viikkokisat - Viikko {{ weekNumber }}</h2>
				<div class="w-20 h-1 bg-gradient-to-r from-indigo-400 to-purple-500 mx-auto rounded-full"></div>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-8">
				<div>
					<div class="mb-6">
						<label for="weekNumber" class="block mb-3 font-semibold text-white text-lg">Viikko</label>
						<input
							type="number"
							id="weekNumber"
							class="input-field w-full p-4 rounded-xl focus:outline-none text-lg"
							[(ngModel)]="weekNumber"
							[min]="getNextWeek()"
							max="10">
					</div>

					<div class="mb-6">
						<label for="playerName" class="block mb-3 font-semibold text-white text-lg">Lisää Pelaaja</label>
						<div class="flex">
							<input
								type="text"
								id="playerName"
								class="input-field flex-1 p-4 rounded-l-xl focus:outline-none text-lg"
								[(ngModel)]="currentPlayerName"
								(keyup)="onKeyUp($event)"
								(keyup.enter)="addPlayer()"
								#playerInput
								placeholder="Nimi...">
							<button
								(click)="addPlayer()"
								class="modern-btn bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-4 px-6 rounded-r-xl font-semibold shadow-lg relative z-10">
								Lisää
							</button>
						</div>

						<div *ngIf="suggestions.length > 0 && currentPlayerName.trim()"
						     class="suggestions-dropdown rounded-xl mt-2 absolute z-20 w-64 shadow-xl">
							<div *ngFor="let suggestion of suggestions"
							     (click)="selectSuggestion(suggestion)"
							     class="p-3 hover:bg-white/10 cursor-pointer border-b border-white/10 last:border-0 text-slate-800 font-medium">
								{{ suggestion }}
							</div>
						</div>
					</div>

					<div *ngIf="getAvailableRecentPlayers().length > 0" class="mb-6">
						<label class="block mb-3 font-semibold text-white text-lg">Viimeisimmät Pelaajat:</label>
						<div class="flex flex-wrap gap-3">
							<span *ngFor="let player of getAvailableRecentPlayers()"
							      class="player-chip text-white px-4 py-2 rounded-xl text-sm cursor-pointer font-medium shadow-lg"
							      (click)="selectRecentPlayer(player)">
								{{ player }}
							</span>
						</div>
					</div>

					<div *ngIf="players.length > 0" class="mb-6">
						<label class="block mb-3 font-semibold text-white text-lg">Illan Pelaajat ({{ players.length }}):</label>
						<div class="glass-card rounded-xl backdrop-filter backdrop-blur-10 overflow-hidden">
							<div *ngFor="let player of players; let i = index"
							     class="player-list-item flex justify-between items-center px-4 py-3 border-b border-white/10 last:border-b-0">
								<span class="text-white font-medium">{{ player }}</span>
								<button
									(click)="removePlayer(i)"
									class="text-red-200 hover:text-red-300 text-sm font-medium transition-colors">
									🗑️ Poista
								</button>
							</div>
						</div>
					</div>
				</div>

				<div>
					<div *ngIf="players.length >= 3" class="mb-4 p-4 glass-card rounded-xl">
						<h3 class="font-semibold mb-2 text-white">🏆 Turnausmuoto:</h3>
						<div class="text-sm">
							<div class="font-medium mb-1 text-indigo-200">
								{{ getTournamentFormatTitle() }}
								({{ players.length }} pelaajaa)
							</div>
							<ul class="text-xs text-slate-300 space-y-1">
								<li *ngIf="players.length === 3">• Kaikki kaikkia vastaan (finaali)</li>
								<li *ngIf="players.length > 3 && players.length <= 5">• Kaikki kaikkia vastaan → 3 parasta finaaliin</li>
								<li *ngIf="players.length >= 6 && players.length <= 8">• 2 lohkoa → lohkovoittajat + karsinta → 3-way finaali</li>
								<li *ngIf="players.length >= 9">• 3 lohkoa → lohkovoittajat → 3-way finaali</li>
							</ul>
						</div>
					</div>

					<div class="mb-4">
						<label class="block mb-2 font-medium text-white">🎮 Pelimuoto</label>
						<div class="grid grid-cols-2 gap-3">
							<button
								*ngFor="let mode of gameModes"
								[class]="getSelectionButtonClass(mode === selectedGameMode)"
								(click)="selectedGameMode = mode">
								{{ mode }}
							</button>
						</div>
					</div>

					<div class="mb-4">
						<label class="block mb-2 font-medium text-white">🎯 BO{{ selectedBestOf }}</label>
						<div class="grid grid-cols-3 gap-2">
							<button
								*ngFor="let option of bestOfOptions"
								[class]="getSelectionButtonClass(option === selectedBestOf)"
								(click)="selectedBestOf = option">
								{{ option }}
							</button>
						</div>
					</div>

					<div *ngIf="players.length >= 3" class="mb-4 p-4 glass-card rounded-xl text-sm">
						<div class="font-medium mb-2 text-white">💰 Illan palkinnot:</div>
						<div class="text-xs text-emerald-200 space-y-1">
							<div class="font-medium">Viikkopotti: {{ players.length * 2.5 }}€ (voittajalle)</div>
							<div>Rankingpisteet: 1. sija: +5p, 2. sija: +3p, 3. sija: +1p</div>
						</div>
					</div>
				</div>
			</div>

			<div class="mt-6 flex space-x-3">
				<button
					(click)="startTournament()"
					class="modern-btn bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 px-8 rounded-xl font-semibold shadow-lg relative z-10 disabled:opacity-50 disabled:cursor-not-allowed"
					[disabled]="players.length < 3">
					🎯 Aloita Viikkokisat
				</button>

				<button
					(click)="clearPlayers()"
					class="modern-btn bg-gradient-to-r from-slate-400 to-slate-500 text-white py-3 px-8 rounded-xl font-semibold shadow-lg relative z-10 disabled:opacity-50 disabled:cursor-not-allowed"
					[disabled]="players.length === 0">
					🗑️ Tyhjennä
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

	gameModes: GameMode[] = [ '301', '501' ];
	selectedGameMode: GameMode = '301';
	bestOfOptions = [ 1, 3, 5 ];
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
		this.recentPlayers = this.tournamentService.getRecentPlayers();
	}

	private saveRecentPlayer(name: string): void {
		this.tournamentService.addRecentPlayer(name);
		this.loadRecentPlayers(); // Refresh the local list
	}

	getNextWeek(): number {
		const completedWeeks = new Set(this.tournamentService.weekResults.map(r => r.weekNumber));
		return completedWeeks.size + 1;
	}

	onKeyUp(event: KeyboardEvent): void {
		if ([ 'ArrowUp', 'ArrowDown', 'Escape' ].includes(event.key)) return;

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

	getSelectionButtonClass(active: boolean): string {
		const base = 'selection-btn py-3 px-4 rounded-xl text-center font-semibold transition-all relative z-10';
		return active ?
			`${base} bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg` :
			`${base} bg-gradient-to-r from-slate-600 to-slate-700 text-white hover:from-slate-500 hover:to-slate-600`;
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
			void this.router.navigate([ '/tournament', tournamentId ]);
		} catch (error) {
			this.errorMessage = (error as Error).message;
		}
	}
}
