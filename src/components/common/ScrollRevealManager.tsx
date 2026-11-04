import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const ScrollRevealManager: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    // Collect target elements for scroll animations
    const selector = '[data-reveal], .reveal-on-scroll, article, main section > div, .card';

    const observerCallback: IntersectionObserverCallback = (entries) => {
      entries.forEach((entry) => {
        const el = entry.target as HTMLElement;

        if (entry.isIntersecting) {
          el.classList.add('is-revealed');
        } else {
          // When scrolling away (either above or below viewport), reset so it re-animates on scroll up or down
          const rect = entry.boundingClientRect;
          const isFarAbove = rect.bottom < -20;
          const isFarBelow = rect.top > window.innerHeight + 20;

          if (isFarAbove || isFarBelow) {
            el.classList.remove('is-revealed');
          }
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, {
      threshold: 0.01,
      rootMargin: '50px 0px 50px 0px',
    });

    // Helper to register elements
    const attachObserver = () => {
      const elements = document.querySelectorAll(selector);
      elements.forEach((el, index) => {
        // Skip header and navigation elements
        if (el.closest('header') || el.closest('nav') || el.closest('.no-reveal')) {
          return;
        }

        if (!el.classList.contains('reveal-on-scroll')) {
          el.classList.add('reveal-on-scroll');
        }

        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight + 50 && rect.bottom > -50) {
          el.classList.add('is-revealed');
        }

        // Apply slight stagger based on grid siblings if not already set
        if (!el.hasAttribute('data-stagger-set')) {
          const stagger = (index % 4) * 60;
          if (stagger > 0) {
            (el as HTMLElement).style.transitionDelay = `${stagger}ms`;
          }
          el.setAttribute('data-stagger-set', 'true');
        }

        observer.observe(el);
      });
    };

    // Initial attach with slight delay for DOM rendering
    const timer = setTimeout(attachObserver, 120);

    // Mutation observer to catch dynamically mounted cards/items
    const mutationObserver = new MutationObserver(() => {
      attachObserver();
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      clearTimeout(timer);
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, [location.pathname, location.search]);

  return null;
};
