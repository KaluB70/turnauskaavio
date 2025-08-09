import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TournamentService } from '../../services/tournament.service';
import { DriveService } from '../../services/drive.service';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

@Component({
	selector: 'app-settings',
	standalone: true,
	imports: [ CommonModule, FormsModule ],
	styles: [ `
		.settings-bg {
			background: linear-gradient(135deg, #0f172a 0%, #1e293b 25%, #334155 75%, #475569 100%);
			min-height: 100vh;
			position: relative;
			overflow: hidden;
		}
		.settings-bg::before {
			content: '';
			position: absolute;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			background:
				radial-gradient(circle at 20% 20%, rgba(99, 102, 241, 0.15) 0%, transparent 50%),
				radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.15) 0%, transparent 50%);
		}
		.glass-card {
			background: rgba(255, 255, 255, 0.1);
			backdrop-filter: blur(20px);
			border: 1px solid rgba(255, 255, 255, 0.2);
			box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
		}
		.input-field {
			transition: all 0.2s ease;
			border: 2px solid transparent;
			background: rgba(255, 255, 255, 0.1);
			backdrop-filter: blur(10px);
			color: white;
		}
		.input-field:focus {
			border-color: #6366f1;
			box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
			background: rgba(255, 255, 255, 0.15);
		}
		.input-field::placeholder {
			color: rgba(255, 255, 255, 0.6);
		}
		.modern-btn {
			transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
			position: relative;
			overflow: hidden;
		}
		.modern-btn::before {
			content: '';
			position: absolute;
			top: 50%;
			left: 50%;
			width: 0;
			height: 0;
			background: rgba(255, 255, 255, 0.2);
			border-radius: 50%;
			transition: all 0.3s ease;
			transform: translate(-50%, -50%);
		}
		.modern-btn:hover:not(:disabled)::before {
			width: 300px;
			height: 300px;
		}
		.modern-btn:hover:not(:disabled) {
			transform: translateY(-1px);
			box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
		}
	` ],
	template: `
		<div class="settings-bg min-h-screen relative">
			<div class="container mx-auto px-4 py-8 max-w-3xl relative z-20">
				<h1 class="text-4xl font-bold text-center mb-8 text-white">⚙️ Asetukset</h1>

				<div class="glass-card p-8 rounded-2xl shadow-xl mb-8">
					<h2 class="text-2xl font-semibold mb-6 text-white">Google Drive Integration</h2>

					<div class="mb-6">
						<label for="fileId" class="block text-sm font-medium text-slate-300 mb-3">
							Drive File ID (valinnainen):
						</label>
						<input
							id="fileId"
							type="text"
							[(ngModel)]="fileId"
							placeholder="1ABC...XYZ (Google Drive JSON file ID)"
							class="input-field w-full p-4 rounded-xl focus:outline-none">
						<p class="text-xs text-slate-400 mt-2">
							Google Drive JSON-tiedoston ID (jos haluat ladata tiettyä tiedostoa)
						</p>
					</div>

					<div class="mb-6">
						<label for="apiKey" class="block text-sm font-medium text-slate-300 mb-3">
							API Key:
						</label>
						<input
							id="apiKey"
							type="text"
							[(ngModel)]="apiKey"
							placeholder="Google Cloud API Key"
							class="input-field w-full p-4 rounded-xl focus:outline-none">
						<p class="text-xs text-slate-400 mt-2">
							Google Cloud API key (Drive API:lle)
						</p>
					</div>

					<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
						<button
							(click)="testConnection()"
							[disabled]="!apiKey || testing"
							class="modern-btn bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-3 rounded-xl font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed relative z-10">
							{{ testing ? 'Testataan...' : 'Testaa yhteys' }}
						</button>

						<button
							(click)="saveConfig()"
							[disabled]="!apiKey"
							class="modern-btn bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-4 py-3 rounded-xl font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed relative z-10">
							Tallenna asetukset
						</button>

						<button
							(click)="loadFromDrive()"
							[disabled]="!isConfigured || loading"
							class="modern-btn bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-3 rounded-xl font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed relative z-10">
							{{ loading ? 'Ladataan...' : 'Lataa Drive:sta' }}
						</button>

						<button
							(click)="generateShareableLink()"
							[disabled]="!apiKey"
							class="modern-btn bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-3 rounded-xl font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed relative z-10">
							🔗 Luo jaettava linkki
						</button>
					</div>

					<div class="mb-6 p-4 bg-white/10 rounded-xl backdrop-blur-sm">
						<p class="text-sm text-slate-300">
							<strong class="text-white">Paikallista dataa:</strong> {{ getLocalDataInfo() }}
						</p>
					</div>

					<div *ngIf="statusMessage"
					     class="p-4 rounded-xl mb-6 backdrop-blur-sm"
					     [class.bg-emerald-500]="statusType === 'success'"
					     [class.bg-red-500]="statusType === 'error'"
					     [class.bg-indigo-500]="statusType === 'info'"
					     [class.border-emerald-400]="statusType === 'success'"
					     [class.border-red-400]="statusType === 'error'"
					     [class.border-indigo-400]="statusType === 'info'"
					     style="border-width: 1px; border-style: solid;">
						<p [class.text-emerald-200]="statusType === 'success'"
						   [class.text-red-200]="statusType === 'error'"
						   [class.text-indigo-200]="statusType === 'info'">
							{{ statusMessage }}
					</p>
					</div>
				</div>

				<div class="glass-card p-8 rounded-2xl shadow-xl mb-8">
					<h2 class="text-2xl font-semibold mb-6 text-white">📁 Import / Export</h2>

					<div class="mb-6 p-4 bg-indigo-500/20 rounded-xl backdrop-blur-sm border border-indigo-400/30">
						<p class="text-sm text-indigo-200">
							<strong class="text-white">Paikallista dataa:</strong> {{ getLocalDataInfo() }}<br>
							<strong class="text-white">Aktiivisia turnauksia:</strong> {{ getActiveTournamentCount() }} kpl
						</p>
					</div>

					<div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
						<button
							(click)="exportData()"
							class="modern-btn bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-4 py-3 rounded-xl font-semibold shadow-lg relative z-10">
							💾 Vie data (JSON)
						</button>

						<label
							class="modern-btn bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-3 rounded-xl font-semibold shadow-lg cursor-pointer text-center relative z-10">
							📁 Tuo data (JSON)
							<input type="file" accept=".json" (change)="importData($event)" class="hidden">
						</label>

						<button
							(click)="clearAllData()"
							class="modern-btn bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-3 rounded-xl font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed relative z-10"
							[disabled]="clearing">
							🗑️ {{ clearing ? 'Tyhjennetään...' : 'Tyhjennä kaikki' }}
						</button>
					</div>
				</div>

				<div class="text-center">
					<button
						(click)="goBack()"
						class="modern-btn glass-card text-white px-6 py-3 rounded-xl font-semibold shadow-lg relative z-10">
						← Takaisin
					</button>
				</div>
			</div>
		</div>
	`
})
export class SettingsComponent {
	fileId = '';
	apiKey = '';
	testing = false;
	loading = false;
	statusMessage = '';
	statusType: 'success' | 'error' | 'info' = 'info';
	isConfigured = false;
	clearing = false;

	constructor(
		private tournamentService: TournamentService,
		private driveService: DriveService,
		private router: Router
	) {
		this.loadSavedConfig();
		this.loadFromUrl();
	}

	private loadSavedConfig(): void {
		const config = this.tournamentService.loadDriveConfig();
		if (config) {
			this.fileId = config.fileId || '';
			this.apiKey = config.apiKey || '';
			this.isConfigured = !!this.apiKey;

			if (this.isConfigured) {
				this.tournamentService.configureGoogleDrive(this.apiKey, this.fileId);
			}
		}
	}

	async testConnection(): Promise<void> {
		if (!this.apiKey) {
			this.showStatus('Syötä API Key', 'error');
			return;
		}

		this.testing = true;
		this.statusMessage = '';

		try {
			// Configure temporarily for testing
			this.driveService.setConfig({
				apiKey: this.apiKey,
				fileId: this.fileId
			});

			const success = await firstValueFrom(this.driveService.testConnection());

			if (success) {
				this.showStatus('✅ Yhteys Google Drive API:in onnistui!', 'success');
			} else {
				this.showStatus('❌ Yhteys epäonnistui. Tarkista API Key ja oikeudet.', 'error');
			}
		} catch (error) {
			this.showStatus('❌ Virhe yhteydessä: ' + error, 'error');
		} finally {
			this.testing = false;
		}
	}

	saveConfig(): void {
		if (!this.apiKey) {
			this.showStatus('Syötä API Key', 'error');
			return;
		}

		const config = {
			fileId: this.fileId,
			apiKey: this.apiKey
		};

		localStorage.setItem('drive_config', JSON.stringify(config));
		this.tournamentService.configureGoogleDrive(this.apiKey, this.fileId);
		this.isConfigured = true;

		this.showStatus('✅ Asetukset tallennettu!', 'success');
	}

	async loadFromDrive(): Promise<void> {
		this.loading = true;
		this.statusMessage = '';

		try {
			const beforeCount = this.tournamentService.weekResults.length;
			await this.tournamentService.loadSeasonDataFromDrive();
			const afterCount = this.tournamentService.weekResults.length;

			const newWeeksLoaded = afterCount - beforeCount;
			let message = '✅ Data ladattu Google Drive:sta!';

			if (newWeeksLoaded > 0) {
				message += ` ${newWeeksLoaded} uutta viikkoa lisätty.`;
			} else {
				message += ' Ei uutta dataa.';
			}

			message += ' Data tallennettu paikallisesti.';

			this.showStatus(message, 'success');
		} catch (error) {
			this.showStatus('❌ Datan lataus epäonnistui: ' + error, 'error');
		} finally {
			this.loading = false;
		}
	}

	private showStatus(message: string, type: 'success' | 'error' | 'info'): void {
		this.statusMessage = message;
		this.statusType = type;

		// Clear status after 5 seconds
		setTimeout(() => {
			this.statusMessage = '';
		}, 5000);
	}

	getLocalDataInfo(): string {
		const weekCount = this.tournamentService.weekResults.length;
		if (weekCount === 0) {
			return 'Ei tallennettuja viikkoja';
		}
		return `${weekCount} viikkoa tallennettu`;
	}

	getActiveTournamentCount(): number {
		return this.tournamentService.getActiveTournaments().length;
	}

	exportData(): void {
		try {
			const exportData = {
				weekResults: this.tournamentService.weekResults,
				activeTournaments: this.getActiveTournamentsFullData(),
				exportDate: new Date().toISOString(),
				version: '1.0'
			};

			const dataStr = JSON.stringify(exportData, null, 2);
			const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

			const exportFileDefaultName = `darts-data-${new Date().toISOString().split('T')[0]}.json`;

			const linkElement = document.createElement('a');
			linkElement.setAttribute('href', dataUri);
			linkElement.setAttribute('download', exportFileDefaultName);
			linkElement.click();

			this.showStatus('✅ Data viety onnistuneesti!', 'success');
		} catch (error) {
			this.showStatus('❌ Datan vienti epäonnistui: ' + error, 'error');
		}
	}


	importData(event: any): void {
		const file = event.target.files[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (e) => {
			try {
				const data = JSON.parse(e.target?.result as string);

				// Validate data structure
				if (!data.weekResults || !Array.isArray(data.weekResults)) {
					this.showStatus('❌ Virheellinen tiedostomuoto', 'error');
					return;
				}

				// Confirm import
				const confirmMsg = `Tuodaan ${data.weekResults.length} viikon data. Tämä korvaa nykyisen datan. Jatketaanko?`;
				if (!confirm(confirmMsg)) {
					this.showStatus('Tuonti peruutettu', 'info');
					return;
				}

				// Import week results
				this.tournamentService.weekResults = data.weekResults.map((week: any) => ({
					...week,
					date: new Date(week.date),
					matches: week.matches || [] // Add backwards compatibility
				}));
				this.tournamentService.saveWeekResults();

				// Import active tournaments if they exist
				if (data.activeTournaments) {
					this.importActiveTournaments(data.activeTournaments);
				}

				// Populate recent players from imported data
				this.tournamentService.populateRecentPlayersFromData();

				this.showStatus(`✅ ${data.weekResults.length} viikon data tuotu onnistuneesti!`, 'success');

			} catch (error) {
				this.showStatus('❌ Tiedoston luku epäonnistui: ' + error, 'error');
			}

			// Reset file input
			event.target.value = '';
		};

		reader.readAsText(file);
	}

	async clearAllData(): Promise<void> {
		const confirmMsg = 'Tämä poistaa KAIKEN datan (viikkotulokset ja aktiiviset turnaukset). Oletko varma?';
		if (!confirm(confirmMsg)) {
			return;
		}

		const doubleConfirm = 'Viimeinen varoitus! Kaikki data poistetaan pysyvästi. Jatketaanko?';
		if (!confirm(doubleConfirm)) {
			return;
		}

		this.clearing = true;

		try {
			// Clear week results
			this.tournamentService.weekResults = [];
			this.tournamentService.saveWeekResults();

			// Clear active tournaments
			localStorage.removeItem('darts_tournaments');
			localStorage.removeItem('darts_recent_players');

			this.showStatus('✅ Kaikki data poistettu!', 'success');

		} catch (error) {
			this.showStatus('❌ Datan poisto epäonnistui: ' + error, 'error');
		} finally {
			this.clearing = false;
		}
	}

	private getActiveTournamentsFullData(): any[] {
		try {
			const saved = localStorage.getItem('darts_tournaments');
			return saved ? JSON.parse(saved) : [];
		} catch (error) {
			console.error('Error reading active tournaments:', error);
			return [];
		}
	}

	private importActiveTournaments(tournaments: any): void {
		try {
			localStorage.setItem('darts_tournaments', JSON.stringify(tournaments));
		} catch (error) {
			console.warn('Failed to import active tournaments:', error);
		}
	}

	private formatDateToFinnish(date: Date): string {
		return `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`;
	}

	generateShareableLink(): void {
		if (!this.apiKey) {
			this.showStatus('Syötä API Key ensin', 'error');
			return;
		}

		const baseUrl = window.location.origin + window.location.pathname;
		let shareUrl = `${baseUrl}#/settings?key=${encodeURIComponent(this.apiKey)}`;

		if (this.fileId) {
			shareUrl += `&fid=${encodeURIComponent(this.fileId)}`;
		}

		// Copy to clipboard
		navigator.clipboard.writeText(shareUrl).then(() => {
			this.showStatus('📋 Jaettava linkki kopioitu leikepöydälle!', 'success');
		}).catch(() => {
			// Fallback for older browsers
			const textArea = document.createElement('textarea');
			textArea.value = shareUrl;
			document.body.appendChild(textArea);
			textArea.select();
			document.execCommand('copy');
			document.body.removeChild(textArea);
			this.showStatus('📋 Jaettava linkki kopioitu!', 'success');
		});
	}

	private loadFromUrl(): void {
		// Parse URL parameters for file ID and API key
		const urlParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
		const fidFromUrl = urlParams.get('fid');
		const sidFromUrl = urlParams.get('sid'); // backward compatibility
		const keyFromUrl = urlParams.get('key');

		if (keyFromUrl) {
			this.apiKey = keyFromUrl;
			this.fileId = fidFromUrl || sidFromUrl || ''; // prefer fid, fallback to sid for compatibility

			let message = '🔗 API Key ladattu linkistä';
			if (this.fileId) {
				message += ' ja File ID';
			}
			this.showStatus(message, 'info');

			// Auto-save and load data
			setTimeout(async () => {
				this.saveConfig();
				await this.loadFromDrive();
			}, 1000);
		}
	}

	goBack(): void {
		this.router.navigate([ '/' ]);
	}
}
