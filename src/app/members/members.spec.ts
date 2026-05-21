import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MembersComponent } from './members';
import { LibraryService } from '../services/library_service';
import { of } from 'rxjs';

describe('MembersComponent', () => {
  let mockLibraryService: any;

  beforeEach(async () => {
    mockLibraryService = {
      getMembers: vi.fn().mockReturnValue(of([])),
      upsertMember: vi.fn(),
      deleteMember: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [MembersComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: LibraryService, useValue: mockLibraryService }
      ]
    }).compileComponents();
  });

  it('should create the component', () => {
    const fixture = TestBed.createComponent(MembersComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should fetch members on init', () => {
    const mockMembers = [
      { id: 1, memberCode: 'M001', name: 'John Doe', email: 'john@example.com', phone: '0812345678', address: 'Street' }
    ];
    mockLibraryService.getMembers.mockReturnValue(of(mockMembers));

    const fixture = TestBed.createComponent(MembersComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.members()).toEqual(mockMembers);
    expect(component.filteredMembers()).toEqual(mockMembers);
  });

  it('should validate email format correctly', () => {
    const fixture = TestBed.createComponent(MembersComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.openAddMemberModal();
    component.memberForm.name.set('Jane Doe');
    component.memberForm.phone.set('08123456');
    component.memberForm.address.set('Street');

    component.memberForm.email.set('invalid-email');

    component.saveMember();
    expect(component.toastMessage()).toBe('Format email tidak valid! Contoh: nama@domain.com');
    expect(component.toastType()).toBe('error');

    mockLibraryService.upsertMember.mockReturnValue(of({}));
    component.memberForm.email.set('jane@example.com');
    component.saveMember();
    expect(component.toastMessage()).not.toBe('Format email tidak valid! Contoh: nama@domain.com');
  });

  it('should filter members on search query', () => {
    const mockMembers = [
      { id: 1, name: 'Alice Smith', email: 'alice@example.com', phone: '123' },
      { id: 2, name: 'Bob Jones', email: 'bob@example.com', phone: '456' }
    ];
    mockLibraryService.getMembers.mockReturnValue(of(mockMembers));

    const fixture = TestBed.createComponent(MembersComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.memberSearchQuery.set('Alice');
    fixture.detectChanges();
    expect(component.filteredMembers().length).toBe(1);
    expect(component.filteredMembers()[0].name).toBe('Alice Smith');
  });
});
