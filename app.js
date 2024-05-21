const express = require("express");
const app = express();
const handlebars = require("express-handlebars").engine;
const bodyParser = require("body-parser");
const { initializeApp, applicationDefault, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const Handlebars = require('handlebars');
const { eq } = require('handlebars-helpers')();
Handlebars.registerHelper('eq', eq);


const serviceAccount = require('./mari.json');

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

app.engine("handlebars", handlebars({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get("/", function (req, res) {
  res.render("primeira_pagina");
});

app.get("/consulta", async function (req, res) {
  try {
    const agendamentosRef = db.collection('agendamentos');
    const querySnapshot = await agendamentosRef.select('nome', 'telefone', 'origem', 'data_contato', 'observacao').get();
    const agendamentos = [];

    querySnapshot.forEach((doc) => {
      agendamentos.push({ id: doc.id, ...doc.data() });
    });

    res.render("consulta_pagina", { agendamentos });
  } catch (error) {
    console.error("Error fetching documents: ", error);
    res.status(500).send("Erro ao buscar documentos");
  }
});

app.get("/editar/:id", async function (req, res) {
    try {
      const docRef = db.collection('agendamentos').doc(req.params.id);
      const doc = await docRef.get();
      if (!doc.exists) {
        console.log('No such document!');
        res.status(404).send("Documento não encontrado");
      } else {
        res.render("editar_pagina", { id: req.params.id, agendamento: doc.data() });
      }
    } catch (error) {
      console.error("Error getting document: ", error);
      res.status(500).send("Erro ao buscar documento");
    }
  });
  
  app.post("/atualizar/:id", async function (req, res) {
    try {
      const docRef = db.collection('agendamentos').doc(req.params.id);
      await docRef.update({
        nome: req.body.nome,
        telefone: req.body.telefone,
        origem: req.body.origem,
        data_contato: req.body.data_contato,
        observacao: req.body.observacao
      });
      console.log('Document successfully updated');
      res.redirect('/consulta');
    } catch (error) {
      console.error("Error updating document: ", error);
      res.status(500).send("Erro ao atualizar documento");
    }
  });
  

app.get("/excluir/:id", async function (req, res) {
    try {
      await db.collection('agendamentos').doc(req.params.id).delete();
      console.log('Document successfully deleted');
      res.redirect('/consulta');
    } catch (error) {
      console.error("Error deleting document: ", error);
      res.status(500).send("Erro ao excluir documento");
    }
  });

app.post("/cadastrar", function (req, res) {
  db.collection('agendamentos').add({
    nome: req.body.nome,
    telefone: req.body.telefone,
    origem: req.body.origem,
    data_contato: req.body.data_contato,
    observacao: req.body.observacao
  }).then(function () {
    console.log('Added document');
    res.redirect('/');
  }).catch(function (error) {
    console.error("Error adding document: ", error);
    res.status(500).send("Erro ao cadastrar agendamento");
  });
});


app.listen(8081, function () {
  console.log("Servidor ativo!");
});
