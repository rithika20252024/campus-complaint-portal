// server.js - Campus Complaint & Resolution System

require('dotenv').config(); // Load .env variables (MONGO_URI, etc.)

const express = require('express');
const session = require('express-session');
const multer = require('multer');
const path = require('path');
const mongoose = require('mongoose');

const app = express();
const port = process.env.PORT || 4000;

// MongoDB connection (use Atlas via .env)
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch(err => console.error('MongoDB connection error:', err));

// ── Models ────────────────────────────────────────────────
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, default: null },
  role: { type: String, required: true, default: 'student' }
});

const User = mongoose.model('User', userSchema);

const complaintSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  submitter: { type: String, required: true },
  email: String,
  title: { type: String, required: true },
  category: { type: String, required: true },
  description: { type: String, required: true },
  photo: String,
  status: { type: String, default: 'Open' },
  reply: { type: String, default: '' },
  createdAt: {
    type: String,
    default: () => new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
  },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
});

const Complaint = mongoose.model('Complaint', complaintSchema);



// ── Middleware ──────────────────────────────────────────────
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: 'campus-complaint-secret-2026',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 } // 24 hours
}));

// Multer for photo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/uploads/'),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Login protection middleware
const requireLogin = (req, res, next) => {
  if (!req.session.user) return res.redirect('/login');
  next();
};

const isAdmin = (req, res, next) => {
  if (req.session.user?.role !== 'admin') {
    return res.status(403).send('<h1>Access Denied</h1><p>Only admin can access this page.</p>');
  }
  next();
};

// ── Routes ──────────────────────────────────────────────────

// Landing page
app.get('/', (req, res) => {
  res.render('index');
});

// Register page
app.get('/register', (req, res) => {
  res.render('register', { error: null });
});

app.post('/register', async (req, res) => {
  try {
    const { name, username, password, email } = req.body;
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.render('register', { error: 'Username already exists' });
    }
    const newUser = new User({ name, username, password, email });
    await newUser.save();
    req.session.user = newUser;
    res.redirect('/dashboard');
  } catch (err) {
    res.render('register', { error: 'Registration failed' });
  }
});

// Login page
app.get('/login', (req, res) => {
  res.render('login', { error: null });
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username, password });
  if (!user) {
    return res.render('login', { error: 'Invalid username or password' });
  }
  req.session.user = user;
  if (user.role === 'admin') {
    return res.redirect('/admin');
  }
  res.redirect('/dashboard');
});

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

// Submit complaint (protected)
app.get('/submit', requireLogin, (req, res) => {
  res.render('submit', { user: req.session.user, error: null });
});

app.post('/submit', requireLogin, upload.single('photo'), async (req, res) => {
  try {
    const { title, category, description, anonymous, email } = req.body;
    const submitter = anonymous === 'on' ? 'Anonymous' : req.session.user.name;
    const userId = anonymous === 'on' ? null : req.session.user._id;
    const photo = req.file ? req.file.filename : null;

    // Generate unique id (simple counter - in production use better method)
    const lastComplaint = await Complaint.findOne().sort({ id: -1 });
    const newId = lastComplaint ? lastComplaint.id + 1 : 1;

    const newComplaint = new Complaint({
      id: newId,
      submitter,
      email: email || null,
      title,
      category,
      description,
      photo,
      userId
    });
    await newComplaint.save();
    res.redirect('/dashboard');
  } catch (err) {
    res.render('submit', { user: req.session.user, error: 'Submission failed' });
  }
});

// Dashboard (student's own complaints)
app.get('/dashboard', requireLogin, async (req, res) => {
  const complaints = await Complaint.find({ userId: req.session.user._id }).sort({ createdAt: -1 });
  res.render('dashboard', { user: req.session.user, complaints });
});

// Admin panel (all complaints)
app.get('/admin', requireLogin, isAdmin, async (req, res) => {
  const complaints = await Complaint.find().sort({ createdAt: -1 });
  res.render('admin', { user: req.session.user, complaints });
});

// Update complaint (admin only)
app.post('/admin/update/:id', requireLogin, isAdmin, async (req, res) => {
  const { status, reply } = req.body;
  await Complaint.findOneAndUpdate({ id: req.params.id }, { status, reply });
  res.redirect('/admin');
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});