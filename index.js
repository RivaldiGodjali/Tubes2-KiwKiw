import express from 'express';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';
import mysql from 'mysql2';
import bodyParser from 'body-parser';
import multer from 'multer';
import csv from 'fast-csv';
import fs from 'fs'
import moment from 'moment';

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

let storage = multer.diskStorage({
    destination:(req, res, callback) => {
        callback(null,"./data/")
    },
    filename:(req, file, callback)=>{
        callback(null, file.fieldname + "-" + Date.now() + path.extname(file.originalname))
    }
})

let uploads = multer({
    storage: storage
})

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'tubes_manpro',
});

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

app.post('/filter', (req, res) => {
    const { firstFilter, filterType, filterValue, subFilterType, subFilterValue } = req.body;

    let filterAvgSum, filterColumn, subFilterColumn;

    switch (firstFilter) {
        case 'avg':
            filterAvgSum = AVG;
            break;
        case 'count':
            filterAvgSum = COUNT;
            break;
    }

    switch (filterType) {
        case 'Income':
            filterColumn = 'Income';
            break;
        case 'Recency':
            filterColumn = 'Recency';
            break;
        case 'MntWines':
            filterColumn = 'MntWines';
            break;
        case 'MntFruits':
            filterColumn = 'MntFruits';
            break;
        case 'MntMeatProducts':
            filterColumn = 'MntMeatProducts';
            break;
        case 'MntFishProducts':
            filterColumn = 'MntFishProducts';
            break;
        case 'MntSweetProducts':
            filterColumn = 'MntSweetProducts';
            break;
        case 'MntGoldProds':
            filterColumn = 'MntGoldProds';
            break;
        case 'NumDealsPurchases':
            filterColumn = 'NumDealsPurchases';
            break;    
        case 'NumWebPurchases':
            filterColumn = 'NumWebPurchases';
            break;
        case 'NumCatalogPurchases':
            filterColumn = 'NumCatalogPurchases';
            break;   
        case 'NumStorePurchases':
            filterColumn = 'NumStorePurchases';
            break;
        case 'NumWebVisitsMonth':
            filterColumn = 'NumWebVisitsMonth';
            break;    
        default:
            res.status(400).send('Invalid filterType');
            return;
    }

    if (subFilterType === 'Education' || subFilterType === 'Marital_Status') {
        switch (subFilterType) {
            case 'Education':
                subFilterColumn = 'Education';
                break;
            case 'Marital_Status':
                subFilterColumn = 'Marital_Status';
                break;
            case 'Marital_Status':
                subFilterColumn = 'Marital_Status';
                break;
            case 'Graduation':
                subFilterColumn = 'Graduation';
                break;
            case 'PhD':
                subFilterColumn = 'PhD';
                break;
            case 'Master':
                subFilterColumn = 'Master';
                break;
            case '2nCycle':
                subFilterColumn = '2nCycle';
                break;
            case 'Basic':
                subFilterColumn = 'Basic';
                break;
            case 'Married':
                subFilterColumn = 'Married';
                break;
            case 'Single':
                subFilterColumn = 'Single';
                break;
            case 'Divorced':
                subFilterColumn = 'Divorced';
                break;
            case 'YOLO':
                subFilterColumn = 'YOLO';
                break;
            case 'Widow':
                subFilterColumn = 'Widow';
                break;
            case 'Absurd':
                subFilterColumn = 'Absurd';
                break;
            case 'Alone':
                subFilterColumn = 'Alone';
                break;
            default:
                res.status(400).send('Invalid subFilterType');
                return;
        }
    }

    let query;

    if(filterAvgSum === 'AVG') {
        if (subFilterColumn) {
            query = `SELECT ${subFilterColumn}, ${filterColumn}, AVG(${filterColumn}) as avg FROM Customer WHERE ${subFilterColumn} = ? GROUP BY ${subFilterColumn}, ${filterType}`;
        } else {
            query = `SELECT ${filterType}, ${filterColumn}, AVG(${filterColumn}) as avg FROM Customer GROUP BY ${filterType}`;
        }
    } else {
        if (subFilterColumn) {
            query = `SELECT ${subFilterColumn}, ${filterColumn}, COUNT(${filterType}) as count FROM Customer WHERE ${subFilterColumn} = ? GROUP BY ${subFilterColumn}, ${filterType}`;
        } else {
            query = `SELECT ${filterType}, COUNT(${filterType}) as count FROM Customer GROUP BY ${filterType}`;
        }
    }

    

    const values = [subFilterValue || filterValue];

    pool.query(query, values, (error, results) => {
        if (error) {
            console.error(error);
            res.status(500).send('Internal Server Error');
        } else {
            console.log(results);
            res.json(results);
        }
    });
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