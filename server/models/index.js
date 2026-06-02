const mongoose = require('mongoose');

// --- Flexible schemas (strict: false) to match existing JSON structure ---

const userSchema = new mongoose.Schema({}, {
  strict: false,
  versionKey: false,
  collection: 'users'
});
userSchema.index({ id: 1 }, { unique: true });
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });

const resourceSchema = new mongoose.Schema({}, {
  strict: false,
  versionKey: false,
  collection: 'resources'
});
resourceSchema.index({ id: 1 }, { unique: true });
resourceSchema.index({ uploadedBy: 1 });
resourceSchema.index({ targetBranch: 1, targetYear: 1, targetSemester: 1, targetSection: 1 });
resourceSchema.index({ isDeleted: 1 });

const departmentSchema = new mongoose.Schema({}, {
  strict: false,
  versionKey: false,
  collection: 'departments'
});

const adminConfigSchema = new mongoose.Schema({}, {
  strict: false,
  versionKey: false,
  collection: 'admin_config'
});

const subscriptionSchema = new mongoose.Schema({}, {
  strict: false,
  versionKey: false,
  collection: 'subscriptions'
});

// Prevent model re-compilation in serverless/hot-reload environments
module.exports = {
  User: mongoose.models.User || mongoose.model('User', userSchema),
  Resource: mongoose.models.Resource || mongoose.model('Resource', resourceSchema),
  Department: mongoose.models.Department || mongoose.model('Department', departmentSchema),
  AdminConfig: mongoose.models.AdminConfig || mongoose.model('AdminConfig', adminConfigSchema),
  Subscription: mongoose.models.Subscription || mongoose.model('Subscription', subscriptionSchema),
};
