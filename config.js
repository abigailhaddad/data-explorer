// config.js
window.DATASET_CONFIG = {
    title: 'Employees Database Test',
    datasetName: 'Employees',
    keyField: 'id',
    fields: [
        { key: 'id',           title: 'ID',           visible: false },
        { key: 'name',         title: 'Name',         filter: 'text', visible: true },
        { key: 'email',        title: 'Email',        filter: 'text', visible: true },
        { key: 'department',   title: 'Department',   filter: 'select', visible: true },
        { key: 'title',        title: 'Title',        filter: 'text', visible: true },
        { key: 'salary',       title: 'Salary',       format: 'currency', visible: true },
        { key: 'location',     title: 'Location',     filter: 'select', visible: true },
        { key: 'joined',       title: 'Join Date',    format: 'date', visible: true },
        { key: 'status',       title: 'Status',       filter: 'select', visible: true },
        { key: 'notes',        title: 'Notes',        visible: false }
    ],
    stats: [
        { key: 'total',     label: 'Total Records',    type: 'count' },
        { key: 'status',    label: 'Active Employees', type: 'count', match: 'Active' },
        { key: 'status',    label: 'On Leave',         type: 'count', match: 'On Leave' },
        { key: 'status',    label: 'Contractors',      type: 'count', match: 'Contract' }
    ]
};