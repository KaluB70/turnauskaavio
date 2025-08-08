import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable, catchError, of} from 'rxjs';
import {map} from 'rxjs/operators';

export interface DriveConfig {
	apiKey: string;
	fileId?: string; // JSON file ID in Google Drive
}

export interface DriveFileContent {
	weekResults: any[];
	exportDate: string;
	version: string;
	[key: string]: any;
}

@Injectable({
	providedIn: 'root'
})
export class DriveService {
	private config: DriveConfig | null = null;

	constructor(private http: HttpClient) {
	}

	setConfig(config: DriveConfig): void {
		this.config = config;
	}

	/**
	 * Fetch JSON content from a Google Drive file
	 * @param fileId The Google Drive file ID (optional, uses config.fileId if not provided)
	 */
	fetchFileContent(fileId?: string): Observable<DriveFileContent | null> {
		if (!this.config?.apiKey) {
			console.warn('Google Drive not configured - missing API key');
			return of(null);
		}

		const targetFileId = fileId || this.config.fileId;
		if (!targetFileId) {
			console.warn('Google Drive not configured - missing file ID');
			return of(null);
		}

		const url = `https://www.googleapis.com/drive/v3/files/${targetFileId}?alt=media&key=${this.config.apiKey}`;

		return this.http.get<DriveFileContent>(url).pipe(
			map(response => response),
			catchError(error => {
				console.error('Failed to fetch Drive file:', error);
				return of(null);
			})
		);
	}

	/**
	 * List files in a specific Drive folder (optional)
	 * @param folderId The Google Drive folder ID to search in
	 * @param nameContains Filter files by name containing this string
	 */
	listFiles(folderId?: string, nameContains?: string): Observable<any[]> {
		if (!this.config?.apiKey) {
			console.warn('Google Drive not configured');
			return of([]);
		}

		let query = '';
		if (folderId) {
			query = `'${folderId}' in parents and `;
		}
		if (nameContains) {
			query += `name contains '${nameContains}' and `;
		}
		query += `mimeType='application/json' and trashed=false`;

		const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&key=${this.config.apiKey}`;

		return this.http.get<any>(url).pipe(
			map(response => response.files || []),
			catchError(error => {
				console.error('Failed to list Drive files:', error);
				return of([]);
			})
		);
	}

	/**
	 * Test connection to Google Drive API
	 */
	testConnection(): Observable<boolean> {
		if (!this.config?.apiKey) {
			return of(false);
		}

		// If we have a specific file ID, test access to that file
		if (this.config.fileId) {
			return this.getFileMetadata(this.config.fileId).pipe(
				map(metadata => !!metadata),
				catchError(() => of(false))
			);
		}

		// Otherwise, just test the API key with a simple about endpoint
		const url = `https://www.googleapis.com/drive/v3/about?fields=kind&key=${this.config.apiKey}`;

		return this.http.get(url).pipe(
			map(() => true),
			catchError(() => of(false))
		);
	}

	/**
	 * Get file metadata from Google Drive
	 * @param fileId The Google Drive file ID
	 */
	getFileMetadata(fileId: string): Observable<any> {
		if (!this.config?.apiKey) {
			return of(null);
		}

		const url = `https://www.googleapis.com/drive/v3/files/${fileId}?key=${this.config.apiKey}`;

		return this.http.get(url).pipe(
			catchError(error => {
				console.error('Failed to get file metadata:', error);
				return of(null);
			})
		);
	}
}