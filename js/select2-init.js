// Select2 Initialization Module
// Enhances all select fields with Select2 for better UX

const Select2Init = {
    // Store instances for later manipulation
    instances: {},

    // Initialize Select2 on all select elements
    init() {
        // Define which selects should be enhanced with Select2
         const selectorsToEnhance = [
             '#loanMember',
             '#paymentLoan',
             '#topUpSelectLoan',
             '#transactionMemberSelect',
             '#savingMember',
             '#withdrawalMember',
             '#activityMemberFilter',
             '#reportMember',
             '#languageSelect'
         ];

        selectorsToEnhance.forEach(selector => {
            const element = document.querySelector(selector);
            if (element) {
                this.initializeSelect2(element, selector);
            }
        });
    },

    // Initialize a single Select2 instance
    initializeSelect2(element, selector) {
        try {
            // Check if Select2 is available
            if (typeof jQuery === 'undefined' || !jQuery.fn.select2) {
                console.warn('Select2 library not found.');
                return;
            }

            const $element = jQuery(element);

            $element.select2({
                width: '100%',
                allowClear: true,
                placeholder: this.getPlaceholder(selector),
                searching: true,
                matcher: this.matchFunction,
                templateResult: this.formatOption,
                templateSelection: this.formatOption,
                sorter: (data) => {
                    return data.sort((a, b) => {
                        if (a.text && b.text) {
                            return a.text.localeCompare(b.text);
                        }
                        return 0;
                    });
                },
                dropdownCssClass: 'select2-dropdown-custom',
                containerCssClass: 'select2-container-custom'
            });

            // Store the instance
            this.instances[selector] = $element;
            console.log('Select2 initialized for', selector);

            // Add CSS class for styling
            $element.addClass('select2-enhanced');

        } catch (error) {
            console.warn('Failed to initialize Select2 for', selector, error);
        }
    },

    // Custom matcher function for searching
    matchFunction(params, data) {
        // If there are no search terms, return all of the data
        if (jQuery.trim(params.term) === '') {
            return data;
        }

        // Do not display the item if there is no 'text' property
        if (typeof data.text === 'undefined') {
            return null;
        }

        // `params.term` should be the term that is used for searching
        // `data.text` is the text that is displayed for the data object
        if (data.text.toLowerCase().indexOf(params.term.toLowerCase()) > -1) {
            const modifiedData = jQuery.extend({}, data, true);
            return modifiedData;
        }

        // Return `null` if the term does not match
        return null;
    },

    // Format option display
    formatOption(option) {
        if (!option.id) {
            return option.text;
        }
        return jQuery('<span>' + option.text + '</span>');
    },

    // Get appropriate placeholder text for each selector
    getPlaceholder(selector) {
        const placeholders = {
            '#loanMember': 'Select member...',
            '#paymentLoan': 'Select loan...',
            '#topUpSelectLoan': 'Choose a loan...',
            '#transactionMemberSelect': 'Choose a member...',
            '#savingMember': 'Select member...',
            '#withdrawalMember': 'Select member...',
            '#activityMemberFilter': 'Filter by member...',
            '#reportMember': 'Select a member...',
            '#languageSelect': 'Select language...'
        };
        return placeholders[selector] || 'Select an option...';
    },

    // Method to update options dynamically
    updateOptions(selector, options) {
        if (this.instances[selector]) {
            const $select = this.instances[selector];
            $select.empty();
            
            // Add options
            options.forEach(option => {
                $select.append(
                    jQuery('<option></option>')
                        .attr('value', option.value)
                        .text(option.label)
                );
            });
            
            $select.trigger('change');
        }
    },

    // Method to get selected value(s)
    getValue(selector) {
        if (this.instances[selector]) {
            return this.instances[selector].val();
        }
        return null;
    },

    // Method to set value programmatically
    setValue(selector, value) {
        if (this.instances[selector]) {
            const $select = this.instances[selector];
            $select.val(value).trigger('change');
        }
    },

    // Method to clear selection
    clearValue(selector) {
        if (this.instances[selector]) {
            const $select = this.instances[selector];
            $select.val(null).trigger('change');
        }
    }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // Wait for jQuery to be available
        const checkJQuery = setInterval(() => {
            if (typeof jQuery !== 'undefined') {
                clearInterval(checkJQuery);
                setTimeout(() => Select2Init.init(), 500);
            }
        }, 100);
    });
} else {
    // Wait for jQuery to be available
    const checkJQuery = setInterval(() => {
        if (typeof jQuery !== 'undefined') {
            clearInterval(checkJQuery);
            setTimeout(() => Select2Init.init(), 500);
        }
    }, 100);
}
