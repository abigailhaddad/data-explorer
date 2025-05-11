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
    }

    function loadData() {
        fetch('data.json')
            .then(res => res.json())
            .then(data => {
                state.data = data;
                initializeTable();
                createFilterButtons();
                updateStats();
            })
            .catch(err => {
                document.querySelector('.card-body').innerHTML += `
                    <div style="color:red;background:#fee;padding:15px;margin-top:15px;">
                        <strong>Error Loading Data:</strong><br>${err.message}
                    </div>
                `;
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
                
                // Handle currency formatting
                if (field.format === 'currency') {
                    return `$${Number(data).toLocaleString()}`;
                }
                
                // Handle date formatting
                if (field.format === 'date') {
                    return new Date(data).toLocaleDateString();
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

        state.table = $('#data-table').DataTable({
            data: state.data,
            columns,
            responsive: true,
            searchHighlight: true,      // <-- Enables search highlighting
            fixedHeader: true,          // <-- Enables sticky header
            dom: '<"dt-buttons"B><"d-flex justify-content-between"lf>rtip',
            pageLength: 50,
            buttons: [
                {
                    extend: 'colvis',
                    text: '<i class="bi bi-eye"></i> Columns',
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
            btn.className = 'btn btn-outline-primary me-2 mb-2';
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
            const values = Array.from(new Set(state.data.map(row => row[field.key]))).filter(Boolean);
            bodyContent = values.map(v => `
                <label class="form-check">
                    <input class="form-check-input" type="checkbox" value="${v}" ${existing.includes(v) ? 'checked' : ''}>
                    ${v}
                </label>
            `).join('');
        } else {
            bodyContent = `
                <input type="text" class="form-control mb-2" id="free-text-filter" placeholder="Type and press Enter" />
                <div id="text-filter-tags" class="mb-2"></div>
            `;
        }

        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Filter by ${field.title}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">${bodyContent}</div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-primary apply-filter">Apply</button>
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        `;

        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();

        if (field.filter === 'text') {
            const input = modal.querySelector('#free-text-filter');
            const tagContainer = modal.querySelector('#text-filter-tags');
            renderTextTags(field.key);

            input.addEventListener('keydown', e => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const val = input.value.trim();
                    if (val && (!state.filters[field.key] || !state.filters[field.key].includes(val))) {
                        if (!state.filters[field.key]) state.filters[field.key] = [];
                        state.filters[field.key].push(val);
                        input.value = '';
                        renderTextTags(field.key);
                    }
                }
            });

            function renderTextTags(key) {
                tagContainer.innerHTML = state.filters[key]?.map(val => `
                    <span class="filter-tag">${val} <span class="remove-tag" data-val="${val}">&times;</span></span>
                `).join('') || '';

                tagContainer.querySelectorAll('.remove-tag').forEach(el => {
                    el.addEventListener('click', () => {
                        state.filters[key] = state.filters[key].filter(v => v !== el.dataset.val);
                        renderTextTags(key);
                    });
                });
            }
        }

        modal.querySelector('.apply-filter').addEventListener('click', () => {
            if (field.filter === 'select') {
                const checked = modal.querySelectorAll('input[type=checkbox]:checked');
                state.filters[field.key] = Array.from(checked).map(cb => cb.value);
            }
            bsModal.hide();
            updateTableFilters();
            renderActiveFilters();
        });
    }

    function updateTableFilters() {
        $.fn.dataTable.ext.search = [];

        $.fn.dataTable.ext.search.push((settings, data, dataIndex) => {
            const row = state.data[dataIndex];
            for (let key in state.filters) {
                const filterVals = state.filters[key];
                const cellVal = String(row[key] || '').toLowerCase();
                if (!filterVals.some(f => cellVal.includes(f.toLowerCase()))) {
                    return false;
                }
            }
            return true;
        });

        state.table.draw();
        updateStats();
    }

    function renderActiveFilters() {
        const container = document.getElementById('active-filters');
        container.innerHTML = '';

        Object.entries(state.filters).forEach(([key, values]) => {
            const title = config.fields.find(f => f.key === key)?.title || key;
            values.forEach(val => {
                const tag = document.createElement('div');
                tag.className = 'filter-tag';
                tag.innerHTML = `${title}: ${val} <span class="close" data-key="${key}" data-val="${val}">&times;</span>`;
                tag.querySelector('.close').addEventListener('click', () => {
                    state.filters[key] = state.filters[key].filter(v => v !== val);
                    if (state.filters[key].length === 0) delete state.filters[key];
                    updateTableFilters();
                    renderActiveFilters();
                });
                container.appendChild(tag);
            });
        });
    }

    function clearFilters() {
        state.filters = {};
        renderActiveFilters();
        updateTableFilters();
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
                        formattedValue = `$${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
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
                        formattedValue = `$${value.toLocaleString()}`;
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
                        formattedValue = `$${value.toLocaleString()}`;
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
                        formattedValue = `$${value.toLocaleString()}`;
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
        if (Object.keys(state.filters).length === 0) {
            return state.data;
        }

        // Otherwise, apply filters manually
        return state.data.filter(row => {
            for (let key in state.filters) {
                const filterVals = state.filters[key];
                const cellVal = String(row[key] || '').toLowerCase();
                if (!filterVals.some(f => cellVal.includes(f.toLowerCase()))) {
                    return false;
                }
            }
            return true;
        });
    }

    function exportCSV() {
        const rows = state.table.rows({ search: 'applied' }).data().toArray();
        const headers = config.fields.map(f => f.title);
        let csv = headers.join(',') + '\n';

        rows.forEach(row => {
            const line = config.fields.map(f => {
                let val = row[f.key] ?? '';
                val = val.replace(/[^a-z0-9\-\,]/ig, '');
                return typeof val === 'string' && val.includes(',') ? `"${val}"` : val;
            });
            csv += line.join(',') + '\n';
        });

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'export.csv';
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