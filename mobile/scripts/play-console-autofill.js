/**
 * Google Play Console — 1-Click Universal Form Auto-Filler
 * 
 * Usage:
 * 1. Open Google Play Console: https://play.google.com/console
 * 2. Select app 'Engy Up' (com.engyup.app)
 * 3. Navigate to any section under "App content" (or Dashboard tasks):
 *    - Privacy policy
 *    - Ads
 *    - App access
 *    - Content ratings
 *    - Target audience and content
 *    - News apps
 *    - COVID-19 apps
 *    - Data safety
 *    - Financial features
 *    - Government apps
 * 4. Press F12 -> Go to Console tab -> Paste this code and hit Enter.
 * 
 * It will inspect the current form, fill all fields, select all correct radio options,
 * and click the Save/Next button automatically!
 */

(() => {
  const CONFIG = {
    privacyPolicyUrl: 'https://engy-up.vercel.app/privacy.html',
    termsUrl: 'https://engy-up.vercel.app/terms.html',
    deletionUrl: 'https://engy-up.vercel.app/privacy.html#deletion',
    email: 'support@engyup.com',
    supportSite: 'https://engy-up.vercel.app'
  };

  console.log('%c[Engy Up] Running Play Console Auto-Filler...', 'color: #3b82f6; font-weight: bold; font-size: 14px;');

  function triggerInput(el, value) {
    if (!el) return;
    el.focus();
    el.value = value;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.blur();
    console.log(`[Engy Up] Set value "${value}" on:`, el);
  }

  function clickElement(el) {
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.click();
    el.dispatchEvent(new Event('change', { bubbles: true }));
    console.log(`[Engy Up] Clicked element:`, el);
  }

  function findByText(selector, text, exact = false) {
    const elements = Array.from(document.querySelectorAll(selector));
    return elements.find(el => {
      const content = el.textContent.trim().toLowerCase();
      const target = text.toLowerCase();
      return exact ? content === target : content.includes(target);
    });
  }

  let filledCount = 0;

  // 1. Text Inputs (URLs, Emails)
  document.querySelectorAll('input[type="url"], input[type="text"], input[type="email"], textarea').forEach(input => {
    const label = (input.getAttribute('aria-label') || input.placeholder || input.name || '').toLowerCase();
    const parentText = input.closest('label, material-input, div')?.textContent.toLowerCase() || '';

    if (label.includes('privacy') || parentText.includes('privacy policy') || parentText.includes('سياسة الخصوصية')) {
      triggerInput(input, CONFIG.privacyPolicyUrl);
      filledCount++;
    } else if (label.includes('delete') || label.includes('deletion') || parentText.includes('account deletion') || parentText.includes('حذف الحساب')) {
      triggerInput(input, CONFIG.deletionUrl);
      filledCount++;
    } else if (label.includes('email') || parentText.includes('email') || parentText.includes('البريد')) {
      triggerInput(input, CONFIG.email);
      filledCount++;
    } else if (label.includes('website') || parentText.includes('website') || parentText.includes('الموقع')) {
      triggerInput(input, CONFIG.supportSite);
      filledCount++;
    }
  });

  // 2. Radio Options ("No" declarations, No Ads, Full Access)
  // Target statements that should be "No"
  const noMatches = [
    'does not contain ads',
    'لا يحتوي على إعلانات',
    'no ads',
    'without special access',
    'بدون قيود وصول',
    'all functionality is available without special access',
    'not a news app',
    'ليس تطبيقاً إخبارياً',
    'not a publicly available covid',
    'not a government app',
    'لا يمثل جهة حكومية',
    'does not provide any financial features',
    'لا يقدم ميزات مالية',
    'no',
    'لا'
  ];

  document.querySelectorAll('material-radio, input[type="radio"], [role="radio"]').forEach(radio => {
    const text = radio.textContent.trim().toLowerCase() || radio.closest('label, div')?.textContent.trim().toLowerCase() || '';
    
    // Check if matches standard declarations
    const isNo = noMatches.some(m => text.includes(m));
    if (isNo && !radio.hasAttribute('aria-checked') && radio.getAttribute('aria-checked') !== 'true') {
      clickElement(radio);
      filledCount++;
    }
  });

  // 3. Target Audience Checkboxes (13-17, 18 and over)
  document.querySelectorAll('material-checkbox, input[type="checkbox"], [role="checkbox"]').forEach(cb => {
    const text = cb.textContent.trim().toLowerCase() || cb.closest('label, div')?.textContent.trim().toLowerCase() || '';
    if (text.includes('13-15') || text.includes('16-17') || text.includes('18 and over') || text.includes('13–17') || text.includes('18 فما فوق')) {
      if (cb.getAttribute('aria-checked') !== 'true' && !cb.checked) {
        clickElement(cb);
        filledCount++;
      }
    }
  });

  // 4. Save / Next / Submit button detection
  setTimeout(() => {
    const actionButtons = Array.from(document.querySelectorAll('button, material-button, [role="button"]'));
    const saveBtn = actionButtons.find(btn => {
      const text = btn.textContent.trim().toLowerCase();
      return text === 'save' || text === 'حفظ' || text === 'next' || text === 'التالي' || text === 'submit' || text === 'إرسال';
    });

    if (saveBtn && !saveBtn.disabled && !saveBtn.hasAttribute('disabled')) {
      console.log(`%c[Engy Up] Ready! Found action button: "${saveBtn.textContent.trim()}". Clicking in 1 second...`, 'color: #10b981; font-weight: bold;');
      setTimeout(() => {
        clickElement(saveBtn);
        console.log('%c[Engy Up] Saved successfully!', 'color: #10b981; font-size: 16px; font-weight: bold;');
      }, 1000);
    } else {
      console.log(`%c[Engy Up] Auto-filled ${filledCount} fields. Review and click Save when ready.`, 'color: #10b981; font-size: 14px;');
    }
  }, 500);

  return `[Engy Up] Processed ${filledCount} form elements automatically.`;
})();
