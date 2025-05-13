# Data Explorer

**Data Explorer** is a lightweight, browser-based interface for exploring structured data. There's no backend, no build process, and no dependencies — just HTML, CSS, and JavaScript. Drop in your dataset and a matching configuration, and it renders a fully interactive table with filters, search, statistics, and CSV export.

You can use this for quick internal dashboards, dataset previews, or lightweight tools for sharing data with others. Everything runs entirely in the browser.

---

## Getting Started

To run the app, just open `index.html` in your browser.

If you'd rather serve it locally (to avoid browser restrictions on file loading), you can use a Python HTTP server:

```bash
python3 -m http.server
```

Then open [http://localhost:8000](http://localhost:8000) in your browser.

---

## How It Works

When the page loads, it pulls in two files:

* `data.json`: your dataset, formatted as an array of objects.
* `config.js`: a configuration file that defines which fields to show, how to format them, and what filters or stats to include.

Based on that, the app builds:

* A filterable, sortable data table with column visibility controls
* Filter buttons next to each column header for easy filtering
* A top section showing summary statistics (like total records, active users, etc.)
* Export to CSV for the current filtered view

All of this is handled client-side — no JavaScript changes are needed to support a new dataset, as long as the structure is reflected in the config.

---

## Customization

You can adapt the interface for your data:

* **Swap the data:**
  Replace `data.json` with your own. Just make sure it's an array of objects with consistent keys.

* **Adjust the config:**
  In `config.js`, you define how each field should behave — its label, visibility, formatting (like currency or date), and how it supports filtering.
  
  The config also supports theme customization:
  ```javascript
  theme: {
      colorScheme: 'slate',    // Color scheme: 'default', 'slate', 'blue', 'green', 'purple'
      buttonStyle: 'flat',     // Button style: 'default', 'flat', 'rounded' 
      cardStyle: 'minimal'     // Card style: 'default', 'minimal', 'shadow'
  }
  ```
  
  This lets you change the application's appearance:
  - **colorScheme**: Changes the primary color for buttons, stats, and active elements
  - **buttonStyle**: Modifies the button appearance throughout the interface
  - **cardStyle**: Adjusts the card containers' borders and shadows

* **Badge colors for values:**
  You can define custom colors for specific field values using Bootstrap classes or hex colors:
  ```javascript
  badges: {
      'Active': 'bg-success',           // Bootstrap color classes
      'On Leave': 'bg-warning',
      'Contract': '#6b5b95',            // Or hex colors
      'Terminated': '#d64161'
  }
  ```

* **Tweak the design:**
  For deeper customization, the styling is defined in `style.css`. Bootstrap 5 is used as the foundation, so you can modify colors, spacing, fonts, or layout as needed.

The JavaScript in `app.js` is generic and driven by the config, so you rarely need to modify it unless you're adding entirely new behavior.

---

## Filtering

Data Explorer supports several types of filters:

* **Text filters**: Free-text search for string fields
* **Select filters**: Dropdown selection for categorical data
* **Numeric/currency filters**: Range sliders with optional exact value inputs
* **Date filters**: Date range selection
* **Multi-label filters**: For comma-separated values like skills or tags

Filter buttons appear next to each column header, and active filters are displayed in the filter section at the top of the page.

---

## Deployment

Because it's all static files, you can host this anywhere — GitHub Pages, Netlify, Vercel, S3, or even on a shared drive.

To deploy, make sure you include:

* `index.html`
* `app.js`
* `config.js`
* `data.json`
* `style.css`
* `theme.js`

All files should live in the same directory for everything to load correctly.

---

## Notes

* The dataset (`data.json`) and configuration (`config.js`) must be in the same folder as `index.html`.
* Filtering is done entirely in the browser, so performance may drop with very large datasets (10k+ rows).
* If you'd prefer to pull data from an API or remote source, you can modify the `fetch()` call in `app.js`.

---

## Use Cases

Data Explorer is useful for:

* Quickly exploring a dataset without building a full app
* Making lightweight, shareable dashboards
* Prototyping with real data
* Giving non-technical users a way to interact with structured information