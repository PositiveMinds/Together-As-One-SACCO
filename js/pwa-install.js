/**
 * PWA Installation Handler
 * Manages app installation with multiple fallback strategies
 */
class PWAInstaller {
    constructor() {
        this.deferredPrompt = null;
        this.isInstalled = false;
        this.installBtn = null;
        this.promptAttempted = false;
        this.init();
    }

    init() {
         console.log('%c📱 PWA Installer initializing...', 'color: #FFCC00; font-weight: bold');
         
         // Log device info
         const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
         const isHTTPS = location.protocol === 'https:' || location.hostname === 'localhost';
         console.log('Device Info:', { isMobile, isHTTPS, userAgent: navigator.userAgent });

         // Check if app is already installed
         this.checkIfInstalled();
         
         // Always hide button initially, show only if PWA prompt is available
         this.hideInstallButton();

        if (!this.isInstalled) {
            // Wait for service worker to be ready before listening for install prompt
            const setupInstallPrompt = () => {
                // Listen for the beforeinstallprompt event (most important event)
                window.addEventListener('beforeinstallprompt', (e) => {
                    e.preventDefault();
                    this.deferredPrompt = e;
                    console.log('%c✅ beforeinstallprompt event captured!', 'color: #51cf66; font-weight: bold');
                    
                    this.showInstallButton();
                    this.showInstallBanner();
                    
                    // Auto-trigger install prompt after short delay
                    setTimeout(() => {
                        this.autoTriggerInstall();
                    }, 1500);
                });

                // Log when we're waiting for the event
                console.log('⏳ Waiting for beforeinstallprompt event (service worker is ready)...');
                
                // Fallback timeout - if beforeinstallprompt doesn't fire in 8 seconds
                setTimeout(() => {
                    if (!this.deferredPrompt && !this.isInstalled) {
                        console.log('%c⚠️  beforeinstallprompt event not captured after 8s', 'color: #ff9800; font-weight: bold');
                        console.log('Possible reasons: Not HTTPS, User is on iOS, browser does not support beforeinstallprompt');
                        this.showInstallButton();
                        this.showInstallBanner();
                    }
                }, 8000);
            };
            
            // Wait for service worker to be ready
            if (window.serviceWorkerReady) {
                console.log('Service worker already ready');
                setupInstallPrompt();
            } else {
                window.addEventListener('serviceWorkerReady', setupInstallPrompt);
                
                // Fallback: if service worker doesn't fire ready event in 10 seconds, proceed anyway
                setTimeout(() => {
                    if (!window.serviceWorkerReady) {
                        console.log('Service worker not ready, proceeding anyway...');
                        setupInstallPrompt();
                    }
                }, 10000);
            }
        }

         // Listen for app installed event
         window.addEventListener('appinstalled', () => {
             console.log('%c✅ App installed successfully!', 'color: #51cf66; font-weight: bold');
             this.isInstalled = true;
             localStorage.setItem('pwaInstalled', 'true');
             this.deferredPrompt = null;
             
             // Hide install button immediately
             const installBtn = document.getElementById('pwaInstallBtn');
             if (installBtn) {
                 installBtn.style.setProperty('display', 'none', 'important');
                 console.log('Install button hidden');
             }
             
             // Hide install banner
             const banner = document.getElementById('installBanner');
             if (banner) {
                 banner.style.setProperty('display', 'none', 'important');
                 console.log('Install banner hidden');
             }

             if (typeof Swal !== 'undefined') {
                 Swal.fire({
                     icon: 'success',
                     title: 'Installation Successful!',
                     text: 'Together AS One SACCO is now installed on your device. You can use it offline anytime.',
                     confirmButtonColor: '#FFCC00'
                 });
             }
         });

         // Setup button listeners
         this.setupButtonListener();
     }

    checkIfInstalled() {
        // Check localStorage flag
        if (localStorage.getItem('pwaInstalled') === 'true') {
            console.log('✅ App already marked as installed in localStorage');
            this.isInstalled = true;
            this.hideInstallButton();
            return;
        }

        // Check if running as installed app on iOS
        if (window.navigator.standalone === true) {
            console.log('✅ App running in standalone mode (iOS)');
            this.isInstalled = true;
            localStorage.setItem('pwaInstalled', 'true');
            this.hideInstallButton();
            return;
        }

        // Check if app is in display mode standalone (Android)
        if (window.matchMedia('(display-mode: standalone)').matches) {
            console.log('✅ App running in standalone mode (Android)');
            this.isInstalled = true;
            localStorage.setItem('pwaInstalled', 'true');
            this.hideInstallButton();
            return;
        }

        this.isInstalled = false;
        console.log('App is not installed yet');
    }

    setupButtonListener() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.attachButtonListener();
            });
        } else {
            this.attachButtonListener();
        }
    }

    attachButtonListener() {
        this.installBtn = document.getElementById('pwaInstallBtn');
        if (this.installBtn) {
            this.installBtn.addEventListener('click', () => {
                console.log('Install button clicked');
                this.handleInstallClick();
            });
        }
    }

    /**
      * Auto-trigger installation after a delay
      */
     autoTriggerInstall() {
         if (this.deferredPrompt && !this.isInstalled && !this.promptAttempted) {
             console.log('🔔 Auto-triggering installation prompt');
             this.promptAttempted = true;
             
             try {
                 this.deferredPrompt.prompt();
                 
                 this.deferredPrompt.userChoice.then((choiceResult) => {
                     if (choiceResult.outcome === 'accepted') {
                         console.log('%c✅ User accepted installation', 'color: #51cf66; font-weight: bold');
                         this.isInstalled = true;
                         localStorage.setItem('pwaInstalled', 'true');
                         
                         // Hide install button and banner immediately
                         const installBtn = document.getElementById('pwaInstallBtn');
                         if (installBtn) {
                             installBtn.style.setProperty('display', 'none', 'important');
                             console.log('Install button hidden after acceptance');
                         }
                         
                         const banner = document.getElementById('installBanner');
                         if (banner) {
                             banner.style.setProperty('display', 'none', 'important');
                             console.log('Install banner hidden after acceptance');
                         }
                     } else {
                         console.log('User dismissed installation prompt');
                     }
                     this.deferredPrompt = null;
                 });
             } catch (error) {
                 console.error('Error in auto-trigger:', error);
             }
         }
     }

    showInstallButton() {
        if (this.isInstalled) return;

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.displayButton();
            });
        } else {
            this.displayButton();
        }
    }

    displayButton() {
        this.installBtn = document.getElementById('pwaInstallBtn');
        if (this.installBtn) {
            this.installBtn.style.setProperty('display', 'inline-block', 'important');
            console.log('✅ Install button displayed');
        }
    }

    showInstallBanner() {
         const banner = document.getElementById('installBanner');
         const dismissedBanner = localStorage.getItem('installBannerDismissed');
         const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

         if (banner && !dismissedBanner && !this.isInstalled) {
             banner.style.display = 'block';
             console.log('✅ Install banner displayed', { isMobile });

             const installBtn = document.getElementById('installBannerBtn');
             const dismissBtn = document.getElementById('dismissBannerBtn');

             if (installBtn) {
                 installBtn.addEventListener('click', () => this.handleInstallClick());
             }

             if (dismissBtn) {
                 dismissBtn.addEventListener('click', () => {
                     banner.style.display = 'none';
                     localStorage.setItem('installBannerDismissed', 'true');
                 });
             }
         }
     }

    hideInstallButton() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.removeButton();
            });
        } else {
            this.removeButton();
        }
    }

    removeButton() {
        this.installBtn = document.getElementById('pwaInstallBtn');
        if (this.installBtn) {
            this.installBtn.style.setProperty('display', 'none', 'important');
        }
    }

    async handleInstallClick() {
         if (!this.deferredPrompt) {
             console.warn('⚠️  Install prompt not available yet. Waiting...');
             return;
         }

         try {
             this.promptAttempted = true;
             console.log('Triggering install prompt...');

             // Show the install prompt
             this.deferredPrompt.prompt();

             // Wait for user choice
             const { outcome } = await this.deferredPrompt.userChoice;

             if (outcome === 'accepted') {
                 console.log('%c✅ User accepted installation', 'color: #51cf66; font-weight: bold');
                 this.isInstalled = true;
                 localStorage.setItem('pwaInstalled', 'true');
                 
                 // Hide install button and banner immediately
                 const installBtn = document.getElementById('pwaInstallBtn');
                 if (installBtn) {
                     installBtn.style.setProperty('display', 'none', 'important');
                     console.log('Install button hidden');
                 }
                 
                 const banner = document.getElementById('installBanner');
                 if (banner) {
                     banner.style.setProperty('display', 'none', 'important');
                     console.log('Install banner hidden');
                 }

                 if (typeof Swal !== 'undefined') {
                     Swal.fire({
                         icon: 'success',
                         title: 'Installation Complete!',
                         html: '<p>Together AS One SACCO is now installed on your device.</p><p>You can use all features offline.</p>',
                         confirmButtonColor: '#FFCC00',
                         confirmButtonText: 'Start Using'
                     });
                 }
             } else {
                 console.log('User dismissed installation prompt');
             }

             this.deferredPrompt = null;
         } catch (error) {
             console.error('❌ Error handling install prompt:', error);
         }
     }

    showAlternativeInstallInstructions() {
        let title = '';
        let instructions = '';

        if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
            title = 'Install Together AS One on iOS';
            instructions = `
                <div style="text-align: left; margin-top: 1rem;">
                    <p style="font-size: 0.95rem; margin-bottom: 1rem;"><strong>iPhone, iPad & iPod</strong></p>
                    <ol style="margin-left: 1rem;">
                        <li>Tap the <strong>Share</strong> button (⬆️) at the bottom center</li>
                        <li>Scroll down and tap <strong>"Add to Home Screen"</strong></li>
                        <li>Customize the name if needed</li>
                        <li>Tap <strong>"Add"</strong> in the top right corner</li>
                        <li>The app will appear on your home screen</li>
                    </ol>
                    <p class="text-muted small" style="margin-top: 1rem; font-size: 0.85rem;">
                        ✓ Full offline support • Full screen experience
                    </p>
                </div>
            `;
        } else if (/Android/.test(navigator.userAgent)) {
            title = 'Install Together AS One on Android';
            instructions = `
                <div style="text-align: left; margin-top: 1rem;">
                    <p style="font-size: 0.95rem; margin-bottom: 1rem;"><strong>Android Phones & Tablets</strong></p>
                    <ol style="margin-left: 1rem;">
                        <li>Tap the <strong>Menu</strong> button (⋮ or ⊙) in the top right</li>
                        <li>Tap <strong>"Install app"</strong> or <strong>"Add to Home Screen"</strong></li>
                        <li>Tap <strong>"Install"</strong> to confirm</li>
                        <li>The app will appear on your home screen</li>
                    </ol>
                    <p style="font-size: 0.9rem; margin-top: 1rem; margin-bottom: 1rem;"><strong>Alternative for older Android:</strong></p>
                    <ol style="margin-left: 1rem;">
                        <li>Tap the <strong>Menu</strong> button (⋮)</li>
                        <li>Tap <strong>"Add shortcut to home"</strong> or similar option</li>
                    </ol>
                    <p class="text-muted small" style="margin-top: 1rem; font-size: 0.85rem;">
                        ✓ Full offline support • Optimized for mobile & tablets
                    </p>
                </div>
            `;
        } else {
            title = 'Install Together AS One on Desktop/Laptop';
            instructions = `
                <div style="text-align: left; margin-top: 1rem;">
                    <p style="font-size: 0.95rem; margin-bottom: 1rem;"><strong>💻 Windows, Mac & Linux</strong></p>

                    <p style="font-size: 0.9rem; font-weight: 600; margin-bottom: 0.5rem;">🌐 Chrome, Edge, or Brave (Recommended)</p>
                    <ol style="margin-left: 1rem; font-size: 0.9rem;">
                        <li>Look for the <strong>install icon</strong> (⬇️ or ⊞) on the <strong>right side of the address bar</strong></li>
                        <li>Click the icon and follow the prompts</li>
                        <li>The app installs on your Start Menu, Taskbar, or Applications folder</li>
                        <li>Opens in its own window without browser toolbars</li>
                    </ol>

                    <p style="font-size: 0.9rem; font-weight: 600; margin-top: 1rem; margin-bottom: 0.5rem;">🦊 Firefox</p>
                    <ol style="margin-left: 1rem; font-size: 0.9rem;">
                        <li>Click the <strong>menu button</strong> (☰) in the top right</li>
                        <li>Select <strong>"Install Together AS One..."</strong></li>
                        <li>Click <strong>"Install"</strong> to confirm</li>
                    </ol>

                    <p style="font-size: 0.9rem; font-weight: 600; margin-top: 1rem; margin-bottom: 0.5rem;">🔧 Manual Desktop Shortcut</p>
                    <ol style="margin-left: 1rem; font-size: 0.9rem;">
                        <li><strong>Windows:</strong> Right-click the page → "Create Shortcut" → Place on Desktop</li>
                        <li><strong>Mac:</strong> Right-click the page → "Create Shortcut" → Save to Desktop</li>
                        <li><strong>Linux:</strong> Right-click the page → "Create Application Shortcut"</li>
                    </ol>

                    <p class="text-muted small" style="margin-top: 1.5rem; font-size: 0.85rem;">
                        ✓ Runs offline • No browser interface • Automatic updates • Works on all platforms
                    </p>
                </div>
            `;
        }

        if (typeof Swal !== 'undefined') {
            Swal.fire({
                title: title,
                html: instructions,
                icon: 'info',
                confirmButtonText: 'Got it',
                confirmButtonColor: '#3b82f6',
                width: '600px',
                allowOutsideClick: true
            });
        } else {
            alert(`${title}\n\n${instructions}`);
        }
    }
}

// Initialize when DOM is ready
let pwaInstaller = null;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        pwaInstaller = new PWAInstaller();
    });
} else {
    pwaInstaller = new PWAInstaller();
}
