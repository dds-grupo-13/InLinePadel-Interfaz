import { Pipe, PipeTransform } from '@angular/core';
import { hhmm } from './fechas';

@Pipe({ name: 'hhmm' })
export class HhmmPipe implements PipeTransform {
  transform(hora: string | null | undefined): string {
    return hhmm(hora);
  }
}
