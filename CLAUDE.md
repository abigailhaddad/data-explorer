# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Data Explorer is a lightweight, browser-based interface for exploring structured data. It's built entirely with HTML, CSS, and JavaScript, with no backend, build process, or dependencies. The application renders a fully interactive table with filters, search, statistics, and CSV export based on a provided dataset and configuration.

### Key Components

- `index.html`: Main HTML file that loads all required resources
- `app.js`: Main application JavaScript that powers the data table and filtering
- `config.js`: Configuration file that defines fields, filters, and statistics
- `data.json`: JSON data file containing the dataset
- `style.css`: Custom styling for the interface
- `theme.js`: Handles theming and appearance customization

## Running the Application

The simplest way to run the application is to open `index.html` directly in a browser. However, some browsers restrict file loading due to security policies, so a local HTTP server is recommended:

```bash
python3 -m http.server
```

Then open [http://localhost:8000](http://localhost:8000) in your browser.

## Working with Data

### Data Format

The application expects data in `data.json` as an array of objects with consistent keys. The structure should match the field definitions in `config.js`.

### Generating Sample Data

The repository includes a Python script to generate sample data:

```bash
python3 gen_data.py
```

This script uses the Faker library to create realistic sample data that matches the expected schema.

## Customization

### Configuration

The `config.js` file controls how the application works with the dataset:

- `title` and `subtitle`: Set the application title
- `fields`: Define the columns, including:
  - `key`: The property name in the data object
  - `title`: Display name
  - `filter`: Type of filter (select, text, numeric, multi-label)
  - `format`: Formatting (currency, date, multi-label)
  - `visible`: Whether column is visible by default
  - `badges`: Optional styling for categorical values

### Theming

The application supports theming through:

- `theme.js`: Defines color schemes and styling options
- `style.css`: Contains core styling rules

Theme options can be configured in the `config.js` file under the `theme` property:
```javascript
theme: {
    colorScheme: 'slate',    // Options: default, blue, teal, slate, darkblue, forest
    buttonStyle: 'flat',     // Options: default, rounded, flat
    cardStyle: 'minimal'     // Options: subtle, elevated, material, bordered, minimal, glass
}
```

## Structure and Architecture

The application is structured as follows:

1. **Data Loading**: Fetches JSON data
2. **Table Initialization**: Creates a DataTables instance with configured columns
3. **Filter Creation**: Builds filter UI based on config
4. **Stats Generation**: Calculates and displays statistics
5. **Event Listeners**: Handles user interactions

The application provides:
- Filterable, sortable data tables
- Interactive filter controls (select menus, ranges, multi-select)
- Summary statistics based on filtered data
- CSV export functionality
- Column visibility controls
- Responsive design for various screen sizes

## Deployment

The application can be deployed on any static file hosting service or server. Required files:

- `index.html`
- `app.js`
- `config.js`
- `data.json`
- `style.css`
- `theme.js`

All files should be in the same directory.