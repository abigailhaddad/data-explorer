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
            render: (d, type, row) => {
                if (field.format === 'currency') return `$${Number(d).toLocaleString()}`;
                if (field.format === 'date') return new Date(d).toLocaleDateString();
                if (field.key === 'status') {
                    const cls = d === 'Active' ? 'bg-success' : 'bg-warning';
                    return `<span class="badge ${cls}">${d}</span>`;
                }
                return d;
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
        const data = state.data;

        const container = document.getElementById('statistics');
        container.innerHTML = '<div class="row text-center"></div>';
        const row = container.querySelector('.row');

        stats.forEach(stat => {
            let count = 0;

            if (stat.type === 'count') {
                if (stat.key === 'total') {
                    count = data.length;
                } else if (stat.match !== undefined) {
                    count = data.filter(row => String(row[stat.key]) === stat.match).length;
                } else {
                    count = data.filter(row => row[stat.key] !== undefined).length;
                }
            }

            const statHTML = `
                <div class="col">
                    <h3>${count}</h3>
                    <p>${stat.label}</p>
                </div>
            `;
            row.innerHTML += statHTML;
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