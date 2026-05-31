let webpush;
try {
  webpush = require('web-push');
} catch (e) {
  console.log('web-push not available, notifications disabled');
}

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
    const { readData, writeData } = require('../utils/db');
    const subscriptions = readData('subscriptions.json');
    
    // Filter subscriptions based on targets
    const filteredSubscriptions = subscriptions.filter(sub => {
      // If no targets specified, send to everyone
      if (!targets.branch && !targets.year && !targets.semester && !targets.section) return true;

      // Admins and facultys always get notifications if they subscribed
      if (sub.userProfile === null) return true;

      const p = sub.userProfile;
      // Filter logic matches the resource visibility logic
      const branchMatch = !targets.branch || targets.branch === p.branch;
      const yearMatch = !targets.year || targets.year === p.year;
      const semesterMatch = !targets.semester || targets.semester === p.semester;
      const sectionMatch = !targets.section || targets.section === 'ALL' || targets.section === p.section;

      return branchMatch && yearMatch && semesterMatch && sectionMatch;
    });

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
      const validSubs = subscriptions.filter(
        sub => !invalidSubs.find(inv => inv.endpoint === sub.endpoint)
      );
      writeData('subscriptions.json', validSubs);
    }

    console.log(`Notifications sent to ${filteredSubscriptions.length - invalidSubs.length} subscribers`);
  } catch (error) {
    console.error('Failed to broadcast notifications:', error.message);
  }
};

module.exports = { sendTargetedNotification, pushEnabled };
