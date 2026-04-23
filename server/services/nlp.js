const natural = require('natural');
const compromise = require('compromise');

// Comprehensive list of common tech skills and frameworks
const SKILL_KEYWORDS = [
  // Programming Languages
  'python', 'javascript', 'typescript', 'java', 'c++', 'c#', 'go', 'rust', 'ruby', 'php', 'swift', 'kotlin', 'scala', 'r', 'matlab', 'perl', 'groovy', 'erlang',
  // Web Frameworks
  'react', 'angular', 'vue', 'express', 'django', 'flask', 'spring', 'rails', 'laravel', 'asp.net', 'fastapi',
  // Databases
  'mongodb', 'postgresql', 'mysql', 'oracle', 'elasticsearch', 'redis', 'dynamodb', 'cassandra', 'mariadb', 'sqlite',
  // Cloud & DevOps
  'aws', 'gcp', 'azure', 'docker', 'kubernetes', 'terraform', 'jenkins', 'gitlab', 'github', 'circleci', 'cloudflare',
  // Data & ML
  'tensorflow', 'pytorch', 'scikit-learn', 'pandas', 'numpy', 'spark', 'hadoop', 'airflow', 'kafka', 'tableau', 'power bi',
  // Frontend
  'html', 'css', 'sass', 'webpack', 'babel', 'npm', 'yarn', 'jest', 'testing library', 'cypress', 'selenium',
  // Tools & Methodologies
  'git', 'agile', 'scrum', 'jira', 'confluence', 'slack', 'rest api', 'graphql', 'microservices', 'linux', 'windows', 'macos',
  // Soft Skills & Concepts
  'leadership', 'communication', 'problem solving', 'teamwork', 'collaboration', 'project management', 'mentoring', 'debugging', 'optimization', 'testing',
  // Additional Tech
  'linux', 'sql', 'nosql', 'api', 'rest', 'soap', 'jwt', 'oauth', 'ci/cd', 'devops', 'agile', 'scrum', 'jira', 'bitbucket', 'svn', 'monorepo', 'nodejs', 'node.js', 'npm', 'yarn', 'webpack', 'vite', 'next.js', 'nuxt', 'tailwind', 'bootstrap', 'material ui', 'junit', 'pytest', 'mocha', 'jasmine', 'docker compose', 'helm', 'istio', 'consul', 'etcd', 'zookeeper', 'activemq', 'rabbitmq', 'nginx', 'apache', 'tomcat', 'jboss'
];

const buildTfIdf = (jdText, resumeTexts) => {
  const tfidf = new natural.TfIdf();
  
  // Add job description as document 0
  tfidf.addDocument(jdText);
  
  // Add each resume as subsequent documents
  resumeTexts.forEach(text => {
    tfidf.addDocument(text);
  });
  
  return tfidf;
};

const extractKeywords = (text) => {
  const lowerText = text.toLowerCase();
  const foundKeywords = [];
  
  // Escape regex special characters
  const escapeRegex = (str) => {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };
  
  // Check for hardcoded skill keywords
  SKILL_KEYWORDS.forEach(skill => {
    try {
      const escapedSkill = escapeRegex(skill);
      const regex = new RegExp(`\\b${escapedSkill}\\b`, 'gi');
      if (regex.test(lowerText)) {
        if (!foundKeywords.includes(skill.toLowerCase())) {
          foundKeywords.push(skill.toLowerCase());
        }
      }
    } catch (err) {
      // Skip if regex fails for this keyword
      console.warn(`Skipping keyword: ${skill}`);
    }
  });
  
  // Extract capitalized noun phrases using compromise
  try {
    const doc = compromise(text);
    const nouns = doc.nouns().out('array');
    nouns.forEach(noun => {
      const nounLower = noun.toLowerCase();
      if (noun.length > 2 && !foundKeywords.includes(nounLower) && foundKeywords.length < 50) {
        foundKeywords.push(nounLower);
      }
    });
  } catch (err) {
    // Fallback if compromise fails
  }
  
  return foundKeywords;
};

const computeCosineSimilarity = (tfidf, docIndex1, docIndex2) => {
  // Get all terms from the TF-IDF model
  const terms = Object.keys(tfidf.documents[docIndex1] || {})
    .concat(Object.keys(tfidf.documents[docIndex2] || {}))
    .filter((term, index, arr) => arr.indexOf(term) === index); // unique terms
  
  if (terms.length === 0) {
    return 0;
  }
  
  let dotProduct = 0;
  let magnitude1 = 0;
  let magnitude2 = 0;
  
  terms.forEach(term => {
    const score1 = tfidf.tfidf(term, docIndex1) || 0;
    const score2 = tfidf.tfidf(term, docIndex2) || 0;
    
    dotProduct += score1 * score2;
    magnitude1 += score1 * score1;
    magnitude2 += score2 * score2;
  });
  
  magnitude1 = Math.sqrt(magnitude1);
  magnitude2 = Math.sqrt(magnitude2);
  
  if (magnitude1 === 0 || magnitude2 === 0) {
    return 0;
  }
  
  return dotProduct / (magnitude1 * magnitude2);
};

const scoreResumes = (jdText, resumeTexts, filenames) => {
  const tfidf = buildTfIdf(jdText, resumeTexts);
  const jdKeywords = extractKeywords(jdText);
  
  const results = resumeTexts.map((resumeText, index) => {
    // Compute TF-IDF cosine similarity
    const tfidfScore = computeCosineSimilarity(tfidf, 0, index + 1);
    
    // Extract keywords from resume
    const resumeKeywords = extractKeywords(resumeText);
    
    // Find matched and missing keywords
    const matchedKeywords = jdKeywords.filter(kw => {
      const lowerResume = resumeText.toLowerCase();
      return lowerResume.includes(kw);
    });
    
    const missingKeywords = jdKeywords.filter(kw => !matchedKeywords.includes(kw));
    
    // Calculate keyword match ratio
    const keywordMatchRatio = jdKeywords.length > 0 ? matchedKeywords.length / jdKeywords.length : 0;
    
    // Combined score: 60% TF-IDF, 40% keyword matching
    const combinedScore = (tfidfScore * 0.6) + (keywordMatchRatio * 0.4);
    const finalScore = Math.round(combinedScore * 100 * 10) / 10; // Round to 1 decimal
    
    // Get excerpt (first 300 characters)
    const excerpt = resumeText.substring(0, 300).replace(/\s+/g, ' ').trim();
    
    return {
      filename: filenames[index],
      score: Math.max(0, Math.min(100, finalScore)), // Clamp to 0-100
      matched: matchedKeywords,
      missing: missingKeywords.slice(0, 10), // Limit missing to top 10
      excerpt: excerpt,
      tfidfScore: Math.round(tfidfScore * 1000) / 1000,
      keywordMatchRatio: Math.round(keywordMatchRatio * 1000) / 1000,
    };
  });
  
  // Sort by score descending
  return results.sort((a, b) => b.score - a.score);
};

module.exports = {
  scoreResumes,
  extractKeywords,
};
