require('dotenv').config()
const multer = require('multer')
const session = require('express-session')
const path = require('path');
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname)
  }
})

const upload = multer({ storage: storage })

const AddItem = require('./db').AddItem
const Person = require('./db').Person

class AppModule {
  constructor(app) {
    this.app = app
    this.app.use(session({
      secret: '473e1e9d07e812630e3fb097c782ff86a02eef184f6715c6e62c4d492d70bf60',
      resave: false,
      saveUninitialized: true
    }))
  }

  setup() {
    this.homePage();
    this.marketPage();
    this.marketUniversal();
    this.addPage();
    this.addPageMethod();
  }

  homePage() {
    this.app.get('/', (req, res) => {
      const indexPath = path.join(__dirname, '../templates/html/index.html')
      res.sendFile(indexPath)
    })
  }

  marketPage() {
    this.app.get('/market', (req, res, next) => {
      const person = req.session.person || null
  
      AddItem.all((err, market) => {
        if (err) return next(err)
  
        res.format({
          html: () => {
            res.render('market.ejs', { market: market, person: person })
          },
          json: () => {
            res.send(market)
          }
        })
      })
    })
  }

  marketUniversal() {
    this.app.get('/market/:id', (req, res, next) => {
      const id = req.params.id
      const person = req.session.person || {}
  
      AddItem.find(id, (err, product) => {
        if (err) return next(err)
  
        if (!product) {
          res.status(404).send('Product not found')
          return
        }
  
        res.render('product.ejs', { product: product, person: person, id: id })
      })
    })
  }
  

  addPage() {
    this.app.get('/add', (req, res) => {
      const person = req.session.person || null
      res.render('add', { person: person })
    })
  }

  addPageMethod() {
    this.app.post('/add', upload.single('image'), (req, res, next) => {
      const { title, price, content } = req.body
      const image = req.file

      console.log('Received data:', { title, price, content, image })

      if (!title || !price || !content || !image) {
        res.status(500).send('Error: Invalid data')
        return
      }

      AddItem.create({ title, price, content, image: image.filename }, (err, market) => {
        if (err) return next(err)
        res.redirect('/market')
      })
    })
  }
}


class PersonModule {
  constructor(app) {
    this.app = app
  }

  setup() {
    this.PersonPage();
    this.PersonRegister();
    this.PersonRegisterMethod();
    this.PersonLoginPage();
    this.PersonLoginMethod();
    this.PersonAddMoney();
    this.PersonAddMoneyMethod();
  }

  PersonPage() {
    this.app.get('/person/:id', (req, res, next) => {
      const id = req.params.id

      Person.find(id, (err, person) => {
        if (err) return next(err)

        if (!person) {
          res.status(404).send('Person not found')
          return
        }

        if (person.ip_address !== req.ip) {
          res.redirect('/login')
          return
        }

        res.render('person.ejs', { person: person })
      })
    })
  }

  PersonRegister() {
    this.app.get('/register', (req, res) => {
      res.render('register')
    })
  }

  PersonRegisterMethod() {
    this.app.post('/register', (req, res, next) => {
      const { login, password, money } = req.body
      const ip_address = req.ip

      Person.register({ login, password, money, ip_address }, (err) => {
        if (err) return res.send(`Произошла ошибка: ${err}`)

        res.send('Успешно!')
      })
    })
  }

  PersonLoginPage() {
    this.app.get('/login', (req, res) => {
      res.render('login')
    })
  }

  PersonLoginMethod() {
    this.app.post('/login', (req, res, next) => {
      const { login, password } = req.body

      Person.auth(login, password, (err, person) => {
        if (err) return next(err)

        if (!person) {
          res.send('Неверный логин или пароль!!') 
          return
        }

        req.session.person = person

        res.redirect(`/person/${person.id}`)
      })
    })
  }

  PersonAddMoney() {
    this.app.get('/get', (req, res) => {
      const person = req.session.person || null
      res.render('money', { person: person })
    })
  }

  PersonAddMoneyMethod() {
    this.app.post('/get', (req, res, next) => {
      const person = req.session.person || null
      const login = person.login
      console.log(login)
      const money = 50000

      Person.give(money, login, (err) => {
        if (err) return res.send(`Ошибка: ${err}`)

        res.send('Успешно выданы деньги!')
      })
    })
  }
}


class Economy {
  constructor(app) {
    this.app = app
    this.app.use(session({
      secret: '473e1e9d07e812630e3fb097c782ff86a02eef184f6715c6e62c4d492d70bf60',
      resave: false,
      saveUninitialized: true
    }))
  }

  setup() {
    this.confirmPage()
    this.confirmMethod()
  }

  confirmPage() {
    this.app.get('/confirm/:id', (req, res, next) => {
      const person = req.session.person || null
      const itemId = req.params.id
      AddItem.find(itemId, (err, item) => {
        if (err) return next(err)
        
        if (!item) {
          res.status(404).send('Товар не найден')
          return
        }

        res.render('confirm', { person: person, item: item })
      })
    })
  }

  confirmMethod() {
    this.app.post('/confirm/:id', (req, res, next) => {
      const person = req.session.person || null
      const login = person.login
      const itemId = req.body.itemId

      if (!person || !login) return res.send('Dont Login')

      AddItem.find(itemId, (err, item) => {
        if (err) return res.send(`Произошла ошибка AddItemFind: ${err}`)
        if (!item) return res.send('Не сущетсвует товара')

        const price = item.price

        Person.find(person.id, (err, personfound) => {
          if (err) return res.send(`Произошла ошибка PersonFound - ${err}`)

          if (personfound.money >= price) {
            const newMoney = personfound - price
            Person.update(person.id, newMoney, (err) => {
              if (err) return res.send(`Ошибка в PersonFoundMoney - ${err}`)
            })

            AddItem.delete(itemId, (err) => {
              if (err) return res.send(`Ошибка в AddItemDelete - ${err}`)
              
              res.send('Объявление куплено. Деньги списаны, объявление удалено!')
            })
          }
          else {
            res.send('Недостаточно средств!')
          }
        })
      })
    })
  }
}


module.exports.AppModule = AppModule
module.exports.PersonModule = PersonModule
module.exports.Economy = Economy
