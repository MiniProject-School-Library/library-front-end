import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { BooksComponent } from './books';
import { LibraryService } from '../services/library_service';
import { of, throwError } from 'rxjs';

describe('BooksComponent', () => {
  let mockLibraryService: any;

  beforeEach(async () => {
    mockLibraryService = {
      getBooks: vi.fn().mockReturnValue(of([])),
      upsertBook: vi.fn(),
      deleteBook: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [BooksComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: LibraryService, useValue: mockLibraryService }
      ]
    }).compileComponents();
  });

  it('should create the component', () => {
    const fixture = TestBed.createComponent(BooksComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should fetch books on init', () => {
    const mockBooks = [
      { id: 1, bookCode: 'B001', title: 'Test Book', author: 'Author', publisher: 'Pub', publishYear: 2024, stock: 5, availableQty: 5 }
    ];
    mockLibraryService.getBooks.mockReturnValue(of(mockBooks));

    const fixture = TestBed.createComponent(BooksComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.books()).toEqual(mockBooks);
    expect(component.filteredBooks()).toEqual(mockBooks);
  });

  it('should filter books based on search query', () => {
    const mockBooks = [
      { id: 1, title: 'Angular Basics', author: 'John Doe', publisher: 'Pub A', publishYear: 2024, stock: 5 },
      { id: 2, title: 'Spring Boot Advanced', author: 'Jane Smith', publisher: 'Pub B', publishYear: 2024, stock: 3 }
    ];
    mockLibraryService.getBooks.mockReturnValue(of(mockBooks));

    const fixture = TestBed.createComponent(BooksComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.bookSearchQuery.set('Angular');
    fixture.detectChanges();
    expect(component.filteredBooks().length).toBe(1);
    expect(component.filteredBooks()[0].title).toBe('Angular Basics');

    component.bookSearchQuery.set('smith');
    fixture.detectChanges();
    expect(component.filteredBooks().length).toBe(1);
    expect(component.filteredBooks()[0].author).toBe('Jane Smith');
  });

  it('should show validation error when saving empty book', () => {
    const fixture = TestBed.createComponent(BooksComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.openAddBookModal();
    component.saveBook();

    expect(component.toastMessage()).toBe('Mohon lengkapi formulir buku!');
    expect(component.toastType()).toBe('error');
  });
});
