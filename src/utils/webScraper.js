import axios from 'axios';

// Scrape UTEP website pages
export const scrapeUTEPPages = async (query) => {
  const searchUrls = [
    'https://www.utep.edu/admissions/',
    'https://www.utep.edu/academics/',
    'https://www.utep.edu/student-affairs/',
    'https://www.utep.edu/about/'
  ];

  try {
    const results = [];
    
    for (const url of searchUrls) {
      try {
        const response = await axios.get(url, { timeout: 3000 });
        const text = response.data.toLowerCase();
        const queryLower = query.toLowerCase();
        
        // Check if page contains relevant keywords
        if (text.includes(queryLower.split(' ')[0])) {
          results.push({
            url: url,
            title: url.split('/').filter(Boolean).pop() || 'UTEP Information'
          });
        }
      } catch (err) {
        console.log(`Failed to fetch ${url}`);
      }
    }
    
    return results;
  } catch (error) {
    console.error('Scraping error:', error);
    return [];
  }
};
