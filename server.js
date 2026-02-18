require('dotenv').config();
const express = require('express');
const session = require('express-session');
const multer = require('multer');
const path = require('path');

const mongoose = require('mongoose');



const app = express();
const port = process.env.PORT || 3000;

// MongoDB connection
mongoose.connect(process.env.MONGO_URI) 
  .then(() => console.log('Connected to MongoDB'))
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

// Seed demo users (run once)
async function seedDemoUsers() {
  const count = await User.countDocuments();
  if (count === 0) {
    await User.insertMany([
      { username: "student1",   password: "1234",     role: "student", name: "Rithika S" },
      { username: "admin",      password: "admin2026", role: "admin",  name: "Admin"      },
      { username: "admin1234",  password: "admin1234", role: "admin",  name: "Admin 1234" }
    ]);
    console.log('Demo users seeded');
  }
}
seedDemoUsers();

// ── Middleware ──────────────────────────────────────────────
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: 'campus-complaint-secret-2026',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 }
}));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/uploads/'),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

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

app.get('/', (req, res) => {
  if (req.session.user) return res.redirect('/dashboard');
  res.render('index');
});

app.get('/register', (req, res) => {
  if (req.session.user) return res.redirect('/dashboard');
  res.render('register', { error: null });
});

app.post('/register', async (req, res) => {
  const { name, username, password, email } = req.body;

  if (!name || !username || !password) {
    return res.render('register', { error: 'Name, username and password are required' });
  }

  if (await User.findOne({ username })) {
    return res.render('register', { error: 'Username already taken' });
  }

  const newUser = new User({ username, password, name, email, role: 'student' });
  await newUser.save();

  req.session.user = newUser;
  res.redirect('/dashboard');
});

app.get('/login', (req, res) => {
  if (req.session.user) return res.redirect('/dashboard');
  res.render('login', { error: null });
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username, password });

  if (user) {
    req.session.user = user;
    res.redirect('/dashboard');
  } else {
    res.render('login', { error: 'Invalid username or password' });
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');  // ← Redirect to landing page (Login / Sign Up choice)
  });
});

app.get('/submit', requireLogin, (req, res) => {
  res.render('submit', { user: req.session.user });
});

app.post('/submit', requireLogin, upload.single('proof'), async (req, res) => {
  const { title, category, description, anonymous, contact_email } = req.body;
  const isAnonymous = anonymous === 'on';

  let submitterName = 'Anonymous';
  let submitterEmail = null;

  // Only reveal real name/email if NOT anonymous
  if (!isAnonymous && req.session.user) {
    submitterName = req.session.user.name;
    submitterEmail = req.session.user.email || null;
  }

  const count = await Complaint.countDocuments();
  const newId = count + 1;

  const complaint = new Complaint({
    id: newId,
    submitter: submitterName,
    email: submitterEmail,
    title: title.trim(),
    category,
    description: description.trim(),
    photo: req.file ? `/uploads/${req.file.filename}` : null,
    userId: req.session.user._id   // ← Keep userId so student can see their own anonymous complaints
  });

  await complaint.save();

  req.session.message = `Complaint submitted successfully! (ID: #${newId})`;
  res.redirect('/dashboard');
});

app.get('/dashboard', requireLogin, async (req, res) => {
  const user = req.session.user;

  let complaints;
  if (user.role === 'admin') {
    complaints = await Complaint.find().sort({ id: -1 });
  } else {
    complaints = await Complaint.find({ userId: user._id }).sort({ id: -1 });
  }

  const stats = {
    total: complaints.length,
    open: complaints.filter(c => c.status === 'Open').length,
    inProgress: complaints.filter(c => c.status === 'In Progress').length,
    resolved: complaints.filter(c => c.status === 'Resolved').length
  };

  res.render('dashboard', {
    user,
    complaints,
    stats,
    message: req.session.message || null
  });

  if (req.session.message) delete req.session.message;
});

app.get('/admin', requireLogin, isAdmin, async (req, res) => {
  res.render('admin', {
    user: req.session.user,
    complaints: await Complaint.find().sort({ id: -1 })
  });
});
// NEW: Delete complaint (only owner or admin)
app.post('/delete/:id', requireLogin, async (req, res) => {
  const id = parseInt(req.params.id);
  const user = req.session.user;

  const complaint = await Complaint.findOne({ id });

  if (!complaint) {
    return res.status(404).send('Complaint not found');
  }

  // Only owner or admin can delete
  const isOwner = complaint.userId && complaint.userId.toString() === user._id.toString();
  if (!isOwner && user.role !== 'admin') {
    return res.status(403).send('You can only delete your own complaints');
  }

  await Complaint.deleteOne({ id });
  res.redirect('/dashboard');
});

app.post('/admin/update/:id', requireLogin, isAdmin, async (req, res) => {
  const { status, reply } = req.body;
  const complaint = await Complaint.findOne({ id: parseInt(req.params.id) });

  if (complaint) {
    complaint.status = status;
    complaint.reply = reply?.trim() || 'No additional comment';
    await complaint.save();
  }

  res.redirect('/admin');
});

app.listen(port, () => console.log(`Server running on port ${port}`));