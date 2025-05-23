// Configuration file for the Data Explorer
window.DATASET_CONFIG = {
    title: 'Employees Database',
    subtitle: 'HR Department', // Optional subtitle - will be shown in the navbar if provided
    datasetName: 'Employees',
    keyField: 'id',
    
    // Theme options (optional)
    theme: {
        colorScheme: 'slate',
        buttonStyle: 'flat',
        cardStyle: 'minimal'
    },
    
    fields: [
        { 
            key: 'id',           
            title: 'ID',           
            visible: false 
        },
        { 
            key: 'name',         
            title: 'Name',         
            filter: 'text', 
            visible: true 
        },
        { 
            key: 'email',        
            title: 'Email',        
            filter: 'text', 
            visible: true 
        },
        { 
            key: 'department',   
            title: 'Department',   
            filter: 'select', 
            visible: true 
        },
        { 
            key: 'title',        
            title: 'Title',        
            filter: 'text', 
            visible: true,
            charLimit: 10 // Example with a different limit
        },
        {
            key: 'skills',
            title: 'Skills',
            filter: 'multi-label',
            format: 'multi-label',
            visible: true
        },
        { 
            key: 'salary',       
            title: 'Salary',       
            format: 'currency', 
            filter: 'numeric',
            visible: true 
        },
        { 
            key: 'location',     
            title: 'Location',     
            filter: 'select', 
            visible: true 
        },
        { 
            key: 'joined',       
            title: 'Join Date',    
            format: 'date', 
            filter: 'numeric',
            visible: true 
        },
        {              
            key: 'status',                  
            title: 'Status',                
            filter: 'select',              
            visible: true,             
            badges: {
                'Active': 'bg-success',
                'On Leave': 'bg-warning',
                'Contract': 'bg-info',
                'Probation': 'bg-secondary',
                'Terminated': 'bg-danger'
            }
        },
        { 
            key: 'notes',        
            title: 'Notes',        
            filter: 'text', 
            visible: false,
            charLimit: 50 // Limit to 100 characters with mouseover expansion
        }
    ],
    
    stats: [
        { 
            key: 'total',        
            label: 'Total Records',    
            type: 'count' 
        },
        { 
            key: 'status',       
            label: 'Active Employees', 
            type: 'count', 
            match: 'Active' 
        },
        { 
            key: 'department',   
            label: 'Departments',      
            type: 'unique' 
        },
        { 
            key: 'salary',       
            label: 'Min Salary',       
            type: 'min', 
            format: 'currency' 
        },
        { 
            key: 'salary',       
            label: 'Total Payroll',    
            type: 'sum', 
            format: 'currency' 
        }
    ]
};