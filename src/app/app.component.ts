// app.component.ts
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BracketComponent } from './components/bracket/bracket.component';
import { CurrentMatchComponent } from './components/current-match/current-match.component';
import { MatchHistoryComponent } from './components/match-history/match-history.component';
import { PlayerRegistrationComponent } from './components/player-registration/player-registration.component';
import { TournamentWinnersComponent } from './components/tournament-winners/tournament-winners.component';
import { VictoryAnimationComponent } from './components/victory-animation/victory-animation.component';
import { TournamentService } from './services/tournament.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    BracketComponent,
    PlayerRegistrationComponent,
    CurrentMatchComponent,
    MatchHistoryComponent,
    VictoryAnimationComponent,
    TournamentWinnersComponent
  ],
  template: `
    <div class="container mx-auto px-4 py-8">
      <h1 class="text-3xl font-bold text-center mb-8">Darts turnauskaavio</h1>
      
      <div *ngIf="!tournamentService.isStarted" class="mb-8">
        <player-registration></player-registration>
        
        <div class="mt-8" *ngIf="tournamentService.tournamentWinners.length > 0">
          <tournament-winners></tournament-winners>
        </div>
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
      </div>
    </div>
  `
})
export class AppComponent {
  constructor(public tournamentService: TournamentService) {}
}