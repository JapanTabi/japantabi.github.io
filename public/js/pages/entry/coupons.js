// Official merchant references; a page entry is not a redeemable coupon.
(function () {
  var url = new URL('../../../data/coupons.json', document.currentScript.src);
  var container = document.getElementById('couponsContainer');
  if (!container) return;
  function text(tag, value) { var element = document.createElement(tag); element.textContent = value; return element; }
  fetch(url).then(function (response) { if (!response.ok) throw new Error('Merchant references unavailable'); return response.json(); }).then(function (coupons) {
    container.replaceChildren.apply(container, coupons.map(function (coupon) {
      var card = document.createElement('article'); card.className = 'coupon-reference-card';
      card.style.cssText = 'background:#fff;border:1px solid #E2E8F0;border-radius:16px;padding:18px;display:flex;flex-direction:column;gap:10px';
      card.append(text('h3', coupon.name));
      var original = text('small', coupon.jp); original.lang = 'ja'; original.translate = false; card.append(original);
      card.append(text('p', coupon.discount), text('p', coupon.condition), text('p', coupon.usage));
      var target = new URL(coupon.coupon_url);
      if (target.protocol === 'https:' && !target.hostname.endsWith('.coupon')) {
        var link = text('a', '查看店家官方活動與適用條件');
        link.href = target.href; link.target = '_blank'; link.rel = 'noopener noreferrer'; card.append(link);
      }
      return card;
    }));
  }).catch(function () { container.replaceChildren(text('p', '店家資料暫時無法載入，請稍後再試。')); });
})();
