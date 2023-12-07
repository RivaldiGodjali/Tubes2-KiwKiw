import express, { query } from 'express';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';
import mysql from 'mysql';
import bodyParser from 'body-parser';
import session from 'express-session';
import Swal from 'sweetalert2';

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use(express.static('public'));
app.use(express.static(path.join(__dirname, 'src')));

app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: 'password',
    resave: false,
    saveUninitialized: true
}));

// const connection = mysql.createConnection({
//     host: 'localhost',
//     user: 'root',
//     password: '',
//     database: 'tubes_rpl',
// });

app.set('view engine', 'ejs');

app.get('/', (req, res) => {
    res.render('home');
});

app.get('/adddata', (req, res) => {
    res.render('AddData');
});

app.get('/filterdata', (req, res) => {
    res.render('FilterData');
});

app.get('/barchart', (req, res) => {
    res.render('BarChart');
});

app.get('/scatterplot', (req, res) => {
    res.render('ScatterPlot');
});

app.listen(65000, () => {
    console.log('Server running on port 65000');
});