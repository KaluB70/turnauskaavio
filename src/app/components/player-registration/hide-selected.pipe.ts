import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'hideSelected',
  standalone: true
})
export class HideSelectedPipe implements PipeTransform {

  transform(allRecentPlayers: string[], chosenPlayers: string[]): string[] {
    return allRecentPlayers.filter(player => !chosenPlayers.includes(player));
  }

}
