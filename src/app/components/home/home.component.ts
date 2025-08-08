import {CommonModule} from '@angular/common';
import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';

import {PlayerRegistrationComponent} from '../player-registration/player-registration.component';
import {TournamentService} from '../../services/tournament.service';

@Component({
	selector: 'home',
	standalone: true,
	imports: [
		CommonModule,
		PlayerRegistrationComponent
	],
	styles: [`
		.tournament-card {
			transition: all 0.2s ease;
			border-left: 4px solid #3b82f6;
		}
		.tournament-card:hover {
			transform: translateY(-2px);
			box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		}
		.delete-btn {
			transition: all 0.2s ease;
		}
		.delete-btn:hover {
			background-color: #dc2626;
			transform: scale(1.1);
		}
	`],
	template: `
		<div class="container mx-auto px-4 py-8">
			<h1 class="text-3xl font-bold text-center mb-8">🎯 Darts Viikkokisat</h1>

			<div class="text-center mb-8 space-x-4">
				<button
					(click)="viewStandings()"
					class="bg-blue-100 text-blue-700 py-2 px-4 rounded-md hover:bg-blue-200 border border-blue-300">
					📊 Katso tilastot
				</button>
				<button
					(click)="openSettings()"
					class="bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 border border-gray-300">
					⚙️ Asetukset
				</button>
			</div>

			<div *ngIf="activeTournaments.length > 0" class="mb-8">
				<h2 class="text-xl font-semibold mb-4">🏃‍♂️ Käynnissä olevat turnaukset</h2>
				<div class="space-y-3">
					<div *ngFor="let tournament of activeTournaments" 
					     class="tournament-card bg-white p-4 rounded-lg shadow border">
						<div class="flex justify-between items-start">
							<div class="flex-1">
								<div class="flex items-center gap-2 mb-2">
									<span class="text-sm font-medium text-blue-600">{{ tournament.phase }}</span>
									<span class="text-xs text-gray-500">{{ tournament.lastUpdated | date:'dd.MM HH:mm' }}</span>
								</div>
								<div class="text-sm text-gray-700 mb-2">
									<strong>Pelaajat ({{ tournament.players.length }}):</strong>
									<span class="ml-1">{{ tournament.players.join(', ') }}</span>
								</div>
							</div>
							<div class="flex gap-2 ml-4">
								<button
									(click)="continueTournament(tournament.id)"
									class="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors">
									Jatka
								</button>
								<button
									(click)="confirmDelete(tournament.id)"
									class="delete-btn bg-red-500 text-white px-3 py-1 rounded text-sm">
									🗑️
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>

			<player-registration></player-registration>
		</div>
	`
})
export class HomeComponent implements OnInit {
	activeTournaments: {id: string, players: string[], phase: string, lastUpdated: Date}[] = [];

	constructor(
		public tournamentService: TournamentService,
		private router: Router
	) {}

	ngOnInit(): void {
		this.loadActiveTournaments();
		this.loadGoogleDriveData();
	}

	private async loadGoogleDriveData(): Promise<void> {
		const config = this.tournamentService.loadDriveConfig();
		if (config?.apiKey) {
			try {
				this.tournamentService.configureGoogleDrive(config.apiKey, config.fileId);
				await this.tournamentService.loadSeasonDataFromDrive();
			} catch (error) {
				console.log('Background Google Drive load failed:', error);
			}
		}
	}

	loadActiveTournaments(): void {
		this.activeTournaments = this.tournamentService.getActiveTournaments()
			.sort((a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime());
	}

	viewStandings(): void {
		this.router.navigate(['/standings']);
	}

	openSettings(): void {
		this.router.navigate(['/settings']);
	}

	continueTournament(tournamentId: string): void {
		this.router.navigate(['/tournament', tournamentId]);
	}

	confirmDelete(tournamentId: string): void {
		const tournament = this.activeTournaments.find(t => t.id === tournamentId);
		if (!tournament) return;

		const playerList = tournament.players.join(', ');
		const confirmMessage = `Haluatko varmasti poistaa turnauksen?\n\nPelaajat: ${playerList}\nVaihe: ${tournament.phase}`;
		
		if (confirm(confirmMessage)) {
			this.tournamentService.deleteTournament(tournamentId);
			this.loadActiveTournaments();
		}
	}
}
