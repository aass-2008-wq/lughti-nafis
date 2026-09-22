(() => {
  'use strict';
  const CHANNEL_URL = 'https://whatsapp.com/channel/0029Vb6w53QJkK75ofdFIE3M';

  function patchWhatsAppChannelCard() {
    document.querySelectorAll('.resource-cards .card').forEach(card => {
      const heading = card.querySelector('h3');
      if (!heading || heading.textContent.trim() !== 'قناة الواتساب') return;

      const placeholder = card.querySelector('.badge.gold');
      if (placeholder) {
        const link = document.createElement('a');
        link.className = 'btn light';
        link.href = CHANNEL_URL;
        link.target = '_blank';
        link.rel = 'noopener';
        link.textContent = 'فتح القناة';
        placeholder.replaceWith(link);
        return;
      }

      const link = card.querySelector('a');
      if (link) {
        link.href = CHANNEL_URL;
        link.target = '_blank';
        link.rel = 'noopener';
        link.textContent = 'فتح القناة';
      }
    });
  }

  const main = document.getElementById('main');
  if (main) {
    new MutationObserver(patchWhatsAppChannelCard).observe(main, { childList: true, subtree: true });
  }
  patchWhatsAppChannelCard();
})();
