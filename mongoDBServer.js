const express = require('express');
const mongoose = require('mongoose');
const mysql = require("mysql");
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const SERVER_PORT = process.env.MONGO_SERVER_PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

// Mysql connection
const connection = mysql.createConnection({
  host: process.env.MYSQL_HOST,
  port: process.env.MYSQL_PORT,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE
})

connection.connect(err => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL');
});

// Mongodb connection
mongoose.connect(MONGO_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Error connecting to MongoDB:', err));

// Mongodb schema
const operationsSchema = new mongoose.Schema({
  idOperation: Number,
  idClient: Number,
  dateOperation: Date,
  typeOperation: String,
  montantOperation: String
});

// Mongodb model from schema
const operations = mongoose.model('operations', operationsSchema);

app.get('/', (req, res) => {
  res.status(200).json({message: 'Hello World!'});
});

app.get('/operations', (req, res) => {
  operations.find({}, {"_id": 0})
      .then(data => res.json(data))
      .catch(err => res.json({message: err.message}));
});

app.get('/operations/:id', (req, res) => {
  operations.find({idOperation: req.params.id}, {"_id": 0})
      .then(data => res.json(data))
      .catch(err => res.json({message: err.message}));
});

app.post('/operations', bodyParser.json(), (req, res) => {
  const newOperation = new operations(req.body);
  newOperation.save()
      .then(data => res.status(201).json(data))
      .catch(err => res.json({message: err.message}));
});

app.put('/operations/:id', bodyParser.json(), (req, res) => {
  operations.updateOne({idOperation: req.params.id}, req.body)
      .then(data => res.json(data))
      .catch(err => res.json({message: err.message}));
});

app.delete('/operations/:id', (req, res) => {
  operations.deleteOne({idOperation: req.params.id})
      .then(data => res.json(data))
      .catch(err => res.json({message: err.message}));
});

app.get('/upload', async (req, res) => {
  const data = await operations.find({}, {"_id": 0})
  for (let row of data) {
    connection.query('INSERT INTO operations VALUES(?,?,?,?,?)', [row.idOperation, row.idClient, row.dateOperation, row.typeOperation, row.montantOperation], (err, data) => {
      if (err) {
        res.json({message: err.message, query: err.sql});
        return;
      }
      res.status(201).json(data);
    });
  }
});

app.get('/download', async (req, res) => {
  try {
    const data = await new Promise((resolve, reject) => {
      connection.query('SELECT * FROM operations', (err, data) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(data);
      });
    });
    for (let row of data) {
      const newOperation = new operations({
        idOperation: row.id_operation,
        idClient: row.id_client,
        dateOperation: row.date_operation,
        typeOperation: row.type_operation,
        montantOperation: row.montant_operation
      });
      await newOperation.save();
    }
    res.json({message: 'Data downloaded successfully'});

  } catch (err) {
    res.json({message: err.message});
  }
});

app.listen(SERVER_PORT, () => {
      console.log(`Server is running on port ${SERVER_PORT}`);
    }
)
