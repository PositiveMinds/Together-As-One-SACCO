// Main Application Module

const App = {
      // SVG Icons
      icons: {
            search: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em"><path d="M18.031 16.6168L22.3137 20.8995L20.8995 22.3137L16.6168 18.031C15.0769 19.263 13.124 20 11 20C6.032 20 2 15.968 2 11C2 6.032 6.032 2 11 2C15.968 2 20 6.032 20 11C20 13.124 19.263 15.0769 18.031 16.6168ZM16.0247 15.8748C17.2475 14.6146 18 12.8956 18 11C18 7.1325 14.8675 4 11 4C7.1325 4 4 7.1325 4 11C4 14.8675 7.1325 18 11 18C12.8956 18 14.6146 17.2475 15.8748 16.0247L16.0247 15.8748Z"></path></svg>',
            edit: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em"><path d="M16.7574 2.99678L14.7574 4.99678H5V18.9968H19V9.23943L21 7.23943V19.9968C21 20.5491 20.5523 20.9968 20 20.9968H4C3.44772 20.9968 3 20.5491 3 19.9968V3.99678C3 3.4445 3.44772 2.99678 4 2.99678H16.7574ZM20.4853 2.09729L21.8995 3.5115L12.7071 12.7039L11.2954 12.7064L11.2929 11.2897L20.4853 2.09729Z"></path></svg>',
            delete: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em"><path d="M17 6H22V8H20V21C20 21.5523 19.5523 22 19 22H5C4.44772 22 4 21.5523 4 21V8H2V6H7V3C7 2.44772 7.44772 2 8 2H16C16.5523 2 17 2.44772 17 3V6ZM18 8H6V20H18V8ZM9 11H11V17H9V11ZM13 11H15V17H13V11ZM9 4V6H15V4H9Z"></path></svg>',
            view: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em"><path d="M12.0003 3C17.3924 3 21.8784 6.87976 22.8189 12C21.8784 17.1202 17.3924 21 12.0003 21C6.60812 21 2.12215 17.1202 1.18164 12C2.12215 6.87976 6.60812 3 12.0003 3ZM12.0003 19C16.2359 19 19.8603 16.052 20.7777 12C19.8603 7.94803 16.2359 5 12.0003 5C7.7646 5 4.14022 7.94803 3.22278 12C4.14022 16.052 7.7646 19 12.0003 19ZM12.0003 16.5C9.51498 16.5 7.50026 14.4853 7.50026 12C7.50026 9.51472 9.51498 7.5 12.0003 7.5C14.4855 7.5 16.5003 9.51472 16.5003 12C16.5003 14.4853 14.4855 16.5 12.0003 16.5ZM12.0003 14.5C13.381 14.5 14.5003 13.3807 14.5003 12C14.5003 10.6193 13.381 9.5 12.0003 9.5C10.6196 9.5 9.50026 10.6193 9.50026 12C9.50026 13.3807 10.6196 14.5 12.0003 14.5Z"></path></svg>'
      },

      async init() {
             await this.setupEventListeners();
             // Restore the last active page, or show dashboard as default
             await UI.restoreLastPage();
             // Restore scroll position
             this.restoreScrollPosition();
             // Setup scroll position saving
             this.setupScrollPositionSaving();
         },

      setupScrollPositionSaving() {
            window.addEventListener('scroll', () => {
                  const scrollPos = window.scrollY || window.pageYOffset;
                  localStorage.setItem('scrollPosition', scrollPos);
            });
      },

      restoreScrollPosition() {
            setTimeout(() => {
                  const savedScrollPos = localStorage.getItem('scrollPosition');
                  if (savedScrollPos !== null) {
                        window.scrollTo(0, parseInt(savedScrollPos, 10));
                  }
            }, 100);
      },

      clearScrollPosition() {
            localStorage.removeItem('scrollPosition');
      },

      async setupEventListeners() {
         // Navigation
         document.querySelectorAll('.nav-btn:not(#resetBtn):not(#auditBtn):not(#backupBtn):not(#rolesBtn)').forEach(btn => {
             btn.addEventListener('click', async (e) => {
                 const page = e.target.closest('.nav-btn')?.dataset.page;
                 if (page) {
                     await UI.showPage(page);
                 }
             });
         });

        // Export button
        document.getElementById('exportBtn').addEventListener('click', () => {
            ExportManager.showExportMenu();
        });

        // Backup button
         const backupBtn = document.getElementById('backupBtn');
         if (backupBtn) {
             backupBtn.addEventListener('click', async () => {
                 try {
                     // Show loading state
                     backupBtn.disabled = true;
                     backupBtn.innerHTML = '<i class="ri-loader-4-line" style="animation: spin 1s linear infinite;"></i> Backing up...';
                     
                     // Get all data asynchronously
                     const data = await Storage.exportData();
                     const json = JSON.stringify(data, null, 2);
                     const blob = new Blob([json], {
                         type: 'application/json'
                     });
                     const url = URL.createObjectURL(blob);
                     const a = document.createElement('a');
                     a.href = url;
                     a.download = `sacco-backup-${new Date().toISOString().split('T')[0]}.json`;
                     a.click();
                     
                     // Clean up
                     URL.revokeObjectURL(url);
                     
                     // Log and alert
                     await Storage.addAuditLog('BACKUP_CREATED', 'Data backup created');
                     UI.showAlert('Backup downloaded successfully', 'success');
                 } catch (error) {
                     console.error('Backup failed:', error);
                     UI.showAlert('Backup failed: ' + error.message, 'error');
                 } finally {
                     // Restore button state
                     backupBtn.disabled = false;
                     backupBtn.innerHTML = '💾 Backup';
                 }
             });
         }

        // Restore button
         const restoreBtn = document.getElementById('restoreBtn');
         if (restoreBtn) {
             const restoreInput = document.getElementById('restoreInput');
             if (restoreInput) {
                 restoreInput.addEventListener('change', async (e) => {
                     const file = e.target.files[0];
                     if (!file) return;

                     const reader = new FileReader();
                     reader.onload = async (event) => {
                         try {
                             const data = JSON.parse(event.target.result);
                             
                             // Validate backup file structure
                             if (!data.members || !data.loans || !data.payments) {
                                 throw new Error('Invalid backup file structure');
                             }
                             
                             Swal.fire({
                                 icon: 'warning',
                                 title: 'Restore Data?',
                                 text: 'This will replace all current data. This action cannot be undone. Continue?',
                                 showCancelButton: true,
                                 confirmButtonColor: '#ef4444',
                                 cancelButtonColor: '#6b7280',
                                 confirmButtonText: 'Yes, restore data'
                             }).then(async (result) => {
                                  if (result.isConfirmed) {
                                      try {
                                          // Show loading
                                          Swal.fire({
                                              title: 'Restoring data...',
                                              html: '<div class="spinner"></div>',
                                              allowOutsideClick: false,
                                              didOpen: async () => {
                                                  await Storage.importData(data);
                                                  await UI.showPage('dashboard');
                                                  Swal.close();
                                                  UI.showAlert('Data restored successfully', 'success');
                                              }
                                          });
                                      } catch (restoreError) {
                                          console.error('Restore error:', restoreError);
                                          UI.showAlert('Restore failed: ' + restoreError.message, 'error');
                                      }
                                  }
                              });
                         } catch (error) {
                             console.error('Parse error:', error);
                             UI.showAlert('Invalid backup file: ' + error.message, 'error');
                         }
                     };
                     reader.readAsText(file);
                 });
             }
         }

        // Audit log button
        const auditBtn = document.getElementById('auditBtn');
        if (auditBtn) {
            auditBtn.addEventListener('click', async () => {
                await this.showAuditLog();
            });
        }

        // View toggle buttons for members page
        const cardViewBtn = document.getElementById('cardViewBtn');
        const tableViewBtn = document.getElementById('tableViewBtn');
        
        if (cardViewBtn) {
            cardViewBtn.addEventListener('click', async () => {
                document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
                cardViewBtn.classList.add('active');
                localStorage.setItem('memberViewMode', 'card');
                await UI.refreshMembers();
            });
        }
        
        if (tableViewBtn) {
            tableViewBtn.addEventListener('click', async () => {
                document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
                tableViewBtn.classList.add('active');
                localStorage.setItem('memberViewMode', 'table');
                await UI.refreshMembers();
            });
        }
        
        // Restore view mode preference
        const savedViewMode = localStorage.getItem('memberViewMode') || 'card';
        document.querySelectorAll('.view-btn').forEach(btn => {
            if (btn.dataset.view === savedViewMode) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Roles button - removed with role-based access

        // Reset button
        const resetBtn = document.getElementById('resetBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                Swal.fire({
                    icon: 'warning',
                    title: 'Clear All Data?',
                    text: 'Are you sure you want to clear all data? This action cannot be undone.',
                    showCancelButton: true,
                    confirmButtonColor: '#ef4444',
                    cancelButtonColor: '#6b7280',
                    confirmButtonText: 'Yes, clear all data',
                    cancelButtonText: 'Cancel'
                }).then(async (result) => {
                     if (result.isConfirmed) {
                         await Storage.clear();
                         await UI.showPage('dashboard');
                         UI.showAlert('All data has been cleared', 'success');
                         await Storage.addAuditLog('DATA_CLEARED', 'All data cleared by user');
                     }
                 });
            });
        }

        // Forms
        document.getElementById('memberForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addMember();
        });

        // Auto-generate member ID when form loads or name field changes
        const memberForm = document.getElementById('memberForm');
        const memberNameInput = document.getElementById('memberName');
        const memberEmailInput = document.getElementById('memberEmail');
        const memberPhoneInput = document.getElementById('memberPhone');
        const self = this;
        
        memberForm.addEventListener('focus', async (e) => {
            if (e.target === memberNameInput || e.target === memberPhoneInput) {
                await self.generateMemberId();
            }
        }, true);
        
        memberNameInput.addEventListener('blur', async () => {
            // Capitalize name on blur
            const capitalizedName = self.capitalizeWords(memberNameInput.value.trim());
            memberNameInput.value = capitalizedName;
            console.log('Name formatted to:', capitalizedName);
            await self.generateMemberId();
        });
        
        memberEmailInput.addEventListener('blur', () => {
            // Convert email to lowercase on blur
            const lowerEmail = memberEmailInput.value.trim().toLowerCase();
            memberEmailInput.value = lowerEmail;
            console.log('Email formatted to:', lowerEmail);
            
            // Validate email
            if (lowerEmail && !self.isValidEmail(lowerEmail)) {
                memberEmailInput.classList.add('is-invalid');
                memberEmailInput.title = 'Invalid email address';
            } else {
                memberEmailInput.classList.remove('is-invalid');
                memberEmailInput.title = '';
            }
        });
        
        memberPhoneInput.addEventListener('input', () => {
            // Enforce maximum 10 digits in real-time
            const cleaned = memberPhoneInput.value.replace(/\D/g, '');
            if (cleaned.length > 10) {
                // Only keep first 10 digits
                const limited = cleaned.substring(0, 10);
                // Reconstruct with formatting while preserving user experience
                memberPhoneInput.value = '0' + limited.substring(1);
            }
        });
        
        memberPhoneInput.addEventListener('blur', () => {
            // Format phone on blur
            const formattedPhone = self.formatPhoneNumber(memberPhoneInput.value.trim());
            memberPhoneInput.value = formattedPhone;
            console.log('Phone formatted to:', formattedPhone);
            
            // Validate phone
            if (memberPhoneInput.value.trim() && !self.isValidPhoneNumber(memberPhoneInput.value.trim())) {
                memberPhoneInput.classList.add('is-invalid');
                memberPhoneInput.title = 'Invalid phone number (10 digits required)';
            } else {
                memberPhoneInput.classList.remove('is-invalid');
                memberPhoneInput.title = '';
            }
        });
        
        // Real-time formatting feedback
        memberNameInput.addEventListener('input', () => {
            // Show what the name will look like when formatted
            const preview = self.capitalizeWords(memberNameInput.value.trim());
            if (memberNameInput.value && preview !== memberNameInput.value) {
                memberNameInput.placeholder = 'e.g., ' + preview;
            }
        });
        
        memberEmailInput.addEventListener('input', () => {
            // Show what the email will look like when formatted
            const preview = memberEmailInput.value.trim().toLowerCase();
            if (memberEmailInput.value && preview !== memberEmailInput.value) {
                memberEmailInput.placeholder = 'e.g., ' + preview;
            }
        });

        document.getElementById('loanForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addLoan();
        });

        // Loan form event listeners
        document.getElementById('loanAmount').addEventListener('input', () => this.calculateMonthlyInstallment());
        document.getElementById('loanTerm').addEventListener('input', () => this.calculateMonthlyInstallment());
        document.getElementById('loanType').addEventListener('change', () => this.updateInterestRate());

        // Top up loan form
        document.getElementById('topUpLoanForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.processLoanTopUp();
        });

        const topUpSelect = document.getElementById('topUpSelectLoan');
        if (topUpSelect) {
            // Standard change event listener
            topUpSelect.addEventListener('change', async (e) => {
                const value = e.target.value;
                if (value && value.length > 0) {
                    await this.loadLoanTopUpDetails(value);
                }
            });
        }

        document.getElementById('topUpAmount')?.addEventListener('input', () => this.calculateNewTopUpTotal());

        // Load active loans for top up select
        this.loadTopUpLoanSelect();

        document.getElementById('paymentForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addPayment();
        });

        document.getElementById('savingForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addSaving();
        });

        // Member report
        document.getElementById('reportMember').addEventListener('change', async (e) => {
            if (e.target.value) {
                await this.showMemberReport(e.target.value);
                await UI.refreshLoanReportForMember(e.target.value);
            } else {
                document.getElementById('memberReport').innerHTML = '<p class="text-muted text-center py-4">Select a member to view details</p>';
                document.getElementById('loanReport').innerHTML = '<p class="text-muted text-center py-4">Select a member to view loans</p>';
            }
        });

        // Set today's date for date inputs
        const today = new Date().toISOString().split('T')[0];
        const dateInputs = document.querySelectorAll('input[type="date"]');
        dateInputs.forEach(input => {
            if (!input.value) {
                input.value = today;
            }
        });

        // Refresh member selects on page load
        await UI.refreshMemberSelect();

        // Generate initial member ID
        await this.generateMemberId();

        // Member view toggle
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
                e.target.closest('.view-btn').classList.add('active');
                UI.refreshMembersList();
            });
        });

        // Loan installment calculation
        const loanInputs = ['loanAmount', 'loanTerm', 'interestRate'];
        loanInputs.forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.addEventListener('input', () => {
                    this.calculateMonthlyInstallment();
                });
            }
        });

        // Withdrawal form
        const withdrawalForm = document.getElementById('withdrawalForm');
        if (withdrawalForm) {
            withdrawalForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addWithdrawal();
            });
        }

        // Search functionality
        const memberSearch = document.getElementById('memberSearch');
        if (memberSearch) {
            memberSearch.addEventListener('input', (e) => {
                UI.filterMembers(e.target.value);
            });
        }

        const loanSearch = document.getElementById('loanSearch');
         if (loanSearch) {
             loanSearch.addEventListener('input', (e) => {
                 UI.filterLoans(e.target.value);
             });
         }

         // Activity member filter
         const activityMemberFilter = document.getElementById('activityMemberFilter');
         if (activityMemberFilter) {
             // Listen for both standard change and VirtualSelect change events
             activityMemberFilter.addEventListener('change', (e) => {
                 UI.filterRecentActivity(e.target.value);
             });
             
             // Also listen for VirtualSelect's valueChange event
             activityMemberFilter.addEventListener('valueChange', (e) => {
                 UI.filterRecentActivity(e.detail);
             });
         }
        },

    // Calculate monthly installment for loans
    calculateMonthlyInstallment() {
        const amount = parseFloat(document.getElementById('loanAmount').value) || 0;
        const term = parseInt(document.getElementById('loanTerm').value) || 1;
        const interestRate = parseFloat(document.getElementById('interestRate').value) || 0;

        if (amount > 0 && term > 0) {
            // Calculate using simple interest: Total = Principal + (Principal × Rate × Time)
            const totalInterest = (amount * interestRate * term) / (12 * 100);
            const totalAmount = amount + totalInterest;
            const monthlyInstallment = totalAmount / term;

            document.getElementById('monthlyInstallment').textContent =
                `UGX ${UI.formatNumber(monthlyInstallment.toFixed(0))}`;
        } else {
            document.getElementById('monthlyInstallment').textContent = 'UGX 0';
        }
    },



    // Generate initials from name for avatar placeholder
    getInitials(name) {
        if (!name) return '?';
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    },

    // Get avatar color based on initials
    getAvatarColor(name) {
        const initials = this.getInitials(name);
        const hash = initials.charCodeAt(0) + (initials.charCodeAt(1) || 0);
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'];
        return colors[hash % colors.length];
    },

    // Get avatar HTML (initials only) - for card views
    getAvatarHtml(member, size = 'md') {
         const initials = this.getInitials(member.name);
         const containerSize = size === 'sm' ? '40px' : size === 'lg' ? '120px' : '56px';
         const fontSize = size === 'sm' ? '0.75rem' : size === 'lg' ? '1.2rem' : '1rem';
         
         const bgColor = this.getAvatarColor(member.name);
         return `<div style="width: ${containerSize}; height: ${containerSize}; background: ${bgColor}; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: ${fontSize}; flex-shrink: 0; border: 3px solid rgba(255, 255, 255, 0.3);">${initials}</div>`;
     },

    // Member operations
    async addMember() {
         let name = document.getElementById('memberName').value.trim();
         let email = document.getElementById('memberEmail').value.trim();
         let phone = document.getElementById('memberPhone').value.trim();
         const idNo = document.getElementById('memberIdNo').value.trim();

         if (!name || !email || !phone || !idNo) {
             UI.showAlert('Please fill in all fields', 'warning');
             return;
         }

         // Format inputs - ensure capitalization, lowercase email, and phone formatting
         name = name.trim() ? this.capitalizeWords(name) : '';
         email = email.trim() ? email.toLowerCase() : '';
         phone = phone.trim() ? this.formatPhoneNumber(phone) : '';
         
         if (!name || !email || !phone) {
             UI.showAlert('Name, email, and phone number are required', 'warning');
             return;
         }

         // Validate email
         if (!this.isValidEmail(email)) {
             UI.showAlert('Please enter a valid email address (e.g., john@example.com)', 'warning');
             return;
         }

         // Validate phone number
         const originalPhone = document.getElementById('memberPhone').value.trim();
         if (!this.isValidPhoneNumber(originalPhone)) {
             UI.showAlert('Please enter a valid phone number (10 digits including country code, e.g., +256775582868 or 0775582868)', 'warning');
             return;
         }

         // Check for duplicates
         const members = await Storage.getMembers();
         const duplicateCheck = this.checkDuplicateRegistration(members, { name, email, phone, idNo });
         if (duplicateCheck.isDuplicate) {
             UI.showAlert(duplicateCheck.message, 'warning');
             return;
         }

         // Get compressed image data if provided (use global or dataset as fallback)
         let photoData = this._currentPhotoData;
         if (!photoData) {
             const photoInput = document.getElementById('memberPhoto');
             if (photoInput && photoInput.dataset.compressedImage) {
                 photoData = photoInput.dataset.compressedImage;
             }
         }

         try {
              const member = Storage.addMember({
                  name,
                  email,
                  phone,
                  idNo,
                  photo: photoData
              });
              console.log('Member added with photo:', !!photoData);
              Storage.addAuditLog('MEMBER_ADDED', `New member added: ${name} (${idNo})`);
              
              // Show SweetAlert notification
              if (typeof SweetAlertUI !== 'undefined') {
                  await SweetAlertUI.memberAdded(name, idNo);
              } else {
                  UI.showAlert('Member registered successfully', 'success');
              }
              
              // Send notification
              if (typeof notificationManager !== 'undefined') {
                  notificationManager.notifyMemberAdded(name, member.id);
              }
              
              UI.clearForm('memberForm');
              // Clear photo data
              this._currentPhotoData = null;
               await this.generateMemberId();
               UI.refreshMembers();
               UI.refreshLoanSelect();
               
               // Dispatch event for loan member fix
               document.dispatchEvent(new CustomEvent('memberadded', { detail: member }));
          } catch (error) {
              if (typeof SweetAlertUI !== 'undefined') {
                  SweetAlertUI.error('Error', 'Failed to register member: ' + error.message);
              } else {
                  UI.showAlert('Error registering member: ' + error.message, 'error');
              }
          }
     },



    async generateMemberId() {
        try {
            const members = await Storage.getMembers();
            let nextId = 1;
            
            // Find the highest numeric ID
            if (members.length > 0) {
                const numericIds = members
                    .map(m => {
                        const match = m.idNo.match(/\d+/);
                        return match ? parseInt(match[0]) : 0;
                    })
                    .filter(id => id > 0);
                
                if (numericIds.length > 0) {
                    nextId = Math.max(...numericIds) + 1;
                }
            }
            
            // Format the ID (e.g., MEM-001, MEM-002)
            const formattedId = `MEM-${String(nextId).padStart(3, '0')}`;
            document.getElementById('memberIdNo').value = formattedId;
        } catch (error) {
            console.error('Error generating member ID:', error);
        }
    },

    async updateMember(id) {
        console.log('updateMember called for id:', id);
        const member = await Storage.getMemberById(id);
        if (!member) {
            UI.showAlert('Member not found', 'error');
            return;
        }
        console.log('Member loaded:', member.name, 'has photo:', !!member.photo);

        // Reset the update photo data for fresh start
        this._updatePhotoData = null;
        window._saccoUpdatePhotoData = null;
        this._currentUpdateMemberId = null;
        this._currentUpdateMember = null;

         const initials = this.getInitials(member.name);
         const bgColor = member.photo ? 'transparent' : this.getAvatarColor(member.name);
         const photoHtml = member.photo ? 
             `<img src="${member.photo}" alt="${member.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">` :
             `<div style="width: 100%; height: 100%; background: ${bgColor}; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 1.5rem;">${initials}</div>`;

         Swal.fire({
             title: 'Update Member Information',
             html: `
                 <div class="text-start">
                     <div class="mb-3">
                         <label for="updateMemberName" class="form-label">Full Name</label>
                         <input type="text" class="form-control" id="updateMemberName" value="${member.name}">
                     </div>
                     <div class="mb-3">
                         <label for="updateMemberEmail" class="form-label">Email</label>
                         <input type="email" class="form-control" id="updateMemberEmail" value="${member.email}">
                     </div>
                     <div class="mb-3">
                         <label for="updateMemberPhone" class="form-label">Phone</label>
                         <input type="tel" class="form-control" id="updateMemberPhone" value="${member.phone}">
                     </div>
                     <div class="mb-3">
                         <label for="updateMemberIdNo" class="form-label">ID Number</label>
                         <input type="text" class="form-control" id="updateMemberIdNo" value="${member.idNo}" disabled>
                     </div>
                 </div>
             `,
             icon: 'info',
             showCancelButton: true,
             confirmButtonColor: '#2563eb',
             cancelButtonColor: '#6b7280',
             confirmButtonText: 'Save Changes',
             cancelButtonText: 'Cancel',
             didOpen: () => {
                 console.log('Update modal opened');
             }
         }).then(async (result) => {
             if (result.isConfirmed) {
                 try {
                     const name = document.getElementById('updateMemberName').value.trim();
                     const email = document.getElementById('updateMemberEmail').value.trim();
                     const phone = document.getElementById('updateMemberPhone').value.trim();

                     if (!name || !email || !phone) {
                         UI.showAlert('Please fill in all fields', 'warning');
                         return;
                     }

                     // Use new photo if available, otherwise keep existing
                     // Check both instance variable and window backup
                     let photoData = this._updatePhotoData || window._saccoUpdatePhotoData || member.photo;
                     
                     console.log('Saving member with photo:', photoData ? `${(photoData.length / 1024).toFixed(2)} KB` : 'no photo');

                     const updatedMember = {
                         ...member,
                         name,
                         email,
                         phone,
                         photo: photoData,
                         updatedAt: new Date().toISOString()
                     };

                     await Storage.updateMember(id, updatedMember);
                     Storage.addAuditLog('MEMBER_UPDATED', `Member updated: ${name} (${updatedMember.idNo})`);
                     
                     // Force reload from storage to ensure image is displayed
                     const refreshedMember = await Storage.getMemberById(id);
                     if (refreshedMember && refreshedMember.photo) {
                         console.log('Member photo updated:', refreshedMember.photo.substring(0, 50) + '...');
                     }
                     
                     UI.showAlert('Member information updated successfully', 'success');
                     
                     // Clear update data
                     this._updatePhotoData = null;
                     window._saccoUpdatePhotoData = null;
                     this._currentUpdateMemberId = null;
                     this._currentUpdateMember = null;
                     
                     // Refresh UI with a small delay to ensure data is committed
                     setTimeout(async () => {
                         await UI.refreshMembers();
                     }, 100);
                 } catch (error) {
                     UI.showAlert('Error updating member: ' + error.message, 'error');
                 }
             }
             // Clear data on cancel too
             this._updatePhotoData = null;
             this._currentUpdateMemberId = null;
             this._currentUpdateMember = null;
         });
     },

    deleteMember(id) {
         Swal.fire({
             icon: 'warning',
             title: 'Delete Member?',
             text: 'Are you sure you want to delete this member? Associated loans will remain.',
             showCancelButton: true,
             confirmButtonColor: '#ef4444',
             cancelButtonColor: '#6b7280',
             confirmButtonText: 'Yes, delete',
             cancelButtonText: 'Cancel'
         }).then((result) => {
             if (result.isConfirmed) {
                 try {
                     Storage.deleteMember(id);
                     UI.showAlert('Member deleted successfully', 'success');
                     UI.refreshMembers();
                 } catch (error) {
                     UI.showAlert('Error deleting member: ' + error.message, 'error');
                 }
             }
         });
     },

    // Loan operations
    async updateBorrowerOptions() {
        const borrowerType = document.getElementById('borrowerType').value;
        const memberWrapper = document.getElementById('loanMemberWrapper');
        const nonMemberWrapper = document.getElementById('nonMemberNameWrapper');
        const memberSelect = document.getElementById('loanMember');
        const nonMemberName = document.getElementById('nonMemberName');
        const loanType = document.getElementById('loanType');

        if (borrowerType === 'member') {
            memberWrapper.style.display = 'block';
            memberSelect.required = true;
            nonMemberWrapper.style.display = 'none';
            nonMemberName.required = false;
            nonMemberName.value = '';
            
            // Load members into dropdown
            try {
                const members = await Storage.getMembers();
                if (members.length === 0) {
                    memberSelect.innerHTML = '<option value="">No members registered</option>';
                    console.warn('[Loan Form] No members found');
                } else {
                    memberSelect.innerHTML = '<option value="">Select Member</option>' +
                        members.map(m => `<option value="${m.id}">${m.name}</option>`).join('');
                    console.log('[Loan Form] Loaded ' + members.length + ' members into dropdown');
                }
            } catch (error) {
                console.error('[Loan Form] Error loading members:', error);
                memberSelect.innerHTML = '<option value="">Error loading members</option>';
            }
            
            // Only show member loans
            loanType.innerHTML = `
                <option value="" disabled selected>Select loan type...</option>
                <option value="normal">Normal Loan</option>
                <option value="emergency">Emergency Loan</option>
            `;
        } else if (borrowerType === 'non-member') {
            memberWrapper.style.display = 'none';
            memberSelect.required = false;
            memberSelect.value = '';
            nonMemberWrapper.style.display = 'block';
            nonMemberName.required = true;
            
            // Only show non-member loan
            loanType.innerHTML = `
                <option value="" disabled selected>Select loan type...</option>
                <option value="non-member">Non-Member Loan</option>
            `;
        }
        
        loanType.value = '';
        this.updateInterestRate();
    },

    updateInterestRate() {
         const loanType = document.getElementById('loanType').value;
         const interestRateField = document.getElementById('interestRate');
         
         const rates = {
             'normal': 2,
             'emergency': 5,
             'non-member': 10
         };
         
         const rate = rates[loanType] || 2;
         interestRateField.value = rate;
         console.log('[Loan Form] Interest rate set to:', rate + '%', 'for loan type:', loanType);
         this.calculateMonthlyInstallment();
     },

    calculateMonthlyInstallment() {
        const amount = parseFloat(document.getElementById('loanAmount').value) || 0;
        const term = parseInt(document.getElementById('loanTerm').value) || 0;
        const interestRate = parseFloat(document.getElementById('interestRate').value) || 0;
        
        if (amount > 0 && term > 0) {
            const totalInterest = (amount * interestRate * term) / (12 * 100);
            const totalAmount = amount + totalInterest;
            const monthlyPayment = totalAmount / term;
            document.getElementById('monthlyInstallment').textContent = `UGX ${UI.formatNumber(monthlyPayment.toFixed(0))}`;
        } else {
            document.getElementById('monthlyInstallment').textContent = 'UGX 0';
        }
    },

    async addLoan() {
         const borrowerType = document.getElementById('borrowerType').value;
         const memberId = borrowerType === 'member' ? document.getElementById('loanMember').value : null;
         const nonMemberName = borrowerType === 'non-member' ? document.getElementById('nonMemberName').value : null;
         const loanType = document.getElementById('loanType').value;
         const amount = parseFloat(document.getElementById('loanAmount').value);
         const term = parseInt(document.getElementById('loanTerm').value);
         const interestRate = parseFloat(document.getElementById('interestRate').value) || 0;
         const loanDate = document.getElementById('loanDate').value;

         if (!borrowerType || !loanType || !amount || !term || !loanDate) {
             UI.showAlert('Please fill in all required fields', 'warning');
             return;
         }

         if (borrowerType === 'member' && !memberId) {
             UI.showAlert('Please select a member', 'warning');
             return;
         }

         if (borrowerType === 'non-member' && !nonMemberName) {
             UI.showAlert('Please enter the non-member name', 'warning');
             return;
         }

         if (amount <= 0 || term <= 0) {
             UI.showAlert('Amount and term must be greater than 0', 'warning');
             return;
         }

         try {
              // Verify member exists (only for members)
              let member = null;
              if (borrowerType === 'member') {
                  member = await Storage.getMemberById(memberId);
                  if (!member) {
                      UI.showAlert('Selected member not found', 'error');
                      return;
                  }
              }

             // Check if loan amount exceeds total collective savings (all members)
             const allSavings = await Storage.getSavings();
             const totalCollectiveSavings = allSavings.reduce((sum, saving) => sum + (saving.amount || 0), 0);
             
             // Also deduct existing withdrawals
             const allWithdrawals = await Storage.getWithdrawals();
             const totalWithdrawals = allWithdrawals.reduce((sum, withdrawal) => sum + (withdrawal.amount || 0), 0);
             
             const availableSavingsPool = totalCollectiveSavings - totalWithdrawals;
             
             // Get all active loans to check total loaned out
             const allLoans = await Storage.getLoans();
             const totalCurrentlyLoaned = allLoans.reduce((sum, loan) => sum + loan.amount, 0);
             
             const maxAvailableToLend = availableSavingsPool - totalCurrentlyLoaned;
             
             if (amount > maxAvailableToLend) {
                 UI.showAlert(
                     `Cannot issue loan: Loan amount (UGX ${UI.formatNumber(amount)}) exceeds available lending pool (UGX ${UI.formatNumber(maxAvailableToLend)}).\n\n` +
                     `Total Collective Savings: UGX ${UI.formatNumber(availableSavingsPool)}\n` +
                     `Already Loaned Out: UGX ${UI.formatNumber(totalCurrentlyLoaned)}`,
                     'warning'
                 );
                 return;
             }

             // Calculate due date
             const startDate = new Date(loanDate);
             const dueDate = new Date(startDate);
             dueDate.setMonth(dueDate.getMonth() + term);

             // Store interest rate for future reference
             const loan = Storage.addLoan({
                memberId,
                borrowerType,
                loanType,
                borrowerName: borrowerType === 'non-member' ? nonMemberName : null,
                amount,
                term,
                interestRate,
                loanDate,
                dueDate: dueDate.toISOString().split('T')[0]
             });

             const borrowerName = borrowerType === 'member' ? member.name : nonMemberName;
             Storage.addAuditLog('LOAN_CREATED', `${loanType} loan of UGX ${amount} (${interestRate}%) created for ${borrowerName}`);
             
             // Calculate monthly installment
             const totalInterest = (amount * interestRate * term) / (12 * 100);
             const totalAmount = amount + totalInterest;
             const monthlyPayment = totalAmount / term;
             
             // Show SweetAlert notification
             if (typeof SweetAlertUI !== 'undefined') {
                 await SweetAlertUI.loanCreated(borrowerName, amount, monthlyPayment);
             } else {
                 UI.showAlert('Loan created successfully', 'success');
             }
             
             // Send notification (only for members)
             if (borrowerType === 'member' && typeof notificationManager !== 'undefined') {
                 notificationManager.notifyLoanCreated(borrowerName, amount, loan.id);
             }
             
             // Trigger payment reminder check
             if (typeof paymentReminderChecker !== 'undefined') {
                 paymentReminderChecker.lastCheckTime = 0; // Reset to check immediately
                 paymentReminderChecker.checkDuePayments();
             }
             
             UI.clearForm('loanForm');
             UI.refreshLoans();
             UI.refreshReports();
             document.dispatchEvent(new CustomEvent('loansUpdated'));
             } catch (error) {
             if (typeof SweetAlertUI !== 'undefined') {
                 SweetAlertUI.error('Error', 'Failed to create loan: ' + error.message);
             } else {
                 UI.showAlert('Error creating loan: ' + error.message, 'error');
             }
             }
    },

    async loadTopUpLoanSelect() {
        try {
            const loans = await Storage.getLoans();
            const members = await Storage.getMembers();
            const activeLoans = loans.filter(l => l.status === 'active');
            const select = document.getElementById('topUpSelectLoan');
            
            if (select && activeLoans.length > 0) {
                // Clear existing options
                select.innerHTML = '<option value="" disabled selected>Choose a loan...</option>';
                
                activeLoans.forEach(loan => {
                    const remaining = loan.amount - loan.paid;
                    // Get borrower name: for non-members it's stored, for members we fetch it
                    let borrowerName = loan.borrowerName;
                    if (loan.borrowerType === 'member' && loan.memberId) {
                        const member = members.find(m => m.id === loan.memberId);
                        borrowerName = member ? member.name : 'Unknown Member';
                    }
                    const option = document.createElement('option');
                    option.value = loan.id;
                    option.textContent = `${borrowerName} (${loan.id.substring(0, 8)}) - Balance: UGX ${UI.formatNumber(remaining)}`;
                    select.appendChild(option);
                });
                
                // Re-attach change listener after populating options
                this.setupTopUpSelectListener();
            }
        } catch (error) {
            console.error('Error loading top up loans:', error);
        }
    },
    
    setupTopUpSelectListener() {
        const topUpSelect = document.getElementById('topUpSelectLoan');
        if (topUpSelect) {
            // Remove old listeners by cloning
            const newSelect = topUpSelect.cloneNode(true);
            topUpSelect.parentNode.replaceChild(newSelect, topUpSelect);
            
            // Add new listener
            newSelect.addEventListener('change', async (e) => {
                const value = e.target.value;
                if (value && value.length > 0) {
                    await this.loadLoanTopUpDetails(value);
                }
            });
        }
    },

    async loadLoanTopUpDetails(loanId) {
        try {
            const loan = await Storage.getLoanById(loanId);
            
            if (!loan) {
                UI.showAlert('Loan not found', 'error');
                return;
            }

            const remaining = loan.amount - loan.paid;
            
            // Update both page and modal versions of the details
            const currentLoanAmountEl = document.getElementById('currentLoanAmount');
            const topUpOriginalAmountEl = document.getElementById('topUpOriginalAmount');
            
            if (currentLoanAmountEl) currentLoanAmountEl.textContent = `UGX ${UI.formatNumber(loan.amount)}`;
            if (topUpOriginalAmountEl) topUpOriginalAmountEl.textContent = `UGX ${UI.formatNumber(loan.amount)}`;
            
            const currentLoanRateEl = document.getElementById('currentLoanRate');
            const topUpInterestRateEl = document.getElementById('topUpInterestRate');
            if (currentLoanRateEl) currentLoanRateEl.textContent = `${loan.interestRate}%`;
            if (topUpInterestRateEl) topUpInterestRateEl.textContent = `${loan.interestRate}%`;
            
            const currentLoanBalanceEl = document.getElementById('currentLoanBalance');
            const topUpRemainingBalanceEl = document.getElementById('topUpRemainingBalance');
            if (currentLoanBalanceEl) currentLoanBalanceEl.textContent = `UGX ${UI.formatNumber(remaining)}`;
            if (topUpRemainingBalanceEl) topUpRemainingBalanceEl.textContent = `UGX ${UI.formatNumber(remaining)}`;
            
            const currentLoanDueDateEl = document.getElementById('currentLoanDueDate');
            if (currentLoanDueDateEl) currentLoanDueDateEl.textContent = new Date(loan.dueDate).toLocaleDateString();
            
            document.getElementById('topUpAmount').value = '';
            document.getElementById('topUpDate').valueAsDate = new Date();
            this.calculateNewTopUpTotal();
        } catch (error) {
            console.error('Error loading loan details:', error);
        }
    },

    calculateNewTopUpTotal() {
        const loanId = document.getElementById('topUpSelectLoan').value;
        const topUpAmount = parseFloat(document.getElementById('topUpAmount').value) || 0;
        
        if (loanId && topUpAmount > 0) {
            Storage.getLoanById(loanId).then(loan => {
                if (loan) {
                    const newTotal = loan.amount + topUpAmount;
                    document.getElementById('topUpNewTotal').textContent = `UGX ${UI.formatNumber(newTotal)}`;
                }
            });
        } else {
            document.getElementById('topUpNewTotal').textContent = 'UGX 0';
        }
    },

    async processLoanTopUp() {
        const loanId = document.getElementById('topUpSelectLoan').value;
        const topUpAmount = parseFloat(document.getElementById('topUpAmount').value);
        const topUpDate = document.getElementById('topUpDate').value;

        if (!loanId || !topUpAmount || !topUpDate) {
            UI.showAlert('Please fill in all required fields', 'warning');
            return;
        }

        if (topUpAmount <= 0) {
            UI.showAlert('Top up amount must be greater than 0', 'warning');
            return;
        }

        try {
            const loan = await Storage.getLoanById(loanId);
            if (!loan) {
                UI.showAlert('Loan not found', 'error');
                return;
            }

            // Check if loan amount exceeds total collective savings
            const allSavings = await Storage.getSavings();
            const totalCollectiveSavings = allSavings.reduce((sum, saving) => sum + (saving.amount || 0), 0);
            
            const allWithdrawals = await Storage.getWithdrawals();
            const totalWithdrawals = allWithdrawals.reduce((sum, withdrawal) => sum + (withdrawal.amount || 0), 0);
            
            const availableSavingsPool = totalCollectiveSavings - totalWithdrawals;
            
            // Get all active loans to check total loaned out (excluding this loan)
            const allLoans = await Storage.getLoans();
            const totalCurrentlyLoaned = allLoans.reduce((sum, l) => sum + (l.id === loanId ? 0 : l.amount), 0);
            
            const maxAvailableToLend = availableSavingsPool - totalCurrentlyLoaned;
            
            if (topUpAmount > maxAvailableToLend) {
                UI.showAlert(
                    `Cannot process top up: Amount (UGX ${UI.formatNumber(topUpAmount)}) exceeds available lending pool (UGX ${UI.formatNumber(maxAvailableToLend)}).`,
                    'warning'
                );
                return;
            }

            // Update loan amount
             const originalAmount = loan.amount;
             const newAmount = originalAmount + topUpAmount;
             
             // Update due date (extend by proportional months)
             const originalDueDate = new Date(loan.dueDate);
             const topUpProportion = topUpAmount / originalAmount;
             const additionalMonths = Math.ceil(loan.term * topUpProportion);
             const newDueDate = new Date(originalDueDate);
             newDueDate.setMonth(newDueDate.getMonth() + additionalMonths);

             const topUps = loan.topUps || [];
             topUps.push({
                 amount: topUpAmount,
                 date: topUpDate,
                 timestamp: new Date().toISOString()
             });

             // Save updated loan
             await Storage.updateLoan(loanId, {
                 amount: newAmount,
                 dueDate: newDueDate.toISOString().split('T')[0],
                 topUps: topUps
             });
            
            const borrowerName = loan.borrowerType === 'non-member' ? loan.borrowerName : (await Storage.getMemberById(loan.memberId))?.name || 'Member';
            Storage.addAuditLog('LOAN_TOPUP', `Top up of UGX ${topUpAmount} added to loan ${loanId}. New total: UGX ${newAmount}`);

            if (typeof SweetAlertUI !== 'undefined') {
                await SweetAlertUI.loanCreated(`${borrowerName} - Top Up`, topUpAmount, (newAmount * loan.interestRate * loan.term) / (12 * 100 * loan.term));
            } else {
                UI.showAlert('Loan top up processed successfully', 'success');
            }

            // Reload top up select and form
            await this.loadTopUpLoanSelect();
            UI.clearForm('topUpLoanForm');
            document.getElementById('topUpSelectLoan').value = '';
            
            UI.refreshLoans();
            UI.refreshReports();
            document.dispatchEvent(new CustomEvent('loansUpdated'));
        } catch (error) {
            if (typeof SweetAlertUI !== 'undefined') {
                SweetAlertUI.error('Error', 'Failed to process top up: ' + error.message);
            } else {
                UI.showAlert('Error processing top up: ' + error.message, 'error');
            }
        }
    },

    async deleteLoan(id) {
         const loan = await Storage.getLoanById(id);
         let message = 'Are you sure you want to delete this loan?';

         if (loan && loan.paid > 0) {
             message = 'This loan has payments recorded. Delete anyway?';
         }

        Swal.fire({
            icon: 'warning',
            title: 'Delete Loan?',
            text: message,
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, delete',
            cancelButtonText: 'Cancel'
        }).then((result) => {
            if (result.isConfirmed) {
                try {
                    Storage.deleteLoan(id);
                    UI.showAlert('Loan deleted successfully', 'success');
                    UI.refreshLoans();
                    UI.refreshPayments();
                    UI.refreshReports();
                } catch (error) {
                    UI.showAlert('Error deleting loan: ' + error.message, 'error');
                }
            }
        });
    },

    async viewLoanDetails(loanId) {
        const loan = await Storage.getLoanById(loanId);
        if (!loan) {
            UI.showAlert('Loan not found', 'error');
            return;
        }

        const member = await Storage.getMemberById(loan.memberId);
        const payments = await Storage.getPaymentsByLoanId(loanId);
        const daysRemaining = this.calculateDaysRemaining(loan.dueDate);

        // Calculate monthly installment
        const totalInterest = (loan.amount * loan.interestRate * loan.term) / (12 * 100);
        const totalAmount = loan.amount + totalInterest;
        const monthlyInstallment = totalAmount / loan.term;

        let html = `
            <div class="text-start">
                <h5 class="mb-3">${member?.name || 'Unknown'}</h5>
                <table class="table table-sm mb-3">
                    <tr><td>Principal Amount</td><td><strong>UGX ${UI.formatNumber(loan.amount)}</strong></td></tr>
                    <tr><td>Loan Date</td><td><strong>${new Date(loan.loanDate).toLocaleDateString()}</strong></td></tr>
                    <tr><td>Due Date</td><td><strong>${new Date(loan.dueDate).toLocaleDateString()}</strong></td></tr>
                    <tr><td>Interest Rate</td><td><strong>${loan.interestRate}%</strong></td></tr>
                    <tr><td>Loan Term</td><td><strong>${loan.term} months</strong></td></tr>
                    <tr><td>Monthly Installment</td><td><strong>UGX ${UI.formatNumber(monthlyInstallment.toFixed(0))}</strong></td></tr>
                    <tr><td>Total Amount Due</td><td><strong>UGX ${UI.formatNumber(totalAmount.toFixed(0))}</strong></td></tr>
                    <tr><td>Status</td><td><strong>${loan.status.toUpperCase()}</strong></td></tr>
                </table>
                
                <h6 class="mt-3 mb-2">Repayment Status</h6>
                <table class="table table-sm mb-3">
                    <tr><td>Total Paid</td><td><strong>UGX ${UI.formatNumber(loan.paid)}</strong></td></tr>
                    <tr><td>Remaining</td><td><strong>UGX ${UI.formatNumber(loan.amount - loan.paid)}</strong></td></tr>
                    <tr><td>Repayment Progress</td><td><strong>${((loan.paid / loan.amount) * 100).toFixed(1)}%</strong></td></tr>
                    <tr><td>Days to Due</td><td><strong>${daysRemaining}</strong></td></tr>
                </table>
                
                <h6 class="mt-3 mb-2">Payment History</h6>
                ${payments.length === 0 ? 
                    '<p class="text-muted small">No payments recorded yet</p>' : 
                    '<table class="table table-sm">' + 
                    payments.map(p => `
                        <tr>
                            <td>${new Date(p.paymentDate).toLocaleDateString()}</td>
                            <td><strong>UGX ${UI.formatNumber(p.amount)}</strong></td>
                        </tr>
                    `).join('') + 
                    '</table>'
                }
            </div>
        `;

        Swal.fire({
            title: 'Loan Details',
            html: html,
            icon: 'info',
            confirmButtonColor: '#2563eb',
            width: '500px'
        });
    },

    // Payment operations
    async addPayment() {
        const loanId = document.getElementById('paymentLoan').value;
        const amount = parseFloat(document.getElementById('paymentAmount').value);
        const paymentDate = document.getElementById('paymentDate').value;

        if (!loanId || !amount || !paymentDate) {
            UI.showAlert('Please fill in all fields', 'warning');
            return;
        }

         const loan = await Storage.getLoanById(loanId);
         if (!loan) {
             UI.showAlert('Invalid loan selected', 'warning');
             return;
         }

         if (amount <= 0) {
             UI.showAlert('Payment amount must be greater than 0', 'warning');
             return;
         }

         // Calculate total amount due (principal + interest + penalties)
         const totalInterest = (loan.amount * loan.interestRate * loan.term) / (12 * 100);
        const totalAmountDue = loan.amount + totalInterest + (loan.penalty || 0);
        const remaining = totalAmountDue - loan.paid;

        if (amount > remaining) {
            UI.showAlert(`Payment amount cannot exceed remaining balance of UGX ${UI.formatNumber(remaining)}`, 'warning');
            return;
        }

        try {
            // Get loan and member info
            const loan = await Storage.getLoanById(loanId);
            const member = await Storage.getMemberById(loan.memberId);
            
            if (!member) {
                UI.showAlert('Member information not found', 'error');
                return;
            }

            const payment = await Storage.addPayment({
                loanId,
                amount,
                paymentDate
            });

            Storage.addAuditLog('PAYMENT_RECORDED', `Payment of UGX ${amount} recorded for ${member.name}`);
            
            // Show SweetAlert notification
            if (typeof SweetAlertUI !== 'undefined') {
                await SweetAlertUI.paymentRecorded(member.name, amount);
            }
            
            // Send notification
            if (typeof notificationManager !== 'undefined') {
                notificationManager.notifyPaymentRecorded(member.name, amount, loanId);
            }
            
            // Trigger payment reminder check
            if (typeof paymentReminderChecker !== 'undefined') {
                paymentReminderChecker.lastCheckTime = 0; // Reset to check immediately
                paymentReminderChecker.checkDuePayments();
            }

            // Show confirmation with receipt download option
            Swal.fire({
                icon: 'success',
                title: '💳 Payment Recorded',
                text: 'Payment has been recorded successfully.',
                showDenyButton: true,
                showConfirmButton: true,
                confirmButtonText: 'Download Receipt',
                denyButtonText: 'Done',
                confirmButtonColor: '#2563eb',
                denyButtonColor: '#6b7280'
            }).then(async (result) => {
                if (result.isConfirmed) {
                    try {
                        const doc = await ReceiptGenerator.generatePaymentReceipt(payment, loan, member);
                        ReceiptGenerator.downloadReceipt(doc, `Payment_Receipt_${payment.id.substring(0, 8)}.pdf`);
                        UI.showAlert('Receipt downloaded successfully', 'success');
                    } catch (error) {
                        UI.showAlert('Failed to generate receipt: ' + error.message, 'error');
                    }
                }
            });

            UI.clearForm('paymentForm');
            UI.refreshPayments();
            UI.refreshLoans();
            UI.refreshDashboard();
            UI.refreshReports();
            document.dispatchEvent(new CustomEvent('paymentsUpdated'));
            } catch (error) {
            UI.showAlert('Error recording payment: ' + error.message, 'error');
            }
            },

    // Reports
    async showMemberReport(memberId) {
        const member = await Storage.getMemberById(memberId);
        const allLoans = await Storage.getLoans();
        const memberLoans = allLoans.filter(l => l.memberId === memberId);
        const container = document.getElementById('memberReport');

        if (!member) {
            container.innerHTML = '<p class="text-muted text-center">Member not found</p>';
            return;
        }

        let totalLoanAmount = 0;
        let totalPaid = 0;
        let totalRemaining = 0;
        let activeLoansCount = 0;
        let completedLoansCount = 0;

        memberLoans.forEach(loan => {
            totalLoanAmount += loan.amount;
            totalPaid += loan.paid;
            totalRemaining += (loan.amount - loan.paid);
            if (loan.status === 'active') activeLoansCount++;
            if (loan.status === 'completed') completedLoansCount++;
        });

        let html = `
            <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); padding: 1.25rem; border-radius: 0.5rem; margin-bottom: 1rem;">
                <h5 class="mb-0" style="color: #0f172a;">👤 ${member.name}</h5>
                <p class="text-muted mb-0" style="font-size: 0.9rem;">ID: ${member.idNo}</p>
            </div>
            <table class="table table-sm mb-3">
                <tr><td><strong>Email</strong></td><td>${member.email}</td></tr>
                <tr><td><strong>Phone</strong></td><td>${member.phone}</td></tr>
                <tr><td><strong>Member Since</strong></td><td>${new Date(member.createdAt).toLocaleDateString()}</td></tr>
                <tr style="border-top: 2px solid #e5e7eb;"><td><strong>Total Loans</strong></td><td><span class="badge bg-primary">${memberLoans.length}</span></td></tr>
                <tr><td><strong>Active Loans</strong></td><td><span class="badge bg-warning">${activeLoansCount}</span></td></tr>
                <tr><td><strong>Completed Loans</strong></td><td><span class="badge bg-success">${completedLoansCount}</span></td></tr>
                <tr><td><strong>Total Borrowed</strong></td><td>UGX ${UI.formatNumber(totalLoanAmount)}</td></tr>
                <tr><td><strong>Total Repaid</strong></td><td>UGX ${UI.formatNumber(totalPaid)}</td></tr>
                <tr><td><strong>Total Outstanding</strong></td><td><span style="color: #dc2626; font-weight: 600;">UGX ${UI.formatNumber(totalRemaining)}</span></td></tr>
                <tr><td><strong>Repayment Rate</strong></td><td><strong style="color: #10b981;">${totalLoanAmount > 0 ? ((totalPaid / totalLoanAmount) * 100).toFixed(1) : 0}%</strong></td></tr>
            </table>
        `;

        if (memberLoans.length > 0) {
            html += '<hr><h6 class="mt-3 mb-2">📋 Loan Details</h6><div class="table-responsive"><table class="table table-sm"><thead class="table-light"><tr><th>Date</th><th>Amount</th><th>Status</th><th>Paid</th><th>Remaining</th><th>Due Date</th></tr></thead><tbody>';
            memberLoans.forEach(loan => {
                const remaining = loan.amount - loan.paid;
                const statusBadge = loan.status === 'active' ? 
                    '<span class="badge bg-warning text-dark">ACTIVE</span>' : 
                    '<span class="badge bg-success">COMPLETED</span>';
                html += `
                    <tr>
                        <td>${new Date(loan.loanDate).toLocaleDateString()}</td>
                        <td>UGX ${UI.formatNumber(loan.amount)}</td>
                        <td>${statusBadge}</td>
                        <td>UGX ${UI.formatNumber(loan.paid)}</td>
                        <td><strong>UGX ${UI.formatNumber(remaining)}</strong></td>
                        <td>${new Date(loan.dueDate).toLocaleDateString()}</td>
                    </tr>
                `;
            });
            html += '</tbody></table></div>';
        }

        container.innerHTML = html;
    },

    // Utility methods
    isValidEmail(email) {
        // More comprehensive email validation
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!re.test(email)) {
            return false;
        }
        
        // Additional checks
        if (email.startsWith('.') || email.endsWith('.')) {
            return false;
        }
        
        if (email.includes('..')) {
            return false;
        }
        
        const [localPart, domain] = email.split('@');
        
        // Local part should not start or end with a dot
        if (localPart.startsWith('.') || localPart.endsWith('.')) {
            return false;
        }
        
        // Domain should have at least one dot
        if (!domain.includes('.')) {
            return false;
        }
        
        // Domain extension should be at least 2 characters
        const extension = domain.split('.').pop();
        if (extension.length < 2) {
            return false;
        }
        
        return true;
    },

    capitalizeWords(str) {
        if (!str || typeof str !== 'string') return str;
        return str
            .toLowerCase()
            .trim()
            .split(/\s+/)
            .map(word => {
                if (word.length === 0) return word;
                return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
            })
            .join(' ');
    },

    formatPhoneNumber(phone) {
        // Remove all non-digit characters
        const cleaned = phone.replace(/\D/g, '');
        
        // Handle Uganda numbers (256)
        let formatted = cleaned;
        if (cleaned.startsWith('256')) {
            formatted = cleaned;
        } else if (cleaned.startsWith('0')) {
            // Convert 07xx to 256 7xx
            formatted = '256' + cleaned.substring(1);
        } else if (cleaned.length === 9) {
            // Assume it's 7xx or 3xx without country code
            formatted = '256' + cleaned;
        } else if (cleaned.length === 10) {
            // Assume it's 07xx or 03xx (10 digits with leading 0)
            formatted = '256' + cleaned.substring(1);
        }
        
        // Format as (+256) XXX XXX XXX - must be exactly 12 digits
        if (formatted.length === 12 && formatted.startsWith('256')) {
            const part1 = formatted.substring(0, 3);
            const part2 = formatted.substring(3, 6);
            const part3 = formatted.substring(6, 9);
            const part4 = formatted.substring(9, 12);
            return `(+${part1}) ${part2} ${part3} ${part4}`;
        }
        
        return phone; // Return original if doesn't match pattern
    },

    isValidPhoneNumber(phone) {
        // Remove all non-digit characters
        const cleaned = phone.replace(/\D/g, '');
        
        // Must be either:
        // - 10 digits (07xx xxx xxx or 03xx xxx xxx without country code)
        // - 12 digits with country code 256 (256 7xx xxx xxx or 256 3xx xxx xxx)
        
        if (cleaned.length === 10) {
            // Check if it starts with 0 followed by 7 or 3
            if ((cleaned.startsWith('07') || cleaned.startsWith('03')) && /^\d{10}$/.test(cleaned)) {
                return true;
            }
        } else if (cleaned.length === 12) {
            // Check if it starts with 256 followed by 7 or 3
            if (cleaned.startsWith('256') && (cleaned[3] === '7' || cleaned[3] === '3') && /^\d{12}$/.test(cleaned)) {
                return true;
            }
        } else if (cleaned.length === 9) {
            // Check if it's 9 digits starting with 7 or 3 (without leading 0 or country code)
            if ((cleaned.startsWith('7') || cleaned.startsWith('3')) && /^\d{9}$/.test(cleaned)) {
                return true;
            }
        }
        
        return false;
    },

    checkDuplicateRegistration(members, newMember) {
        const { name, email, phone, idNo } = newMember;
        
        // Check for duplicate ID
        if (members.some(m => m.idNo === idNo)) {
            return {
                isDuplicate: true,
                message: `A member with ID number ${idNo} already exists`
            };
        }
        
        // Check for duplicate email
        if (members.some(m => m.email.toLowerCase() === email.toLowerCase())) {
            return {
                isDuplicate: true,
                message: 'A member with this email address already exists'
            };
        }
        
        // Check for duplicate phone (clean before comparison)
        const cleanPhone = phone.replace(/\D/g, '');
        if (members.some(m => m.phone.replace(/\D/g, '') === cleanPhone)) {
            return {
                isDuplicate: true,
                message: 'A member with this phone number already exists'
            };
        }
        
        // Check for duplicate name (case-insensitive)
        if (members.some(m => m.name.toLowerCase() === name.toLowerCase())) {
            return {
                isDuplicate: true,
                message: 'A member with this name already exists'
            };
        }
        
        return { isDuplicate: false };
    },

    calculateDaysRemaining(dueDate) {
        const due = new Date(dueDate);
        const today = new Date();
        const diffTime = due - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return 'OVERDUE by ' + Math.abs(diffDays) + ' days';
        }
        return diffDays + ' days';
    },

    // Savings operations
    async addSaving() {
        const memberId = document.getElementById('savingMember').value;
        const amount = parseFloat(document.getElementById('savingAmount').value);
        const savingDate = document.getElementById('savingDate').value;

        if (!memberId || !amount || !savingDate) {
            UI.showAlert('Please fill in all required fields', 'warning');
            return;
        }

        if (amount <= 0) {
            UI.showAlert('Amount must be greater than 0', 'warning');
            return;
        }

        try {
            // Verify member exists first
            const member = await Storage.getMemberById(memberId);
            if (!member) {
                UI.showAlert('Selected member not found', 'error');
                return;
            }

            const saving = await Storage.addSaving({
                memberId,
                amount: parseFloat(amount),
                savingDate
            });
            Storage.addAuditLog('ADD_SAVING', `UGX ${amount} saving added for member ${member.name}`);
            
            // Show SweetAlert notification
            if (typeof SweetAlertUI !== 'undefined') {
                await SweetAlertUI.savingRecorded(member.name, amount);
            }
            
            // Send notification
            if (typeof notificationManager !== 'undefined') {
                notificationManager.notifySavingRecorded(member.name, amount, saving.id);
            }

            // Show confirmation with receipt download option
            Swal.fire({
                icon: 'success',
                title: '🏦 Saving Recorded',
                text: 'Your savings have been recorded successfully.',
                showDenyButton: true,
                showConfirmButton: true,
                confirmButtonText: 'Download Receipt',
                denyButtonText: 'Done',
                confirmButtonColor: '#2563eb',
                denyButtonColor: '#6b7280'
            }).then(async (result) => {
                if (result.isConfirmed) {
                    try {
                        const doc = await ReceiptGenerator.generateSavingReceipt(saving, member);
                        ReceiptGenerator.downloadReceipt(doc, `Savings_Receipt_${saving.id.substring(0, 8)}.pdf`);
                        UI.showAlert('Receipt downloaded successfully', 'success');
                    } catch (error) {
                        UI.showAlert('Failed to generate receipt: ' + error.message, 'error');
                    }
                }
            });

            UI.clearForm('savingForm');
            UI.refreshSavings();
            UI.refreshDashboard();
            document.dispatchEvent(new CustomEvent('savingsUpdated'));
            } catch (error) {
            if (typeof SweetAlertUI !== 'undefined') {
                SweetAlertUI.error('Error', 'Failed to record saving: ' + error.message);
            } else {
                UI.showAlert('Error recording saving: ' + error.message, 'error');
            }
            }
    },

    // Withdrawal operations
    async addWithdrawal() {
        const memberId = document.getElementById('withdrawalMember').value;
        const amount = parseFloat(document.getElementById('withdrawalAmount').value);
        const withdrawalDate = document.getElementById('withdrawalDate').value;

        if (!memberId || !amount || !withdrawalDate) {
            UI.showAlert('Please fill in all required fields', 'warning');
            return;
        }

        if (amount <= 0) {
            UI.showAlert('Amount must be greater than 0', 'warning');
            return;
        }

        const totalSavings = Storage.getTotalSavingsByMemberId(memberId);
        const totalWithdrawals = Storage.getTotalWithdrawalsByMemberId(memberId);
        const available = totalSavings - totalWithdrawals;

        if (amount > available) {
            UI.showAlert(`Insufficient savings. Available: UGX ${UI.formatNumber(available)}`, 'warning');
            return;
        }

        try {
            // Verify member exists first
            const member = await Storage.getMemberById(memberId);
            if (!member) {
                UI.showAlert('Selected member not found', 'error');
                return;
            }

            const withdrawal = await Storage.addWithdrawal({
                memberId,
                amount: parseFloat(amount),
                withdrawalDate
            });
            Storage.addAuditLog('WITHDRAWAL_RECORDED', `Withdrawal of UGX ${amount} recorded for ${member.name}`);
            
            // Show SweetAlert notification
            if (typeof SweetAlertUI !== 'undefined') {
                await SweetAlertUI.withdrawalRecorded(member.name, amount);
            }
            
            // Send notification
            if (typeof notificationManager !== 'undefined') {
                notificationManager.notifyWithdrawalRecorded(member.name, amount, withdrawal.id);
            }

            // Show confirmation with receipt download option
            Swal.fire({
                icon: 'success',
                title: '💸 Withdrawal Recorded',
                text: 'Your withdrawal has been recorded successfully.',
                showDenyButton: true,
                showConfirmButton: true,
                confirmButtonText: 'Download Receipt',
                denyButtonText: 'Done',
                confirmButtonColor: '#2563eb',
                denyButtonColor: '#6b7280'
            }).then(async (result) => {
                if (result.isConfirmed) {
                    try {
                        const doc = await ReceiptGenerator.generateWithdrawalReceipt(withdrawal, member);
                        ReceiptGenerator.downloadReceipt(doc, `Withdrawal_Receipt_${withdrawal.id.substring(0, 8)}.pdf`);
                        UI.showAlert('Receipt downloaded successfully', 'success');
                    } catch (error) {
                        UI.showAlert('Failed to generate receipt: ' + error.message, 'error');
                    }
                }
            });

            UI.clearForm('withdrawalForm');
            UI.refreshSavings();
            UI.refreshDashboard();
            } catch (error) {
            if (typeof SweetAlertUI !== 'undefined') {
                SweetAlertUI.error('Error', 'Failed to record withdrawal: ' + error.message);
            } else {
                UI.showAlert('Error recording withdrawal: ' + error.message, 'error');
            }
            }
            },

    // Edit loan
    async editLoan(loanId) {
        const loan = await Storage.getLoanById(loanId);
        const member = await Storage.getMemberById(loan.memberId);

        Swal.fire({
            title: 'Reschedule Loan',
            html: `
                <div class="text-start" style="padding: 1rem 0;">
                    <div class="mb-3">
                        <label class="form-label">New Due Date</label>
                        <input type="date" id="editLoanDate" class="form-control" value="${loan.dueDate}">
                    </div>
                    <div class="mb-3">
                        <label class="form-label">New Interest Rate (%)</label>
                        <input type="number" id="editInterestRate" class="form-control" value="${loan.interestRate}" step="0.1" min="0" max="100">
                    </div>
                </div>
            `,
            icon: 'info',
            showCancelButton: true,
            confirmButtonText: 'Update',
            confirmButtonColor: '#2563eb',
            cancelButtonColor: '#6b7280'
        }).then((result) => {
            if (result.isConfirmed) {
                const newDate = document.getElementById('editLoanDate').value;
                const newRate = parseFloat(document.getElementById('editInterestRate').value);

                if (!newDate || isNaN(newRate)) {
                    UI.showAlert('Please fill in all fields', 'warning');
                    return;
                }

                try {
                    Storage.updateLoan(loanId, {
                        dueDate: newDate,
                        interestRate: newRate
                    });
                    Storage.addAuditLog('LOAN_RESCHEDULED', `Loan ${loanId} rescheduled`);
                    UI.showAlert('Loan updated successfully', 'success');
                    UI.refreshLoans();
                    UI.refreshReports();
                } catch (error) {
                    UI.showAlert('Error updating loan: ' + error.message, 'error');
                }
            }
        });
    },

    // Apply penalty
    async applyPenalty(loanId) {
        const loan = await Storage.getLoanById(loanId);
        const penaltyRate = 5; // 5% penalty
        const penalty = (loan.amount * penaltyRate) / 100;

        Swal.fire({
            title: 'Apply Late Payment Penalty?',
            text: `Penalty amount: UGX ${UI.formatNumber(penalty)}`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Apply',
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280'
        }).then((result) => {
            if (result.isConfirmed) {
                try {
                    Storage.updateLoan(loanId, {
                        penalty: (loan.penalty || 0) + penalty
                    });
                    Storage.addAuditLog('PENALTY_APPLIED', `${penaltyRate}% penalty applied to loan ${loanId}`);
                    UI.showAlert('Penalty applied successfully', 'success');
                    UI.refreshLoans();
                    UI.refreshReports();
                } catch (error) {
                    UI.showAlert('Error applying penalty: ' + error.message, 'error');
                }
            }
        });
    },

    // Search functionality
    async searchMembers(query) {
         const members = await Storage.getMembers();
         if (!query) return members;

         query = query.toLowerCase();
         return members.filter(m =>
             m.name.toLowerCase().includes(query) ||
             m.email.toLowerCase().includes(query) ||
             m.phone.includes(query) ||
             m.idNo.includes(query)
         );
     },

     async searchLoans(query) {
         const loans = await Storage.getLoans();
         if (!query) return loans;

         query = query.toLowerCase();
         const loansFiltered = [];
         for (const loan of loans) {
             const member = await Storage.getMemberById(loan.memberId);
             if (member && member.name.toLowerCase().includes(query)) {
                 loansFiltered.push(loan);
             }
         }
         return loansFiltered;
     },

    // Show audit log
    async showAuditLog() {
        const auditLog = (await Storage.getAuditLog()).slice().reverse();

        let html = `
            <div style="max-height: 500px; overflow-y: auto; text-align: left;">
                <table class="table table-sm">
                    <thead>
                        <tr>
                            <th>Timestamp</th>
                            <th>Action</th>
                            <th>Details</th>
                            <th>User Role</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        if (auditLog.length === 0) {
            html += '<tr><td colspan="4" class="text-center text-muted">No audit logs</td></tr>';
        } else {
            auditLog.slice(0, 50).forEach(log => {
                const time = new Date(log.timestamp).toLocaleString();
                html += `
                    <tr>
                        <td style="font-size: 0.8rem;">${time}</td>
                        <td><strong>${log.action}</strong></td>
                        <td style="font-size: 0.85rem;">${log.details}</td>
                        <td><span class="badge bg-info">${log.userRole}</span></td>
                    </tr>
                `;
            });
        }

        html += `</tbody></table></div>`;

        Swal.fire({
            title: 'Audit Log',
            html: html,
            icon: 'info',
            width: '800px',
            confirmButtonColor: '#2563eb'
        });
    },


};

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});