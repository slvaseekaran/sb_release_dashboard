**Release Notes Generator**

A modern web application for generating, editing, and managing release notes by comparing .env files. Designed to streamline release documentation, PR/Work Item hyperlinking, and for better navigating experience.

**Features**
    Compare two .env files to auto-generate release notes.
    GET and POST workflows for release notes.
    Automatic hyperlinking for PRs and Azure Work Items.
    Download release notes as markdown.
    Modern, responsive UI.

**Requirements**
    Node.js (v14 or higher recommended)
    npm (comes with Node.js)
    Modern web browser

**Installation & Setup**

    Clone the repository:
    git clone https://github.com/slvaseekaran/release-notes-app.git
    cd release-notes-app

    Install dependencies:
    npm install

    Start the server:
    node server.js

    Open the app:
    Visit http://localhost:3000 in your browser.

**Running the Application:**
    The server will serve all static files from the public/ directory.
    All frontend logic is handled in main.js. No build step is required.
    The app is ready to use as soon as the server is running.


**Usage Guide:**

    **POST Release Notes (Generate New)**
    Use this when you want to generate new release notes by comparing two .env files:

    1. Navigate to the Home Screen
       Click POST RELEASE NOTES.

    2. Upload Files
       Click Choose file next to "Previous .env file" and select your previous .env file.
       Click Choose file next to "Current .env file" and select your current .env file.
       If you need to change your selection, click the Clear button to unselect the file.

    3. Generate Notes
       Click Generate Release Notes.
       The app will compare the two files and generate detailed release notes, grouped by repository.

    4. Finalize
       Click POST RELEASE NOTES to save the notes (if backend is connected).
       Or click Download as Markdown to export the notes for sharing or archiving.

    **GET Release Notes (View)**
    Use this to view previously generated release notes:

    1. Navigate to the Home Screen
       Click GET RELEASE NOTES.

    2. Browse Versions
       View the list of available release note versions.
       Click on a version to view its details.

    3. Review & Edit
       Use the tabs to switch between IO AMR, Sootball, and Azure Work Items.
       All PR and Azure Work Item references are auto-linked.

    4. Export
       Click Download as Markdown to export the current release notes.

**Troubleshooting:**
    UI not styled?
    Ensure styles.css is in the public/ folder and linked in index.html.

    Buttons not working?
    Ensure main.js is loaded and there are no JavaScript errors (check browser console).

    Server not running?
    Start with node server.js and ensure you see Server running at http://localhost:3000.

    File input not clearing?
    Use the Clear button next to each file input to unselect a file.
