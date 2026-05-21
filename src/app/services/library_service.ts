import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface WebResponse<T> {
  code: number;
  status: string;
  data: T;
  errors?: string;
}

export interface Book {
  id?: number;
  bookCode?: string;
  title: string;
  author: string;
  publisher: string;
  publishYear: number;
  stock: number;
  rentedQty?: number;
  availableQty?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Member {
  id?: number;
  memberCode?: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Rent {
  id?: number;
  rentCode?: string;
  memberId: number;
  memberCode?: string;
  memberName?: string;
  bookId: number;
  bookCode?: string;
  bookTitle?: string;
  rentDate: string;
  dueDate?: string;
  returnDate?: string;
  status?: 'RENTED' | 'RETURNED';
  fineAmount?: number;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class LibraryService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api';

  getBooks(): Observable<Book[]> {
    return this.http.get<WebResponse<Book[]>>(`${this.apiUrl}/books`).pipe(
      map(res => res.data)
    );
  }

  getBook(id: number): Observable<Book> {
    return this.http.get<WebResponse<Book>>(`${this.apiUrl}/books/${id}`).pipe(
      map(res => res.data)
    );
  }

  upsertBook(book: Book): Observable<Book> {
    return this.http.post<WebResponse<Book>>(`${this.apiUrl}/books`, book).pipe(
      map(res => res.data)
    );
  }

  deleteBook(id: number): Observable<string> {
    return this.http.delete<WebResponse<string>>(`${this.apiUrl}/books/${id}`).pipe(
      map(res => res.data)
    );
  }

  getMembers(): Observable<Member[]> {
    return this.http.get<WebResponse<Member[]>>(`${this.apiUrl}/members`).pipe(
      map(res => res.data)
    );
  }

  getMember(id: number): Observable<Member> {
    return this.http.get<WebResponse<Member>>(`${this.apiUrl}/members/${id}`).pipe(
      map(res => res.data)
    );
  }

  upsertMember(member: Member): Observable<Member> {
    return this.http.post<WebResponse<Member>>(`${this.apiUrl}/members`, member).pipe(
      map(res => res.data)
    );
  }

  deleteMember(id: number): Observable<string> {
    return this.http.delete<WebResponse<string>>(`${this.apiUrl}/members/${id}`).pipe(
      map(res => res.data)
    );
  }

  getRents(): Observable<Rent[]> {
    return this.http.get<WebResponse<Rent[]>>(`${this.apiUrl}/rents`).pipe(
      map(res => res.data)
    );
  }

  getRent(id: number): Observable<Rent> {
    return this.http.get<WebResponse<Rent>>(`${this.apiUrl}/rents/${id}`).pipe(
      map(res => res.data)
    );
  }

  getRentsByMember(memberId: number): Observable<Rent[]> {
    return this.http.get<WebResponse<Rent[]>>(`${this.apiUrl}/rents/member/${memberId}`).pipe(
      map(res => res.data)
    );
  }

  rentBook(rentRequest: { memberId: number; bookId: number; rentDate: string }): Observable<Rent> {
    return this.http.post<WebResponse<Rent>>(`${this.apiUrl}/rents`, rentRequest).pipe(
      map(res => res.data)
    );
  }

  returnBook(id: number, returnRequest?: { returnDate: string }): Observable<Rent> {
    return this.http.post<WebResponse<Rent>>(`${this.apiUrl}/rents/${id}/return`, returnRequest || {}).pipe(
      map(res => res.data)
    );
  }
}
