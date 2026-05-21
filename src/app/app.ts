import { Component, OnInit, signal, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BooksComponent } from './books/books';
import { MembersComponent } from './members/members';
import { RentalsComponent } from './rentals/rentals';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, BooksComponent, MembersComponent, RentalsComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
  encapsulation: ViewEncapsulation.None
})
export class App implements OnInit {
  activeTab = signal<'books' | 'members' | 'rentals'>('books');

  ngOnInit() {
  }
}
