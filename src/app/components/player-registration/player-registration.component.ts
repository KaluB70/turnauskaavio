// src/app/components/player-registration/player-registration.component.ts
import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TournamentService, GameMode } from '../../services/tournament.service';
import { HideSelectedPipe } from "./hide-selected.pipe";

const RECENT_PLAYERS_KEY = 'darts_recent_players';
const MAX_RECENT_PLAYERS = 15;

@Component({
  selector: 'player-registration',
  standalone: true,
  imports: [CommonModule, FormsModule, HideSelectedPipe],
  template: `
    <div class="bg-gray-100 p-6 rounded-lg shadow">
      <h2 class="text-xl font-semibold mb-4">Turnausmuoto</h2>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div class="mb-4">
            <label for="playerName" class="block mb-2 font-medium">Lisää Pelaaja</label>
            <div class="flex">
              <input 
                type="text" 
                id="playerName" 
                class="w-full p-2 border border-gray-300 rounded-l-md"
                [(ngModel)]="currentPlayerName"
                (keyup)="onPlayerNameKeyUp($event)"
                (keyup.enter)="addPlayer()"
                #playerNameInput
                placeholder="Nimi...">
              <button 
                (click)="addPlayer()" 
                class="bg-blue-600 text-white py-2 px-4 rounded-r-md hover:bg-blue-700">
                Lisää
              </button>
            </div>
            
            <!-- Autocomplete dropdown -->
            <div *ngIf="filteredSuggestions.length > 0 && currentPlayerName.trim() !== ''" 
                 class="bg-white border border-gray-300 rounded-md mt-1 absolute z-10 w-64 shadow-lg">
              <ul>
                <li *ngFor="let suggestion of filteredSuggestions" 
                    (click)="selectSuggestion(suggestion)"
                    class="p-2 hover:bg-gray-100 cursor-pointer border-b border-gray-200">
                  {{ suggestion }}
                </li>
              </ul>
            </div>
          </div>
          
          <!-- Recent players as badges -->
          <div *ngIf="(recentPlayers | hideSelected: addedPlayers).length > 0" class="mb-4">
            <label class="block mb-2 font-medium">Viimeisimmät Pelaajat:</label>
            <div class="flex flex-wrap gap-2">
              <span *ngFor="let player of recentPlayers | hideSelected: addedPlayers" 
                    class="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm cursor-pointer hover:bg-blue-200"
                    (click)="selectRecentPlayer(player)">
                {{ player }}
              </span>
            </div>
          </div>
          
          <!-- Added Players table -->
          <div *ngIf="addedPlayers.length > 0" class="mb-4">
            <label class="block mb-2 font-medium">Turnauksen Pelaajat:</label>
            <div class="bg-white rounded-md border border-gray-300 overflow-hidden">
              <table class="min-w-full">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nimi</th>
                    <th class="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Toiminto</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let player of addedPlayers; let i = index" class="border-t border-gray-200">
                    <td class="px-4 py-2">{{ player }}</td>
                    <td class="px-4 py-2 text-right">
                      <button 
                        (click)="removePlayer(i)"
                        class="text-red-600 hover:text-red-800 text-sm">
                        Poista
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        <div>
          <div class="mb-4">
            <label class="block mb-2 font-medium">Pelimuoto
            </label>
            <div class="grid grid-cols-2 gap-2">
              <button 
                *ngFor="let mode of gameModes" 
                [class]="getGameModeButtonClass(mode)"
                (click)="selectedGameMode = mode">
                {{ mode }}
              </button>
            </div>
          </div>
          
          <div class="mb-4">
            <label class="block mb-2 font-medium">Best of {{ selectedBestOf}}</label>
            <div class="grid grid-cols-3 gap-2">
              <button 
                *ngFor="let option of bestOfOptions" 
                [class]="getBestOfButtonClass(option)"
                (click)="selectedBestOf = option">
                {{ option }}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div class="mt-6 flex space-x-3">
        <button 
          (click)="startTournament()" 
          class="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700"
          [disabled]="(addedPlayers.length < 2)">
          Aloita Turnaus
        </button>
        
        <button 
          (click)="clearPlayers()" 
          class="bg-gray-300 text-gray-800 py-2 px-6 rounded-md hover:bg-gray-400"
          [disabled]="addedPlayers.length === 0">
          Tyhjennä Pelaajat
        </button>
        
        <div *ngIf="errorMessage" class="mt-4 text-red-600">
          {{ errorMessage }}
        </div>
      </div>
    </div>
  `
})
export class PlayerRegistrationComponent implements OnInit {
  currentPlayerName = '';
  addedPlayers: string[] = [];
  errorMessage = '';
  
  gameModes: GameMode[] = ['301', '501', '701', 'Cricket'];
  selectedGameMode: GameMode = '501';
  
  bestOfOptions = [1, 3, 5, 7, 9, 11];
  selectedBestOf = 3;
  
  recentPlayers: string[] = [];
  filteredSuggestions: string[] = [];
  
  @ViewChild('playerNameInput') playerNameInput!: ElementRef;
  
  constructor(public tournamentService: TournamentService) {}
  
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
      this.errorMessage = `Player "${playerName}" is already added.`;
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
  
  getGameModeButtonClass(mode: GameMode): string {
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
    
      const playerNames: string[] = [...this.addedPlayers];
    
      
      if (playerNames.length < 2) {
        this.errorMessage = 'Please enter at least 2 player names.';
        return;
      }
      
      // Save all player names to recent players
      playerNames.forEach(name => this.addToRecentPlayers(name));
      
      this.tournamentService.registerPlayers(playerNames, this.selectedGameMode, this.selectedBestOf);
    } catch (error) {
      this.errorMessage = (error as Error).message;
    }
  }
}