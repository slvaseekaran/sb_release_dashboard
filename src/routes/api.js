const express = require('express');
const multer = require('multer');
const releaseNotesController = require('../controllers/releaseNotesController');
const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.post('/release-notes',
    upload.fields([
        { name: 'previousEnv', maxCount: 1 },
        { name: 'currentEnv', maxCount: 1 }
    ]),
    releaseNotesController.generateReleaseNotes
);

router.post('/release-notes/post', releaseNotesController.postReleaseNotes);
router.get('/release-notes/versions/:releaseType', releaseNotesController.getVersionsByReleaseType);
router.get('/release-notes/:releaseType/:version', releaseNotesController.getReleaseNotesByVersion);


module.exports = router;
