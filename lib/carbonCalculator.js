// Carbon Calculator — Sustainable Web Design Model v4
// Based on: https://sustainablewebdesign.org/estimating-digital-emissions/

// SWDM v4 Energy Intensity Constants (kWh per GB)
const ENERGY_INTENSITY = {
  dataCenters: 0.055,
  networks: 0.059,
  userDevices: 0.080,
  total: 0.194, // sum of above
};

// Global average grid carbon intensity (gCO2e per kWh)
// Source: Ember — Global Electricity Review
const GRID_CARBON_INTENSITY = 494;

// Green hosting reduces data center operational emissions by 95%
const GREEN_HOSTING_FACTOR = 0.05;

/**
 * Calculate CO2 emissions for a given data transfer size
 * @param {number} totalBytes - Total page size in bytes
 * @param {boolean} isGreenHosted - Whether the server uses green energy
 * @returns {object} Emission breakdown and total in grams CO2e
 */
function calculateEmissions(totalBytes, isGreenHosted = false) {
  const totalGB = totalBytes / (1024 * 1024 * 1024);

  // Calculate energy per segment (kWh)
  const energyDataCenters = totalGB * ENERGY_INTENSITY.dataCenters;
  const energyNetworks = totalGB * ENERGY_INTENSITY.networks;
  const energyUserDevices = totalGB * ENERGY_INTENSITY.userDevices;

  // Apply green hosting factor to data center emissions
  const dcFactor = isGreenHosted ? GREEN_HOSTING_FACTOR : 1.0;

  // Calculate CO2 per segment (grams)
  const co2DataCenters = energyDataCenters * GRID_CARBON_INTENSITY * dcFactor;
  const co2Networks = energyNetworks * GRID_CARBON_INTENSITY;
  const co2UserDevices = energyUserDevices * GRID_CARBON_INTENSITY;
  const co2Total = co2DataCenters + co2Networks + co2UserDevices;

  // Annual estimate (assuming 10,000 page views/month)
  const monthlyPageViews = 10000;
  const annualCO2 = co2Total * monthlyPageViews * 12;
  const annualCO2Kg = annualCO2 / 1000;

  return {
    perPageView: {
      total: roundTo(co2Total, 4),
      dataCenters: roundTo(co2DataCenters, 4),
      networks: roundTo(co2Networks, 4),
      userDevices: roundTo(co2UserDevices, 4),
    },
    annual: {
      totalGrams: roundTo(annualCO2, 2),
      totalKg: roundTo(annualCO2Kg, 2),
      monthlyPageViews,
    },
    energy: {
      perPageViewKwh: roundTo(totalGB * ENERGY_INTENSITY.total, 8),
      annualKwh: roundTo(totalGB * ENERGY_INTENSITY.total * monthlyPageViews * 12, 4),
    },
    grade: getGrade(co2Total),
    isGreenHosted,
  };
}

/**
 * Assign a letter grade based on CO2 per page view
 */
function getGrade(co2Grams) {
  if (co2Grams < 0.1) return { letter: 'A+', color: '#10b981', label: 'Exceptional' };
  if (co2Grams < 0.2) return { letter: 'A', color: '#34d399', label: 'Excellent' };
  if (co2Grams < 0.5) return { letter: 'B', color: '#60a5fa', label: 'Good' };
  if (co2Grams < 1.0) return { letter: 'C', color: '#fbbf24', label: 'Average' };
  if (co2Grams < 2.0) return { letter: 'D', color: '#f97316', label: 'Poor' };
  return { letter: 'F', color: '#ef4444', label: 'Very Poor' };
}

/**
 * Generate tailored reduction suggestions based on analysis data
 */
function generateSuggestions(analysisData) {
  const suggestions = [];
  const { resources, totalSize, renderBlocking, emissions } = analysisData;

  const totalMB = totalSize / (1024 * 1024);
  const imageMB = (resources.images?.size || 0) / (1024 * 1024);
  const imagePercent = totalSize > 0 ? ((resources.images?.size || 0) / totalSize) * 100 : 0;

  // Image optimization
  if (imagePercent > 40) {
    suggestions.push({
      icon: '🖼️',
      title: 'Optimize Images',
      description: `Images account for ${Math.round(imagePercent)}% of total page weight (${imageMB.toFixed(1)} MB). Convert to modern formats like WebP or AVIF to reduce size by 40–60%.`,
      impact: 'high',
      savings: `Could save ~${(imageMB * 0.5).toFixed(1)} MB per page load`,
    });
  } else if (imagePercent > 20) {
    suggestions.push({
      icon: '🖼️',
      title: 'Consider Image Compression',
      description: `Images make up ${Math.round(imagePercent)}% of the page. Use responsive images with srcset and lazy-load below-the-fold images.`,
      impact: 'medium',
      savings: `Could save ~${(imageMB * 0.3).toFixed(1)} MB per page load`,
    });
  }

  // Render-blocking resources
  if (renderBlocking.count > 3) {
    suggestions.push({
      icon: '⚡',
      title: 'Reduce Render-Blocking Resources',
      description: `${renderBlocking.count} render-blocking resources detected (${renderBlocking.scripts} scripts, ${renderBlocking.stylesheets} stylesheets). Use \`async\` or \`defer\` on non-critical scripts and inline critical CSS.`,
      impact: 'high',
      savings: 'Faster load times = less energy per visit',
    });
  } else if (renderBlocking.count > 0) {
    suggestions.push({
      icon: '⚡',
      title: 'Optimize Resource Loading',
      description: `${renderBlocking.count} render-blocking resource(s) found. Consider deferring non-essential scripts and stylesheets.`,
      impact: 'low',
      savings: 'Marginal improvement in load energy',
    });
  }

  // Green hosting
  if (!emissions.isGreenHosted) {
    suggestions.push({
      icon: '🌿',
      title: 'Switch to Green Hosting',
      description: 'Your server is not verified as using renewable energy. Switching to a green hosting provider could reduce data center emissions by up to 95%.',
      impact: 'high',
      savings: `Could reduce emissions by ~${((emissions.perPageView.dataCenters * 0.95) * 10000 * 12 / 1000).toFixed(1)} kg CO₂/year`,
    });
  } else {
    suggestions.push({
      icon: '✅',
      title: 'Green Hosting Detected',
      description: 'Great! Your server is verified as using renewable energy. Data center emissions are already reduced by ~95%.',
      impact: 'none',
      savings: 'Already optimized',
    });
  }

  // Page size
  if (totalMB > 5) {
    suggestions.push({
      icon: '📦',
      title: 'Drastically Reduce Page Size',
      description: `At ${totalMB.toFixed(1)} MB, this page is extremely heavy. The median page size is ~2 MB. Audit all resources and remove unnecessary ones.`,
      impact: 'high',
      savings: `Reducing to 2 MB would save ~${(totalMB - 2).toFixed(1)} MB per visit`,
    });
  } else if (totalMB > 3) {
    suggestions.push({
      icon: '📦',
      title: 'Reduce Overall Page Weight',
      description: `Page size is ${totalMB.toFixed(1)} MB. Consider code-splitting, tree-shaking, and removing unused CSS/JS to trim the payload.`,
      impact: 'medium',
      savings: `Target: under 2 MB for optimal efficiency`,
    });
  }

  // Scripts count
  const scriptCount = resources.scripts?.count || 0;
  if (scriptCount > 15) {
    suggestions.push({
      icon: '📜',
      title: 'Audit Third-Party Scripts',
      description: `${scriptCount} JavaScript files detected. Each script adds HTTP requests and processing energy. Remove unused scripts and consolidate where possible.`,
      impact: 'medium',
      savings: 'Fewer scripts = faster loads = less energy',
    });
  }

  // Fonts
  const fontCount = resources.fonts?.count || 0;
  const fontMB = (resources.fonts?.size || 0) / (1024 * 1024);
  if (fontCount > 4 || fontMB > 0.5) {
    suggestions.push({
      icon: '🔤',
      title: 'Optimize Font Loading',
      description: `${fontCount} font files loaded (${fontMB.toFixed(1)} MB). Subset fonts to include only needed characters, limit font variations, and use \`font-display: swap\`.`,
      impact: 'medium',
      savings: `Could save ~${(fontMB * 0.5).toFixed(1)} MB`,
    });
  }

  // General best practices (always include)
  suggestions.push({
    icon: '💡',
    title: 'Enable Caching & CDN',
    description: 'Use browser caching headers and a CDN to reduce repeat data transfer. Returning visitors will consume significantly less energy.',
    impact: 'medium',
    savings: 'Up to 70% less data for returning visitors',
  });

  // Sort by impact priority
  const impactOrder = { high: 0, medium: 1, low: 2, none: 3 };
  suggestions.sort((a, b) => impactOrder[a.impact] - impactOrder[b.impact]);

  return suggestions;
}

function roundTo(num, decimals) {
  const factor = Math.pow(10, decimals);
  return Math.round(num * factor) / factor;
}

module.exports = { calculateEmissions, generateSuggestions, getGrade };
