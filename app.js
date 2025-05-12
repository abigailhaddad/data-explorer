(function () {
    const config = window.DATASET_CONFIG;
    const state = {
        data: [],
        table: null,
        filters: {}
    };

    document.addEventListener('DOMContentLoaded', () => {
        setupEventListeners();
        setPageTitle();
        loadData();
    });

    function setPageTitle() {
        // Set the document title using the title from config
        const title = config.title || config.datasetName || 'Data Explorer';
        document.title = title;
        document.getElementById('app-title').textContent = title;
        document.getElementById('navbar-title').textContent = title;
        
        // Set optional subtitle if present in config
        if (config.subtitle) {
            const subtitleEl = document.getElementById('navbar-subtitle');
            subtitleEl.textContent = config.subtitle;
            subtitleEl.classList.remove('d-none');
        }
    }

    function loadData() {
        // Add loading state
        document.querySelector('#statistics').classList.add('loading');
        
        fetch('data.json')
            .then(res => {
                if (!res.ok) {
                    throw new Error(`HTTP error! Status: ${res.status}`);
                }
                return res.json();
            })
            .then(data => {
                state.data = data;
                
                // Remove loading placeholders
                document.querySelector('#statistics').classList.remove('loading');
                document.querySelector('#filter-buttons').innerHTML = '';
                
                initializeTable();
                createFilterButtons();
                updateStats();
                
                // Hide "No filters" message if any filters are active
                updateNoFiltersMessage();
            })
            .catch(err => {
                document.querySelector('.card-body').innerHTML += `
                    <div class="alert alert-danger mt-3">
                        <strong>Error Loading Data:</strong><br>${err.message}
                    </div>
                `;
                
                // Remove loading indicators
                document.querySelector('#statistics').classList.remove('loading');
                document.querySelector('#filter-buttons').innerHTML = '';
            });
    }

    function initializeTable() {
        const columns = config.fields.map(field => ({
            data: field.key,
            title: field.title,
            visible: field.visible !== false,
            render: (data, type, row) => {
                // If we're requesting the raw data for sorting/filtering, return it
                if (type === 'sort' || type === 'filter') {
                    return data;
                }
                
                // Handle null/undefined values
                if (data === null || data === undefined) {
                    return '<span class="text-muted fst-italic">—</span>';
                }
                
                // Handle multi-label fields (skills, certifications, etc.)
                if (field.format === 'multi-label') {
                    // Split by comma, trim whitespace, and create badges
                    const items = data.split(',').map(item => item.trim()).filter(item => item);
                    return items.map(item => `<span class="badge bg-secondary me-1 mb-1">${item}</span>`).join('');
                }
                
                // Handle currency formatting
                if (field.format === 'currency') {
                    return `<span class="fw-medium">$${Number(data).toLocaleString()}</span>`;
                }
                
                // Handle date formatting
                if (field.format === 'date') {
                    const date = new Date(data);
                    if (isNaN(date)) return data;
                    return date.toLocaleDateString();
                }
                
                // Handle badge formatting if badges are configured
                if (field.badges && field.badges[data]) {
                    const colorClass = field.badges[data];
                    
                    // Check if it's a hex color or a Bootstrap class
                    if (colorClass.startsWith('#')) {
                        return `<span class="badge" style="background-color: ${colorClass}">${data}</span>`;
                    } else {
                        return `<span class="badge ${colorClass}">${data}</span>`;
                    }
                }
                
                // Special case for status field for backward compatibility
                if (field.key === 'status' && !field.badges) {
                    const cls = data === 'Active' ? 'bg-success' : 'bg-warning';
                    return `<span class="badge ${cls}">${data}</span>`;
                }
                
                // Default case - return the data as is
                return data;
            }
        }));

        // Destroy existing table if it exists
        if (state.table) {
            state.table.destroy();
            $('#data-table').empty();
        }

        state.table = $('#data-table').DataTable({
            data: state.data,
            columns,
            responsive: true,
            searchHighlight: true,
            fixedHeader: true,
            dom: '<"dt-buttons"B><"d-flex justify-content-between align-items-center mb-3"l>tip',
            pageLength: 25,
            lengthMenu: [[10, 25, 50, 100, -1], [10, 25, 50, 100, "All"]],
            language: {
                lengthMenu: "Show _MENU_ entries",
                info: "Showing _START_ to _END_ of _TOTAL_ entries",
                infoFiltered: "(filtered from _MAX_ total entries)",
                zeroRecords: "No matching records found",
                emptyTable: "No data available"
            },
            buttons: [
                {
                    extend: 'colvis',
                    text: 'Show/Hide Columns',
                    className: 'btn btn-sm btn-primary text-white',
                    columns: ':not(.noVis)'
                }
            ]
        });
    }

    function createFilterButtons() {
        const container = document.getElementById('filter-buttons');
        container.innerHTML = '';

        config.fields.forEach(field => {
            if (!field.filter) return;

            const btn = document.createElement('button');
            btn.className = 'btn btn-sm btn-outline-primary me-2 mb-2';
            btn.textContent = field.title;
            btn.addEventListener('click', () => showFilterModal(field));
            container.appendChild(btn);
        });
    }

    function showFilterModal(field) {
        const modal = document.getElementById('filter-modal');
        const existing = state.filters[field.key] || [];
        let bodyContent = '';

        if (field.filter === 'select') {
            // Get unique values and sort them
            const values = Array.from(new Set(state.data.map(row => row[field.key]))).filter(Boolean).sort();
            
            bodyContent = `
                <div class="mb-3">
                    <input type="text" class="form-control form-control-sm" id="select-filter-search" 
                           placeholder="Search options...">
                </div>
                <div class="select-options-container">
                    ${values.map(v => `
                        <div class="form-check checkbox-item">
                            <input class="form-check-input" type="checkbox" id="check-${v.replace(/\s+/g, '-')}" 
                                   value="${v}" ${existing.includes(v) ? 'checked' : ''}>
                            <label class="form-check-label" for="check-${v.replace(/\s+/g, '-')}">
                                ${v}
                            </label>
                        </div>
                    `).join('')}
                </div>
                <div class="select-actions mt-3">
                    <button type="button" class="btn btn-sm btn-outline-secondary select-all">Select All</button>
                    <button type="button" class="btn btn-sm btn-outline-secondary ms-2 deselect-all">Deselect All</button>
                </div>
            `;
        } else if (field.filter === 'multi-label') {
            // Extract all unique labels from all rows
            const allLabels = new Set();
            state.data.forEach(row => {
                if (row[field.key]) {
                    row[field.key].split(',').forEach(label => {
                        allLabels.add(label.trim());
                    });
                }
            });
            const sortedLabels = Array.from(allLabels).sort();
            
            bodyContent = `
                <div class="mb-3">
                    <input type="text" class="form-control form-control-sm" id="multi-label-filter-search" 
                           placeholder="Search skills...">
                </div>
                <div class="multi-label-info mb-3">
                    <div class="alert alert-info">
                        <small><i class="bi bi-info-circle me-2"></i>Select the skills you want to filter by. Results will show people who have <strong>any</strong> of the selected skills.</small>
                    </div>
                </div>
                <div class="select-options-container">
                    ${sortedLabels.map(label => `
                        <div class="form-check checkbox-item">
                            <input class="form-check-input" type="checkbox" id="check-${label.replace(/\s+/g, '-')}" 
                                   value="${label}" ${existing.includes(label) ? 'checked' : ''}>
                            <label class="form-check-label" for="check-${label.replace(/\s+/g, '-')}">
                                ${label}
                            </label>
                        </div>
                    `).join('')}
                </div>
                <div class="select-actions mt-3">
                    <button type="button" class="btn btn-sm btn-outline-secondary select-all">Select All</button>
                    <button type="button" class="btn btn-sm btn-outline-secondary ms-2 deselect-all">Deselect All</button>
                </div>
            `;
        } else {
            bodyContent = `
                <div class="mb-3">
                    <div class="input-group">
                        <input type="text" class="form-control" id="free-text-filter" 
                               placeholder="Type and press Enter">
                        <button class="btn btn-outline-primary" type="button" id="add-text-filter">
                            Add
                        </button>
                    </div>
                    <div class="form-text">Press Enter or click Add after typing</div>
                </div>
                <div id="text-filter-tags" class="mb-2"></div>
            `;
        }

        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="bi bi-funnel me-2"></i>Filter by ${field.title}
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">${bodyContent}</div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            Cancel
                        </button>
                        <button type="button" class="btn btn-primary apply-filter">
                            Apply
                        </button>
                    </div>
                </div>
            </div>
        `;

        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();

        // Focus the input field when modal shows
        modal.addEventListener('shown.bs.modal', function () {
            const inputField = field.filter === 'select' 
                ? document.getElementById('select-filter-search')
                : field.filter === 'multi-label'
                ? document.getElementById('multi-label-filter-search')
                : document.getElementById('free-text-filter');
            
            if (inputField) {
                inputField.focus();
            }
        });

        // Set up search for select and multi-label filters
        if (field.filter === 'select' || field.filter === 'multi-label') {
            const searchInputId = field.filter === 'select' ? 'select-filter-search' : 'multi-label-filter-search';
            const searchInput = modal.querySelector(`#${searchInputId}`);
            const options = modal.querySelectorAll('.checkbox-item');
            
            // Set up search functionality
            searchInput.addEventListener('input', function() {
                const searchTerm = this.value.toLowerCase();
                options.forEach(option => {
                    const optionText = option.querySelector('.form-check-label').textContent.toLowerCase().trim();
                    option.style.display = optionText.includes(searchTerm) ? '' : 'none';
                });
            });
            
            // Set up select/deselect all buttons
            modal.querySelector('.select-all').addEventListener('click', function() {
                const visibleCheckboxes = Array.from(options).filter(option => 
                    option.style.display !== 'none'
                ).map(option => option.querySelector('input[type="checkbox"]'));
                
                visibleCheckboxes.forEach(checkbox => checkbox.checked = true);
            });
            
            modal.querySelector('.deselect-all').addEventListener('click', function() {
                const visibleCheckboxes = Array.from(options).filter(option => 
                    option.style.display !== 'none'
                ).map(option => option.querySelector('input[type="checkbox"]'));
                
                visibleCheckboxes.forEach(checkbox => checkbox.checked = false);
            });
        }

        if (field.filter === 'text') {
            const input = modal.querySelector('#free-text-filter');
            const addButton = modal.querySelector('#add-text-filter');
            const tagContainer = modal.querySelector('#text-filter-tags');
            
            // Render existing tags
            renderTextTags(field.key);

            // Add event listeners
            input.addEventListener('keydown', e => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    addTextFilter();
                }
            });
            
            addButton.addEventListener('click', addTextFilter);

            function addTextFilter() {
                const val = input.value.trim();
                if (val && (!state.filters[field.key] || !state.filters[field.key].includes(val))) {
                    if (!state.filters[field.key]) state.filters[field.key] = [];
                    state.filters[field.key].push(val);
                    input.value = '';
                    renderTextTags(field.key);
                    input.focus();
                }
            }

            function renderTextTags(key) {
                if (!state.filters[key] || !state.filters[key].length) {
                    tagContainer.innerHTML = '<div class="text-muted fst-italic">No filters added yet</div>';
                    return;
                }
                
                tagContainer.innerHTML = state.filters[key].map(val => `
                    <div class="filter-tag">
                        ${val}
                        <span class="remove-tag" data-val="${val}">×</span>
                    </div>
                `).join('');

                tagContainer.querySelectorAll('.remove-tag').forEach(el => {
                    el.addEventListener('click', () => {
                        state.filters[key] = state.filters[key].filter(v => v !== el.dataset.val);
                        renderTextTags(key);
                    });
                });
            }
        }

        modal.querySelector('.apply-filter').addEventListener('click', () => {
            if (field.filter === 'select' || field.filter === 'multi-label') {
                const checked = modal.querySelectorAll('input[type=checkbox]:checked');
                state.filters[field.key] = Array.from(checked).map(cb => cb.value);
            }
            bsModal.hide();
            updateTableFilters();
            renderActiveFilters();
            updateNoFiltersMessage();
        });
    }

    function updateTableFilters(redraw = true) {
        $.fn.dataTable.ext.search = [];

        $.fn.dataTable.ext.search.push((settings, data, dataIndex) => {
            const row = state.data[dataIndex];
            for (let key in state.filters) {
                if (!state.filters[key] || state.filters[key].length === 0) continue;
                
                const filterVals = state.filters[key];
                const field = config.fields.find(f => f.key === key);
                
                if (field && field.filter === 'multi-label') {
                    // For multi-label fields, check if any selected filter values are present
                    const cellVal = String(row[key] || '');
                    const cellLabels = cellVal.split(',').map(label => label.trim());
                    
                    // Check if any of the selected filters match any of the cell's labels
                    const hasMatch = filterVals.some(filterVal => 
                        cellLabels.some(cellLabel => cellLabel.toLowerCase().includes(filterVal.toLowerCase()))
                    );
                    
                    if (!hasMatch) {
                        return false;
                    }
                } else {
                    // Standard filtering for other types
                    const cellVal = String(row[key] || '').toLowerCase();
                    if (!filterVals.some(f => cellVal.includes(f.toLowerCase()))) {
                        return false;
                    }
                }
            }
            return true;
        });

        if (redraw) {
            state.table.draw();
            updateStats();
        }
    }

    function renderActiveFilters() {
        const container = document.getElementById('active-filters');
        container.innerHTML = '';

        let hasFilters = false;
        
        Object.entries(state.filters).forEach(([key, values]) => {
            if (!values || values.length === 0) return;
            
            hasFilters = true;
            const field = config.fields.find(f => f.key === key);
            const title = field?.title || key;
            
            values.forEach(val => {
                const tag = document.createElement('div');
                tag.className = 'filter-tag';
                tag.innerHTML = `
                    ${title}: ${val}
                    <span class="remove-tag" data-key="${key}" data-val="${val}">×</span>
                `;
                tag.querySelector('.remove-tag').addEventListener('click', () => {
                    state.filters[key] = state.filters[key].filter(v => v !== val);
                    if (state.filters[key].length === 0) delete state.filters[key];
                    updateTableFilters();
                    renderActiveFilters();
                    updateNoFiltersMessage();
                });
                container.appendChild(tag);
            });
        });
        
        return hasFilters;
    }
    
    function updateNoFiltersMessage() {
        const noFiltersMsg = document.getElementById('no-filters-message');
        const hasActiveFilters = Object.values(state.filters).some(vals => vals && vals.length > 0);
        
        if (noFiltersMsg) {
            noFiltersMsg.style.display = hasActiveFilters ? 'none' : 'block';
        }
    }

    function clearFilters() {
        state.filters = {};
        renderActiveFilters();
        updateTableFilters();
        updateNoFiltersMessage();
    }

    function updateStats() {
        const stats = config.stats;
        const visibleData = getVisibleData();

        const container = document.getElementById('statistics');
        container.innerHTML = '<div class="row text-center"></div>';
        const row = container.querySelector('.row');

        stats.forEach(stat => {
            let value = null;
            let formattedValue = '';

            switch (stat.type) {
                case 'count':
                    if (stat.key === 'total') {
                        value = visibleData.length;
                    } else if (stat.match !== undefined) {
                        value = visibleData.filter(row => String(row[stat.key]) === stat.match).length;
                    } else {
                        value = visibleData.filter(row => row[stat.key] !== undefined).length;
                    }
                    formattedValue = value.toLocaleString();
                    break;

                case 'unique':
                    const uniqueValues = new Set(visibleData.map(row => row[stat.key]).filter(Boolean));
                    value = uniqueValues.size;
                    formattedValue = value.toLocaleString();
                    break;

                case 'mean':
                    const validValues = visibleData
                        .map(row => parseFloat(row[stat.key]))
                        .filter(val => !isNaN(val));
                    
                    if (validValues.length > 0) {
                        const sum = validValues.reduce((a, b) => a + b, 0);
                        value = sum / validValues.length;
                    } else {
                        value = 0;
                    }
                    
                    if (stat.format === 'currency') {
                        formattedValue = `${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
                    } else {
                        formattedValue = value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
                    }
                    break;

                case 'min':
                    const minValues = visibleData
                        .map(row => parseFloat(row[stat.key]))
                        .filter(val => !isNaN(val));
                    
                    if (minValues.length > 0) {
                        value = Math.min(...minValues);
                    } else {
                        value = 0;
                    }
                    
                    if (stat.format === 'currency') {
                        formattedValue = `${value.toLocaleString()}`;
                    } else {
                        formattedValue = value.toLocaleString();
                    }
                    break;
                    
                case 'max':
                    const maxValues = visibleData
                        .map(row => parseFloat(row[stat.key]))
                        .filter(val => !isNaN(val));
                    
                    if (maxValues.length > 0) {
                        value = Math.max(...maxValues);
                    } else {
                        value = 0;
                    }
                    
                    if (stat.format === 'currency') {
                        formattedValue = `${value.toLocaleString()}`;
                    } else {
                        formattedValue = value.toLocaleString();
                    }
                    break;

                case 'sum':
                    const sumValues = visibleData
                        .map(row => parseFloat(row[stat.key]))
                        .filter(val => !isNaN(val));
                    
                    if (sumValues.length > 0) {
                        value = sumValues.reduce((a, b) => a + b, 0);
                    } else {
                        value = 0;
                    }
                    
                    if (stat.format === 'currency') {
                        formattedValue = `${value.toLocaleString()}`;
                    } else {
                        formattedValue = value.toLocaleString();
                    }
                    break;
            }

            const statHTML = `
                <div class="col">
                    <h3>${formattedValue}</h3>
                    <p>${stat.label}</p>
                </div>
            `;
            row.innerHTML += statHTML;
        });
    }

    // Helper function to get data that's currently visible after filtering
    function getVisibleData() {
        // If no filters are applied, return all data
        if (Object.keys(state.filters).length === 0 || 
            !Object.values(state.filters).some(arr => arr && arr.length > 0)) {
            return state.data;
        }

        // Otherwise, apply filters manually
        return state.data.filter(row => {
            for (let key in state.filters) {
                const filterVals = state.filters[key];
                
                // Skip empty filter arrays
                if (!filterVals || filterVals.length === 0) continue;
                
                const field = config.fields.find(f => f.key === key);
                
                if (field && field.filter === 'multi-label') {
                    // For multi-label fields, check if any selected filter values are present
                    const cellVal = String(row[key] || '');
                    const cellLabels = cellVal.split(',').map(label => label.trim());
                    
                    // Check if any of the selected filters match any of the cell's labels
                    const hasMatch = filterVals.some(filterVal => 
                        cellLabels.some(cellLabel => cellLabel.toLowerCase().includes(filterVal.toLowerCase()))
                    );
                    
                    if (!hasMatch) {
                        return false;
                    }
                } else {
                    // Standard filtering for other types
                    const cellVal = String(row[key] || '').toLowerCase();
                    if (!filterVals.some(f => cellVal.includes(f.toLowerCase()))) {
                        return false;
                    }
                }
            }
            return true;
        });
    }

    function exportCSV() {
        const visibleData = getVisibleData();
        
        if (visibleData.length === 0) {
            alert('No data to export');
            return;
        }
        
        // Get visible columns
        const visibleFields = config.fields.filter(f => {
            const columnIdx = state.table.column(f.key + ':name').index();
            return columnIdx === undefined || state.table.column(columnIdx).visible();
        });
        
        const headers = visibleFields.map(f => f.title);
        let csv = headers.join(',') + '\n';

        visibleData.forEach(row => {
            const line = visibleFields.map(f => {
                let val = row[f.key] ?? '';
                
                // Format value if needed
                if (f.format === 'currency' && val !== '') {
                    val = Number(val).toLocaleString().replace(/,/g, '');
                }
                
                // Format date if needed
                if (f.format === 'date' && val !== '') {
                    val = new Date(val).toLocaleDateString();
                }
                
                // Handle commas and quotes
                val = String(val).replace(/"/g, '""');
                return val.includes(',') || val.includes('"') ? `"${val}"` : val;
            });
            csv += line.join(',') + '\n';
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
        const filename = `${config.title || 'export'}-${timestamp}.csv`;
        
        a.href = url;
        a.download = filename;
        a.hidden = true;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function setupEventListeners() {
        document.getElementById('export-csv').addEventListener('click', exportCSV);
        document.getElementById('clear-filters').addEventListener('click', clearFilters);
    }
})();