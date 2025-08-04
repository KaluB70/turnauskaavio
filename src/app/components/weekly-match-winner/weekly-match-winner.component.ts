// src/app/components/weekly-match-winner/weekly-match-winner.component.ts
import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { WeeklyTournamentService } from '../../services/weekly-tournament.service';

@Component({
  selector: 'weekly-match-winner',
  standalone: true,
  imports: [CommonModule],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.8)' }),
        animate('0.5s ease-in', style({ opacity: 1, transform: 'scale(1)' })),
      ]),
      transition(':leave', [
        animate('0.5s ease-out', style({ opacity: 0, transform: 'scale(0.8)' })),
      ]),
    ]),
    trigger('confetti', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-50px) rotate(0deg)' }),
        animate('2s ease-out', style({ opacity: 1, transform: 'translateY(100px) rotate(360deg)' })),
        animate('1s ease-in', style({ opacity: 0 })),
      ]),
    ]),
  ],
  styles: [`
    .winner-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .winner-card {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      padding: 3rem;
      border-radius: 1rem;
      text-align: center;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      max-width: 90vw;
    }
    .confetti-piece {
      position: absolute;
      width: 10px;
      height: 10px;
      pointer-events: none;
    }
    .trophy-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
      animation: bounce 2s infinite;
    }
    @keyframes bounce {
      0%, 20%, 53%, 80%, 100% {
        transform: translate3d(0,0,0);
      }
      40%, 43% {
        transform: translate3d(0,-15px,0);
      }
      70% {
        transform: translate3d(0,-7px,0);
      }
      90% {
        transform: translate3d(0,-2px,0);
      }
    }
    .phase-badge {
      background: rgba(255, 255, 255, 0.2);
      padding: 0.5rem 1rem;
      border-radius: 50px;
      font-size: 0.875rem;
      margin-bottom: 1rem;
    }
  `],
  template: `
    <div class="winner-overlay" @fadeInOut>
      <!-- Confetti pieces -->
      <div *ngFor="let confetti of confettiPieces"
           class="confetti-piece"
           [style.left.px]="confetti.x"
           [style.top.px]="confetti.y"
           [style.background-color]="confetti.color"
           @confetti></div>

      <div class="winner-card" @fadeInOut>
        <div class="phase-badge">
          {{ getPhaseDescription() }}
        </div>

        <div class="trophy-icon">🏆</div>
        <h2 class="text-3xl font-bold mb-4">{{ getWinnerTitle() }}</h2>
        <div class="text-5xl font-bold mb-6">{{ winnerName }}</div>

        <div *ngIf="isPlayoffWin()" class="text-lg opacity-90 mb-4">
          Pääsy finaaliin varmistunut! 🎯
        </div>
        <div *ngIf="!isPlayoffWin()" class="text-lg opacity-90 mb-4">
          Hienoa peliä! 🎯
        </div>

        <div *ngIf="showNextPhaseInfo()" class="text-sm opacity-75 mb-6">
          {{ getNextPhaseInfo() }}
        </div>

        <div class="mt-8">
          <button
            (click)="continueToNext()"
            class="bg-white text-green-600 py-3 px-8 rounded-full text-xl font-bold hover:bg-gray-100 transition-colors">
            {{ getContinueButtonText() }}
          </button>
        </div>
      </div>
    </div>
  `
})
export class WeeklyMatchWinnerComponent implements OnInit, OnDestroy {
  @Input() winnerName: string = '';

  confettiPieces: { x: number; y: number; color: string }[] = [];
  private animationTimer: any;

  confettiColors = ['#fbbf24', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6', '#f59e0b'];

  constructor(private weeklyTournamentService: WeeklyTournamentService) {}

  ngOnInit(): void {
    this.createConfetti();

    // Auto-continue after 4 seconds
    this.animationTimer = setTimeout(() => {
      this.continueToNext();
    }, 4000);
  }

  ngOnDestroy(): void {
    if (this.animationTimer) {
      clearTimeout(this.animationTimer);
    }
  }

  createConfetti(): void {
    for (let i = 0; i < 30; i++) {
      this.confettiPieces.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight * 0.3,
        color: this.confettiColors[Math.floor(Math.random() * this.confettiColors.length)]
      });
    }
  }

  getPhaseDescription(): string {
    return this.weeklyTournamentService.getCurrentPhaseDescription();
  }

  getWinnerTitle(): string {
    if (this.isPlayoffWin()) {
      return 'Finaalipaikka!';
    } else if (this.weeklyTournamentService.currentPhase === 'final') {
      return 'Viikon voittaja!';
    } else {
      return 'Ottelun voittaja!';
    }
  }

  isPlayoffWin(): boolean {
    return this.weeklyTournamentService.currentPhase === 'playoff';
  }

  showNextPhaseInfo(): boolean {
    return this.weeklyTournamentService.currentPhase === 'group' ||
      this.weeklyTournamentService.currentPhase === 'playoff';
  }

  getNextPhaseInfo(): string {
    if (this.weeklyTournamentService.currentPhase === 'group') {
      if (this.weeklyTournamentService.tournamentType === 'round-robin') {
        return this.weeklyTournamentService.players.length === 3
          ? 'Turnaus päättynyt!'
          : 'Jatkuu finaaleihin...';
      }
      return 'Jatkuu karsintaan...';
    } else if (this.weeklyTournamentService.currentPhase === 'playoff') {
      return 'Jatkuu 3-way finaaliin!';
    }
    return '';
  }

  getContinueButtonText(): string {
    if (this.weeklyTournamentService.currentPhase === 'final') {
      return 'Katso tulokset';
    } else if (this.isPlayoffWin()) {
      return 'Jatka finaaliin';
    } else {
      return 'Jatka seuraavaan';
    }
  }

  continueToNext(): void {
    // Find the next match
    this.weeklyTournamentService.findNextMatch();
  }
}
