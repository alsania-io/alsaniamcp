// GUI Patch for AlsaniaMCP - Add static file serving for GChat UI
// To apply: Add this to http-gateway.ts or main server setup

const express = require('express');
const path = require('path');

// Add these lines to your Express app setup:
// app.use('/gui', express.static(path.join(__dirname, '../static/gui')));
// app.get('/', (req, res) => res.redirect('/gui'));

// Also need to update GChat frontend to connect to AlsaniaMCP backend:
// Change WebSocket URL from localhost:5001 to localhost:8051 (or appropriate)
// Change API endpoints from localhost:5000 to localhost:8050

console.log('GUI Patch: Add static file serving for /gui directory');