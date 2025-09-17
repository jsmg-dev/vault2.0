import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MainLayoutComponent } from '../../components/layout/main-layout.component';
import { BreadcrumbItem } from '../../components/breadcrumb/breadcrumb.component';
import { environment } from '../../../environments/environment';

declare var Chart: any;

@Component({
  selector: 'app-laundry',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MainLayoutComponent],
  template: `
    <app-main-layout
      [userRole]="userRole"
      [sidenavCollapsed]="sidenavCollapsed"
      [breadcrumbItems]="breadcrumbItems"
      (sidenavToggle)="onSidenavToggle($event)"
      (fullscreenToggle)="toggleFullscreen()"
      (logoutEvent)="logout()"
    >
      <div class="laundry-container">

      <!-- Navigation Tabs -->
      <div class="tab-navigation">
        <button 
          class="tab-btn" 
          [class.active]="activeTab === 'dashboard'"
          (click)="setActiveTab('dashboard')"
        >
          <i class="fas fa-tachometer-alt"></i>
          Dashboard
        </button>
        <button 
          class="tab-btn" 
          [class.active]="activeTab === 'customers'"
          (click)="setActiveTab('customers')"
        >
          <i class="fas fa-users"></i>
          Customers
        </button>
        <button 
          class="tab-btn" 
          [class.active]="activeTab === 'services'"
          (click)="setActiveTab('services')"
        >
          <i class="fas fa-cogs"></i>
          Services
        </button>
        <button 
          class="tab-btn" 
          [class.active]="activeTab === 'billing'"
          (click)="setActiveTab('billing')"
        >
          <i class="fas fa-receipt"></i>
          Billing
        </button>
      </div>

      <!-- Dashboard Tab -->
      <div class="tab-content" *ngIf="activeTab === 'dashboard'">
        <div class="dashboard-content">
          <div class="card-container">
            <div class="card customers">
              <h3>Total Customers</h3>
              <p>{{ customers.length | number }}</p>
              <i class="fas fa-users"></i>
            </div>
            <div class="card deposits">
              <h3>Pending Orders</h3>
              <p>{{ pendingOrders | number }}</p>
              <i class="fas fa-clock"></i>
            </div>
            <div class="card loans">
              <h3>Completed Today</h3>
              <p>{{ completedOrders | number }}</p>
              <i class="fas fa-check-circle"></i>
            </div>
            <div class="card earnings">
              <h3>Today's Revenue</h3>
              <p>₹ {{ todayRevenue | number }}</p>
              <i class="fas fa-rupee-sign"></i>
            </div>
          </div>

          <div class="charts">
            <div class="chart-box">
              <h4>Orders Per Month</h4>
              <canvas #barChart></canvas>
            </div>
            <div class="chart-box">
              <h4>Service Distribution</h4>
              <canvas #pieChart></canvas>
            </div>
            <div class="chart-box">
              <h4>Revenue Over Time</h4>
              <canvas #lineChart></canvas>
            </div>
          </div>

          <div class="chart-box" style="margin-top:20px; background:white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
            <h4 style="text-align:center; margin-bottom: 10px; font-size: 18px;">Recent Orders</h4>
            <table style="width:100%; border-collapse: collapse;">
              <thead>
                <tr style="background:#f8f8f8;">
                  <th style="text-align:left; padding:6px; border-bottom:1px solid #eee; font-size: 12px;">Order ID</th>
                  <th style="text-align:left; padding:6px; border-bottom:1px solid #eee; font-size: 12px;">Customer</th>
                  <th style="text-align:right; padding:6px; border-bottom:1px solid #eee; font-size: 12px;">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let bill of bills.slice(0, 5)">
                  <td style="padding:6px; border-bottom:1px solid #f1f1f1; font-size: 12px;">#{{ bill.id }}</td>
                  <td style="padding:6px; border-bottom:1px solid #f1f1f1; font-size: 12px;">{{ bill.customer }}</td>
                  <td style="padding:6px; border-bottom:1px solid #f1f1f1; text-align:right; font-size: 12px;">₹{{ bill.amount }}</td>
                </tr>
                <tr *ngIf="bills.length === 0">
                  <td colspan="3" style="padding:6px; text-align:center; color:#777; font-size: 12px;">No orders yet</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Customers Tab -->
      <div class="tab-content" *ngIf="activeTab === 'customers'">
        <div class="section-header">
          <h2><i class="fas fa-users"></i> Customer Management</h2>
          <button class="btn primary" (click)="openCustomerModal()">
            <i class="fas fa-plus"></i>
            Add New Customer
          </button>
        </div>

        <!-- Search and Filter -->
        <div class="search-section">
          <div class="search-box">
            <i class="fas fa-search"></i>
            <input 
              type="text" 
              placeholder="Search customers by name, phone, or email..."
              [(ngModel)]="customerSearchTerm"
              (input)="filterCustomers()"
            >
          </div>
          <div class="filter-options">
            <select [(ngModel)]="customerFilter" (change)="filterCustomers()">
              <option value="">All Customers</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="vip">VIP</option>
            </select>
          </div>
        </div>

        <!-- Customers Table -->
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Address</th>
                <th>Status</th>
                <th>Total Orders</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let customer of filteredCustomers">
                <td>{{ customer.id }}</td>
                <td>{{ customer.name }}</td>
                <td>{{ customer.phone }}</td>
                <td>{{ customer.email }}</td>
                <td>{{ customer.address }}</td>
                <td>
                  <span class="status-badge" [class]="'status-' + customer.status.toLowerCase()">
                    {{ customer.status }}
                  </span>
                </td>
                <td>{{ customer.totalOrders }}</td>
                <td>
                  <button class="btn-small primary" (click)="viewCustomer(customer.id)">View</button>
                  <button class="btn-small secondary" (click)="editCustomer(customer.id)">Edit</button>
                  <button class="btn-small danger" (click)="deleteCustomer(customer.id)">Delete</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Services Tab -->
      <div class="tab-content" *ngIf="activeTab === 'services'">
        <div class="section-header">
              <div class="header-left">
                <div class="form-group">
                  <label for="servicesDropdown">Services</label>
                  <div class="dropdown-container">
                    <select 
                      id="servicesDropdown"
                      [(ngModel)]="selectedServiceType" 
                      class="services-dropdown"
                      (change)="onServiceTypeChange()"
                    >
                      <option value="laundry">Laundry</option>
                      <option value="dry-clean">Dry Clean</option>
                      <option value="ironing">Ironing</option>
                    </select>
                    <i class="fas fa-chevron-down dropdown-arrow"></i>
        </div>
                </div>
                <div class="form-group">
                  <label for="serviceForDropdown">Service For</label>
                  <div class="dropdown-container">
                    <select 
                      id="serviceForDropdown"
                      [(ngModel)]="selectedServiceFor" 
                      class="services-dropdown"
                      (change)="onServiceForChange()"
                    >
                      <option value="man">Man</option>
                      <option value="woman">Woman</option>
                      <option value="children">Children's</option>
                    </select>
                    <i class="fas fa-chevron-down dropdown-arrow"></i>
                </div>
              </div>
                <button class="btn secondary" (click)="debugPrices()" style="margin-left: 10px;">
                  <i class="fas fa-bug"></i> Debug Prices
                </button>
                </div>
          <button class="btn primary" (click)="openServiceModal()">
            <i class="fas fa-plus"></i>
            Add New Service
          </button>
        </div>

        <!-- Filtered Services -->
        <div class="service-category">
          <div class="services-grid" *ngIf="filteredServices.length > 0">
            <div class="service-card" *ngFor="let service of filteredServices; trackBy: trackByServiceId">
              <div class="service-image-section">
                <div class="service-photo" [style.background-color]="getServiceColor(service.category, service.clothType)">
                  <span class="service-emoji">{{ getServiceEmoji(service.clothType) }}</span>
                </div>
                <div class="service-icon">
                  <i [class]="service.icon"></i>
                </div>
              </div>
              <div class="service-content">
                <h4>{{ service.name }}</h4>
                <p>{{ service.description }}</p>
                <div class="service-details">
                  <span class="cloth-type">{{ service.clothType }}</span>
                  <span class="pickup-status" [class]="service.pickup ? 'pickup-available' : 'pickup-unavailable'">
                    <i class="fas fa-truck"></i> {{ service.pickup ? 'Pickup Available' : 'No Pickup' }}
                  </span>
                </div>
                <div class="service-price-edit">
                  <label>{{ getServiceTypeDisplayName() }} Price: ₹</label>
                  <input 
                    type="number" 
                    [value]="getServicePrice(service)" 
                    (input)="onPriceInput(service, $event)"
                    class="price-input" 
                    min="0" 
                    step="1"
                  >
                </div>
                <div class="service-actions">
                  <button class="btn-small primary" (click)="editService(service.id)">Edit</button>
                  <button class="btn-small danger" (click)="deleteService(service.id)">Delete</button>
              </div>
            </div>
          </div>
        </div>

          <!-- No services found message -->
          <div class="no-services-message" *ngIf="filteredServices.length === 0">
            <div class="no-services-content">
              <i class="fas fa-search"></i>
              <h3>No services found</h3>
              <p>No services match the selected criteria. Try adjusting your filters.</p>
                  </div>
          </div>
        </div>
      </div>

      <!-- Billing Tab -->
      <div class="tab-content" *ngIf="activeTab === 'billing'">
        <div class="section-header">
          <button class="btn primary" (click)="generateBill()">
            <i class="fas fa-file-invoice"></i>
            Generate Bill
          </button>
        </div>

        <!-- Bills Table -->
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Bill ID</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Due Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let bill of bills">
                <td>{{ bill.id }}</td>
                <td>{{ bill.customer }}</td>
                <td>₹{{ bill.amount }}</td>
                <td>
                  <span class="status-badge" [class]="'status-' + bill.status.toLowerCase()">
                    {{ bill.status }}
                  </span>
                </td>
                <td>{{ bill.dueDate }}</td>
                <td>
                  <button class="btn-small primary" (click)="viewBill(bill.id)">View</button>
                  <button class="btn-small secondary" (click)="printBill(bill.id)">Print</button>
                  <button class="btn-small success" (click)="markPaid(bill.id)" *ngIf="bill.status === 'Pending'">Mark Paid</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- New Order Modal -->
      <div class="modal" [class.active]="showNewOrderModal" (click)="closeModal($event)">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>New Laundry Order</h3>
            <button class="close-btn" (click)="closeNewOrderModal()">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-body">
            <form [formGroup]="newOrderForm" (ngSubmit)="submitOrder()">
              <div class="form-group">
                <label for="customerName">Customer Name</label>
                <input 
                  type="text" 
                  id="customerName" 
                  formControlName="customerName"
                  placeholder="Enter customer name"
                  required
                >
              </div>
              <div class="form-group">
                <label for="customerPhone">Phone Number</label>
                <input 
                  type="tel" 
                  id="customerPhone" 
                  formControlName="customerPhone"
                  placeholder="Enter phone number"
                  required
                >
              </div>
              <div class="form-group">
                <label for="items">Items Description</label>
                <textarea 
                  id="items" 
                  formControlName="items"
                  placeholder="Describe the items (e.g., 5 shirts, 3 pants)"
                  rows="3"
                  required
                ></textarea>
              </div>
              <div class="form-group">
                <label for="serviceType">Service Type</label>
                <select id="serviceType" formControlName="serviceType" required>
                  <option value="">Select service type</option>
                  <option value="wash">Wash Only</option>
                  <option value="wash-iron">Wash & Iron</option>
                  <option value="dry-clean">Dry Clean</option>
                  <option value="iron">Iron Only</option>
                </select>
              </div>
              <div class="form-group">
                <label for="amount">Amount (₹)</label>
                <input 
                  type="number" 
                  id="amount" 
                  formControlName="amount"
                  placeholder="Enter amount"
                  required
                >
              </div>
              <div class="form-group">
                <label for="pickupDate">Pickup Date</label>
                <input 
                  type="date" 
                  id="pickupDate" 
                  formControlName="pickupDate"
                  required
                >
              </div>
              <div class="form-actions">
                <button type="button" class="btn secondary" (click)="closeNewOrderModal()">
                  Cancel
                </button>
                <button type="submit" class="btn primary">
                  Create Order
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- Customer Modal -->
      <div class="modal" [class.active]="showCustomerModal" (click)="closeModal($event)">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>{{ editingCustomer ? 'Edit Customer' : 'Add New Customer' }}</h3>
            <button class="close-btn" (click)="closeCustomerModal()">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-body">
            <form [formGroup]="customerForm" (ngSubmit)="submitCustomer()">
              <div class="form-group">
                <label for="customerName">Full Name</label>
                <input 
                  type="text" 
                  id="customerName" 
                  formControlName="name"
                  placeholder="Enter full name"
                  required
                >
              </div>
              <div class="form-group">
                <label for="customerPhone">Phone Number</label>
                <input 
                  type="tel" 
                  id="customerPhone" 
                  formControlName="phone"
                  placeholder="Enter phone number"
                  required
                >
              </div>
              <div class="form-group">
                <label for="customerEmail">Email Address</label>
                <input 
                  type="email" 
                  id="customerEmail" 
                  formControlName="email"
                  placeholder="Enter email address"
                >
              </div>
              <div class="form-group">
                <label for="customerAddress">Address</label>
                <textarea 
                  id="customerAddress" 
                  formControlName="address"
                  placeholder="Enter full address"
                  rows="3"
                ></textarea>
              </div>
              <div class="form-group">
                <label for="customerStatus">Status</label>
                <select id="customerStatus" formControlName="status">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="vip">VIP</option>
                </select>
              </div>
              <div class="form-actions">
                <button type="button" class="btn secondary" (click)="closeCustomerModal()">
                  Cancel
                </button>
                <button type="submit" class="btn primary">
                  {{ editingCustomer ? 'Update Customer' : 'Add Customer' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- Service Modal -->
      <div class="modal" [class.active]="showServiceModal" (click)="closeModal($event)">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>{{ editingService ? 'Edit Service' : 'Add New Service' }}</h3>
            <button class="close-btn" (click)="closeServiceModal()">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-body">
            <form [formGroup]="serviceForm" (ngSubmit)="submitService()">
              <div class="form-group">
                <label for="serviceName">Service Name</label>
                <input 
                  type="text" 
                  id="serviceName" 
                  formControlName="name"
                  placeholder="Enter service name"
                  required
                >
              </div>
              <div class="form-group">
                <label for="serviceDescription">Description</label>
                <textarea 
                  id="serviceDescription" 
                  formControlName="description"
                  placeholder="Enter service description"
                  rows="3"
                ></textarea>
              </div>
              <div class="form-group">
                <label for="servicePrice">Price (₹)</label>
                <input 
                  type="number" 
                  id="servicePrice" 
                  formControlName="price"
                  placeholder="Enter service price"
                  required
                >
              </div>
              <div class="form-group">
                <label for="serviceIcon">Icon Class</label>
                <input 
                  type="text" 
                  id="serviceIcon" 
                  formControlName="icon"
                  placeholder="e.g., fas fa-tshirt"
                >
              </div>
              <div class="form-actions">
                <button type="button" class="btn secondary" (click)="closeServiceModal()">
                  Cancel
                </button>
                <button type="submit" class="btn primary">
                  {{ editingService ? 'Update Service' : 'Add Service' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- Bill Generation Modal -->
      <div class="modal bill-modal" [class.active]="showBillModal" (click)="closeModal($event)">
        <div class="modal-content bill-modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Generate New Bill</h3>
            <button class="close-btn" (click)="closeBillModal()">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-body bill-modal-body">
            <div class="bill-modal-layout">
              <!-- Left Section - Cloths -->
              <div class="bill-left-section">
                <div class="section-header">
                  <h4><i class="fas fa-tshirt"></i> Select Items</h4>
                  <div class="service-filters">
                    <select [(ngModel)]="selectedServiceType" (change)="onServiceTypeChange()">
                      <option value="laundry">Laundry</option>
                      <option value="dry-clean">Dry Clean</option>
                      <option value="ironing">Ironing</option>
                    </select>
                    <select [(ngModel)]="selectedServiceFor" (change)="onServiceForChange()">
                      <option value="man">Man</option>
                      <option value="woman">Woman</option>
                      <option value="children">Children's</option>
                    </select>
                  </div>
                </div>
                <div class="cloths-grid">
                  <div class="cloth-item" *ngFor="let service of filteredServices" (click)="addItemToBill(service)">
                    <div class="cloth-image">
                      <div class="service-photo" [style.background-color]="getServiceColor(service.category, service.clothType)">
                        <span class="service-emoji">{{ getServiceEmoji(service.clothType) }}</span>
                      </div>
                    </div>
                    <div class="cloth-info">
                      <h5>{{ service.name }}</h5>
                      <p class="cloth-price">₹{{ getServicePrice(service) }}</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Right Section - Bill Form -->
              <div class="bill-right-section">
                <form [formGroup]="billForm" (ngSubmit)="submitBill()">
                  <div class="form-group">
                    <label for="billCustomerName">Customer Name *</label>
                    <select 
                      id="billCustomerName" 
                      formControlName="customerName"
                      (change)="onCustomerSelectChange($event)"
                      required
                    >
                      <option value="">Select Customer</option>
                      <option *ngFor="let customer of customers" [value]="customer.name" [attr.data-phone]="customer.phone">
                        {{ customer.name }} - {{ customer.phone }}
                      </option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label for="billCustomerPhone">Phone Number *</label>
                    <input 
                      type="tel"
                      id="billCustomerPhone" 
                      formControlName="customerPhone"
                      placeholder="Phone number will be auto-filled"
                      readonly
                      required
                    >
                  </div>
                  <div class="form-group">
                    <label>Selected Items ({{ selectedBillItems.length }})</label>
                    <div class="selected-items">
                      <div class="selected-item" *ngFor="let item of selectedBillItems; let i = index">
                        <div class="item-info">
                          <span class="item-name">{{ item.name }}</span>
                          <span class="item-service-type">{{ item.serviceType }}</span>
                          <span class="item-unit-price">₹{{ item.price }} each</span>
                        </div>
                        <div class="quantity-controls">
                          <button type="button" class="quantity-btn decrease" (click)="decreaseQuantity(i)" [disabled]="item.quantity <= 1">
                            <i class="fas fa-minus"></i>
                          </button>
                          <span class="quantity-display">{{ item.quantity }}</span>
                          <button type="button" class="quantity-btn increase" (click)="increaseQuantity(i)">
                            <i class="fas fa-plus"></i>
                          </button>
                        </div>
                        <div class="item-total">
                          <span class="item-price">₹{{ item.totalPrice }}</span>
                          <button type="button" class="remove-item-btn" (click)="removeItemFromBill(i)">
                            <i class="fas fa-times"></i>
                          </button>
                        </div>
                      </div>
                      <div class="no-items" *ngIf="selectedBillItems.length === 0">
                        <i class="fas fa-info-circle"></i>
                        <span>Click on items from the left to add them</span>
                      </div>
                    </div>
                  </div>
                  <div class="form-group">
                    <label for="billServiceType">Service Types *</label>
                    <select 
                      id="billServiceType" 
                      formControlName="serviceType"
                      multiple
                      required
                      class="multi-select"
                      (change)="onBillServiceTypeChange($event)"
                    >
                      <option value="Laundry">Laundry (Wash & Iron)</option>
                      <option value="Dry Clean">Dry Clean</option>
                      <option value="Ironing">Ironing Only</option>
                    </select>
                    <small class="form-help">Hold Ctrl/Cmd to select multiple service types</small>
                  </div>
                  <div class="form-group">
                    <label for="billAmount">Total Amount (₹) *</label>
                    <input 
                      type="number" 
                      id="billAmount" 
                      formControlName="amount"
                      [value]="billTotalAmount"
                      readonly
                      required
                    >
                  </div>
                  <div class="form-group">
                    <label for="billDueDate">Due Date *</label>
                    <input 
                      type="date" 
                      id="billDueDate" 
                      formControlName="dueDate"
                      required
                    >
                  </div>
                  <div class="form-group">
                    <label for="billNotes">Notes (Optional)</label>
                    <textarea 
                      id="billNotes" 
                      formControlName="notes"
                      placeholder="Any additional notes or special instructions"
                      rows="2"
                    ></textarea>
                  </div>
                  <div class="form-actions">
                    <button type="button" class="btn secondary" (click)="closeBillModal()">
                      Cancel
                    </button>
                    <button type="submit" class="btn primary" [disabled]="selectedBillItems.length === 0">
                      Generate Bill
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- View Bill Modal -->
      <div class="modal" [class.active]="showViewBillModal" (click)="closeModal($event)">
        <div class="modal-content view-bill-modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Bill Details - {{ selectedBillForView?.id }}</h3>
            <button class="close-btn" (click)="closeViewBillModal()">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-body" *ngIf="selectedBillForView">
            <div class="bill-details">
              <div class="bill-info-section">
                <h4><i class="fas fa-user"></i> Customer Information</h4>
                <div class="info-grid">
                  <div class="info-item">
                    <label>Customer Name:</label>
                    <span>{{ selectedBillForView.customer }}</span>
                  </div>
                  <div class="info-item">
                    <label>Phone:</label>
                    <span>{{ selectedBillForView.phone }}</span>
                  </div>
                </div>
              </div>

              <div class="bill-info-section">
                <h4><i class="fas fa-list"></i> Bill Information</h4>
                <div class="info-grid">
                  <div class="info-item">
                    <label>Bill ID:</label>
                    <span>{{ selectedBillForView.id }}</span>
                  </div>
                  <div class="info-item">
                    <label>Status:</label>
                    <span class="status-badge" [class]="'status-' + selectedBillForView.status.toLowerCase()">
                      {{ selectedBillForView.status }}
                    </span>
                  </div>
                  <div class="info-item">
                    <label>Service Type:</label>
                    <span>{{ selectedBillForView.serviceType }}</span>
                  </div>
                  <div class="info-item">
                    <label>Due Date:</label>
                    <span>{{ selectedBillForView.dueDate }}</span>
                  </div>
                  <div class="info-item">
                    <label>Created Date:</label>
                    <span>{{ selectedBillForView.createdDate }}</span>
                  </div>
                </div>
              </div>

              <div class="bill-info-section">
                <h4><i class="fas fa-shopping-cart"></i> Items & Services</h4>
                <div class="items-list">
                  <div class="items-breakdown" *ngIf="getBillItemsBreakdown(selectedBillForView).length > 0; else simpleItems">
                    <div class="item-row header">
                      <div class="item-name">Item</div>
                      <div class="service-type">Service Type</div>
                      <div class="quantity">Qty</div>
                      <div class="unit-price">Unit Price</div>
                      <div class="total-price">Total</div>
                    </div>
                    <div class="item-row" *ngFor="let item of getBillItemsBreakdown(selectedBillForView)">
                      <div class="item-name">{{ item.name }}</div>
                      <div class="service-type">
                        <span class="service-badge" [class]="'service-' + item.serviceType.toLowerCase().replace(' ', '-')">
                          {{ item.serviceType }}
                        </span>
                      </div>
                      <div class="quantity">{{ item.quantity }}</div>
                      <div class="unit-price">₹{{ item.unitPrice }}</div>
                      <div class="total-price">₹{{ item.totalPrice }}</div>
                    </div>
                  </div>
                  <ng-template #simpleItems>
                    <p>{{ selectedBillForView.items }}</p>
                  </ng-template>
                </div>
              </div>

              <div class="bill-info-section">
                <h4><i class="fas fa-rupee-sign"></i> Amount</h4>
                <div class="amount-display">
                  <span class="total-amount">₹{{ selectedBillForView.amount }}</span>
                </div>
              </div>

              <div class="bill-info-section" *ngIf="selectedBillForView.notes">
                <h4><i class="fas fa-sticky-note"></i> Notes</h4>
                <div class="notes-content">
                  <p>{{ selectedBillForView.notes }}</p>
                </div>
              </div>
            </div>

            <div class="modal-actions">
              <button class="btn secondary" (click)="closeViewBillModal()">
                Close
              </button>
              <button class="btn primary" (click)="printBill(selectedBillForView.id)">
                <i class="fas fa-print"></i> Print Bill
              </button>
              <button class="btn success" (click)="markPaid(selectedBillForView.id)" *ngIf="selectedBillForView.status === 'Pending'">
                <i class="fas fa-check"></i> Mark as Paid
              </button>
            </div>
          </div>
        </div>
      </div>
      </div>
    </app-main-layout>
  `,
  styles: [`
    .laundry-container {
      padding: 0;
      max-width: 1200px;
      margin: 0 auto;
    }

    /* Override main layout page-content padding */
    :host ::ng-deep .page-content {
      padding: 0 !important;
      margin: 0 !important;
    }

    /* Override content-area padding */
    :host ::ng-deep .content-area {
      padding: 0 !important;
      margin: 0 !important;
    }

    /* Override main-layout padding */
    :host ::ng-deep .main-layout {
      padding: 0 !important;
      margin: 0 !important;
    }

    /* Remove header spacing */
    :host ::ng-deep app-header {
      margin: 0 !important;
      padding: 0 !important;
    }

    /* Remove any default body/html margins */
    :host ::ng-deep body {
      margin: 0 !important;
      padding: 0 !important;
    }

    /* Ensure no spacing from parent containers */
    :host ::ng-deep * {
      box-sizing: border-box;
    }

    /* Force remove all spacing from main layout components */
    :host ::ng-deep .main-layout .content-area {
      padding: 0 !important;
      margin: 0 !important;
    }

    :host ::ng-deep .main-layout .page-content {
      padding: 0 !important;
      margin: 0 !important;
    }

    /* Remove spacing from header component */
    :host ::ng-deep .main-layout app-header {
      margin: 0 !important;
      padding: 0 !important;
    }

    /* Dashboard Content Styles (same as main dashboard) */
    .dashboard-content {
      padding: 20px;
      padding-bottom: 40px;
      overflow: visible;
      box-sizing: border-box;
    }

    .card-container {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }

    .card {
      padding: 20px;
      border-radius: 12px;
      color: white;
      box-shadow: 0 6px 16px rgba(0,0,0,0.15);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: 0.3s ease;
    }

    .card:hover {
      transform: translateY(-4px);
    }

    .card.customers {
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    }

    .card.deposits {
      background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
    }

    .card.loans {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    }

    .card.earnings {
      background: linear-gradient(135deg, #f6d365 0%, #fda085 100%);
    }

    .card h3 {
      margin-bottom: 10px;
      font-size: 20px;
      font-weight: 600;
    }

    .card p {
      font-size: 28px;
      font-weight: bold;
      margin-bottom: 10px;
    }

    .card i {
      font-size: 30px;
      opacity: 0.9;
    }

    .charts {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 30px;
      margin-bottom: 30px;
    }

    .chart-box {
      background: #ffffff;
      padding: 20px;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      overflow: visible;
      border: 1px solid #e2e8f0;
    }

    .chart-box h4 {
      margin-bottom: 10px;
      font-size: 18px;
      font-weight: 600;
      text-align: center;
      color: #1f2937;
    }

    canvas {
      width: 100% !important;
      max-height: 300px;
    }


    /* Tab Navigation */
    .tab-navigation {
      display: flex;
      gap: 5px;
      margin-bottom: 30px;
      background: white;
      border-radius: 12px;
      padding: 5px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .tab-btn {
      flex: 1;
      padding: 15px 20px;
      border: none;
      background: transparent;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      font-weight: 600;
      color: #6b7280;
      font-size: 14px;
    }

    .tab-btn:hover {
      background: #f3f4f6;
      color: #374151;
      transform: translateY(-1px);
    }

    .tab-btn.active {
      background: #3b82f6;
      color: white;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }

    .tab-btn i {
      font-size: 16px;
    }

        /* Header Layout */
        .header-left {
          display: flex;
          align-items: center;
          gap: 30px;
        }

        .header-left .form-group {
          margin-bottom: 0;
          min-width: 200px;
        }

        .header-left label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: #374151;
          font-size: 1rem;
        }

    .dropdown-container {
      position: relative;
      max-width: 300px;
    }

    .services-dropdown {
      width: 100%;
      padding: 12px 40px 12px 15px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 1rem;
      background: white;
      cursor: pointer;
      transition: border-color 0.2s ease;
      appearance: none;
      -webkit-appearance: none;
      -moz-appearance: none;
    }

    .services-dropdown:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .dropdown-arrow {
      position: absolute;
      right: 15px;
      top: 50%;
      transform: translateY(-50%);
      color: #6b7280;
      pointer-events: none;
      font-size: 14px;
    }

    .tab-content {
      animation: fadeIn 0.3s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Section Headers */
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 25px;
      padding: 20px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .section-header h2 {
      margin: 0;
      color: #374151;
      display: flex;
      align-items: center;
      gap: 10px;
      font-weight: 700;
      font-size: 1.5rem;
    }

    /* Search Section */
    .search-section {
      display: flex;
      gap: 20px;
      margin-bottom: 25px;
      align-items: center;
    }

    .search-box {
      flex: 1;
      position: relative;
    }

    .search-box i {
      position: absolute;
      left: 15px;
      top: 50%;
      transform: translateY(-50%);
      color: #6b7280;
    }

    .search-box input {
      width: 100%;
      padding: 12px 15px 12px 45px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 1rem;
      transition: border-color 0.2s ease;
    }

    .search-box input:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .filter-options select {
      padding: 12px 15px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 1rem;
      background: white;
      cursor: pointer;
    }

    /* Data Tables */
    .data-table {
      width: 100%;
      border-collapse: collapse;
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .data-table th,
    .data-table td {
      padding: 15px;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }

    .data-table th {
      background: #f9fafb;
      font-weight: 600;
      color: #374151;
    }

    .data-table tbody tr:hover {
      background: #f9fafb;
    }

    /* Services Grid */
    .services-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
    }

    /* No Services Message */
    .no-services-message {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 300px;
      margin-top: 40px;
    }

    .no-services-content {
      text-align: center;
      padding: 40px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      max-width: 400px;
    }

    .no-services-content i {
      font-size: 48px;
      color: #9ca3af;
      margin-bottom: 20px;
    }

    .no-services-content h3 {
      margin: 0 0 10px 0;
      color: #374151;
      font-size: 1.5rem;
    }

    .no-services-content p {
      margin: 0;
      color: #6b7280;
      line-height: 1.5;
    }

    /* Bill Modal Styles */
    .bill-modal .modal-content {
      width: 95%;
      max-width: 1400px;
      max-height: 90vh;
    }

    .bill-modal-body {
      padding: 0;
      max-height: calc(90vh - 120px);
      overflow: hidden;
    }

    .bill-modal-layout {
      display: flex;
      height: 100%;
    }

    .bill-left-section {
      flex: 1;
      border-right: 1px solid #e5e7eb;
      padding: 20px;
      overflow-y: auto;
      max-height: calc(90vh - 120px);
    }

    .bill-right-section {
      flex: 1;
      padding: 20px;
      overflow-y: auto;
      max-height: calc(90vh - 120px);
    }

    .service-filters {
      display: flex;
      gap: 10px;
      margin-top: 10px;
    }

    .service-filters select {
      padding: 8px 12px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 0.9rem;
    }

    .cloths-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 15px;
      margin-top: 20px;
    }

    .cloth-item {
      background: white;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      padding: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
      text-align: center;
    }

    .cloth-item:hover {
      border-color: #3b82f6;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
    }

    .cloth-item .service-photo {
      width: 60px;
      height: 60px;
      margin: 0 auto 8px;
    }

    .cloth-info h5 {
      margin: 0 0 4px 0;
      font-size: 0.9rem;
      font-weight: 600;
      color: #1f2937;
    }

    .cloth-price {
      margin: 0;
      font-size: 0.85rem;
      font-weight: 700;
      color: #059669;
    }

    .selected-items {
      max-height: 200px;
      overflow-y: auto;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 10px;
      background: #f9fafb;
    }

    .selected-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px;
      background: white;
      border-radius: 6px;
      margin-bottom: 8px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      gap: 12px;
    }

    .selected-item:last-child {
      margin-bottom: 0;
    }

    .item-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .item-name {
      font-weight: 500;
      color: #1f2937;
      font-size: 0.9rem;
    }

    .item-unit-price {
      font-size: 0.8rem;
      color: #6b7280;
    }

    .item-service-type {
      font-size: 0.75rem;
      color: #3b82f6;
      background: #eff6ff;
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 500;
    }

    .quantity-controls {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #f9fafb;
      border-radius: 6px;
      padding: 4px;
    }

    .quantity-btn {
      width: 24px;
      height: 24px;
      border: none;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 12px;
      transition: all 0.2s ease;
    }

    .quantity-btn.increase {
      background: #10b981;
      color: white;
    }

    .quantity-btn.increase:hover {
      background: #059669;
    }

    .quantity-btn.decrease {
      background: #6b7280;
      color: white;
    }

    .quantity-btn.decrease:hover:not(:disabled) {
      background: #4b5563;
    }

    .quantity-btn:disabled {
      background: #d1d5db;
      color: #9ca3af;
      cursor: not-allowed;
    }

    .quantity-display {
      min-width: 20px;
      text-align: center;
      font-weight: 600;
      color: #1f2937;
      font-size: 0.9rem;
    }

    .item-total {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .item-price {
      font-weight: 600;
      color: #059669;
      font-size: 0.9rem;
    }

    .remove-item-btn {
      background: #dc2626;
      color: white;
      border: none;
      border-radius: 50%;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 10px;
      transition: background 0.2s ease;
    }

    .remove-item-btn:hover {
      background: #b91c1c;
    }

    .no-items {
      text-align: center;
      color: #6b7280;
      font-size: 0.9rem;
      padding: 20px;
    }

    .no-items i {
      display: block;
      font-size: 24px;
      margin-bottom: 8px;
      color: #9ca3af;
    }

    .service-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      transition: transform 0.3s ease, box-shadow 0.3s ease;
      display: flex;
      align-items: flex-start;
      gap: 15px;
    }

    .service-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    }

    .service-icon {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #3b82f6;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 10px;
      flex-shrink: 0;
    }

    .service-icon i {
      font-size: 18px;
      color: white;
    }

    .service-content {
      flex: 1;
    }

    .service-content h3 {
      margin: 0 0 8px 0;
      color: #374151;
      font-size: 1.1rem;
    }

    .service-content p {
      color: #6b7280;
      margin: 0 0 12px 0;
      line-height: 1.4;
      font-size: 0.9rem;
    }

    .service-price {
      font-size: 1.5rem;
      font-weight: 700;
      color: #3b82f6;
      margin-bottom: 15px;
    }

    /* New Service Category Styles */
    .service-category {
      margin-bottom: 30px;
    }

    .category-title {
      font-size: 20px;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 15px;
      padding: 10px 0;
      border-bottom: 2px solid #3b82f6;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .sub-category {
      margin-bottom: 20px;
      margin-left: 20px;
    }

    .sub-category-title {
      font-size: 16px;
      font-weight: 500;
      color: #374151;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .service-details {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 15px;
    }

    .cloth-type {
      background: #e0f2fe;
      color: #0369a1;
      padding: 4px 8px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      display: inline-block;
      width: fit-content;
    }

    .pickup-status {
      font-size: 12px;
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .pickup-status.pickup-available {
      color: #059669;
    }

    .pickup-status.pickup-unavailable {
      color: #dc2626;
    }

    .service-price-edit {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 15px;
    }

    .service-price-edit label {
      font-weight: 500;
      color: #374151;
    }

    .price-input {
      width: 80px;
      padding: 6px 8px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 14px;
      text-align: center;
    }

    .price-input:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
    }

    /* Service Photo Styles - Emoji-based */
    .service-photo {
      width: 80px;
      height: 80px;
      margin-bottom: 10px;
      border-radius: 8px;
      overflow: hidden;
      position: relative;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .service-emoji {
      font-size: 32px;
      transition: transform 0.3s ease;
    }

    .service-photo:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .service-photo:hover .service-emoji {
      transform: scale(1.1);
    }

    .service-image-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
    }

    .service-actions {
      display: flex;
      gap: 10px;
    }


    /* Button Styles */
    .btn-small.danger {
      background: #dc2626;
      color: white;
    }

    .btn-small.danger:hover {
      background: #b91c1c;
    }

    .btn-small.success {
      background: #10b981;
      color: white;
    }

    .btn-small.success:hover {
      background: #059669;
    }

    .quick-actions {
      display: flex;
      gap: 15px;
      margin-bottom: 30px;
      flex-wrap: wrap;
    }

    .action-btn {
      padding: 12px 24px;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .action-btn.primary {
      background: #3b82f6;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .action-btn.primary:hover {
      background: #2563eb;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }

    .action-btn.secondary {
      background: #6b7280;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .action-btn.secondary:hover {
      background: #4b5563;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(107, 114, 128, 0.3);
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }

    .stat-card {
      background: white;
      padding: 25px;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .stat-icon {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      color: white;
    }

    .stat-card:nth-child(1) .stat-icon { background: #f59e0b; }
    .stat-card:nth-child(2) .stat-icon { background: #10b981; }
    .stat-card:nth-child(3) .stat-icon { background: #3b82f6; }
    .stat-card:nth-child(4) .stat-icon { background: #8b5cf6; }

    .stat-content h3 {
      font-size: 2rem;
      font-weight: 700;
      color: #374151;
      margin: 0;
    }

    .stat-content p {
      color: #6b7280;
      margin: 5px 0 0 0;
      font-weight: 500;
    }

    .recent-orders {
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .recent-orders h2 {
      padding: 20px 25px;
      margin: 0;
      background: #f9fafb;
      border-bottom: 1px solid #e5e7eb;
      color: #374151;
    }

    .table-container {
      overflow-x: auto;
    }

    .orders-table {
      width: 100%;
      border-collapse: collapse;
    }

    .orders-table th,
    .orders-table td {
      padding: 15px;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }

    .orders-table th {
      background: #f9fafb;
      font-weight: 600;
      color: #374151;
    }

    .status-badge {
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .status-pending {
      background: #fef3c7;
      color: #92400e;
    }

    .status-processing {
      background: #dbeafe;
      color: #1e40af;
    }

    .status-completed {
      background: #d1fae5;
      color: #065f46;
    }

    .status-ready {
      background: #e0e7ff;
      color: #3730a3;
    }

    .btn-small {
      padding: 6px 12px;
      border: none;
      border-radius: 6px;
      font-size: 0.875rem;
      cursor: pointer;
      margin-right: 8px;
      transition: all 0.2s ease;
    }

    .btn-small.primary {
      background: #3b82f6;
      color: white;
    }

    .btn-small.primary:hover {
      background: #2563eb;
    }

    .btn-small.secondary {
      background: #6b7280;
      color: white;
    }

    .btn-small.secondary:hover {
      background: #4b5563;
    }

    /* Modal Styles */
    .modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s ease;
    }

    .modal.active {
      opacity: 1;
      visibility: visible;
    }

    .modal-content {
      background: white;
      border-radius: 12px;
      width: 90%;
      max-width: 500px;
      max-height: 90vh;
      overflow-y: auto;
      transform: scale(0.9);
      transition: transform 0.3s ease;
    }

    .modal.active .modal-content {
      transform: scale(1);
    }

    .modal-header {
      padding: 20px 25px;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .modal-header h3 {
      margin: 0;
      color: #374151;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 20px;
      cursor: pointer;
      color: #6b7280;
      padding: 5px;
    }

    .close-btn:hover {
      color: #374151;
    }

    .modal-body {
      padding: 25px;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-group label {
      display: block;
      margin-bottom: 8px;
      font-weight: 500;
      color: #374151;
    }

    .form-group input,
    .form-group select,
    .form-group textarea {
      width: 100%;
      padding: 12px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 1rem;
      transition: border-color 0.2s ease;
    }

    .form-group input:focus,
    .form-group select:focus,
    .form-group textarea:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .readonly-input {
      background-color: #f9fafb !important;
      color: #374151 !important;
      cursor: not-allowed !important;
    }

    .readonly-input:focus {
      border-color: #d1d5db !important;
      box-shadow: none !important;
    }

    .multi-select {
      min-height: 100px;
      max-height: 120px;
      overflow-y: auto;
    }

    .multi-select option {
      padding: 8px 12px;
    }

    .form-help {
      display: block;
      margin-top: 5px;
      font-size: 0.8rem;
      color: #6b7280;
      font-style: italic;
    }

    /* Removed complex grouping styles that were causing performance issues */

    /* View Bill Modal Styles */
    .view-bill-modal {
      max-width: 90vw;
      width: 1200px;
      max-height: 90vh;
    }

    .bill-details {
      max-height: 75vh;
      overflow-y: auto;
      padding-right: 10px;
    }

    .bill-info-section {
      margin-bottom: 25px;
      padding: 20px;
      background: #f9fafb;
      border-radius: 8px;
      border-left: 4px solid #3b82f6;
    }

    .bill-info-section h4 {
      margin: 0 0 15px 0;
      color: #374151;
      font-size: 1.1rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .bill-info-section h4 i {
      color: #3b82f6;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }

    .info-item label {
      font-weight: 600;
      color: #6b7280;
      font-size: 0.9rem;
    }

    .info-item span {
      color: #1f2937;
      font-size: 1rem;
    }

    .items-list {
      background: white;
      padding: 15px;
      border-radius: 6px;
      border: 1px solid #e5e7eb;
    }

    .items-list p {
      margin: 0;
      line-height: 1.6;
      color: #374151;
    }

    .items-breakdown {
      background: white;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid #e5e7eb;
    }

    .item-row {
      display: grid;
      grid-template-columns: 2fr 1.5fr 0.8fr 1fr 1fr;
      gap: 15px;
      padding: 12px 15px;
      align-items: center;
      border-bottom: 1px solid #f3f4f6;
    }

    .item-row:last-child {
      border-bottom: none;
    }

    .item-row.header {
      background: #f8fafc;
      font-weight: 600;
      color: #374151;
      border-bottom: 2px solid #e5e7eb;
      font-size: 0.9rem;
    }

    .item-row.header .item-name,
    .item-row.header .service-type,
    .item-row.header .quantity,
    .item-row.header .unit-price,
    .item-row.header .total-price {
      color: #374151;
      font-weight: 600;
    }

    .item-name {
      font-weight: 500;
      color: #1f2937;
    }

    .service-badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 0.8rem;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .service-laundry {
      background: #dbeafe;
      color: #1e40af;
    }

    .service-dry-clean {
      background: #fef3c7;
      color: #d97706;
    }

    .service-ironing {
      background: #d1fae5;
      color: #065f46;
    }

    .service-ironing-only {
      background: #e0e7ff;
      color: #3730a3;
    }

    .quantity {
      text-align: center;
      font-weight: 500;
      color: #374151;
    }

    .unit-price {
      text-align: right;
      color: #6b7280;
    }

    .total-price {
      text-align: right;
      font-weight: 600;
      color: #059669;
    }

    .amount-display {
      text-align: center;
      padding: 20px;
      background: white;
      border-radius: 8px;
      border: 2px solid #10b981;
    }

    .total-amount {
      font-size: 2rem;
      font-weight: 700;
      color: #059669;
    }

    .notes-content {
      background: white;
      padding: 15px;
      border-radius: 6px;
      border: 1px solid #e5e7eb;
    }

    .notes-content p {
      margin: 0;
      color: #374151;
      line-height: 1.6;
    }

    .modal-actions {
      display: flex;
      gap: 15px;
      justify-content: flex-end;
      margin-top: 25px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
    }

    .btn.success {
      background: #10b981;
      color: white;
    }

    .btn.success:hover {
      background: #059669;
    }

    .form-actions {
      display: flex;
      gap: 15px;
      justify-content: flex-end;
      margin-top: 25px;
    }

    .btn {
      padding: 12px 24px;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .btn.primary {
      background: #3b82f6;
      color: white;
    }

    .btn.primary:hover {
      background: #2563eb;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }

    .btn.secondary {
      background: #6b7280;
      color: white;
    }

    .btn.secondary:hover {
      background: #4b5563;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(107, 114, 128, 0.3);
    }

    /* Responsive */
    @media (max-width: 768px) {
      .laundry-container {
        padding: 15px;
      }


      .quick-actions {
        flex-direction: column;
      }

      .stats-grid {
        grid-template-columns: 1fr;
      }

      .stat-card {
        padding: 20px;
      }

      .orders-table {
        font-size: 0.875rem;
      }

      .orders-table th,
      .orders-table td {
        padding: 10px 8px;
      }

      .modal-content {
        width: 95%;
        margin: 20px;
      }
    }
  `]
})
export class LaundryComponent implements OnInit, AfterViewInit {
  @ViewChild('barChart') barChartRef!: ElementRef;
  @ViewChild('pieChart') pieChartRef!: ElementRef;
  @ViewChild('lineChart') lineChartRef!: ElementRef;
  activeTab = 'dashboard';
  showNewOrderModal = false;
  showCustomerModal = false;
  showServiceModal = false;
  showBillModal = false;
  showViewBillModal = false;
  selectedServiceType = 'laundry'; // Default to laundry
  selectedServiceFor = 'man'; // Default to man
  filteredServices: any[] = []; // Filtered services based on dropdown selections
  selectedBillItems: any[] = []; // Items selected for the bill
  billTotalAmount = 0; // Total amount for the bill
  selectedBillForView: any = null; // Bill selected for viewing
  billItemsBreakdownCache: Map<string, any[]> = new Map(); // Cache for bill items breakdown
  editingCustomer: any = null;
  editingService: any = null;
  
  // Layout properties
  userRole = 'admin'; // Default role, you can get this from auth service
  sidenavCollapsed = false;
  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Laundry Management', route: '/laundry', active: true }
  ];
  
  // Search and filter
  customerSearchTerm = '';
  customerFilter = '';
  
  // Dashboard data (same as main dashboard)
  totalCustomers = 0;
  totalDeposits = 0;
  activeLoans = 0;
  monthlyEarnings = 0;
  customersPerMonth: Array<{ month: string; count: number }> = [];
  loanTypeDistribution: { [key: string]: number } = {};
  monthlyRevenue = 12500;
  pendingBills = 8;
  paidBills = 25;
  
  // Laundry specific data
  pendingOrders = 12;
  completedOrders = 8;
  todayRevenue = 2450;

  recentOrders = [
    { id: 'L001', customer: 'John Doe', items: '5 Shirts, 3 Pants', status: 'Processing', amount: 150, date: '2024-01-15' },
    { id: 'L002', customer: 'Jane Smith', items: '2 Suits', status: 'Ready', amount: 300, date: '2024-01-15' },
    { id: 'L003', customer: 'Mike Johnson', items: '10 Shirts', status: 'Completed', amount: 200, date: '2024-01-14' },
    { id: 'L004', customer: 'Sarah Wilson', items: '3 Dresses', status: 'Pending', amount: 180, date: '2024-01-14' },
    { id: 'L005', customer: 'David Brown', items: '1 Coat', status: 'Processing', amount: 120, date: '2024-01-13' }
  ];

  customers = [
    { id: 'C001', name: 'John Doe', phone: '+91 98765 43210', email: 'john@example.com', address: '123 Main St, City', status: 'Active', totalOrders: 15 },
    { id: 'C002', name: 'Jane Smith', phone: '+91 98765 43211', email: 'jane@example.com', address: '456 Oak Ave, City', status: 'VIP', totalOrders: 25 },
    { id: 'C003', name: 'Mike Johnson', phone: '+91 98765 43212', email: 'mike@example.com', address: '789 Pine Rd, City', status: 'Active', totalOrders: 8 },
    { id: 'C004', name: 'Sarah Wilson', phone: '+91 98765 43213', email: 'sarah@example.com', address: '321 Elm St, City', status: 'Inactive', totalOrders: 3 },
    { id: 'C005', name: 'David Brown', phone: '+91 98765 43214', email: 'david@example.com', address: '654 Maple Dr, City', status: 'Active', totalOrders: 12 }
  ];

  filteredCustomers = [...this.customers];

  services = [
    // Men's Services - Comprehensive Collection
    { id: 'M001', name: 'Men Formal Shirt', description: 'Wash & Iron for Men Formal Shirts', price: 25, laundryPrice: 25, dryCleanPrice: 45, ironingPrice: 15, icon: 'fas fa-tshirt', category: 'Men', clothType: 'Formal Shirt', pickup: true, photo: 'https://via.placeholder.com/80x80/3b82f6/ffffff?text=👔' },
    { id: 'M002', name: 'Men Casual Shirt', description: 'Wash & Iron for Men Casual Shirts', price: 22, laundryPrice: 22, dryCleanPrice: 40, ironingPrice: 12, icon: 'fas fa-tshirt', category: 'Men', clothType: 'Casual Shirt', pickup: true, photo: 'https://via.placeholder.com/80x80/3b82f6/ffffff?text=👕' },
    { id: 'M003', name: 'Men T-Shirt', description: 'Wash & Iron for Men T-Shirts', price: 20, laundryPrice: 20, dryCleanPrice: 35, ironingPrice: 10, icon: 'fas fa-tshirt', category: 'Men', clothType: 'T-Shirt', pickup: true, photo: 'https://via.placeholder.com/80x80/3b82f6/ffffff?text=👕' },
    { id: 'M004', name: 'Men Polo Shirt', description: 'Wash & Iron for Men Polo Shirts', price: 23, icon: 'fas fa-tshirt', category: 'Men', clothType: 'Polo Shirt', pickup: true, photo: 'https://via.placeholder.com/80x80/3b82f6/ffffff?text=👕' },
    { id: 'M005', name: 'Men Tank Top', description: 'Wash & Iron for Men Tank Tops', price: 18, icon: 'fas fa-tshirt', category: 'Men', clothType: 'Tank Top', pickup: true, photo: 'https://via.placeholder.com/80x80/3b82f6/ffffff?text=👕' },
    { id: 'M006', name: 'Men Hoodie', description: 'Wash & Iron for Men Hoodies', price: 35, icon: 'fas fa-tshirt', category: 'Men', clothType: 'Hoodie', pickup: true, photo: 'https://via.placeholder.com/80x80/3b82f6/ffffff?text=🧥' },
    { id: 'M007', name: 'Men Sweatshirt', description: 'Wash & Iron for Men Sweatshirts', price: 32, icon: 'fas fa-tshirt', category: 'Men', clothType: 'Sweatshirt', pickup: true, photo: 'https://via.placeholder.com/80x80/3b82f6/ffffff?text=🧥' },
    { id: 'M008', name: 'Men Formal Trousers', description: 'Wash & Iron for Men Formal Trousers', price: 30, icon: 'fas fa-user-tie', category: 'Men', clothType: 'Formal Trousers', pickup: true, photo: 'https://via.placeholder.com/80x80/3b82f6/ffffff?text=👖' },
    { id: 'M009', name: 'Men Casual Trousers', description: 'Wash & Iron for Men Casual Trousers', price: 28, icon: 'fas fa-user-tie', category: 'Men', clothType: 'Casual Trousers', pickup: true, photo: 'https://via.placeholder.com/80x80/3b82f6/ffffff?text=👖' },
    { id: 'M010', name: 'Men Jeans', description: 'Wash & Iron for Men Jeans', price: 35, icon: 'fas fa-user', category: 'Men', clothType: 'Jeans', pickup: true, photo: 'https://via.placeholder.com/80x80/3b82f6/ffffff?text=👖' },
    { id: 'M011', name: 'Men Shorts', description: 'Wash & Iron for Men Shorts', price: 22, icon: 'fas fa-user', category: 'Men', clothType: 'Shorts', pickup: true, photo: 'https://via.placeholder.com/80x80/3b82f6/ffffff?text=🩳' },
    { id: 'M012', name: 'Men Track Pants', description: 'Wash & Iron for Men Track Pants', price: 25, icon: 'fas fa-user', category: 'Men', clothType: 'Track Pants', pickup: true, photo: 'https://via.placeholder.com/80x80/3b82f6/ffffff?text=👖' },
    { id: 'M013', name: 'Men Suit Jacket', description: 'Dry Clean for Men Suit Jackets', price: 80, laundryPrice: 60, dryCleanPrice: 80, ironingPrice: 35, icon: 'fas fa-suitcase', category: 'Men', clothType: 'Suit Jacket', pickup: true, photo: 'https://via.placeholder.com/80x80/10b981/ffffff?text=👔' },
    { id: 'M014', name: 'Men Blazer', description: 'Dry Clean for Men Blazers', price: 75, icon: 'fas fa-suitcase', category: 'Men', clothType: 'Blazer', pickup: true, photo: 'https://via.placeholder.com/80x80/10b981/ffffff?text=👔' },
    { id: 'M015', name: 'Men Waistcoat', description: 'Dry Clean for Men Waistcoats', price: 45, icon: 'fas fa-suitcase', category: 'Men', clothType: 'Waistcoat', pickup: true, photo: 'https://via.placeholder.com/80x80/10b981/ffffff?text=👔' },
    { id: 'M016', name: 'Men Coat', description: 'Dry Clean for Men Coats', price: 90, icon: 'fas fa-suitcase', category: 'Men', clothType: 'Coat', pickup: true, photo: 'https://via.placeholder.com/80x80/10b981/ffffff?text=🧥' },
    { id: 'M017', name: 'Men Jacket', description: 'Wash & Iron for Men Jackets', price: 40, icon: 'fas fa-suitcase', category: 'Men', clothType: 'Jacket', pickup: true, photo: 'https://via.placeholder.com/80x80/3b82f6/ffffff?text=🧥' },
    { id: 'M018', name: 'Men Sweater', description: 'Wash & Iron for Men Sweaters', price: 38, icon: 'fas fa-tshirt', category: 'Men', clothType: 'Sweater', pickup: true, photo: 'https://via.placeholder.com/80x80/3b82f6/ffffff?text=🧥' },
    { id: 'M019', name: 'Men Cardigan', description: 'Wash & Iron for Men Cardigans', price: 35, icon: 'fas fa-tshirt', category: 'Men', clothType: 'Cardigan', pickup: true, photo: 'https://via.placeholder.com/80x80/3b82f6/ffffff?text=🧥' },
    { id: 'M020', name: 'Men Vest', description: 'Wash & Iron for Men Vests', price: 20, icon: 'fas fa-tshirt', category: 'Men', clothType: 'Vest', pickup: true, photo: 'https://via.placeholder.com/80x80/3b82f6/ffffff?text=👕' },
    { id: 'M021', name: 'Men Kurta', description: 'Wash & Iron for Men Kurtas', price: 35, icon: 'fas fa-user', category: 'Men', clothType: 'Kurta', pickup: true, photo: 'https://via.placeholder.com/80x80/3b82f6/ffffff?text=👕' },
    { id: 'M022', name: 'Men Pyjama', description: 'Wash & Iron for Men Pyjamas', price: 25, icon: 'fas fa-user', category: 'Men', clothType: 'Pyjama', pickup: true, photo: 'https://via.placeholder.com/80x80/3b82f6/ffffff?text=👖' },
    { id: 'M023', name: 'Men Lungi', description: 'Wash & Iron for Men Lungis', price: 20, icon: 'fas fa-user', category: 'Men', clothType: 'Lungi', pickup: true, photo: 'https://via.placeholder.com/80x80/3b82f6/ffffff?text=👖' },
    { id: 'M024', name: 'Men Underwear', description: 'Wash & Iron for Men Underwear', price: 15, icon: 'fas fa-user', category: 'Men', clothType: 'Underwear', pickup: true, photo: 'https://via.placeholder.com/80x80/3b82f6/ffffff?text=🩲' },
    { id: 'M025', name: 'Men Socks', description: 'Wash & Iron for Men Socks', price: 10, icon: 'fas fa-user', category: 'Men', clothType: 'Socks', pickup: true, photo: 'https://via.placeholder.com/80x80/3b82f6/ffffff?text=🧦' },
    
    // Women's Services - Comprehensive Collection
    { id: 'W001', name: 'Women Blouse', description: 'Wash & Iron for Women Blouses', price: 30, laundryPrice: 30, dryCleanPrice: 50, ironingPrice: 18, icon: 'fas fa-female', category: 'Women', clothType: 'Blouse', pickup: true, photo: 'https://via.placeholder.com/80x80/f472b6/ffffff?text=👚' },
    { id: 'W002', name: 'Women Formal Shirt', description: 'Wash & Iron for Women Formal Shirts', price: 28, icon: 'fas fa-female', category: 'Women', clothType: 'Formal Shirt', pickup: true, photo: 'https://via.placeholder.com/80x80/f472b6/ffffff?text=👔' },
    { id: 'W003', name: 'Women Casual Shirt', description: 'Wash & Iron for Women Casual Shirts', price: 25, icon: 'fas fa-female', category: 'Women', clothType: 'Casual Shirt', pickup: true, photo: 'https://via.placeholder.com/80x80/f472b6/ffffff?text=👚' },
    { id: 'W004', name: 'Women T-Shirt', description: 'Wash & Iron for Women T-Shirts', price: 22, icon: 'fas fa-female', category: 'Women', clothType: 'T-Shirt', pickup: true, photo: 'https://via.placeholder.com/80x80/f472b6/ffffff?text=👚' },
    { id: 'W005', name: 'Women Tank Top', description: 'Wash & Iron for Women Tank Tops', price: 20, icon: 'fas fa-female', category: 'Women', clothType: 'Tank Top', pickup: true, photo: 'https://via.placeholder.com/80x80/f472b6/ffffff?text=👚' },
    { id: 'W006', name: 'Women Crop Top', description: 'Wash & Iron for Women Crop Tops', price: 18, icon: 'fas fa-female', category: 'Women', clothType: 'Crop Top', pickup: true, photo: 'https://via.placeholder.com/80x80/f472b6/ffffff?text=👚' },
    { id: 'W007', name: 'Women Hoodie', description: 'Wash & Iron for Women Hoodies', price: 35, icon: 'fas fa-female', category: 'Women', clothType: 'Hoodie', pickup: true, photo: 'https://via.placeholder.com/80x80/f472b6/ffffff?text=🧥' },
    { id: 'W008', name: 'Women Sweatshirt', description: 'Wash & Iron for Women Sweatshirts', price: 32, icon: 'fas fa-female', category: 'Women', clothType: 'Sweatshirt', pickup: true, photo: 'https://via.placeholder.com/80x80/f472b6/ffffff?text=🧥' },
    { id: 'W009', name: 'Women Dress', description: 'Wash & Iron for Women Dresses', price: 50, icon: 'fas fa-venus', category: 'Women', clothType: 'Dress', pickup: true, photo: 'https://via.placeholder.com/80x80/f472b6/ffffff?text=👗' },
    { id: 'W010', name: 'Women Formal Dress', description: 'Dry Clean for Women Formal Dresses', price: 80, icon: 'fas fa-venus', category: 'Women', clothType: 'Formal Dress', pickup: true, photo: 'https://via.placeholder.com/80x80/10b981/ffffff?text=👗' },
    { id: 'W011', name: 'Women Casual Dress', description: 'Wash & Iron for Women Casual Dresses', price: 45, icon: 'fas fa-venus', category: 'Women', clothType: 'Casual Dress', pickup: true, photo: 'https://via.placeholder.com/80x80/f472b6/ffffff?text=👗' },
    { id: 'W012', name: 'Women Maxi Dress', description: 'Wash & Iron for Women Maxi Dresses', price: 55, icon: 'fas fa-venus', category: 'Women', clothType: 'Maxi Dress', pickup: true, photo: 'https://via.placeholder.com/80x80/f472b6/ffffff?text=👗' },
    { id: 'W013', name: 'Women Skirt', description: 'Wash & Iron for Women Skirts', price: 25, icon: 'fas fa-female', category: 'Women', clothType: 'Skirt', pickup: true, photo: 'https://via.placeholder.com/80x80/f472b6/ffffff?text=👗' },
    { id: 'W014', name: 'Women Mini Skirt', description: 'Wash & Iron for Women Mini Skirts', price: 22, icon: 'fas fa-female', category: 'Women', clothType: 'Mini Skirt', pickup: true, photo: 'https://via.placeholder.com/80x80/f472b6/ffffff?text=👗' },
    { id: 'W015', name: 'Women Midi Skirt', description: 'Wash & Iron for Women Midi Skirts', price: 28, icon: 'fas fa-female', category: 'Women', clothType: 'Midi Skirt', pickup: true, photo: 'https://via.placeholder.com/80x80/f472b6/ffffff?text=👗' },
    { id: 'W016', name: 'Women Maxi Skirt', description: 'Wash & Iron for Women Maxi Skirts', price: 30, icon: 'fas fa-female', category: 'Women', clothType: 'Maxi Skirt', pickup: true, photo: 'https://via.placeholder.com/80x80/f472b6/ffffff?text=👗' },
    { id: 'W017', name: 'Women Formal Trousers', description: 'Wash & Iron for Women Formal Trousers', price: 30, icon: 'fas fa-female', category: 'Women', clothType: 'Formal Trousers', pickup: true, photo: 'https://via.placeholder.com/80x80/f472b6/ffffff?text=👖' },
    { id: 'W018', name: 'Women Casual Trousers', description: 'Wash & Iron for Women Casual Trousers', price: 28, icon: 'fas fa-female', category: 'Women', clothType: 'Casual Trousers', pickup: true, photo: 'https://via.placeholder.com/80x80/f472b6/ffffff?text=👖' },
    { id: 'W019', name: 'Women Jeans', description: 'Wash & Iron for Women Jeans', price: 35, icon: 'fas fa-female', category: 'Women', clothType: 'Jeans', pickup: true, photo: 'https://via.placeholder.com/80x80/f472b6/ffffff?text=👖' },
    { id: 'W020', name: 'Women Shorts', description: 'Wash & Iron for Women Shorts', price: 22, icon: 'fas fa-female', category: 'Women', clothType: 'Shorts', pickup: true, photo: 'https://via.placeholder.com/80x80/f472b6/ffffff?text=🩳' },
    { id: 'W021', name: 'Women Track Pants', description: 'Wash & Iron for Women Track Pants', price: 25, icon: 'fas fa-female', category: 'Women', clothType: 'Track Pants', pickup: true, photo: 'https://via.placeholder.com/80x80/f472b6/ffffff?text=👖' },
    { id: 'W022', name: 'Women Leggings', description: 'Wash & Iron for Women Leggings', price: 20, icon: 'fas fa-female', category: 'Women', clothType: 'Leggings', pickup: true, photo: 'https://via.placeholder.com/80x80/f472b6/ffffff?text=👖' },
    { id: 'W023', name: 'Women Jeggings', description: 'Wash & Iron for Women Jeggings', price: 28, icon: 'fas fa-female', category: 'Women', clothType: 'Jeggings', pickup: true, photo: 'https://via.placeholder.com/80x80/f472b6/ffffff?text=👖' },
    { id: 'W024', name: 'Women Saree', description: 'Dry Clean for Women Sarees', price: 60, icon: 'fas fa-female', category: 'Women', clothType: 'Saree', pickup: true, photo: 'https://via.placeholder.com/80x80/10b981/ffffff?text=👗' },
    { id: 'W025', name: 'Women Kurta', description: 'Wash & Iron for Women Kurtas', price: 40, icon: 'fas fa-female', category: 'Women', clothType: 'Kurta', pickup: true, photo: 'https://via.placeholder.com/80x80/f472b6/ffffff?text=👚' },
    { id: 'W026', name: 'Women Salwar Kameez', description: 'Wash & Iron for Women Salwar Kameez', price: 45, icon: 'fas fa-female', category: 'Women', clothType: 'Salwar Kameez', pickup: true, photo: 'https://via.placeholder.com/80x80/f472b6/ffffff?text=👚' },
    { id: 'W027', name: 'Women Palazzo', description: 'Wash & Iron for Women Palazzos', price: 35, icon: 'fas fa-female', category: 'Women', clothType: 'Palazzo', pickup: true, photo: 'https://via.placeholder.com/80x80/f472b6/ffffff?text=👖' },
    { id: 'W028', name: 'Women Churidar', description: 'Wash & Iron for Women Churidars', price: 30, icon: 'fas fa-female', category: 'Women', clothType: 'Churidar', pickup: true, photo: 'https://via.placeholder.com/80x80/f472b6/ffffff?text=👖' },
    { id: 'W029', name: 'Women Blazer', description: 'Dry Clean for Women Blazers', price: 70, icon: 'fas fa-suitcase', category: 'Women', clothType: 'Blazer', pickup: true, photo: 'https://via.placeholder.com/80x80/10b981/ffffff?text=👔' },
    { id: 'W030', name: 'Women Jacket', description: 'Wash & Iron for Women Jackets', price: 40, icon: 'fas fa-suitcase', category: 'Women', clothType: 'Jacket', pickup: true, photo: 'https://via.placeholder.com/80x80/f472b6/ffffff?text=🧥' },
    { id: 'W031', name: 'Women Coat', description: 'Dry Clean for Women Coats', price: 85, icon: 'fas fa-suitcase', category: 'Women', clothType: 'Coat', pickup: true, photo: 'https://via.placeholder.com/80x80/10b981/ffffff?text=🧥' },
    { id: 'W032', name: 'Women Sweater', description: 'Wash & Iron for Women Sweaters', price: 38, icon: 'fas fa-tshirt', category: 'Women', clothType: 'Sweater', pickup: true, photo: 'https://via.placeholder.com/80x80/f472b6/ffffff?text=🧥' },
    { id: 'W033', name: 'Women Cardigan', description: 'Wash & Iron for Women Cardigans', price: 35, icon: 'fas fa-tshirt', category: 'Women', clothType: 'Cardigan', pickup: true, photo: 'https://via.placeholder.com/80x80/f472b6/ffffff?text=🧥' },
    { id: 'W034', name: 'Women Vest', description: 'Wash & Iron for Women Vests', price: 25, icon: 'fas fa-tshirt', category: 'Women', clothType: 'Vest', pickup: true, photo: 'https://via.placeholder.com/80x80/f472b6/ffffff?text=👚' },
    { id: 'W035', name: 'Women Nightdress', description: 'Wash & Iron for Women Nightdresses', price: 30, icon: 'fas fa-female', category: 'Women', clothType: 'Nightdress', pickup: true, photo: 'https://via.placeholder.com/80x80/f472b6/ffffff?text=👗' },
    { id: 'W036', name: 'Women Pyjama', description: 'Wash & Iron for Women Pyjamas', price: 25, icon: 'fas fa-female', category: 'Women', clothType: 'Pyjama', pickup: true, photo: 'https://via.placeholder.com/80x80/f472b6/ffffff?text=👖' },
    { id: 'W037', name: 'Women Bra', description: 'Wash & Iron for Women Bras', price: 15, icon: 'fas fa-female', category: 'Women', clothType: 'Bra', pickup: true, photo: 'https://via.placeholder.com/80x80/f472b6/ffffff?text=👙' },
    { id: 'W038', name: 'Women Panties', description: 'Wash & Iron for Women Panties', price: 12, icon: 'fas fa-female', category: 'Women', clothType: 'Panties', pickup: true, photo: 'https://via.placeholder.com/80x80/f472b6/ffffff?text=👙' },
    { id: 'W039', name: 'Women Stockings', description: 'Wash & Iron for Women Stockings', price: 10, icon: 'fas fa-female', category: 'Women', clothType: 'Stockings', pickup: true, photo: 'https://via.placeholder.com/80x80/f472b6/ffffff?text=🧦' },
    
    // Children's Services (Boy)
    { id: 'CB001', name: 'Boy Shirt', description: 'Wash & Iron for Boy Shirts', price: 15, icon: 'fas fa-child', category: 'Children', clothType: 'Boy Shirt', pickup: true, photo: 'https://via.placeholder.com/80x80/f59e0b/ffffff?text=👕' },
    { id: 'CB002', name: 'Boy Shorts', description: 'Wash & Iron for Boy Shorts', price: 12, icon: 'fas fa-child', category: 'Children', clothType: 'Boy Shorts', pickup: true, photo: 'https://via.placeholder.com/80x80/f59e0b/ffffff?text=🩳' },
    { id: 'CB003', name: 'Boy T-Shirt', description: 'Wash & Iron for Boy T-Shirts', price: 10, icon: 'fas fa-child', category: 'Children', clothType: 'Boy T-Shirt', pickup: true, photo: 'https://via.placeholder.com/80x80/f59e0b/ffffff?text=👕' },
    { id: 'CB004', name: 'Boy Pants', description: 'Wash & Iron for Boy Pants', price: 18, icon: 'fas fa-child', category: 'Children', clothType: 'Boy Pants', pickup: true, photo: 'https://via.placeholder.com/80x80/f59e0b/ffffff?text=👖' },
    
    // Children's Services (Girl)
    { id: 'CG001', name: 'Girl Dress', description: 'Wash & Iron for Girl Dresses', price: 20, icon: 'fas fa-child', category: 'Children', clothType: 'Girl Dress', pickup: true, photo: 'https://via.placeholder.com/80x80/ec4899/ffffff?text=👗' },
    { id: 'CG002', name: 'Girl Skirt', description: 'Wash & Iron for Girl Skirts', price: 15, icon: 'fas fa-child', category: 'Children', clothType: 'Girl Skirt', pickup: true, photo: 'https://via.placeholder.com/80x80/ec4899/ffffff?text=👗' },
    { id: 'CG003', name: 'Girl Top', description: 'Wash & Iron for Girl Tops', price: 12, icon: 'fas fa-child', category: 'Children', clothType: 'Girl Top', pickup: true, photo: 'https://via.placeholder.com/80x80/ec4899/ffffff?text=👚' },
    { id: 'CG004', name: 'Girl Frock', description: 'Wash & Iron for Girl Frocks', price: 18, icon: 'fas fa-child', category: 'Children', clothType: 'Girl Frock', pickup: true, photo: 'https://via.placeholder.com/80x80/ec4899/ffffff?text=👗' }
  ];

  bills = [
    { 
      id: 'B001', 
      customer: 'John Doe', 
      amount: 450, 
      status: 'Pending', 
      dueDate: '2024-01-20',
      phone: '+91 98765 43210',
      items: '2x Men Shirt (Laundry), 1x Men Blazer (Dry Clean), 1x Men Trousers (Ironing)',
      serviceType: 'Laundry, Dry Clean, Ironing',
      notes: 'Handle with care',
      createdDate: '2024-01-15',
      selectedItems: []
    },
    { 
      id: 'B002', 
      customer: 'Jane Smith', 
      amount: 320, 
      status: 'Paid', 
      dueDate: '2024-01-18',
      phone: '+91 98765 43211',
      items: '3x Women Dress (Dry Clean), 2x Women Blouse (Laundry)',
      serviceType: 'Dry Clean, Laundry',
      notes: '',
      createdDate: '2024-01-13',
      selectedItems: []
    },
    { 
      id: 'B003', 
      customer: 'Mike Johnson', 
      amount: 180, 
      status: 'Pending', 
      dueDate: '2024-01-22',
      phone: '+91 98765 43212',
      items: '1x Men Suit (Dry Clean), 2x Men Shirt (Laundry)',
      serviceType: 'Dry Clean, Laundry',
      notes: 'Express service required',
      createdDate: '2024-01-17',
      selectedItems: []
    },
    { 
      id: 'B004', 
      customer: 'Sarah Wilson', 
      amount: 250, 
      status: 'Paid', 
      dueDate: '2024-01-15',
      phone: '+91 98765 43213',
      items: '2x Women Kurta (Laundry), 1x Women Saree (Dry Clean)',
      serviceType: 'Laundry, Dry Clean',
      notes: '',
      createdDate: '2024-01-10',
      selectedItems: []
    },
    { 
      id: 'B005', 
      customer: 'David Brown', 
      amount: 380, 
      status: 'Pending', 
      dueDate: '2024-01-25',
      phone: '+91 98765 43214',
      items: '1x Men Coat (Dry Clean), 3x Men Shirt (Laundry), 2x Men Pants (Ironing)',
      serviceType: 'Dry Clean, Laundry, Ironing',
      notes: 'Fragile items',
      createdDate: '2024-01-20',
      selectedItems: []
    }
  ];

  newOrderForm: FormGroup;
  customerForm: FormGroup;
  serviceForm: FormGroup;
  billForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.newOrderForm = this.fb.group({
      customerName: ['', Validators.required],
      customerPhone: ['', Validators.required],
      items: ['', Validators.required],
      serviceType: ['', Validators.required],
      amount: ['', Validators.required],
      pickupDate: ['', Validators.required]
    });

    this.customerForm = this.fb.group({
      name: ['', Validators.required],
      phone: ['', Validators.required],
      email: [''],
      address: [''],
      status: ['active']
    });

    this.serviceForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      price: ['', Validators.required],
      icon: ['fas fa-cog']
    });

    this.billForm = this.fb.group({
      customerName: ['', Validators.required],
      customerPhone: ['', Validators.required],
      items: ['', Validators.required],
      serviceType: [[], Validators.required],
      amount: ['', [Validators.required, Validators.min(1)]],
      dueDate: ['', Validators.required],
      notes: ['']
    });
  }

  ngOnInit() {
    this.userRole = sessionStorage.getItem('role') || '';
    // Initialize price properties for all services
    this.initializeServicePrices();
    // Initialize filtered services
    this.filterServices();
    
    // Debug: Log first service to check structure
    if (this.services.length > 0) {
      console.log('First service structure:', this.services[0]);
    }
  }


  // Initialize missing price properties for all services
  initializeServicePrices() {
    this.services.forEach(service => {
      if (!service.laundryPrice) {
        service.laundryPrice = service.price;
      }
      if (!service.dryCleanPrice) {
        service.dryCleanPrice = Math.round(service.price * 1.5); // 50% more for dry clean
      }
      if (!service.ironingPrice) {
        service.ironingPrice = Math.round(service.price * 0.6); // 40% less for ironing only
      }
    });
  }

  ngAfterViewInit() {
    // Wait for data to load before initializing charts
    setTimeout(() => {
      this.initCharts();
    }, 100);
  }

  initCharts() {
    // Prepare data for charts - Laundry specific data
    const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const orderCounts = [12, 18, 15, 22, 25, 28]; // Sample laundry orders per month
    
    // Bar Chart - Orders Per Month
    new Chart(this.barChartRef.nativeElement, {
      type: 'bar',
      data: {
        labels: monthLabels,
        datasets: [{
          label: 'Orders',
          data: orderCounts,
          backgroundColor: [
            'rgba(59, 130, 246, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(139, 92, 246, 0.8)',
            'rgba(239, 68, 68, 0.8)',
            'rgba(236, 72, 153, 0.8)'
          ],
          borderColor: [
            'rgba(59, 130, 246, 1)',
            'rgba(16, 185, 129, 1)',
            'rgba(245, 158, 11, 1)',
            'rgba(139, 92, 246, 1)',
            'rgba(239, 68, 68, 1)',
            'rgba(236, 72, 153, 1)'
          ],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: {
              color: '#374151',
              font: {
                size: 14,
                weight: 'bold'
              }
            }
          }
        },
        scales: {
          x: {
            ticks: {
              color: '#374151',
              font: {
                size: 12,
                weight: 'bold'
              }
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.1)'
            }
          },
          y: {
            beginAtZero: true,
            ticks: {
              color: '#374151',
              font: {
                size: 12,
                weight: 'bold'
              }
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.1)'
            }
          }
        }
      }
    });

    // Pie Chart - Service Distribution
    const serviceLabels = ['Wash & Fold', 'Dry Cleaning', 'Ironing', 'Express Service'];
    const serviceCounts = [45, 25, 20, 10]; // Sample service distribution
    const colors = [
      'rgba(59, 130, 246, 0.8)',
      'rgba(16, 185, 129, 0.8)', 
      'rgba(245, 158, 11, 0.8)',
      'rgba(139, 92, 246, 0.8)',
      'rgba(239, 68, 68, 0.8)',
      'rgba(236, 72, 153, 0.8)'
    ];
    
    new Chart(this.pieChartRef.nativeElement, {
      type: 'pie',
      data: {
        labels: serviceLabels,
        datasets: [{
          data: serviceCounts,
          backgroundColor: colors.slice(0, serviceCounts.length),
          borderColor: colors.map(color => color.replace('0.8', '1')),
          borderWidth: 2
        }]
      },
      options: { 
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: {
              color: '#374151',
              font: {
                size: 14,
                weight: 'bold'
              }
            }
          }
        }
      }
    });

    // Line Chart - Laundry Revenue
    new Chart(this.lineChartRef.nativeElement, {
      type: 'line',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
          label: 'Laundry Revenue (in ₹)',
          data: [8500, 12000, 10500, 15000, 13500, 18000],
          borderColor: 'rgba(139, 92, 246, 1)',
          backgroundColor: 'rgba(139, 92, 246, 0.1)',
          fill: true,
          tension: 0.4,
          borderWidth: 3,
          pointBackgroundColor: 'rgba(139, 92, 246, 1)',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: {
              color: '#374151',
              font: {
                size: 14,
                weight: 'bold'
              }
            }
          }
        },
        scales: {
          x: {
            ticks: {
              color: '#374151',
              font: {
                size: 12,
                weight: 'bold'
              }
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.1)'
            }
          },
          y: {
            beginAtZero: true,
            ticks: {
              color: '#374151',
              font: {
                size: 12,
                weight: 'bold'
              }
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.1)'
            }
          }
        }
      }
    });
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }

  // Services field methods
  onServiceTypeChange() {
    console.log('Selected service type:', this.selectedServiceType);
    // Trigger change detection to update displayed prices
    this.filteredServices = [...this.filteredServices];
  }

  onServiceForChange() {
    console.log('Selected service for:', this.selectedServiceFor);
    this.filterServices();
  }

  filterServices() {
    // Filter by target audience only - show all clothes for the selected category
    this.filteredServices = this.services.filter(service => {
      if (this.selectedServiceFor === 'man') {
        return service.category === 'Men';
      } else if (this.selectedServiceFor === 'woman') {
        return service.category === 'Women';
      } else if (this.selectedServiceFor === 'children') {
        return service.category === 'Children';
      }
      return false;
    });
  }

  // Get the price for a specific service type and cloth
  getServicePrice(service: any): number {
    let price = service.price; // Default price
    
    if (this.selectedServiceType === 'laundry') {
      price = service.laundryPrice || service.price;
    } else if (this.selectedServiceType === 'dry-clean') {
      price = service.dryCleanPrice || service.price;
    } else if (this.selectedServiceType === 'ironing') {
      price = service.ironingPrice || service.price;
    }
    
    console.log('Getting price for', service.name, 'service type:', this.selectedServiceType, 'price:', price);
    return price;
  }

  // Update the price for a specific service type and cloth
  updateServicePrice(service: any, newPrice: number) {
    console.log('Updating price for', service.name, 'to', newPrice, 'for service type:', this.selectedServiceType);
    
    if (this.selectedServiceType === 'laundry') {
      service.laundryPrice = newPrice;
      console.log('Set laundryPrice to:', service.laundryPrice);
    } else if (this.selectedServiceType === 'dry-clean') {
      service.dryCleanPrice = newPrice;
      console.log('Set dryCleanPrice to:', service.dryCleanPrice);
    } else if (this.selectedServiceType === 'ironing') {
      service.ironingPrice = newPrice;
      console.log('Set ironingPrice to:', service.ironingPrice);
    }
    
    // Also update the base price
    service.price = newPrice;
    
    // Force change detection
    this.filteredServices = [...this.filteredServices];
  }

  // Get display name for service type
  getServiceTypeDisplayName(): string {
    if (this.selectedServiceType === 'laundry') {
      return 'Laundry';
    } else if (this.selectedServiceType === 'dry-clean') {
      return 'Dry Clean';
    } else if (this.selectedServiceType === 'ironing') {
      return 'Ironing';
    }
    return 'Service';
  }

  // Get the property name for the current service type price
  getServicePriceProperty(): string {
    if (this.selectedServiceType === 'laundry') {
      return 'laundryPrice';
    } else if (this.selectedServiceType === 'dry-clean') {
      return 'dryCleanPrice';
    } else if (this.selectedServiceType === 'ironing') {
      return 'ironingPrice';
    }
    return 'price';
  }

  // Handle price change
  onPriceChange(service: any) {
    // Ensure the base price is also updated
    service.price = service[this.getServicePriceProperty()] || service.price;
    console.log('Price updated for', service.name, ':', service[this.getServicePriceProperty()]);
  }

  // Debug method to check prices
  debugPrices() {
    console.log('=== DEBUG PRICES ===');
    console.log('Selected service type:', this.selectedServiceType);
    console.log('Selected service for:', this.selectedServiceFor);
    console.log('Filtered services count:', this.filteredServices.length);
    
    if (this.filteredServices.length > 0) {
      const firstService = this.filteredServices[0];
      console.log('First service:', firstService.name);
      console.log('Base price:', firstService.price);
      console.log('Laundry price:', firstService.laundryPrice);
      console.log('Dry clean price:', firstService.dryCleanPrice);
      console.log('Ironing price:', firstService.ironingPrice);
      console.log('Current displayed price:', this.getServicePrice(firstService));
    }
    console.log('=== END DEBUG ===');
  }

  getServiceColor(category: string, clothType: string): string {
    // Color coding based on category and service type
    if (category === 'Men') {
      return '#3b82f6'; // Blue for men's services
    } else if (category === 'Women') {
      return '#f472b6'; // Pink for women's services
    } else if (category === 'Children') {
      if (clothType.includes('Boy')) {
        return '#f59e0b'; // Orange for boy's clothes
      } else {
        return '#ec4899'; // Pink for girl's clothes
      }
    }
    
    // Check if it's a dry clean service
    if (clothType.includes('Suit') || clothType.includes('Blazer') || clothType.includes('Coat') || 
        clothType.includes('Waistcoat') || clothType.includes('Formal Dress') || clothType.includes('Saree')) {
      return '#10b981'; // Green for dry clean services
    }
    
    return '#6b7280'; // Default gray
  }

  getServiceEmoji(clothType: string): string {
    // Return appropriate emoji based on cloth type
    const type = clothType.toLowerCase();
    
    if (type.includes('shirt') && !type.includes('t-shirt')) {
      return '👔';
    } else if (type.includes('t-shirt') || type.includes('polo')) {
      return '👕';
    } else if (type.includes('dress') || type.includes('frock')) {
      return '👗';
    } else if (type.includes('skirt')) {
      return '👗';
    } else if (type.includes('pants') || type.includes('trousers') || type.includes('jeans') || 
               type.includes('track') || type.includes('leggings') || type.includes('jeggings') || 
               type.includes('palazzo') || type.includes('churidar') || type.includes('pyjama') || 
               type.includes('lungi')) {
      return '👖';
    } else if (type.includes('shorts')) {
      return '🩳';
    } else if (type.includes('hoodie') || type.includes('sweatshirt') || type.includes('sweater') || 
               type.includes('cardigan') || type.includes('jacket') || type.includes('coat')) {
      return '🧥';
    } else if (type.includes('blouse') || type.includes('top') || type.includes('tank') || 
               type.includes('crop') || type.includes('vest') || type.includes('kurta') || 
               type.includes('kameez')) {
      return '👚';
    } else if (type.includes('underwear') || type.includes('socks')) {
      return '🧦';
    } else if (type.includes('bra') || type.includes('panties') || type.includes('stockings')) {
      return '👙';
    } else if (type.includes('nightdress')) {
      return '👗';
    } else if (type.includes('suit') || type.includes('blazer') || type.includes('waistcoat')) {
      return '👔';
    } else if (type.includes('saree')) {
      return '👗';
    }
    
    return '👕'; // Default emoji
  }

  // Layout methods
  onSidenavToggle(collapsed: boolean) {
    this.sidenavCollapsed = collapsed;
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }

  logout() {
    // Implement logout logic
    console.log('Logout clicked');
    // You can navigate to login page or clear auth data
  }

  openNewOrderModal() {
    this.showNewOrderModal = true;
  }

  closeNewOrderModal() {
    this.showNewOrderModal = false;
    this.resetForm();
  }

  closeModal(event: Event) {
    if (event.target === event.currentTarget) {
      this.closeNewOrderModal();
    }
  }

  resetForm() {
    this.newOrderForm.reset();
  }

  submitOrder() {
    if (this.newOrderForm.valid) {
      // Handle form submission
      console.log('New order:', this.newOrderForm.value);
      // Here you would typically send the data to your backend
      alert('Order created successfully!');
      this.closeNewOrderModal();
    } else {
      alert('Please fill in all required fields');
    }
  }

  viewOrders() {
    // Navigate to orders list or show orders modal
    console.log('View all orders');
  }

  viewCustomers() {
    // Navigate to customers list
    console.log('View customers');
  }

  viewOrder(orderId: string) {
    // View specific order details
    console.log('View order:', orderId);
  }

  editOrder(orderId: string) {
    // Edit specific order
    console.log('Edit order:', orderId);
  }

  // Customer Management Methods
  filterCustomers() {
    this.filteredCustomers = this.customers.filter(customer => {
      const matchesSearch = !this.customerSearchTerm || 
        customer.name.toLowerCase().includes(this.customerSearchTerm.toLowerCase()) ||
        customer.phone.includes(this.customerSearchTerm) ||
        customer.email.toLowerCase().includes(this.customerSearchTerm.toLowerCase());
      
      const matchesFilter = !this.customerFilter || 
        customer.status.toLowerCase() === this.customerFilter.toLowerCase();
      
      return matchesSearch && matchesFilter;
    });
  }

  openCustomerModal() {
    this.editingCustomer = null;
    this.customerForm.reset();
    this.customerForm.patchValue({ status: 'active' });
    this.showCustomerModal = true;
  }

  closeCustomerModal() {
    this.showCustomerModal = false;
    this.editingCustomer = null;
    this.customerForm.reset();
  }

  editCustomer(customerId: string) {
    const customer = this.customers.find(c => c.id === customerId);
    if (customer) {
      this.editingCustomer = customer;
      this.customerForm.patchValue(customer);
      this.showCustomerModal = true;
    }
  }

  submitCustomer() {
    if (this.customerForm.valid) {
      const customerData = this.customerForm.value;
      
      if (this.editingCustomer) {
        // Update existing customer
        const index = this.customers.findIndex(c => c.id === this.editingCustomer.id);
        if (index !== -1) {
          this.customers[index] = { ...this.customers[index], ...customerData };
        }
      } else {
        // Add new customer
        const newCustomer = {
          id: 'C' + String(this.customers.length + 1).padStart(3, '0'),
          ...customerData,
          totalOrders: 0
        };
        this.customers.push(newCustomer);
      }
      
      this.filterCustomers();
      this.closeCustomerModal();
      alert('Customer saved successfully!');
    }
  }

  viewCustomer(customerId: string) {
    console.log('View customer:', customerId);
  }

  deleteCustomer(customerId: string) {
    if (confirm('Are you sure you want to delete this customer?')) {
      this.customers = this.customers.filter(c => c.id !== customerId);
      this.filterCustomers();
      alert('Customer deleted successfully!');
    }
  }

  // Service Management Methods
  openServiceModal() {
    this.editingService = null;
    this.serviceForm.reset();
    this.serviceForm.patchValue({ icon: 'fas fa-cog' });
    this.showServiceModal = true;
  }

  closeServiceModal() {
    this.showServiceModal = false;
    this.editingService = null;
    this.serviceForm.reset();
  }

  editService(serviceId: string) {
    const service = this.services.find(s => s.id === serviceId);
    if (service) {
      this.editingService = service;
      this.serviceForm.patchValue(service);
      this.showServiceModal = true;
    }
  }

  submitService() {
    if (this.serviceForm.valid) {
      const serviceData = this.serviceForm.value;
      
      if (this.editingService) {
        // Update existing service
        const index = this.services.findIndex(s => s.id === this.editingService.id);
        if (index !== -1) {
          this.services[index] = { ...this.services[index], ...serviceData };
        }
      } else {
        // Add new service
        const newService = {
          id: 'S' + String(this.services.length + 1).padStart(3, '0'),
          ...serviceData
        };
        this.services.push(newService);
      }
      
      this.closeServiceModal();
      alert('Service saved successfully!');
    }
  }

  deleteService(serviceId: string) {
    if (confirm('Are you sure you want to delete this service?')) {
      this.services = this.services.filter(s => s.id !== serviceId);
      alert('Service deleted successfully!');
    }
  }

  // Service filtering methods
  getServicesByCategory(category: string) {
    return this.services.filter(service => service.category === category);
  }

  getServicesByClothType(clothType: string) {
    return this.services.filter(service => service.clothType.includes(clothType));
  }

  trackByServiceId(index: number, service: any): string {
    return service.id;
  }

  // Billing Methods
  generateBill() {
    console.log('generateBill method called - opening modal');
    this.showBillModal = true;
    this.billForm.reset();
    
    // Reset selected items and total
    this.selectedBillItems = [];
    this.billTotalAmount = 0;
    
    // Set default due date to 7 days from now
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7);
    this.billForm.patchValue({
      dueDate: dueDate.toISOString().split('T')[0],
      serviceType: [],
      items: ''
    });
    console.log('Bill modal should be open now');
  }

  viewBill(billId: string) {
    console.log('View bill:', billId);
    
    try {
      const bill = this.bills.find(b => b.id === billId);
      if (bill) {
        // Use setTimeout to prevent UI blocking
        setTimeout(() => {
          this.selectedBillForView = bill;
          this.showViewBillModal = true;
        }, 10);
      } else {
        alert('Bill not found!');
      }
    } catch (error) {
      console.error('Error viewing bill:', error);
      alert('Error loading bill details. Please try again.');
    }
  }

  printBill(billId: string) {
    console.log('Print bill:', billId);
    alert('Bill printed successfully!');
  }

  markPaid(billId: string) {
    const bill = this.bills.find(b => b.id === billId);
    if (bill) {
      bill.status = 'Paid';
      alert('Bill marked as paid!');
    }
  }

  closeBillModal() {
    // Close modal first
    this.showBillModal = false;
    
    // Reset form and data
    this.selectedBillItems = [];
    this.billTotalAmount = 0;
    
    // Reset form after a small delay to prevent UI issues
    setTimeout(() => {
      this.billForm.reset();
      this.billForm.patchValue({ serviceType: [] });
    }, 100);
  }

  closeViewBillModal() {
    this.showViewBillModal = false;
    this.selectedBillForView = null;
    // Clear cache to free memory
    this.billItemsBreakdownCache.clear();
  }

  getBillItemsBreakdown(bill: any): any[] {
    if (!bill || !bill.items) return [];
    
    // Check cache first
    const cacheKey = `${bill.id}_${bill.items}`;
    if (this.billItemsBreakdownCache.has(cacheKey)) {
      return this.billItemsBreakdownCache.get(cacheKey)!;
    }
    
    // Try to parse structured items data
    try {
      if (typeof bill.items === 'string' && bill.items.includes('{')) {
        // If items is a JSON string, parse it
        const itemsData = JSON.parse(bill.items);
        const result = Array.isArray(itemsData) ? itemsData : [];
        this.billItemsBreakdownCache.set(cacheKey, result);
        return result;
      } else if (Array.isArray(bill.items)) {
        this.billItemsBreakdownCache.set(cacheKey, bill.items);
        return bill.items;
      }
    } catch (e) {
      console.log('Could not parse items as JSON, using fallback');
    }
    
    // If items is empty or null, return empty array
    if (!bill.items || typeof bill.items !== 'string') {
      this.billItemsBreakdownCache.set(cacheKey, []);
      return [];
    }
    
    // Fallback: parse the items string to extract item details
    const itemsString = bill.items || '';
    const items: any[] = [];
    
    // Simple parsing for common patterns like "2x Men Shirt (Laundry), 1x Men Coat (Dry Clean)"
    const itemMatches = itemsString.match(/(\d+)x\s+([^(]+)\s*\(([^)]+)\)/g);
    
    if (itemMatches) {
      itemMatches.forEach((match: string) => {
        const parts = match.match(/(\d+)x\s+([^(]+)\s*\(([^)]+)\)/);
        if (parts) {
          const quantity = parseInt(parts[1]);
          const name = parts[2].trim();
          const serviceType = parts[3].trim();
          
          // Get price from services array
          const service = this.services.find(s => 
            s.name.toLowerCase().includes(name.toLowerCase()) || 
            name.toLowerCase().includes(s.name.toLowerCase())
          );
          
          // Get price based on service type without depending on selectedServiceType
          let unitPrice = 25; // Default price
          if (service) {
            if (serviceType.toLowerCase().includes('laundry')) {
              unitPrice = service.laundryPrice || service.price;
            } else if (serviceType.toLowerCase().includes('dry clean') || serviceType.toLowerCase().includes('dry-clean')) {
              unitPrice = service.dryCleanPrice || service.price;
            } else if (serviceType.toLowerCase().includes('ironing') || serviceType.toLowerCase().includes('iron')) {
              unitPrice = service.ironingPrice || service.price;
            } else {
              unitPrice = service.price;
            }
          }
          const totalPrice = quantity * unitPrice;
          
          items.push({
            name,
            serviceType,
            quantity,
            unitPrice,
            totalPrice
          });
        }
      });
    }
    
    // Cache the result
    this.billItemsBreakdownCache.set(cacheKey, items);
    return items;
  }

  addItemToBill(service: any) {
    console.log('Adding item to bill:', service.name, 'Current service type:', this.selectedServiceType);
    
    // Get the current service type for this item
    const currentServiceType = this.getCurrentServiceType();
    
    // Create a unique key that includes service type to allow same item with different service types
    const itemKey = `${service.id}_${currentServiceType}`;
    
    // Check if item with same service type already exists
    const existingItem = this.selectedBillItems.find(item => item.key === itemKey);
    if (existingItem) {
      existingItem.quantity += 1;
      existingItem.totalPrice = existingItem.price * existingItem.quantity;
      console.log('Updated existing item quantity:', existingItem);
    } else {
      const billItem = {
        key: itemKey,
        id: service.id,
        name: service.name,
        price: this.getServicePrice(service),
        quantity: 1,
        totalPrice: this.getServicePrice(service),
        clothType: service.clothType,
        category: service.category,
        serviceType: currentServiceType
      };
      this.selectedBillItems.push(billItem);
      console.log('Added new item:', billItem);
    }
    
    // Auto-select service type based on current filter
    this.autoSelectServiceType();
    this.calculateBillTotal();
    
    // Update the items field in the form
    this.updateFormItems();
  }

  getCurrentServiceType(): string {
    if (this.selectedServiceType === 'laundry') {
      return 'Laundry';
    } else if (this.selectedServiceType === 'dry-clean') {
      return 'Dry Clean';
    } else if (this.selectedServiceType === 'ironing') {
      return 'Ironing';
    }
    return 'Laundry'; // Default
  }

  autoSelectServiceType() {
    // Get unique service types from selected items
    const serviceTypes = [...new Set(this.selectedBillItems.map(item => item.serviceType))];
    
    // Update the bill form with the selected service types
    this.billForm.patchValue({ serviceType: serviceTypes });
  }

  updateFormItems() {
    // Create items description for the form
    const itemsDescription = this.selectedBillItems.map(item => 
      `${item.quantity}x ${item.name} (${item.serviceType})`
    ).join(', ');
    
    // Update the items field in the form
    this.billForm.patchValue({ items: itemsDescription });
  }

  // Simplified methods - removed complex grouping logic that was causing hangs

  removeItemFromBill(index: number) {
    this.selectedBillItems.splice(index, 1);
    // Update service types after removing item
    this.autoSelectServiceType();
    this.calculateBillTotal();
    this.updateFormItems();
  }

  increaseQuantity(index: number) {
    this.selectedBillItems[index].quantity += 1;
    this.selectedBillItems[index].totalPrice = this.selectedBillItems[index].price * this.selectedBillItems[index].quantity;
    this.calculateBillTotal();
    this.updateFormItems();
  }

  decreaseQuantity(index: number) {
    if (this.selectedBillItems[index].quantity > 1) {
      this.selectedBillItems[index].quantity -= 1;
      this.selectedBillItems[index].totalPrice = this.selectedBillItems[index].price * this.selectedBillItems[index].quantity;
      this.calculateBillTotal();
      this.updateFormItems();
    }
  }

  calculateBillTotal() {
    this.billTotalAmount = this.selectedBillItems.reduce((total, item) => total + item.totalPrice, 0);
    this.billForm.patchValue({ amount: this.billTotalAmount });
  }

  onPriceInput(service: any, event: Event) {
    const target = event.target as HTMLInputElement;
    const newPrice = +target.value;
    this.updateServicePrice(service, newPrice);
  }

  onCustomerSelectChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.onCustomerSelect(target.value);
  }

  onBillServiceTypeChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const selectedOptions = Array.from(target.selectedOptions).map(option => option.value);
    this.billForm.patchValue({ serviceType: selectedOptions });
  }

  onCustomerSelect(customerName: string) {
    if (customerName) {
      // Find the selected customer
      const selectedCustomer = this.customers.find(customer => customer.name === customerName);
      if (selectedCustomer) {
        // Auto-fill the phone number
        this.billForm.patchValue({
          customerPhone: selectedCustomer.phone
        });
      }
    } else {
      // Clear phone number if no customer selected
      this.billForm.patchValue({
        customerPhone: ''
      });
    }
  }

  submitBill() {
    console.log('=== BILL SUBMISSION DEBUG ===');
    console.log('Form valid:', this.billForm.valid);
    console.log('Form errors:', this.billForm.errors);
    console.log('Form value:', this.billForm.value);
    console.log('Selected items count:', this.selectedBillItems.length);
    console.log('Selected items:', this.selectedBillItems);
    console.log('Bill total amount:', this.billTotalAmount);
    
    // Check individual form controls
    console.log('Customer name valid:', this.billForm.get('customerName')?.valid);
    console.log('Customer phone valid:', this.billForm.get('customerPhone')?.valid);
    console.log('Service type valid:', this.billForm.get('serviceType')?.valid);
    console.log('Amount valid:', this.billForm.get('amount')?.valid);
    console.log('Due date valid:', this.billForm.get('dueDate')?.valid);
    
    // Check if we have the required data
    const hasItems = this.selectedBillItems.length > 0;
    const hasCustomer = this.billForm.get('customerName')?.value && this.billForm.get('customerPhone')?.value;
    const hasServiceType = this.billForm.get('serviceType')?.value && this.billForm.get('serviceType')?.value.length > 0;
    const hasAmount = this.billForm.get('amount')?.value > 0;
    const hasDueDate = this.billForm.get('dueDate')?.value;
    
    console.log('Validation checks:', { hasItems, hasCustomer, hasServiceType, hasAmount, hasDueDate });
    
    if (hasItems && hasCustomer && hasServiceType && hasAmount && hasDueDate) {
      const formValue = this.billForm.value;
      
      // Generate new bill ID
      const newBillId = 'B' + String(this.bills.length + 1).padStart(3, '0');
      
      // Create items description from selected items
      const itemsDescription = this.selectedBillItems.map(item => 
        `${item.quantity}x ${item.name} (${item.serviceType})`
      ).join(', ');
      
      // Create new bill
      const newBill = {
        id: newBillId,
        customer: formValue.customerName,
        amount: this.billTotalAmount,
        status: 'Pending',
        dueDate: formValue.dueDate,
        phone: formValue.customerPhone,
        items: itemsDescription,
        serviceType: Array.isArray(formValue.serviceType) ? formValue.serviceType.join(', ') : formValue.serviceType,
        notes: formValue.notes,
        createdDate: new Date().toISOString().split('T')[0],
        selectedItems: this.selectedBillItems.slice()
      };
      
      // Add to bills array
      this.bills.unshift(newBill as any);
      
      console.log('New bill created:', newBill);
      console.log('Total bills now:', this.bills.length);
      
      // Show success message first
      alert('Bill generated successfully! Bill ID: ' + newBillId);
      
      // Close modal after a small delay to ensure UI updates
      setTimeout(() => {
        this.closeBillModal();
        // Force change detection to update the bills table
        this.bills = [...this.bills];
      }, 100);
    } else {
      let errorMessage = 'Please fix the following issues:\n';
      
      if (!hasItems) {
        errorMessage += '- Please select at least one item\n';
      }
      if (!hasCustomer) {
        errorMessage += '- Customer name and phone are required\n';
      }
      if (!hasServiceType) {
        errorMessage += '- At least one service type must be selected\n';
      }
      if (!hasAmount) {
        errorMessage += '- Amount must be greater than 0\n';
      }
      if (!hasDueDate) {
        errorMessage += '- Due date is required\n';
      }
      
      alert(errorMessage);
    }
  }

}

