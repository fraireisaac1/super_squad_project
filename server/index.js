// index.js
// Required modules
const express = require('express');
const path = require('path');
const fs = require('fs').promises;

// Initialize Express application
const app = express();

// Define paths
const clientPath = path.join(__dirname, '..', 'client/src');
const superPath = path.join(__dirname, 'data', 'superheroes.json');
const serverPublic = path.join(__dirname, 'public');
// Middleware setup
app.use(express.static(clientPath)); // Serve static files from client directory
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(express.json()); // Parse JSON bodies

// Routes

// Home route
app.get('/', (req, res) => {
    res.sendFile('index.html', { root: clientPath });
});

app.get('/superheroes', async (req, res) => {
    try {
        const data = await fs.readFile(superPath, 'utf8');

        const heroes = JSON.parse(data);
        if (!heroes) {
            throw new Error("Error no heroes available");
        }
        res.status(200).json(heroes);
    } catch (error) {
        console.error("Problem getting heroes" + error.message);
        res.status(500).json({ error: "Problem reading heroes" });
    }
});

app.get('/super', (req, res) => {
    res.sendFile('pages/form.html', { root: serverPublic });
});

app.post('/submit-form', async (req, res) => {
    try {
        const { name, si, universe, power } = req.body;
        let heroes = [];
        try {
            const data = await fs.readFile(superPath, 'utf8');
            heroes = JSON.parse(data);
        } catch (error) {
            console.error('Error reading superhero data: ', error);
            heroes = [];
        }

        let hero = heroes.find(h => h.name === name && h.si === si && h.universe === universe);
        if (hero) {
            hero.powers.push(power);
        } else {
            hero = { name, si, universe, powers: [power] };
            heroes.push(hero);
        }

        await fs.writeFile(superPath, JSON.stringify(heroes, null, 2));
        res.redirect('/super');
    } catch (error) {
        console.error('Error processing form:', error);
        res.status(500).send('An error occurred while processing your submission.');
    }
});

app.put('/update-hero/:currentName/:currentUniverse', async (req, res) => {
    try {
        const { currentName, currentUniverse } = req.params;
        const { newName, newUniverse } = req.body;
        console.log('Current superhero:', { currentName, currentUniverse });
        console.log('New superhero data:', { newName, newUniverse });
        const data = await fs.readFile(superPath, 'utf8');
        if (data) {
            let heroes = JSON.parse(data);
            const heroIndex = heroes.findIndex(hero => hero.name === currentName && hero.universe === currentUniverse);
            console.log(heroIndex);
            if (heroIndex === -1) {
                return res.status(404).json({ message: "Hero not found" });
            }
            heroes[heroIndex] = { ...heroes[heroIndex], name: newName, universe: newUniverse };
            console.log(heroes);

            await fs.writeFile(superPath, JSON.stringify(heroes, null, 2));

            res.status(200).json({ message: `You sent ${newName}, and ${newUniverse}` });
        }
    } catch (error) {
        console.error('Error updating hero:', error);
        res.status(500).send('An error occurred while updating the hero.');
    }
});

app.delete('/user/:name/:universe', async (req, res) => {
    try {
        // console.log(req.params)
        // then cache returned name and email as destructured variables from params
        console.log(req.params);
        console.log(req.params.name);
        console.log(req.params.universe);
        const { name, universe } = req.params;
        // initialize an empty array of 'users'
        let heroes = [];
        // try to read the users.json file and cache it as data
        try {
            const data = await fs.readFile(superPath, 'utf8');
            // parse the data
            heroes = JSON.parse(data);
        } catch (error) {
            return res.status(404).send('File data not found');
        }
        // cache the user index based on a matching name and email
        const heroIndex = heroes.findIndex(hero => hero.name === name && hero.universe === universe);
        // handle a situation where an index doesn't exist
        if (heroIndex === -1) {
            return res.status(404).send('Hero not found');
        }
        heroes.splice(heroIndex, 1);
        console.log(heroIndex);
        console.log(heroes);
        try {
            await fs.writeFile(superPath, JSON.stringify(heroes, null, 2));
        } catch (error) {
            console.error('Failed to write to database');
        }
        // splice the users array with the intended delete name and email
        // try to write the users array back to the file
        // send a success deleted message
        return res.send('successfully deleted hero');
    } catch (error) {
        res.status(500).send('There was a problem');
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});