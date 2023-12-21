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
import cors from 'cors';

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use(express.static('public'));
app.use(express.static(path.join(__dirname, 'src')));
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.urlencoded({ extended: true }));

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

app.post ('/upload', uploads.single('csvFile'), (req, res) => {
    console.log(req.file.path)
    uploadCSV(__dirname + "/data/" + req.file.filename)
    res.send("awikwok")
});

function uploadCSV (path) {
    let stream = fs.createReadStream(path)
    let CSVDataColl = []
    let fileStream = csv
    .parse({ delimiter: ';' })
    .on('data', function(data){
        if (data[4] === null || data[4] === '') {
            data[4] = 0;
        } else {
            data[4] = parseFloat(data[4]);
        }

        const parsedDate = moment(data[7], 'DD/MM/YYYY', true);

        if (parsedDate.isValid()) {
            data[7] = parsedDate.format('YYYY-MM-DD');
            CSVDataColl.push(data);
        } else {
            console.error(`Invalid date: ${data[7]}`);
        }
    })
    .on('end', function(){
        console.log("CSV Parsing completed");
        CSVDataColl.shift()

        pool.getConnection((error, connection) => {
            if (error) {
                console.log(error)
            } else {
                let query = "INSERT INTO Customer (ID, Year_Birth, Education,Marital_Status, Income, Kidhome, Teenhome, Dt_Customer, Recency,  MntWines, MntFruits, MntMeatProducts, MntFishProducts, MntSweetProducts, MntGoldProds, NumDealsPurchases, NumWebPurchases, NumCatalogPurchases, NumStorePurchases,NumWebVisitsMonth, AcceptedCmp3, AcceptedCmp4, AcceptedCmp5,AcceptedCmp1, AcceptedCmp2, Complain, Z_CostContact, Z_Revenue, Response) VALUES ?"
                connection.query(query, [CSVDataColl], (error, res) => {
                    if (error) {
                        console.log(error);
                    } else {
                        console.log("Inserted rows: " + res.affectedRows);
                    }
                    connection.release();
                })
            }
        })
        fs.unlinkSync(path)
    })
    stream.pipe(fileStream)
}

app.get('/filterdata', (req, res) => {
    res.render('FilterData');
});

app.post('/filter', (req, res) => {
    const { firstFilter, filterType, filterValue } = req.body;
    console.log(firstFilter, filterType, filterValue)

    let filterAvgSum, filterColumn, groupByColumn;

    const AVG = 'AVG';
    const COUNT = 'COUNT';
    const SUM = 'SUM';

    switch (firstFilter) {
        case 'avg':
            filterAvgSum = AVG;
            break;
        case 'count':
            filterAvgSum = COUNT;
            break;
        case 'sum':
            filterAvgSum = SUM;
            break;
    }

    switch (filterType) {
        case 'Income':
            filterColumn = 'Income';
            break;
        case 'Recency':
            filterColumn = 'Recency';
            break;
        case 'TeenHome':
            filterColumn = 'TeenHome';
            break;
        case 'KidHome':
            filterColumn = 'KidHome';
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

    switch (filterValue) {
        case 'Education':
            groupByColumn = 'Education';
            break;
        case 'Marital_Status':
            groupByColumn = 'Marital_Status';
            break;
    }

    const query = `SELECT ${filterAvgSum}(${filterColumn}), ${groupByColumn} FROM customer GROUP BY ${groupByColumn}`

    pool.query(query, (error, results) => {
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

app.post('/getChartData', (req, res) => {
    const dataType = req.body.dataType;
    console.log(dataType);

    const query = `SELECT ${dataType}, COUNT(*) as value FROM customer GROUP BY ${dataType} ORDER BY ${dataType} ASC;`;

    pool.query(query, (error, results) => {
        if (error) {
            console.error('Database query error:', error);
            res.status(500).send('Internal Server Error');
            return;
        }

        const responseData = {
            labels: results.map(row => row[dataType]),
            values: results.map(row => row.value)
        };

        res.json(responseData);
    });
});

app.get('/scatterplot', (req, res) => {
    res.render('ScatterPlot');
});

app.listen(3500, () => {
    console.log('Server running on port 3500');
});