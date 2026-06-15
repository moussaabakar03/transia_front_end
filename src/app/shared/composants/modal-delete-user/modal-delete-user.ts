import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../../core/services/user-service';

@Component({
  selector: 'app-modal-delete-user',
  imports: [CommonModule],
  templateUrl: './modal-delete-user.html',
  styleUrl: './modal-delete-user.scss',
})
export class ModalDeleteUser {
  @Input() userId: any = null;
  @Input() userName: string = '';
  @Output() fermer = new EventEmitter<void>();
  @Output() success = new EventEmitter<void>();

  isLoading = false;

  constructor(private userService: UserService) {}

  confirmDelete() {
    if (!this.userId) return;

    this.isLoading = true;

    this.userService.deleteUser(this.userId).subscribe({
      next: () => {
        this.isLoading = false;
        this.success.emit();
        this.fermer.emit();
      },
      error: (err) => {
        console.error('Erreur suppression utilisateur', err);
        alert('Erreur lors de la suppression');
        this.isLoading = false;
      }
    });
  }

  cancel() {
    this.fermer.emit();
  }
}
