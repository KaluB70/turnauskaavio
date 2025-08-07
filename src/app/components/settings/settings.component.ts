import {Component} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {TournamentService} from '../../services/tournament.service';
import {SheetsService} from '../../services/sheets.service';
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
				<h2 class="text-xl font-semibold mb-4">Google Sheets Integration - ÄLÄ KOSKE :)</h2>

				<div class="mb-4">
					<label for="spreadsheetId" class="block text-sm font-medium text-gray-700 mb-2">
						Spreadsheet ID:
					</label>
					<input
						id="spreadsheetId"
						type="text"
						[(ngModel)]="spreadsheetId"
						placeholder="1ABC...XYZ (from Google Sheets URL)"
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
					<p class="text-xs text-gray-500 mt-1">
						Kopioi Google Sheets URL:sta (osa /spreadsheets/d/<strong>TÄMÄ_OSA</strong>/edit)
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
						Google Cloud API key
					</p>
				</div>

				<div class="flex gap-3 mb-4">
					<button
						(click)="testConnection()"
						[disabled]="!spreadsheetId || testing"
						class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
						{{ testing ? 'Testataan...' : 'Testaa yhteys' }}
					</button>

					<button
						(click)="saveConfig()"
						[disabled]="!spreadsheetId"
						class="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed">
						Tallenna asetukset
					</button>

					<button
						(click)="loadFromSheets()"
						[disabled]="!isConfigured || loading"
						class="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed">
						{{ loading ? 'Ladataan...' : 'Lataa dataa' }}
					</button>

					<button
						(click)="generateShareableLink()"
						[disabled]="!spreadsheetId"
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

				<div class="grid grid-cols-2 gap-3 mb-4">
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
						(click)="exportCSV()"
						class="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700">
						📊 Vie CSV
					</button>

					<button
						(click)="clearAllData()"
						class="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
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
	spreadsheetId = '';
	apiKey = '';
	testing = false;
	loading = false;
	statusMessage = '';
	statusType: 'success' | 'error' | 'info' = 'info';
	isConfigured = false;
	clearing = false;

	constructor(
		private tournamentService: TournamentService,
		private sheetsService: SheetsService,
		private router: Router
	) {
		this.loadSavedConfig();
		this.loadFromUrl();
	}

	private loadSavedConfig(): void {
		const saved = localStorage.getItem('sheets_config');
		if (saved) {
			try {
				const config = JSON.parse(saved);
				this.spreadsheetId = config.spreadsheetId || '';
				this.apiKey = config.apiKey || '';
				this.isConfigured = !!this.spreadsheetId;

				if (this.isConfigured) {
					this.tournamentService.configureGoogleSheets(this.spreadsheetId, this.apiKey);
				}
			} catch (error) {
				console.error('Error loading sheets config:', error);
			}
		}
	}

	async testConnection(): Promise<void> {
		if (!this.spreadsheetId) {
			this.showStatus('Syötä Spreadsheet ID', 'error');
			return;
		}

		this.testing = true;
		this.statusMessage = '';

		try {
			// Configure temporarily for testing
			this.sheetsService.setConfig({
				spreadsheetId: this.spreadsheetId,
				apiKey: this.apiKey
			});

			const success = await firstValueFrom(this.sheetsService.testConnection());

			if (success) {
				this.showStatus('✅ Yhteys Google Sheetsiin onnistui!', 'success');
			} else {
				this.showStatus('❌ Yhteys epäonnistui. Tarkista Spreadsheet ID ja julkisuus asetukset.', 'error');
			}
		} catch (error) {
			this.showStatus('❌ Virhe yhteydessä: ' + error, 'error');
		} finally {
			this.testing = false;
		}
	}

	saveConfig(): void {
		if (!this.spreadsheetId) {
			this.showStatus('Syötä Spreadsheet ID', 'error');
			return;
		}

		const config = {
			spreadsheetId: this.spreadsheetId,
			apiKey: this.apiKey
		};

		localStorage.setItem('sheets_config', JSON.stringify(config));
		this.tournamentService.configureGoogleSheets(this.spreadsheetId, this.apiKey);
		this.isConfigured = true;

		this.showStatus('✅ Asetukset tallennettu!', 'success');
	}

	async loadFromSheets(): Promise<void> {
		this.loading = true;
		this.statusMessage = '';

		try {
			const beforeCount = this.tournamentService.weekResults.length;
			await this.tournamentService.loadSeasonDataFromSheets();
			const afterCount = this.tournamentService.weekResults.length;

			const newWeeksLoaded = afterCount - beforeCount;
			let message = '✅ Data ladattu Google Sheetsista!';

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

	exportCSV(): void {
		try {
			if (this.tournamentService.weekResults.length === 0) {
				this.showStatus('❌ Ei dataa vietäväksi', 'error');
				return;
			}

			// Create CSV with the same format as expected by Google Sheets
			let csvContent = 'Viikko,Pvm,Pelaajia,Pelimuoto,Sija,Pelaaja,Pisteet\n';

			this.tournamentService.weekResults.forEach(week => {
				const dateStr = this.formatDateToFinnish(week.date);
				const playerCount = week.players.length;

				week.finalRanking.forEach(ranking => {
					// Ensure playerName is a string and escape any commas by wrapping in quotes
					const playerName = String(ranking.playerName || '');
					const escapedPlayerName = playerName.includes(',')
						? `"${playerName.replace(/"/g, '""')}"`
						: playerName;
					csvContent += `${week.weekNumber},${dateStr},${playerCount},${week.gameMode},${ranking.position},${escapedPlayerName},${ranking.points}\n`;
				});
			});

			// Add UTF-8 BOM for proper encoding in Excel and other spreadsheet applications
			const BOM = '\uFEFF';
			const csvWithBOM = BOM + csvContent;

			// Create blob with proper UTF-8 encoding
			const blob = new Blob([csvWithBOM], {type: 'text/csv;charset=utf-8;'});
			const url = window.URL.createObjectURL(blob);

			const exportFileDefaultName = `darts-results-${new Date().toISOString().split('T')[0]}.csv`;

			const linkElement = document.createElement('a');
			linkElement.setAttribute('href', url);
			linkElement.setAttribute('download', exportFileDefaultName);
			linkElement.click();

			// Clean up the URL object
			window.URL.revokeObjectURL(url);

			this.showStatus('✅ CSV viety onnistuneesti!', 'success');
		} catch (error) {
			this.showStatus('❌ CSV vienti epäonnistui: ' + error, 'error');
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
					date: new Date(week.date)
				}));
				this.tournamentService.saveWeekResults();

				// Import active tournaments if they exist
				if (data.activeTournaments) {
					this.importActiveTournaments(data.activeTournaments);
				}

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
		if (!this.spreadsheetId) {
			this.showStatus('Syötä Spreadsheet ID ensin', 'error');
			return;
		}

		const baseUrl = window.location.origin + window.location.pathname;
		let shareUrl = `${baseUrl}#/settings?sid=${encodeURIComponent(this.spreadsheetId)}`;

		if (this.apiKey) {
			shareUrl += `&key=${encodeURIComponent(this.apiKey)}`;
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
		// Parse URL parameters for spreadsheet ID and API key
		const urlParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
		const sidFromUrl = urlParams.get('sid');
		const keyFromUrl = urlParams.get('key');

		if (sidFromUrl) {
			this.spreadsheetId = sidFromUrl;
			this.showStatus('🔗 Spreadsheet ID ladattu linkistä', 'info');

			if (keyFromUrl) {
				this.apiKey = keyFromUrl;
				this.showStatus('🔗 Spreadsheet ID ja API Key ladattu linkistä', 'info');
			}

			// Auto-save and load data
			setTimeout(async () => {
				this.saveConfig();
				await this.loadFromSheets();
			}, 1000);
		}
	}

	goBack(): void {
		this.router.navigate(['/']);
	}
}
