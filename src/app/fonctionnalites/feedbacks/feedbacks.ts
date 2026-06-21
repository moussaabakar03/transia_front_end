import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Sidebar } from '../../shared/composants/sidebar/sidebar';
import { Header } from '../../shared/composants/header/header';
import { Feedback } from '../../shared/models/Feedback';
import { FeedbackService } from '../../core/services/feedback-service';

@Component({
  selector: 'app-feedbacks',
  standalone: true,
  imports: [CommonModule, FormsModule, Sidebar, Header],
  templateUrl: './feedbacks.html',
  styleUrl: './feedbacks.scss',
})
export class Feedbacks implements OnInit {

  feedbacks: Feedback[] = [];
  filteredFeedbacks: Feedback[] = [];
  paginatedFeedbacks: Feedback[] = [];

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 5;
  totalPages: number = 1;

  searchTerm = '';
  isLoading = true;
  errorMessage = '';
  selectedFeedback: Feedback | null = null;

  constructor(
    private feedbackService: FeedbackService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadFeedbacks();
  }

  loadFeedbacks(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.feedbackService.getAllFeedbacks().subscribe({
      next: (data) => {
        this.feedbacks = data || [];
        this.applyFilter();
        this.updatePagination();
        this.isLoading = false;
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error('Erreur chargement feedbacks', err);
        this.errorMessage = 'Impossible de charger les feedbacks.';
        this.isLoading = false;
      }
    });
  }

  applyFilter(): void {
    const term = this.searchTerm.toLowerCase().trim();
    this.filteredFeedbacks = term
      ? this.feedbacks.filter(f =>
          f.creerPar?.toLowerCase().includes(term) ||
          f.commentaireTexte?.toLowerCase().includes(term)
        )
      : [...this.feedbacks];
    this.currentPage = 1;
    this.updatePagination();
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredFeedbacks.length / this.itemsPerPage) || 1;
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedFeedbacks = this.filteredFeedbacks.slice(startIndex, endIndex);
  }

  changePage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.updatePagination();
  }

  getPaginationPages(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    
    if (this.totalPages <= maxVisiblePages) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      const startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
      const endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  }

  onView(fb: Feedback): void {
    this.selectedFeedback = fb;
  }

  closeDetail(): void {
    this.selectedFeedback = null;
  }

  onDelete(id: string): void {
    if (!confirm('Supprimer ce feedback ?')) return;
    this.feedbackService.delete(id).subscribe({
      next: () => {
        this.feedbacks = this.feedbacks.filter(f => f.id !== id);
        this.applyFilter();
        this.updatePagination();
        this.cd.detectChanges();
      },
      error: err => {
        console.error('Erreur suppression feedback:', err);
        const errorMsg = err.error?.message || err.error || 'Erreur lors de la suppression.';
        alert(errorMsg);
      }
    });
  }

  getStars(note: number): number[] {
    return Array(5).fill(0).map((_, i) => i + 1);
  }
}
