import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { environment } from '../../../environments/environment';
import { ToastService } from '../../services/toast.service';
import { LanguageService } from '../../services/language.service';
import { MainLayoutComponent } from '../../components/layout/main-layout.component';
import { NavItem } from '../../components/sidenav/sidenav.component';
import { BreadcrumbItem } from '../../components/breadcrumb/breadcrumb.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MainLayoutComponent],
  templateUrl: './customers.component.html',
  styleUrl: './customers.component.css'
})
export class CustomersComponent implements OnInit, OnDestroy {
  customers: any[] = [];
  filteredCustomers: any[] = [];
  selectedCustomers: number[] = [];
  
  selectAllChecked = false;
  showCreateModal = false;
  showEditModal = false;
  editForm: any = {};
  customerForm: any = {};
  photoPreviews: string[] = [];
  documentPreviews: string[] = [];
  photoFiles: File[] = [];
  documentFiles: File[] = [];
  existingPhotoPaths: string[] = [];
  existingDocumentPaths: string[] = [];
  
  // Stats properties
  totalCustomers = 0;
  activeCustomers = 0;
  monthlyCustomers = 0;

  userRole: string = '';
  sidenavCollapsed = false;
  breadcrumbItems: BreadcrumbItem[] = [
    { label: this.languageService.translate('nav.customers'), route: '/customers' }
  ];

  private languageSubscription: Subscription = new Subscription();

  constructor(private toastService: ToastService, private languageService: LanguageService) {}

  async ngOnInit() {
    // Subscribe to language changes
    this.languageSubscription = this.languageService.currentLanguage$.subscribe(() => {
      this.updateBreadcrumbItems();
    });
    
    this.userRole = sessionStorage.getItem('role') || '';
    await this.loadCustomers();
    this.calculateStats();
  }

  ngOnDestroy() {
    this.languageSubscription.unsubscribe();
  }

  private updateBreadcrumbItems() {
    this.breadcrumbItems = [
      { label: this.languageService.translate('nav.customers'), route: '/customers' }
    ];
  }

  translate(key: string): string {
    return this.languageService.translate(key);
  }

  async loadCustomers() {
    try {
      const res = await fetch(`${environment.apiUrl}/customers/list`, { 
        method: 'GET', 
        headers: { 'Cache-Control': 'no-cache' },
        credentials: 'include'
      });
      this.customers = await res.json();
      this.filteredCustomers = [...this.customers];
      this.calculateStats();
    } catch (err) {
      console.error('Failed to load customers:', err);
    }
  }

  calculateStats() {
    this.totalCustomers = this.customers.length;
    this.activeCustomers = this.customers.filter(c => c.status === 'active').length;
    
    const currentMonth = new Date().getMonth();
    this.monthlyCustomers = this.customers.filter(c => {
      if (c.start_date) {
        const startDate = new Date(c.start_date);
        return startDate.getMonth() === currentMonth;
      }
      return false;
    }).length;
  }

  filterCustomers(event: any) {
    const searchTerm = event.target.value.toLowerCase();
    this.filteredCustomers = this.customers.filter(customer =>
      customer.id?.toString().includes(searchTerm) ||
      customer.customer_code?.toLowerCase().includes(searchTerm) ||
      customer.name?.toLowerCase().includes(searchTerm) ||
      customer.contact_no?.includes(searchTerm)
    );
  }

  openCreateCustomerModal() {
    this.showCreateModal = true;
    this.customerForm = {
      customer_code: '',
      name: '',
      contact_no: '',
      alt_contact_no: '',
      start_date: '',
      end_date: '',
      loan_duration: '',
      loan_amount: '',
      file_charge: '',
      agent_fee: '',
      emi: '',
      advance_days: '',
      amount_after_deduction: '',
      agent_commission: '',
      status: 'active',
      loan_type: 'Personal Loan',
      remark: ''
    };
  }

  closeCreateCustomerModal() {
    this.showCreateModal = false;
    this.resetFileUploads();
  }

  openEditCustomerModal(id: number) {
    const customer = this.customers.find(c => c.id === id) || {};
    
    // Convert dates to YYYY-MM-DD format for HTML date inputs
    this.editForm = {
      ...customer,
      start_date: customer.start_date ? this.formatDateForInput(customer.start_date) : '',
      end_date: customer.end_date ? this.formatDateForInput(customer.end_date) : ''
    };
    
    // Load existing files for preview
    this.loadExistingFiles(this.editForm);
    
    this.showEditModal = true;
  }

  // Helper method to format date for HTML date input
  formatDateForInput(dateString: string): string {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      
      // Format as YYYY-MM-DD
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  }

  loadExistingFiles(customer: any) {
    // Clear existing previews and files
    this.photoPreviews = [];
    this.documentPreviews = [];
    this.photoFiles = [];
    this.documentFiles = [];
    this.existingPhotoPaths = [];
    this.existingDocumentPaths = [];

    // Load existing photos
    if (customer.photo_path) {
      const photoPaths = customer.photo_path.split(',').filter((path: string) => path.trim());
      photoPaths.forEach((path: string) => {
        this.existingPhotoPaths.push(path.trim());
        this.photoPreviews.push(this.getFileUrl(path.trim()));
      });
    }

    // Load existing documents
    if (customer.document_path) {
      const documentPaths = customer.document_path.split(',').filter((path: string) => path.trim());
      documentPaths.forEach((path: string) => {
        this.existingDocumentPaths.push(path.trim());
        this.documentPreviews.push(this.getFileUrl(path.trim()));
      });
    }
  }

  closeEditCustomerModal() {
    this.showEditModal = false;
    this.editForm = {};
    this.resetFileUploads();
  }

  async deleteCustomer(id: number) {
    if (confirm("Are you sure you want to delete this customer?")) {
      try {
        const res = await fetch(`${environment.apiUrl}/customers/delete/${id}`, { 
          method: 'DELETE',
          credentials: 'include'
        });
        if (res.ok) {
          await this.loadCustomers();
        } else {
          this.toastService.error("Failed to delete customer.");
        }
      } catch (err) {
        this.toastService.error("Failed to delete customer.");
      }
    }
  }

  async createCustomer(event: Event) {
    event.preventDefault();
    
    // Create FormData with customerForm values
    const formData = new FormData();
    formData.append('customer_code', this.customerForm.customer_code || '');
    formData.append('name', this.customerForm.name || '');
    formData.append('contact_no', this.customerForm.contact_no || '');
    formData.append('alt_contact_no', this.customerForm.alt_contact_no || '');
    formData.append('start_date', this.customerForm.start_date || '');
    formData.append('end_date', this.customerForm.end_date || '');
    formData.append('loan_duration', this.customerForm.loan_duration || '');
    formData.append('loan_amount', this.customerForm.loan_amount || '');
    formData.append('file_charge', this.customerForm.file_charge || '');
    formData.append('agent_fee', this.customerForm.agent_fee || '');
    formData.append('emi', this.customerForm.emi || '');
    formData.append('advance_days', this.customerForm.advance_days || '');
    formData.append('amount_after_deduction', this.customerForm.amount_after_deduction || '');
    formData.append('agent_commission', this.customerForm.agent_commission || '');
    formData.append('status', this.customerForm.status || 'active');
    formData.append('loan_type', this.customerForm.loan_type || 'Personal Loan');
    formData.append('remark', this.customerForm.remark || '');
    
    // Add files if they exist
    if (this.photoFiles && this.photoFiles.length > 0) {
      // Add all photos
      for (let i = 0; i < this.photoFiles.length; i++) {
        formData.append('customerphoto', this.photoFiles[i], this.photoFiles[i].name);
      }
    }
    
    if (this.documentFiles && this.documentFiles.length > 0) {
      // Add all documents
      for (let i = 0; i < this.documentFiles.length; i++) {
        formData.append('customerdocument', this.documentFiles[i], this.documentFiles[i].name);
      }
    }
    
    try {
      const res = await fetch(`${environment.apiUrl}/customers/create`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      if (res.ok) {
        this.toastService.success('Customer created successfully!');
        this.closeCreateCustomerModal();
        this.resetFileUploads();
        await this.loadCustomers();
      } else {
        const result = await res.json();
        this.toastService.error(result.error || 'Error occurred.');
      }
    } catch (err) {
      this.toastService.error('Error occurred.');
    }
  }

  async updateCustomer(event: Event) {
    event.preventDefault();
    
    const formData = new FormData();
    formData.append('customer_code', this.editForm.customer_code || '');
    formData.append('name', this.editForm.name || '');
    formData.append('contact_no', this.editForm.contact_no || '');
    formData.append('alt_contact_no', this.editForm.alt_contact_no || '');
    formData.append('start_date', this.editForm.start_date || '');
    formData.append('end_date', this.editForm.end_date || '');
    formData.append('loan_duration', this.editForm.loan_duration || '');
    formData.append('loan_amount', this.editForm.loan_amount || '');
    formData.append('file_charge', this.editForm.file_charge || '');
    formData.append('agent_fee', this.editForm.agent_fee || '');
    formData.append('emi', this.editForm.emi || '');
    formData.append('advance_days', this.editForm.advance_days || '');
    formData.append('amount_after_deduction', this.editForm.amount_after_deduction || '');
    formData.append('agent_commission', this.editForm.agent_commission || '');
    formData.append('status', this.editForm.status || 'active');
    formData.append('loan_type', this.editForm.loan_type || 'Personal Loan');
    formData.append('remark', this.editForm.remark || '');
    
    // Add existing file paths
    formData.append('existing_photo_paths', this.existingPhotoPaths.join(','));
    formData.append('existing_document_paths', this.existingDocumentPaths.join(','));
    
    // Add files if they exist
    if (this.photoFiles && this.photoFiles.length > 0) {
      for (let i = 0; i < this.photoFiles.length; i++) {
        formData.append('customerphoto', this.photoFiles[i], this.photoFiles[i].name);
      }
    }
    
    if (this.documentFiles && this.documentFiles.length > 0) {
      for (let i = 0; i < this.documentFiles.length; i++) {
        formData.append('customerdocument', this.documentFiles[i], this.documentFiles[i].name);
      }
    }
    
    try {
      const res = await fetch(`${environment.apiUrl}/customers/update/${this.editForm.id}`, {
        method: 'PUT',
        body: formData,
        credentials: 'include'
      });
      if (res.ok) {
        this.toastService.success('Customer updated successfully');
        this.closeEditCustomerModal();
        await this.loadCustomers();
      } else {
        this.toastService.error('Update failed');
      }
    } catch (err) {
      this.toastService.error('Update failed');
    }
  }

  async uploadExcel(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('excel', file);
    
    try {
      const res = await fetch(`${environment.apiUrl}/customers/upload-excel`, { 
        method: 'POST', 
        body: formData,
        credentials: 'include'
      });
              if (res.ok) {
          this.toastService.success('Excel uploaded and data imported successfully!');
          await this.loadCustomers();
        } else {
          const result = await res.json();
          this.toastService.error(result.error || 'Upload failed.');
        }
      } catch (err) {
        this.toastService.error('Upload failed');
      }
  }

  downloadTemplate() {
    window.location.href = '/customers/template';
  }

  toggleSelection(id: number) {
    const index = this.selectedCustomers.indexOf(id);
    if (index > -1) {
      this.selectedCustomers.splice(index, 1);
    } else {
      this.selectedCustomers.push(id);
    }
    this.updateSelectAllState();
  }

  selectAll(event: any) {
    if (event.target.checked) {
      this.selectedCustomers = this.filteredCustomers.map(c => c.id);
    } else {
      this.selectedCustomers = [];
    }
    this.selectAllChecked = event.target.checked;
  }

  updateSelectAllState() {
    this.selectAllChecked = this.selectedCustomers.length === this.filteredCustomers.length;
  }

  async deleteSelected() {
    if (this.selectedCustomers.length === 0) return;
    
    if (confirm(`Delete ${this.selectedCustomers.length} selected customers?`)) {
      try {
        const res = await fetch(`${environment.apiUrl}/customers/delete-multiple`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: this.selectedCustomers }),
          credentials: 'include'
        });
        
        if (res.ok) {
          this.selectedCustomers = [];
          await this.loadCustomers();
        }
      } catch (err) {
        this.toastService.error('Delete failed');
      }
    }
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }

  onPhotoUpload(event: any) {
    const files = event.target.files;
    console.log('Photo upload - Files selected:', files.length);

    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        console.log(`Processing photo ${i + 1}:`, file.name);
        
        // Store the actual file
        this.photoFiles.push(file);
        
        // Create preview
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.photoPreviews.push(e.target.result);
          console.log('Photos array length:', this.photoPreviews.length);
        };
        reader.readAsDataURL(file);
      }
    }
  }

  removePhoto(index: number) {
    // If removing an existing file (before new files), remove from existing paths
    if (index < this.existingPhotoPaths.length) {
      this.existingPhotoPaths.splice(index, 1);
    } else {
      // If removing a new file, adjust the index and remove from new files
      const newFileIndex = index - this.existingPhotoPaths.length;
      this.photoFiles.splice(newFileIndex, 1);
    }
    this.photoPreviews.splice(index, 1);
  }

  onDocumentUpload(event: any) {
    const files = event.target.files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Store the actual file
        this.documentFiles.push(file);
        
        // Create preview
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.documentPreviews.push(e.target.result);
        };
        reader.readAsDataURL(file);
      }
    }
  }

  removeDocument(index: number) {
    // If removing an existing file (before new files), remove from existing paths
    if (index < this.existingDocumentPaths.length) {
      this.existingDocumentPaths.splice(index, 1);
    } else {
      // If removing a new file, adjust the index and remove from new files
      const newFileIndex = index - this.existingDocumentPaths.length;
      this.documentFiles.splice(newFileIndex, 1);
    }
    this.documentPreviews.splice(index, 1);
  }

  resetFileUploads() {
    this.photoPreviews = [];
    this.documentPreviews = [];
    this.photoFiles = [];
    this.documentFiles = [];
    this.existingPhotoPaths = [];
    this.existingDocumentPaths = [];
  }

  // Helper methods for displaying files in table
  getPhotoPaths(photoPath: string): string[] {
    if (!photoPath) return [];
    return photoPath.split(',').filter(path => path.trim());
  }

  getDocumentPaths(documentPath: string): string[] {
    if (!documentPath) return [];
    return documentPath.split(',').filter(path => path.trim());
  }

  getFileUrl(filename: string): string {
    return `${environment.apiUrl}/customers/files/${filename}`;
  }

  logout() {
    sessionStorage.clear();
    window.location.href = '/login';
  }

  onSidenavToggle(collapsed: boolean) {
    this.sidenavCollapsed = collapsed;
  }
}
