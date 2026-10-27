import { Component, inject } from '@angular/core';
import { ClubActual } from '../../../services/club-actual';

@Component({
  selector: 'app-club-selector',
  template: `
    @if (ctx.clubes().length > 1) {
      <div class="d-flex align-items-center gap-2">
        <label class="form-label mb-0" for="club-sel">Club</label>
        <select id="club-sel" class="form-select w-auto pe-5 text-truncate" [value]="ctx.club()?.id" (change)="ctx.elegir(+$any($event.target).value)">
          @for (c of ctx.clubes(); track c.id) { <option [value]="c.id">{{ c.denominacion }}</option> }
        </select>
      </div>
    }
  `,
})
export class ClubSelector {
  protected readonly ctx = inject(ClubActual);
}
