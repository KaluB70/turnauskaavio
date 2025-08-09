import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TournamentService } from '../../services/tournament.service';
import { TournamentBracketComponent } from '../tournament-bracket/tournament-bracket.component';
import { CurrentMatchComponent } from '../current-match/current-match.component';
import { RouletteComponent } from "../roulette/roulette.component";
import { TiebreakerComponent } from '../tiebreaker/tiebreaker.component';
import { TournamentEndedComponent } from '../tournament-ended/tournament-ended.component';

@Component({
	selector: 'tournament-view',
	standalone: true,
	imports: [
		CommonModule,
		TournamentBracketComponent,
		CurrentMatchComponent,
		RouletteComponent,
		TiebreakerComponent,
		TournamentEndedComponent
	],
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
	` ],
	template: `
		<tournament-ended *ngIf="tournamentService.tournamentCompleted"></tournament-ended>
		<roulette *ngIf="tournamentService.showRoulette && !tournamentService.tournamentCompleted"></roulette>
		<div *ngIf="!tournamentService.showRoulette && !tournamentService.tournamentCompleted" class="w-full">
			<div *ngIf="!tournamentExists">
				<h1 class="text-3xl font-bold text-center mb-8">🎯 Turnausta ei löytynyt</h1>
				<div class="text-center">
					<button
						(click)="goHome()"
						class="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700">
						← Takaisin etusivulle
					</button>
				</div>
			</div>

			<div *ngIf="tournamentExists">
				<div *ngIf="tournamentService.requiresTiebreaker">
					<tiebreaker></tiebreaker>
				</div>

				<div *ngIf="tournamentService.currentMatch && !tournamentService.requiresTiebreaker">
					<current-match>
						<tournament-bracket></tournament-bracket>
					</current-match>
				</div>

				<div *ngIf="!tournamentService.currentMatch" class="match-bg min-h-screen relative">
					<div class="w-full px-4 py-8 relative z-20">
						<div class="glass-card rounded-2xl p-8 shadow-xl max-w-6xl mx-auto mb-8">
							<tournament-bracket></tournament-bracket>
						</div>
					</div>
				</div>

				<div *ngIf="!tournamentService.currentMatch && tournamentService.isStarted && !tournamentService.requiresTiebreaker" class="mt-8 text-center">
					<button
						(click)="goHome()"
						class="bg-gray-600 text-white py-2 px-6 rounded-md hover:bg-gray-700">
						← Takaisin päävalikkoon
					</button>
				</div>
			</div>
		</div>
	`
})
export class TournamentComponent implements OnInit {
	tournamentExists = false;

	constructor(
		public tournamentService: TournamentService,
		private route: ActivatedRoute,
		private router: Router
	) {}

	ngOnInit(): void {
		this.route.paramMap.subscribe(params => {
			const tournamentId = params.get('id');

			if (tournamentId) {
				this.tournamentExists = this.tournamentService.loadTournament(tournamentId);
			} else {
				this.tournamentExists = false;
			}
		});
	}

	goHome(): void {
		void this.router.navigate([ '/' ]);
	}
}
