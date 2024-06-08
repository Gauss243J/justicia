var dotenv= require('dotenv');
dotenv.config({path: './config.env'});
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const path = require('path');
const session = require('express-session');
const multer = require('multer');
const ejs = require('ejs');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cookieParser = require('cookie-parser');
const app = express();
// Configuration de Cloudinary
cloudinary.config({
	cloud_name: process.env.ClOUDINARY_CLOUD_NAME,
	api_key: process.env.ClOUDINARY_PUBLIC_KEY,
	api_secret: process.env.ClOUDINARY_SECRET_KEY
});


//app.use(bodyParser.json( { limit: "10000mb" } ));
//app.use(bodyParser.urlencoded( { extended: true, limit: "10000mb", parameterLimit: 1000000 } ));


/* 	const videoUploadResult = await cloudinary.uploader.upload(videoFile.path, {
							resource_type: "video",
							folder: "videos"
						}); */

/*const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'uploads',
    format: async (req, file) => 'jpg', // supports promises as well
    public_id: (req, file) => file.filename,
  },
});*/

// Configuration de CloudinaryStorage pour Multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'uploads',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'avi', 'mov', 'mp3', 'pdf', 'doc', 'docx'], // Les formats de fichiers autorisés
  },
});

const upload = multer({ storage: storage ,  limits : {
  fileSize: 10 * 1024 * 1024 // 10 MB
}});

mongoose.connect(process.env.DB,
   { useNewUrlParser: true, useUnifiedTopology: true });
//mongoose.connect(process.env.DB);

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
// Configuration des middlewares

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(cookieParser());
app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: true
}));


app.get('/', (req, res) => {
  res.render('index');
});

app.get('/step/:step', (req, res) => {
  const step = req.params.step;
  res.render(`forms/step${step}`);
});


app.post('/submit/:step', upload.fields([
  { name: 'profileimage', maxCount: 1 },
  { name: 'mediaphoto', maxCount: 1 },
  { name: 'mediavideo', maxCount: 1 },
  { name: 'mediaaudio', maxCount: 1 },
  { name: 'mediadocument', maxCount: 1 }
]), async (req, res) => {
  const step = req.params.step;
  const formData = req.body;

  if (!req.session.personId && step !== '1') {
    res.redirect('/submit/1');
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
      try {
      if (req.files['mediaphoto']) {
        const result = await cloudinary.uploader.upload(req.files['mediaphoto'][0].path,{ resource_type: "image", folder: "uploads" });
        person.media.photo = result.secure_url; 
      }
     /* if (req.files['mediavideo']) {
        //console.log("fjdskhfd")
        console.log(JSON.stringify(req.files['mediavideo'])[0])
        const result = await cloudinary.uploader.upload(req.files['mediavideo'][0].path, { resource_type: "video", folder: "uploads" });
        //console.log(req.files['mediavideo'])
       person.media.video = result.secure_url;
      }*/
      /*if (req.files['mediaaudio']) {
        const result = await cloudinary.uploader.upload(req.files['mediaaudio'][0].path, { resource_type: "raw", folder: "uploads" });
        person.media.audio = result.secure_url;
      }*/
      if (req.files['mediadocument']) {
        const result = await cloudinary.uploader.upload(req.files['mediadocument'][0].path, { resource_type: "raw" , folder: "uploads"});
        person.media.document = result.secure_url;
      }
      person.media.description = formData.mediadescription;

    } catch (err) {
      console.error(err);
      res.status(500).send('Une erreur est survenue lors du traitement.');
      return;
    }

    } else if (step === '8') {
      try{
      if (req.files['profileimage']) {
        const result = await cloudinary.uploader.upload(req.files['profileimage'][0].path);
        person.profile.image = result.secure_url;
      }
      person.profile.title = formData.profile.title;
      person.profile.description = formData.profile.description;
      person.profile.uploadDate = formData.profile.uploadDate;
      person.profile.photographer = formData.profile.photographer;

    } catch (err) {
      console.error(err);
      res.status(500).send('Une erreur est survenue lors du traitement.');
      return;
    }
    } else if (step === '9') {
      person.crimes = formData.crimes;
    }
    await person.save();

    
  } 
  


  

  const nextStep = parseInt(step) + 1;
  if (nextStep <= 9) {
    res.redirect(`/step/${nextStep}`);
  } else {
    res.redirect('/persons');
    
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
  try {
    const person = await Person.findById(req.session.personId);
    if (!person) {
      res.status(404).send('Person not found');
      return;
    }
    res.render('person', { person });
  } catch (err) {
    res.status(500).send('Erreur du serveur');
  }
});

app.get('/person/:id', async (req, res) => {
  try {
    const personId = req.params.id;
    const person = await Person.findById(personId);

    if (!person) {
      res.status(404).send('Person not found');
      return;
    }

    res.render('person', { person });
  } catch (err) {
    res.status(500).send('Server error');
  }
});


app.listen(process.env.PORT || 3006, () => {
  console.log('Server is running');
});


