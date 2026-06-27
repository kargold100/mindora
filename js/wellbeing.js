/* ====================================================
   MINDORA — wellbeing.js
   Practical, ongoing habits for maintaining wellbeing — distinct
   from Learn's "why" explainers, this is the "what to actually
   do" tips library. Same accordion pattern, but each topic ends
   in a short tip list rather than a single "try this" line.
   ==================================================== */

const Wellbeing = (function(){

  const TOPICS = [
    'sleep_habits',
    'movement_routine',
    'social_connection',
    'screen_and_digital_balance',
    'gratitude_and_outlook',
    'self_compassion'
  ];

  let openKey = null;

  function render(){
    const container = document.getElementById('learnTopics');
    if(!container) return;

    container.innerHTML = TOPICS.map(key => {
      const isOpen = openKey === key;
      return `
        <div class="learn-card ${isOpen ? 'open' : ''}">
          <button class="learn-card-head" data-wbtopic="${key}" aria-expanded="${isOpen}">
            <span class="learn-card-title">${I18n.t('wb_' + key + '_title')}</span>
            <span class="learn-card-chevron" aria-hidden="true">${isOpen ? '\u2212' : '+'}</span>
          </button>
          ${!isOpen ? `<p class="learn-card-teaser muted">${I18n.t('wb_' + key + '_teaser')}</p>` : `
          <div class="learn-card-body">
            <p>${I18n.t('wb_' + key + '_intro')}</p>
            <ul class="wb-tip-list">
              <li>${I18n.t('wb_' + key + '_tip1')}</li>
              <li>${I18n.t('wb_' + key + '_tip2')}</li>
              <li>${I18n.t('wb_' + key + '_tip3')}</li>
            </ul>
          </div>`}
        </div>
      `;
    }).join('');

    container.querySelectorAll('[data-wbtopic]').forEach(btn => {
      btn.addEventListener('click', () => {
        const k = btn.getAttribute('data-wbtopic');
        openKey = (openKey === k) ? null : k;
        render();
      });
    });
  }

  return { render };
})();
