const sqlite3 = require('sqlite3')
const path = require('path')
const dbPath = path.join(__dirname, 'databases', 'ItemInfo.sqlite')
const db = new sqlite3.Database(dbPath)

db.serialize(() => {
  const sql = `
    CREATE TABLE IF NOT EXISTS marketplace
      (id INTEGER PRIMARY KEY, title TEXT, price INTEGER, content TEXT, image BLOB)
  `
  db.run(sql)
})

class AddItem {
  static all(callback) {
    db.all('SELECT * FROM marketplace', callback)
  }

  static find(id, callback) {
    db.get('SELECT * FROM marketplace WHERE id = ?', id, callback)
  }

  static create(data, callback) {
    const sql = 'INSERT INTO marketplace (title, price, content, image) VALUES (?, ?, ?, ?)'
    db.run(sql, data.title, data.price, data.content, data.image, callback)
  }

  static delete(id, callback) {
    db.run('DELETE FROM marketplace WHERE id = ?', id, callback)
  }
}

// Person
const dbPerson_Path = path.join(__dirname, 'databases', 'Person.sqlite')
const dbPerson = new sqlite3.Database(dbPerson_Path)

dbPerson.serialize(() => {
  const sql = `
    CREATE TABLE IF NOT EXISTS persons
      (id INTEGER PRIMARY KEY, login TEXT, password TEXT, money BIGINT DEFAULT 0, ip_address TEXT)
  `
  dbPerson.run(sql)
})

class Person {
  static find(id, callback) {
    dbPerson.get('SELECT * FROM persons WHERE id = ?', id, callback)
  }

  static all(callback) {
    dbPerson.all('SELECT * FROM persons', callback)
  }
  
  static checkLoginExists(login, callback) {
    dbPerson.get('SELECT COUNT(*) as count FROM persons WHERE login = ?', login, (err, row) => {
      if (err) return callback(err)

      const exists = row.count > 0
      callback(null, exists)
    })
  }

  static register(data, callback) {
    const { login, password, ip_address } = data
  
    Person.checkLoginExists(login, (err, exists) => {
      if (err) return callback(err)
  
      if (exists) {
        callback('Такой логин уже существует!')
        return
      }
  
      const sql = 'INSERT INTO persons (login, password, money, ip_address) VALUES (?, ?, 0, ?)'
      dbPerson.run(sql, login, password, ip_address, callback)
    })
  }
  

  static auth(login, password, callback) {
    dbPerson.get('SELECT * FROM persons WHERE login = ? AND password = ?', login, password, callback)
  }

  static give(money, login, callback) {
    const sql = 'UPDATE persons SET money = money + ? WHERE login = ?'
    dbPerson.run(sql, [money, login], function (err) {
      if (err) {
        callback(err)
        return
      }
      callback(null)
    })
  }

  static update(id, money, callback) {
    const sql = 'UPDATE persons SET money = ? WHERE id = ?'
    dbPerson.run(sql, [money, id], function(err) {
      if (err) {
        callback(err)
        return
      }
      callback(null)
    })
  }

  static delete(id, callback) {
    dbPerson.run('DELETE FROM persons WHERE id = ?', id, callback)
  }
}

module.exports.db = db
module.exports.dbPerson = dbPerson

module.exports.AddItem = AddItem
module.exports.Person = Person
