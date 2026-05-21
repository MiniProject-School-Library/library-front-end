import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LibraryService, Rent, Book, Member } from '../services/library_service';

@Component({
  selector: 'app-rentals',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './rentals.html'
})
export class RentalsComponent implements OnInit {
  private libraryService = inject(LibraryService);

  rentals = signal<Rent[]>([]);
  books = signal<Book[]>([]);
  members = signal<Member[]>([]);
  loading = signal<boolean>(false);

  toastMessage = signal<string | null>(null);
  toastType = signal<'success' | 'error' | 'info'>('success');

  rentalSearchQuery = signal<string>('');
  showRentModal = signal<boolean>(false);
  showReturnModal = signal<boolean>(false);

  rentForm = {
    memberId: signal<number | null>(null),
    bookId: signal<number | null>(null),
    rentDate: signal(new Date().toISOString().split('T')[0])
  };

  returnForm = {
    rentId: signal<number | null>(null),
    returnDate: signal(new Date().toISOString().split('T')[0]),
    selectedRentDetails: signal<Rent | null>(null)
  };

  filteredRentals = computed(() => {
    const query = this.rentalSearchQuery().toLowerCase().trim();
    if (!query) return this.rentals();
    return this.rentals().filter(r =>
      r.rentCode?.toLowerCase().includes(query) ||
      r.memberName?.toLowerCase().includes(query) ||
      r.bookTitle?.toLowerCase().includes(query) ||
      r.memberCode?.toLowerCase().includes(query) ||
      r.bookCode?.toLowerCase().includes(query) ||
      r.status?.toLowerCase().includes(query)
    );
  });

  ngOnInit() {
    this.refreshData();
  }

  refreshData() {
    this.loading.set(true);

    this.libraryService.getBooks().subscribe({
      next: (data) => this.books.set(data),
      error: (err) => this.displayToast('Gagal memuat katalog buku: ' + (err.error?.errors || err.message), 'error')
    });

    this.libraryService.getMembers().subscribe({
      next: (data) => this.members.set(data),
      error: (err) => this.displayToast('Gagal memuat data anggota: ' + (err.error?.errors || err.message), 'error')
    });

    this.libraryService.getRents().subscribe({
      next: (data) => {
        this.rentals.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.displayToast('Gagal memuat transaksi rental: ' + (err.error?.errors || err.message), 'error');
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

  openRentModal() {
    this.rentForm.memberId.set(null);
    this.rentForm.bookId.set(null);
    this.rentForm.rentDate.set(new Date().toISOString().split('T')[0]);
    this.showRentModal.set(true);
  }

  saveRent() {
    const memberId = this.rentForm.memberId();
    const bookId = this.rentForm.bookId();
    const rentDate = this.rentForm.rentDate();

    if (!memberId || !bookId || !rentDate) {
      this.displayToast('Mohon pilih anggota, buku, dan tanggal pinjam!', 'error');
      return;
    }

    const activeMemberRents = this.rentals().filter(r => r.memberId === memberId && r.status === 'RENTED');
    if (activeMemberRents.length >= 3) {
      this.displayToast('Gagal: Anggota ini telah meminjam batas maksimal 3 buku!', 'error');
      return;
    }

    const selectedBookObj = this.books().find(b => b.id === bookId);
    if (selectedBookObj && (selectedBookObj.availableQty || 0) <= 0) {
      this.displayToast('Gagal: Buku ini sedang kosong / habis dipinjam!', 'error');
      return;
    }

    const payload = { memberId, bookId, rentDate };

    this.loading.set(true);
    this.libraryService.rentBook(payload).subscribe({
      next: () => {
        this.displayToast('Peminjaman buku berhasil dicatat!');
        this.showRentModal.set(false);
        this.refreshData();
      },
      error: (err) => {
        this.displayToast('Gagal memproses peminjaman: ' + (err.error?.errors || err.message), 'error');
        this.loading.set(false);
      }
    });
  }

  openReturnModal(rent: Rent) {
    if (!rent.id) return;
    this.returnForm.rentId.set(rent.id);
    this.returnForm.returnDate.set(new Date().toISOString().split('T')[0]);
    this.returnForm.selectedRentDetails.set(rent);
    this.showReturnModal.set(true);
  }

  processReturn() {
    const rentId = this.returnForm.rentId();
    const returnDate = new Date().toISOString().split('T')[0];

    if (!rentId) {
      this.displayToast('Data sewa tidak ditemukan!', 'error');
      return;
    }

    this.loading.set(true);
    this.libraryService.returnBook(rentId, { returnDate }).subscribe({
      next: (updatedRent) => {
        if (updatedRent.fineAmount && updatedRent.fineAmount > 0) {
          this.displayToast(
            `Buku dikembalikan! Terlambat, Dikenakan Denda: Rp ${updatedRent.fineAmount.toLocaleString('id-ID')}`,
            'info'
          );
        } else {
          this.displayToast('Buku dikembalikan tepat waktu! Sukses.');
        }
        this.showReturnModal.set(false);
        this.refreshData();
      },
      error: (err) => {
        this.displayToast('Gagal memproses pengembalian: ' + (err.error?.errors || err.message), 'error');
        this.loading.set(false);
      }
    });
  }

  formatNumber(value?: number): string {
    if (value === undefined || value === null) return '0';
    return value.toLocaleString('id-ID');
  }

  formatDate(dateStr?: string | Date): string {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }
}
