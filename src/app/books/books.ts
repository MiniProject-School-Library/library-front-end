import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LibraryService, Book } from '../services/library_service';

@Component({
  selector: 'app-books',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './books.html'
})
export class BooksComponent implements OnInit {
  private libraryService = inject(LibraryService);

  books = signal<Book[]>([]);
  loading = signal<boolean>(false);

  toastMessage = signal<string | null>(null);
  toastType = signal<'success' | 'error' | 'info'>('success');

  bookSearchQuery = signal<string>('');
  showBookModal = signal<boolean>(false);
  editingBookId = signal<number | null>(null);

  bookForm = {
    title: signal(''),
    author: signal(''),
    publisher: signal(''),
    publishYear: signal(new Date().getFullYear()),
    stock: signal(1)
  };

  filteredBooks = computed(() => {
    const query = this.bookSearchQuery().toLowerCase().trim();
    if (!query) return this.books();
    return this.books().filter(b =>
      b.title.toLowerCase().includes(query) ||
      b.author.toLowerCase().includes(query) ||
      b.publisher.toLowerCase().includes(query) ||
      b.bookCode?.toLowerCase().includes(query)
    );
  });

  ngOnInit() {
    this.refreshData();
  }

  refreshData() {
    this.loading.set(true);
    this.libraryService.getBooks().subscribe({
      next: (data) => {
        this.books.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.displayToast('Gagal memuat katalog buku: ' + (err.error?.errors || err.message), 'error');
        this.loading.set(false);
      }
    });
  }

  displayToast(msg: string, type: 'success' | 'error' | 'info' = 'success') {
    this.toastMessage.set(msg);
    this.toastType.set(type);
    setTimeout(() => {
      this.toastMessage.set(null);
    }, 4500);
  }

  openAddBookModal() {
    this.editingBookId.set(null);
    this.bookForm.title.set('');
    this.bookForm.author.set('');
    this.bookForm.publisher.set('');
    this.bookForm.publishYear.set(new Date().getFullYear());
    this.bookForm.stock.set(1);
    this.showBookModal.set(true);
  }

  openEditBookModal(book: Book) {
    if (!book.id) return;
    this.editingBookId.set(book.id);
    this.bookForm.title.set(book.title);
    this.bookForm.author.set(book.author);
    this.bookForm.publisher.set(book.publisher);
    this.bookForm.publishYear.set(book.publishYear);
    this.bookForm.stock.set(book.stock);
    this.showBookModal.set(true);
  }

  saveBook() {
    if (!this.bookForm.title() || !this.bookForm.author() || !this.bookForm.publisher()) {
      this.displayToast('Mohon lengkapi formulir buku!', 'error');
      return;
    }

    const payload: Book = {
      title: this.bookForm.title(),
      author: this.bookForm.author(),
      publisher: this.bookForm.publisher(),
      publishYear: this.bookForm.publishYear(),
      stock: this.bookForm.stock()
    };

    const bookId = this.editingBookId();
    if (bookId) {
      payload.id = bookId;
    }

    this.loading.set(true);
    this.libraryService.upsertBook(payload).subscribe({
      next: () => {
        this.displayToast(bookId ? 'Buku berhasil diperbarui!' : 'Buku baru berhasil ditambahkan!');
        this.showBookModal.set(false);
        this.refreshData();
      },
      error: (err) => {
        this.displayToast((bookId ? 'Gagal memperbarui buku: ' : 'Gagal menambahkan buku: ') + (err.error?.errors || err.message), 'error');
        this.loading.set(false);
      }
    });
  }

  deleteBook(id?: number) {
    if (!id) return;
    if (!confirm('Apakah Anda yakin ingin menghapus buku ini dari katalog?')) return;

    this.loading.set(true);
    this.libraryService.deleteBook(id).subscribe({
      next: () => {
        this.displayToast('Buku berhasil dihapus!');
        this.refreshData();
      },
      error: (err) => {
        this.displayToast('Gagal menghapus buku: ' + (err.error?.errors || err.message), 'error');
        this.loading.set(false);
      }
    });
  }
}
