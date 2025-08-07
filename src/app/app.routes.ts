import {Routes} from '@angular/router';
import {HomeComponent} from './components/home/home.component';
import {TournamentComponent} from './components/tournament-view/tournament-view.component';
import {StandingsComponent} from './components/standings/standings.component';
import {SettingsComponent} from './components/settings/settings.component';

export const routes: Routes = [
	{
		path: '',
		component: HomeComponent
	},
	{
		path: 'standings',
		component: StandingsComponent
	},
	{
		path: 'settings',
		component: SettingsComponent
	},
	{
		path: 'tournament/:id',
		component: TournamentComponent
	},
	{
		path: '**',
		redirectTo: ''
	}
];
