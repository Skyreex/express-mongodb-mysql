const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const mongoose = require("mongoose");
require('dotenv').config();

const app = express();
const SERVER_PORT = process.env.MYSQL_SERVER_PORT || 3000;
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
  res.status(200).json({message: 'Mysql server is running!'});
});

app.get('/operations', (req, res) => {
      connection.query('SELECT * FROM operations', (err, data) => {
        if (err) {
          res.json({message: err.message});
          return;
        }
        res.json(data);
      });
    }
);

app.get('/operations/:id', (req, res) => {
      connection.query('SELECT * FROM operations WHERE id_operation = ?', [req.params.id], (err, data) => {
        if (err) {
          res.json({message: err.message});
          return;
        }
        res.json(data);
      });
    }
);

app.post('/operations', bodyParser.json(), (req, res) => {
  connection.query('INSERT INTO operations SET ?', req.body, (err, data) => {
    if (err) {
      res.json({message: err.message, query: err.sql});
      return;
    }
    res.status(201).json(data);
  });
});

app.put('/operations/:id', bodyParser.json(), (req, res) => {
      connection.query('UPDATE operations SET ? WHERE id_operation = ?', [req.body, req.params.id], (err, data) => {
        if (err) {
          res.json({message: err.message});
          return;
        }
        res.json(data);
      });
    }
);

app.delete('/operations/:id', (req, res) => {
      connection.query('DELETE FROM operations WHERE id_operation = ?', [req.params.id], (err, data) => {
        if (err) {
          res.json({message: err.message});
          return;
        }
        res.json(data);
      });
    }
);

app.get('/download', async (req, res) => {
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

app.get('/upload', async (req, res) => {
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
  console.log(`Mysql Server is running on port ${SERVER_PORT}`);
});
