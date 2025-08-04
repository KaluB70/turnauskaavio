// app.component.ts - Updated with weekly tournament support
import {CommonModule} from '@angular/common';
import {Component} from '@angular/core';
import {FormsModule} from '@angular/forms';

// Original tournament components
import {BracketComponent} from './components/bracket/bracket.component';
import {CurrentMatchComponent} from './components/current-match/current-match.component';
import {MatchHistoryComponent} from './components/match-history/match-history.component';
import {PlayerRegistrationComponent} from './components/player-registration/player-registration.component';
import {TournamentWinnersComponent} from './components/tournament-winners/tournament-winners.component';
import {VictoryAnimationComponent} from './components/victory-animation/victory-animation.component';
import {TournamentService} from './services/tournament.service';

// Weekly tournament components
import {
	WeeklyPlayerRegistrationComponent
} from './components/weekly-player-registration/weekly-player-registration.component';
import {WeeklyBracketComponent} from './components/weekly-bracket/weekly-bracket.component';
import {WeeklyCurrentMatchComponent} from './components/weekly-current-match/weekly-current-match.component';
import {WeeklyStandingsComponent} from './components/weekly-standings/weekly-standings.component';
import {WeeklyTournamentService} from './services/weekly-tournament.service';

@Component({
	selector: 'app-root',
	standalone: true,
	imports: [
		CommonModule,
		FormsModule,
		// Original tournament components
		BracketComponent,
		PlayerRegistrationComponent,
		CurrentMatchComponent,
		MatchHistoryComponent,
		VictoryAnimationComponent,
		TournamentWinnersComponent,
		// Weekly tournament components
		WeeklyPlayerRegistrationComponent,
		WeeklyBracketComponent,
		WeeklyCurrentMatchComponent,
		WeeklyStandingsComponent
	],
	template: `
		<div class="container mx-auto px-4 py-8">
			<!-- Tournament Type Selection -->
			<div *ngIf="!tournamentService.isStarted && !weeklyTournamentService.isStarted" class="mb-8">
				<h1 class="text-3xl font-bold text-center mb-8">🎯 Darts Turnaukset</h1>

				<div class="grid grid-cols-3 gap-6 mb-8">
					<div></div>
					<div
						class="bg-blue-50 p-6 rounded-lg border-2 border-blue-200 hover:border-blue-400 transition-colors cursor-pointer"
						(click)="selectTournamentType('weekly')">
						<h2 class="text-xl font-semibold mb-3 text-blue-800">🏆 Viikkokisat</h2>
						<!--<p class="text-sm text-gray-600 mb-4">Suomen tikkakilpailujen mukainen formaatti</p>-->
						<ul class="text-xs text-gray-600 space-y-1">
							<li>• 3-5 pelaajaa: Round Robin → 3 parasta finaaliin</li>
							<li>• 6+ pelaajaa: 2-n lohkoa → lohkovoittajat (+ karsinta finaaliin)</li>
							<li>• Oletuksena 301, suora aloitus, tuplalopetus</li>
							<li>• Pisteitä sijoituksista: 5-3-1</li>
							<li>• Viikkonumero 1-10</li>
						</ul>
						<div class="mt-4 space-y-2">
							<button class="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 w-full">
								Aloita Viikkokisat
							</button>
							<button *ngIf="weeklyTournamentService.weeklyResults.length > 0"
									(click)="selectTournamentType('standings'); $event.stopPropagation()"
									class="bg-blue-100 text-blue-700 py-2 px-4 rounded-md hover:bg-blue-200 w-full border border-blue-300">
								📊 Katso tilastot
							</button>
						</div>
					</div>

					<!--<div class="bg-gray-50 p-6 rounded-lg border-2 border-gray-200 hover:border-gray-400 transition-colors cursor-pointer"
						 (click)="selectTournamentType('elimination')">
					  <h2 class="text-xl font-semibold mb-3 text-gray-800">⚔️ Pudotusturnaus</h2>
					  <p class="text-sm text-gray-600 mb-4">Perinteinen eliminaatio turnaus</p>
					  <ul class="text-xs text-gray-600 space-y-1">
						<li>• Single elimination bracket</li>
						<li>• Satunnainen aloitusparit</li>
						<li>• Valittavissa pelimuoto ja pituus</li>
						<li>• Animoitu hakemisto</li>
						<li>• Vähintään 2 pelaajaa</li>
					  </ul>
					  <div class="mt-4">
						<button class="bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 w-full">
						  Aloita Pudotusturnaus
						</button>
					  </div>
					</div>-->
				</div>
			</div>

			<!-- Weekly Tournament Flow -->
			<div *ngIf="selectedTournamentType === 'weekly'">
				<div *ngIf="!weeklyTournamentService.isStarted">
					<weekly-player-registration></weekly-player-registration>
				</div>

				<div *ngIf="weeklyTournamentService.isStarted">
					<div class="mb-8" *ngIf="weeklyTournamentService.currentMatch">
						<weekly-current-match></weekly-current-match>
					</div>

					<div class="mb-8">
						<weekly-bracket></weekly-bracket>
					</div>

					<div class="mt-8 text-center" *ngIf="!weeklyTournamentService.currentMatch">
						<button
							(click)="resetToHome()"
							class="bg-gray-600 text-white py-2 px-6 rounded-md hover:bg-gray-700">
							← Takaisin päävalikkoon
						</button>
					</div>
				</div>
			</div>

			<!-- Original Elimination Tournament Flow -->
			<div *ngIf="selectedTournamentType === 'elimination'">
				<h1 class="text-3xl font-bold text-center mb-8">Pudotusturnaus</h1>

				<div *ngIf="!tournamentService.isStarted" class="mb-8">
					<player-registration></player-registration>
				</div>

				<div *ngIf="tournamentService.isStarted">
					<div class="mb-8" *ngIf="tournamentService.currentMatch && !tournamentService.showVictoryAnimation">
						<current-match></current-match>
					</div>

					<div *ngIf="tournamentService.showVictoryAnimation">
						<victory-animation></victory-animation>
					</div>

					<div class="mb-8">
						<bracket></bracket>
					</div>

					<div class="mt-12" *ngIf="tournamentService.matchHistory.length > 0">
						<match-history></match-history>
					</div>

					<div class="mt-8 text-center"
						 *ngIf="!tournamentService.currentMatch && !tournamentService.showVictoryAnimation">
						<button
							(click)="resetToHome()"
							class="bg-gray-600 text-white py-2 px-6 rounded-md hover:bg-gray-700">
							← Takaisin päävalikkoon
						</button>
					</div>
				</div>
			</div>

			<!-- Standings View -->
			<div *ngIf="!weeklyTournamentService.isStarted" class="mt-10">
				<div class="flex justify-between items-center mb-6">
					<h1 class="text-3xl font-bold">🏆 Viikkokisojen tilastot</h1>
					<button
						(click)="resetToHome()"
						class="bg-gray-600 text-white py-2 px-6 rounded-md hover:bg-gray-700">
						← Takaisin päävalikkoon
					</button>
				</div>
				<weekly-standings></weekly-standings>
			</div>
		</div>
	`
})
export class AppComponent {
	selectedTournamentType: 'weekly' | 'elimination' | 'standings' | null = 'weekly';

	constructor(
		public tournamentService: TournamentService,
		public weeklyTournamentService: WeeklyTournamentService
	) {
	}

	selectTournamentType(type: 'weekly' | 'elimination' | 'standings'): void {
		this.selectedTournamentType = type;
	}

	resetToHome(): void {
		this.selectedTournamentType = 'weekly';
		this.tournamentService.resetTournament();
		this.weeklyTournamentService.resetTournament();
	}

	getRecentWeeklyResults(): any[] {
		return this.weeklyTournamentService.weeklyResults
			.sort((a, b) => b.weekNumber - a.weekNumber)
			.slice(0, 6); // Show last 6 weeks
	}
}
