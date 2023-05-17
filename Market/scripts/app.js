require('dotenv').config()

const libary = require('./libary')
const express = libary.express
const configureApp = libary.config
const app = express()
const path = libary.path
const session = require('express-session')

configureApp(app)

app.use('/scripts/uploads', express.static(path.join(__dirname, 'uploads')))
app.use('/public', express.static(path.join(__dirname, '../templates/public')))
const { AppModule } = require('./module')
const modules = new AppModule(app)
modules.setup()

const { PersonModule } = require('./module')
const modulesPerson = new PersonModule(app)
modulesPerson.setup()

const { Economy } = require('./module')
const modulesEconomy = new Economy(app)
modulesEconomy.setup()

app.use(
  session({
    secret: '473e1e9d07e812630e3fb097c782ff86a02eef184f6715c6e62c4d492d70bf60',
    resave: false,
    saveUninitialized: true,
  })
)

app.listen(app.get('port'), () => {
  console.log('Server is running on http://localhost:%s', app.get('port'))
})
