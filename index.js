const express = require('express');
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.set('view engine', 'ejs');
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.send('Job Board Platform');
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
