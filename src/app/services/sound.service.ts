import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SoundService {
  private soundEnabled = true;
  private currentRouletteAudio: HTMLAudioElement | null = null;
  private audioContext: AudioContext | null = null;
  private userHasInteracted = false;
  
  // Sound URLs - Configure these based on your preference
  private soundUrls = {
    // Option 1: Local files (recommended) - Put sound files in src/assets/sounds/
    rouletteSpin: 'assets/sounds/roulette-spin.mp3',
    rouletteLock: 'assets/sounds/click.mp3', 
    rouletteFinished: 'assets/sounds/success.mp3',
    matchWon: 'assets/sounds/victory.mp3',
    tournamentWon: 'assets/sounds/tournament-won.mp3',
    
    // Option 2: Use external royalty-free sounds (uncomment these and comment above)
    // rouletteSpin: 'https://www.soundboard.com/handler/DownLoadTrack.ashx?cliptitle=Casino+Roulette+Wheel&filename=y2mate.com+-+Casino+Roulette+Wheel.mp3',
    // rouletteLock: 'https://www.soundboard.com/handler/DownLoadTrack.ashx?cliptitle=Click+Sound+Effect&filename=click.mp3',
    // rouletteFinished: 'https://www.soundboard.com/handler/DownLoadTrack.ashx?cliptitle=Success+Bell&filename=success.mp3',
    // matchWon: 'https://www.soundboard.com/handler/DownLoadTrack.ashx?cliptitle=Victory+Fanfare&filename=victory.mp3',
    // tournamentWon: 'https://www.soundboard.com/handler/DownLoadTrack.ashx?cliptitle=Tournament+Victory&filename=tournament.mp3'
  };

  constructor() {
    // Listen for first user interaction to enable audio
    this.initializeAudioContext();
  }

  private initializeAudioContext(): void {
    const enableAudio = () => {
      this.userHasInteracted = true;
      try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (error) {
        console.warn('AudioContext not supported:', error);
      }
      // Remove listeners after first interaction
      document.removeEventListener('click', enableAudio);
      document.removeEventListener('touchstart', enableAudio);
      document.removeEventListener('keydown', enableAudio);
    };

    // Wait for any user interaction
    document.addEventListener('click', enableAudio);
    document.addEventListener('touchstart', enableAudio);
    document.addEventListener('keydown', enableAudio);
  }

  private playAudio(url: string, volume: number = 0.5, loop: boolean = false): HTMLAudioElement | null {
    if (!this.soundEnabled || !this.userHasInteracted) {
      if (!this.userHasInteracted) {
        console.debug('Audio blocked - waiting for user interaction');
      }
      return null;
    }
    
    try {
      const audio = new Audio(url);
      audio.volume = volume;
      audio.loop = loop;
      
      // Handle potential CORS or loading issues
      audio.addEventListener('error', (e) => {
        console.warn(`Could not load sound: ${url}. To fix this, add sound files to src/assets/sounds/ directory.`);
      });
      
      // Add loadstart event to confirm audio is being loaded
      audio.addEventListener('loadstart', () => {
        console.debug(`Loading sound: ${url}`);
      });
      
      audio.play().catch(error => {
        if (error.name === 'NotAllowedError') {
          console.warn(`Audio blocked by browser autoplay policy. User needs to interact with the page first.`);
        } else {
          console.warn(`Could not play sound: ${url}.`);
        }
      });
      
      return audio;
    } catch (error) {
      console.warn('Error creating audio element:', error);
      return null;
    }
  }


  // Continuous roulette spinning sound (loops during animation)
  playRouletteSpinning(playbackRate: number = 1.0): void {
    this.stopRouletteSpinning(); // Stop any existing sound
    this.currentRouletteAudio = this.playAudio(this.soundUrls.rouletteSpin, 0.3, true);
    
    // Adjust playback rate for speed effect
    if (this.currentRouletteAudio) {
      this.currentRouletteAudio.playbackRate = Math.min(playbackRate, 3.0); // Cap at 3x speed
    }
  }

  // Speed up the current roulette sound
  speedUpRouletteSpin(speedMultiplier: number): void {
    if (this.currentRouletteAudio) {
      this.currentRouletteAudio.playbackRate = Math.min(speedMultiplier, 3.0);
    }
  }

  // Stop the roulette spinning sound
  stopRouletteSpinning(): void {
    if (this.currentRouletteAudio) {
      this.currentRouletteAudio.pause();
      this.currentRouletteAudio.currentTime = 0;
      this.currentRouletteAudio = null;
    }
  }

  // Roulette lock sound (decisive click)
  playRouletteLock(): void {
    this.playAudio(this.soundUrls.rouletteLock, 0.6);
  }

  // Roulette finished (success chime)
  playRouletteFinished(): void {
    this.stopRouletteSpinning(); // Stop spinning sound first
    this.playAudio(this.soundUrls.rouletteFinished, 0.7);
  }

  // Match won (victory fanfare)
  playMatchWon(): void {
    this.playAudio(this.soundUrls.matchWon, 0.8);
  }

  // Tournament won (grand victory)
  playTournamentWon(): void {
    console.log('playTournamentWon() called');
    this.playAudio(this.soundUrls.tournamentWon, 0.9);
  }

  // Preload all sounds (optional - call this on app initialization)
  preloadSounds(): void {
    Object.values(this.soundUrls).forEach(url => {
      const audio = new Audio(url);
      audio.preload = 'auto';
      audio.load();
    });
  }

  // Update sound URLs (useful for switching between local/remote sounds)
  updateSoundUrls(newUrls: Partial<typeof this.soundUrls>): void {
    this.soundUrls = { ...this.soundUrls, ...newUrls };
  }

  // Enable/disable sounds
  setSoundEnabled(enabled: boolean): void {
    this.soundEnabled = enabled;
    if (!enabled) {
      this.stopRouletteSpinning();
    }
  }

  isSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  // Test all sounds (useful for debugging)
  testAllSounds(): void {
    console.log('Testing all sounds...');
    setTimeout(() => this.playRouletteLock(), 500);
    setTimeout(() => this.playRouletteFinished(), 1000);
    setTimeout(() => this.playMatchWon(), 1500);
    setTimeout(() => {
      console.log('Testing tournament won sound...');
      this.playTournamentWon();
    }, 2500);
    
    // Test roulette spin for 2 seconds
    this.playRouletteSpinning();
    setTimeout(() => this.stopRouletteSpinning(), 2000);
  }

  // Test just the tournament won sound
  testTournamentWonSound(): void {
    console.log('Testing only tournament won sound...');
    this.playTournamentWon();
  }

  // Get current sound URLs for debugging
  getCurrentSoundUrls(): typeof this.soundUrls {
    return { ...this.soundUrls };
  }

  // Check if user has interacted (for debugging)
  hasUserInteracted(): boolean {
    return this.userHasInteracted;
  }

  // Force enable audio (for testing - call after user clicks something)
  forceEnableAudio(): void {
    this.userHasInteracted = true;
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      console.log('Audio manually enabled');
    } catch (error) {
      console.warn('AudioContext not supported:', error);
    }
  }
}