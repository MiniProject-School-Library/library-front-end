import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { RentalsComponent } from './rentals';
import { LibraryService, Rent } from '../services/library_service';
import { of } from 'rxjs';

describe('RentalsComponent', () => {
  let mockLibraryService: any;

  beforeEach(async () => {
    mockLibraryService = {
      getBooks: vi.fn().mockReturnValue(of([])),
      getMembers: vi.fn().mockReturnValue(of([])),
      getRents: vi.fn().mockReturnValue(of([])),
      rentBook: vi.fn(),
      returnBook: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [RentalsComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: LibraryService, useValue: mockLibraryService }
      ]
    }).compileComponents();
  });

  it('should create the component', () => {
    const fixture = TestBed.createComponent(RentalsComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should fetch books, members, and rents on init', () => {
    const mockBooks = [{ id: 1, title: 'Book 1', stock: 2, availableQty: 2 }];
    const mockMembers = [{ id: 1, name: 'Member 1' }];
    const mockRents: Rent[] = [{ id: 1, memberId: 1, bookId: 1, rentDate: '2026-05-20', status: 'RENTED' }];

    mockLibraryService.getBooks.mockReturnValue(of(mockBooks));
    mockLibraryService.getMembers.mockReturnValue(of(mockMembers));
    mockLibraryService.getRents.mockReturnValue(of(mockRents));

    const fixture = TestBed.createComponent(RentalsComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.books()).toEqual(mockBooks);
    expect(component.members()).toEqual(mockMembers);
    expect(component.rentals()).toEqual(mockRents);
  });

  it('should prevent renting if a member already has 3 active rents', () => {
    const mockBooks = [{ id: 1, title: 'Book 1', stock: 5, availableQty: 5 }];
    const mockMembers = [{ id: 1, name: 'Member 1' }];
    const mockRents: Rent[] = [
      { id: 1, memberId: 1, bookId: 2, rentDate: '2026-05-20', status: 'RENTED' },
      { id: 2, memberId: 1, bookId: 3, rentDate: '2026-05-20', status: 'RENTED' },
      { id: 3, memberId: 1, bookId: 4, rentDate: '2026-05-20', status: 'RENTED' }
    ];

    mockLibraryService.getBooks.mockReturnValue(of(mockBooks));
    mockLibraryService.getMembers.mockReturnValue(of(mockMembers));
    mockLibraryService.getRents.mockReturnValue(of(mockRents));

    const fixture = TestBed.createComponent(RentalsComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.openRentModal();
    component.rentForm.memberId.set(1);
    component.rentForm.bookId.set(1);
    component.saveRent();

    expect(component.toastMessage()).toBe('Gagal: Anggota ini telah meminjam batas maksimal 3 buku!');
    expect(component.toastType()).toBe('error');
  });

  it('should prevent renting if a book is out of stock', () => {
    const mockBooks = [{ id: 1, title: 'Book 1', stock: 1, availableQty: 0 }];
    const mockMembers = [{ id: 1, name: 'Member 1' }];
    const mockRents: Rent[] = [];

    mockLibraryService.getBooks.mockReturnValue(of(mockBooks));
    mockLibraryService.getMembers.mockReturnValue(of(mockMembers));
    mockLibraryService.getRents.mockReturnValue(of(mockRents));

    const fixture = TestBed.createComponent(RentalsComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.openRentModal();
    component.rentForm.memberId.set(1);
    component.rentForm.bookId.set(1);
    component.saveRent();

    expect(component.toastMessage()).toBe('Gagal: Buku ini sedang kosong / habis dipinjam!');
    expect(component.toastType()).toBe('error');
  });

  it('should process book return automatically using today date', () => {
    const mockRents: Rent[] = [{ id: 10, memberId: 1, bookId: 1, rentDate: '2026-05-20', status: 'RENTED' }];
    mockLibraryService.getRents.mockReturnValue(of(mockRents));
    mockLibraryService.returnBook.mockReturnValue(of({ id: 10, status: 'RETURNED', fineAmount: 0 }));

    const fixture = TestBed.createComponent(RentalsComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.openReturnModal(mockRents[0]);
    component.processReturn();

    expect(mockLibraryService.returnBook).toHaveBeenCalledWith(10, {
      returnDate: new Date().toISOString().split('T')[0]
    });
    expect(component.toastMessage()).toBe('Buku dikembalikan tepat waktu! Sukses.');
  });
});
