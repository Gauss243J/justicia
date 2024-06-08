const mongoose = require('mongoose');

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