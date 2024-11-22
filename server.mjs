import express from 'express';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve the frontend HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve other static frontend files (like CSS, JS)
app.use(express.static(path.join(__dirname, 'webapp')));

// Endpoint to retrieve access token from Salesforce
app.post('/get-access-token', async (req, res) => {
    const { clientId, clientSecret, username, password } = req.body;
    const instanceUrl = 'https://login.salesforce.com';

    if (!clientId || !clientSecret || !username || !password) {
        return res.status(400).send('Please ensure client ID, client secret, username, and password are provided.');
    }

    try {
        const response = await fetch(`https://login.salesforce.com/services/oauth2/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                'grant_type': 'password',
                'client_id': clientId,
                'client_secret': clientSecret,
                'username': username,
                'password': password
            })
        });

        if (!response.ok) {
            throw new Error(`Error: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

app.post('/run-query', async (req, res) => {
    const { instanceUrl, clientId, clientSecret, username, password, soqlQuery } = req.body;

    if (!instanceUrl || !clientId || !clientSecret || !username || !password || !soqlQuery) {
        return res.status(400).send('Please ensure all fields are provided.');
    }

    try {
        // Generate access token
        const tokenResponse = await fetch(`${instanceUrl}/services/oauth2/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                grant_type: 'password',
                client_id: clientId,
                client_secret: clientSecret,
                username: username,
                password: password
            })
        });

        if (!tokenResponse.ok) {
            throw new Error(`Error: ${tokenResponse.status} - ${tokenResponse.statusText}`);
        }

        const tokenData = await tokenResponse.json();
        console.log(tokenData);
        const accessToken = tokenData.access_token;

        // Run SOQL query
        const queryResponse = await fetch(`${instanceUrl}/services/data/v57.0/query?q=${encodeURIComponent(soqlQuery)}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!queryResponse.ok) {
            throw new Error(`Error: ${queryResponse.status} - ${queryResponse.statusText}`);
        }

        const data = await queryResponse.json();
        res.json(data);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
