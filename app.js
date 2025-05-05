(function () {
    const state = {
        data: [],
        table: null,
        filters: {},
    };

    document.addEventListener('DOMContentLoaded', initialize);

    function initialize() {
        setupEventListeners();
        loadData();
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
        state.table = $('#data-table').DataTable({
            data: state.data,
            columns: [
                { data: 'id', title: 'ID' },
                { data: 'name', title: 'Name' },
                { data: 'department', title: 'Department' },
                { data: 'title', title: 'Title' },
                {
                    data: 'salary',
                    title: 'Salary',
                    render: d => `$${d.toLocaleString()}`
                },
                { data: 'location', title: 'Location' },
                {
                    data: 'joined',
                    title: 'Join Date',
                    render: d => new Date(d).toLocaleDateString()
                },
                {
                    data: 'status',
                    title: 'Status',
                    render: d => `<span class="badge ${d === 'Active' ? 'bg-success' : 'bg-warning'}">${d}</span>`
                },
                {
                    data: 'notes',
                    title: 'Notes',
                    render: d => `<div class="cell-expandable">${d}</div>`
                }
            ],
            responsive: true,
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
        const fields = [
            { key: 'name', type: 'text' },
            { key: 'title', type: 'text' },
            { key: 'department', type: 'select' },
            { key: 'location', type: 'select' },
            { key: 'status', type: 'select' }
        ];

        const container = document.getElementById('filter-buttons');
        container.innerHTML = '';

        fields.forEach(field => {
            const btn = document.createElement('button');
            btn.className = 'btn btn-outline-primary me-2 mb-2';
            btn.textContent = field.key.charAt(0).toUpperCase() + field.key.slice(1);
            btn.addEventListener('click', () => showFilterModal(field));
            container.appendChild(btn);
        });
    }

    function showFilterModal(field) {
        const modal = document.getElementById('filter-modal');
        const existing = state.filters[field.key] || [];

        let bodyContent = '';

        if (field.type === 'select') {
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
                        <h5 class="modal-title">Filter by ${field.key}</h5>
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

        if (field.type === 'text') {
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
            if (field.type === 'select') {
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
            values.forEach(val => {
                const tag = document.createElement('div');
                tag.className = 'filter-tag';
                tag.innerHTML = `${key}: ${val} <span class="close" data-key="${key}" data-val="${val}">&times;</span>`;
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
        const total = state.data.length;
        const visible = state.table.rows({ search: 'applied' }).data().toArray();
        const active = visible.filter(r => r.status === 'Active').length;
        document.getElementById('total-records').textContent = total;
        document.getElementById('active-records').textContent = active;
    }

    function exportCSV() {
        const rows = state.table.rows({ search: 'applied' }).data().toArray();
        const headers = state.table.columns().header().toArray().map(h => h.textContent.trim());
        let csv = headers.join(',') + '\n';

        rows.forEach(row => {
            const line = headers.map(h => {
                let key = h.toLowerCase();
                let val = row[key] ?? '';
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
