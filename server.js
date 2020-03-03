import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import mongoose from 'mongoose'
import bcrypt from 'bcrypt-nodejs'
import crypto from 'crypto'


const mongoUrl = process.env.MONGO_URL || "mongodb://localhost/yogaApp"
mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true })
mongoose.Promise = Promise

const User = mongoose.model('User', {
  name: {
    type: String,
    minlength: 2,
    maxlength: 25
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true
  },
  accessToken: {
    type: String,
    default: () => crypto.randomBytes(128).toString('hex')
  }
})

const port = process.env.PORT || 8080
const app = express()

// Add middlewares to enable cors and json body parsing
app.use(cors())
app.use(bodyParser.json())


const authenticateUser = async (req, res, next) => {
  // try {
  const user = await User.findOne({ accessToken: req.header('Authorization') })
  if (user) {
    req.user = user
    next()
  } else {
    res.status(401).json({ loggedOut: true, message: 'Please try logging in again' })
  }
  // } catch (err) {
  //   res.status(403).json({ message: 'Access token is missing or wrong', error: err.errors })
}

// Do I want to name it Users here or what should I use, depending on the route I am going to use in the StartPage??

app.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body
    const user = new User({ name, email, password: bcrypt.hashSync(password) })
    user.save()
    res.status(201).json({ id: user._id, accessToken: user.accessToken })
  } catch (err) {
    res.status(400).json({ message: "Could not create user", errors: err.errors })
  }
})

// The same here, what will I call the endpoint??

app.post('/login', async (req, res) => {
  const user = await User.findOne({ email: req.body.email })
  if (user && bcrypt.compareSync(req.body.password, user.password)) {
    // Success
    res.json({ userId: user._id, accessToken: user.accessToken })
  } else {
    // Failure
    // a. user does not exist
    // b. encrypted password does not match
    res.json({ notFound: true })
  }
})

// the same here, I need to decide what to name my endpoints??

app.get('/user', authenticateUser)
// The async here is from vans auth code
app.get('/user', async (req, res) => {
  // This will only happen if the next() function is called from the middleware
  // Now we can access the user.. 
  res.json(req.user)
  res.send('Welcome')
})


// Start defining your routes here
app.get('/', (req, res) => {
  res.send('Hello world')
})

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})
