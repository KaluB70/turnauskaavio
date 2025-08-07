import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable, catchError, of} from 'rxjs';
import {map} from 'rxjs/operators';

export interface SheetsConfig {
	spreadsheetId: string;
	apiKey?: string; // Optional: for rate limiting improvements
}

export interface SheetRow {
	[key: string]: string | number;
}

@Injectable({
	providedIn: 'root'
})
export class SheetsService {
	private config: SheetsConfig | null = null;

	constructor(private http: HttpClient) {
	}

	setConfig(config: SheetsConfig): void {
		this.config = config;
	}

	/**
	 * Fetch data from a Google Sheet tab
	 * @param sheetName The name of the sheet tab (e.g., 'WeekResults', 'Players')
	 * @param range Optional range (e.g., 'A1:Z100'), defaults to all data
	 */
	fetchSheetData(sheetName: string, range?: string): Observable<SheetRow[]> {
		if (!this.config?.spreadsheetId) {
			console.warn('Google Sheets not configured');
			return of([]);
		}

		const fullRange = range ? `${sheetName}!${range}` : sheetName;
		const apiKey = this.config.apiKey ? `&key=${this.config.apiKey}` : '';

		const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.config.spreadsheetId}/values/${fullRange}?majorDimension=ROWS${apiKey}`;

		return this.http.get<any>(url).pipe(
			map(response => this.parseSheetData(response)),
			catchError(error => {
				console.error('Failed to fetch sheet data:', error);
				return of([]);
			})
		);
	}

	private parseSheetData(response: any): SheetRow[] {
		if (!response.values || response.values.length === 0) {
			return [];
		}

		const rows = response.values;
		if (rows.length < 2) return []; // Need at least header + 1 data row

		const headers = rows[0];
		const dataRows = rows.slice(1);

		return dataRows.map((row: any[]) => {
			const obj: SheetRow = {};
			headers.forEach((header: string, index: number) => {
				const value = row[index] || '';
				// Try to parse as number if it looks numeric
				obj[header] = this.parseValue(value);
			});
			return obj;
		});
	}

	private parseValue(value: string): string | number {
		// Check if it's a number
		const numValue = Number(value);
		if (!isNaN(numValue) && value.trim() !== '') {
			return numValue;
		}

		return value;
	}

	/**
	 * Test connection to Google Sheets
	 */
	testConnection(): Observable<boolean> {
		if (!this.config?.spreadsheetId) {
			return of(false);
		}
		const apiKey = this.config.apiKey ? `?key=${this.config.apiKey}` : '';

		const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.config.spreadsheetId}${apiKey}`;

		return this.http.get(url).pipe(
			map(() => true),
			catchError(() => of(false))
		);
	}
}
