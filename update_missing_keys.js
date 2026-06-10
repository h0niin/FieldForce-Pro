const fs = require('fs');
const path = require('path');

const localesDir = path.join('c:/Users/Litty Mathew Irimpan/FieldForce-Pro', 'web/public/locales');
const languages = ['en', 'ar', 'hi', 'ml'];

const keysToAdd = {
  priorities: {
    'Urgent': 'Urgent'
  },
  subCategories: {
    'Refrigerator': 'Refrigerator',
    'Washer/Dryer': 'Washer/Dryer',
    'Oven/Stove': 'Oven/Stove',
    'Dishwasher': 'Dishwasher'
  },
  sla: {
    catchAll: 'Catch-All',
    minutes: 'min',
    hours: 'hr',
    days: 'day',
    compliancePercentage: 'SLA Compliance %',
    totalBreachedRequests: 'Total Breached Requests',
    totalMetRequests: 'Total Met Requests',
    avgResolutionTime: 'Avg. Resolution Time',
    requestsExceedingAllowedSla: 'Requests exceeding allowed SLA',
    requestsResolvedWithinSla: 'Requests resolved within SLA',
    acrossAllCategoriesThisMonth: 'Across all categories this month',
    recentBreachesMock: 'Recent Breaches (Mock)'
  }
};

languages.forEach(lang => {
  const filePath = path.join(localesDir, lang, 'common.json');
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    // Add priorities
    if (!data.priorities) data.priorities = {};
    Object.assign(data.priorities, keysToAdd.priorities);

    // Add subCategories
    if (!data.subCategories) data.subCategories = {};
    Object.assign(data.subCategories, keysToAdd.subCategories);

    // Add sla keys
    if (!data.sla) data.sla = {};
    Object.assign(data.sla, keysToAdd.sla);

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`Updated ${lang}/common.json`);
  }
});
