let webpush;
try {
  webpush = require('web-push');
} catch (e) {
  console.log('web-push not available, notifications disabled');
}

const { Subscription } = require('../models');

// Configure Web Push with VAPID keys (graceful fallback)
const publicVapidKey = process.env.PUBLIC_VAPID_KEY;
const privateVapidKey = process.env.PRIVATE_VAPID_KEY;
let pushEnabled = false;

if (webpush && publicVapidKey && privateVapidKey && publicVapidKey !== 'YOUR_PUBLIC_VAPID_KEY') {
  try {
    webpush.setVapidDetails(
      'mailto:admin@smartcampus.edu',
      publicVapidKey,
      privateVapidKey
    );
    pushEnabled = true;
    console.log('Web Push notifications enabled');
  } catch (e) {
    console.log('Web Push setup failed (keys may be invalid):', e.message);
  }
} else {
  console.log('Web Push notifications disabled (no valid VAPID keys)');
}

const sendTargetedNotification = async (payload, targets = {}) => {
  if (!pushEnabled || !webpush) {
    console.log('Push notification skipped (not configured)');
    return;
  }

  try {
    // Build query based on targets
    const query = {};
    if (targets.branch || targets.year || targets.semester || targets.section) {
      const matchCriteria = [];
      if (targets.branch) matchCriteria.push({ 'userProfile.branch': targets.branch });
      if (targets.year) matchCriteria.push({ 'userProfile.year': Number(targets.year) });
      if (targets.semester) matchCriteria.push({ 'userProfile.semester': Number(targets.semester) });
      if (targets.section && targets.section !== 'ALL') {
        matchCriteria.push({ 'userProfile.section': { $in: [targets.section, 'ALL'] } });
      }
      
      query.$or = [
        { userProfile: null },
        matchCriteria.length > 0 ? { $and: matchCriteria } : {}
      ];
    }

    const filteredSubscriptions = await Subscription.find(query).lean();

    if (filteredSubscriptions.length === 0) {
      console.log('No matching subscribers for this notification');
      return;
    }

    const notificationPromises = filteredSubscriptions.map(sub =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: sub.keys },
        JSON.stringify(payload)
      ).catch(error => {
        if (error.statusCode === 410 || error.statusCode === 404) {
          // Flag for removal
          return { endpoint: sub.endpoint, invalid: true };
        }
        console.error('Push error:', error.message);
        return null;
      })
    );

    const results = await Promise.all(notificationPromises);
    
    // Clean up invalid subscriptions
    const invalidSubs = results.filter(r => r && r.invalid);
    if (invalidSubs.length > 0) {
      const endpoints = invalidSubs.map(inv => inv.endpoint);
      await Subscription.deleteMany({ endpoint: { $in: endpoints } });
    }

    console.log(`Notifications sent to ${filteredSubscriptions.length - invalidSubs.length} subscribers`);
  } catch (error) {
    console.error('Failed to broadcast notifications:', error.message);
  }
};

module.exports = { sendTargetedNotification, pushEnabled };
