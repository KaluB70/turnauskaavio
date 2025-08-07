import {Component, OnInit, OnDestroy} from '@angular/core';
import {CommonModule} from '@angular/common';
import {trigger, transition, style, animate} from '@angular/animations';
import {TournamentService} from '../../services/tournament.service';

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
			cursor: pointer;
			transition: background-color 0.2s ease;
		}
		.winner-overlay:hover {
			background: rgba(0, 0, 0, 0.85);
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
		<div class="winner-overlay" @fadeInOut
		     (keydown)="onKeyDown($event)"
		     tabindex="0">
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

				<div class="text-sm opacity-70 mt-4">
					Klikkaa tai paina välilyöntiä jatkaaksesi
				</div>
			</div>
		</div>
	`
})
export class MatchWinnerComponent implements OnInit, OnDestroy {
	private timer: any;
	private isSkipped = false;

	constructor(public tournamentService: TournamentService) {}

	ngOnInit(): void {
		this.timer = setTimeout(() => {
			this.continue();
		}, 4000);

		// Delay focus to prevent immediate triggering
		setTimeout(() => {
			const overlay = document.querySelector('.winner-overlay') as HTMLElement;
			if (overlay && !this.isSkipped) {
				overlay.focus();
			}
		}, 500);
	}

	ngOnDestroy(): void {
		if (this.timer) {
			clearTimeout(this.timer);
		}
	}

	onKeyDown(event: KeyboardEvent): void {
		// Only respond to intentional key presses, not programmatic ones
		if (event.isTrusted && (event.key === 'Enter' || event.key === ' ' || event.code === 'Space')) {
			event.preventDefault();
			event.stopPropagation();
			this.continue();
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
