let isCancelled = false;

const SELECTORS = {
  reviewContainer: 'div[jscontroller="H6eYec"], .RHo1pe, .VfPpkd-LgIV6e-m6Hjwb-Lb9Xee, .E6Ym7b',
  reviewText: 'div.h3YV2d, [jsname="bN97Pc"], .h3YV2d, .UD7M9, .X59U9e',
  ratingContainer: 'div[role="img"][aria-label*="stars"], .iG6uTe, .TT9eCd, .jNoZ9b',
  modalScrollable: 'div[role="dialog"] .VfPpkd-cnZ6id, div[role="dialog"] .f3969d, div[role="dialog"] .fysCi, div[role="dialog"]',
};

const KEYWORDS = {
  negative: ['bad', 'worst', 'slow', 'lag', 'bug', 'error', 'crash', 'not working', 'waste', 'problem'],
  feature: ['should', 'please add', 'need', 'missing', 'would be better', 'I wish']
};

/**
 * Extracts review text and ratings from the DOM.
 */
function getReviewsFromDOM() {
  const reviews = [];
  document.querySelectorAll(SELECTORS.reviewContainer).forEach(el => {
    const text = el.querySelector(SELECTORS.reviewText)?.innerText || "";
    const ratingLabel = el.querySelector(SELECTORS.ratingContainer)?.getAttribute('aria-label') || "";
    const ratingMatch = ratingLabel.match(/\d+/);
    const rating = ratingMatch ? parseInt(ratingMatch[0]) : null;
    
    if (text) {
      reviews.push({ text, rating, element: el });
    }
  });
  return reviews;
}

/**
 * Categorizes and deduplicates reviews, limiting results to 30 per category.
 */
function filterReviews(reviews) {
  const problems = [];
  const requests = [];
  const seen = new Set();

  reviews.forEach(r => {
    if (seen.has(r.text)) return;
    seen.add(r.text);

    const textLower = r.text.toLowerCase();
    const isProblem = KEYWORDS.negative.some(k => textLower.includes(k)) || (r.rating !== null && r.rating <= 2);
    const isRequest = KEYWORDS.feature.some(k => textLower.includes(k));

    if (isProblem) problems.push(r.text);
    if (isRequest) requests.push(r.text);
  });

  return { 
    problems: problems.slice(0, 30), 
    requests: requests.slice(0, 30) 
  };
}

/**
 * Aggressively searches for and clicks the "See all reviews" button.
 */
function openReviewsModal() {
  console.log("Starting openReviewsModal (Surgical Fix v2)...");

  // Priority 1: Target the "Ratings and reviews" section specifically
  const headers = Array.from(document.querySelectorAll('h2, h3, h1'));
  const ratingsHeader = headers.find(h => {
    const text = h.innerText.toLowerCase();
    return text.includes('ratings and reviews') || text.includes('customer reviews');
  });
  
  if (ratingsHeader) {
    console.log("Found Ratings and Reviews header, searching inside section...");
    const section = ratingsHeader.closest('section') || ratingsHeader.parentElement;
    
    // Look for buttons that specifically mention "reviews" or "all"
    const sectionButtons = section.querySelectorAll('button, [role="button"], a, [jsname]');
    const seeAllBtn = Array.from(sectionButtons).find(el => {
      const text = (el.innerText || "").toLowerCase();
      const ariaLabel = (el.getAttribute('aria-label') || "").toLowerCase();
      const jsname = el.getAttribute('jsname');
      
      // CRITICAL BLACKLIST: Avoid informational spans and navigation
      const isBlacklisted = 
        text.includes('are verified') || 
        text.includes('about this app') ||
        text.includes('games') || 
        text.includes('apps') || 
        text.includes('movies');
      
      if (isBlacklisted) return false;

      const isReviewButton = text.includes('review') || ariaLabel.includes('review');
      const isSeeAll = text.includes('see all') || text.includes('view all') || ariaLabel.includes('see all');
      
      // S569ce is the CURRENT stable ID for the actual "See all reviews" button
      const isCorrectJsName = jsname === 'S569ce';

      return (isReviewButton && isSeeAll) || isCorrectJsName;
    });
    
    if (seeAllBtn) {
      console.log("Matched validated button in section:", seeAllBtn);
      // Ensure we click the actual button/link and not just the span
      const clickable = seeAllBtn.closest('button') || seeAllBtn.closest('a') || seeAllBtn;
      clickable.click();
      return true;
    }
  }

  // Priority 2: Global fuzzy search with strict exclusion and inclusion rules
  const allElements = document.querySelectorAll('button, [role="button"], a');
  const fallbackBtn = Array.from(allElements).find(el => {
    const text = (el.innerText || "").toLowerCase();
    const ariaLabel = (el.getAttribute('aria-label') || "").toLowerCase();
    const jsname = el.getAttribute('jsname');

    // Strict Exclusions
    const isBlacklisted = 
      text.includes('are verified') || 
      text.includes('about this app') ||
      text.includes('games') || 
      text.includes('apps') || 
      text.includes('movies') || 
      text.includes('books');
    
    if (isBlacklisted) return false;
    if (el.tagName === 'A' && (el.href === 'https://play.google.com/store/games' || el.href.endsWith('/store/apps'))) return false;

    // Strict Inclusions
    const hasReviewText = text.includes('review') || ariaLabel.includes('review');
    const hasSeeAll = text.includes('see all') || ariaLabel.includes('see all');
    const hasJsName = jsname === 'S569ce'; // Removed V67aGc from global priority as it's too ambiguous

    return (hasReviewText && hasSeeAll) || hasJsName;
  });
  
  if (fallbackBtn) {
    console.log("Matched global fallback button:", fallbackBtn);
    const clickable = fallbackBtn.closest('button') || fallbackBtn.closest('a') || fallbackBtn;
    clickable.click();
    return true;
  }

  console.log("Failed to find 'See all reviews' button.");
  return false;
}

/**
 * Automatically scrolls the review modal using element-targeted scrolling.
 */
async function autoScrollAndExtract(limit, onProgress) {
  isCancelled = false;
  
  // Try to open modal if not already open
  const isModalOpen = !!document.querySelector('div[role="dialog"]');
  if (!isModalOpen) {
    const clicked = openReviewsModal();
    if (clicked) {
      await new Promise(resolve => setTimeout(resolve, 3500));
    }
  }

  return new Promise((resolve) => {
    let safetyTimeout;
    let scrollInterval;

    const cleanup = () => {
      observer.disconnect();
      if (safetyTimeout) clearTimeout(safetyTimeout);
      if (scrollInterval) clearInterval(scrollInterval);
    };

    const observer = new MutationObserver(() => {
      if (isCancelled) {
        cleanup();
        resolve({ status: 'cancelled', reviews: getReviewsFromDOM() });
        return;
      }

      const currentReviews = getReviewsFromDOM();
      onProgress(currentReviews.length);
      
      if (currentReviews.length >= limit) {
        cleanup();
        resolve({ status: 'success', reviews: currentReviews });
      } else {
        if (currentReviews.length > 0) {
          currentReviews[currentReviews.length - 1].element.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    
    const initialReviews = getReviewsFromDOM();
    if (initialReviews.length > 0) {
      initialReviews[initialReviews.length - 1].element.scrollIntoView();
    }

    safetyTimeout = setTimeout(() => {
      cleanup();
      resolve({ status: 'success', reviews: getReviewsFromDOM() });
    }, 60000);

    scrollInterval = setInterval(() => {
      if (isCancelled) return;
      const reviews = getReviewsFromDOM();
      if (reviews.length > 0) {
        reviews[reviews.length - 1].element.scrollIntoView();
      }
    }, 3000);
  });
}

/**
 * Message listener for handling requests.
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "extract") {
    autoScrollAndExtract(200, (count) => {
      try {
        chrome.runtime.sendMessage({ action: "progress", count }, () => {
          if (chrome.runtime.lastError) {}
        });
      } catch (e) {}
    }).then(result => {
      if (result.status === 'cancelled') {
        sendResponse({ status: "cancelled" });
      } else {
        const filtered = filterReviews(result.reviews);
        sendResponse({ status: "success", data: filtered });
      }
    }).catch(error => {
      console.error("Extraction failed:", error);
      sendResponse({ status: "error", message: error.message });
    });
    return true;
  }

  if (request.action === "cancel") {
    isCancelled = true;
  }
});
