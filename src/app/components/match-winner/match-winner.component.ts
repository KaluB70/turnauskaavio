import {Component, OnInit, OnDestroy} from '@angular/core';
import {CommonModule} from '@angular/common';
import {trigger, transition, style, animate} from '@angular/animations';
import {TournamentService} from '../../services/tournament.service';
import {SoundService} from '../../services/sound.service';

@Component({
	selector: 'match-winner',
	standalone: true,
	imports: [CommonModule],
	animations: [
		trigger('fadeInOut', [
			transition(':enter', [
				style({opacity: 0, transform: 'scale(0.8)'}),
				animate('0.5s ease-in', style({opacity: 1, transform: 'scale(1)'}))
			])
		])
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
			outline: none;
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
			<div class="winner-card" @fadeInOut (click)="$event.stopPropagation()">
				<div class="phase-badge">
					{{ getPhaseDescription() }}
				</div>

				<div class="trophy-icon">🏆</div>
				<h2 class="text-3xl font-bold mb-4">{{ getWinnerTitle() }}</h2>
				<div class="text-5xl font-bold mb-6">{{ tournamentService.winnerName }}</div>

				<div class="text-lg opacity-90 mb-4">
					{{ getWinnerMessage() }}
				</div>
			</div>
		</div>
	`
})
export class MatchWinnerComponent implements OnInit, OnDestroy {
	private timer: any;
	private isSkipped = false;

	constructor(
		public tournamentService: TournamentService,
		private soundService: SoundService
	) {}

	ngOnInit(): void {
		// Play appropriate sound based on the type of win
		const isFinal = this.isFinalMatch();
		const matchesComplete = this.tournamentService.matches.filter(m => m.isComplete).length;
		const totalMatches = this.tournamentService.matches.length;
		
		// Check if tournament is actually completed (regardless of phase detection issues)
		const isActuallyComplete = this.tournamentService.tournamentCompleted;
		
		// For 3-player tournaments, the 3rd match is always the tournament winner
		const isThirdMatchIn3Player = this.tournamentService.players.length === 3 && matchesComplete === totalMatches;
		
		// Also play tournament sound for final phase matches or completed tournaments
		if (isFinal || this.tournamentService.currentPhase === 'final' || isActuallyComplete || isThirdMatchIn3Player) {
			this.soundService.playTournamentWon();
		} else {
			this.soundService.playMatchWon();
		}

		this.timer = setTimeout(() => {
			this.continue();
		}, 4000);
	}

	ngOnDestroy(): void {
		if (this.timer) {
			clearTimeout(this.timer);
		}
	}


	getPhaseDescription(): string {
		return this.tournamentService.getCurrentPhaseDescription();
	}

	getWinnerTitle(): string {
		if (this.isPlayoffWin()) {
			return 'Finaalipaikka!';
		} else if (this.isFinalMatch()) {
			return 'Viikon voittaja!';
		} else {
			return 'Ottelun voittaja!';
		}
	}

	getWinnerMessage(): string {
		if (this.isPlayoffWin()) {
			return 'Pääsy finaaliin varmistunut! 🎯';
		} else if (this.isFinalMatch()) {
			return 'Onnittelut mestaruudesta! 🏆';
		} else {
			return 'Hienoa peliä! 🎯';
		}
	}

	isPlayoffWin(): boolean {
		return this.tournamentService.currentPhase === 'playoff';
	}

	isFinalMatch(): boolean {
		// For 3-player round robin, final match means tournament is complete WITHOUT ties
		if (this.tournamentService.tournamentType === 'round-robin' &&
			this.tournamentService.players.length === 3) {
			const groupMatches = this.tournamentService.matches.filter(m => m.round === 'group');
			const completedMatches = groupMatches.filter(m => m.isComplete).length;
			const allMatchesComplete = completedMatches === groupMatches.length;

			// Only consider it final if no tiebreaker is required
			return allMatchesComplete && !this.tournamentService.requiresTiebreaker;
		}

		return this.tournamentService.currentPhase === 'final' &&
			this.tournamentService.isTournamentComplete();
	}

	continue(): void {
		if (this.isSkipped) {
			return; // Already processed, prevent double execution
		}

		this.isSkipped = true;

		if (this.timer) {
			clearTimeout(this.timer);
			this.timer = null;
		}

		// First turn off the showMatchWinner flag, then find next match
		this.tournamentService.showMatchWinner = false;
		this.tournamentService.findNextMatch();
	}
}
