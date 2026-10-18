import { Component, OnInit, inject, signal } from '@angular/core';
import { Club } from '../../models/club.model';
import { ClubService } from '../../services/club';

@Component({
  imports: [],
  selector: 'app-club-list',
  styleUrl: './club-list.css',
  templateUrl: './club-list.html',
})
export class ClubList implements OnInit {
  private readonly clubService = inject(ClubService);

  readonly clubes = signal<Club[]>([]);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.clubService.getAll().subscribe({
      next: (page) => this.clubes.set(page.results),
      error: () => this.error.set('No se pudieron cargar los clubes'),
    });
  }
}
