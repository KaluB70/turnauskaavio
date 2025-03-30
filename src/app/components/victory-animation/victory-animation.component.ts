// src/app/components/victory-animation/victory-animation.component.ts
import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TournamentService } from '../../services/tournament.service';

@Component({
  selector: 'victory-animation',
  standalone: true,
  imports: [CommonModule],
  styles: [`
    .firework {
      position: absolute;
      width: 5px;
      height: 5px;
      border-radius: 50%;
      animation: explode 1s ease-out forwards;
    }
    @keyframes explode {
      0% {
        transform: scale(1);
        opacity: 1;
      }
      100% {
        transform: scale(40);
        opacity: 0;
      }
    }
    .particle {
      position: absolute;
      width: 3px;
      height: 3px;
      border-radius: 50%;
      animation: shoot 1s ease-out forwards;
    }
    @keyframes shoot {
      0% {
        transform: translateY(0) translateX(0);
        opacity: 1;
      }
      100% {
        transform: translateY(calc(var(--dy) * 80px)) translateX(calc(var(--dx) * 80px));
        opacity: 0;
      }
    }
    .trophy {
      animation: bounce 2s infinite;
    }
    @keyframes bounce {
      0%, 100% {
        transform: translateY(0);
      }
      50% {
        transform: translateY(-20px);
      }
    }
    .confetti {
      position: absolute;
      width: 10px;
      height: 10px;
      animation: fall 4s linear forwards;
    }
    @keyframes fall {
      0% {
        transform: translateY(-100px) rotate(0deg);
        opacity: 1;
      }
      100% {
        transform: translateY(500px) rotate(360deg);
        opacity: 0;
      }
    }
    .champion-text {
      animation: glow 2s ease-in-out infinite;
    }
    @keyframes glow {
      0%, 100% {
        text-shadow: 0 0 10px rgba(255, 255, 255, 0.8);
      }
      50% {
        text-shadow: 0 0 20px rgba(255, 255, 255, 1), 0 0 30px rgba(255, 215, 0, 0.8);
      }
    }
  `],
  template: `
    <div class="bg-blue-900 text-white p-8 rounded-lg shadow-lg relative overflow-hidden" 
         style="min-height: 400px;">
      
      <div *ngFor="let firework of fireworks" 
           class="firework" 
           [style.left.px]="firework.x" 
           [style.top.px]="firework.y" 
           [style.background-color]="firework.color">
      </div>
      
      <div *ngFor="let particle of particles" 
           class="particle" 
           [style.left.px]="particle.x" 
           [style.top.px]="particle.y" 
           [style.background-color]="particle.color" 
           [style.--dx]="particle.dx" 
           [style.--dy]="particle.dy">
      </div>
      
      <div *ngFor="let confetti of confettis"
           class="confetti"
           [style.left.px]="confetti.x"
           [style.top.px]="confetti.y"
           [style.background-color]="confetti.color"
           [style.transform]="'rotate(' + confetti.rotation + 'deg)'">
      </div>
      
      <div class="text-center py-12 relative z-10">
        <div class="text-6xl font-bold mb-8 trophy">🏆</div>
        <h1 class="text-4xl font-bold mb-4 champion-text">KULTAMESTARI!</h1>
        <p class="text-2xl mb-6 bg-blue-800 inline-block px-4 py-2 rounded-full">{{ getWinnerName() }}</p>
        
        <div class="mt-6 text-xl">
          <p>Pelimuoto: <span class="font-bold">{{ tournamentService.gameMode }}</span></p>
          <p>Best of {{ tournamentService.bestOfLegs }}</p>
        </div>
        
        <div class="flex justify-center mt-8 space-x-4">          
          <button 
            (click)="startNewTournament()" 
            class="bg-blue-600 text-white py-3 px-8 rounded-full text-xl font-bold hover:bg-blue-700 transition-colors">
            Etusivu
          </button>
          
          <button 
            (click)="restartWithSamePlayers()" 
            class="bg-green-600 text-white py-3 px-8 rounded-full text-xl font-bold hover:bg-green-700 transition-colors">
            Aloita uudelleen
          </button>
        </div>
      </div>
    </div>
  `
})
export class VictoryAnimationComponent {
  fireworks: { x: number; y: number; color: string }[] = [];
  particles: { x: number; y: number; dx: number; dy: number; color: string }[] = [];
  confettis: { x: number; y: number; color: string; rotation: number }[] = [];
  animationInterval: any;
  confettiInterval: any;
  colors = ['#ff0000', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#ff00ff', '#ff8800', '#88ff00'];
  confettiColors = ['#FFC700', '#FF0000', '#2E3191', '#41BBC7', '#00FF00', '#FF00FF'];
  
  constructor(public tournamentService: TournamentService) {}
  
  ngOnInit() {
    this.startFireworks();
    this.startConfetti();
  }
  
  ngOnDestroy() {
    this.clearAnimations();
  }
  
  startFireworks() {
    this.clearAnimations();
    this.animationInterval = setInterval(() => {
      this.createFirework();
    }, 300);
  }
  
  startConfetti() {
    this.confettiInterval = setInterval(() => {
      this.createConfetti();
    }, 100);
  }
  
  clearAnimations() {
    if (this.animationInterval) {
      clearInterval(this.animationInterval);
    }
    if (this.confettiInterval) {
      clearInterval(this.confettiInterval);
    }
  }
  
  createFirework() {
    const color = this.colors[Math.floor(Math.random() * this.colors.length)];
    const x = 100 + Math.random() * 600;
    const y = 50 + Math.random() * 300;
    
    this.fireworks.push({ x, y, color });
    
    // Create particles
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dx = Math.cos(angle);
      const dy = Math.sin(angle);
      
      this.particles.push({
        x, y, dx, dy, color
      });
    }
    
    // Cleanup old fireworks and particles
    setTimeout(() => {
      this.fireworks.shift();
      for (let i = 0; i < 20; i++) {
        if (this.particles.length > 0) {
          this.particles.shift();
        }
      }
    }, 1000);
  }
  
  createConfetti() {
    const color = this.confettiColors[Math.floor(Math.random() * this.confettiColors.length)];
    const x = Math.random() * window.innerWidth;
    const y = -20;
    const rotation = Math.random() * 360;
    
    this.confettis.push({ x, y, color, rotation });
    
    // Cleanup old confetti
    if (this.confettis.length > 100) {
      this.confettis.shift();
    }
  }
  
  getWinnerName(): string {
    if (this.tournamentService.matches.length === 0) return '';
    
    const finalMatch = this.tournamentService.matches[this.tournamentService.matches.length - 1];
    if (finalMatch.winner) {
      return this.tournamentService.getPlayerName(finalMatch.winner);
    }
    return '';
  }
  
  startNewTournament() {
    this.tournamentService.resetTournament();
  }
  
  restartWithSamePlayers() {
    const playerNames = this.tournamentService.players.map(p => p.name);
    const gameMode = this.tournamentService.gameMode;
    const bestOfLegs = this.tournamentService.bestOfLegs;
    
    this.tournamentService.resetTournament();
    this.tournamentService.registerPlayers(playerNames, gameMode, bestOfLegs);
  }
}