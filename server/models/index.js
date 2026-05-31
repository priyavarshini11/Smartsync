const mongoose = require('mongoose');
const { Schema } = mongoose;

const DepartmentSchema = new Schema({
  name: { type: String, required: true, unique: true }, // e.g. CSE
  colorHex: { type: String, default: '#A7C7E7' },
  createdAt: { type: Date, default: Date.now }
});

const YearSchema = new Schema({
  departmentId: { type: Schema.Types.ObjectId, ref: 'Department', required: true },
  level: { type: Number, required: true }, // 1, 2, 3, 4
  name: { type: String, required: true } // "First Year"
});

const SemesterSchema = new Schema({
  yearId: { type: Schema.Types.ObjectId, ref: 'Year', required: true },
  number: { type: Number, required: true }, // 1 - 8
  name: { type: String, required: true } // "First Sem"
});

const SubjectSchema = new Schema({
  semesterId: { type: Schema.Types.ObjectId, ref: 'Semester', required: true },
  name: { type: String, required: true } // "Data Structures"
});

const ResourceSchema = new Schema({
  subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
  title: { type: String, required: true },
  type: { type: String, enum: ['PDF', 'Notice', 'Project', 'Assignment', 'Case Study', 'Link'], required: true },
  fileUrl: { type: String, required: true },
  categoryHeading: { type: String, default: '' },
  startDate: { type: Date },
  endDate: { type: Date },
  expirationDate: { type: Date },
  isDeleted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const AdminSchema = new Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true } // Requested: Check perfect match
});

const PushSubscriptionSchema = new Schema({
  endpoint: { type: String, required: true },
  keys: {
    p256dh: { type: String, required: true },
    auth: { type: String, required: true }
  }
});

module.exports = {
  Department: mongoose.model('Department', DepartmentSchema),
  Year: mongoose.model('Year', YearSchema),
  Semester: mongoose.model('Semester', SemesterSchema),
  Subject: mongoose.model('Subject', SubjectSchema),
  Resource: mongoose.model('Resource', ResourceSchema),
  Admin: mongoose.model('Admin', AdminSchema),
  PushSubscription: mongoose.model('PushSubscription', PushSubscriptionSchema),
};
