import {Component} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {TournamentService} from '../../services/tournament.service';
import {DriveService} from '../../services/drive.service';
import {Router} from '@angular/router';
import {firstValueFrom} from 'rxjs';

@Component({
	selector: 'app-settings',
	standalone: true,
	imports: [CommonModule, FormsModule],
	template: `
		<div class="container mx-auto px-4 py-8 max-w-2xl">
			<h1 class="text-3xl font-bold text-center mb-8">⚙️ Asetukset</h1>

			<div class="bg-white p-6 rounded-lg shadow-lg mb-6">
				<h2 class="text-xl font-semibold mb-4">Google Drive Integration</h2>

				<div class="mb-4">
					<label for="fileId" class="block text-sm font-medium text-gray-700 mb-2">
						Drive File ID (valinnainen):
					</label>
					<input
						id="fileId"
						type="text"
						[(ngModel)]="fileId"
						placeholder="1ABC...XYZ (Google Drive JSON file ID)"
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
					<p class="text-xs text-gray-500 mt-1">
						Google Drive JSON-tiedoston ID (jos haluat ladata tiettyä tiedostoa)
					</p>
				</div>

				<div class="mb-4">
					<label for="apiKey" class="block text-sm font-medium text-gray-700 mb-2">
						API Key:
					</label>
					<input
						id="apiKey"
						type="text"
						[(ngModel)]="apiKey"
						placeholder="Google Cloud API Key"
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
					<p class="text-xs text-gray-500 mt-1">
						Google Cloud API key (Drive API:lle)
					</p>
				</div>

				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
					<button
						(click)="testConnection()"
						[disabled]="!apiKey || testing"
						class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap">
						{{ testing ? 'Testataan...' : 'Testaa yhteys' }}
					</button>

					<button
						(click)="saveConfig()"
						[disabled]="!apiKey"
						class="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed">
						Tallenna asetukset
					</button>

					<button
						(click)="loadFromDrive()"
						[disabled]="!isConfigured || loading"
						class="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap">
						{{ loading ? 'Ladataan...' : 'Lataa Drive:sta' }}
					</button>

					<button
						(click)="generateShareableLink()"
						[disabled]="!apiKey"
						class="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed">
						🔗 Luo jaettava linkki
					</button>
				</div>

				<div class="mb-4 p-3 bg-gray-50 rounded-md">
					<p class="text-sm text-gray-600">
						<strong>Paikallista dataa:</strong> {{ getLocalDataInfo() }}
					</p>
				</div>

				<div *ngIf="statusMessage"
				     class="p-3 rounded-md mb-4"
				     [class.bg-green-100]="statusType === 'success'"
				     [class.bg-red-100]="statusType === 'error'"
				     [class.bg-blue-100]="statusType === 'info'">
					<p [class.text-green-700]="statusType === 'success'"
					   [class.text-red-700]="statusType === 'error'"
					   [class.text-blue-700]="statusType === 'info'">
						{{ statusMessage }}
					</p>
				</div>
			</div>

			<div class="bg-white p-6 rounded-lg shadow-lg mb-6">
				<h2 class="text-xl font-semibold mb-4">📁 Import / Export</h2>

				<div class="mb-4 p-3 bg-blue-50 rounded-md">
					<p class="text-sm text-blue-700">
						<strong>Paikallista dataa:</strong> {{ getLocalDataInfo() }}<br>
						<strong>Aktiivisia turnauksia:</strong> {{ getActiveTournamentCount() }} kpl
					</p>
				</div>

				<div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
					<button
						(click)="exportData()"
						class="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
						💾 Vie data (JSON)
					</button>

					<label
						class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 cursor-pointer text-center">
						📁 Tuo data (JSON)
						<input type="file" accept=".json" (change)="importData($event)" class="hidden">
					</label>

					<button
						(click)="clearAllData()"
						class="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 whitespace-nowrap"
						[disabled]="clearing">
						🗑️ {{ clearing ? 'Tyhjennetään...' : 'Tyhjennä kaikki' }}
					</button>
				</div>
			</div>

			<div class="text-center">
				<button
					(click)="goBack()"
					class="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700">
					← Takaisin
				</button>
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
		this.router.navigate(['/']);
	}
}
