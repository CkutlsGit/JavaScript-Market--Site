const express = require('express')
const ejs = require('ejs')
const path = require('path')
const AddItem = require('./db').AddItem

const configureApp = (app) => {
  app.set('port', process.env.PORT || 3001)
  app.set('views', path.join(__dirname, 'views'))
  app.set('view engine', 'ejs')
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))
  app.use(express.static('templates'));
  /*
  app.use(express.static('public')) 
  app.use(express.static(path.join(__dirname, 'public')))
  */
}

module.exports = {
  express,
  ejs,
  path,
  AddItem
}

module.exports.config = configureApp
