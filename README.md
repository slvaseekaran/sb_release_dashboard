# Release Notes Generator

A modern web application for generating, editing, and managing release notes by comparing `.env` files. This tool streamlines release documentation, PR/Work Item hyperlinking, and provides an intuitive navigation experience.

---

## 🚀 Features

- Compare two `.env` files to auto-generate release notes.
- GET and POST workflows for release notes.
- Automatic hyperlinking for PRs and Azure Work Items.
- Export release notes as Markdown.
- Clean, responsive user interface.

---

## 🛠 Requirements

- Node.js (v14 or higher recommended)
- npm (included with Node.js)
- Modern web browser (Chrome, Firefox, Edge, etc.)

---

## ⚙️ Installation & Setup

```bash
git clone https://github.com/slvaseekaran/release-notes-app.git
cd release-notes-app
npm install
node server.js
```

Then, open your browser and visit:

```
http://localhost:3000
```

---

## ▶️ Running the Application

- The server serves static files from the `public/` directory.
- Frontend logic resides in `main.js` (no build step required).
- The app is ready to use as soon as the server is running.

---

## 📘 Usage Guide

### POST Release Notes (Generate New)

1. **Navigate to Home Screen**  
   Click **POST RELEASE NOTES**.

2. **Upload Files**  
   - Select your previous `.env` file.  
   - Select your current `.env` file.  
   - Use the **Clear** button to unselect files.

3. **Generate Notes**  
   Click **Generate Release Notes** to generate notes grouped by repository.

4. **Finalize**  
   - Click **POST RELEASE NOTES** to save (backend connection required).  
   - Or click **Download as Markdown** to export.

---

### GET Release Notes (View Existing)

1. **Navigate to Home Screen**  
   Click **GET RELEASE NOTES**.

2. **Browse Versions**  
   View and select from a list of previously generated versions.

3. **Review & Edit**  
   - Use tabs to switch between IO AMR, Sootball, and Azure Work Items.  
   - PRs and Azure Work Items are auto-hyperlinked.

4. **Export**  
   Click **Download as Markdown**.

---

## 🧰 Troubleshooting

| Issue                     | Solution                                                                 |
|--------------------------|--------------------------------------------------------------------------|
| UI not styled?           | Ensure `styles.css` is in the `public/` folder and linked in `index.html`. |
| Buttons not working?     | Confirm `main.js` is loaded and check browser console for errors.         |
| Server not running?      | Run `node server.js` and verify it's available at `http://localhost:3000`. |
| File input not clearing? | Click the **Clear** button next to each file input.                        |

---
