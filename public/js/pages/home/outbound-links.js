
    // 🌐 全站外跳連結多國語系安全攔截器 (保證 100% 帶入專屬分潤參數與正確目標語言)
    document.addEventListener('click', function (e) {
      const a = e.target.closest('a');
      if (!a || !a.href) return;
      const href = a.href;

      if (href.includes('trip.com')) {
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        const l = (typeof currentLang !== 'undefined') ? currentLang : 'zh-TW';
        const domMap = { 'en': 'https://www.trip.com', 'th': 'https://th.trip.com', 'ja': 'https://jp.trip.com', 'ko': 'https://kr.trip.com', 'zh-CN': 'https://hk.trip.com', 'zh-TW': 'https://tw.trip.com' };
        const base = domMap[l] || 'https://tw.trip.com';
        let newHref = href.replace(/https:\/\/(tw|jp|th|kr|hk|www)\.trip\.com/, base);
        if (!newHref.includes('Allianceid=')) {
          const sep = newHref.includes('?') ? '&' : '?';
          newHref += `${sep}Allianceid=9507030&SID=325761227&trip_sub1=%E6%97%A5%E6%9C%AC%E5%A0%B1%E5%A0%B1&trip_sub3=D20905663`;
        }
        a.href = newHref;
      } else if (href.includes('klook.com')) {
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        const l = (typeof currentLang !== 'undefined') ? currentLang : 'zh-TW';
        const locMap = { 'en': 'en-US', 'th': 'th', 'ja': 'ja', 'ko': 'ko', 'zh-CN': 'zh-CN', 'zh-TW': 'zh-TW' };
        const loc = locMap[l] || 'zh-TW';
        let newHref = href.replace(/klook\.com\/[a-zA-Z_\-]+(\/|$)/, `klook.com/${loc}/`);
        if (!newHref.includes('aid=')) {
          const sep = newHref.includes('?') ? '&' : '?';
          newHref += `${sep}aid=123436&utm_medium=affiliate-alwayson`;
        }
        a.href = newHref;
      } else if (href.includes('booking.com')) {
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        const l = (typeof currentLang !== 'undefined') ? currentLang : 'zh-TW';
        const locMap = { 'en': 'en-gb', 'th': 'th', 'ja': 'ja', 'ko': 'ko', 'zh-CN': 'zh-cn', 'zh-TW': 'zh-tw' };
        const curMap = { 'en': 'USD', 'th': 'THB', 'ja': 'JPY', 'ko': 'KRW', 'zh-CN': 'CNY', 'zh-TW': 'TWD' };
        const loc = locMap[l] || 'zh-tw';
        const cur = curMap[l] || 'TWD';
        let newHref = href.replace(/searchresults\.[a-z\-]+\.html/, `searchresults.${loc}.html`);
        if (!newHref.includes('aid=')) {
          const sep = newHref.includes('?') ? '&' : '?';
          newHref += `${sep}aid=2422002`;
        }
        if (!newHref.includes('selected_currency=')) {
          newHref += `&selected_currency=${cur}`;
        }
        a.href = newHref;
      }
    });

    // 🌐 首次載入自動偵測外國旅客語系 (泰文、日文、英文)
    document.addEventListener('DOMContentLoaded', function () {
      try {
        const saved = localStorage.getItem('tabi_selected_lang');
        if (saved) {
          if (saved !== 'zh-TW' && typeof setLanguage === 'function') setLanguage(saved);
        } else {
          const navLang = (navigator.language || navigator.userLanguage || '').toLowerCase();
          if (navLang.startsWith('th') && typeof selectLanguage === 'function') {
            selectLanguage('th', 'ไทย');
          } else if (navLang.startsWith('ja') && typeof selectLanguage === 'function') {
            selectLanguage('ja', '日本語');
          } else if (navLang.startsWith('en') && typeof selectLanguage === 'function') {
            selectLanguage('en', 'English');
          }
        }
      } catch (e) { }
    });
  