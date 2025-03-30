// src/app/services/tournament.service.ts - Improved bye logic
import { Injectable } from '@angular/core';

export interface Player {
  id: number;
  name: string;
}

export interface Match {
  id: number;
  round: number;
  position: number;
  player1Id: number | null;
  player2Id: number | null;
  winner: number | null;
  player1Score: number | null;
  player2Score: number | null;
  player1Legs: number;
  player2Legs: number;
  isComplete: boolean;
}

export interface MatchResult {
  matchId: number;
  player1Name: string;
  player2Name: string;
  player1Score: number;
  player2Score: number;
  player1Legs: number;
  player2Legs: number;
  winnerName: string;
  timestamp: Date;
  gameMode: string;
}

export interface TournamentWinner {
  playerName: string;
  gameMode: string;
  date: Date;
  playerCount: number;
}

interface Pairing {
  player1: string | null;
  player2: string | null;
}

export type GameMode = '301' | '501' | '701' | 'Cricket';

// Keys for localStorage
const MATCH_HISTORY_KEY = 'darts_match_history';
const TOURNAMENT_WINNERS_KEY = 'darts_tournament_winners';

@Injectable({
  providedIn: 'root',
})
export class TournamentService {
  players: Player[] = [];
  matches: Match[] = [];
  currentMatch: Match | null = null;
  isStarted = false;
  matchHistory: MatchResult[] = [];
  showMatchVictoryAnimation = false;
  showVictoryAnimation = false;
  gameMode: GameMode = '501';
  bestOfLegs = 3;
  currentLeg = 1;
  legHistory: { player1Score: number; player2Score: number }[] = [];
  tournamentWinners: TournamentWinner[] = [];

  constructor() {
    this.loadFromLocalStorage();
  }

  private loadFromLocalStorage(): void {
    try {
      // Load match history
      const savedHistory = localStorage.getItem(MATCH_HISTORY_KEY);
      if (savedHistory) {
        const parsedHistory = JSON.parse(savedHistory);
        this.matchHistory = parsedHistory.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp),
        }));
      }

      // Load tournament winners
      const savedWinners = localStorage.getItem(TOURNAMENT_WINNERS_KEY);
      if (savedWinners) {
        const parsedWinners = JSON.parse(savedWinners);
        this.tournamentWinners = parsedWinners.map((item: any) => ({
          ...item,
          date: new Date(item.date),
        }));
      }
    } catch (error) {
      console.error('Error loading data from localStorage:', error);
    }
  }

  private saveToLocalStorage(): void {
    try {
      localStorage.setItem(
        MATCH_HISTORY_KEY,
        JSON.stringify(this.matchHistory)
      );
      localStorage.setItem(
        TOURNAMENT_WINNERS_KEY,
        JSON.stringify(this.tournamentWinners)
      );
    } catch (error) {
      console.error('Error saving data to localStorage:', error);
    }
  }

  resetTournament(): void {
    this.matches = [];
    this.currentMatch = null;
    this.isStarted = false;
    this.showVictoryAnimation = false;
    this.legHistory = [];
    this.currentLeg = 1;

    // Clear players
    this.players = [];

    // Save changes to localStorage
    this.saveToLocalStorage();
  }

  // Add this method to the TournamentService class
  registerPlayersWithPairings(
    pairings: Pairing[],
    gameMode: GameMode,
    bestOfLegs: number
  ): void {
    // Get all unique player names from pairings
    const playerNames: string[] = [];
    pairings.forEach((pair) => {
      if (pair.player1) playerNames.push(pair.player1);
      if (pair.player2) playerNames.push(pair.player2);
    });

    // Create player objects with IDs
    this.players = playerNames
      .filter((name) => name.trim() !== '')
      .map((name, index) => ({
        id: index + 1,
        name: name.trim(),
      }));

    if (this.players.length < 2) {
      throw new Error('At least 2 players are required');
    }

    this.gameMode = gameMode;
    this.bestOfLegs = bestOfLegs;

    // Find the smallest power of 2 that can accommodate all players
    const rounds = Math.ceil(Math.log2(this.players.length));
    const totalSlots = Math.pow(2, rounds);

    // Initialize all matches
    this.matches = [];
    for (let round = 0; round < rounds; round++) {
      const matchesInRound = Math.pow(2, rounds - round - 1);

      for (let position = 0; position < matchesInRound; position++) {
        const matchId = this.matches.length + 1;
        this.matches.push({
          id: matchId,
          round,
          position,
          player1Id: null,
          player2Id: null,
          winner: null,
          player1Score: null,
          player2Score: null,
          player1Legs: 0,
          player2Legs: 0,
          isComplete: false,
        });
      }
    }

    // Get first round matches
    const firstRoundMatches = this.matches.filter((m) => m.round === 0);

    // Directly apply the pairings to the first round matches
    pairings.forEach((pair, index) => {
      if (index < firstRoundMatches.length) {
        const match = firstRoundMatches[index];

        // Find player IDs by name
        if (pair.player1) {
          const player1 = this.players.find((p) => p.name === pair.player1);
          if (player1) match.player1Id = player1.id;
        }

        if (pair.player2) {
          const player2 = this.players.find((p) => p.name === pair.player2);
          if (player2) match.player2Id = player2.id;
        }
      }
    });

    // Process first round matches - complete matches with byes
    for (const match of firstRoundMatches) {
      // If there's only one player (bye), advance them automatically
      if (match.player1Id !== null && match.player2Id === null) {
        match.winner = match.player1Id;
        match.player1Score = this.getInitialScore();
        match.player2Score = 0;
        match.player1Legs = Math.ceil(this.bestOfLegs / 2);
        match.isComplete = true;

        // Record match history for first round bye
        this.matchHistory.push({
          matchId: match.id,
          player1Name: this.getPlayerName(match.player1Id),
          player2Name: 'Bye',
          player1Score: match.player1Score,
          player2Score: 0,
          player1Legs: match.player1Legs,
          player2Legs: 0,
          winnerName: this.getPlayerName(match.player1Id),
          timestamp: new Date(),
          gameMode: this.gameMode,
        });

        // Advance the player to next round
        this.advancePlayerToNextRound(match);
      } else if (match.player1Id === null && match.player2Id !== null) {
        match.winner = match.player2Id;
        match.player1Score = 0;
        match.player2Score = this.getInitialScore();
        match.player2Legs = Math.ceil(this.bestOfLegs / 2);
        match.isComplete = true;

        // Record match history for first round bye
        this.matchHistory.push({
          matchId: match.id,
          player1Name: 'Bye',
          player2Name: this.getPlayerName(match.player2Id),
          player1Score: 0,
          player2Score: match.player2Score,
          player1Legs: 0,
          player2Legs: match.player2Legs,
          winnerName: this.getPlayerName(match.player2Id),
          timestamp: new Date(),
          gameMode: this.gameMode,
        });

        // Advance the player to next round
        this.advancePlayerToNextRound(match);
      }
    }

    // Save match history to localStorage
    this.saveToLocalStorage();

    // Start the tournament
    this.isStarted = true;
    this.findNextMatch();
  }

  // New method to create brackets from explicit pairings
  generateBracketFromPairings(pairings: Pairing[]): void {
    const playerCount = this.players.length;

    // Find the smallest power of 2 that can accommodate all pairs
    const rounds = Math.ceil(Math.log2(pairings.length * 2));

    // Initialize all matches
    this.matches = [];
    for (let round = 0; round < rounds; round++) {
      const matchesInRound = Math.pow(2, rounds - round - 1);

      for (let position = 0; position < matchesInRound; position++) {
        const matchId = this.matches.length + 1;
        this.matches.push({
          id: matchId,
          round,
          position,
          player1Id: null,
          player2Id: null,
          winner: null,
          player1Score: null,
          player2Score: null,
          player1Legs: 0,
          player2Legs: 0,
          isComplete: false,
        });
      }
    }

    // Get first round matches
    const firstRoundMatches = this.matches.filter((m) => m.round === 0);

    // Apply pairings to first round matches
    pairings.forEach((pair, index) => {
      if (index < firstRoundMatches.length) {
        const match = firstRoundMatches[index];

        // Find player IDs by name
        if (pair.player1) {
          const player1 = this.players.find((p) => p.name === pair.player1);
          if (player1) match.player1Id = player1.id;
        }

        if (pair.player2) {
          const player2 = this.players.find((p) => p.name === pair.player2);
          if (player2) match.player2Id = player2.id;
        }
      }
    });

    // Process first round matches - complete matches with byes
    for (const match of firstRoundMatches) {
      // If there's only one player (bye), advance them automatically
      if (match.player1Id !== null && match.player2Id === null) {
        match.winner = match.player1Id;
        match.player1Score = this.getInitialScore();
        match.player2Score = 0;
        match.player1Legs = Math.ceil(this.bestOfLegs / 2);
        match.isComplete = true;

        // Record match history for first round bye
        this.matchHistory.push({
          matchId: match.id,
          player1Name: this.getPlayerName(match.player1Id),
          player2Name: 'Bye',
          player1Score: match.player1Score,
          player2Score: 0,
          player1Legs: match.player1Legs,
          player2Legs: 0,
          winnerName: this.getPlayerName(match.player1Id),
          timestamp: new Date(),
          gameMode: this.gameMode,
        });

        // Advance the player to next round
        this.advancePlayerToNextRound(match);
      } else if (match.player1Id === null && match.player2Id !== null) {
        match.winner = match.player2Id;
        match.player1Score = 0;
        match.player2Score = this.getInitialScore();
        match.player2Legs = Math.ceil(this.bestOfLegs / 2);
        match.isComplete = true;

        // Record match history for first round bye
        this.matchHistory.push({
          matchId: match.id,
          player1Name: 'Bye',
          player2Name: this.getPlayerName(match.player2Id),
          player1Score: 0,
          player2Score: match.player2Score,
          player1Legs: 0,
          player2Legs: match.player2Legs,
          winnerName: this.getPlayerName(match.player2Id),
          timestamp: new Date(),
          gameMode: this.gameMode,
        });

        // Advance the player to next round
        this.advancePlayerToNextRound(match);
      }
    }

    // Save match history to localStorage
    this.saveToLocalStorage();
  }

  registerPlayers(
    playerNames: string[],
    gameMode: GameMode,
    bestOfLegs: number,
    preserveOrder: boolean = false
  ): void {
    // Filter out empty names and create player objects
    this.players = playerNames
      .filter((name) => name.trim() !== '')
      .map((name, index) => ({
        id: index + 1,
        name: name.trim(),
      }));

    if (this.players.length < 2) {
      throw new Error('At least 2 players are required');
    }

    this.gameMode = gameMode;
    this.bestOfLegs = bestOfLegs;

    // Generate the bracket (with or without shuffling based on preserveOrder)
    this.generateBracket(preserveOrder);
    this.isStarted = true;
    this.findNextMatch();
  }

  // Update to generateBracket to respect player order
  generateBracket(preserveOrder: boolean = false): void {
    const playerCount = this.players.length;

    // Find the smallest power of 2 that can accommodate all players
    const rounds = Math.ceil(Math.log2(playerCount));
    const totalSlots = Math.pow(2, rounds);
    const byes = totalSlots - playerCount;

    console.log(
      `Players: ${playerCount}, Rounds: ${rounds}, Total slots: ${totalSlots}, Byes: ${byes}`
    );

    // Initialize all matches
    this.matches = [];
    for (let round = 0; round < rounds; round++) {
      const matchesInRound = Math.pow(2, rounds - round - 1);

      for (let position = 0; position < matchesInRound; position++) {
        const matchId = this.matches.length + 1;
        this.matches.push({
          id: matchId,
          round,
          position,
          player1Id: null,
          player2Id: null,
          winner: null,
          player1Score: null,
          player2Score: null,
          player1Legs: 0,
          player2Legs: 0,
          isComplete: false,
        });
      }
    }

    // Get player IDs, shuffled or in original order
    const playerIds = preserveOrder
      ? this.players.map((p) => p.id) // Keep original order
      : this.shuffleArray(this.players.map((p) => p.id)); // Shuffle

    // Get first round matches
    const firstRoundMatches = this.matches.filter((m) => m.round === 0);
    const firstRoundMatchCount = firstRoundMatches.length;

    // Create seeded positions for players that guarantees no bye vs bye
    const seedPositions = this.createSeedPositions(
      firstRoundMatchCount * 2,
      byes
    );

    // Apply players to the seeded positions
    let playerIndex = 0;
    for (let i = 0; i < seedPositions.length; i++) {
      if (seedPositions[i] === true) {
        // This position is a player, not a bye
        if (playerIndex < playerIds.length) {
          const matchIndex = Math.floor(i / 2);
          const match = firstRoundMatches[matchIndex];

          if (i % 2 === 0) {
            // Player 1 position
            match.player1Id = playerIds[playerIndex++];
          } else {
            // Player 2 position
            match.player2Id = playerIds[playerIndex++];
          }
        }
      }
    }

    // Process first round matches - complete matches with byes
    for (const match of firstRoundMatches) {
      // If there's only one player (bye), advance them automatically
      if (match.player1Id !== null && match.player2Id === null) {
        match.winner = match.player1Id;
        match.player1Score = this.getInitialScore();
        match.player2Score = 0;
        match.player1Legs = Math.ceil(this.bestOfLegs / 2);
        match.isComplete = true;

        // Record match history for first round bye
        this.matchHistory.push({
          matchId: match.id,
          player1Name: this.getPlayerName(match.player1Id),
          player2Name: 'Bye',
          player1Score: match.player1Score,
          player2Score: 0,
          player1Legs: match.player1Legs,
          player2Legs: 0,
          winnerName: this.getPlayerName(match.player1Id),
          timestamp: new Date(),
          gameMode: this.gameMode,
        });

        // Advance the player to next round
        this.advancePlayerToNextRound(match);
      } else if (match.player1Id === null && match.player2Id !== null) {
        match.winner = match.player2Id;
        match.player1Score = 0;
        match.player2Score = this.getInitialScore();
        match.player2Legs = Math.ceil(this.bestOfLegs / 2);
        match.isComplete = true;

        // Record match history for first round bye
        this.matchHistory.push({
          matchId: match.id,
          player1Name: 'Bye',
          player2Name: this.getPlayerName(match.player2Id),
          player1Score: 0,
          player2Score: match.player2Score,
          player1Legs: 0,
          player2Legs: match.player2Legs,
          winnerName: this.getPlayerName(match.player2Id),
          timestamp: new Date(),
          gameMode: this.gameMode,
        });

        // Advance the player to next round
        this.advancePlayerToNextRound(match);
      }
    }

    // Save match history to localStorage
    this.saveToLocalStorage();
  }

  // Shuffles the array in place using Fisher-Yates algorithm
  private shuffleArray<T>(array: T[]): T[] {
    const newArray = [...array]; // Create a copy to avoid modifying the original
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }

  // This is the key method to prevent bye vs bye matches
  // It creates a binary array where true = player position, false = bye position
  private createSeedPositions(
    totalPositions: number,
    byeCount: number
  ): boolean[] {
    // Create array with all positions as players
    const positions = Array(totalPositions).fill(true);

    if (byeCount === 0) {
      return positions; // No byes needed
    }

    // Use a power-of-two-based approach to distribute byes
    // This ensures we never have bye vs bye matches

    // Generate the seed positions in the correct order (1-indexed)
    const seedOrder: number[] = [];

    // Helper function to generate the seeding order recursively
    const generateOrder = (start: number, end: number): void => {
      if (start > end) return;

      const mid = Math.floor((start + end) / 2);
      seedOrder.push(mid);

      generateOrder(start, mid - 1);
      generateOrder(mid + 1, end);
    };

    generateOrder(1, totalPositions);

    // Mark the bye positions based on the seeding order
    // Place byes at the highest seeds first
    for (let i = 0; i < byeCount; i++) {
      // Convert 1-indexed seed to 0-indexed position
      const position = seedOrder[i] - 1;
      positions[position] = false; // This position is now a bye
    }

    // Crucial step: Ensure no bye vs bye matches
    for (let i = 0; i < totalPositions; i += 2) {
      if (!positions[i] && !positions[i + 1]) {
        // Found a bye vs bye match - fix it by moving one bye
        // Find the next match with two players and make one a bye
        for (let j = 0; j < totalPositions; j += 2) {
          if (positions[j] && positions[j + 1]) {
            // Found a match with two players, make one a bye
            positions[j] = false; // Convert to a bye
            positions[i] = true; // Convert back to a player
            break;
          }
        }
      }
    }

    // Double-check to make sure we have the right number of byes
    const finalByeCount = positions.filter((p) => !p).length;
    if (finalByeCount !== byeCount) {
      console.error(
        `Bye count mismatch: expected ${byeCount}, got ${finalByeCount}`
      );
    }

    return positions;
  }

  // Helper method to check if the bracket has any bye vs bye matches
  private hasByeVsByeMatch(): boolean {
    const firstRoundMatches = this.matches.filter((m) => m.round === 0);

    for (const match of firstRoundMatches) {
      if (match.player1Id === null && match.player2Id === null) {
        return true;
      }
    }

    return false;
  }

  findNextMatch(): void {
    const incompleteMatches = this.matches
      .filter(
        (m) => !m.isComplete && m.player1Id !== null && m.player2Id !== null
      )
      .sort((a, b) => {
        if (a.round !== b.round) return a.round - b.round;
        return a.position - b.position;
      });
  
    // Store previous match to avoid unnecessary UI updates
    const previousMatch = this.currentMatch;
    this.currentMatch = incompleteMatches.length > 0 ? incompleteMatches[0] : null;
  
    // If all matches are complete, we have a winner
    if (!this.currentMatch && this.isStarted) {
      const finalMatch = this.matches[this.matches.length - 1];
      if (finalMatch && finalMatch.winner) {
        // Record the tournament winner
        this.recordTournamentWinner(finalMatch.winner);
        this.showVictoryAnimation = true;
      }
    }
  
    this.showMatchVictoryAnimation = false;
  }

  recordTournamentWinner(winnerId: number): void {
    const winnerName = this.getPlayerName(winnerId);

    this.tournamentWinners.push({
      playerName: winnerName,
      gameMode: this.gameMode,
      date: new Date(),
      playerCount: this.players.length,
    });

    // Save to localStorage
    this.saveToLocalStorage();
  }

  getWinnerCount(playerName: string, gameMode?: string): number {
    return this.tournamentWinners.filter(
      (w) =>
        w.playerName === playerName &&
        (gameMode ? w.gameMode === gameMode : true)
    ).length;
  }

  getInitialScore(): number {
    switch (this.gameMode) {
      case '301':
        return 301;
      case '501':
        return 501;
      case '701':
        return 701;
      case 'Cricket':
        return 0; // Cricket starts from 0 and counts up
      default:
        return 501;
    }
  }

  isCricketMode(): boolean {
    return this.gameMode === 'Cricket';
  }

  submitLegResult(player1Score: number, player2Score: number): void {
    if (!this.currentMatch) return;

    const match = this.currentMatch;

    // Save current leg result
    this.legHistory.push({
      player1Score,
      player2Score,
    });

    // Determine leg winner and update match legs
    if (this.isCricketMode()) {
      // In Cricket, higher score wins
      if (player1Score > player2Score) {
        match.player1Legs++;
      } else {
        match.player2Legs++;
      }
    } else {
      // In x01 games, first to zero wins
      if (player1Score === 0) {
        match.player1Legs++;
      } else if (player2Score === 0) {
        match.player2Legs++;
      }
    }

    // Check if match is complete
    const legsToWin = Math.ceil(this.bestOfLegs / 2);
    if (match.player1Legs >= legsToWin || match.player2Legs >= legsToWin) {
      // Match is complete
      match.isComplete = true;
      match.winner =
        match.player1Legs >= legsToWin ? match.player1Id : match.player2Id;
      match.player1Score = match.player1Legs;
      match.player2Score = match.player2Legs;

      // Record match history
      this.matchHistory.push({
        matchId: match.id,
        player1Name: this.getPlayerName(match.player1Id!),
        player2Name: this.getPlayerName(match.player2Id!),
        player1Score: match.player1Score,
        player2Score: match.player2Score,
        player1Legs: match.player1Legs,
        player2Legs: match.player2Legs,
        winnerName: this.getPlayerName(match.winner!),
        timestamp: new Date(),
        gameMode: this.gameMode,
      });

      // Save to localStorage
      this.saveToLocalStorage();

      // Advance winner to next round
      this.advancePlayerToNextRound(match);

      // Reset for next match
      this.legHistory = [];
      this.currentLeg = 1;

      // Find next match
      this.findNextMatch();
    } else {
      // Move to next leg
      this.currentLeg++;
    }
  }

  undoLastLeg(): void {
    if (this.legHistory.length === 0 || !this.currentMatch) return;

    // Remove last leg from history
    this.legHistory.pop();

    // Decrement legs count
    if (this.currentLeg > 1) {
      this.currentLeg--;

      // Decrement the leg count for the appropriate player
      if (
        this.currentMatch.player1Legs > 0 &&
        this.currentMatch.player2Legs > 0
      ) {
        // We need to determine which player won the last leg
        // This is a simplification - in a real app, you'd store more data
        if (this.currentMatch.player1Legs > this.currentMatch.player2Legs) {
          this.currentMatch.player1Legs--;
        } else {
          this.currentMatch.player2Legs--;
        }
      } else if (this.currentMatch.player1Legs > 0) {
        this.currentMatch.player1Legs--;
      } else if (this.currentMatch.player2Legs > 0) {
        this.currentMatch.player2Legs--;
      }
    }
  }

  undoLastMatch(): boolean {
    if (this.matchHistory.length === 0) return false;

    // Get the last match from history
    const lastResult = this.matchHistory.pop()!;

    // Save to localStorage after removing the match
    this.saveToLocalStorage();

    // Find the match in our matches array
    const match = this.matches.find((m) => m.id === lastResult.matchId);
    if (!match) return false;

    // Reset the match
    match.isComplete = false;
    match.winner = null;
    match.player1Score = null;
    match.player2Score = null;
    match.player1Legs = 0;
    match.player2Legs = 0;

    // Also need to clear the next round match
    const nextRound = match.round + 1;
    const nextPosition = Math.floor(match.position / 2);
    const nextMatch = this.matches.find(
      (m) => m.round === nextRound && m.position === nextPosition
    );

    if (nextMatch) {
      // Determine which slot the winner was in
      if (match.position % 2 === 0) {
        nextMatch.player1Id = null;
      } else {
        nextMatch.player2Id = null;
      }

      // If the next match was already complete, we need to undo that too
      if (nextMatch.isComplete) {
        return this.undoLastMatch(); // Recursive call to undo the next match too
      }
    }

    // Reset current match and leg variables
    this.legHistory = [];
    this.currentLeg = 1;
    this.currentMatch = match;

    return true;
  }

  skipVictoryAnimation(): void {
    this.showVictoryAnimation = false;
  }

  advancePlayerToNextRound(match: Match): void {
    if (!match.winner) return;
  
    // Skip if this is the final match
    if (match.round >= this.matches.length - 1) return;
  
    const nextRound = match.round + 1;
    const nextPosition = Math.floor(match.position / 2);
    const nextMatch = this.matches.find(
      (m) => m.round === nextRound && m.position === nextPosition
    );
  
    if (!nextMatch) {
      console.error(
        `Could not find next match: round ${nextRound}, position ${nextPosition}`
      );
      return;
    }
  
    // Determine if winner goes to player1 or player2 slot
    if (match.position % 2 === 0) {
      nextMatch.player1Id = match.winner;
    } else {
      nextMatch.player2Id = match.winner;
    }
  
    // Don't immediately update the current match - wait for animation to complete
    // The currentMatch will be updated in findNextMatch after the animation
  
    // If both players are set for the next match and both came from bye matches, 
    // it becomes immediately complete (auto-advancement)
    if (nextMatch.player1Id !== null && nextMatch.player2Id !== null) {
      const shouldAutoComplete = this.shouldAutoCompleteMatch(nextMatch, nextRound);
      
      if (shouldAutoComplete) {
        this.autoCompleteMatch(nextMatch);
      }
    }
    // If only one player is set and the other match is complete with no winner,
    // check if it should be auto-completed (bye)
    else if (nextMatch.player1Id !== null || nextMatch.player2Id !== null) {
      this.handlePotentialByeMatch(nextMatch, match, nextRound);
    }
  }

  // New helper methods for improved match advancement logic
private shouldAutoCompleteMatch(match: Match, round: number): boolean {
  // Check if both players came from bye matches
  const player1Match = this.getMatchForPlayerInPreviousRound(match.player1Id, round);
  const player2Match = this.getMatchForPlayerInPreviousRound(match.player2Id, round);
  
  // If either match doesn't exist, we can't determine if it was a bye
  if (!player1Match || !player2Match) return false;
  
  // Check if both previous matches were byes
  const player1FromBye = this.wasMatchAutoCompleted(player1Match);
  const player2FromBye = this.wasMatchAutoCompleted(player2Match);
  
  return player1FromBye && player2FromBye;
}

private getMatchForPlayerInPreviousRound(playerId: number | null, currentRound: number): Match | undefined {
  if (!playerId) return undefined;
  
  // Find match in previous round where this player was the winner
  return this.matches.find(m => 
    m.round === currentRound - 1 && 
    m.winner === playerId
  );
}

private wasMatchAutoCompleted(match: Match | undefined): boolean {
  if (!match) return false;
  
  // A match was auto-completed if:
  // 1. One player was null (bye)
  // 2. The match was completed very quickly (no real game played)
  return (match.player1Id === null || match.player2Id === null) && match.isComplete;
}

private autoCompleteMatch(match: Match): void {
  // For auto-completed matches, we pick a random winner
  // In a real tournament, this could be based on seeding or other factors
  const isPlayer1Winner = Math.random() > 0.5;
  
  match.winner = isPlayer1Winner ? match.player1Id : match.player2Id;
  match.player1Score = isPlayer1Winner ? Math.ceil(this.bestOfLegs / 2) : 0;
  match.player2Score = isPlayer1Winner ? 0 : Math.ceil(this.bestOfLegs / 2);
  match.player1Legs = isPlayer1Winner ? Math.ceil(this.bestOfLegs / 2) : 0;
  match.player2Legs = isPlayer1Winner ? 0 : Math.ceil(this.bestOfLegs / 2);
  match.isComplete = true;

  // Record match history for the auto-completed match
  const matchResult = {
    matchId: match.id,
    player1Name: match.player1Id ? this.getPlayerName(match.player1Id) : 'Unknown',
    player2Name: match.player2Id ? this.getPlayerName(match.player2Id) : 'Unknown',
    player1Score: match.player1Score || 0,
    player2Score: match.player2Score || 0,
    player1Legs: match.player1Legs,
    player2Legs: match.player2Legs,
    winnerName: this.getPlayerName(match.winner!),
    timestamp: new Date(),
    gameMode: this.gameMode
  };

  this.matchHistory.push(matchResult);
  this.saveToLocalStorage();

  // Advance this player to the next round
  this.advancePlayerToNextRound(match);
}

private handlePotentialByeMatch(nextMatch: Match, currentMatch: Match, nextRound: number): void {
  // Find if there would be another player coming from another match
  const otherPosition = currentMatch.position % 2 === 0 
    ? currentMatch.position + 1 
    : currentMatch.position - 1;
  
  const otherMatch = this.matches.find(
    (m) => m.round === currentMatch.round && m.position === otherPosition
  );

  // Handle cases where there's a bye:
  // 1. Other match doesn't exist
  // 2. Other match is complete with no winner (both players were null/bye)
  // 3. Other match has a player that's null (no player will advance from there)
  if (
    !otherMatch ||
    (otherMatch.isComplete && otherMatch.winner === null) ||
    (otherMatch.isComplete && otherMatch.player1Id === null && otherMatch.player2Id === null)
  ) {
    const winnerId = nextMatch.player1Id !== null ? nextMatch.player1Id : nextMatch.player2Id;
    if (!winnerId) return; // Sanity check

    nextMatch.winner = winnerId;
    nextMatch.player1Score = nextMatch.player1Id === winnerId ? Math.ceil(this.bestOfLegs / 2) : 0;
    nextMatch.player2Score = nextMatch.player2Id === winnerId ? Math.ceil(this.bestOfLegs / 2) : 0;
    nextMatch.player1Legs = nextMatch.player1Id === winnerId ? Math.ceil(this.bestOfLegs / 2) : 0;
    nextMatch.player2Legs = nextMatch.player2Id === winnerId ? Math.ceil(this.bestOfLegs / 2) : 0;
    nextMatch.isComplete = true;

    // Record match history for the bye
    const matchResult = {
      matchId: nextMatch.id,
      player1Name: nextMatch.player1Id ? this.getPlayerName(nextMatch.player1Id) : 'Bye',
      player2Name: nextMatch.player2Id ? this.getPlayerName(nextMatch.player2Id) : 'Bye',
      player1Score: nextMatch.player1Score || 0,
      player2Score: nextMatch.player2Score || 0,
      player1Legs: nextMatch.player1Legs,
      player2Legs: nextMatch.player2Legs,
      winnerName: this.getPlayerName(winnerId),
      timestamp: new Date(),
      gameMode: this.gameMode
    };

    this.matchHistory.push(matchResult);
    this.saveToLocalStorage();

    // Recursively advance this player to the next round
    this.advancePlayerToNextRound(nextMatch);
  }
}
  

  getPlayerName(playerId: number): string {
    const player = this.players.find((p) => p.id === playerId);
    return player ? player.name : 'Unknown';
  }

  getRound(roundIndex: number, plural = false): string {
    const rounds = Math.ceil(Math.log2(this.players.length || 2));
    if (roundIndex === rounds - 1) {
      return 'Finaali';
    } else if (roundIndex === rounds - 2) {
      return plural ? 'Välierät' : 'Välierä';
    } else if (roundIndex === rounds - 3) {
      return plural ? `Puolivälierät` : 'Puolivälierä';
    } else {
      return `${roundIndex + 1}. kierros`;
    }
  }
}
