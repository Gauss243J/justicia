const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const ejs = require('ejs');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const session = require('express-session');
const cookieParser = require('cookie-parser');

const app = express();
// Configure Cloudinary
cloudinary.config({
  cloud_name: 'your_cloud_name',
  api_key: 'your_api_key',
  api_secret: 'your_api_secret'
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'uploads',
    format: async (req, file) => 'jpg', // supports promises as well
    public_id: (req, file) => file.filename,
  },
});

const upload = multer({ storage: storage });

mongoose.connect('mongodb://localhost:27017/multistepForm', { useNewUrlParser: true, useUnifiedTopology: true });

const personSchema = new mongoose.Schema({
  identification: {
    firstName: String,
    lastName: String,
    middleName: String,
    dob: Date,
    nationality: String
  },
  experience: {
    previousJob: String,
    yearsOfExperience: Number,
    skills: String,
    lastEmployer: String,
    reasonForLeaving: String
  },
  physical: {
    height: Number,
    weight: Number,
    eyeColor: String,
    hairColor: String,
    identifyingMarks: String
  },
  assets: {
    realEstate: String,
    vehicles: String,
    bankAccounts: String,
    investments: String,
    otherAssets: String
  },
  preferences: {
    city: String,
    country: String,
    locationType: String,
    season: String,
    activities: String
  },
  operations: {
    currentWorkplace: String,
    mainOperationLocation: String,
    otherOperationLocations: String,
    operationDuration: String,
    locationCoordinates: String
  },
  media: {
    photo: String,
    video: String,
    audio: String,
    document: String,
    description: String
  },
  profile: {
    image: String,
    title: String,
    description: String,
    uploadDate: Date,
    photographer: String
  },
  crimes: {
    crimeType: String,
    crimeDate: Date,
    crimeLocation: String,
    crimeDetails: String,
    legalStatus: String
  }
});

const Person = mongoose.model('Person', personSchema);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());
app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: true
}));

app.get('/', (req, res) => {
  res.redirect('/step/1');
});

app.get('/step/:step', (req, res) => {
  const step = req.params.step;
  res.render(`forms/step${step}`);
});

app.post('/submit/:step', upload.fields([{ name: 'media[photo]', maxCount: 1 }, { name: 'media[video]', maxCount: 1 }, { name: 'media[audio]', maxCount: 1 }, { name: 'media[document]', maxCount: 1 }]), async (req, res) => {
  const step = req.params.step;
  const formData = req.body;

  if (!req.session.personId && step !== '1') {
    res.redirect('/step/1');
    return;
  }

  if (step === '1') {
    const newPerson = new Person();
    newPerson.identification = formData.identification;
    await newPerson.save();
    req.session.personId = newPerson._id;
  } else {
    const person = await Person.findById(req.session.personId);
    if (step === '2') {
      person.experience = formData.experience;
    } else if (step === '3') {
      person.physical = formData.physical;
    } else if (step === '4') {
      person.assets = formData.assets;
    } else if (step === '5') {
      person.preferences = formData.preferences;
    } else if (step === '6') {
      person.operations = formData.operations;
    } else if (step === '7') {
      if (req.files['media[photo]']) {
        person.media.photo = req.files['media[photo]'][0].path;
      }
      if (req.files['media[video]']) {
        person.media.video = req.files['media[video]'][0].path;
      }
      if (req.files['media[audio]']) {
        person.media.audio = req.files['media[audio]'][0].path;
      }
      if (req.files['media[document]']) {
        person.media.document = req.files['media[document]'][0].path;
      }
      person.media.description = formData.media.description;
    } else if (step === '8') {
      if (req.files['profile[image]']) {
        person.profile.image = req.files['profile[image]'][0].path;
      }
      person.profile.title = formData.profile.title;
      person.profile.description = formData.profile.description;
      person.profile.uploadDate = formData.profile.uploadDate;
      person.profile.photographer = formData.profile.photographer;
    } else if (step === '9') {
      person.crimes = formData.crimes;
    }
    await person.save();
  }

  const nextStep = parseInt(step) + 1;
  if (nextStep <= 9) {
    res.redirect(`/step/${nextStep}`);
  } else {
    res.redirect('/summary');
  }
});

app.get('/persons', async (req, res) => {
  try {
    const persons = await Person.find();
    res.render('persons', { persons });
  } catch (err) {
    res.status(500).send('Erreur du serveur');
  }
});

app.get('/person', async (req, res) => {
  if (!req.session.personId) {
    res.redirect('/step/1');
    return;
  }
  const person = await Person.findById(req.session.personId);
  res.render('person', { person });
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});



/*const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const Person = require('../models/Person');

// Configuration de multer
const storage = multer.diskStorage({
  filename: function(req, file, cb) {
    cb(null, new Date().toISOString() + file.originalname);
  }
});
const upload = multer({ storage: storage });

// Route pour afficher le formulaire
router.get('/', (req, res) => {
    res.render('index');
  });

// Route pour afficher le formulaire de chaque étape
router.get('/step/:step', (req, res) => {
  const step = req.params.step;
  res.render(`forms/step${step}`);
});

// Route pour soumettre les étapes du formulaire
router.post('/submit/:step', upload.fields([{ name: 'profileImage', maxCount: 1 }, { name: 'photos' }, { name: 'videos' }, { name: 'audios' }]), async (req, res) => {
  const step = req.params.step;
  req.session.formData = req.session.formData || {};
  Object.assign(req.session.formData, req.body);

  if (step == 9) {
    const { identification, experience, physical, declaration, preferredPlaces, operationPlaces, crimes } = req.session.formData;

    const profileImageResult = await cloudinary.uploader.upload(req.files['profileImage'][0].path);
    const photos = await Promise.all(req.files['photos'].map(file => cloudinary.uploader.upload(file.path)));
    const videos = await Promise.all(req.files['videos'].map(file => cloudinary.uploader.upload(file.path)));
    const audios = await Promise.all(req.files['audios'].map(file => cloudinary.uploader.upload(file.path)));

    const newPerson = new Person({
      identification,
      experience,
      physical,
      declaration,
      preferredPlaces,
      operationPlaces,
      crimes,
      profileImage: profileImageResult.url,
      media: {
        photos: photos.map(p => p.url),
        videos: videos.map(v => v.url),
        audios: audios.map(a => a.url)
      }
    });

    await newPerson.save();
    req.session.formData = null;
    res.redirect('/persons');
  } else {
    res.redirect(`/step/${parseInt(step) + 1}`);
  }
});

// Route pour afficher les personnes
router.get('/persons', async (req, res) => {
  try {
    const persons = await Person.find();
    res.render('persons', { persons });
  } catch (err) {
    console.error(err);
    res.status(500).send("Erreur lors de la récupération des données");
  }
});

// Route pour afficher les détails d'une personne
router.get('/person/:id', async (req, res) => {
  try {
    const person = await Person.findById(req.params.id);
    res.render('person', { person });
  } catch (err) {
    console.error(err);
    res.status(500).send("Erreur lors de la récupération des données");
  }
});

module.exports = router;*/
