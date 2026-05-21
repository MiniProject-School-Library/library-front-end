import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LibraryService, Member } from '../services/library_service';

@Component({
  selector: 'app-members',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './members.html'
})
export class MembersComponent implements OnInit {
  private libraryService = inject(LibraryService);

  members = signal<Member[]>([]);
  loading = signal<boolean>(false);

  toastMessage = signal<string | null>(null);
  toastType = signal<'success' | 'error' | 'info'>('success');

  memberSearchQuery = signal<string>('');
  showMemberModal = signal<boolean>(false);
  editingMemberId = signal<number | null>(null);

  memberForm = {
    name: signal(''),
    email: signal(''),
    phone: signal(''),
    address: signal('')
  };

  filteredMembers = computed(() => {
    const query = this.memberSearchQuery().toLowerCase().trim();
    if (!query) return this.members();
    return this.members().filter(m =>
      m.name.toLowerCase().includes(query) ||
      m.email.toLowerCase().includes(query) ||
      m.phone.toLowerCase().includes(query) ||
      m.memberCode?.toLowerCase().includes(query)
    );
  });

  ngOnInit() {
    this.refreshData();
  }

  refreshData() {
    this.loading.set(true);
    this.libraryService.getMembers().subscribe({
      next: (data) => {
        this.members.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.displayToast('Gagal memuat data anggota: ' + (err.error?.errors || err.message), 'error');
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

  openAddMemberModal() {
    this.editingMemberId.set(null);
    this.memberForm.name.set('');
    this.memberForm.email.set('');
    this.memberForm.phone.set('');
    this.memberForm.address.set('');
    this.showMemberModal.set(true);
  }

  openEditMemberModal(member: Member) {
    if (!member.id) return;
    this.editingMemberId.set(member.id);
    this.memberForm.name.set(member.name);
    this.memberForm.email.set(member.email);
    this.memberForm.phone.set(member.phone);
    this.memberForm.address.set(member.address);
    this.showMemberModal.set(true);
  }

  saveMember() {
    if (!this.memberForm.name() || !this.memberForm.email() || !this.memberForm.phone()) {
      this.displayToast('Mohon lengkapi formulir anggota!', 'error');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.memberForm.email().trim())) {
      this.displayToast('Format email tidak valid! Contoh: nama@domain.com', 'error');
      return;
    }

    const payload: Member = {
      name: this.memberForm.name(),
      email: this.memberForm.email(),
      phone: this.memberForm.phone(),
      address: this.memberForm.address()
    };

    const memberId = this.editingMemberId();
    if (memberId) {
      payload.id = memberId;
    }

    this.loading.set(true);
    this.libraryService.upsertMember(payload).subscribe({
      next: () => {
        this.displayToast(memberId ? 'Profil anggota berhasil diperbarui!' : 'Anggota baru berhasil didaftarkan!');
        this.showMemberModal.set(false);
        this.refreshData();
      },
      error: (err) => {
        this.displayToast((memberId ? 'Gagal memperbarui profil: ' : 'Gagal mendaftarkan anggota: ') + (err.error?.errors || err.message), 'error');
        this.loading.set(false);
      }
    });
  }

  deleteMember(id?: number) {
    if (!id) return;
    if (!confirm('Apakah Anda yakin ingin menghapus keanggotaan ini?')) return;

    this.loading.set(true);
    this.libraryService.deleteMember(id).subscribe({
      next: () => {
        this.displayToast('Anggota berhasil dihapus!');
        this.refreshData();
      },
      error: (err) => {
        this.displayToast('Gagal menghapus anggota: ' + (err.error?.errors || err.message), 'error');
        this.loading.set(false);
      }
    });
  }
}
