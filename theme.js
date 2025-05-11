// Theme manager for the Data Explorer
(function() {
    // Define color schemes
    const COLOR_SCHEMES = {
        default: {
            primary: '#6366f1',     // Indigo
            primaryRgb: '99, 102, 241',
            accent: '#14b8a6',      // Teal
            success: '#10b981',     // Green
            warning: '#f59e0b',     // Amber
            info: '#3b82f6',        // Blue
            secondary: '#64748b',   // Slate
            danger: '#ef4444'       // Red
        },
        blue: {
            primary: '#2563eb',     // Rich blue
            primaryRgb: '37, 99, 235',
            accent: '#0ea5e9',      // Light blue
            success: '#10b981',     // Green
            warning: '#f59e0b',     // Amber
            info: '#3b82f6',        // Blue
            secondary: '#64748b',   // Slate
            danger: '#ef4444'       // Red
        },
        teal: {
            primary: '#0d9488',     // Teal
            primaryRgb: '13, 148, 136',
            accent: '#059669',      // Green
            success: '#10b981',     // Green
            warning: '#f59e0b',     // Amber
            info: '#0ea5e9',        // Blue
            secondary: '#64748b',   // Slate
            danger: '#ef4444'       // Red
        },
        slate: {
            primary: '#475569',     // Slate
            primaryRgb: '71, 85, 105',
            accent: '#64748b',      // Lighter slate
            success: '#10b981',     // Green
            warning: '#f59e0b',     // Amber
            info: '#0ea5e9',        // Blue
            secondary: '#94a3b8',   // Light slate
            danger: '#ef4444'       // Red
        },
        darkblue: {
            primary: '#1e40af',     // Dark blue
            primaryRgb: '30, 64, 175',
            accent: '#3b82f6',      // Bright blue
            success: '#10b981',     // Green
            warning: '#f59e0b',     // Amber
            info: '#0ea5e9',        // Blue
            secondary: '#64748b',   // Slate
            danger: '#ef4444'       // Red
        },
        forest: {
            primary: '#166534',     // Forest green
            primaryRgb: '22, 101, 52',
            accent: '#16a34a',      // Bright green
            success: '#10b981',     // Green
            warning: '#f59e0b',     // Amber
            info: '#0ea5e9',        // Blue
            secondary: '#64748b',   // Slate
            danger: '#ef4444'       // Red
        }
    };

    // Define button styles
    const BUTTON_STYLES = {
        default: `
            .btn {
                font-weight: 500;
                letter-spacing: 0.01em;
                border-radius: 0.375rem;
                transition: all 0.2s ease;
            }
            
            .btn-primary {
                background-color: var(--bs-primary);
                border-color: var(--bs-primary);
            }
            
            .btn-primary:hover {
                background-color: var(--accent);
                border-color: var(--accent);
            }
            
            .btn-outline-primary {
                border-color: var(--bs-primary);
                color: var(--bs-primary);
            }
            
            .btn-outline-primary:hover {
                background-color: var(--bs-primary);
                color: white;
            }
            
            /* Make DataTable buttons match */
            .dt-button {
                font-weight: 600 !important;
            }
        `,
        rounded: `
            .btn {
                font-weight: 500;
                letter-spacing: 0.01em;
                border-radius: 50rem;
                padding: 0.5rem 1.25rem;
                transition: all 0.2s ease;
            }
            
            .btn-sm {
                padding: 0.25rem 0.75rem;
            }
            
            .btn-primary {
                background-color: var(--bs-primary);
                border-color: var(--bs-primary);
            }
            
            .btn-primary:hover, .btn-primary:focus {
                background-color: var(--accent);
                border-color: var(--accent);
                transform: scale(1.03);
            }
            
            .btn-outline-primary {
                border-color: var(--bs-primary);
                color: var(--bs-primary);
            }
            
            .btn-outline-primary:hover, .btn-outline-primary:focus {
                background-color: var(--bs-primary);
                color: white;
                transform: scale(1.03);
            }
            
            /* Make DataTable buttons match */
            .dt-button {
                border-radius: 50rem !important;
                font-weight: 600 !important;
            }
        `,
        flat: `
            .btn {
                font-weight: 600;
                letter-spacing: 0.01em;
                border-radius: 0.25rem;
                transition: all 0.15s ease;
                border-width: 2px;
            }
            
            .btn-primary {
                background-color: var(--bs-primary);
                border-color: var(--bs-primary);
            }
            
            .btn-primary:hover, .btn-primary:focus {
                filter: brightness(110%);
            }
            
            .btn-outline-primary {
                border-color: var(--bs-primary);
                color: var(--bs-primary);
            }
            
            .btn-outline-primary:hover, .btn-outline-primary:focus {
                background-color: var(--bs-primary);
                color: white;
            }
            
            .btn-sm {
                padding: 0.25rem 0.75rem;
                font-size: 0.875rem;
            }
            
            /* Make DataTable buttons match */
            .dt-button {
                font-weight: 600 !important;
                border-width: 2px !important;
            }
        `
    };

    // Apply theme based on config
    function applyTheme() {
        // Get config
        const config = window.DATASET_CONFIG || {};
        const theme = config.theme || {};
        
        // Get color scheme
        const colorSchemeName = theme.colorScheme || 'default';
        const colorScheme = COLOR_SCHEMES[colorSchemeName] || COLOR_SCHEMES.default;
        
        // Get button style
        const buttonStyleName = theme.buttonStyle || 'default';
        const buttonStyle = BUTTON_STYLES[buttonStyleName] || BUTTON_STYLES.default;
        
        // Create CSS variables
        const cssVars = `
            :root {
                --bs-primary: ${colorScheme.primary};
                --bs-primary-rgb: ${colorScheme.primaryRgb};
                --accent: ${colorScheme.accent};
                --success: ${colorScheme.success};
                --warning: ${colorScheme.warning};
                --info: ${colorScheme.info};
                --secondary: ${colorScheme.secondary};
                --danger: ${colorScheme.danger};
            }
            
            /* Override Bootstrap's primary color */
            .bg-primary {
                background-color: var(--bs-primary) !important;
            }
            
            .text-primary {
                color: var(--bs-primary) !important;
            }
            
            ${buttonStyle}
        `;
        
        // Create and append style tag
        const styleTag = document.createElement('style');
        styleTag.id = 'theme-styles';
        styleTag.textContent = cssVars;
        document.head.appendChild(styleTag);
    }

    // Apply theme when DOM is loaded
    document.addEventListener('DOMContentLoaded', applyTheme);
})();