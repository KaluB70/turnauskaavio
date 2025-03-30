// src/app/components/match-winner-animation/match-winner-animation.component.ts
import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TournamentService } from '../../services/tournament.service';

@Component({
  selector: 'match-winner-animation',
  standalone: true,
  imports: [CommonModule],
  styles: [`
    .animation-container {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 10;
      overflow: hidden;
    }
    
    .mini-firework {
      position: absolute;
      width: 3px;
      height: 3px;
      border-radius: 50%;
      animation: mini-explode 0.8s ease-out forwards;
    }
    
    @keyframes mini-explode {
      0% {
        transform: scale(1);
        opacity: 1;
      }
      100% {
        transform: scale(20);
        opacity: 0;
      }
    }
    
    .mini-particle {
      position: absolute;
      width: 2px;
      height: 2px;
      border-radius: 50%;
      animation: mini-shoot 0.8s ease-out forwards;
    }
    
    @keyframes mini-shoot {
      0% {
        transform: translateY(0) translateX(0);
        opacity: 1;
      }
      100% {
        transform: translateY(calc(var(--dy) * 40px)) translateX(calc(var(--dx) * 40px));
        opacity: 0;
      }
    }
    
    .winner-text {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 1.5rem;
      font-weight: bold;
      color: white;
      text-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
      padding: 0.5rem 1rem;
      border-radius: 9999px;
      background-color: rgba(37, 99, 235, 0.8);
      animation: fade-in-out 5s forwards;
    }
    
    @keyframes fade-in-out {
      0% {
        opacity: 0;
        transform: translate(-50%, -50%) scale(0.8);
      }
      10% {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1);
      }
      80% {
        opacity: 1;
      }
      100% {
        opacity: 0;
      }
    }
  `],
  template: `
    <div *ngIf="isVisible" class="animation-container">
      <div class="winner-text">
        {{ winnerName }} voittaa!
      </div>
      
      <div *ngFor="let firework of fireworks" 
           class="mini-firework" 
           [style.left.px]="firework.x" 
           [style.top.px]="firework.y" 
           [style.background-color]="firework.color">
      </div>
      
      <div *ngFor="let particle of particles" 
           class="mini-particle" 
           [style.left.px]="particle.x" 
           [style.top.px]="particle.y" 
           [style.background-color]="particle.color" 
           [style.--dx]="particle.dx" 
           [style.--dy]="particle.dy">
      </div>
    </div>
  `
})
export class MatchWinnerAnimationComponent implements OnInit, OnDestroy {
  @Input() winnerName: string = '';
  
  isVisible: boolean = false;
  fireworks: { x: number; y: number; color: string }[] = [];
  particles: { x: number; y: number; dx: number; dy: number; color: string }[] = [];
  animationInterval: any;
  hideTimeout: any;
  
  colors = ['#4299e1', '#38b2ac', '#48bb78', '#ecc94b', '#ed8936', '#ed64a6'];
  
  constructor(private tournamentService: TournamentService) {}
  
  ngOnInit(): void {
    this.showAnimation();
  }
  
  ngOnDestroy(): void {
    this.clearTimers();
  }
  
  showAnimation(): void {
    this.isVisible = true;
    this.startFireworks();
    
    // Hide animation after 5 seconds and continue tournament
    this.hideTimeout = setTimeout(() => {
      this.isVisible = false;
      this.clearTimers();
      this.tournamentService.findNextMatch();
      // Emit event to parent component that animation is finished (useful for state management)
      // This could be implemented with EventEmitter if needed
    }, 5000);
  }
  
  startFireworks(): void {
    // Create fireworks at a slower rate than the victory animation
    this.animationInterval = setInterval(() => {
      this.createFirework();
    }, 400);
  }
  
  createFirework(): void {
    const color = this.colors[Math.floor(Math.random() * this.colors.length)];
    // Position fireworks more centrally than the victory animation
    const x = 150 + Math.random() * 300;
    const y = 50 + Math.random() * 200;
    
    this.fireworks.push({ x, y, color });
    
    // Create fewer particles than the victory animation
    for (let i = 0; i < 12; i++) {
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
      for (let i = 0; i < 12; i++) {
        if (this.particles.length > 0) {
          this.particles.shift();
        }
      }
    }, 800);
  }
  
  clearTimers(): void {
    if (this.animationInterval) {
      clearInterval(this.animationInterval);
    }
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
    }
  }
}
