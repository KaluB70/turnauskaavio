// src/app/components/victory-animation/victory-animation.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { TournamentService } from '../../services/tournament.service';

@Component({
  selector: 'victory-animation',
  standalone: true,
  imports: [CommonModule],
  animations: [
    trigger('fadeInScale', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.3)' }),
        animate('1s cubic-bezier(0.175, 0.885, 0.32, 1.275)', style({ opacity: 1, transform: 'scale(1)' })),
      ]),
    ]),
    trigger('slideUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(50px)' }),
        animate('0.8s 0.5s ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
    trigger('float', [
      state('floating', style({ transform: 'translateY(-10px)' })),
      transition('* => floating', animate('2s ease-in-out')),
      transition('floating => *', animate('2s ease-in-out')),
    ]),
  ],
  styles: [`
    .victory-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }

    .victory-content {
      text-align: center;
      color: white;
      max-width: 90vw;
      position: relative;
    }

    .trophy-container {
      position: relative;
      margin-bottom: 2rem;
    }

    .main-trophy {
      font-size: 8rem;
      filter: drop-shadow(0 10px 20px rgba(0,0,0,0.3));
      animation: pulse-glow 3s ease-in-out infinite;
    }

    .floating-emojis {
      position: absolute;
      font-size: 2rem;
      animation: float-around 4s ease-in-out infinite;
    }

    .emoji-1 { top: -20px; left: -60px; animation-delay: 0s; }
    .emoji-2 { top: -40px; right: -60px; animation-delay: 1s; }
    .emoji-3 { bottom: -20px; left: -40px; animation-delay: 2s; }
    .emoji-4 { bottom: -40px; right: -40px; animation-delay: 1.5s; }

    @keyframes pulse-glow {
      0%, 100% {
        transform: scale(1);
        filter: drop-shadow(0 10px 20px rgba(0,0,0,0.3)) brightness(1);
      }
      50% {
        transform: scale(1.05);
        filter: drop-shadow(0 15px 30px rgba(0,0,0,0.4)) brightness(1.1);
      }
    }

    @keyframes float-around {
      0%, 100% {
        transform: translateY(0px) rotate(0deg);
      }
      25% {
        transform: translateY(-15px) rotate(5deg);
      }
      50% {
        transform: translateY(-5px) rotate(-5deg);
      }
      75% {
        transform: translateY(-20px) rotate(3deg);
      }
    }

    .winner-name {
      background: linear-gradient(45deg, #fbbf24, #f59e0b);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
    }

    .sparkle {
      position: absolute;
      color: #fbbf24;
      animation: sparkle 2s ease-in-out infinite;
    }

    @keyframes sparkle {
      0%, 100% { opacity: 0; transform: scale(0) rotate(0deg); }
      50% { opacity: 1; transform: scale(1) rotate(180deg); }
    }

    .celebration-text {
      text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
    }

    .action-buttons {
      margin-top: 3rem;
      display: flex;
      gap: 1rem;
      justify-content: center;
      flex-wrap: wrap;
    }

    .action-button {
      background: rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(10px);
      border: 2px solid rgba(255, 255, 255, 0.3);
      color: white;
      padding: 1rem 2rem;
      border-radius: 50px;
      font-weight: 600;
      transition: all 0.3s ease;
      cursor: pointer;
    }

    .action-button:hover {
      background: rgba(255, 255, 255, 0.3);
      border-color: rgba(255, 255, 255, 0.5);
      transform: translateY(-2px);
    }

    .primary-button {
      background: linear-gradient(135deg, #10b981, #059669);
      border-color: #047857;
    }

    .primary-button:hover {
      background: linear-gradient(135deg, #059669, #047857);
    }
  `],
  template: `
    <div class="victory-overlay">
      <!-- Sparkle effects -->
      <div class="sparkle" style="top: 20%; left: 15%; animation-delay: 0s;">✨</div>
      <div class="sparkle" style="top: 30%; right: 20%; animation-delay: 0.5s;">⭐</div>
      <div class="sparkle" style="bottom: 30%; left: 10%; animation-delay: 1s;">💫</div>
      <div class="sparkle" style="bottom: 20%; right: 15%; animation-delay: 1.5s;">✨</div>
      <div class="sparkle" style="top: 50%; left: 5%; animation-delay: 2s;">⭐</div>
      <div class="sparkle" style="top: 40%; right: 8%; animation-delay: 2.5s;">💫</div>

      <div class="victory-content">
        <div class="trophy-container" @fadeInScale>
          <div class="main-trophy">🏆</div>
          <div class="floating-emojis emoji-1">🎯</div>
          <div class="floating-emojis emoji-2">🎉</div>
          <div class="floating-emojis emoji-3">🥇</div>
          <div class="floating-emojis emoji-4">🎊</div>
        </div>

        <div @slideUp>
          <h1 class="text-4xl md:text-6xl font-bold mb-4 celebration-text">
            VOITTAJA!
          </h1>

          <div class="winner-name text-5xl md:text-7xl font-bold mb-8">
            {{ getWinnerName() }}
          </div>

          <p class="text-xl md:text-2xl mb-4 celebration-text">
            Onnittelut mestaruudesta! 🎉
          </p>

          <div class="text-lg celebration-text">
            {{ getTournamentStats() }}
          </div>

          <div class="action-buttons">
            <button
              class="action-button primary-button"
              (click)="startNewTournament()">
              🏠 Etusivu
            </button>

            <button
              class="action-button"
              (click)="restartWithSamePlayers()">
              🔄 Uusi turnaus samoilla pelaajilla
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class VictoryAnimationComponent implements OnInit, OnDestroy {
  private floatingState = 'floating';
  private floatingTimer: any;

  constructor(public tournamentService: TournamentService) {}

  ngOnInit(): void {
    // Toggle floating animation every 2 seconds
    this.floatingTimer = setInterval(() => {
      this.floatingState = this.floatingState === 'floating' ? 'normal' : 'floating';
    }, 2000);

    // Auto-hide after 10 seconds
    setTimeout(() => {
      this.tournamentService.showVictoryAnimation = false;
    }, 10000);
  }

  ngOnDestroy(): void {
    if (this.floatingTimer) {
      clearInterval(this.floatingTimer);
    }
  }

  getWinnerName(): string {
    if (this.tournamentService.matches.length === 0) return 'Unknown';

    const finalMatch = this.tournamentService.matches[this.tournamentService.matches.length - 1];
    if (finalMatch && finalMatch.winner) {
      return this.tournamentService.getPlayerName(finalMatch.winner);
    }
    return 'Unknown';
  }

  getTournamentStats(): string {
    const playerCount = this.tournamentService.players.length;
    const gameMode = this.tournamentService.gameMode;
    const bestOf = this.tournamentService.bestOfLegs;

    return `${playerCount} pelaajan turnaus • ${gameMode} • BO${bestOf}`;
  }

  startNewTournament(): void {
    this.tournamentService.showVictoryAnimation = false;
    this.tournamentService.resetTournament();
  }

  restartWithSamePlayers(): void {
    const playerNames = this.tournamentService.players.map(p => p.name);
    const gameMode = this.tournamentService.gameMode;
    const bestOfLegs = this.tournamentService.bestOfLegs;

    this.tournamentService.showVictoryAnimation = false;
    this.tournamentService.resetTournament();
    this.tournamentService.registerPlayers(playerNames, gameMode, bestOfLegs);
  }
}
