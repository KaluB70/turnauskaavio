import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { PlayerRegistrationComponent } from '../player-registration/player-registration.component';
import { TournamentService } from '../../services/tournament.service';

@Component({
	selector: 'home',
	standalone: true,
	imports: [
		CommonModule,
		PlayerRegistrationComponent
	],
	styles: [ `
		.hero-bg {
			background: linear-gradient(135deg, #0f172a 0%, #1e293b 25%, #334155 75%, #475569 100%);
			min-height: 100vh;
			position: relative;
			overflow: hidden;
		}
		.hero-bg::before {
			content: '';
			position: absolute;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			background:
				radial-gradient(circle at 20% 20%, rgba(99, 102, 241, 0.15) 0%, transparent 50%),
				radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.15) 0%, transparent 50%),
				radial-gradient(circle at 40% 60%, rgba(59, 130, 246, 0.1) 0%, transparent 50%);
		}
		.hero-bg::after {
			content: '';
			position: absolute;
			top: -50%;
			left: -50%;
			width: 200%;
			height: 200%;
			background: radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px);
			background-size: 50px 50px;
			animation: float 30s linear infinite;
		}
		@keyframes float {
			0% { transform: translate(-25%, -25%) rotate(0deg); }
			100% { transform: translate(-25%, -25%) rotate(360deg); }
		}
		.glass-card {
			background: rgba(255, 255, 255, 0.1);
			backdrop-filter: blur(20px);
			border: 1px solid rgba(255, 255, 255, 0.2);
			box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
		}
		.hero-title {
			background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
			-webkit-background-clip: text;
			background-clip: text;
			-webkit-text-fill-color: transparent;
			text-shadow: 0 0 30px rgba(255,255,255,0.3);
			filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));
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
		.modern-btn:hover {
			transform: translateY(-2px);
			box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
		}
		.tournament-card {
			background: rgba(255, 255, 255, 0.1);
			backdrop-filter: blur(15px);
			border: 1px solid rgba(255, 255, 255, 0.2);
			transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
			position: relative;
			overflow: hidden;
		}
		.tournament-card::before {
			content: '';
			position: absolute;
			top: 0;
			left: 0;
			width: 4px;
			height: 100%;
			background: linear-gradient(45deg, #6366f1, #8b5cf6);
			transition: width 0.3s ease;
		}
		.tournament-card:hover {
			transform: translateY(-4px) scale(1.02);
			box-shadow: 0 12px 40px rgba(99, 102, 241, 0.3);
		}
		.tournament-card:hover::before {
			width: 6px;
		}
		.delete-btn {
			background: linear-gradient(135deg, #ef4444, #dc2626);
			transition: all 0.2s ease;
		}
		.delete-btn:hover {
			background: linear-gradient(135deg, #dc2626, #b91c1c);
			transform: scale(1.05) rotate(-2deg);
		}
	` ],
	template: `
		<div class="hero-bg">
			<div class="container mx-auto px-4 py-8 relative z-20">
				<!-- Hero Section -->
				<div class="text-center mb-12 pt-8">
					<div class="mb-6">
						<span class="text-6xl md:text-7xl mb-4 block">🎯</span>
						<h1 class="hero-title text-4xl md:text-6xl font-black mb-4 tracking-tight">Darts Viikkokisat</h1>
					</div>
					<p class="text-slate-300 text-lg md:text-xl font-medium mb-6">Viikon dartskisat – Osallistu ja voita!</p>
					<div class="w-24 h-1 bg-gradient-to-r from-indigo-400 to-purple-500 mx-auto rounded-full mb-8"></div>
				</div>

				<!-- Navigation -->
				<div class="flex justify-center mb-12 gap-4">
					<button
						(click)="viewStandings()"
						class="modern-btn glass-card text-white py-3 px-6 rounded-xl font-semibold relative z-10">
						📊 Katso tilastot
					</button>
					<button
						(click)="openSettings()"
						class="modern-btn glass-card text-white py-3 px-6 rounded-xl font-semibold relative z-10">
						⚙️ Asetukset
					</button>
				</div>

				<!-- Active Tournaments -->
				<div *ngIf="activeTournaments.length > 0" class="glass-card rounded-2xl p-8 mb-8 relative z-10">
					<h2 class="text-2xl font-semibold mb-6 text-white">🏃‍♂️ Käynnissä olevat turnaukset</h2>
					<div class="space-y-4">
						<div *ngFor="let tournament of activeTournaments"
						     class="tournament-card p-6 rounded-xl shadow-md relative z-10">
							<div class="flex justify-between items-start">
								<div class="flex-1">
									<div class="flex items-center gap-3 mb-3">
										<span class="bg-indigo-600/80 text-white px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm">{{ tournament.phase }}</span>
										<span class="text-xs text-slate-300 bg-black/20 px-2 py-1 rounded-full backdrop-blur-sm">{{ tournament.lastUpdated | date:'dd.MM HH:mm' }}</span>
									</div>
									<div class="text-slate-200 mb-2">
										<div class="font-semibold text-lg mb-1 text-white">{{ tournament.players.length }} pelaajaa</div>
										<div class="text-sm text-slate-300">{{ tournament.players.join(', ') }}</div>
									</div>
								</div>
								<div class="flex gap-3 ml-4">
									<button
										(click)="continueTournament(tournament.id)"
										class="modern-btn bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg">
										▶️ Jatka
									</button>
									<button
										(click)="confirmDelete(tournament.id)"
										class="delete-btn text-white px-3 py-2 rounded-lg text-sm font-medium">
										🗑️
									</button>
								</div>
							</div>
						</div>
					</div>
				</div>

				<!-- Registration Section -->
				<div class="glass-card rounded-2xl p-8 relative z-10">
					<player-registration></player-registration>
				</div>
			</div>
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
		this.router.navigate([ '/standings' ]);
	}

	openSettings(): void {
		this.router.navigate([ '/settings' ]);
	}

	continueTournament(tournamentId: string): void {
		this.router.navigate([ '/tournament', tournamentId ]);
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
