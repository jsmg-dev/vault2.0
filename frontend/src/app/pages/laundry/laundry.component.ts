import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MainLayoutComponent } from '../../components/layout/main-layout.component';
import { BreadcrumbItem } from '../../components/breadcrumb/breadcrumb.component';
import { environment } from '../../../environments/environment';
import { ToastService } from '../../services/toast.service';
import { LanguageService } from '../../services/language.service';
import { Subscription } from 'rxjs';

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
            [class.active]="activeTab === 'board'"
            (click)="navigateToBoard()"
          >
            <i class="fas fa-columns"></i>
            ClothAura Board
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
        <button 
          class="tab-btn" 
          [class.active]="activeTab === 'whatsapp'"
          (click)="setActiveTab('whatsapp')"
        >
          <i class="fas fa-cog"></i>
          {{ translate('nav.settings') }}
        </button>
      </div>

      <!-- Dashboard Tab -->
      <div class="tab-content" *ngIf="activeTab === 'dashboard'">
        <div class="dashboard-content">
          <div class="card-container">
            <div class="card customers">
              <h3>Total Customers</h3>
              <p>{{ customers.length | number }}</p>
            </div>
            <div class="card deposits">
              <h3>Pending Orders</h3>
              <p>{{ pendingOrders | number }}</p>
            </div>
            <div class="card loans">
              <h3>Completed Today</h3>
              <p>{{ completedOrders | number }}</p>
            </div>
            <div class="card earnings">
              <h3>Today's Revenue</h3>
              <p>₹ {{ todayRevenue | number }}</p>
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
              <option *ngFor="let status of statuses" [value]="status.id">{{ status.name }}</option>
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
                <th>{{ translate('common.actions') }}</th>
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
                    {{ getStatusDisplayName(customer.status) }}
                  </span>
                </td>
                <td>{{ customer.totalOrders }}</td>
                <td>
                  <div class="action-buttons">
                    <button class="btn-small primary" (click)="viewCustomer(customer.id)">{{ translate('common.view') }}</button>
                    <button class="btn-small secondary" (click)="editCustomer(customer.id)">{{ translate('common.edit') }}</button>
                    <button class="btn-small danger" (click)="deleteCustomer(customer.id)">{{ translate('common.delete') }}</button>
                  </div>
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
                      [(ngModel)]="cartServiceTypeFilter" 
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
                <h4>{{ translateServiceName(service.name) }}</h4>
                <p>{{ translateServiceDescription(service.description) }}</p>
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
            {{ translate('clothaura.generate_bill') }}
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
                <th>{{ translate('common.actions') }}</th>
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
                  <div class="action-buttons">
                    <button class="btn-small primary" (click)="viewBill(bill.id)">{{ translate('common.view') }}</button>
                    <button class="btn-small secondary" (click)="printBill(bill.id)">{{ translate('common.print') }}</button>
                    <button class="btn-small success" (click)="markPaid(bill.id)" *ngIf="bill.status === 'Pending'">{{ translate('clothaura.mark_paid') }}</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Laundry Board Tab -->
      <div class="tab-content" *ngIf="activeTab === 'board'">
        <div class="laundry-board-container">
          <div class="board-header">
            <h2><i class="fas fa-columns"></i> ClothAura Board</h2>
          <div class="header-actions">
              <input 
                type="text" 
                [(ngModel)]="searchTerm" 
                (input)="filterOrders()" 
                placeholder="Search by name or phone..." 
                class="search-input"
              >
              <select [(ngModel)]="filterStatus" (change)="filterOrders()" class="filter-select">
                <option value="">All Statuses</option>
                <option *ngFor="let status of allStatuses" [value]="status">{{ status }}</option>
              </select>
            <button class="btn primary" (click)="openCustomerModal()">
                <i class="fas fa-plus"></i>
                Add New Customer
            </button>
          </div>
        </div>

          <div class="kanban-board-container">
        <div class="kanban-board">
            <div *ngFor="let statusCol of statuses" class="kanban-column" 
                 [id]="statusCol.id"
                 [class.drag-over]="draggedOverColumn === statusCol.id"
                 (dragover)="onDragOver($event, statusCol.id)"
                 (dragenter)="onDragEnter($event, statusCol.id)"
                 (dragleave)="onDragLeave($event)"
                 (drop)="onDrop($event, statusCol.id)">
              <div class="column-header" [style.background-color]="statusCol.color">
                <h3>{{ statusCol.name }} ({{ getOrdersByStatus(statusCol.id).length || 0 }})</h3>
              </div>
              <div class="column-content">
                <div *ngFor="let order of getOrdersByStatus(statusCol.id)" class="kanban-card"
                     [class.delayed]="isDelayed(order)"
                     [class.dragging]="draggedOrder?.id === order.id"
                   draggable="true"
                   (dragstart)="onDragStart($event, order)"
                     (dragend)="onDragEnd($event)"
                   (click)="viewOrderDetails(order)">
                <div class="card-header">
                    <h4>{{ order.name }}</h4>
                    <div class="card-actions">
                      <button class="action-btn" (click)="viewOrderDetails(order); $event.stopPropagation()"><i class="fas fa-eye"></i></button>
                      <button class="action-btn" (click)="editOrder(order); $event.stopPropagation()"><i class="fas fa-edit"></i></button>
                      <button class="action-btn" (click)="viewOrderDetails(order); $event.stopPropagation()"><i class="fas fa-file-invoice"></i></button>
                  </div>
                </div>
                  <p><strong>Phone:</strong> {{ order.phone }}</p>
                  <p><strong>Items:</strong> {{ order.items || 'N/A' }}</p>
                  <p><strong>Order Date:</strong> {{ order.createdDate | date:'shortDate' }}</p>
                  <p><strong>Amount:</strong> ₹{{ order.totalAmount || 0 }}</p>
                  <div class="drag-indicator">
                    <i class="fas fa-grip-vertical"></i>
                </div>
                </div>
                <div *ngIf="!getOrdersByStatus(statusCol.id)?.length" class="no-orders-message">
                  Drop orders here or add new ones.
                </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Settings Tab -->
      <div class="tab-content" *ngIf="activeTab === 'whatsapp'">
        <div class="settings-content">
          <h2><i class="fas fa-cog"></i> {{ translate('nav.settings') }}</h2>
          
          <div class="settings-grid">
            <div class="settings-card">
              <h3><i class="fas fa-receipt"></i> {{ translate('clothaura.bill_setup') }}</h3>
              <p>Configure bill layout and required fields</p>
              <button class="btn-primary" (click)="openBillSetupModal()">
                <i class="fas fa-cog"></i> {{ translate('clothaura.configure') }}
              </button>
            </div>
            
            <div class="settings-card">
              <h3><i class="fas fa-bell"></i> Notifications</h3>
              <p>Manage notification preferences</p>
              <button class="btn-secondary" disabled>
                <i class="fas fa-cog"></i> Coming Soon
              </button>
            </div>
            
            <div class="settings-card">
              <h3><i class="fas fa-palette"></i> Appearance</h3>
              <p>Customize theme and colors</p>
              <button class="btn-secondary" disabled>
                <i class="fas fa-cog"></i> Coming Soon
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- New Order Modal -->
      <div class="modal" [class.active]="showNewOrderModal" (click)="closeModal($event)">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>New ClothAura Order</h3>
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
        <div class="modal-content customer-modal-large" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>{{ editingCustomer ? 'Edit Customer' : 'Add New Customer' }}</h3>
            <button class="close-btn" (click)="closeCustomerModal()">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-body two-part-layout">
            <!-- Left Part: Services -->
            <div class="services-section">
              <h4><i class="fas fa-list"></i> Available Services</h4>
              
              <!-- Service Search and Filter -->
              <div class="service-controls">
                <div class="search-box">
                  <i class="fas fa-search"></i>
                  <input 
                    type="text" 
                    [(ngModel)]="serviceSearchTerm"
                    (input)="debouncedFilterServices()"
                    placeholder="Search services..."
                  >
                </div>
                <select [(ngModel)]="cartServiceTypeFilter" (change)="debouncedFilterServices()" class="filter-select">
                  <option value="">All Categories</option>
                  <option value="Men">Men</option>
                  <option value="Women">Women</option>
                  <option value="Kids">Kids</option>
                  <option value="Home">Home</option>
                    </select>
                </div>
                
              <!-- Services Grid -->
                <div class="services-grid">
                <div *ngFor="let service of filteredServices" class="service-card" (click)="addServiceToCart(service)">
                    <div class="service-image">
                    <div class="service-photo" [style.background-color]="getServiceColor(service.category, service.clothType)">
                      <span class="service-emoji">{{ getServiceEmoji(service.clothType) }}</span>
                    </div>
                    </div>
                    <div class="service-info">
                      <h5>{{ translateServiceName(service.name) }}</h5>
                    <p class="service-category">{{ service.category }} - {{ service.clothType }}</p>
                      <div class="service-prices">
                      <span class="price-label">Wash & Iron:</span>
                      <span class="price">₹{{ service.laundryPrice }}</span>
                      <span class="price-label">Dry Clean:</span>
                      <span class="price">₹{{ service.dryCleanPrice }}</span>
                      </div>
                    </div>
                  <button class="add-to-cart-btn">
                    <i class="fas fa-plus"></i>
                  </button>
                  </div>
                </div>
              </div>

            <!-- Right Part: Customer Details & Cart -->
            <div class="customer-section">
              <div class="customer-details">
                    <h4><i class="fas fa-user"></i> Customer Details</h4>
                <form [formGroup]="customerForm" (ngSubmit)="submitCustomer()">
              <div class="form-group">
                      <label for="customerName">Full Name *</label>
                <input 
                  type="text" 
                  id="customerName" 
                  formControlName="name"
                  placeholder="Enter full name"
                  required
                >
              </div>
              <div class="form-group">
                      <label for="customerPhone">Phone Number *</label>
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
                      <option value="received">Received</option>
                      <option value="inProcess">In process</option>
                      <option value="readyForDelivery">Ready For Delivery</option>
                      <option value="delivered">Delivered</option>
                      <option value="billed">Billed</option>
                    </select>
                </div>
                </form>
              </div>
                    
              <!-- Selected Items Cart -->
              <div class="cart-section">
                <h4><i class="fas fa-shopping-cart"></i> Selected Items ({{ selectedItems.length }})</h4>
                
                <div class="cart-items" *ngIf="selectedItems.length > 0; else emptyCart">
                  <div *ngFor="let item of selectedItems; let i = index" class="cart-item">
                    <div class="item-info">
                      <h6>{{ translateServiceName(item.service.name) }}</h6>
                      <p>{{ item.service.category }} - {{ item.service.clothType }}</p>
                      <div class="item-details">
                        <select [(ngModel)]="item.serviceType" (change)="updateItemPrice(item)">
                          <option value="laundry">Wash & Iron (₹{{ item.service.laundryPrice }})</option>
                          <option value="dryClean">Dry Clean (₹{{ item.service.dryCleanPrice }})</option>
                          <option value="ironing">Iron Only (₹{{ item.service.ironingPrice }})</option>
                        </select>
                        <div class="quantity-controls">
                          <label>Qty:</label>
                          <button class="qty-btn" (click)="decreaseCartQuantity(item)">-</button>
                          <span class="quantity">{{ item.quantity }}</span>
                          <button class="qty-btn" (click)="increaseCartQuantity(item)">+</button>
                        </div>
                      </div>
                      <div class="item-total">
                        <strong>Total: ₹{{ item.totalPrice }}</strong>
                      </div>
                    </div>
                    <button class="remove-item-btn" (click)="removeFromCart(i)">
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                </div>

                <ng-template #emptyCart>
                  <div class="empty-cart">
                    <i class="fas fa-shopping-cart"></i>
                    <p>No items selected</p>
                    <small>Click on services from the left to add them</small>
                  </div>
                </ng-template>

                <div class="cart-summary" *ngIf="selectedItems.length > 0">
                  <div class="total-line">
                    <span>Subtotal:</span>
                    <span>₹{{ totalAmount }}</span>
                  </div>
                  <div class="total-line">
                    <span>Tax (5%):</span>
                    <span>₹{{ (totalAmount * 0.05).toFixed(2) }}</span>
                  </div>
                  <div class="total-line total">
                    <span>Grand Total:</span>
                    <span>₹{{ (totalAmount * 1.05).toFixed(2) }}</span>
                  </div>
                </div>
              </div>

              <div class="form-actions">
                <button type="button" class="btn secondary" (click)="closeCustomerModal()">
                  {{ translate('clothaura.cancel') }}
                </button>
                <button type="button" class="btn primary" (click)="submitCustomer()" [disabled]="selectedItems.length === 0">
                  <i class="fas fa-plus"></i>
                  {{ editingCustomer ? translate('clothaura.edit_customer') : translate('clothaura.add_customer') }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Customer Details Modal -->
      <div class="modal" [class.active]="showCustomerDetailsModal" (click)="closeModal($event)">
        <div class="modal-content customer-modal-large" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3><i class="fas fa-user"></i> Customer Details</h3>
            <button class="close-btn" (click)="closeCustomerDetailsModal()">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-body two-part-layout" *ngIf="selectedCustomerForDetails">
            <!-- Left Part: Services -->
            <div class="services-section">
              <h4><i class="fas fa-list"></i> Available Services</h4>
              
              <!-- Service Search and Filter -->
              <div class="service-controls">
                <div class="search-box">
                  <i class="fas fa-search"></i>
                  <input 
                    type="text" 
                    [(ngModel)]="serviceSearchTerm"
                    (input)="debouncedFilterServices()"
                    placeholder="Search services..."
                  >
                </div>
                <select [(ngModel)]="cartServiceTypeFilter" (change)="debouncedFilterServices()" class="filter-select">
                  <option value="">All Categories</option>
                  <option value="Men">Men</option>
                  <option value="Women">Women</option>
                  <option value="Kids">Kids</option>
                  <option value="Home">Home</option>
                </select>
              </div>

              <!-- Services Grid -->
              <div class="services-grid">
                <div *ngFor="let service of filteredServices" class="service-card" (click)="addServiceToCart(service)">
                  <div class="service-image">
                    <div class="service-photo" [style.background-color]="getServiceColor(service.category, service.clothType)">
                      <span class="service-emoji">{{ getServiceEmoji(service.clothType) }}</span>
                    </div>
                  </div>
                  <div class="service-info">
                    <h5>{{ translateServiceName(service.name) }}</h5>
                    <p class="service-category">{{ service.category }} - {{ service.clothType }}</p>
                    <div class="service-prices">
                      <span class="price-label">Wash & Iron:</span>
                      <span class="price">₹{{ service.laundryPrice }}</span>
                      <span class="price-label">Dry Clean:</span>
                      <span class="price">₹{{ service.dryCleanPrice }}</span>
                    </div>
                  </div>
                  <button class="add-to-cart-btn">
                    <i class="fas fa-plus"></i>
                  </button>
                </div>
              </div>
            </div>

            <!-- Right Part: Customer Details & Cart -->
            <div class="customer-section">
              <div class="customer-details">
                <h4><i class="fas fa-user"></i> Customer Details</h4>
                <form [formGroup]="customerForm" (ngSubmit)="submitCustomer()">
                  <div class="form-group">
                    <label for="customerName">Full Name *</label>
                    <input 
                      type="text" 
                      id="customerName" 
                      formControlName="name"
                      placeholder="Enter full name"
                      required
                      [disabled]="isViewMode"
                    >
                  </div>
                  <div class="form-group">
                    <label for="customerPhone">Phone Number *</label>
                    <input 
                      type="tel" 
                      id="customerPhone" 
                      formControlName="phone"
                      placeholder="Enter phone number"
                      required
                      [disabled]="isViewMode"
                    >
                  </div>
                  <div class="form-group">
                    <label for="customerEmail">Email Address</label>
                    <input 
                      type="email" 
                      id="customerEmail" 
                      formControlName="email"
                      placeholder="Enter email address"
                      [disabled]="isViewMode"
                    >
                  </div>
                  <div class="form-group">
                    <label for="customerAddress">Address</label>
                    <textarea 
                      id="customerAddress" 
                      formControlName="address"
                      placeholder="Enter full address"
                      rows="3"
                      [disabled]="isViewMode"
                    ></textarea>
                  </div>
              <div class="form-group">
                <label for="customerStatus">Status</label>
                <select id="customerStatus" formControlName="status" [disabled]="isViewMode">
                        <option value="received">Received</option>
                      <option value="inProcess">In process</option>
                      <option value="readyForDelivery">Ready For Delivery</option>
                        <option value="delivered">Delivered</option>
                        <option value="billed">Billed</option>
                </select>
              </div>
                </form>
                  </div>

              <!-- Additional Customer Information (Read-only) -->
              <div class="customer-info-section" *ngIf="selectedCustomerForDetails">
                <h4><i class="fas fa-info-circle"></i> Order Information</h4>
                <div class="info-grid">
                  <div class="info-item">
                    <label>Order Date:</label>
                    <span>{{ selectedCustomerForDetails.createdDate || 'N/A' }}</span>
                  </div>
                  <div class="info-item">
                    <label>Expected Delivery:</label>
                    <span>{{ selectedCustomerForDetails.expectedDeliveryDate || 'N/A' }}</span>
                  </div>
                  <div class="info-item">
                    <label>Current Status:</label>
                    <span class="status-badge" [class]="'status-' + selectedCustomerForDetails.status?.toLowerCase()">
                      {{ getStatusDisplayName(selectedCustomerForDetails.status) }}
                    </span>
                  </div>
                  <div class="info-item">
                    <label>Total Amount:</label>
                    <span class="amount">₹{{ selectedCustomerForDetails.totalAmount || 0 }}</span>
                  </div>
                  <div class="info-item">
                    <label>Paid Amount:</label>
                    <span class="amount paid">₹{{ selectedCustomerForDetails.paidAmount || 0 }}</span>
                  </div>
                  <div class="info-item">
                    <label>Balance Amount:</label>
                    <span class="amount balance">₹{{ selectedCustomerForDetails.balanceAmount || 0 }}</span>
                  </div>
                  <div class="info-item full-width" *ngIf="selectedCustomerForDetails.specialInstructions">
                    <label>Special Instructions:</label>
                    <span class="instructions">{{ selectedCustomerForDetails.specialInstructions }}</span>
                  </div>
                </div>
              </div>

              <!-- Selected Items Cart -->
              <div class="cart-section">
                <h4><i class="fas fa-shopping-cart"></i> Selected Items ({{ selectedItems.length }})</h4>
                
                <div class="cart-items" *ngIf="selectedItems.length > 0; else emptyCart">
                  <div *ngFor="let item of selectedItems; let i = index" class="cart-item">
                    <div class="item-info">
                      <h6>{{ translateServiceName(item.service.name) }}</h6>
                      <p>{{ item.service.category }} - {{ item.service.clothType }}</p>
                        <div class="item-details">
                        <select [(ngModel)]="item.serviceType" (change)="updateItemPrice(item)">
                          <option value="laundry">Wash & Iron (₹{{ item.service.laundryPrice }})</option>
                          <option value="dryClean">Dry Clean (₹{{ item.service.dryCleanPrice }})</option>
                          <option value="ironing">Iron Only (₹{{ item.service.ironingPrice }})</option>
                        </select>
                        <div class="quantity-controls">
                          <label>Qty:</label>
                          <button class="qty-btn" (click)="decreaseCartQuantity(item)">-</button>
                          <span class="quantity">{{ item.quantity }}</span>
                          <button class="qty-btn" (click)="increaseCartQuantity(item)">+</button>
                        </div>
                      </div>
                      <div class="item-total">
                        <strong>Total: ₹{{ item.totalPrice }}</strong>
                      </div>
                    </div>
                    <button class="remove-item-btn" (click)="removeFromCart(i)">
                          <i class="fas fa-trash"></i>
                        </button>
                      </div>
                    </div>
                    
                <ng-template #emptyCart>
                  <div class="empty-cart">
                    <i class="fas fa-shopping-cart"></i>
                    <p>No items selected</p>
                    <small>Click on services from the left to add them</small>
                  </div>
                </ng-template>

                <div class="cart-summary" *ngIf="selectedItems.length > 0">
                  <div class="total-line">
                    <span>Subtotal:</span>
                    <span>₹{{ totalAmount }}</span>
                  </div>
                  <div class="total-line">
                    <span>Tax (5%):</span>
                    <span>₹{{ (totalAmount * 0.05).toFixed(2) }}</span>
                  </div>
                  <div class="total-line total">
                    <span>Grand Total:</span>
                    <span>₹{{ (totalAmount * 1.05).toFixed(2) }}</span>
                  </div>
                    </div>
                  </div>

              <div class="form-actions">
                <button type="button" class="btn secondary" (click)="closeCustomerDetailsModal()">
                  {{ isViewMode ? 'Close' : 'Cancel' }}
                </button>
                <button type="button" class="btn primary" (click)="handleCustomerAction()" [disabled]="!isViewMode && selectedItems.length === 0">
                  <i class="fas" [class.fa-edit]="isViewMode" [class.fa-save]="!isViewMode"></i>
                  {{ isViewMode ? 'Edit Customer' : (editingCustomer ? 'Update Customer' : 'Create Customer') }}
                </button>
              </div>
            </div>
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
                  {{ translate('clothaura.cancel') }}
                </button>
                <button type="submit" class="btn primary">
                  {{ editingService ? translate('clothaura.edit_service') : translate('clothaura.add_service') }}
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
                    <select [(ngModel)]="cartServiceTypeFilter" (change)="onServiceTypeChange()">
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
                      <h5>{{ translateServiceName(service.name) }}</h5>
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
                          <span class="item-name">{{ translateServiceName(item.name) }}</span>
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
                      {{ translate('clothaura.cancel') }}
                    </button>
                    <button type="submit" class="btn primary" [disabled]="selectedBillItems.length === 0">
                      {{ translate('clothaura.generate_bill') }}
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
            <h3>Bill Preview - {{ selectedBillForView?.id }}</h3>
            <button class="close-btn" (click)="closeViewBillModal()">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-body" *ngIf="selectedBillForView">
            <div class="bill-preview">
              <!-- Bill Header -->
              <div class="bill-header">
                <div class="company-info">
                  <h2>{{ billingConfig.company_name || 'ClothAura' }}</h2>
                  <p *ngIf="billingConfig.company_address">{{ billingConfig.company_address }}</p>
                  <p *ngIf="billingConfig.company_phone">{{ billingConfig.company_phone }}</p>
                  <p *ngIf="billingConfig.company_email">{{ billingConfig.company_email }}</p>
                  <p *ngIf="billingConfig.company_website">{{ billingConfig.company_website }}</p>
                  <p *ngIf="billingConfig.tax_id"><strong>GST:</strong> {{ billingConfig.tax_id }}</p>
                </div>
                <div class="bill-details">
                  <h1>BILL</h1>
                  <div class="bill-meta">
                    <p><strong>Bill #:</strong> {{ selectedBillForView.id }}</p>
                    <p><strong>Date:</strong> {{ selectedBillForView.createdDate || getCurrentDate() }}</p>
                    <p><strong>Due Date:</strong> {{ selectedBillForView.dueDate }}</p>
                  </div>
                </div>
              </div>

              <!-- Customer Information -->
              <div class="customer-info">
                <h3>Bill To:</h3>
                <p><strong>{{ selectedBillForView.customer }}</strong></p>
                <p>{{ selectedBillForView.phone || 'N/A' }}</p>
                <p>{{ selectedBillForView.customerAddress || 'N/A' }}</p>
              </div>

              <!-- Bill Items -->
              <div class="bill-items">
                <table>
                  <thead>
                    <tr>
                      <th>Description</th>
                      <th>Qty</th>
                      <th>Rate</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let item of billItemsForView; else simpleItemRow">
                      <td>{{ translateServiceName(item.name) }}</td>
                      <td>{{ item.quantity }}</td>
                      <td>₹{{ item.unitPrice || item.price }}</td>
                      <td>₹{{ item.totalPrice || (item.quantity * (item.unitPrice || item.price)) }}</td>
                    </tr>
                    <ng-template #simpleItemRow>
                      <tr>
                        <td>{{ selectedBillForView.serviceType || 'Laundry Service' }}</td>
                        <td>1</td>
                        <td>₹{{ selectedBillForView.amount * 0.85 | number:'1.2-2' }}</td>
                        <td>₹{{ selectedBillForView.amount * 0.85 | number:'1.2-2' }}</td>
                      </tr>
                    </ng-template>
                  </tbody>
                </table>
              </div>

              <!-- Bill Summary -->
              <div class="bill-summary">
                <div class="summary-row">
                  <span>Subtotal:</span>
                  <span>₹{{ selectedBillForView.amount * 0.85 | number:'1.2-2' }}</span>
                </div>
                <div class="summary-row">
                  <span>Tax ({{ billingConfig.tax_rate || 18 }}%):</span>
                  <span>₹{{ selectedBillForView.amount * 0.15 | number:'1.2-2' }}</span>
                </div>
                <div class="summary-row total">
                  <span><strong>Total:</strong></span>
                  <span><strong>₹{{ selectedBillForView.amount | number:'1.2-2' }}</strong></span>
                </div>
              </div>

              <!-- Payment Terms -->
              <div class="payment-terms" *ngIf="billingConfig.payment_terms">
                <h4>Payment Terms:</h4>
                <p>{{ billingConfig.payment_terms }}</p>
              </div>

              <!-- Footer -->
              <div class="bill-footer">
                <p>Thank you for choosing {{ billingConfig.company_name || 'ClothAura' }}!</p>
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

      <!-- Bill Setup Modal -->
      <div *ngIf="showBillSetupModal" class="modal-overlay" (click)="closeBillSetupModal()">
        <div class="modal-content bill-setup-modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3><i class="fas fa-receipt"></i> Bill Setup Configuration</h3>
            <button class="close-btn" (click)="closeBillSetupModal()">
              <i class="fas fa-times"></i>
            </button>
          </div>
          
          <div class="modal-body">
            <div class="bill-setup-content">
              <!-- Left Side - All Configuration Sections -->
              <div class="config-sections-left">
                <!-- Layout Configuration -->
                <div class="config-section">
                  <h4><i class="fas fa-layout"></i> Layout</h4>
                  <div class="form-group">
                    <label>Bill Template Style</label>
                    <select [(ngModel)]="billConfig.templateStyle">
                      <option value="modern">Modern</option>
                      <option value="classic">Classic</option>
                      <option value="minimal">Minimal</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label>Company Logo Position</label>
                    <select [(ngModel)]="billConfig.logoPosition">
                      <option value="top-left">Top Left</option>
                      <option value="top-center">Top Center</option>
                      <option value="top-right">Top Right</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label>Bill Number Format</label>
                    <input type="text" [(ngModel)]="billConfig.billNumberFormat" placeholder="e.g., BILL-{YYYY}-{MM}-{###}">
                  </div>
                </div>

                <!-- Required Fields Configuration -->
                <div class="config-section">
                  <h4><i class="fas fa-list-check"></i> Fields</h4>
                  <div class="fields-grid">
                    <div class="field-item" *ngFor="let field of billFields">
                      <label class="field-checkbox">
                        <input type="checkbox" [(ngModel)]="field.required" [id]="'field-' + field.id">
                        <span class="checkmark"></span>
                        <div class="field-info">
                          <strong>{{ field.name }}</strong>
                          <small>{{ field.description }}</small>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                <!-- Company Details Configuration -->
                <div class="config-section company-section">
                  <h4><i class="fas fa-building"></i> Company</h4>
                  <div class="form-group">
                    <label>Company Name</label>
                    <input type="text" [(ngModel)]="companyDetails.companyName">
                  </div>
                  <div class="form-group">
                    <label>Tagline</label>
                    <input type="text" [(ngModel)]="companyDetails.tagline">
                  </div>
                  
                  <div class="form-group">
                    <label>Address Line 1</label>
                    <input type="text" [(ngModel)]="companyDetails.address.line1">
                  </div>
                  <div class="form-group">
                    <label>Address Line 2</label>
                    <input type="text" [(ngModel)]="companyDetails.address.line2">
                  </div>
                  
                  <div class="form-row">
                    <div class="form-group">
                      <label>City</label>
                      <input type="text" [(ngModel)]="companyDetails.address.city">
                    </div>
                    <div class="form-group">
                      <label>State</label>
                      <input type="text" [(ngModel)]="companyDetails.address.state">
                    </div>
                  </div>
                  
                  <div class="form-row">
                    <div class="form-group">
                      <label>Pincode</label>
                      <input type="text" [(ngModel)]="companyDetails.address.pincode">
                    </div>
                    <div class="form-group">
                      <label>Country</label>
                      <input type="text" [(ngModel)]="companyDetails.address.country">
                    </div>
                  </div>
                  
                  <div class="form-row">
                    <div class="form-group">
                      <label>Phone</label>
                      <input type="text" [(ngModel)]="companyDetails.contact.phone">
                    </div>
                    <div class="form-group">
                      <label>Email</label>
                      <input type="text" [(ngModel)]="companyDetails.contact.email">
                    </div>
                  </div>
                  
                  <div class="form-group">
                    <label>Website</label>
                    <input type="text" [(ngModel)]="companyDetails.contact.website">
                  </div>
                  
                  <div class="form-row">
                    <div class="form-group">
                      <label>GST Number</label>
                      <input type="text" [(ngModel)]="companyDetails.business.gstNumber">
                    </div>
                    <div class="form-group">
                      <label>PAN Number</label>
                      <input type="text" [(ngModel)]="companyDetails.business.panNumber">
                    </div>
                  </div>
                  
                  <div class="form-group">
                    <label>License Number</label>
                    <input type="text" [(ngModel)]="companyDetails.business.licenseNumber">
                  </div>
                  
                  <div class="form-row">
                    <div class="form-group">
                      <label>WhatsApp</label>
                      <input type="text" [(ngModel)]="companyDetails.social.whatsapp">
                    </div>
                    <div class="form-group">
                      <label>Instagram</label>
                      <input type="text" [(ngModel)]="companyDetails.social.instagram">
                    </div>
                  </div>
                  
                  <div class="form-group">
                    <label>Facebook</label>
                    <input type="text" [(ngModel)]="companyDetails.social.facebook">
                  </div>
                </div>

                <!-- Additional Settings -->
                <div class="config-section">
                  <h4><i class="fas fa-cog"></i> {{ translate('nav.settings') }}</h4>
                  <div class="form-group">
                    <label class="checkbox-label">
                      <input type="checkbox" [(ngModel)]="billConfig.showTaxBreakdown">
                      <span class="checkmark"></span>
                      Show Tax Breakdown
                    </label>
                  </div>
                  <div class="form-group">
                    <label class="checkbox-label">
                      <input type="checkbox" [(ngModel)]="billConfig.showCompanyDetails">
                      <span class="checkmark"></span>
                      Show Company Details
                    </label>
                  </div>
                  <div class="form-group">
                    <label>Tax Rate (%)</label>
                    <input type="number" [(ngModel)]="billConfig.taxRate" min="0" max="100" step="0.01">
                  </div>
                </div>
              </div>

              <!-- Right Side - Preview Section -->
              <div class="preview-section">
                <h4><i class="fas fa-eye"></i> Preview</h4>
                <div class="bill-preview">
                  <div class="preview-header">
                    <h2>{{ companyDetails.companyName || 'ClothAura Laundry Services' }}</h2>
                    <p>{{ companyDetails.tagline || 'Professional Laundry & Dry Cleaning' }}</p>
                  </div>
                  <div class="preview-section" *ngIf="billConfig.showCompanyDetails">
                    <h4>Company Details</h4>
                    <p>
                      <span *ngIf="companyDetails.address.line1"><strong>Address:</strong> {{ companyDetails.address.line1 }}<br></span>
                      <span *ngIf="companyDetails.address.line2">{{ companyDetails.address.line2 }}<br></span>
                      <span *ngIf="companyDetails.address.city"><strong>City:</strong> {{ companyDetails.address.city }}<br></span>
                      <span *ngIf="companyDetails.address.state"><strong>State:</strong> {{ companyDetails.address.state }}<br></span>
                      <span *ngIf="companyDetails.address.pincode"><strong>Pincode:</strong> {{ companyDetails.address.pincode }}<br></span>
                      <span *ngIf="companyDetails.address.country"><strong>Country:</strong> {{ companyDetails.address.country }}<br></span>
                      <span *ngIf="companyDetails.contact.phone"><strong>Phone:</strong> {{ companyDetails.contact.phone }}<br></span>
                      <span *ngIf="companyDetails.contact.email"><strong>Email:</strong> {{ companyDetails.contact.email }}<br></span>
                      <span *ngIf="companyDetails.contact.website"><strong>Website:</strong> {{ companyDetails.contact.website }}<br></span>
                      <span *ngIf="companyDetails.business.gstNumber"><strong>GST:</strong> {{ companyDetails.business.gstNumber }}<br></span>
                      <span *ngIf="companyDetails.business.panNumber"><strong>PAN:</strong> {{ companyDetails.business.panNumber }}<br></span>
                    </p>
                  </div>
                  <div class="preview-section">
                    <h4>Customer Information</h4>
                    <p>Name: John Doe<br>
                    Phone: +91 9876543210</p>
                  </div>
                  <div class="preview-section">
                    <h4>Items</h4>
                    <div class="preview-items">
                      <div class="preview-item">2x Men Shirt (Laundry) - ₹200</div>
                      <div class="preview-item">1x Men Coat (Dry Clean) - ₹150</div>
                    </div>
                  </div>
                  <div class="preview-section" *ngIf="billConfig.showTaxBreakdown">
                    <h4>Tax Breakdown</h4>
                    <p>Subtotal: ₹350<br>
                    Tax ({{ billConfig.taxRate }}%): ₹{{ (350 * billConfig.taxRate / 100).toFixed(2) }}<br>
                    <strong>Total: ₹{{ (350 + (350 * billConfig.taxRate / 100)).toFixed(2) }}</strong></p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" (click)="closeBillSetupModal()" class="btn-secondary">Cancel</button>
            <button type="button" (click)="saveBillSetup()" class="btn-primary">
              <i class="fas fa-save"></i> Save Configuration
            </button>
          </div>
        </div>
      </div>
      </div>
    </app-main-layout>
  `,
  styles: [`
    .laundry-container {
      padding: 0;
      width: 100%;
      max-width: 100%;
      margin: 0;
      height: 100vh;
      overflow-x: auto;
      overflow-y: hidden;
      box-sizing: border-box;
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    /* Override main layout page-content padding */
    :host ::ng-deep .page-content {
      padding: 0 !important;
      margin: 0 !important;
      width: 100% !important;
      height: 100vh !important;
      max-width: 100% !important;
    }
    
    /* Override main layout container */
    :host ::ng-deep .main-container {
      width: 100% !important;
      height: 100vh !important;
      max-width: 100% !important;
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
      padding: 10px;
      padding-bottom: 20px;
      overflow: visible;
      box-sizing: border-box;
    }

    .card-container {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 15px;
      margin-bottom: 20px;
    }

    .card {
      padding: 18px;
      border-radius: 16px;
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
    }

    .card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
    }

    .card h3 {
      margin: 0 0 8px 0;
      font-size: 13px;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .card p {
      margin: 0 0 12px 0;
      font-size: 24px;
      font-weight: 700;
      color: #1e293b;
    }


    .card.customers {
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%);
      border-color: rgba(99, 102, 241, 0.2);
    }


    .card.deposits {
      background: linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(251, 191, 36, 0.1) 100%);
      border-color: rgba(245, 158, 11, 0.2);
    }


    .card.loans {
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(34, 197, 94, 0.1) 100%);
      border-color: rgba(16, 185, 129, 0.2);
    }


    .card.earnings {
      background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(248, 113, 113, 0.1) 100%);
      border-color: rgba(239, 68, 68, 0.2);
    }


    .card p {
      font-size: 28px;
      font-weight: bold;
      margin-bottom: 10px;
    }


    .charts {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
      margin-bottom: 20px;
    }

    .chart-box {
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(10px);
      padding: 18px;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.2);
      overflow: visible;
      transition: all 0.3s ease;
    }

    .chart-box:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
    }

    .chart-box h4 {
      margin-bottom: 12px;
      font-size: 16px;
      font-weight: 600;
      text-align: center;
      color: #374151;
      letter-spacing: 0.5px;
    }

    canvas {
      width: 100% !important;
      max-height: 250px;
    }


    /* Tab Navigation */
    .tab-navigation {
      display: flex;
      gap: 5px;
      margin-bottom: 15px;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      border-radius: 16px;
      padding: 8px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.2);
      overflow-x: auto;
      min-width: 0;
      width: 100%;
    }

    .tab-btn {
      flex: 1;
      min-width: 140px;
      padding: 15px 20px;
      border: none;
      background: transparent;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      font-weight: 500;
      color: #64748b;
      font-size: 14px;
      white-space: nowrap;
      flex-shrink: 0;
    }

    .tab-btn:hover {
      background: rgba(241, 245, 249, 0.8);
      color: #475569;
      transform: translateY(-1px);
    }

    .tab-btn.active {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
      transform: translateY(-1px);
    }

    .tab-btn i {
      font-size: 16px;
    }

    /* Custom scrollbar for tab navigation */
    .tab-navigation::-webkit-scrollbar {
      height: 6px;
    }

    .tab-navigation::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 3px;
    }

    .tab-navigation::-webkit-scrollbar-thumb {
      background: #c1c1c1;
      border-radius: 3px;
    }

    .tab-navigation::-webkit-scrollbar-thumb:hover {
      background: #a8a8a8;
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
      height: calc(100vh - 80px);
      overflow-y: auto;
      padding: 10px 15px 20px 15px;
      box-sizing: border-box;
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

    /* Action column specific styling */
    .data-table th:last-child,
    .data-table td:last-child {
      text-align: center;
      white-space: nowrap;
    }

    /* Action buttons container */
    .action-buttons {
      display: flex;
      flex-direction: row;
      gap: 4px;
      align-items: center;
      justify-content: center;
      flex-wrap: nowrap;
      min-width: 200px;
    }

    /* Ensure table action buttons are horizontal */
    .data-table .action-buttons {
      display: flex !important;
      flex-direction: row !important;
      gap: 4px !important;
      align-items: center !important;
      justify-content: center !important;
      flex-wrap: nowrap !important;
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
      padding: 6px 10px;
      border: none;
      border-radius: 6px;
      font-size: 0.875rem;
      cursor: pointer;
      margin-right: 0;
      transition: all 0.2s ease;
      white-space: nowrap;
      min-width: fit-content;
      flex-shrink: 0;
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
      border: 2px solid #3b82f6;
      box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
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
        padding: 0;
        width: 100%;
        height: 100vh;
      }
      
      .tab-content {
        height: calc(100vh - 70px);
        padding: 5px 10px 10px 10px;
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

    /* Laundry Board Styles */
    .laundry-board-container {
      padding: 20px;
      background-color: #f4f7f6;
      height: calc(100vh - 120px);
      display: flex;
      flex-direction: column;
    }

    .board-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      flex-shrink: 0;
      background-color: #f8f9fa;
      padding: 8px 12px;
      border-radius: 8px;
      border: 1px solid #e9ecef;
      width: 100%;
      max-width: none;
      overflow: visible;
      gap: 20px;
    }

    .board-header h2 {
      color: #333;
        font-size: 20px;
      display: flex;
      align-items: center;
      margin: 0;
    }

    .board-header h2 i {
      margin-right: 10px;
      color: #007bff;
    }

    .header-actions {
      display: flex;
      gap: 8px;
      align-items: center;
      flex-wrap: nowrap;
      background-color: white;
      padding: 6px;
      border-radius: 6px;
      border: 1px solid #dee2e6;
      width: 100%;
      max-width: none;
      flex: 1;
      overflow: visible;
    }

    .header-actions .btn {
      white-space: nowrap;
      min-height: 36px;
      padding: 8px 14px;
      font-weight: 500;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s ease;
      flex-shrink: 0;
    }

    .search-input, .filter-select {
      padding: 6px 10px;
      border: 1px solid #ccc;
      border-radius: 5px;
      font-size: 14px;
      min-width: 150px;
      max-width: 200px;
      flex-shrink: 1;
    }

    .kanban-board-container {
      flex: 1;
      overflow: auto;
      border: 1px solid #ddd;
      border-radius: 8px;
      background-color: white;
    }

    /* Custom scrollbar for the kanban board container */
    .kanban-board-container::-webkit-scrollbar {
      width: 12px;
      height: 12px;
    }

    .kanban-board-container::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 6px;
    }

    .kanban-board-container::-webkit-scrollbar-thumb {
      background: #888;
      border-radius: 6px;
      border: 2px solid #f1f1f1;
    }

    .kanban-board-container::-webkit-scrollbar-thumb:hover {
      background: #555;
    }

    .kanban-board-container::-webkit-scrollbar-corner {
      background: #f1f1f1;
    }

    .kanban-board {
      display: flex;
        gap: 20px;
        padding: 20px;
      min-width: max-content;
    }

    .kanban-column {
      min-width: 300px;
      width: 300px;
      background-color: #e2e4e6;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      display: flex;
      flex-direction: column;
    }

    .column-header {
      padding: 6px 12px;
      border-top-left-radius: 8px;
      border-top-right-radius: 8px;
      color: white;
      font-size: 14px;
      font-weight: bold;
      flex-shrink: 0;
    }

    .column-content {
      flex-grow: 1;
      padding: 15px;
    }

    .kanban-card {
      background-color: white;
      border-radius: 6px;
      padding: 15px;
      margin-bottom: 15px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.08);
      transition: all 0.2s ease-in-out;
      cursor: grab;
      position: relative;
    }

    .kanban-card:hover {
      box-shadow: 0 4px 8px rgba(0,0,0,0.15);
      transform: translateY(-2px);
    }

    .kanban-card.dragging {
      opacity: 0.5;
      transform: rotate(5deg);
      cursor: grabbing;
    }

    .kanban-card.delayed {
      border: 2px solid red;
      background-color: #ffe0e0;
    }

    .drag-indicator {
      position: absolute;
      top: 8px;
      right: 8px;
      color: #ccc;
        font-size: 12px;
      }
      
    .kanban-card:hover .drag-indicator {
      color: #666;
    }

    .kanban-column.drag-over {
      background-color: #e3f2fd;
      border: 2px dashed #2196f3;
    }

    .kanban-column.drag-over .column-content {
      background-color: rgba(33, 150, 243, 0.05);
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }

    .card-header h4 {
      margin: 0;
      font-size: 16px;
      color: #333;
    }

    .card-actions .action-btn {
      background: none;
      border: none;
      color: #007bff;
      cursor: pointer;
        font-size: 14px;
      margin-left: 8px;
    }

    .card-actions .action-btn:hover {
      color: #0056b3;
    }

    .kanban-card p {
      margin: 5px 0;
      font-size: 13px;
      color: #555;
    }

    .no-orders-message {
      text-align: center;
      color: #777;
        padding: 20px;
      font-style: italic;
    }

    /* Two-Part Customer Modal Styles */
    .customer-modal-large {
      width: 90vw;
      max-width: 1400px;
      height: 90vh;
      max-height: 900px;
      margin: 0 auto;
      border-radius: 12px;
    }

    .two-part-layout {
      display: flex;
      height: calc(100% - 60px);
      gap: 20px;
      padding: 15px;
    }

    .services-section {
      flex: 1;
      display: flex;
      flex-direction: column;
      border-right: 1px solid #ddd;
      padding-right: 15px;
    }

    .customer-section {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow-y: auto;
    }

    .customer-info-section {
      margin-top: 20px;
      padding: 20px;
      background: #f8fafc;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }

    .customer-info-section h4 {
      margin: 0 0 15px 0;
      color: #374151;
      font-size: 16px;
      font-weight: 600;
    }

    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .info-item.full-width {
      grid-column: 1 / -1;
    }

    .info-item label {
      font-size: 12px;
      font-weight: 500;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .info-item span {
      font-size: 14px;
      color: #374151;
      font-weight: 500;
    }

    .info-item .amount {
      font-weight: 600;
      color: #059669;
    }

    .info-item .amount.paid {
      color: #059669;
    }

    .info-item .amount.balance {
      color: #dc2626;
    }

    .info-item .instructions {
      font-style: italic;
      color: #6b7280;
      background: #ffffff;
      padding: 8px;
      border-radius: 4px;
      border: 1px solid #e5e7eb;
    }

    .services-section h4,
    .customer-details h4,
    .cart-section h4 {
      margin: 0 0 18px 0;
      color: #333;
      font-size: 22px;
      display: flex;
      align-items: center;
    }

    .services-section h4 i,
    .customer-details h4 i,
    .cart-section h4 i {
      margin-right: 8px;
      color: #007bff;
    }

    .service-controls {
      display: flex;
      gap: 12px;
      margin-bottom: 15px;
    }

    .service-controls .search-box {
      flex: 1;
      position: relative;
    }

    .service-controls .search-box i {
      position: absolute;
      left: 10px;
      top: 50%;
      transform: translateY(-50%);
      color: #666;
    }

    .service-controls .search-box input {
      width: 100%;
      padding: 8px 10px 8px 35px;
      border: 1px solid #ddd;
      border-radius: 4px;
    }

    .services-grid {
      flex: 1;
      overflow-y: auto;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
      padding-right: 10px;
    }

    .service-card {
      background: white;
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 18px;
      cursor: pointer;
      transition: all 0.2s ease;
      position: relative;
      min-height: 130px;
    }

    .service-card:hover {
      border-color: #007bff;
      box-shadow: 0 2px 8px rgba(0, 123, 255, 0.15);
      transform: translateY(-2px);
    }

    .service-image {
      text-align: center;
      margin-bottom: 10px;
    }

    .service-image img {
      width: 100px;
      height: 100px;
      object-fit: cover;
      border-radius: 8px;
    }

    /* Customer create modal service images */
    .customer-modal-large .service-image .service-photo {
      width: 80px;
      height: 80px;
      border-radius: 8px;
      overflow: hidden;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      margin: 0 auto;
    }

    .customer-modal-large .service-image .service-emoji {
      font-size: 28px;
      transition: transform 0.3s ease;
    }

    .customer-modal-large .service-card:hover .service-photo {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .customer-modal-large .service-card:hover .service-emoji {
      transform: scale(1.1);
    }

    .service-info h5 {
      margin: 0 0 8px 0;
      font-size: 18px;
      color: #333;
    }

    .service-category {
      margin: 0 0 12px 0;
      font-size: 14px;
      color: #666;
    }

    .service-prices {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      font-size: 11px;
    }

    .price-label {
      color: #666;
    }

    .price {
      color: #007bff;
      font-weight: bold;
    }

    .add-to-cart-btn {
      position: absolute;
      top: 10px;
      right: 10px;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 50%;
      width: 30px;
      height: 30px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
    }

    .add-to-cart-btn:hover {
      background: #0056b3;
    }

    .customer-details {
      margin-bottom: 20px;
    }

    .cart-section {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .cart-items {
      flex: 1;
      overflow-y: auto;
      margin-bottom: 15px;
    }

    .cart-item {
      background: #f8f9fa;
      border: 1px solid #ddd;
      border-radius: 6px;
      padding: 16px;
      margin-bottom: 12px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .item-info {
      flex: 1;
    }

    .item-info h6 {
      margin: 0 0 5px 0;
      font-size: 14px;
      color: #333;
    }

    .item-info p {
      margin: 0 0 8px 0;
      font-size: 12px;
      color: #666;
    }

    .item-details {
      display: flex;
      gap: 10px;
      align-items: center;
      margin-bottom: 8px;
    }

    .item-details select {
      flex: 1;
      padding: 4px 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 12px;
    }

    .quantity-controls {
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .quantity-controls label {
      font-size: 12px;
      color: #666;
    }

    .qty-btn {
      background: #007bff;
      color: white;
      border: none;
      border-radius: 3px;
      width: 20px;
      height: 20px;
      cursor: pointer;
      font-size: 12px;
    }

    .qty-btn:hover {
      background: #0056b3;
    }

    .quantity {
      font-size: 12px;
      font-weight: bold;
      min-width: 20px;
      text-align: center;
    }

    .item-total {
      font-size: 12px;
      color: #007bff;
    }

    .remove-item-btn {
      background: #dc3545;
      color: white;
      border: none;
      border-radius: 3px;
      width: 25px;
      height: 25px;
      cursor: pointer;
      font-size: 10px;
    }

    .remove-item-btn:hover {
      background: #c82333;
    }

    .empty-cart {
      text-align: center;
      padding: 40px 20px;
      color: #666;
    }

    .empty-cart i {
      font-size: 48px;
      margin-bottom: 15px;
      color: #ddd;
    }

    .empty-cart p {
      margin: 0 0 5px 0;
      font-size: 16px;
    }

    .empty-cart small {
      font-size: 12px;
      color: #999;
    }

    .cart-summary {
      border-top: 1px solid #ddd;
      padding-top: 15px;
      margin-top: auto;
    }

    .total-line {
      display: flex;
      justify-content: space-between;
      margin-bottom: 5px;
      font-size: 14px;
    }

    .total-line.total {
      font-weight: bold;
      font-size: 16px;
      color: #007bff;
      border-top: 1px solid #ddd;
      padding-top: 8px;
      margin-top: 8px;
    }

    @media (max-width: 768px) {
      .customer-modal-large {
        width: 95vw;
        height: 95vh;
      }
      
      .two-part-layout {
        flex-direction: column;
        height: calc(100% - 60px);
        gap: 10px;
        padding: 5px;
      }
      
      .services-section {
        border-right: none;
        border-bottom: 1px solid #ddd;
        padding-right: 0;
        padding-bottom: 20px;
        flex: 0 0 40%;
      }
      
      .customer-section {
        flex: 1;
      }
      
      .services-grid {
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 10px;
      }

      .board-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 15px;
      }

      .header-actions {
        width: 100%;
        justify-content: flex-start;
        flex-wrap: wrap;
      }

      .header-actions .search-input {
        min-width: 200px;
      }

      .laundry-board-container {
        height: calc(100vh - 140px);
      }

      .kanban-board {
        padding: 10px;
        gap: 15px;
      }

      .kanban-column {
        min-width: 280px;
        width: 280px;
      }
    }

    /* Customer Details Modal Styles */
    .order-details {
      display: flex;
      flex-direction: column;
      gap: 15px;
      max-height: calc(100vh - 400px);
      overflow-y: auto;
    }

    .detail-card {
      background: white;
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 15px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .detail-card h5 {
      margin: 0 0 10px 0;
      color: #333;
      font-size: 14px;
      display: flex;
      align-items: center;
    }

    .detail-card h5 i {
      margin-right: 8px;
      color: #007bff;
      width: 16px;
    }

    .status-badge {
      display: inline-block;
      padding: 6px 12px;
      border-radius: 20px;
      color: white;
      font-size: 12px;
      font-weight: bold;
      text-align: center;
    }

    .date-info p {
      margin: 5px 0;
      font-size: 13px;
      color: #555;
    }

    .items-list p {
      margin: 5px 0;
      font-size: 13px;
      color: #555;
    }

    .financial-info {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .amount-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 5px 0;
      border-bottom: 1px solid #f0f0f0;
    }

    .amount-row:last-child {
      border-bottom: none;
    }

    .amount {
      font-weight: bold;
      color: #333;
    }

    .amount.paid {
      color: #28a745;
    }

    .amount.balance {
      color: #dc3545;
    }

    .customer-info {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid #f0f0f0;
    }

    .info-row:last-child {
      border-bottom: none;
    }

    .info-row label {
      font-weight: bold;
      color: #666;
      min-width: 120px;
    }

    .info-row span {
      color: #333;
      text-align: right;
      flex: 1;
    }

    .action-section {
      margin-top: 20px;
      margin-bottom: 20px;
    }

    .action-buttons {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .action-buttons .btn {
      width: 100%;
      justify-content: flex-start;
      text-align: left;
    }

    .btn.warning {
      background-color: #ffc107;
      border-color: #ffc107;
      color: #212529;
    }

    .btn.warning:hover {
      background-color: #e0a800;
      border-color: #d39e00;
    }

    .btn.success {
      background-color: #28a745;
      border-color: #28a745;
      color: white;
    }

    .btn.success:hover {
      background-color: #218838;
      border-color: #1e7e34;
    }

    .btn.danger {
      background-color: #dc3545;
      border-color: #dc3545;
      color: white;
    }

    .btn.danger:hover {
      background-color: #c82333;
      border-color: #bd2130;
    }

    @media (max-width: 768px) {
      .order-details {
        max-height: calc(100vh - 300px);
      }

      .info-row {
        flex-direction: column;
        align-items: flex-start;
        gap: 5px;
      }

      .info-row label {
        min-width: auto;
      }

      .info-row span {
        text-align: left;
      }

      .amount-row {
        flex-direction: column;
        align-items: flex-start;
        gap: 5px;
      }
    }

    /* WhatsApp Configuration Placeholder */
    .whatsapp-config-placeholder {
      padding: 40px;
      text-align: center;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }

    .whatsapp-config-placeholder h2 {
      color: #25D366;
      margin-bottom: 20px;
      font-size: 28px;
    }

    .whatsapp-config-placeholder h2 i {
      margin-right: 10px;
    }

    .whatsapp-config-placeholder p {
      color: #666;
      margin-bottom: 30px;
      font-size: 16px;
    }

    .config-section {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      margin-top: 20px;
    }

    .config-section h3 {
      color: #333;
      margin-bottom: 10px;
    }

    .config-section p {
      color: #666;
      margin: 0;
      font-size: 14px;
    }

    /* Bill Setup Modal Styles */
    .settings-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
      margin-top: 20px;
    }
    
    .settings-card {
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      transition: transform 0.2s ease;
    }
    
    .settings-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0,0,0,0.15);
    }
    
    .settings-card h3 {
      color: #333;
      margin-bottom: 10px;
      font-size: 1.2rem;
    }
    
    .settings-card h3 i {
      margin-right: 10px;
      color: #007bff;
    }
    
    .settings-card p {
      color: #666;
      margin-bottom: 15px;
    }
    
    .btn-primary, .btn-secondary {
      padding: 10px 20px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.3s ease;
    }
    
    .btn-primary {
      background: #007bff;
      color: white;
    }
    
    .btn-primary:hover {
      background: #0056b3;
    }
    
    .btn-secondary {
      background: #6c757d;
      color: white;
    }
    
    .btn-secondary:hover {
      background: #545b62;
    }
    
    .btn-secondary:disabled {
      background: #ccc;
      cursor: not-allowed;
    }
    
    /* Bill Setup Modal */
    .bill-setup-modal {
      width: 1200px;
      height: 800px;
    }
    
    .bill-setup-content {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      height: 100%;
    }
    
    .config-sections-left {
      overflow-y: auto;
      padding-right: 10px;
    }
    
    .config-section {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
    }
    
    .config-section h4 {
      color: #333;
      margin-bottom: 15px;
      font-size: 1.1rem;
    }
    
    .config-section h4 i {
      margin-right: 8px;
      color: #007bff;
    }
    
    .form-group {
      margin-bottom: 15px;
    }
    
    .form-group label {
      display: block;
      margin-bottom: 5px;
      font-weight: 500;
      color: #333;
    }
    
    .form-group input, .form-group select {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
    }
    
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
    }
    
    .fields-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 10px;
    }
    
    .field-item {
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      padding: 10px;
    }
    
    .field-checkbox {
      display: flex;
      align-items: center;
      cursor: pointer;
    }
    
    .field-checkbox input[type="checkbox"] {
      margin-right: 10px;
    }
    
    .field-info strong {
      display: block;
      color: #333;
    }
    
    .field-info small {
      color: #666;
    }
    
    .checkbox-label {
      display: flex;
      align-items: center;
      cursor: pointer;
    }
    
    .checkbox-label input[type="checkbox"] {
      margin-right: 10px;
    }
    
    .preview-section {
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 20px;
      overflow-y: auto;
    }
    
    .preview-section h4 {
      color: #333;
      margin-bottom: 15px;
      font-size: 1.1rem;
    }
    
    .bill-preview {
      font-family: Arial, sans-serif;
    }
    
    .preview-header h2 {
      color: #333;
      margin-bottom: 5px;
      font-size: 1.5rem;
    }
    
    .preview-header p {
      color: #666;
      margin-bottom: 20px;
    }
    
    .preview-section p {
      color: #333;
      line-height: 1.5;
    }
    
    .preview-items {
      margin-top: 10px;
    }
    
    .preview-item {
      padding: 5px 0;
      border-bottom: 1px solid #f0f0f0;
    }

    /* Bill Preview Styles for View Modal */
    .view-bill-modal .bill-preview {
      padding: 25px;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: white;
      color: #333;
      line-height: 1.6;
    }

    .view-bill-modal .bill-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 25px;
      padding-bottom: 15px;
      border-bottom: 2px solid #e9ecef;
    }

    .view-bill-modal .company-info h2 {
      margin: 0 0 8px 0;
      color: #667eea;
      font-size: 20px;
      font-weight: 700;
    }

    .view-bill-modal .company-info p {
      margin: 3px 0;
      color: #6c757d;
      font-size: 12px;
    }

    .view-bill-modal .bill-details h1 {
      margin: 0 0 10px 0;
      color: #495057;
      font-size: 24px;
      font-weight: 700;
      text-align: right;
    }

    .view-bill-modal .bill-meta p {
      margin: 3px 0;
      font-size: 12px;
      color: #6c757d;
      text-align: right;
    }

    .view-bill-modal .customer-info {
      margin-bottom: 25px;
      padding: 15px;
      background: #f8f9fa;
      border-radius: 6px;
    }

    .view-bill-modal .customer-info h3 {
      margin: 0 0 8px 0;
      color: #495057;
      font-size: 14px;
      font-weight: 600;
    }

    .view-bill-modal .customer-info p {
      margin: 3px 0;
      color: #6c757d;
      font-size: 12px;
    }

    .view-bill-modal .bill-items {
      margin-bottom: 25px;
    }

    .view-bill-modal .bill-items table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #e9ecef;
    }

    .view-bill-modal .bill-items th,
    .view-bill-modal .bill-items td {
      padding: 8px;
      text-align: left;
      border-bottom: 1px solid #e9ecef;
      font-size: 12px;
    }

    .view-bill-modal .bill-items th {
      background: #f8f9fa;
      font-weight: 600;
      color: #495057;
    }

    .view-bill-modal .bill-items td {
      color: #6c757d;
    }

    .view-bill-modal .bill-summary {
      margin-bottom: 20px;
      padding: 15px;
      background: #f8f9fa;
      border-radius: 6px;
    }

    .view-bill-modal .summary-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 6px;
      font-size: 12px;
    }

    .view-bill-modal .summary-row.total {
      border-top: 2px solid #e9ecef;
      padding-top: 6px;
      margin-top: 6px;
      font-size: 14px;
    }

    .view-bill-modal .payment-terms {
      margin-bottom: 15px;
      padding: 12px;
      background: #e3f2fd;
      border-radius: 6px;
      border-left: 4px solid #2196f3;
    }

    .view-bill-modal .payment-terms h4 {
      margin: 0 0 5px 0;
      color: #1976d2;
      font-size: 12px;
      font-weight: 600;
    }

    .view-bill-modal .payment-terms p {
      margin: 0;
      color: #1976d2;
      font-size: 11px;
    }

    .view-bill-modal .bill-footer {
      text-align: center;
      padding-top: 15px;
      border-top: 1px solid #e9ecef;
      color: #6c757d;
      font-size: 11px;
    }

  `]
})
export class LaundryComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('barChart') barChartRef!: ElementRef;
  @ViewChild('pieChart') pieChartRef!: ElementRef;
  @ViewChild('lineChart') lineChartRef!: ElementRef;
  activeTab = 'dashboard';
  showNewOrderModal = false;
  showCustomerModal = false;
  showServiceModal = false;
  showBillModal = false;
  showViewBillModal = false;
  showBillSetupModal = false;
  selectedServiceType = 'laundry'; // Default to laundry
  selectedServiceFor = 'man'; // Default to man
  filteredServices: any[] = []; // Filtered services based on dropdown selections
  selectedBillItems: any[] = []; // Items selected for the bill
  billTotalAmount = 0; // Total amount for the bill
  selectedBillForView: any = null; // Bill selected for viewing
  billItemsBreakdownCache: Map<string, any[]> = new Map(); // Cache for bill items breakdown
  billingConfig: any = {}; // Billing configuration for company details
  billItemsForView: any[] = []; // Cached bill items for view modal
  editingCustomer: any = null;
  editingService: any = null;
  
  // Layout properties
  userRole = 'admin'; // Default role, you can get this from auth service
  sidenavCollapsed = false;
  breadcrumbItems: BreadcrumbItem[] = [
    { label: this.languageService.translate('nav.clothaura'), route: '/laundry', active: true }
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

  // Bill Setup Configuration
  billConfig = {
    templateStyle: 'modern',
    logoPosition: 'top-left',
    billNumberFormat: 'BILL-{YYYY}-{MM}-{###}',
    showTaxBreakdown: true,
    showCompanyDetails: true,
    taxRate: 5.0
  };

  companyDetails = {
    companyName: 'ClothAura Laundry Services',
    tagline: 'Professional Laundry & Dry Cleaning',
    address: {
      line1: '123 Business Street',
      line2: 'Suite 100',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      country: 'India'
    },
    contact: {
      phone: '+91 98765 43210',
      email: 'info@clothaura.com',
      website: 'www.clothaura.com'
    },
    business: {
      gstNumber: '27ABCDE1234F1Z5',
      panNumber: 'ABCDE1234F',
      licenseNumber: 'LAUNDRY/2024/001'
    },
    social: {
      whatsapp: '+91 98765 43210',
      instagram: '@clothaura_official',
      facebook: 'ClothAura Laundry'
    }
  };

  billFields = [
    { id: 'customerName', name: 'Customer Name', description: 'Customer full name', required: true },
    { id: 'customerPhone', name: 'Phone Number', description: 'Customer contact number', required: true },
    { id: 'customerEmail', name: 'Email Address', description: 'Customer email (optional)', required: false },
    { id: 'customerAddress', name: 'Address', description: 'Customer address (optional)', required: false },
    { id: 'serviceType', name: 'Service Type', description: 'Type of service (laundry, dry clean, etc.)', required: true },
    { id: 'items', name: 'Items', description: 'List of items and quantities', required: true },
    { id: 'amount', name: 'Amount', description: 'Total bill amount', required: true },
    { id: 'dueDate', name: 'Due Date', description: 'Payment due date', required: true },
    { id: 'notes', name: 'Additional Notes', description: 'Additional notes (optional)', required: false }
  ];

  customers: any[] = [];
  filteredCustomers: any[] = [];

  // Board-related properties
  searchTerm: string = '';
  filterStatus: string = '';
  statuses = [
    { id: 'received', name: 'Received', color: '#607d8b' },
    { id: 'inProcess', name: 'In Process', color: '#ffc107' },
    { id: 'readyForDelivery', name: 'Ready for Delivery', color: '#17a2b8' },
    { id: 'delivered', name: 'Delivered', color: '#28a745' },
    { id: 'cancelled', name: 'Cancelled', color: '#dc3545' },
    { id: 'billed', name: 'Billed', color: '#6f42c1' }
  ];
  allStatuses = this.statuses.map(s => s.id);

  // Cart functionality
  selectedItems: any[] = [];
  totalAmount: number = 0;
  serviceSearchTerm: string = '';
  cartServiceTypeFilter: string = 'laundry';
  private filterTimeout: any;
  private lastFilterState: string = '';
  private isFiltering: boolean = false;

  // Drag and Drop functionality
  draggedOrder: any = null;
  draggedOverColumn: string = '';
  isDragging: boolean = false;

  // Customer Details Modal
  showCustomerDetailsModal: boolean = false;
  selectedCustomerForDetails: any = null;
  isViewMode: boolean = false;

  services = [
    // Men's Services - Comprehensive Collection
    { id: 'M001', name: 'Men Formal Shirt', description: 'Wash & Iron for Men Formal Shirts', price: 25, laundryPrice: 25, dryCleanPrice: 45, ironingPrice: 15, icon: 'fas fa-tshirt', category: 'Men', clothType: 'Formal Shirt', pickup: true, photo: 'https://via.placeholder.com/80x80/3b82f6/ffffff?text=SHIRT' },
    { id: 'M002', name: 'Men Casual Shirt', description: 'Wash & Iron for Men Casual Shirts', price: 22, laundryPrice: 22, dryCleanPrice: 40, ironingPrice: 12, icon: 'fas fa-tshirt', category: 'Men', clothType: 'Casual Shirt', pickup: true, photo: 'https://via.placeholder.com/80x80/3b82f6/ffffff?text=SHIRT' },
    { id: 'M003', name: 'Men T-Shirt', description: 'Wash & Iron for Men T-Shirts', price: 20, laundryPrice: 20, dryCleanPrice: 35, ironingPrice: 10, icon: 'fas fa-tshirt', category: 'Men', clothType: 'T-Shirt', pickup: true, photo: 'https://via.placeholder.com/80x80/3b82f6/ffffff?text=SHIRT' },
    { id: 'M004', name: 'Men Polo Shirt', description: 'Wash & Iron for Men Polo Shirts', price: 23, laundryPrice: 23, dryCleanPrice: 40, ironingPrice: 12, icon: 'fas fa-tshirt', category: 'Men', clothType: 'Polo Shirt', pickup: true, photo: 'https://via.placeholder.com/80x80/3b82f6/ffffff?text=SHIRT' },
    { id: 'M005', name: 'Men Tank Top', description: 'Wash & Iron for Men Tank Tops', price: 18, laundryPrice: 18, dryCleanPrice: 30, ironingPrice: 10, icon: 'fas fa-tshirt', category: 'Men', clothType: 'Tank Top', pickup: true, photo: 'https://via.placeholder.com/80x80/3b82f6/ffffff?text=SHIRT' },
    { id: 'M006', name: 'Men Hoodie', description: 'Wash & Iron for Men Hoodies', price: 35, laundryPrice: 35, dryCleanPrice: 60, ironingPrice: 20, icon: 'fas fa-tshirt', category: 'Men', clothType: 'Hoodie', pickup: true, photo: 'https://via.placeholder.com/80x80/3b82f6/ffffff?text=JACKET' },
    { id: 'M007', name: 'Men Sweatshirt', description: 'Wash & Iron for Men Sweatshirts', price: 32, laundryPrice: 32, dryCleanPrice: 55, ironingPrice: 18, icon: 'fas fa-tshirt', category: 'Men', clothType: 'Sweatshirt', pickup: true, photo: 'https://via.placeholder.com/80x80/3b82f6/ffffff?text=JACKET' },
    { id: 'M008', name: 'Men Formal Trousers', description: 'Wash & Iron for Men Formal Trousers', price: 30, laundryPrice: 30, dryCleanPrice: 50, ironingPrice: 18, icon: 'fas fa-user-tie', category: 'Men', clothType: 'Formal Trousers', pickup: true, photo: 'https://via.placeholder.com/80x80/3b82f6/ffffff?text=PANTS' },
    { id: 'M009', name: 'Men Casual Trousers', description: 'Wash & Iron for Men Casual Trousers', price: 28, laundryPrice: 28, dryCleanPrice: 45, ironingPrice: 16, icon: 'fas fa-user-tie', category: 'Men', clothType: 'Casual Trousers', pickup: true, photo: 'https://via.placeholder.com/80x80/3b82f6/ffffff?text=PANTS' },
    { id: 'M010', name: 'Men Jeans', description: 'Wash & Iron for Men Jeans', price: 35, laundryPrice: 35, dryCleanPrice: 60, ironingPrice: 20, icon: 'fas fa-user', category: 'Men', clothType: 'Jeans', pickup: true, photo: 'https://via.placeholder.com/80x80/3b82f6/ffffff?text=PANTS' },
    { id: 'M011', name: 'Men Shorts', description: 'Wash & Iron for Men Shorts', price: 22, laundryPrice: 22, dryCleanPrice: 35, ironingPrice: 12, icon: 'fas fa-user', category: 'Men', clothType: 'Shorts', pickup: true, photo: 'https://via.placeholder.com/80x80/3b82f6/ffffff?text=SHORTS' },
    { id: 'M012', name: 'Men Track Pants', description: 'Wash & Iron for Men Track Pants', price: 25, laundryPrice: 25, dryCleanPrice: 40, ironingPrice: 14, icon: 'fas fa-user', category: 'Men', clothType: 'Track Pants', pickup: true, photo: 'https://via.placeholder.com/80x80/3b82f6/ffffff?text=PANTS' },
    { id: 'M013', name: 'Men Suit Jacket', description: 'Dry Clean for Men Suit Jackets', price: 80, laundryPrice: 60, dryCleanPrice: 80, ironingPrice: 35, icon: 'fas fa-suitcase', category: 'Men', clothType: 'Suit Jacket', pickup: true, photo: 'https://via.placeholder.com/80x80/10b981/ffffff?text=SHIRT' },
    { id: 'M014', name: 'Men Blazer', description: 'Dry Clean for Men Blazers', price: 75, laundryPrice: 55, dryCleanPrice: 75, ironingPrice: 30, icon: 'fas fa-suitcase', category: 'Men', clothType: 'Blazer', pickup: true, photo: 'https://via.placeholder.com/80x80/10b981/ffffff?text=SHIRT' },
    { id: 'M015', name: 'Men Waistcoat', description: 'Dry Clean for Men Waistcoats', price: 45, laundryPrice: 35, dryCleanPrice: 45, ironingPrice: 20, icon: 'fas fa-suitcase', category: 'Men', clothType: 'Waistcoat', pickup: true, photo: 'https://via.placeholder.com/80x80/10b981/ffffff?text=SHIRT' },
    { id: 'M016', name: 'Men Coat', description: 'Dry Clean for Men Coats', price: 90, laundryPrice: 70, dryCleanPrice: 90, ironingPrice: 40, icon: 'fas fa-suitcase', category: 'Men', clothType: 'Coat', pickup: true, photo: 'https://via.placeholder.com/80x80/10b981/ffffff?text=JACKET' },
    { id: 'M017', name: 'Men Jacket', description: 'Wash & Iron for Men Jackets', price: 40, laundryPrice: 40, dryCleanPrice: 65, ironingPrice: 22, icon: 'fas fa-suitcase', category: 'Men', clothType: 'Jacket', pickup: true, photo: 'https://via.placeholder.com/80x80/3b82f6/ffffff?text=JACKET' },
    { id: 'M018', name: 'Men Sweater', description: 'Wash & Iron for Men Sweaters', price: 38, laundryPrice: 38, dryCleanPrice: 60, ironingPrice: 20, icon: 'fas fa-tshirt', category: 'Men', clothType: 'Sweater', pickup: true, photo: 'https://via.placeholder.com/80x80/3b82f6/ffffff?text=JACKET' },
    { id: 'M019', name: 'Men Cardigan', description: 'Wash & Iron for Men Cardigans', price: 35, laundryPrice: 35, dryCleanPrice: 55, ironingPrice: 18, icon: 'fas fa-tshirt', category: 'Men', clothType: 'Cardigan', pickup: true, photo: 'https://via.placeholder.com/80x80/3b82f6/ffffff?text=JACKET' },
    { id: 'M020', name: 'Men Vest', description: 'Wash & Iron for Men Vests', price: 20, laundryPrice: 20, dryCleanPrice: 30, ironingPrice: 10, icon: 'fas fa-tshirt', category: 'Men', clothType: 'Vest', pickup: true, photo: 'https://via.placeholder.com/80x80/3b82f6/ffffff?text=SHIRT' },
    { id: 'M021', name: 'Men Kurta', description: 'Wash & Iron for Men Kurtas', price: 35, laundryPrice: 35, dryCleanPrice: 55, ironingPrice: 18, icon: 'fas fa-user', category: 'Men', clothType: 'Kurta', pickup: true, photo: 'https://via.placeholder.com/80x80/3b82f6/ffffff?text=SHIRT' },
    { id: 'M022', name: 'Men Pyjama', description: 'Wash & Iron for Men Pyjamas', price: 25, laundryPrice: 25, dryCleanPrice: 40, ironingPrice: 14, icon: 'fas fa-user', category: 'Men', clothType: 'Pyjama', pickup: true, photo: 'https://via.placeholder.com/80x80/3b82f6/ffffff?text=PANTS' },
    { id: 'M023', name: 'Men Lungi', description: 'Wash & Iron for Men Lungis', price: 20, laundryPrice: 20, dryCleanPrice: 30, ironingPrice: 10, icon: 'fas fa-user', category: 'Men', clothType: 'Lungi', pickup: true, photo: 'https://via.placeholder.com/80x80/3b82f6/ffffff?text=PANTS' },
    { id: 'M024', name: 'Men Underwear', description: 'Wash & Iron for Men Underwear', price: 15, laundryPrice: 15, dryCleanPrice: 25, ironingPrice: 8, icon: 'fas fa-user', category: 'Men', clothType: 'Underwear', pickup: true, photo: 'https://via.placeholder.com/80x80/3b82f6/ffffff?text=UNDER' },
    { id: 'M025', name: 'Men Socks', description: 'Wash & Iron for Men Socks', price: 10, laundryPrice: 10, dryCleanPrice: 15, ironingPrice: 5, icon: 'fas fa-user', category: 'Men', clothType: 'Socks', pickup: true, photo: 'https://via.placeholder.com/80x80/3b82f6/ffffff?text=SOCKS' },
    
    // Women's Services - Comprehensive Collection
    { id: 'W001', name: 'Women Blouse', description: 'Wash & Iron for Women Blouses', price: 30, laundryPrice: 30, dryCleanPrice: 50, ironingPrice: 18, icon: 'fas fa-female', category: 'Women', clothType: 'Blouse', pickup: true, photo: 'https://via.placeholder.com/80x80/f472b6/ffffff?text=WOMEN' },
    { id: 'W002', name: 'Women Formal Shirt', description: 'Wash & Iron for Women Formal Shirts', price: 28, laundryPrice: 28, dryCleanPrice: 45, ironingPrice: 16, icon: 'fas fa-female', category: 'Women', clothType: 'Formal Shirt', pickup: true, photo: 'https://via.placeholder.com/80x80/f472b6/ffffff?text=SHIRT' },
    { id: 'W003', name: 'Women Casual Shirt', description: 'Wash & Iron for Women Casual Shirts', price: 25, laundryPrice: 25, dryCleanPrice: 40, ironingPrice: 14, icon: 'fas fa-female', category: 'Women', clothType: 'Casual Shirt', pickup: true, photo: 'https://via.placeholder.com/80x80/f472b6/ffffff?text=WOMEN' },
    { id: 'W004', name: 'Women T-Shirt', description: 'Wash & Iron for Women T-Shirts', price: 22, laundryPrice: 22, dryCleanPrice: 35, ironingPrice: 12, icon: 'fas fa-female', category: 'Women', clothType: 'T-Shirt', pickup: true, photo: 'https://via.placeholder.com/80x80/f472b6/ffffff?text=WOMEN' },
    { id: 'W005', name: 'Women Tank Top', description: 'Wash & Iron for Women Tank Tops', price: 20, laundryPrice: 20, dryCleanPrice: 30, ironingPrice: 10, icon: 'fas fa-female', category: 'Women', clothType: 'Tank Top', pickup: true, photo: 'https://via.placeholder.com/80x80/f472b6/ffffff?text=WOMEN' },
    { id: 'W006', name: 'Women Crop Top', description: 'Wash & Iron for Women Crop Tops', price: 18, laundryPrice: 18, dryCleanPrice: 28, ironingPrice: 9, icon: 'fas fa-female', category: 'Women', clothType: 'Crop Top', pickup: true, photo: 'https://via.placeholder.com/80x80/f472b6/ffffff?text=WOMEN' },
    { id: 'W007', name: 'Women Hoodie', description: 'Wash & Iron for Women Hoodies', price: 35, laundryPrice: 35, dryCleanPrice: 60, ironingPrice: 20, icon: 'fas fa-female', category: 'Women', clothType: 'Hoodie', pickup: true, photo: 'https://via.placeholder.com/80x80/f472b6/ffffff?text=JACKET' },
    { id: 'W008', name: 'Women Sweatshirt', description: 'Wash & Iron for Women Sweatshirts', price: 32, laundryPrice: 32, dryCleanPrice: 55, ironingPrice: 18, icon: 'fas fa-female', category: 'Women', clothType: 'Sweatshirt', pickup: true, photo: 'https://via.placeholder.com/80x80/f472b6/ffffff?text=JACKET' },
    { id: 'W009', name: 'Women Dress', description: 'Wash & Iron for Women Dresses', price: 50, laundryPrice: 50, dryCleanPrice: 80, ironingPrice: 28, icon: 'fas fa-venus', category: 'Women', clothType: 'Dress', pickup: true, photo: 'https://via.placeholder.com/80x80/f472b6/ffffff?text=DRESS' },
    { id: 'W010', name: 'Women Formal Dress', description: 'Dry Clean for Women Formal Dresses', price: 80, laundryPrice: 60, dryCleanPrice: 80, ironingPrice: 35, icon: 'fas fa-venus', category: 'Women', clothType: 'Formal Dress', pickup: true, photo: 'https://via.placeholder.com/80x80/10b981/ffffff?text=DRESS' },
    { id: 'W011', name: 'Women Casual Dress', description: 'Wash & Iron for Women Casual Dresses', price: 45, laundryPrice: 45, dryCleanPrice: 70, ironingPrice: 25, icon: 'fas fa-venus', category: 'Women', clothType: 'Casual Dress', pickup: true, photo: 'https://via.placeholder.com/80x80/f472b6/ffffff?text=DRESS' },
    { id: 'W012', name: 'Women Maxi Dress', description: 'Wash & Iron for Women Maxi Dresses', price: 55, laundryPrice: 55, dryCleanPrice: 85, ironingPrice: 30, icon: 'fas fa-venus', category: 'Women', clothType: 'Maxi Dress', pickup: true, photo: 'https://via.placeholder.com/80x80/f472b6/ffffff?text=DRESS' },
    { id: 'W013', name: 'Women Skirt', description: 'Wash & Iron for Women Skirts', price: 25, laundryPrice: 25, dryCleanPrice: 40, ironingPrice: 14, icon: 'fas fa-female', category: 'Women', clothType: 'Skirt', pickup: true, photo: 'https://via.placeholder.com/80x80/f472b6/ffffff?text=DRESS' },
    { id: 'W014', name: 'Women Mini Skirt', description: 'Wash & Iron for Women Mini Skirts', price: 22, laundryPrice: 22, dryCleanPrice: 35, ironingPrice: 12, icon: 'fas fa-female', category: 'Women', clothType: 'Mini Skirt', pickup: true, photo: 'https://via.placeholder.com/80x80/f472b6/ffffff?text=DRESS' },
    { id: 'W015', name: 'Women Midi Skirt', description: 'Wash & Iron for Women Midi Skirts', price: 28, laundryPrice: 28, dryCleanPrice: 45, ironingPrice: 16, icon: 'fas fa-female', category: 'Women', clothType: 'Midi Skirt', pickup: true, photo: 'https://via.placeholder.com/80x80/f472b6/ffffff?text=DRESS' },
    { id: 'W016', name: 'Women Maxi Skirt', description: 'Wash & Iron for Women Maxi Skirts', price: 30, laundryPrice: 30, dryCleanPrice: 50, ironingPrice: 18, icon: 'fas fa-female', category: 'Women', clothType: 'Maxi Skirt', pickup: true, photo: 'https://via.placeholder.com/80x80/f472b6/ffffff?text=DRESS' },
    { id: 'W017', name: 'Women Formal Trousers', description: 'Wash & Iron for Women Formal Trousers', price: 30, laundryPrice: 30, dryCleanPrice: 50, ironingPrice: 18, icon: 'fas fa-female', category: 'Women', clothType: 'Formal Trousers', pickup: true, photo: 'https://via.placeholder.com/80x80/f472b6/ffffff?text=PANTS' },
    { id: 'W018', name: 'Women Casual Trousers', description: 'Wash & Iron for Women Casual Trousers', price: 28, laundryPrice: 28, dryCleanPrice: 45, ironingPrice: 16, icon: 'fas fa-female', category: 'Women', clothType: 'Casual Trousers', pickup: true, photo: 'https://via.placeholder.com/80x80/f472b6/ffffff?text=PANTS' },
    { id: 'W019', name: 'Women Jeans', description: 'Wash & Iron for Women Jeans', price: 35, laundryPrice: 35, dryCleanPrice: 60, ironingPrice: 20, icon: 'fas fa-female', category: 'Women', clothType: 'Jeans', pickup: true, photo: 'https://via.placeholder.com/80x80/f472b6/ffffff?text=PANTS' },
    { id: 'W020', name: 'Women Shorts', description: 'Wash & Iron for Women Shorts', price: 22, laundryPrice: 22, dryCleanPrice: 35, ironingPrice: 12, icon: 'fas fa-female', category: 'Women', clothType: 'Shorts', pickup: true, photo: 'https://via.placeholder.com/80x80/f472b6/ffffff?text=SHORTS' },
    { id: 'W021', name: 'Women Track Pants', description: 'Wash & Iron for Women Track Pants', price: 25, laundryPrice: 25, dryCleanPrice: 40, ironingPrice: 14, icon: 'fas fa-female', category: 'Women', clothType: 'Track Pants', pickup: true, photo: 'https://via.placeholder.com/80x80/f472b6/ffffff?text=PANTS' },
    { id: 'W022', name: 'Women Leggings', description: 'Wash & Iron for Women Leggings', price: 20, laundryPrice: 20, dryCleanPrice: 30, ironingPrice: 10, icon: 'fas fa-female', category: 'Women', clothType: 'Leggings', pickup: true, photo: 'https://via.placeholder.com/80x80/f472b6/ffffff?text=PANTS' },
    { id: 'W023', name: 'Women Jeggings', description: 'Wash & Iron for Women Jeggings', price: 28, laundryPrice: 28, dryCleanPrice: 45, ironingPrice: 16, icon: 'fas fa-female', category: 'Women', clothType: 'Jeggings', pickup: true, photo: 'https://via.placeholder.com/80x80/f472b6/ffffff?text=PANTS' },
    { id: 'W024', name: 'Women Saree', description: 'Dry Clean for Women Sarees', price: 60, laundryPrice: 45, dryCleanPrice: 60, ironingPrice: 25, icon: 'fas fa-female', category: 'Women', clothType: 'Saree', pickup: true, photo: 'https://via.placeholder.com/80x80/10b981/ffffff?text=DRESS' },
    { id: 'W025', name: 'Women Kurta', description: 'Wash & Iron for Women Kurtas', price: 40, laundryPrice: 40, dryCleanPrice: 65, ironingPrice: 22, icon: 'fas fa-female', category: 'Women', clothType: 'Kurta', pickup: true, photo: 'https://via.placeholder.com/80x80/f472b6/ffffff?text=WOMEN' },
    { id: 'W026', name: 'Women Salwar Kameez', description: 'Wash & Iron for Women Salwar Kameez', price: 45, laundryPrice: 45, dryCleanPrice: 70, ironingPrice: 25, icon: 'fas fa-female', category: 'Women', clothType: 'Salwar Kameez', pickup: true, photo: 'https://via.placeholder.com/80x80/f472b6/ffffff?text=WOMEN' },
    { id: 'W027', name: 'Women Palazzo', description: 'Wash & Iron for Women Palazzos', price: 35, laundryPrice: 35, dryCleanPrice: 55, ironingPrice: 18, icon: 'fas fa-female', category: 'Women', clothType: 'Palazzo', pickup: true, photo: 'https://via.placeholder.com/80x80/f472b6/ffffff?text=PANTS' },
    { id: 'W028', name: 'Women Churidar', description: 'Wash & Iron for Women Churidars', price: 30, laundryPrice: 30, dryCleanPrice: 50, ironingPrice: 18, icon: 'fas fa-female', category: 'Women', clothType: 'Churidar', pickup: true, photo: 'https://via.placeholder.com/80x80/f472b6/ffffff?text=PANTS' },
    { id: 'W029', name: 'Women Blazer', description: 'Dry Clean for Women Blazers', price: 70, laundryPrice: 55, dryCleanPrice: 70, ironingPrice: 30, icon: 'fas fa-suitcase', category: 'Women', clothType: 'Blazer', pickup: true, photo: 'https://via.placeholder.com/80x80/10b981/ffffff?text=SHIRT' },
    { id: 'W030', name: 'Women Jacket', description: 'Wash & Iron for Women Jackets', price: 40, laundryPrice: 40, dryCleanPrice: 65, ironingPrice: 22, icon: 'fas fa-suitcase', category: 'Women', clothType: 'Jacket', pickup: true, photo: 'https://via.placeholder.com/80x80/f472b6/ffffff?text=JACKET' },
    { id: 'W031', name: 'Women Coat', description: 'Dry Clean for Women Coats', price: 85, laundryPrice: 65, dryCleanPrice: 85, ironingPrice: 35, icon: 'fas fa-suitcase', category: 'Women', clothType: 'Coat', pickup: true, photo: 'https://via.placeholder.com/80x80/10b981/ffffff?text=JACKET' },
    { id: 'W032', name: 'Women Sweater', description: 'Wash & Iron for Women Sweaters', price: 38, laundryPrice: 38, dryCleanPrice: 60, ironingPrice: 20, icon: 'fas fa-tshirt', category: 'Women', clothType: 'Sweater', pickup: true, photo: 'https://via.placeholder.com/80x80/f472b6/ffffff?text=JACKET' },
    { id: 'W033', name: 'Women Cardigan', description: 'Wash & Iron for Women Cardigans', price: 35, laundryPrice: 35, dryCleanPrice: 55, ironingPrice: 18, icon: 'fas fa-tshirt', category: 'Women', clothType: 'Cardigan', pickup: true, photo: 'https://via.placeholder.com/80x80/f472b6/ffffff?text=JACKET' },
    { id: 'W034', name: 'Women Vest', description: 'Wash & Iron for Women Vests', price: 25, laundryPrice: 25, dryCleanPrice: 40, ironingPrice: 14, icon: 'fas fa-tshirt', category: 'Women', clothType: 'Vest', pickup: true, photo: 'https://via.placeholder.com/80x80/f472b6/ffffff?text=WOMEN' },
    { id: 'W035', name: 'Women Nightdress', description: 'Wash & Iron for Women Nightdresses', price: 30, laundryPrice: 30, dryCleanPrice: 50, ironingPrice: 18, icon: 'fas fa-female', category: 'Women', clothType: 'Nightdress', pickup: true, photo: 'https://via.placeholder.com/80x80/f472b6/ffffff?text=DRESS' },
    { id: 'W036', name: 'Women Pyjama', description: 'Wash & Iron for Women Pyjamas', price: 25, laundryPrice: 25, dryCleanPrice: 40, ironingPrice: 14, icon: 'fas fa-female', category: 'Women', clothType: 'Pyjama', pickup: true, photo: 'https://via.placeholder.com/80x80/f472b6/ffffff?text=PANTS' },
    { id: 'W037', name: 'Women Bra', description: 'Wash & Iron for Women Bras', price: 15, laundryPrice: 15, dryCleanPrice: 25, ironingPrice: 8, icon: 'fas fa-female', category: 'Women', clothType: 'Bra', pickup: true, photo: 'https://via.placeholder.com/80x80/f472b6/ffffff?text=UNDER' },
    { id: 'W038', name: 'Women Panties', description: 'Wash & Iron for Women Panties', price: 12, laundryPrice: 12, dryCleanPrice: 20, ironingPrice: 6, icon: 'fas fa-female', category: 'Women', clothType: 'Panties', pickup: true, photo: 'https://via.placeholder.com/80x80/f472b6/ffffff?text=UNDER' },
    { id: 'W039', name: 'Women Stockings', description: 'Wash & Iron for Women Stockings', price: 10, laundryPrice: 10, dryCleanPrice: 15, ironingPrice: 5, icon: 'fas fa-female', category: 'Women', clothType: 'Stockings', pickup: true, photo: 'https://via.placeholder.com/80x80/f472b6/ffffff?text=SOCKS' },
    
    // Children's Services (Boy)
    { id: 'CB001', name: 'Boy Shirt', description: 'Wash & Iron for Boy Shirts', price: 15, laundryPrice: 15, dryCleanPrice: 25, ironingPrice: 8, icon: 'fas fa-child', category: 'Children', clothType: 'Boy Shirt', pickup: true, photo: 'https://via.placeholder.com/80x80/f59e0b/ffffff?text=SHIRT' },
    { id: 'CB002', name: 'Boy Shorts', description: 'Wash & Iron for Boy Shorts', price: 12, laundryPrice: 12, dryCleanPrice: 20, ironingPrice: 6, icon: 'fas fa-child', category: 'Children', clothType: 'Boy Shorts', pickup: true, photo: 'https://via.placeholder.com/80x80/f59e0b/ffffff?text=SHORTS' },
    { id: 'CB003', name: 'Boy T-Shirt', description: 'Wash & Iron for Boy T-Shirts', price: 10, laundryPrice: 10, dryCleanPrice: 18, ironingPrice: 5, icon: 'fas fa-child', category: 'Children', clothType: 'Boy T-Shirt', pickup: true, photo: 'https://via.placeholder.com/80x80/f59e0b/ffffff?text=SHIRT' },
    { id: 'CB004', name: 'Boy Pants', description: 'Wash & Iron for Boy Pants', price: 18, laundryPrice: 18, dryCleanPrice: 30, ironingPrice: 10, icon: 'fas fa-child', category: 'Children', clothType: 'Boy Pants', pickup: true, photo: 'https://via.placeholder.com/80x80/f59e0b/ffffff?text=PANTS' },
    
    // Children's Services (Girl)
    { id: 'CG001', name: 'Girl Dress', description: 'Wash & Iron for Girl Dresses', price: 20, laundryPrice: 20, dryCleanPrice: 35, ironingPrice: 12, icon: 'fas fa-child', category: 'Children', clothType: 'Girl Dress', pickup: true, photo: 'https://via.placeholder.com/80x80/ec4899/ffffff?text=DRESS' },
    { id: 'CG002', name: 'Girl Skirt', description: 'Wash & Iron for Girl Skirts', price: 15, laundryPrice: 15, dryCleanPrice: 25, ironingPrice: 8, icon: 'fas fa-child', category: 'Children', clothType: 'Girl Skirt', pickup: true, photo: 'https://via.placeholder.com/80x80/ec4899/ffffff?text=DRESS' },
    { id: 'CG003', name: 'Girl Top', description: 'Wash & Iron for Girl Tops', price: 12, laundryPrice: 12, dryCleanPrice: 20, ironingPrice: 6, icon: 'fas fa-child', category: 'Children', clothType: 'Girl Top', pickup: true, photo: 'https://via.placeholder.com/80x80/ec4899/ffffff?text=WOMEN' },
    { id: 'CG004', name: 'Girl Frock', description: 'Wash & Iron for Girl Frocks', price: 18, laundryPrice: 18, dryCleanPrice: 30, ironingPrice: 10, icon: 'fas fa-child', category: 'Children', clothType: 'Girl Frock', pickup: true, photo: 'https://via.placeholder.com/80x80/ec4899/ffffff?text=DRESS' }
  ];

  bills: any[] = [];

  newOrderForm: FormGroup;
  customerForm: FormGroup;
  serviceForm: FormGroup;
  billForm: FormGroup;

  private languageSubscription: Subscription = new Subscription();

  constructor(private fb: FormBuilder, private router: Router, private toastService: ToastService, private languageService: LanguageService) {
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
      status: ['received']
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

  async ngOnInit() {
    this.userRole = sessionStorage.getItem('role') || '';
    console.log('Laundry - userRole from sessionStorage:', this.userRole);
    console.log('Laundry - userRole type:', typeof this.userRole);
    console.log('Laundry - userRole === clothAura:', this.userRole === 'clothAura');
    
    // Subscribe to language changes
    this.languageSubscription = this.languageService.currentLanguage$.subscribe(() => {
      this.updateBreadcrumbItems();
    });
    
    // Check for tab query parameter
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    if (tab === 'whatsapp') {
      this.activeTab = 'whatsapp';
    }
    
    // Initialize price properties for all services
    this.initializeServicePrices();
    
    // Load billing configuration for company details
    await this.loadBillingConfig();
    
    // Load customers, services, and bills from API first
    await this.loadCustomers();
    await this.loadServices();
    await this.loadBills();
    
    // Initialize filtered services after data is loaded
    this.filterServices();
    
    // Debug: Log first service to check structure
    if (this.services.length > 0) {
      // console.log('First service structure:', this.services[0]);
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

  ngOnDestroy() {
    this.languageSubscription.unsubscribe();
  }

  private updateBreadcrumbItems() {
    this.breadcrumbItems = [
      { label: this.languageService.translate('nav.clothaura'), route: '/laundry', active: true }
    ];
  }

  translate(key: string): string {
    return this.languageService.translate(key);
  }

  translateServiceName(serviceName: string): string {
    return this.languageService.translateServiceName(serviceName);
  }

  translateServiceDescription(description: string): string {
    return this.languageService.translateServiceDescription(description);
  }

  initCharts() {
    try {
      console.log('Initializing ClothAura Dashboard charts...');
      
      // Check if Chart is available
      if (typeof Chart === 'undefined') {
        console.error('Chart.js is not loaded');
        return;
      }
      
      // Check if chart elements exist
      if (!this.barChartRef || !this.pieChartRef || !this.lineChartRef) {
        console.error('Chart elements not found');
        return;
      }
      
      // Prepare data for charts - Laundry specific data
      const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
      const orderCounts = [12, 18, 15, 22, 25, 28]; // Sample laundry orders per month
      
      // Bar Chart - Orders Per Month (Corporate Style)
      console.log('Creating corporate style bar chart...');
      
      new Chart(this.barChartRef.nativeElement, {
        type: 'bar',
        data: {
          labels: monthLabels,
          datasets: [{
            label: 'Orders',
            data: orderCounts,
            backgroundColor: '#10b981', // Green
            borderColor: '#047857', // Dark Green
            borderWidth: 1,
            borderRadius: 2,
            borderSkipped: false,
            hoverBackgroundColor: '#059669', // Lighter Green
            hoverBorderColor: '#065f46', // Darker Green
            hoverBorderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: {
            duration: 800,
            easing: 'easeInOutQuart'
          },
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              backgroundColor: '#1f2937',
              titleColor: '#f9fafb',
              bodyColor: '#f9fafb',
              borderColor: '#374151',
              borderWidth: 1,
              cornerRadius: 4,
              displayColors: false,
              titleFont: {
                size: 12,
                weight: '600'
              },
              bodyFont: {
                size: 12,
                weight: '500'
              },
              padding: 8,
              callbacks: {
                title: function(context: any) {
                  return context[0].label;
                },
                label: function(context: any) {
                  return `${context.parsed.y} orders`;
                }
              }
            }
          },
          scales: {
            x: {
              ticks: {
                color: '#6b7280',
                font: {
                  size: 11,
                  weight: '500'
                },
                padding: 8
              },
              grid: {
                display: false
              },
              border: {
                display: false
              }
            },
            y: {
              beginAtZero: true,
              ticks: {
                color: '#6b7280',
                font: {
                  size: 11,
                  weight: '500'
                },
                padding: 8,
                stepSize: 5
              },
              grid: {
                color: '#e5e7eb',
                drawBorder: false,
                lineWidth: 1
              },
              border: {
                display: false
              }
            }
          },
          interaction: {
            intersect: false,
            mode: 'index'
          }
        }
      });

    // Pie Chart - Service Distribution
    const serviceLabels = ['Wash & Fold', 'Dry Cleaning', 'Ironing', 'Express Service'];
    const serviceCounts = [45, 25, 20, 10]; // Sample service distribution
    const colors = [
      'rgba(99, 102, 241, 0.7)',
      'rgba(16, 185, 129, 0.7)', 
      'rgba(245, 158, 11, 0.7)',
      'rgba(139, 92, 246, 0.7)',
      'rgba(239, 68, 68, 0.7)',
      'rgba(236, 72, 153, 0.7)'
    ];
    
    new Chart(this.pieChartRef.nativeElement, {
      type: 'doughnut',
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
        cutout: '60%',
        plugins: {
          legend: {
            labels: {
              color: '#64748b',
              font: {
                size: 14,
                weight: '500'
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
          borderColor: 'rgba(99, 102, 241, 0.8)',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          fill: true,
          tension: 0.4,
          borderWidth: 3,
          pointBackgroundColor: 'rgba(99, 102, 241, 0.8)',
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
              color: '#64748b',
              font: {
                size: 14,
                weight: '500'
              }
            }
          }
        },
        scales: {
          x: {
            ticks: {
              color: '#64748b',
              font: {
                size: 12,
                weight: '500'
              }
            },
            grid: {
              color: 'rgba(148, 163, 184, 0.1)'
            }
          },
          y: {
            beginAtZero: true,
            ticks: {
              color: '#64748b',
              font: {
                size: 12,
                weight: '500'
              }
            },
            grid: {
              color: 'rgba(148, 163, 184, 0.1)'
            }
          }
        }
      }
    });
    
    console.log('ClothAura Dashboard charts initialized successfully!');
    } catch (error) {
      console.error('Error initializing ClothAura Dashboard charts:', error);
    }
  }

  setActiveTab(tab: string) {
    console.log('Switching to tab:', tab);
    this.activeTab = tab;
    
    // If switching to dashboard, reinitialize charts after a delay
    if (tab === 'dashboard') {
      console.log('Loading ClothAura Dashboard...');
      setTimeout(() => {
        this.initCharts();
      }, 300);
    }
  }

  navigateToBoard() {
    this.setActiveTab('board');
  }

  // Services field methods
  onServiceTypeChange() {
    // console.log('Selected service type:', this.cartServiceTypeFilter);
    // Trigger filtering when service type changes
    this.debouncedFilterServices();
  }

  onServiceForChange() {
    // console.log('Selected service for:', this.selectedServiceFor);
    this.debouncedFilterServices();
  }

  filterServices() {
    if (!this.services || this.services.length === 0) {
      this.filteredServices = [];
      return;
    }
    
    let filtered = [...this.services];
    
    // Apply category filter (cartServiceTypeFilter)
    if (this.cartServiceTypeFilter && this.cartServiceTypeFilter !== '') {
      // Check if it's a service type filter (laundry, dry-clean, ironing) or category filter (Men, Women, Kids, Home)
      if (['laundry', 'dry-clean', 'ironing'].includes(this.cartServiceTypeFilter)) {
        // This is a service type filter - we don't filter by service type in the services list
        // Service type affects pricing, not visibility
      } else {
        // This is a category filter - map filter values to service categories
        let categoryFilter = '';
        switch (this.cartServiceTypeFilter) {
          case 'Men':
            categoryFilter = 'Men';
            break;
          case 'Women':
            categoryFilter = 'Women';
            break;
          case 'Kids':
            categoryFilter = 'Children';
            break;
          case 'Home':
            categoryFilter = 'Home';
            break;
        }
        
        if (categoryFilter) {
          filtered = filtered.filter(service => service.category === categoryFilter);
        }
      }
    }
    
    // Apply target audience filter (selectedServiceFor)
    if (this.selectedServiceFor && this.selectedServiceFor !== '') {
      // Map selectedServiceFor to service categories
      let targetCategory = '';
      switch (this.selectedServiceFor) {
        case 'man':
          targetCategory = 'Men';
          break;
        case 'woman':
          targetCategory = 'Women';
          break;
        case 'children':
          targetCategory = 'Children';
          break;
      }
      
      if (targetCategory) {
        filtered = filtered.filter(service => service.category === targetCategory);
      }
    }
    
    // Apply search term filter
    if (this.serviceSearchTerm && this.serviceSearchTerm.trim() !== '') {
      const searchTerm = this.serviceSearchTerm.toLowerCase().trim();
      filtered = filtered.filter(service => 
        service.name.toLowerCase().includes(searchTerm) ||
        this.translateServiceName(service.name).toLowerCase().includes(searchTerm) ||
        service.description.toLowerCase().includes(searchTerm) ||
        this.translateServiceDescription(service.description).toLowerCase().includes(searchTerm) ||
        service.clothType.toLowerCase().includes(searchTerm)
      );
    }
    
    this.filteredServices = filtered;
  }

  // Debounced version for search input
  debouncedFilterServices() {
    // console.log('debouncedFilterServices called');
    // For now, just call filterServices directly to avoid any timing issues
    this.filterServices();
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
    
    // console.log('Getting price for', service.name, 'service type:', this.selectedServiceType, 'price:', price);
    return price;
  }

  getServicePriceByType(service: any, serviceType: string): number {
    let price = service.price; // Default price
    
    if (serviceType === 'laundry') {
      price = service.laundryPrice || service.price;
    } else if (serviceType === 'dry-clean') {
      price = service.dryCleanPrice || service.price;
    } else if (serviceType === 'ironing') {
      price = service.ironingPrice || service.price;
    }
    
    return price;
  }

  // Update the price for a specific service type and cloth
  updateServicePrice(service: any, newPrice: number) {
    // console.log('Updating price for', service.name, 'to', newPrice, 'for service type:', this.selectedServiceType);
    
    if (this.selectedServiceType === 'laundry') {
      service.laundryPrice = newPrice;
      // console.log('Set laundryPrice to:', service.laundryPrice);
    } else if (this.selectedServiceType === 'dry-clean') {
      service.dryCleanPrice = newPrice;
      // console.log('Set dryCleanPrice to:', service.dryCleanPrice);
    } else if (this.selectedServiceType === 'ironing') {
      service.ironingPrice = newPrice;
      // console.log('Set ironingPrice to:', service.ironingPrice);
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
    // console.log('Price updated for', service.name, ':', service[this.getServicePriceProperty()]);
  }


  getServiceColor(category: string, clothType: string): string {
    // Return white background for all cloth images
    return '#ffffff';
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
    sessionStorage.clear();
    this.router.navigate(['/login']);
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

  async submitOrder() {
    if (this.newOrderForm.valid) {
      try {
        const orderData = this.newOrderForm.value;
        const response = await fetch(`${environment.apiUrl}/laundry-customers`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: orderData.customerName,
            phone: orderData.customerPhone,
            items: orderData.items,
            service_type: orderData.serviceType,
            total_amount: parseFloat(orderData.amount) || 0,
            expected_delivery_date: orderData.pickupDate,
            status: 'received'
          }),
          credentials: 'include'
        });

        if (response.ok) {
          this.toastService.success('Order created successfully!');
      this.closeNewOrderModal();
          this.newOrderForm.reset();
          await this.loadCustomers(); // Reload customers to show the new order
          this.filteredCustomers = [...this.customers];
    } else {
          const error = await response.json();
          this.toastService.error(error.error || 'Failed to create order');
        }
      } catch (error) {
        console.error('Error creating order:', error);
        this.toastService.error('Error creating order');
      }
    } else {
      this.toastService.error('Please fill in all required fields');
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


  editCustomer(customerId: string) {
    const customer = this.customers.find(c => c.id === customerId);
    if (customer) {
      this.editingCustomer = customer;
      this.customerForm.patchValue({
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        address: customer.address,
        status: customer.status || 'received'
      });
      this.showCustomerModal = true;
    }
  }

  async submitCustomer() {
    console.log('=== SUBMIT CUSTOMER DEBUG ===');
    console.log('Form valid:', this.customerForm.valid);
    console.log('Form errors:', this.customerForm.errors);
    console.log('Form value:', this.customerForm.value);
    console.log('Editing customer:', this.editingCustomer);
    console.log('Form status:', this.customerForm.status);
    console.log('Is view mode:', this.isViewMode);
    console.log('Selected items:', this.selectedItems);
    
    // Force form validation
    this.customerForm.markAllAsTouched();
    this.customerForm.updateValueAndValidity();
    
    console.log('After validation - Form valid:', this.customerForm.valid);
    console.log('After validation - Form errors:', this.customerForm.errors);
    
    // Allow updates even if form validation fails, as long as we have the required data
    const customerData = this.customerForm.value;
    const hasRequiredData = customerData.name && customerData.phone;
    
    console.log('Customer data:', customerData);
    console.log('Has required data:', hasRequiredData);
    console.log('Will proceed with update:', this.customerForm.valid || (this.editingCustomer && hasRequiredData));
    
    if (this.customerForm.valid || (this.editingCustomer && hasRequiredData)) {
      try {
        if (this.editingCustomer) {
          // Update existing customer with items
          const itemsDescription = this.selectedItems.map(item => 
            `${item.quantity}x ${item.service.name} (${item.serviceType})`
          ).join(', ');
          
          // Prepare items_json for structured storage
          const itemsJson = this.selectedItems.map(item => ({
            serviceId: item.service.id,
            serviceName: item.service.name,
            quantity: item.quantity,
            serviceType: item.serviceType,
            price: item.price,
            totalPrice: item.quantity * item.price
          }));
          
          console.log('=== UPDATE API CALL ===');
          console.log('Customer ID:', this.editingCustomer.id);
          console.log('API URL:', `${environment.apiUrl}/laundry-customers/${this.editingCustomer.id}`);
          console.log('Request body:', {
            name: customerData.name,
            phone: customerData.phone,
            alt_phone: customerData.altPhone,
            email: customerData.email,
            address: customerData.address,
            status: customerData.status || 'received',
            items: itemsDescription,
            items_json: itemsJson,
            service_type: this.selectedItems.map(item => item.serviceType).join(', '),
            total_amount: this.totalAmount * 1.05
          });
          
          const response = await fetch(`${environment.apiUrl}/laundry-customers/${this.editingCustomer.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              name: customerData.name,
              phone: customerData.phone,
              alt_phone: customerData.altPhone,
              email: customerData.email,
              address: customerData.address,
              status: customerData.status || 'received',
              items: itemsDescription,
              items_json: itemsJson,
              service_type: this.selectedItems.map(item => item.serviceType).join(', '),
              total_amount: this.totalAmount * 1.05 // Include tax
            }),
          credentials: 'include'
        });

        console.log('=== API RESPONSE ===');
        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);
        
        if (response.ok) {
            const responseData = await response.json();
            console.log('Response data:', responseData);
            this.toastService.success('Customer updated successfully!');
            this.closeCustomerDetailsModal();
            await this.loadCustomers();
            this.filteredCustomers = [...this.customers];
        } else {
            const error = await response.json();
            console.log('Error response:', error);
            this.toastService.error(error.error || 'Failed to update customer');
          }
      } else {
          // Add new customer with items
          const itemsDescription = this.selectedItems.map(item => 
            `${item.quantity}x ${item.service.name} (${item.serviceType})`
          ).join(', ');
          
          // Prepare items_json for structured storage
          const itemsJson = this.selectedItems.map(item => ({
            serviceId: item.service.id,
            serviceName: item.service.name,
            quantity: item.quantity,
            serviceType: item.serviceType,
            price: item.price,
            totalPrice: item.quantity * item.price
          }));
          
          const response = await fetch(`${environment.apiUrl}/laundry-customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
            body: JSON.stringify({
              name: customerData.name,
              phone: customerData.phone,
              alt_phone: customerData.altPhone,
              email: customerData.email,
              address: customerData.address,
              status: customerData.status || 'received',
              items: itemsDescription,
              items_json: itemsJson,
              service_type: this.selectedItems.map(item => item.serviceType).join(', '),
              total_amount: this.totalAmount * 1.05 // Include tax
            }),
            credentials: 'include'
      });

      if (response.ok) {
            this.toastService.success('Customer created successfully!');
            this.closeCustomerModal();
            this.customerForm.reset();
            await this.loadCustomers();
            this.filteredCustomers = [...this.customers];
      } else {
            const error = await response.json();
            this.toastService.error(error.error || 'Failed to create customer');
          }
      }
    } catch (error) {
        console.error('Error saving customer:', error);
        this.toastService.error('Error saving customer');
      }
      } else {
      console.log('Form is not valid, showing error');
      this.toastService.error('Please fill in all required fields (Name and Phone are required)');
      }
    }

  viewCustomer(customerId: string) {
    console.log('View customer:', customerId);
    const customer = this.customers.find(c => c.id === customerId);
    if (customer) {
      console.log('Found customer:', customer);
      console.log('Customer items_json:', customer.items_json);
      console.log('Customer items:', customer.items);
      this.selectedCustomerForDetails = customer;
      this.editingCustomer = customer; // Set editing customer for updates
      this.isViewMode = true;
      
      // Populate the form with customer data for viewing
      this.customerForm.patchValue({
        name: customer.name,
        phone: customer.phone,
        email: customer.email || '',
        address: customer.address || '',
        status: customer.status || 'received'
      });
      
      // Mark form as valid since we're populating with existing data
      this.customerForm.markAsTouched();
      this.customerForm.updateValueAndValidity();
      
      // Populate the cart with existing items if any (same as ClothAura board)
      this.populateCartFromCustomerDetails();
      
      // Reset search and filter terms for services
      this.serviceSearchTerm = '';
      this.cartServiceTypeFilter = 'laundry';
      this.selectedServiceFor = ''; // Reset to show all services
      
      this.showCustomerDetailsModal = true;
    } else {
      this.toastService.error('Customer not found');
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
        console.log('Found bill:', bill);
        this.selectedBillForView = bill;
        // Pre-calculate bill items to avoid template method calls
        this.billItemsForView = this.getBillItemsForView(bill);
        this.showViewBillModal = true;
        console.log('Modal should be open now');
      } else {
        console.error('Bill not found with ID:', billId);
        this.toastService.error('Bill not found!');
      }
    } catch (error) {
      console.error('Error viewing bill:', error);
      this.toastService.error('Error loading bill details. Please try again.');
    }
  }

  printBill(billId: string) {
    console.log('Print bill:', billId);
    alert('Bill printed successfully!');
  }

  getCurrentDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  async loadBillingConfig() {
    try {
      const response = await fetch(`${environment.apiUrl}/billing-config`, {
        method: 'GET',
        credentials: 'include'
      });
      
      if (response.ok) {
        this.billingConfig = await response.json();
      } else {
        console.error('Failed to load billing config');
        // Set default values if API fails
        this.billingConfig = {
          company_name: 'ClothAura',
          company_address: '123 Laundry Street, City, 123456',
          company_phone: '+91-9876543210',
          company_email: 'contact@clothaura.com',
          company_website: 'www.clothaura.com',
          tax_id: 'GST123456789',
          tax_rate: 18,
          payment_terms: 'Payment due within 30 days'
        };
      }
    } catch (error) {
      console.error('Error loading billing config:', error);
      // Set default values if API fails
      this.billingConfig = {
        company_name: 'ClothAura',
        company_address: '123 Laundry Street, City, 123456',
        company_phone: '+91-9876543210',
        company_email: 'contact@clothaura.com',
        company_website: 'www.clothaura.com',
        tax_id: 'GST123456789',
        tax_rate: 18,
        payment_terms: 'Payment due within 30 days'
      };
    }
  }

  async markPaid(billId: string) {
    const bill = this.bills.find(b => b.id === billId);
    if (bill && bill.databaseId) {
      try {
        const response = await fetch(`${environment.apiUrl}/billing/${bill.databaseId}/payment`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            payment_amount: bill.amount,
            payment_method: 'cash',
            payment_reference: `PAY-${billId}`,
            notes: 'Marked as paid from frontend',
            created_by: 'user'
          })
        });

        if (response.ok) {
          bill.status = 'Paid';
          bill.paidAmount = bill.amount;
          bill.balanceAmount = 0;
          alert('Bill marked as paid!');
          // Reload bills to get updated data
          await this.loadBills();
        } else {
          throw new Error('Failed to update payment');
        }
      } catch (error) {
        console.error('Error marking bill as paid:', error);
        alert('Error updating payment. Please try again.');
      }
    } else {
      alert('Bill not found or not saved to database!');
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
    this.billItemsForView = []; // Clear cached items
    // Clear cache to free memory
    this.billItemsBreakdownCache.clear();
  }

  getBillItemsForView(bill: any): any[] {
    if (!bill) return [];
    
    try {
      console.log('Processing bill for view:', bill);
      console.log('Bill selectedItems:', bill.selectedItems);
      console.log('Bill items string:', bill.items);
      
      // First, try to use selectedItems if available (most accurate)
      if (bill.selectedItems && Array.isArray(bill.selectedItems) && bill.selectedItems.length > 0) {
        console.log('Using selectedItems:', bill.selectedItems);
        return bill.selectedItems.map((item: any) => {
          // Handle different item name fields
          const itemName = item.name || item.serviceName || item.service_name || item.itemName || 'Service Item';
          const quantity = item.quantity || 1;
          const unitPrice = item.price || item.unitPrice || item.unit_price || 0;
          const totalPrice = item.totalPrice || item.total_price || (quantity * unitPrice);
          const serviceType = item.serviceType || item.service_type || 'laundry';
          
          console.log('Mapped item:', { itemName, quantity, unitPrice, totalPrice, serviceType });
          
          return {
            name: itemName,
            quantity: quantity,
            unitPrice: unitPrice,
            totalPrice: totalPrice,
            serviceType: serviceType
          };
        });
      }
      
      // Fallback to getBillItemsBreakdown for parsing string items
      console.log('Falling back to string parsing');
      return this.getBillItemsBreakdown(bill);
    } catch (error) {
      console.error('Error in getBillItemsForView:', error);
      return [];
    }
  }

  getBillItemsBreakdown(bill: any): any[] {
    if (!bill || !bill.items) return [];
    
    try {
      // Check cache first
      const cacheKey = `${bill.id}_${bill.items}`;
      if (this.billItemsBreakdownCache.has(cacheKey)) {
        return this.billItemsBreakdownCache.get(cacheKey)!;
      }
      
      // Try to parse structured items data
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
      
      if (itemMatches && itemMatches.length > 0) {
        itemMatches.forEach((match: string) => {
          const parts = match.match(/(\d+)x\s+([^(]+)\s*\(([^)]+)\)/);
          if (parts && parts.length >= 4) {
            const quantity = parseInt(parts[1]) || 1;
            const name = parts[2].trim() || 'Unknown Item';
            const serviceType = parts[3].trim() || 'laundry';
            
            // Get price from services array (limit search to prevent performance issues)
            let service = null;
            if (this.services && this.services.length > 0) {
              service = this.services.find(s => 
                s.name && name && (
                  s.name.toLowerCase().includes(name.toLowerCase()) || 
                  name.toLowerCase().includes(s.name.toLowerCase())
                )
              );
            }
            
            // Get price based on service type
            let unitPrice = 25; // Default price
            if (service) {
              if (serviceType.toLowerCase().includes('laundry')) {
                unitPrice = service.laundryPrice || service.price || 25;
              } else if (serviceType.toLowerCase().includes('dry clean') || serviceType.toLowerCase().includes('dry-clean')) {
                unitPrice = service.dryCleanPrice || service.price || 25;
              } else if (serviceType.toLowerCase().includes('ironing') || serviceType.toLowerCase().includes('iron')) {
                unitPrice = service.ironingPrice || service.price || 25;
              } else {
                unitPrice = service.price || 25;
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
    } catch (error) {
      console.error('Error in getBillItemsBreakdown:', error);
      return [];
    }
  }

  addItemToBill(service: any) {
    // console.log('Adding item to bill:', service.name, 'Current service type:', this.selectedServiceType);
    
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
        
        // Auto-populate items from customer
        this.populateBillItemsFromCustomer(selectedCustomer);
      }
    } else {
      // Clear phone number and items if no customer selected
      this.billForm.patchValue({
        customerPhone: ''
      });
      this.selectedBillItems = [];
      this.calculateBillTotal();
    }
  }

  populateBillItemsFromCustomer(customer: any) {
    // Clear existing items
    this.selectedBillItems = [];
    
    // Try to get items from items_json first (structured data)
    if (customer.items_json && Array.isArray(customer.items_json)) {
      customer.items_json.forEach((item: any) => {
        this.selectedBillItems.push({
          name: item.name || item.service?.name,
          quantity: item.quantity || 1,
          price: item.price || item.service?.price || 25,
          totalPrice: (item.quantity || 1) * (item.price || item.service?.price || 25),
          serviceType: item.serviceType || item.service_type || 'laundry',
          service: item.service || { name: item.name, price: item.price || 25 }
        });
      });
    } else if (customer.items && typeof customer.items === 'string') {
      // Parse items string format: "2x Men Shirt (Laundry), 1x Men Coat (Dry Clean)"
      const itemsString = customer.items;
      const itemMatches = itemsString.match(/(\d+)x\s+([^(]+)\s*\(([^)]+)\)/g);
      
      if (itemMatches) {
        itemMatches.forEach((match: string) => {
          const parts = match.match(/(\d+)x\s+([^(]+)\s*\(([^)]+)\)/);
          if (parts) {
            const quantity = parseInt(parts[1]);
            const name = parts[2].trim();
            const serviceType = parts[3].trim();
            
            // Find matching service to get price
            const service = this.services.find(s => 
              s.name.toLowerCase().includes(name.toLowerCase()) || 
              name.toLowerCase().includes(s.name.toLowerCase())
            );
            
            // Get price based on service type
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
            
            this.selectedBillItems.push({
              name,
              quantity,
              price: unitPrice,
              totalPrice,
              serviceType,
              service: service || { name, price: unitPrice }
            });
          }
        });
      }
    }
    
    // Calculate total after populating items
    this.calculateBillTotal();
    
    console.log('Auto-populated bill items for customer:', customer.name, this.selectedBillItems);
  }

  async submitBill() {
    // console.log('=== BILL SUBMISSION DEBUG ===');
    // console.log('Form valid:', this.billForm.valid);
    // console.log('Form errors:', this.billForm.errors);
    // console.log('Form value:', this.billForm.value);
    // console.log('Selected items count:', this.selectedBillItems.length);
    // console.log('Selected items:', this.selectedBillItems);
    // console.log('Bill total amount:', this.billTotalAmount);
    
    // Check individual form controls
    // console.log('Customer name valid:', this.billForm.get('customerName')?.valid);
    // console.log('Customer phone valid:', this.billForm.get('customerPhone')?.valid);
    // console.log('Service type valid:', this.billForm.get('serviceType')?.valid);
    // console.log('Amount valid:', this.billForm.get('amount')?.valid);
    // console.log('Due date valid:', this.billForm.get('dueDate')?.valid);
    
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
        databaseId: null,
        customer: formValue.customerName,
        amount: this.billTotalAmount,
        status: 'Pending',
        dueDate: formValue.dueDate,
        phone: formValue.customerPhone,
        items: itemsDescription,
        serviceType: Array.isArray(formValue.serviceType) ? formValue.serviceType.join(', ') : formValue.serviceType,
        notes: formValue.notes,
        createdDate: new Date().toISOString().split('T')[0],
        selectedItems: this.selectedBillItems.slice(),
        paidAmount: 0,
        balanceAmount: this.billTotalAmount
      };
      
      // Save bill to database first
      try {
        const billData = {
          customer_name: formValue.customerName,
          customer_phone: formValue.customerPhone,
          bill_date: new Date().toISOString().split('T')[0],
          due_date: formValue.dueDate,
          bill_type: 'laundry',
          items: this.selectedBillItems,
          subtotal: this.billTotalAmount,
          total_amount: this.billTotalAmount,
          paid_amount: 0,
          notes: formValue.notes,
          created_by: 'user'
        };

        console.log('Saving bill to database:', billData);
        
        const response = await fetch(`${environment.apiUrl}/billing/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(billData)
        });

        console.log('Billing API Response Status:', response.status);
        console.log('Billing API Response OK:', response.ok);
        
        if (response.ok) {
          const savedBill = await response.json();
          console.log('Bill saved to database:', savedBill);
          
          // Update the bill with database ID
          newBill.id = savedBill.bill_no;
          newBill.databaseId = savedBill.id;
          
          // Add to bills array
          this.bills.unshift(newBill as any);
          
          console.log('New bill created:', newBill);
          console.log('Total bills now:', this.bills.length);
          
          // Show success message
          alert('Bill generated successfully! Bill ID: ' + savedBill.bill_no);
          
          // Close modal after a small delay to ensure UI updates
          setTimeout(() => {
            this.closeBillModal();
            // Force change detection to update the bills table
            this.bills = [...this.bills];
          }, 100);
        } else {
          const errorText = await response.text();
          console.error('Billing API Error Response:', errorText);
          throw new Error(`Failed to save bill to database: ${response.status} - ${errorText}`);
        }
      } catch (error) {
        console.error('Error saving bill to database:', error);
        alert('Error saving bill to database. Please try again.');
      }
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

  // Load customers from API
  async loadCustomers() {
    try {
      console.log('Loading customers from:', `${environment.apiUrl}/laundry-customers`);
      const response = await fetch(`${environment.apiUrl}/laundry-customers`, {
        credentials: 'include'
      });
      console.log('Response status:', response.status);
      if (response.ok) {
        const customers = await response.json();
        // Replace hardcoded customers with API data
        this.customers = customers.map((c: any) => ({
          id: c.id,
          name: c.name,
          phone: c.phone,
          altPhone: c.alt_phone || '',
          email: c.email || '',
          address: c.address || '',
          status: c.status || 'received',
          orderDate: c.order_date,
          expectedDeliveryDate: c.expected_delivery_date,
          deliveryDate: c.delivery_date,
          items: c.items || '',
          items_json: c.items_json || null,
          serviceType: c.service_type || '',
          totalAmount: c.total_amount || 0,
          paidAmount: c.paid_amount || 0,
          balanceAmount: c.balance_amount || 0,
          specialInstructions: c.special_instructions || '',
          createdDate: c.created_at ? new Date(c.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          selectedItems: [],
          totalOrders: 1 // Add totalOrders for compatibility
        }));
        // Update filtered customers to show API data
        this.filteredCustomers = [...this.customers];
        console.log('Loaded customers from API:', this.customers.length);
        if (this.customers.length > 0) {
          console.log('Sample customer:', this.customers[0]);
          console.log('Sample customer items_json:', this.customers[0].items_json);
        }
      } else {
        console.error('Failed to load customers:', response.statusText);
        this.toastService.error('Failed to load customers');
      }
    } catch (error) {
      console.error('Error loading customers:', error);
      this.toastService.error('Error loading customers');
    }
  }

  // Load bills from API
  async loadBills() {
    try {
      console.log('Loading bills from:', `${environment.apiUrl}/billing`);
      const response = await fetch(`${environment.apiUrl}/billing`, {
        credentials: 'include'
      });
      console.log('Bills response status:', response.status);
      if (response.ok) {
        const bills = await response.json();
        // Transform API data to match frontend format
        this.bills = bills.map((b: any) => {
          // Parse items properly
          let selectedItems = [];
          let itemsString = '';
          
          if (b.items) {
            if (typeof b.items === 'string') {
              itemsString = b.items;
              // Try to parse as JSON if it looks like JSON
              try {
                if (b.items.includes('{') || b.items.includes('[')) {
                  selectedItems = JSON.parse(b.items);
                }
              } catch (e) {
                // If parsing fails, treat as string
                selectedItems = [];
              }
            } else if (Array.isArray(b.items)) {
              selectedItems = b.items;
              itemsString = JSON.stringify(b.items);
            } else if (typeof b.items === 'object') {
              selectedItems = [b.items];
              itemsString = JSON.stringify(b.items);
            }
          }
          
          return {
            id: b.bill_no,
            databaseId: b.id,
            customer: b.customer_name,
            phone: b.customer_phone,
            amount: b.total_amount,
            status: b.payment_status === 'paid' ? 'Paid' : 
                    b.payment_status === 'partial' ? 'Partial' : 'Pending',
            dueDate: b.due_date || b.bill_date,
            items: itemsString,
            serviceType: b.bill_type,
            notes: b.notes,
            createdDate: b.bill_date,
            paidAmount: b.paid_amount,
            balanceAmount: b.balance_amount,
            selectedItems: selectedItems
          };
        });
        console.log('Loaded bills from API:', this.bills.length);
        if (this.bills.length > 0) {
          console.log('Sample bill:', this.bills[0]);
        }
        
        // Force change detection to update the billing grid
        console.log('Billing grid should now show', this.bills.length, 'bills');
        console.log('Bills array:', this.bills);
        
        // Force Angular change detection
        setTimeout(() => {
          console.log('After timeout - Bills array length:', this.bills.length);
        }, 100);
      } else {
        console.error('Failed to load bills:', response.statusText);
        this.toastService.error('Failed to load bills');
      }
    } catch (error) {
      console.error('Error loading bills:', error);
      this.toastService.error('Error loading bills');
    }
  }

  // Load services from API
  private servicesLoaded = false;
  
  async loadServices() {
    // Prevent multiple API calls
    if (this.servicesLoaded) {
      return;
    }
    
    try {
      const response = await fetch(`${environment.apiUrl}/laundry-services`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const apiServices = await response.json();
        
        // Replace hardcoded services with API services
        this.services = apiServices.map((apiService: any) => ({
          id: apiService.service_id,
          name: apiService.name,
          description: apiService.description || '',
          price: parseFloat(apiService.price) || 0,
          laundryPrice: parseFloat(apiService.laundry_price) || 0,
          dryCleanPrice: parseFloat(apiService.dry_clean_price) || 0,
          ironingPrice: parseFloat(apiService.ironing_price) || 0,
          category: apiService.category || 'General',
          icon: apiService.icon || 'fas fa-tshirt',
          clothType: apiService.cloth_type || 'General',
          pickup: apiService.pickup !== false,
          photo: apiService.photo || 'https://via.placeholder.com/80x80/4CAF50/ffffff?text=SERVICE'
        }));
        
        this.servicesLoaded = true;
        console.log('Loaded services from API:', this.services.length);
      } else {
        console.error('Failed to load services from API, using hardcoded services');
        this.servicesLoaded = true;
      }
    } catch (error) {
      console.error('Error loading services from API, using hardcoded services:', error);
      this.servicesLoaded = true;
    }
  }

  // Get appropriate icon for service category
  getServiceIcon(category: string): string {
    switch (category.toLowerCase()) {
      case 'basic': return 'fas fa-tshirt';
      case 'premium': return 'fas fa-crown';
      case 'express': return 'fas fa-clock';
      case 'special': return 'fas fa-star';
      default: return 'fas fa-cog';
    }
  }

  // Get appropriate image for service (cached version)
  private imageCache = new Map<string, string>();
  
  getServiceImage(serviceName: string, category: string): string {
    const cacheKey = `${serviceName}-${category}`;
    
    if (this.imageCache.has(cacheKey)) {
      return this.imageCache.get(cacheKey)!;
    }
    
    const name = serviceName.toLowerCase();
    const cat = category.toLowerCase();
    
    let url: string;
    
    // Return appropriate placeholder images based on service type
    if (name.includes('wash') || name.includes('laundry')) {
      url = 'https://via.placeholder.com/80x80/4CAF50/ffffff?text=WASH';
    } else if (name.includes('dry') || name.includes('clean')) {
      url = 'https://via.placeholder.com/80x80/2196F3/ffffff?text=DRY';
    } else if (name.includes('iron')) {
      url = 'https://via.placeholder.com/80x80/FF9800/ffffff?text=IRON';
    } else if (name.includes('express') || name.includes('quick')) {
      url = 'https://via.placeholder.com/80x80/E91E63/ffffff?text=EXPRESS';
    } else if (name.includes('stain') || name.includes('bleach')) {
      url = 'https://via.placeholder.com/80x80/9C27B0/ffffff?text=STAIN';
    } else if (name.includes('suit') || name.includes('formal')) {
      url = 'https://via.placeholder.com/80x80/607D8B/ffffff?text=SUIT';
    } else if (name.includes('curtain') || name.includes('carpet')) {
      url = 'https://via.placeholder.com/80x80/795548/ffffff?text=HOME';
        } else {
      // Default based on category
      switch (cat) {
        case 'basic': 
          url = 'https://via.placeholder.com/80x80/4CAF50/ffffff?text=BASIC';
          break;
        case 'premium': 
          url = 'https://via.placeholder.com/80x80/2196F3/ffffff?text=PREMIUM';
          break;
        case 'express': 
          url = 'https://via.placeholder.com/80x80/E91E63/ffffff?text=EXPRESS';
          break;
        case 'special': 
          url = 'https://via.placeholder.com/80x80/9C27B0/ffffff?text=SPECIAL';
          break;
        default: 
          url = 'https://via.placeholder.com/80x80/6c757d/ffffff?text=SERVICE';
          break;
      }
    }
    
    // Cache the result
    this.imageCache.set(cacheKey, url);
    return url;
  }

  // Board-related methods
  getOrdersByStatus(status: string): any[] {
    // First apply search and filter to customers, then filter by status
    const filteredCustomers = this.getFilteredCustomers();
    return filteredCustomers.filter(customer => customer.status === status);
  }

  getFilteredCustomers(): any[] {
    return this.customers.filter(customer => {
      // Apply search term filter
      const matchesSearch = !this.searchTerm || 
        customer.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        customer.phone.includes(this.searchTerm) ||
        (customer.email && customer.email.toLowerCase().includes(this.searchTerm.toLowerCase()));
      
      // Apply status filter
      const matchesStatus = !this.filterStatus || customer.status === this.filterStatus;
      
      return matchesSearch && matchesStatus;
    });
  }

  filterOrders() {
    // This method is called when search or filter changes
    // The filtering logic is handled in getOrdersByStatus and getFilteredCustomers
    // Force change detection to update the kanban board
    // No additional logic needed as the template will automatically call getOrdersByStatus
  }

  isDelayed(order: any): boolean {
    if (order.status === 'inProcess' && order.createdDate) {
      const orderDateTime = new Date(order.createdDate).getTime();
      const now = new Date().getTime();
      const twentyFourHours = 24 * 60 * 60 * 1000;
      return (now - orderDateTime) > twentyFourHours;
    }
    return false;
  }

  viewOrderDetails(order: any) {
    // Don't open modal if we're in the middle of dragging
    if (this.isDragging) {
      return;
    }
    this.selectedCustomerForDetails = order;
    this.editingCustomer = order; // Set editing customer for updates
    
    // Populate the form with customer data
    this.customerForm.patchValue({
      name: order.name,
      phone: order.phone,
      email: order.email || '',
      address: order.address || '',
      status: order.status || 'received'
    });
    
    // Mark form as valid since we're populating with existing data
    this.customerForm.markAsTouched();
    this.customerForm.updateValueAndValidity();
    
    // Populate the cart with existing items if any
    this.populateCartFromCustomerDetails();
    
    // Reset search and filter terms for services
    this.serviceSearchTerm = '';
    this.cartServiceTypeFilter = 'laundry';
    this.selectedServiceFor = ''; // Reset to show all services
    
    this.showCustomerDetailsModal = true;
  }

  editOrder(order: any) {
    console.log('Edit order:', order);
    // You can implement order editing functionality
  }


  // Cart functionality methods
  addServiceToCart(service: any) {
    const existingItem = this.selectedItems.find(item => item.service.id === service.id);
    
    if (existingItem) {
      existingItem.quantity += 1;
      this.updateItemPrice(existingItem);
    } else {
      const newItem = {
        service: service,
        serviceType: 'laundry',
        quantity: 1,
        totalPrice: service.laundryPrice
      };
      this.selectedItems.push(newItem);
    }
    
    this.calculateTotal();
  }

  removeFromCart(index: number) {
    this.selectedItems.splice(index, 1);
    this.calculateTotal();
  }

  increaseCartQuantity(item: any) {
    item.quantity += 1;
    this.updateItemPrice(item);
    this.calculateTotal();
  }

  decreaseCartQuantity(item: any) {
    if (item.quantity > 1) {
      item.quantity -= 1;
      this.updateItemPrice(item);
      this.calculateTotal();
    }
  }

  updateItemPrice(item: any) {
    let price = 0;
    switch (item.serviceType) {
      case 'laundry':
        price = item.service.laundryPrice;
        break;
      case 'dryClean':
        price = item.service.dryCleanPrice;
        break;
      case 'ironing':
        price = item.service.ironingPrice;
        break;
    }
    item.totalPrice = price * item.quantity;
    this.calculateTotal();
  }

  calculateTotal() {
    this.totalAmount = this.selectedItems.reduce((total, item) => total + item.totalPrice, 0);
  }

  clearCart() {
    this.selectedItems = [];
    this.totalAmount = 0;
  }

  openCustomerModal() {
    this.editingCustomer = null;
    this.customerForm.reset();
    this.customerForm.patchValue({ status: 'received' });
    this.clearCart();
    // Reset search and filter terms for services
    this.serviceSearchTerm = '';
    this.cartServiceTypeFilter = 'laundry';
    this.selectedServiceFor = ''; // Reset to show all services
    this.showCustomerModal = true;
  }

  closeCustomerModal() {
    this.showCustomerModal = false;
    this.editingCustomer = null;
    this.clearCart();
    this.customerForm.reset();
    // Reset search and filter terms
    this.serviceSearchTerm = '';
    this.cartServiceTypeFilter = 'laundry';
    this.selectedServiceFor = 'man'; // Reset to default
  }

  // Drag and Drop methods
  onDragStart(event: DragEvent, order: any) {
    this.draggedOrder = order;
    this.isDragging = true;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/html', '');
    }
  }

  onDragOver(event: DragEvent, columnId: string) {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
    this.draggedOverColumn = columnId;
  }

  onDragEnter(event: DragEvent, columnId: string) {
    event.preventDefault();
    this.draggedOverColumn = columnId;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.draggedOverColumn = '';
  }

  onDragEnd(event: DragEvent) {
    // Reset dragging state when drag ends (whether successful or cancelled)
    setTimeout(() => {
      this.isDragging = false;
    }, 100);
  }

  async onDrop(event: DragEvent, targetColumnId: string) {
    event.preventDefault();
    this.isDragging = false; // Reset dragging state immediately
    
    if (!this.draggedOrder || this.draggedOrder.status === targetColumnId) {
      this.draggedOrder = null;
      this.draggedOverColumn = '';
      return;
    }

    const originalStatus = this.draggedOrder.status;
    this.draggedOrder.status = targetColumnId;

    try {
          const response = await fetch(`${environment.apiUrl}/laundry-customers/${this.draggedOrder.id}/status`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
              status: targetColumnId,
              oldStatus: originalStatus
            }),
            credentials: 'include'
          });

        if (response.ok) {
          this.toastService.success(`Order moved to ${this.getStatusDisplayName(targetColumnId)} successfully!`);
          // Update the local customers array
          const customerIndex = this.customers.findIndex(c => c.id === this.draggedOrder.id);
          if (customerIndex !== -1) {
            this.customers[customerIndex].status = targetColumnId;
            this.filteredCustomers = [...this.customers];
          }
          
          // Update selected customer details if currently being viewed
          if (this.selectedCustomerForDetails && this.selectedCustomerForDetails.id === this.draggedOrder.id) {
            this.selectedCustomerForDetails.status = targetColumnId;
          }
          
          // Update editing customer if currently being edited
          if (this.editingCustomer && this.editingCustomer.id === this.draggedOrder.id) {
            this.editingCustomer.status = targetColumnId;
            this.customerForm.patchValue({ status: targetColumnId });
          }
          
          // If status changed to 'billed', refresh bills
          if (targetColumnId === 'billed') {
            console.log('Status changed to billed - waiting 1 second before loading bills...');
            setTimeout(async () => {
              await this.loadBills();
              this.toastService.success('Bill has been automatically generated!');
            }, 1000);
          }
        } else {
        // Revert the change on failure
        this.draggedOrder.status = originalStatus;
        const error = await response.json();
        this.toastService.error(error.error || 'Failed to update order status');
      }
    } catch (error) {
      // Revert the change on error
      this.draggedOrder.status = originalStatus;
      console.error('Error updating order status:', error);
      this.toastService.error('Error updating order status');
    }

    this.draggedOrder = null;
    this.draggedOverColumn = '';
    this.isDragging = false;
  }

  getStatusDisplayName(statusId: string): string {
    const status = this.statuses.find(s => s.id === statusId);
    return status ? status.name : statusId;
  }

  getStatusColor(statusId: string): string {
    const status = this.statuses.find(s => s.id === statusId);
    return status ? status.color : '#6c757d';
  }

  // Customer Details Modal methods
  closeCustomerDetailsModal() {
    this.showCustomerDetailsModal = false;
    this.selectedCustomerForDetails = null;
    this.editingCustomer = null;
    this.isViewMode = false;
    this.clearCart();
    // Reset search and filter terms
    this.serviceSearchTerm = '';
    this.cartServiceTypeFilter = 'laundry';
    this.selectedServiceFor = 'man'; // Reset to default
  }

  editCustomerFromDetails() {
    // Keep the modal open and populate the form
    this.editingCustomer = this.selectedCustomerForDetails;
    this.isViewMode = false; // Enable editing
    this.customerForm.patchValue({
      name: this.selectedCustomerForDetails.name,
      phone: this.selectedCustomerForDetails.phone,
      email: this.selectedCustomerForDetails.email,
      address: this.selectedCustomerForDetails.address,
      status: this.selectedCustomerForDetails.status || 'received'
    });
    
    // Mark form as valid since we're populating with existing data
    this.customerForm.markAsTouched();
    this.customerForm.updateValueAndValidity();
    
    // Populate the cart with existing items if any
    this.populateCartFromCustomerDetails();
  }

  handleCustomerAction() {
    if (this.isViewMode) {
      // Switch to edit mode
      this.editCustomerFromDetails();
    } else if (this.editingCustomer) {
      // Update existing customer using simplified method (same as Laundry board)
      this.updateCustomerDetails();
    } else {
      // Create new customer using simplified method (same as Laundry board)
      this.createCustomerDetails();
    }
  }

  // New simplified update method using the same API as Laundry board
  async updateCustomerDetails() {
    console.log('=== UPDATE CUSTOMER DETAILS (Simplified) ===');
    console.log('Customer ID:', this.editingCustomer.id);
    console.log('Form data:', this.customerForm.value);
    console.log('Selected items:', this.selectedItems);

    if (!this.editingCustomer || !this.editingCustomer.id) {
      this.toastService.error('No customer selected for update');
      return;
    }

    try {
      const customerData = this.customerForm.value;
      
      // Prepare items data
      const itemsDescription = this.selectedItems.map(item => 
        `${item.quantity}x ${item.service.name} (${item.serviceType})`
      ).join(', ');
      
      const itemsJson = this.selectedItems.map(item => ({
        serviceId: item.service.id,
        serviceName: item.service.name,
        quantity: item.quantity,
        serviceType: item.serviceType,
        price: item.price,
        totalPrice: item.quantity * item.price
      }));

      console.log('=== SIMPLIFIED UPDATE API CALL ===');
      console.log('API URL:', `${environment.apiUrl}/laundry-customers/${this.editingCustomer.id}`);
      console.log('Request body:', {
        name: customerData.name,
        phone: customerData.phone,
        alt_phone: customerData.altPhone || '',
        email: customerData.email || '',
        address: customerData.address || '',
        status: customerData.status || 'received',
        items: itemsDescription,
        items_json: itemsJson,
        service_type: this.selectedItems.map(item => item.serviceType).join(', '),
        total_amount: this.totalAmount * 1.05
      });

      const response = await fetch(`${environment.apiUrl}/laundry-customers/${this.editingCustomer.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: customerData.name,
          phone: customerData.phone,
          alt_phone: customerData.altPhone || '',
          email: customerData.email || '',
          address: customerData.address || '',
          status: customerData.status || 'received',
          items: itemsDescription,
          items_json: itemsJson,
          service_type: this.selectedItems.map(item => item.serviceType).join(', '),
          total_amount: this.totalAmount * 1.05
        }),
        credentials: 'include'
      });

      console.log('=== SIMPLIFIED API RESPONSE ===');
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (response.ok) {
        const responseData = await response.json();
        console.log('Response data:', responseData);
        this.toastService.success('Customer updated successfully!');
        
        // Check if status was changed to 'billed' and refresh bills
        if (customerData.status === 'billed') {
          console.log('Customer updated to billed status - waiting 1 second before loading bills...');
          setTimeout(async () => {
            await this.loadBills();
            this.toastService.success('Bill has been automatically generated!');
          }, 1000);
        }
        
        this.closeCustomerDetailsModal();
        await this.loadCustomers();
        this.filteredCustomers = [...this.customers];
      } else {
        const error = await response.json();
        console.log('Error response:', error);
        this.toastService.error(error.error || 'Failed to update customer');
      }
    } catch (error) {
      console.error('Error updating customer:', error);
      this.toastService.error('Error updating customer');
    }
  }

  // New simplified create method using the same API as Laundry board
  async createCustomerDetails() {
    console.log('=== CREATE CUSTOMER DETAILS (Simplified) ===');
    console.log('Form data:', this.customerForm.value);
    console.log('Selected items:', this.selectedItems);

    try {
      const customerData = this.customerForm.value;
      
      // Prepare items data
      const itemsDescription = this.selectedItems.map(item => 
        `${item.quantity}x ${item.service.name} (${item.serviceType})`
      ).join(', ');
      
      const itemsJson = this.selectedItems.map(item => ({
        serviceId: item.service.id,
        serviceName: item.service.name,
        quantity: item.quantity,
        serviceType: item.serviceType,
        price: item.price,
        totalPrice: item.quantity * item.price
      }));

      console.log('=== SIMPLIFIED CREATE API CALL ===');
      console.log('API URL:', `${environment.apiUrl}/laundry-customers`);
      console.log('Request body:', {
        name: customerData.name,
        phone: customerData.phone,
        alt_phone: customerData.altPhone || '',
        email: customerData.email || '',
        address: customerData.address || '',
        status: customerData.status || 'received',
        items: itemsDescription,
        items_json: itemsJson,
        service_type: this.selectedItems.map(item => item.serviceType).join(', '),
        total_amount: this.totalAmount * 1.05
      });

      const response = await fetch(`${environment.apiUrl}/laundry-customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: customerData.name,
          phone: customerData.phone,
          alt_phone: customerData.altPhone || '',
          email: customerData.email || '',
          address: customerData.address || '',
          status: customerData.status || 'received',
          items: itemsDescription,
          items_json: itemsJson,
          service_type: this.selectedItems.map(item => item.serviceType).join(', '),
          total_amount: this.totalAmount * 1.05
        }),
        credentials: 'include'
      });

      console.log('=== SIMPLIFIED CREATE API RESPONSE ===');
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (response.ok) {
        const responseData = await response.json();
        console.log('Response data:', responseData);
        this.toastService.success('Customer created successfully!');
        
        // Check if status is 'billed' and refresh bills
        if (customerData.status === 'billed') {
          console.log('Customer created with billed status - waiting 1 second before loading bills...');
          setTimeout(async () => {
            await this.loadBills();
            this.toastService.success('Bill has been automatically generated!');
          }, 1000);
        }
        
        this.closeCustomerModal();
        this.customerForm.reset();
        await this.loadCustomers();
        this.filteredCustomers = [...this.customers];
      } else {
        const error = await response.json();
        console.log('Error response:', error);
        this.toastService.error(error.error || 'Failed to create customer');
      }
    } catch (error) {
      console.error('Error creating customer:', error);
      this.toastService.error('Error creating customer');
    }
  }

  // Handle status change from dropdown
  async onStatusChange(event: any) {
    const newStatus = event.target.value;
    console.log('Status changed to:', newStatus);
    
    // If status changed to 'billed', show a confirmation and trigger auto-bill generation
    if (newStatus === 'billed') {
      const confirmed = confirm('Changing status to "Billed" will automatically generate a bill. Continue?');
      if (confirmed) {
        // The status change will be handled by the form submission
        // The backend will auto-generate the bill when the status is updated
        console.log('Status change to billed confirmed - bill will be auto-generated');
      } else {
        // Revert the dropdown selection
        event.target.value = this.customerForm.get('status')?.value || 'received';
        return;
      }
    }
  }

  // Manual method to refresh billing grid (for testing)
  async refreshBillingGrid() {
    console.log('=== MANUAL BILLING GRID REFRESH ===');
    await this.loadBills();
    console.log('Billing grid refreshed manually');
  }

  // Method to check billing grid state (for testing)
  checkBillingGridState() {
    console.log('=== BILLING GRID STATE CHECK ===');
    console.log('Bills array length:', this.bills.length);
    console.log('Bills array:', this.bills);
    console.log('Active tab:', this.activeTab);
    console.log('Show bill modal:', this.showBillModal);
  }

  populateCartFromCustomerDetails() {
    // Clear existing cart
    this.clearCart();
    
    console.log('Populating cart from customer details:', this.selectedCustomerForDetails);
    console.log('Items JSON:', this.selectedCustomerForDetails.items_json);
    
    // First try to load from items_json (structured data)
    if (this.selectedCustomerForDetails.items_json) {
      let itemsJsonData = null;
      
      // Parse JSON string if it's a string
      if (typeof this.selectedCustomerForDetails.items_json === 'string') {
        try {
          itemsJsonData = JSON.parse(this.selectedCustomerForDetails.items_json);
          console.log('Parsed items_json:', itemsJsonData);
        } catch (error) {
          console.error('Error parsing items_json:', error);
          itemsJsonData = null;
        }
      } else if (Array.isArray(this.selectedCustomerForDetails.items_json)) {
        itemsJsonData = this.selectedCustomerForDetails.items_json;
      }
      
      // Process the parsed data
      if (itemsJsonData && Array.isArray(itemsJsonData) && itemsJsonData.length > 0) {
        itemsJsonData.forEach((itemData: any) => {
          console.log('Processing item:', itemData);
          // Find the service in our services array
          const service = this.services.find(s => s.id === itemData.serviceId);
          if (service) {
            // Create item with correct quantity directly
            const itemPrice = itemData.price || this.getServicePriceByType(service, itemData.serviceType || 'laundry');
            const newItem = {
              service: service,
              serviceType: itemData.serviceType || 'laundry',
              quantity: itemData.quantity,
              price: itemPrice,
              totalPrice: itemPrice * itemData.quantity
            };
            this.selectedItems.push(newItem);
            console.log('Added item to cart:', newItem);
          } else {
            console.warn('Service not found for item:', itemData);
          }
        });
        this.calculateTotal();
        console.log('Cart populated with', this.selectedItems.length, 'items');
        return;
      }
    }
    
    // Fallback: If customer has items as text, try to parse them and add to cart
    if (this.selectedCustomerForDetails.items) {
      const items = this.selectedCustomerForDetails.items.split(',');
      items.forEach((item: string) => {
        // Parse item format: "2x Men Formal Shirt (laundry)"
        const match = item.trim().match(/(\d+)x\s*(.+?)\s*\((.+?)\)/);
        if (match) {
          const quantity = parseInt(match[1]);
          const serviceName = match[2].trim();
          const serviceType = match[3].trim();
          
          // Find the service in our services array
          const service = this.services.find(s => s.name === serviceName);
          if (service) {
            for (let i = 0; i < quantity; i++) {
              this.addServiceToCart(service);
            }
            // Set the service type for all items of this service
            this.selectedItems.forEach((item: any) => {
              if (item.service.name === serviceName) {
                item.serviceType = serviceType;
                this.updateItemPrice(item);
              }
            });
          }
        }
      });
    }
  }

  async updateOrderStatus() {
    const currentStatus = this.selectedCustomerForDetails.status;
    const availableStatuses = this.statuses.filter(s => s.id !== currentStatus);
    
    const statusNames = availableStatuses.map(s => s.name).join(', ');
    const newStatus = prompt(`Current status: ${this.getStatusDisplayName(currentStatus)}\n\nAvailable statuses: ${statusNames}\n\nEnter new status (received, inProcess, readyForDelivery, delivered, cancelled, billed):`);
    
    if (newStatus && newStatus !== currentStatus) {
      const statusObj = this.statuses.find(s => s.id === newStatus || s.name.toLowerCase().includes(newStatus.toLowerCase()));
      if (statusObj) {
        try {
          const response = await fetch(`${environment.apiUrl}/laundry-customers/${this.selectedCustomerForDetails.id}/status`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: statusObj.id }),
            credentials: 'include'
          });

          if (response.ok) {
            this.toastService.success(`Order status updated to ${statusObj.name} successfully!`);
            this.selectedCustomerForDetails.status = statusObj.id;
            await this.loadCustomers();
            this.filteredCustomers = [...this.customers];
            
            // If status changed to 'billed', refresh bills
            if (statusObj.id === 'billed') {
              console.log('Status updated to billed via prompt - waiting 1 second before loading bills...');
              setTimeout(async () => {
                await this.loadBills();
                this.toastService.success('Bill has been automatically generated!');
              }, 1000);
            }
    } else {
            const error = await response.json();
            this.toastService.error(error.error || 'Failed to update order status');
          }
        } catch (error) {
          console.error('Error updating order status:', error);
          this.toastService.error('Error updating order status');
        }
      } else {
        this.toastService.error('Invalid status. Please use one of the available statuses.');
      }
    }
  }

  async markAsDelivered() {
    if (confirm(`Mark order for ${this.selectedCustomerForDetails.name} as delivered?`)) {
      try {
        const response = await fetch(`${environment.apiUrl}/laundry-customers/${this.selectedCustomerForDetails.id}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            status: 'delivered',
            delivery_date: new Date().toISOString()
          }),
          credentials: 'include'
        });

        if (response.ok) {
          this.toastService.success('Order marked as delivered successfully!');
          this.selectedCustomerForDetails.status = 'delivered';
          this.selectedCustomerForDetails.deliveryDate = new Date().toISOString();
          await this.loadCustomers();
          this.filteredCustomers = [...this.customers];
        } else {
          const error = await response.json();
          this.toastService.error(error.error || 'Failed to mark order as delivered');
        }
      } catch (error) {
        console.error('Error marking order as delivered:', error);
        this.toastService.error('Error marking order as delivered');
      }
    }
  }

  async moveToBilled() {
    if (confirm(`Move order for ${this.selectedCustomerForDetails.name} to billed status?`)) {
      try {
        const response = await fetch(`${environment.apiUrl}/laundry-customers/${this.selectedCustomerForDetails.id}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ status: 'billed' }),
          credentials: 'include'
        });

        if (response.ok) {
          this.toastService.success('Order moved to billed status successfully!');
          this.selectedCustomerForDetails.status = 'billed';
          await this.loadCustomers();
          this.filteredCustomers = [...this.customers];
          
          // Refresh bills to show the auto-generated bill
          console.log('Move to billed - waiting 1 second before loading bills...');
          setTimeout(async () => {
            await this.loadBills();
            this.toastService.success('Bill has been automatically generated!');
          }, 1000);
        } else {
          const error = await response.json();
          this.toastService.error(error.error || 'Failed to move order to billed status');
        }
      } catch (error) {
        console.error('Error moving order to billed status:', error);
        this.toastService.error('Error moving order to billed status');
      }
    }
  }

  async deleteCustomer(customerId?: string) {
    const customerToDelete = customerId ? this.customers.find(c => c.id === customerId) : this.selectedCustomerForDetails;
    if (!customerToDelete) {
      this.toastService.error('Customer not found');
      return;
    }
    
    if (confirm(`Are you sure you want to delete the order for ${customerToDelete.name}? This action cannot be undone.`)) {
      try {
        const response = await fetch(`${environment.apiUrl}/laundry-customers/${customerToDelete.id}`, {
          method: 'DELETE',
          credentials: 'include'
        });

        if (response.ok) {
          this.toastService.success('Order deleted successfully!');
          this.closeCustomerDetailsModal();
          await this.loadCustomers();
          this.filteredCustomers = [...this.customers];
        } else {
          const error = await response.json();
          this.toastService.error(error.error || 'Failed to delete order');
        }
      } catch (error) {
        console.error('Error deleting order:', error);
        this.toastService.error('Error deleting order');
      }
    }
  }

  // Bill Setup Methods
  openBillSetupModal() {
    // Navigate to billing configuration page
    this.router.navigate(['/billing-config']);
  }

  closeBillSetupModal() {
    this.showBillSetupModal = false;
  }

  loadBillSetupConfig() {
    try {
      const savedConfig = localStorage.getItem('clothaura-bill-config');
      if (savedConfig) {
        this.billConfig = { ...this.billConfig, ...JSON.parse(savedConfig) };
      }
      
      const savedFields = localStorage.getItem('clothaura-bill-fields');
      if (savedFields) {
        this.billFields = JSON.parse(savedFields);
      }

      const savedCompanyDetails = localStorage.getItem('clothaura-company-details');
      if (savedCompanyDetails) {
        this.companyDetails = { ...this.companyDetails, ...JSON.parse(savedCompanyDetails) };
      }
    } catch (error) {
      console.error('Error loading bill setup configuration:', error);
    }
  }

  saveBillSetup() {
    try {
      localStorage.setItem('clothaura-bill-config', JSON.stringify(this.billConfig));
      localStorage.setItem('clothaura-bill-fields', JSON.stringify(this.billFields));
      localStorage.setItem('clothaura-company-details', JSON.stringify(this.companyDetails));
      
      this.toastService.success('Bill setup configuration saved successfully!');
      this.closeBillSetupModal();
    } catch (error) {
      console.error('Error saving bill setup configuration:', error);
      this.toastService.error('Failed to save bill setup configuration');
    }
  }

}

