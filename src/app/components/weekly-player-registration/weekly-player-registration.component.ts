// src/app/components/weekly-player-registration/weekly-player-registration.component.ts
import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WeeklyTournamentService, WeeklyGameMode } from '../../services/weekly-tournament.service';
import { HideSelectedPipe } from '../player-registration/hide-selected.pipe';

const RECENT_PLAYERS_KEY = 'darts_recent_players';
const MAX_RECENT_PLAYERS = 15;

@Component({
  selector: 'weekly-player-registration',
  standalone: true,
  imports: [CommonModule, FormsModule, HideSelectedPipe],
  templateUrl: './weekly-player-registration.component.html'
})
export class WeeklyPlayerRegistrationComponent implements OnInit {
  currentPlayerName = '';
  addedPlayers: string[] = [];
  errorMessage = '';
  weekNumber = 1;

  gameModes: WeeklyGameMode[] = ['301', '501', '701', 'Cricket'];
  selectedGameMode: WeeklyGameMode = '301';

  bestOfOptions = [1, 3, 5, 7, 9, 11];
  selectedBestOf = 3;

  recentPlayers: string[] = [];
  filteredSuggestions: string[] = [];

  @ViewChild('playerNameInput') playerNameInput!: ElementRef;

  constructor(public weeklyTournamentService: WeeklyTournamentService) {}

  ngOnInit(): void {
    this.loadRecentPlayers();
  }

  loadRecentPlayers(): void {
    try {
      const savedPlayers = localStorage.getItem(RECENT_PLAYERS_KEY);
      if (savedPlayers) {
        this.recentPlayers = JSON.parse(savedPlayers);
      }
    } catch (error) {
      console.error('Error loading recent players from localStorage:', error);
    }
  }

  saveRecentPlayers(): void {
    try {
      localStorage.setItem(RECENT_PLAYERS_KEY, JSON.stringify(this.recentPlayers));
    } catch (error) {
      console.error('Error saving recent players to localStorage:', error);
    }
  }

  addToRecentPlayers(playerName: string): void {
    const normalizedName = playerName.trim();
    if (!normalizedName) return;

    // Remove if already exists (case insensitive)
    this.recentPlayers = this.recentPlayers.filter(name =>
      name.toLowerCase() !== normalizedName.toLowerCase()
    );

    // Add to the beginning
    this.recentPlayers.unshift(normalizedName);

    // Limit to MAX_RECENT_PLAYERS
    if (this.recentPlayers.length > MAX_RECENT_PLAYERS) {
      this.recentPlayers = this.recentPlayers.slice(0, MAX_RECENT_PLAYERS);
    }

    this.saveRecentPlayers();
  }

  onPlayerNameKeyUp(event: KeyboardEvent): void {
    // Skip filter on navigation keys
    if (['ArrowUp', 'ArrowDown', 'Escape'].includes(event.key)) return;

    const search = this.currentPlayerName.toLowerCase().trim();
    if (search === '') {
      this.filteredSuggestions = [];
      return;
    }

    // Filter recent players by the search term
    this.filteredSuggestions = this.recentPlayers
      .filter(name => name.toLowerCase().includes(search))
      .slice(0, 5); // Limit to 5 suggestions
  }

  selectSuggestion(suggestion: string): void {
    this.currentPlayerName = suggestion;
    this.filteredSuggestions = [];
    this.addPlayer();
  }

  selectRecentPlayer(player: string): void {
    this.currentPlayerName = player;
    this.addPlayer();
  }

  addPlayer(): void {
    const playerName = this.currentPlayerName.trim();
    if (!playerName) return;

    // Check if player already exists (case insensitive)
    const isDuplicate = this.addedPlayers.some(
      name => name.toLowerCase() === playerName.toLowerCase()
    );

    if (isDuplicate) {
      this.errorMessage = `Pelaaja "${playerName}" on jo lisätty.`;
      return;
    }

    this.addedPlayers.push(playerName);
    this.addToRecentPlayers(playerName);
    this.currentPlayerName = '';
    this.errorMessage = '';
    this.filteredSuggestions = [];

    // Focus back on the input field
    setTimeout(() => {
      this.playerNameInput.nativeElement.focus();
    }, 0);
  }

  removePlayer(index: number): void {
    this.addedPlayers.splice(index, 1);
    this.loadRecentPlayers();
  }

  clearPlayers(): void {
    this.addedPlayers = [];
  }

  getGameModeButtonClass(mode: WeeklyGameMode): string {
    const baseClass = 'py-2 px-3 rounded-md text-center';
    if (mode === this.selectedGameMode) {
      return `${baseClass} bg-blue-600 text-white`;
    }
    return `${baseClass} bg-gray-200 text-gray-800 hover:bg-gray-300`;
  }

  getBestOfButtonClass(option: number): string {
    const baseClass = 'py-2 px-3 rounded-md text-center';
    if (option === this.selectedBestOf) {
      return `${baseClass} bg-blue-600 text-white`;
    }
    return `${baseClass} bg-gray-200 text-gray-800 hover:bg-gray-300`;
  }

  startTournament(): void {
    try {
      this.errorMessage = '';

      if (this.addedPlayers.length < 3) {
        this.errorMessage = 'Vähintään 3 pelaajaa tarvitaan viikkokisoihin.';
        return;
      }

      if (this.weekNumber < 1 || this.weekNumber > 10) {
        this.errorMessage = 'Viikko numeron täytyy olla 1-10 välillä.';
        return;
      }

      // Save all player names to recent players
      this.addedPlayers.forEach(name => this.addToRecentPlayers(name));

      this.weeklyTournamentService.registerPlayers(
        this.addedPlayers,
        this.selectedGameMode,
        this.selectedBestOf,
        this.weekNumber
      );
    } catch (error) {
      this.errorMessage = (error as Error).message;
    }
  }
}
