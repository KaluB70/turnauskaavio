import {Component, OnDestroy, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {animate, style, transition, trigger} from '@angular/animations';
import {TournamentService} from '../../services/tournament.service';

@Component({
	selector: 'roulette',
	standalone: true,
	imports: [CommonModule],
	animations: [
		trigger('fadeIn', [
			transition(':enter', [
				style({opacity: 0}),
				animate('1s ease', style({opacity: 1}))
			])
		])
	],
	styles: [`
		.roulette-container {
			background: linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%);
			color: white;
		}
		.player-card {
			transition: all 0.3s ease;
			animation: nameRoll 200ms linear infinite;
		}
		.player-card.locked {
			animation: none;
			background-color: rgba(255, 255, 255, 0.2);
			border-left: 4px solid #10b981;
		}
		@keyframes nameRoll {
			0%, 100% { opacity: 1; }
			50% { opacity: 0.7; }
		}
		.confetti {
			position: absolute;
			width: 8px;
			height: 8px;
			border-radius: 50%;
			pointer-events: none;
			animation: confetti-fall 3s ease-out forwards;
		}
		@keyframes confetti-fall {
			0% {
				transform: translateY(-20px) rotate(0deg);
				opacity: 1;
			}
			100% {
				transform: translateY(200px) rotate(360deg);
				opacity: 0;
			}
		}
		.trophy-bounce {
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
	`],
	template: `
		<div class="roulette-container min-h-screen flex items-center justify-center p-6 relative overflow-hidden" @fadeIn>
			<div *ngFor="let confetti of confettiPieces"
			     class="confetti"
			     [style.left.px]="confetti.x"
			     [style.top.px]="confetti.y"
			     [style.background-color]="confetti.color"></div>

			<div class="max-w-6xl w-full text-center">
				<div class="mb-8">
					<div class="text-6xl mb-4 trophy-bounce">🎯</div>
					<h1 class="text-4xl font-bold mb-4">{{ currentTitle }}</h1>
					<p class="text-xl opacity-90">{{ currentDescription }}</p>
				</div>

				<!-- Round Robin Layout (3-5 players) -->
				<div *ngIf="tournamentService.tournamentType === 'round-robin'" class="mb-8">
					<div class="text-lg font-semibold mb-4 text-white opacity-90">
						{{ tournamentService.players.length === 3 ? 'Finaalijärjestys' : 'Pelausjärjestys' }}
					</div>

					<div class="flex justify-center">
						<div class="grid grid-cols-1 gap-4 max-w-md">
							<div *ngFor="let _ of displayPlayers; let i = index"
							     class="player-card p-6 bg-white bg-opacity-10 rounded-lg border border-white border-opacity-20 flex items-center"
							     [class.locked]="lockedPlayers.includes(i)">
								<div class="text-3xl mr-4">{{ i + 1 }}.</div>
								<div class="text-2xl font-bold">{{ getDisplayName(i) }}</div>
							</div>
						</div>
					</div>
				</div>

				<!-- Group Layout (6+ players) -->
				<div *ngIf="tournamentService.tournamentType === 'groups' || tournamentService.tournamentType === 'groups-3'" class="mb-8">
					<div class="text-lg font-semibold mb-6 text-white opacity-90">
						{{ tournamentService.tournamentType === 'groups-3' ? '3-lohkojen muodostus' : 'Lohkojen muodostus' }}
					</div>

					<div class="grid gap-8 max-w-6xl mx-auto"
					     [class.grid-cols-1]="groups.length === 1"
					     [class.md:grid-cols-2]="groups.length === 2"
					     [class.md:grid-cols-3]="groups.length === 3">
						<div *ngFor="let group of groups; let groupIndex = index"
						     class="group-container p-6 bg-white bg-opacity-10 rounded-lg border border-white border-opacity-20">
							<div class="text-2xl font-bold mb-4 text-yellow-300">
								Lohko {{ groupIndex + 1 }}
							</div>
							<div class="space-y-3">
								<div *ngFor="let _ of group; let i = index"
								     class="player-card p-3 bg-white bg-opacity-20 rounded-md"
								     [class.locked]="isGroupPlayerLocked(groupIndex, i)">
									<div class="text-lg font-semibold">{{ getGroupDisplayName(groupIndex, i) }}</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				<div *ngIf="allLocked" class="mt-8">
					<div class="text-lg mb-4 text-green-300 font-semibold">
						{{ tournamentService.tournamentType === 'round-robin' ?
						'Pelausjärjestys arvottu!' :
						(tournamentService.tournamentType === 'groups-3' ? '3 lohkoa muodostettu!' : 'Lohkot muodostettu!') }}
					</div>
					<button
						(click)="startTournament()"
						class="bg-green-600 hover:bg-green-700 text-white py-4 px-8 rounded-full text-2xl font-bold transition-colors">
						🏁 Aloita Turnaus!
					</button>
				</div>
			</div>
		</div>
	`
})
export class RouletteComponent implements OnInit, OnDestroy {
	displayPlayers: string[] = [];
	groups: string[][] = [];
	lockedPlayers: number[] = [];
	lockedGroupPlayers: {[groupIndex: number]: number[]} = {};
	currentTitle = 'Sekoitetaan pelaajia...';
	currentDescription = 'Arvotaan turnausasetelma';
	allLocked = false;

	confettiPieces: {x: number, y: number, color: string}[] = [];
	private intervals: any[] = [];
	private rollingNames: string[][] = [];
	private rollingGroups: string[][][] = [];

	confettiColors = ['#fbbf24', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6', '#f59e0b'];

	constructor(protected tournamentService: TournamentService) {}

	ngOnInit(): void {
		this.setupAnimation();
		this.startAnimation();
	}

	ngOnDestroy(): void {
		this.intervals.forEach(interval => clearInterval(interval));
	}

	private setupAnimation(): void {
		if (this.tournamentService.tournamentType === 'round-robin') {
			this.setupRoundRobinAnimation();
		} else {
			this.setupGroupAnimation();
		}
		this.startConfetti();
	}

	private setupRoundRobinAnimation(): void {
		this.currentDescription = this.tournamentService.players.length === 3
			? 'Arvotaan finaalin pelausjärjestys'
			: 'Arvotaan pelausjärjestys karsintoihin';

		// Shuffle players for final order
		this.displayPlayers = [...this.tournamentService.players.map(p => p.name)]
			.sort(() => Math.random() - 0.5);

		this.rollingNames = this.displayPlayers.map(() =>
			[...this.displayPlayers].sort(() => Math.random() - 0.5)
		);
	}

	private setupGroupAnimation(): void {
		this.currentDescription = this.tournamentService.tournamentType === 'groups-3'
			? 'Muodostetaan 3 lohkoa ja arvotaan ryhmät'
			: 'Muodostetaan lohkot ja arvotaan ryhmät';

		const playerNames = this.tournamentService.players.map(p => p.name);
		const shuffled = [...playerNames].sort(() => Math.random() - 0.5);
		const groupCount = this.tournamentService.tournamentType === 'groups-3' ? 3 : 2;
		const groupSize = Math.ceil(shuffled.length / groupCount);

		this.groups = [];
		for (let i = 0; i < groupCount; i++) {
			const start = i * groupSize;
			const end = Math.min(start + groupSize, shuffled.length);
			this.groups.push(shuffled.slice(start, end));
		}

		// Create rolling names for each group position
		this.rollingGroups = this.groups.map(group =>
			group.map(() => [...playerNames].sort(() => Math.random() - 0.5))
		);

		// Initialize locked states for groups
		this.groups.forEach((_, groupIndex) => {
			this.lockedGroupPlayers[groupIndex] = [];
		});
	}

	private startAnimation(): void {
		if (this.tournamentService.tournamentType === 'round-robin') {
			this.startRoundRobinAnimation();
		} else {
			this.startGroupAnimation();
		}
	}

	private startRoundRobinAnimation(): void {
		this.intervals.push(setInterval(() => {
			this.rollingNames.forEach((names, index) => {
				if (!this.lockedPlayers.includes(index)) {
					names.push(names.shift()!);
				}
			});
		}, 150));

		setTimeout(() => this.lockPlayersSequentially(), 2000);
	}

	private startGroupAnimation(): void {
		this.intervals.push(setInterval(() => {
			this.rollingGroups.forEach((group, groupIndex) => {
				group.forEach((names, playerIndex) => {
					if (!this.isGroupPlayerLocked(groupIndex, playerIndex)) {
						names.push(names.shift()!);
					}
				});
			});
		}, 150));

		setTimeout(() => this.lockGroupsSequentially(), 2000);
	}

	private lockPlayersSequentially(): void {
		const lockInterval = setInterval(() => {
			if (this.lockedPlayers.length < this.displayPlayers.length) {
				this.lockedPlayers.push(this.lockedPlayers.length);

				if (this.lockedPlayers.length === this.displayPlayers.length) {
					this.currentTitle = 'Pelausjärjestys arvottu!';
					this.currentDescription = this.tournamentService.players.length === 3
						? 'Finaalin järjestys on valmis'
						: 'Turnausasetelma on valmis';
					this.allLocked = true;
					clearInterval(lockInterval);

					// Update the actual tournament service with the shuffled order
					this.tournamentService.players = this.displayPlayers.map((name, index) => ({
						id: index + 1,
						name: name
					}));
					// Regenerate tournament structure with new order
					this.tournamentService.setupTournament();
				}
			}
		}, 600);

		this.intervals.push(lockInterval);
	}

	private lockGroupsSequentially(): void {
		let totalLocked = 0;
		const totalPlayers = this.groups.reduce((sum, group) => sum + group.length, 0);

		const lockInterval = setInterval(() => {
			if (totalLocked < totalPlayers) {
				// Find next unlocked position
				for (let groupIndex = 0; groupIndex < this.groups.length; groupIndex++) {
					const group = this.groups[groupIndex];
					const lockedInGroup = this.lockedGroupPlayers[groupIndex].length;

					if (lockedInGroup < group.length) {
						this.lockedGroupPlayers[groupIndex].push(lockedInGroup);
						totalLocked++;
						break;
					}
				}

				if (totalLocked === totalPlayers) {
					this.currentTitle = this.tournamentService.tournamentType === 'groups-3'
						? '3 lohkoa muodostettu!'
						: 'Lohkot muodostettu!';
					this.currentDescription = this.tournamentService.tournamentType === 'groups-3'
						? 'Kaikki pelaajat on jaettu kolmeen lohkoon'
						: 'Kaikki pelaajat on jaettu lohkoihin';
					this.allLocked = true;
					clearInterval(lockInterval);

					// Update tournament service with group assignments
					this.groups.forEach((group, groupIndex) => {
						group.forEach(playerName => {
							const player = this.tournamentService.players.find(p => p.name === playerName);
							if (player) {
								player.group = groupIndex + 1;
							}
						});
					});
					// Regenerate tournament structure
					this.tournamentService.setupTournament();
				}
			}
		}, 500);

		this.intervals.push(lockInterval);
	}

	private startConfetti(): void {
		const confettiInterval = setInterval(() => {
			if (this.confettiPieces.length > 30) {
				this.confettiPieces.shift();
			}

			this.confettiPieces.push({
				x: Math.random() * window.innerWidth,
				y: Math.random() * 100,
				color: this.confettiColors[Math.floor(Math.random() * this.confettiColors.length)]
			});
		}, 300);

		this.intervals.push(confettiInterval);
	}

	getDisplayName(index: number): string {
		if (this.lockedPlayers.includes(index)) {
			return this.displayPlayers[index];
		}
		return this.rollingNames[index]?.[0] || this.displayPlayers[index];
	}

	getGroupDisplayName(groupIndex: number, playerIndex: number): string {
		if (this.isGroupPlayerLocked(groupIndex, playerIndex)) {
			return this.groups[groupIndex][playerIndex];
		}
		return this.rollingGroups[groupIndex]?.[playerIndex]?.[0] || this.groups[groupIndex][playerIndex];
	}

	isGroupPlayerLocked(groupIndex: number, playerIndex: number): boolean {
		return this.lockedGroupPlayers[groupIndex]?.includes(playerIndex) || false;
	}

	startTournament(): void {
		this.tournamentService.startTournament();
	}
}
