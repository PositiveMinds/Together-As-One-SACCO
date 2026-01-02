// UI Management Module

const UI = {

    // Show/hide pages
    async showPage(pageName) {
        // Hide all pages
         document.querySelectorAll('.page').forEach(page => {
             page.classList.remove('active');
         });

         // Show selected page
         const page = document.getElementById(pageName);
         if (page) {
             page.classList.add('active');
         }

         // Update navigation buttons
         document.querySelectorAll('.nav-btn').forEach(btn => {
             btn.classList.remove('active');
             if (btn.dataset.page === pageName) {
                 btn.classList.add('active');
             }
         });

         // Refresh page content
         await this.refreshPage(pageName);

         // Save current page to localStorage for restore on refresh
         try {
             localStorage.setItem('lastActivePage', pageName);
         } catch (e) {
             console.warn('Could not save page preference:', e);
         }

         // Scroll to top
         window.scrollTo(0, 0);
     },

    // Restore the last active page on load
    async restoreLastPage() {
        try {
            const lastPage = localStorage.getItem('lastActivePage');
            if (lastPage) {
                await this.showPage(lastPage);
                return;
            }
        } catch (e) {
            console.warn('Could not restore last page:', e);
        }
        // Default to dashboard if no saved page
        await this.showPage('dashboard');
    },

    // Refresh specific page
    async refreshPage(pageName) {
        switch (pageName) {
            case 'dashboard':
                await this.refreshDashboard();
                break;
            case 'members':
                await this.refreshMembers();
                break;
            case 'loans':
                await this.refreshLoans();
                break;
            case 'payments':
                await this.refreshPayments();
                break;
            case 'reports':
                await this.refreshReports();
                break;
            case 'savings':
                await this.refreshMemberSelect();
                await this.refreshSavings();
                break;
            case 'transactions':
                if (typeof TransactionManager !== 'undefined' && TransactionManager.loadMemberSelect) {
                    await TransactionManager.loadMemberSelect();
                }
                break;
        }
        
        // Dispatch page change event for charts
        document.dispatchEvent(new CustomEvent('pageChanged', { detail: { page: pageName } }));
    },

    // Dashboard refresh
    allActivities: [],
    currentActivityPage: 1,
    activityPageSize: 5,

    async refreshDashboard() {
        const members = await Storage.getMembers();
        const loans = await Storage.getLoans();
        const payments = await Storage.getPayments();

        const totalLoaned = loans.reduce((sum, l) => sum + l.amount, 0);
        const totalRepaid = payments.reduce((sum, p) => sum + p.amount, 0);
        const outstanding = totalLoaned - totalRepaid;

        const activeLoans = loans.filter(l => l.status === 'active').length;
        const overdueLoans = loans.filter(l => {
            const dueDate = new Date(l.dueDate);
            const today = new Date();
            return l.status === 'active' && dueDate < today;
        }).length;

        // Update stat cards
        document.getElementById('totalMembers').textContent = members.length;
        document.getElementById('activeLoans').textContent = activeLoans;
        document.getElementById('totalLoaned').textContent = `UGX ${this.formatNumber(totalLoaned)}`;
        document.getElementById('totalRepaid').textContent = `UGX ${this.formatNumber(totalRepaid)}`;
        document.getElementById('outstandingBalance').textContent = `UGX ${this.formatNumber(outstanding)}`;
        document.getElementById('overdueLoans').textContent = overdueLoans;

        // Recent activity
        const savings = await Storage.getSavings();
        const allActivities = await Promise.all([
            ...loans.map(async l => ({
                type: 'loan',
                member: (await Storage.getMemberById(l.memberId))?.name || 'Unknown',
                amount: l.amount,
                date: new Date(l.createdAt)
            })),
            ...payments.map(async p => {
                const loan = await Storage.getLoanById(p.loanId);
                return {
                    type: 'payment',
                    member: loan ? (await Storage.getMemberById(loan.memberId))?.name || 'Unknown' : 'Unknown',
                    amount: p.amount,
                    date: new Date(p.createdAt)
                };
            }),
            ...savings.map(async s => ({
                type: 'saving',
                member: (await Storage.getMemberById(s.memberId))?.name || 'Unknown',
                amount: s.amount,
                date: new Date(s.createdAt)
            }))
            ]);
        
        this.allActivities = allActivities.sort((a, b) => b.date - a.date);
        this.currentActivityPage = 1;
        this.renderRecentActivity();

        // Populate activity member filter dropdown
         const filterSelect = document.getElementById('activityMemberFilter');
         if (filterSelect) {
             const uniqueMembers = [...new Set(this.allActivities.map(a => a.member))];
             const currentValue = filterSelect.value;
             filterSelect.innerHTML = '<option value="">All Members</option>' +
                 uniqueMembers.map(m => `<option value="${m}">${m}</option>`).join('');
             filterSelect.value = currentValue;
             
             // Refresh Select2 if available
             if (typeof jQuery !== 'undefined' && jQuery.fn.select2) {
                 setTimeout(() => {
                     jQuery(filterSelect).trigger('change.select2');
                 }, 0);
             }
             // Refresh virtual-select if available
              if (typeof window.VirtualSelect !== 'undefined') {
                  setTimeout(() => {
                      window.VirtualSelect.init({ el: '#activityMemberFilter' });
                  }, 0);
              }
             }
            },

    renderRecentActivity() {
        const end = this.currentActivityPage * this.activityPageSize;
        const displayActivities = this.allActivities.slice(0, end);
        const tbody = document.getElementById('recentActivity');

        if (displayActivities.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-4">No recent activity</td></tr>';
        } else {
            tbody.innerHTML = displayActivities.map(activity => `
                <tr>
                    <td>${activity.member}</td>
                    <td>${activity.type === 'loan' ? 'Loan Disbursed' : activity.type === 'payment' ? 'Payment Received' : 'Saving Recorded'}</td>
                    <td>UGX ${this.formatNumber(activity.amount)}</td>
                    <td>${activity.date.toLocaleDateString()}</td>
                </tr>
            `).join('');
        }

        this.renderActivityPagination();
    },

    loadMoreActivities() {
        const btn = document.getElementById('loadMoreActivities');
        if (btn) {
            btn.classList.add('loading');
            btn.innerHTML = '<i class="ri-time-line"></i><span>Loading...</span>';
        }
        
        // Simulate network delay for better UX
        setTimeout(() => {
            this.currentActivityPage += 1;
            this.renderRecentActivity();
        }, 800);
    },

    renderActivityPagination() {
        const container = document.getElementById('activitiesPagination');
        const itemsShown = this.currentActivityPage * this.activityPageSize;
        const totalItems = this.allActivities.length;

        if (itemsShown >= totalItems) {
            container.innerHTML = '';
            return;
        }

        const html = `<div class="load-more-container">
            <button class="btn-load-more btn-sm" onclick="UI.loadMoreActivities()" id="loadMoreActivities">
                <i class="ri-arrow-down-circle-line"></i>
                <span>More</span>
                <span class="load-more-progress">${itemsShown}/${totalItems}</span>
            </button>
        </div>`;

        container.innerHTML = html;
    },

    filterRecentActivity(memberName) {
        this.currentActivityPage = 1;
        const tbody = document.getElementById('recentActivity');

        let filteredActivities = this.allActivities;
        if (memberName) {
            filteredActivities = this.allActivities.filter(a => a.member === memberName);
        }

        const end = this.currentActivityPage * this.activityPageSize;
        const displayActivities = filteredActivities.slice(0, end);

        if (displayActivities.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-4">No activities found</td></tr>';
        } else {
            tbody.innerHTML = displayActivities.map(activity => `
                <tr>
                    <td>${activity.member}</td>
                    <td>${activity.type === 'loan' ? 'Loan Disbursed' : activity.type === 'payment' ? 'Payment Received' : 'Saving Recorded'}</td>
                    <td>UGX ${this.formatNumber(activity.amount)}</td>
                    <td>${activity.date.toLocaleDateString()}</td>
                </tr>
            `).join('');
        }

        // Store filtered activities and update pagination
        const container = document.getElementById('activitiesPagination');
        const itemsShown = this.currentActivityPage * this.activityPageSize;
        const totalItems = filteredActivities.length;

        if (itemsShown >= totalItems) {
            container.innerHTML = '';
        } else {
             const html = `<div class="load-more-container">
                 <button class="btn-load-more btn-sm" onclick="UI.loadMoreActivities()" id="loadMoreActivities">
                     <i class="ri-arrow-down-circle-line"></i>
                     <span>More</span>
                     <span class="load-more-progress">${itemsShown}/${totalItems}</span>
                 </button>
             </div>`;
            container.innerHTML = html;
        }
    },

    // Members refresh
    async refreshMembers() {
         await this.refreshMembersList();
         await this.refreshMemberSelect();
     },

     allMembers: [],
     currentMembersPage: 1,
     membersPageSize: 5,

     async refreshMembersList() {
          const members = await Storage.getMembers();
          const container = document.getElementById('membersList');
          const viewMode = document.querySelector('.view-btn.active')?.dataset.view || 'card';

          // Update member count pill
          const memberCountPill = document.getElementById('memberCountPill');
          if (memberCountPill) {
              memberCountPill.textContent = members.length;
              console.log('Member count updated to:', members.length);
          } else {
              console.warn('memberCountPill element not found');
          }

          // Update metric cards
          const totalMembersMetric = document.getElementById('totalMembersMetric');
          const activeMembersMetric = document.getElementById('activeMembersMetric');
          const inactiveMembersMetric = document.getElementById('inactiveMembersMetric');
          const newMembersMetric = document.getElementById('newMembersMetric');

          const totalCount = members.length;
          if (totalMembersMetric) {
              totalMembersMetric.textContent = totalCount;
          }

          // All members are considered active (no inactive status in system)
          if (activeMembersMetric) {
              activeMembersMetric.textContent = totalCount;
          }

          // No inactive members
          if (inactiveMembersMetric) {
              inactiveMembersMetric.textContent = '0';
          }

          // Count new members this month
          const now = new Date();
          const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          const newCount = members.filter(m => {
              const joinDate = new Date(m.dateJoined || m.createdAt || new Date());
              return joinDate >= thisMonth;
          }).length;
          if (newMembersMetric) {
              newMembersMetric.textContent = newCount;
          }

          if (members.length === 0) {
              container.innerHTML = '<div class="col-12"><p class="text-muted text-center">No members registered yet</p></div>';
              document.getElementById('membersPagination').innerHTML = '';
              return;
          }

          this.allMembers = members;
          this.currentMembersPage = 1;
          this.renderMembersPage();
      },

     renderMembersPage() {
        const container = document.getElementById('membersList');
        const viewMode = document.querySelector('.view-btn.active')?.dataset.view || 'card';
        const end = this.currentMembersPage * this.membersPageSize;
        const displayMembers = this.allMembers.slice(0, end);

        if (viewMode === 'table') {
            this.renderMembersAsTable(displayMembers, container);
        } else {
            this.renderMembersAsCards(displayMembers, container);
        }

        this.renderMembersPagination();
     },

     loadMoreMembers() {
         const btn = document.getElementById('loadMoreMembers');
         if (btn) {
             btn.classList.add('loading');
             btn.innerHTML = '<i class="ri-time-line"></i><span>Loading...</span>';
         }
         
         setTimeout(() => {
             this.currentMembersPage += 1;
             this.renderMembersPage();
         }, 800);
     },

     renderMembersPagination() {
         const container = document.getElementById('membersPagination');
         const itemsShown = this.currentMembersPage * this.membersPageSize;
         const totalItems = this.allMembers.length;

         if (itemsShown >= totalItems) {
             container.innerHTML = '';
             return;
         }

         const html = `<div class="load-more-container">
             <button class="btn-load-more btn-sm" onclick="UI.loadMoreMembers()" id="loadMoreMembers">
                 <i class="ri-user-line"></i>
                 <span>More</span>
                 <span class="load-more-progress">${itemsShown}/${totalItems}</span>
             </button>
         </div>`;

         container.innerHTML = html;
     },

    renderMembersAsCards(members, container) {
        container.className = 'members-flex';
        container.style.display = 'flex';
        container.style.flexWrap = 'wrap';
       container.style.gap = '1rem';
        container.innerHTML = members.map(member => `
            <div style="flex: 0 0 300px;">
                  <div class="card member-card h-100 p-0">
                     <!-- Card Header with Avatar and Actions -->
                     <div class="member-card-header-section" style="position: relative; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); margin: -1px -1px 0 -1px; border-radius: 12px 12px 0 0; width: calc(100% + 2px);">
                         <div style="display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 1.5rem 1.5rem;">
                             <div class="member-avatar">
                                 ${App.getAvatarHtml(member, 'lg')}
                             </div>
                             <div style="text-align: center; width: 100%; color: white;">
                                 <h6 class="member-card-name mb-1" style="color: white; margin: 0;">${member.name}</h6>
                                 <span class="member-card-badge" style="background: rgba(255,255,255,0.3); color: white;">Active Member</span>
                             </div>
                         </div>
                         <div class="member-card-actions" style="position: absolute; top: 1rem; right: 1rem;">
                             <div class="dropdown">
                                 <button class="btn btn-sm btn-icon" type="button" id="memberDropdown-${member.id}" data-bs-toggle="dropdown" aria-expanded="false" title="Actions" style="background: rgba(255,255,255,0.2); border: none; color: white; width: 2.5rem; height: 2.5rem; display: flex; align-items: center; justify-content: center; padding: 0;">
                                     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style="width: 1.2rem; height: 1.2rem;"><path d="M12 3C10.9 3 10 3.9 10 5C10 6.1 10.9 7 12 7C13.1 7 14 6.1 14 5C14 3.9 13.1 3 12 3ZM12 17C10.9 17 10 17.9 10 19C10 20.1 10.9 21 12 21C13.1 21 14 20.1 14 19C14 17.9 13.1 17 12 17ZM12 10C10.9 10 10 10.9 10 12C10 13.1 10.9 14 12 14C13.1 14 14 13.1 14 12C14 10.9 13.1 10 12 10Z"></path></svg>
                                 </button>
                                 <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="memberDropdown-${member.id}">
                                     <li><a class="dropdown-item" href="#" onclick="App.updateMember('${member.id}'); return false;">${App.icons.edit} Update Info</a></li>
                                     <li><hr class="dropdown-divider"></li>
                                     <li><a class="dropdown-item text-danger" href="#" onclick="App.deleteMember('${member.id}'); return false;">${App.icons.delete} Delete</a></li>
                                 </ul>
                             </div>
                         </div>
                     </div>

                     <!-- Card Body with Contact Information -->
                     <div class="card-body p-3">
                         <div class="member-card-divider mb-3"></div>
                         <div class="member-card-info">
                             <!-- ID Card -->
                             <div class="member-info-row">
                                 <div class="info-icon">
                                     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style="width: 1.25rem; height: 1.25rem;"><path d="M4 22C4 17.5817 7.58172 14 12 14C16.4183 14 20 17.5817 20 22H18C18 18.6863 15.3137 16 12 16C8.68629 16 6 18.6863 6 22H4ZM12 13C8.685 13 6 10.315 6 7C6 3.685 8.685 1 12 1C15.315 1 18 3.685 18 7C18 10.315 15.315 13 12 13ZM12 11C14.21 11 16 9.21 16 7C16 4.79 14.21 3 12 3C9.79 3 8 4.79 8 7C8 9.21 9.79 11 12 11Z"></path></svg>
                                 </div>
                                 <div class="info-content">
                                     <span class="info-label">Member ID</span>
                                     <p class="info-value mb-0">${member.idNo}</p>
                                 </div>
                             </div>

                             <!-- Email -->
                             <div class="member-info-row">
                                 <div class="info-icon">
                                     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style="width: 1.25rem; height: 1.25rem;"><path d="M3 3H21C21.5523 3 22 3.44772 22 4V20C22 20.5523 21.5523 21 21 21H3C2.44772 21 2 20.5523 2 20V4C2 3.44772 2.44772 3 3 3ZM20 7.23792L12.0718 14.338L4 7.21594V19H20V7.23792ZM4.51146 5L12.0619 11.662L19.501 5H4.51146Z"></path></svg>
                                 </div>
                                 <div class="info-content">
                                     <span class="info-label">Email</span>
                                     <p class="info-value mb-0" style="word-break: break-all;">${member.email}</p>
                                 </div>
                             </div>

                             <!-- Phone -->
                             <div class="member-info-row">
                                 <div class="info-icon">
                                     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style="width: 1.25rem; height: 1.25rem;"><path d="M9.36556 10.6821C10.302 12.3288 11.6712 13.698 13.3179 14.6344L14.2024 13.3961C14.4965 12.9845 15.0516 12.8573 15.4956 13.0998C16.9024 13.8683 18.4571 14.3353 20.0789 14.4637C20.599 14.5049 21 14.9389 21 15.4606V19.9234C21 20.4361 20.6122 20.8657 20.1022 20.9181C19.5723 20.9726 19.0377 21 18.5 21C9.93959 21 3 14.0604 3 5.5C3 4.96227 3.02742 4.42771 3.08189 3.89776C3.1343 3.38775 3.56394 3 4.07665 3H8.53942C9.0611 3 9.49513 3.40104 9.5363 3.92109C9.66467 5.54288 10.1317 7.09764 10.9002 8.50444C11.1427 8.9484 11.0155 9.50354 10.6039 9.79757L9.36556 10.6821ZM6.84425 10.0252L8.7442 8.66809C8.20547 7.50514 7.83628 6.27183 7.64727 5H5.00907C5.00303 5.16632 5 5.333 5 5.5C5 12.9558 11.0442 19 18.5 19C18.667 19 18.8337 18.997 19 18.9909V16.3527C17.7282 16.1637 16.4949 15.7945 15.3319 15.2558L13.9748 17.1558C13.4258 16.9425 12.8956 16.6915 12.3874 16.4061L12.3293 16.373C10.3697 15.2587 8.74134 13.6303 7.627 11.6707L7.59394 11.6126C7.30849 11.1044 7.05754 10.5742 6.84425 10.0252Z"></path></svg>
                                 </div>
                                 <div class="info-content">
                                     <span class="info-label">Phone</span>
                                     <p class="info-value mb-0">${member.phone}</p>
                                 </div>
                             </div>

                             <!-- Joined Date -->
                             <div class="member-info-row">
                                 <div class="info-icon">
                                     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style="width: 1.25rem; height: 1.25rem;"><path d="M9 1V3H15V1H17V3H21C21.5523 3 22 3.44772 22 4V20C22 20.5523 21.5523 21 21 21H3C2.44772 21 2 20.5523 2 20V4C2 3.44772 2.44772 3 3 3H7V1H9ZM20 11H4V19H20V11ZM8 13V15H6V13H8ZM13 13V15H11V13H13ZM18 13V15H16V13H18ZM7 5H4V9H20V5H17V7H15V5H9V7H7V5Z"></path></svg>
                                 </div>
                                 <div class="info-content">
                                     <span class="info-label">Member Since</span>
                                     <p class="info-value mb-0">${new Date(member.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                                 </div>
                             </div>
                         </div>
                     </div>
                 </div>
             </div>
         `).join('');
     },

    renderMembersAsTable(members, container) {
         container.className = 'col-12';
         let html = `
             <div class="table-responsive">
                 <table class="table table-hover mb-0 members-table">
                     <thead class="table-light">
                         <tr>
                             <th style="width: 60px; text-align: center;">Photo</th>
                             <th style="width: 25%;">Name</th>
                             <th style="width: 15%;">ID Number</th>
                             <th style="width: 25%;">Email</th>
                             <th style="width: 15%;">Phone</th>
                             <th style="width: 15%;">Joined</th>
                             <th style="width: 50px; text-align: center;">Actions</th>
                         </tr>
                     </thead>
                     <tbody>
                         ${members.map(member => {
                             const initials = App.getInitials(member.name);
                             const bgColor = App.getAvatarColor(member.name);
                             return `
                             <tr class="member-table-row">
                                 <td style="text-align: center; vertical-align: middle; padding: 12px 8px;">
                                     <div style="position: relative; display: inline-block;">
                                         ${member.photo ? 
                                                 `<img src="${member.photo}?t=${member.updatedAt || Date.now()}" alt="${member.name}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover; display: inline-block; border: 2px solid #e0e0e0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);" title="${member.name}">` :
                                                 `<div style="width: 40px; height: 40px; background: ${bgColor}; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 0.75rem; border: 2px solid ${bgColor}; box-shadow: 0 2px 4px rgba(0,0,0,0.1);" title="${member.name}">${initials}</div>`
                                             }
                                     </div>
                                 </td>
                                 <td style="vertical-align: middle;"><strong>${member.name}</strong></td>
                                 <td style="vertical-align: middle;"><span class="badge bg-light text-dark">${member.idNo}</span></td>
                                 <td style="vertical-align: middle;"><small>${member.email}</small></td>
                                 <td style="vertical-align: middle;"><small>${member.phone}</small></td>
                                 <td style="vertical-align: middle;"><small>${new Date(member.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</small></td>
                                 <td style="text-align: center; vertical-align: middle; padding: 12px 8px;">
                                     <div class="dropdown">
                                          <button class="btn btn-sm btn-outline-secondary" type="button" id="memberDropdownTable-${member.id}" data-bs-toggle="dropdown" aria-expanded="false" title="Actions" style="padding: 0.35rem 0.5rem;">
                                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style="width: 1rem; height: 1rem; vertical-align: -2px;"><path d="M12 3C10.9 3 10 3.9 10 5C10 6.1 10.9 7 12 7C13.1 7 14 6.1 14 5C14 3.9 13.1 3 12 3ZM12 17C10.9 17 10 17.9 10 19C10 20.1 10.9 21 12 21C13.1 21 14 20.1 14 19C14 17.9 13.1 17 12 17ZM12 10C10.9 10 10 10.9 10 12C10 13.1 10.9 14 12 14C13.1 14 14 13.1 14 12C14 10.9 13.1 10 12 10Z"></path></svg>
                                          </button>
                                         <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="memberDropdownTable-${member.id}">
                                             <li><a class="dropdown-item" href="#" onclick="App.updateMember('${member.id}'); return false;">${App.icons.edit} Update</a></li>
                                              <li><hr class="dropdown-divider"></li>
                                              <li><a class="dropdown-item text-danger" href="#" onclick="App.deleteMember('${member.id}'); return false;">${App.icons.delete} Delete</a></li>
                                         </ul>
                                     </div>
                                 </td>
                             </tr>
                         `}).join('')}
                     </tbody>
                 </table>
             </div>
         `;
         container.innerHTML = html;
     },

    async refreshMemberSelect() {
         const members = await Storage.getMembers();
         const selects = ['loanMember', 'reportMember', 'savingMember', 'withdrawalMember'];

        selects.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (select) {
                const currentValue = select.value;
                select.innerHTML = '<option value="">Select Member</option>' +
                    members.map(m => `<option value="${m.id}">${(m.name || '').trim()}</option>`).join('');
                select.value = currentValue;
                
                // Refresh Select2 if available
                if (typeof jQuery !== 'undefined' && jQuery.fn.select2) {
                    setTimeout(() => {
                        jQuery(select).trigger('change.select2');
                    }, 0);
                }
                
                // Refresh virtual-select if available
                if (typeof window.VirtualSelect !== 'undefined') {
                    setTimeout(() => {
                        window.VirtualSelect.init({ el: '#' + selectId });
                    }, 0);
                }
            }
        });
    },

                // Loans refresh
    allLoans: [],
    currentLoansPage: 1,
    loansPageSize: 5,

    async refreshLoans() {
        await this.refreshMemberSelect();
        await this.refreshLoansList();
        await this.refreshLoanSelect();
    },

    async refreshLoansList() {
         const loans = await Storage.getLoans();
         const tbody = document.getElementById('loansTableBody');

         if (loans.length === 0) {
             tbody.innerHTML = '<tr><td colspan="7" class="no-data">No loans created yet</td></tr>';
             document.getElementById('loansPagination').innerHTML = '';
             return;
         }

         this.allLoans = loans;
         this.currentLoansPage = 1;
         this.renderLoansPage();
    },

    async renderLoansPage() {
         const tbody = document.getElementById('loansTableBody');
         const end = this.currentLoansPage * this.loansPageSize;
         const displayLoans = this.allLoans.slice(0, end);

         const rows = await Promise.all(displayLoans.map(async loan => {
             const member = await Storage.getMemberById(loan.memberId);
             const borrowerName = loan.borrowerType === 'non-member' ? loan.borrowerName : member?.name || 'Unknown';
             const loanTypeLabel = loan.loanType ? loan.loanType.charAt(0).toUpperCase() + loan.loanType.slice(1) : 'Normal';
             const remaining = loan.amount - loan.paid;
             const dueDate = new Date(loan.dueDate);
             const today = new Date();
             const isOverdue = loan.status === 'active' && dueDate < today;
             const statusClass = isOverdue ? 'status-overdue' :
                 loan.status === 'completed' ? 'status-completed' : 'status-active';
             const statusText = isOverdue ? 'OVERDUE' :
                 loan.status === 'completed' ? 'COMPLETED' : 'ACTIVE';

             // Calculate monthly installment
             const totalInterest = (loan.amount * loan.interestRate * loan.term) / (12 * 100);
             const totalAmount = loan.amount + totalInterest;
             const monthlyInstallment = totalAmount / loan.term;

             let actions = `<button class="btn btn-secondary btn-sm icon-btn" title="View Details" onclick="App.viewLoanDetails('${loan.id}')">${App.icons.view}</button>`;
             if (isOverdue) {
                 actions += ` <button class="btn btn-warning btn-sm icon-btn" title="Apply Penalty" onclick="App.applyPenalty('${loan.id}')"><i class="ri-alert-line"></i></button>`;
             }
             actions += ` <button class="btn btn-info btn-sm icon-btn" title="Edit Loan" onclick="App.editLoan('${loan.id}')">${App.icons.edit}</button>`;
             actions += ` <button class="btn btn-danger btn-sm icon-btn" title="Delete Loan" onclick="App.deleteLoan('${loan.id}')">${App.icons.delete}</button>`;

             return `
                 <tr>
                     <td>${borrowerName}</td>
                     <td><span class="badge bg-primary">${loanTypeLabel}</span></td>
                     <td>UGX ${this.formatNumber(loan.amount)}</td>
                     <td>${loan.interestRate}%</td>
                     <td>UGX ${this.formatNumber(monthlyInstallment.toFixed(0))}</td>
                     <td>${dueDate.toLocaleDateString()}</td>
                     <td><span class="${statusClass}">${statusText}</span></td>
                     <td>UGX ${this.formatNumber(remaining)}</td>
                     <td>${actions}</td>
                 </tr>
             `;
             }));
             tbody.innerHTML = rows.join('');
             this.renderLoansPagination();
    },

    loadMoreLoans() {
         const btn = document.getElementById('loadMoreLoans');
         if (btn) {
             btn.classList.add('loading');
             btn.innerHTML = '<i class="ri-time-line"></i><span>Loading...</span>';
         }
         
         setTimeout(() => {
             this.currentLoansPage += 1;
             this.renderLoansPage();
         }, 300);
    },

    renderLoansPagination() {
         const container = document.getElementById('loansPagination');
         const itemsShown = this.currentLoansPage * this.loansPageSize;
         const totalItems = this.allLoans.length;

         if (itemsShown >= totalItems) {
             container.innerHTML = '';
             return;
         }

         const html = `<div class="load-more-container">
             <button class="btn-load-more btn-sm" onclick="UI.loadMoreLoans()" id="loadMoreLoans">
                 <i class="bi bi-wallet2"></i>
                 <span>More</span>
                 <span class="load-more-progress">${itemsShown}/${totalItems}</span>
             </button>
         </div>`;

         container.innerHTML = html;
    },

    async refreshLoanSelect() {
         const loans = (await Storage.getLoans()).filter(l => l.status === 'active');
        const select = document.getElementById('paymentLoan');

        if (select) {
            const currentValue = select.value;
            const options = await Promise.all(loans.map(async l => {
                    const member = await Storage.getMemberById(l.memberId);
                     const remaining = l.amount - l.paid;
                     const memberName = (member?.name || 'Unknown').trim();
                     return `<option value="${l.id}">${memberName} - UGX ${this.formatNumber(remaining)} remaining</option>`;
                 }));
             select.innerHTML = '<option value="">Select Loan</option>' + options.join('');
             select.value = currentValue;
             
             // Refresh virtual-select if available
             if (typeof window.VirtualSelect !== 'undefined') {
                 setTimeout(() => {
                     window.VirtualSelect.init({ el: '#paymentLoan' });
                 }, 0);
             }
             }
             },

             // Payments refresh
    allPayments: [],
    currentPaymentsPage: 1,
    paymentsPageSize: 5,

    async refreshPayments() {
        const payments = await Storage.getPayments();
        const tbody = document.getElementById('paymentsTableBody');

        if (payments.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-4">No payments recorded yet</td></tr>';
            document.getElementById('paymentsPagination').innerHTML = '';
            await this.refreshLoanSelect();
            return;
        }

        this.allPayments = payments.sort((a, b) =>
            new Date(b.createdAt) - new Date(a.createdAt)
        );
        this.currentPaymentsPage = 1;
        this.renderPaymentsPage();
        await this.refreshLoanSelect();
    },

    async renderPaymentsPage() {
        const tbody = document.getElementById('paymentsTableBody');
        const end = this.currentPaymentsPage * this.paymentsPageSize;
        const displayPayments = this.allPayments.slice(0, end);

        const rows = await Promise.all(displayPayments.map(async payment => {
            const loan = await Storage.getLoanById(payment.loanId);
            const member = loan ? await Storage.getMemberById(loan.memberId) : null;
            const paymentDate = new Date(payment.paymentDate);

            return `
                <tr>
                    <td>${member?.name || 'Unknown'}</td>
                    <td>UGX ${this.formatNumber(payment.amount)}</td>
                    <td>${paymentDate.toLocaleDateString()}</td>
                    <td>
                        Loan: UGX ${this.formatNumber(loan?.amount || 0)} 
                        (${loan?.paid || 0} / ${loan?.amount || 0} paid)
                    </td>
                </tr>
            `;
        }));
        tbody.innerHTML = rows.join('');
        this.renderPaymentsPagination();
    },

    loadMorePayments() {
        const btn = document.getElementById('loadMorePayments');
        if (btn) {
            btn.classList.add('loading');
            btn.innerHTML = '<i class="ri-time-line"></i><span>Loading...</span>';
        }
        
        setTimeout(() => {
            this.currentPaymentsPage += 1;
            this.renderPaymentsPage();
        }, 300);
    },

    renderPaymentsPagination() {
        const container = document.getElementById('paymentsPagination');
        const itemsShown = this.currentPaymentsPage * this.paymentsPageSize;
        const totalItems = this.allPayments.length;

        if (itemsShown >= totalItems) {
            container.innerHTML = '';
            return;
        }

        const html = `<div class="load-more-container">
            <button class="btn-load-more btn-sm" onclick="UI.loadMorePayments()" id="loadMorePayments">
                <i class="bi bi-cash-check"></i>
                <span>More</span>
                <span class="load-more-progress">${itemsShown}/${totalItems}</span>
            </button>
        </div>`;

        container.innerHTML = html;
    },

    // Reports refresh
    async refreshReports() {
         await this.refreshMemberSelect();
         await this.refreshLoanReport();
         await this.refreshRankingReport();
         await this.refreshProfitsSummary();
         await this.refreshProfitDistribution();
         await this.refreshMemberProfits();
     },

    async refreshLoanReport() {
         const loans = await Storage.getLoans();
        const container = document.getElementById('loanReport');

        if (loans.length === 0) {
            container.innerHTML = '<p class="text-muted text-center">No loans to display</p>';
            return;
        }

        const totalLoaned = loans.reduce((sum, l) => sum + l.amount, 0);
        const totalRepaid = loans.reduce((sum, l) => sum + l.paid, 0);
        const outstanding = totalLoaned - totalRepaid;
        const activeCount = loans.filter(l => l.status === 'active').length;
        const completedCount = loans.filter(l => l.status === 'completed').length;

        container.innerHTML = `
            <table class="report-output">
                <tr><td>Total Loans Disbursed</td><td><strong>UGX ${this.formatNumber(totalLoaned)}</strong></td></tr>
                <tr><td>Total Amount Repaid</td><td><strong>UGX ${this.formatNumber(totalRepaid)}</strong></td></tr>
                <tr><td>Outstanding Balance</td><td><strong>UGX ${this.formatNumber(outstanding)}</strong></td></tr>
                <tr><td>Repayment Rate</td><td><strong>${((totalRepaid / totalLoaned) * 100).toFixed(1)}%</strong></td></tr>
                <tr><td>Active Loans</td><td><strong>${activeCount}</strong></td></tr>
                <tr><td>Completed Loans</td><td><strong>${completedCount}</strong></td></tr>
            </table>
        `;
        },

        async refreshLoanReportForMember(memberId) {
        const loans = await Storage.getLoans();
        const memberLoans = loans.filter(l => l.memberId === memberId);
        const container = document.getElementById('loanReport');

        if (memberLoans.length === 0) {
            container.innerHTML = '<p class="text-muted text-center">No loans for this member</p>';
            return;
        }

        const totalLoaned = memberLoans.reduce((sum, l) => sum + l.amount, 0);
        const totalRepaid = memberLoans.reduce((sum, l) => sum + l.paid, 0);
        const outstanding = totalLoaned - totalRepaid;
        const activeCount = memberLoans.filter(l => l.status === 'active').length;
        const completedCount = memberLoans.filter(l => l.status === 'completed').length;

        container.innerHTML = `
            <table class="report-output">
                <tr><td>Total Loans Disbursed</td><td><strong>UGX ${this.formatNumber(totalLoaned)}</strong></td></tr>
                <tr><td>Total Amount Repaid</td><td><strong>UGX ${this.formatNumber(totalRepaid)}</strong></td></tr>
                <tr><td>Outstanding Balance</td><td><strong>UGX ${this.formatNumber(outstanding)}</strong></td></tr>
                <tr><td>Repayment Rate</td><td><strong>${totalLoaned > 0 ? ((totalRepaid / totalLoaned) * 100).toFixed(1) : 0}%</strong></td></tr>
                <tr><td>Active Loans</td><td><strong>${activeCount}</strong></td></tr>
                <tr><td>Completed Loans</td><td><strong>${completedCount}</strong></td></tr>
            </table>
        `;
        },

        async refreshRankingReport() {
         const loans = await Storage.getLoans();
         const container = document.getElementById('rankingReport');

         if (loans.length === 0) {
             container.innerHTML = '<p class="text-muted text-center">No loans to display</p>';
             return;
         }

         const debtors = {};
         for (const loan of loans) {
             const member = await Storage.getMemberById(loan.memberId);
            const memberName = member?.name || 'Unknown';
            const remaining = loan.amount - loan.paid;

            if (!debtors[memberName]) {
                debtors[memberName] = 0;
            }
            debtors[memberName] += remaining;
            }

        const sorted = Object.entries(debtors)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 20);

        if (sorted.length === 0) {
            container.innerHTML = '<p class="text-muted text-center">No outstanding balances</p>';
            return;
        }

        let html = '<table class="w-100"><thead><tr><th>Rank</th><th>Member</th><th>Outstanding Balance (UGX)</th></tr></thead><tbody>';
        sorted.forEach((entry, index) => {
            html += `
                <tr>
                    <td>${index + 1}</td>
                    <td>${entry[0]}</td>
                    <td><strong>UGX ${this.formatNumber(entry[1])}</strong></td>
                </tr>
            `;
        });
        html += '</tbody></table>';
        container.innerHTML = html;
    },

    async refreshProfitsSummary() {
        const loans = await Storage.getLoans();
        const container = document.getElementById('profitsSummary');

        if (loans.length === 0) {
            container.innerHTML = '<p class="text-muted text-center">No loans to display</p>';
            return;
        }

        // Calculate total interest/profits
        let totalProfits = 0;
        let totalInterestGenerated = 0;

        for (const loan of loans) {
            const interestAmount = (loan.amount * loan.interestRate * loan.term) / (12 * 100);
            totalInterestGenerated += interestAmount;
            totalProfits += interestAmount;
        }

        const avgProfitPerLoan = loans.length > 0 ? totalProfits / loans.length : 0;
        const totalLoans = loans.length;

        container.innerHTML = `
            <table class="report-output">
                <tr><td>Total Loans</td><td><strong>${totalLoans}</strong></td></tr>
                <tr><td>Total Interest Generated</td><td><strong>UGX ${this.formatNumber(totalProfits.toFixed(0))}</strong></td></tr>
                <tr><td>Average Profit Per Loan</td><td><strong>UGX ${this.formatNumber(avgProfitPerLoan.toFixed(0))}</strong></td></tr>
            </table>
        `;
    },

    async refreshProfitDistribution() {
        const loans = await Storage.getLoans();
        const container = document.getElementById('profitDistribution');

        if (loans.length === 0) {
            container.innerHTML = '<p class="text-muted text-center">No data available</p>';
            return;
        }

        // Calculate total profits for distribution
        let totalProfits = 0;
        const memberProfits = {};

        for (const loan of loans) {
            const member = await Storage.getMemberById(loan.memberId);
            const memberName = member?.name || 'Unknown';
            const interestAmount = (loan.amount * loan.interestRate * loan.term) / (12 * 100);
            
            totalProfits += interestAmount;
            
            if (!memberProfits[memberName]) {
                memberProfits[memberName] = 0;
            }
            memberProfits[memberName] += interestAmount;
        }

        // Color palette for distribution bars - Vibrant colors
        const colors = [
            { bg: '#FF6B6B15', gradient: 'linear-gradient(135deg, #FF6B6B, #FF1744)' },
            { bg: '#4ECDC415', gradient: 'linear-gradient(135deg, #00D9FF, #00BCD4)' },
            { bg: '#FFD93D15', gradient: 'linear-gradient(135deg, #FFD700, #FFC107)' },
            { bg: '#6BCF7F15', gradient: 'linear-gradient(135deg, #00E676, #76FF03)' },
            { bg: '#FF85C015', gradient: 'linear-gradient(135deg, #FF1493, #FF69B4)' },
            { bg: '#9B59B615', gradient: 'linear-gradient(135deg, #9C27B0, #E040FB)' },
            { bg: '#FF6B9D15', gradient: 'linear-gradient(135deg, #FF006E, #FF5C93)' },
            { bg: '#00D4FF15', gradient: 'linear-gradient(135deg, #00BFFF, #1E90FF)' }
        ];

        // Create distribution visualization
        let html = `
            <div style="padding: 1.5rem 0;">
                <style>
                    .profit-bar-container {
                        animation: slideInUp 0.5s ease-out backwards;
                    }
                    @keyframes slideInUp {
                        from {
                            opacity: 0;
                            transform: translateY(20px);
                        }
                        to {
                            opacity: 1;
                            transform: translateY(0);
                        }
                    }
                    .profit-bar-fill {
                        animation: fillBar 1s ease-out forwards;
                        box-shadow: 0 4px 8px rgba(0,0,0,0.15);
                    }
                    @keyframes fillBar {
                        from {
                            width: 0 !important;
                            opacity: 0;
                        }
                        to {
                            width: var(--bar-width);
                            opacity: 1;
                        }
                    }
                </style>
        `;

        Object.entries(memberProfits)
            .sort((a, b) => b[1] - a[1])
            .forEach((entry, index) => {
                const percentage = totalProfits > 0 ? ((entry[1] / totalProfits) * 100).toFixed(1) : 0;
                const color = colors[index % colors.length];
                const memberInitials = entry[0].split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
                
                html += `
                    <div class="profit-bar-container" style="margin-bottom: 1.5rem; animation-delay: ${index * 0.1}s;">
                        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem; gap: 1rem;">
                            <div style="display: flex; align-items: center; gap: 0.75rem; flex: 1; min-width: 0;">
                                <div style="display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 50%; background: ${color.gradient}; color: white; font-weight: bold; font-size: 0.8rem; flex-shrink: 0;">
                                    ${memberInitials}
                                </div>
                                <div style="min-width: 0; flex: 1;">
                                    <div style="font-weight: 600; color: #1a1a1a; font-size: 0.95rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                        ${index + 1}. ${entry[0]}
                                    </div>
                                </div>
                            </div>
                            <div style="display: flex; align-items: center; gap: 1rem; flex-shrink: 0;">
                                <div style="text-align: right;">
                                    <div style="font-weight: 700; background: ${color.gradient}; -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; font-size: 1.2rem;">${percentage}%</div>
                                    <div style="font-size: 0.75rem; color: #666; margin-top: 0.2rem;">UGX ${this.formatNumber(entry[1].toFixed(0))}</div>
                                </div>
                            </div>
                        </div>
                        <div style="background: ${color.bg}; border-radius: 8px; height: 32px; overflow: hidden; position: relative;">
                            <div class="profit-bar-fill" style="background: ${color.gradient}; height: 100%; border-radius: 8px; --bar-width: ${percentage}%; position: relative; overflow: hidden;">
                                <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent); animation: shimmer 2s infinite;"></div>
                            </div>
                        </div>
                    </div>
                `;
            });

        html += `
                <style>
                    @keyframes shimmer {
                        0% { transform: translateX(-100%); }
                        100% { transform: translateX(100%); }
                    }
                </style>
            </div>
        `;
        container.innerHTML = html;
    },

    async refreshMemberProfits() {
        const loans = await Storage.getLoans();
        const tbody = document.getElementById('memberProfitsTableBody');

        if (loans.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-4">No loans to display</td></tr>';
            return;
        }

        // Calculate profits by member
        let totalAllProfits = 0;
        const memberProfitsData = {};

        for (const loan of loans) {
            const member = await Storage.getMemberById(loan.memberId);
            const memberName = member?.name || 'Unknown';
            const interestAmount = (loan.amount * loan.interestRate * loan.term) / (12 * 100);
            
            totalAllProfits += interestAmount;
            
            if (!memberProfitsData[memberName]) {
                memberProfitsData[memberName] = {
                    loansCount: 0,
                    totalInterest: 0,
                    memberId: loan.memberId
                };
            }
            memberProfitsData[memberName].loansCount += 1;
            memberProfitsData[memberName].totalInterest += interestAmount;
        }

        // Create table rows
        const rows = Object.entries(memberProfitsData)
            .sort((a, b) => b[1].totalInterest - a[1].totalInterest)
            .map(entry => {
                const percentage = totalAllProfits > 0 ? ((entry[1].totalInterest / totalAllProfits) * 100).toFixed(1) : 0;
                return `
                    <tr>
                        <td><strong>${entry[0]}</strong></td>
                        <td>${entry[1].loansCount}</td>
                        <td>UGX ${this.formatNumber(entry[1].totalInterest.toFixed(0))}</td>
                        <td>${percentage}%</td>
                    </tr>
                `;
            });

        tbody.innerHTML = rows.join('');
    },

    // Utility methods
    formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    },

    showAlert(message, type = 'info') {
        const typeConfig = {
            'success': {
                icon: 'success',
                title: 'Success'
            },
            'error': {
                icon: 'error',
                title: 'Error'
            },
            'warning': {
                icon: 'warning',
                title: 'Warning'
            },
            'info': {
                icon: 'info',
                title: 'Information'
            }
        };

        const config = typeConfig[type] || typeConfig['info'];

        Swal.fire({
            icon: config.icon,
            title: config.title,
            text: message,
            confirmButtonText: 'OK',
            confirmButtonColor: '#2563eb'
        });
    },

    clearForm(formId) {
        document.getElementById(formId).reset();
    },

    // Savings refresh
    allSavingsMembers: [],
    currentSavingsPage: 1,
    savingsPageSize: 5,

    async refreshSavings() {
        const savings = await Storage.getSavings();
        const members = await Storage.getMembers();

        // Calculate overall savings stats
        const totalSavings = savings.reduce((sum, s) => sum + s.amount, 0);
        const activeSavers = new Set(savings.map(s => s.memberId)).size;
        const avgSavings = activeSavers > 0 ? totalSavings / activeSavers : 0;

        // Update overall stats
        document.getElementById('totalSavings').textContent = `UGX ${this.formatNumber(totalSavings)}`;
        document.getElementById('activeSavers').textContent = activeSavers;
        document.getElementById('avgSavings').textContent = `UGX ${this.formatNumber(avgSavings.toFixed(0))}`;

        // Build member savings table
        const savingsByMember = {};
        for (const member of members) {
            const memberSavings = await Storage.getSavingsByMemberId(member.id);
            if (memberSavings.length > 0) {
                const totalAmount = memberSavings.reduce((sum, s) => sum + s.amount, 0);
                const lastSaving = memberSavings[memberSavings.length - 1];
                const avgAmount = (totalAmount / memberSavings.length).toFixed(0);

                savingsByMember[member.id] = {
                    name: member.name,
                    totalAmount,
                    count: memberSavings.length,
                    lastDate: new Date(lastSaving.createdAt),
                    avgAmount
                    };
                    }
                    }

        // Render savings table
        this.allSavingsMembers = Object.values(savingsByMember)
            .sort((a, b) => b.totalAmount - a.totalAmount);
        this.currentSavingsPage = 1;
        this.renderSavingsPage();
        
        // Render savings distribution
        this.refreshSavingsDistribution(this.allSavingsMembers);
    },

    renderSavingsPage() {
        const tbody = document.getElementById('savingsTableBody');
        const end = this.currentSavingsPage * this.savingsPageSize;
        const displayMembers = this.allSavingsMembers.slice(0, end);

        if (displayMembers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4">No savings data available</td></tr>';
        } else {
            tbody.innerHTML = displayMembers.map(member => `
                <tr>
                    <td><strong>${member.name}</strong></td>
                    <td>UGX ${this.formatNumber(member.totalAmount)}</td>
                    <td>${member.count}</td>
                    <td>${member.lastDate.toLocaleDateString()}</td>
                    <td>UGX ${this.formatNumber(member.avgAmount)}</td>
                </tr>
            `).join('');
        }

        this.renderSavingsPagination();
    },

    loadMoreSavings() {
        const btn = document.getElementById('loadMoreSavings');
        if (btn) {
            btn.classList.add('loading');
            btn.innerHTML = '<i class="ri-time-line"></i><span>Loading...</span>';
        }
        
        setTimeout(() => {
            this.currentSavingsPage += 1;
            this.renderSavingsPage();
        }, 300);
    },

    renderSavingsPagination() {
        const container = document.getElementById('savingsPagination');
        const itemsShown = this.currentSavingsPage * this.savingsPageSize;
        const totalItems = this.allSavingsMembers.length;

        if (itemsShown >= totalItems) {
            container.innerHTML = '';
            return;
        }

        const html = `<div class="load-more-container">
            <button class="btn-load-more btn-sm" onclick="UI.loadMoreSavings()" id="loadMoreSavings">
                <i class="bi bi-coin"></i>
                <span>More</span>
                <span class="load-more-progress">${itemsShown}/${totalItems}</span>
            </button>
        </div>`;

        container.innerHTML = html;
    },

    refreshSavingsDistribution(savingsData) {
        const container = document.getElementById('savingsDistribution');

        if (savingsData.length === 0) {
            container.innerHTML = '<p class="text-muted text-center">No data available</p>';
            return;
        }

        // Create distribution chart/list
        let html = '<div style="padding: 1rem 0;">';

        savingsData.forEach((member, index) => {
            const percentage = savingsData.reduce((sum, m) => sum + m.totalAmount, 0) > 0 ?
                ((member.totalAmount / savingsData.reduce((sum, m) => sum + m.totalAmount, 0)) * 100).toFixed(1) :
                0;

            html += `
                <div class="mb-3">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <strong style="font-size: 0.95rem;">${index + 1}. ${member.name}</strong>
                        <span style="font-size: 0.9rem; color: var(--text-muted);">${percentage}%</span>
                    </div>
                    <div class="savings-progress-bar">
                        <div class="savings-progress-fill" style="width: ${percentage}%"></div>
                    </div>
                    <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.25rem;">
                        UGX ${this.formatNumber(member.totalAmount)}
                    </div>
                </div>
            `;
        });

        html += '</div>';
        container.innerHTML = html;
    },

    // Filter members
    async filterMembers(query) {
         const members = await App.searchMembers(query);
         const container = document.getElementById('membersList');
         const viewMode = document.querySelector('.view-btn.active')?.dataset.view || 'card';

         if (members.length === 0) {
             container.innerHTML = '<div class="col-12"><p class="text-muted text-center">No members found</p></div>';
             document.getElementById('membersPagination').innerHTML = '';
             return;
         }

         if (viewMode === 'table') {
             this.renderMembersAsTable(members, container);
         } else {
             this.renderMembersAsCards(members, container);
         }
         document.getElementById('membersPagination').innerHTML = '';
     },

    // Filter loans
     async filterLoans(query) {
         const loans = await App.searchLoans(query);
         const tbody = document.getElementById('loansTableBody');

         if (loans.length === 0) {
             tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No loans found</td></tr>';
             document.getElementById('loansPagination').innerHTML = '';
             return;
         }

        tbody.innerHTML = loans.map(loan => {
            const member = Storage.getMemberById(loan.memberId);
            const remaining = loan.amount - loan.paid;
            const dueDate = new Date(loan.dueDate);
            const today = new Date();
            const isOverdue = loan.status === 'active' && dueDate < today;
            const statusClass = isOverdue ? 'status-overdue' :
                loan.status === 'completed' ? 'status-completed' : 'status-active';
            const statusText = isOverdue ? 'OVERDUE' :
                loan.status === 'completed' ? 'COMPLETED' : 'ACTIVE';

            const totalInterest = (loan.amount * loan.interestRate * loan.term) / (12 * 100);
            const totalAmount = loan.amount + totalInterest;
            const monthlyInstallment = totalAmount / loan.term;

            let filterActions = `<button class="btn btn-secondary btn-sm icon-btn" title="View Details" onclick="App.viewLoanDetails('${loan.id}')">${App.icons.view}</button>`;
            if (isOverdue) {
                filterActions += ` <button class="btn btn-warning btn-sm icon-btn" title="Apply Penalty" onclick="App.applyPenalty('${loan.id}')"><i class="ri-alert-line"></i></button>`;
            }
            filterActions += ` <button class="btn btn-info btn-sm icon-btn" title="Edit Loan" onclick="App.editLoan('${loan.id}')">${App.icons.edit}</button>`;
            filterActions += ` <button class="btn btn-danger btn-sm icon-btn" title="Delete Loan" onclick="App.deleteLoan('${loan.id}')">${App.icons.delete}</button>`;

            return `
                <tr>
                    <td>${member?.name || 'Unknown'}</td>
                    <td>UGX ${this.formatNumber(loan.amount)}</td>
                    <td>UGX ${this.formatNumber(monthlyInstallment.toFixed(0))}</td>
                    <td>${dueDate.toLocaleDateString()}</td>
                    <td><span class="${statusClass}">${statusText}</span></td>
                    <td>UGX ${this.formatNumber(remaining)}</td>
                    <td>${filterActions}</td>
                </tr>
            `;
            }).join('');
            document.getElementById('loansPagination').innerHTML = '';
            }
            };