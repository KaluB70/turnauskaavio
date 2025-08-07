import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ActivatedRoute, Router} from '@angular/router';
import {TournamentService} from '../../services/tournament.service';
import {TournamentBracketComponent} from '../tournament-bracket/tournament-bracket.component';
import {CurrentMatchComponent} from '../current-match/current-match.component';
import {RouletteComponent} from "../roulette/roulette.component";
import {TiebreakerComponent} from '../tiebreaker/tiebreaker.component';
import {TournamentEndedComponent} from '../tournament-ended/tournament-ended.component';

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
	template: `
		<tournament-ended *ngIf="tournamentService.tournamentCompleted"></tournament-ended>
		<roulette *ngIf="tournamentService.showRoulette && !tournamentService.tournamentCompleted"></roulette>
		<div *ngIf="!tournamentService.showRoulette && !tournamentService.tournamentCompleted" class="container mx-auto px-4 py-8">
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

				<div *ngIf="tournamentService.currentMatch && !tournamentService.requiresTiebreaker" class="mb-8">
					<current-match></current-match>
				</div>

				<div class="mb-8">
					<tournament-bracket></tournament-bracket>
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
		void this.router.navigate(['/']);
	}
}
