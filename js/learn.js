/* ====================================================
   MINDORA — learn.js
   Educational content: mood, stress, sleep, coping techniques,
   and when to seek help. General information only — framed
   throughout as not a diagnosis or treatment plan.
   ==================================================== */

const Learn = (function(){

  const TOPICS = [
    'mood_ups_and_downs',
    'sleep_and_mood',
    'movement_and_mood',
    'stress_and_nervous_system',
    'grounding_techniques',
    'common_feelings',
    'when_to_seek_help'
  ];

  let openKey = null;

  function helplineBlock(){
    return `
      <div class="crisis-actions" style="margin-top:12px;">
        <a href="tel:131114" class="crisis-btn-static"><span data-i18n="helpline_lifeline">Lifeline</span> · 13 11 14</a>
        <a href="tel:1300224636" class="crisis-btn-static"><span data-i18n="helpline_beyondblue">Beyond Blue</span> · 1300 22 4636</a>
        <a href="tel:1800551800" class="crisis-btn-static"><span data-i18n="helpline_kidshelpline">Kids Helpline</span> · 1800 55 1800</a>
      </div>`;
  }

  function render(){
    const container = document.getElementById('learnTopics');
    if(!container) return;

    container.innerHTML = TOPICS.map(key => {
      const isOpen = openKey === key;
      return `
        <div class="learn-card ${isOpen ? 'open' : ''}">
          <button class="learn-card-head" data-topic="${key}" aria-expanded="${isOpen}">
            <span class="learn-card-title">${I18n.t('topic_' + key + '_title')}</span>
            <span class="learn-card-chevron" aria-hidden="true">${isOpen ? '\u2212' : '+'}</span>
          </button>
          ${!isOpen ? `<p class="learn-card-teaser muted">${I18n.t('topic_' + key + '_teaser')}</p>` : `
          <div class="learn-card-body">
            <p>${I18n.t('topic_' + key + '_body')}</p>
            <p class="learn-tip"><strong>${I18n.t('learn_tip_label')}</strong> ${I18n.t('topic_' + key + '_tip')}</p>
            ${key === 'when_to_seek_help' ? helplineBlock() : ''}
          </div>`}
        </div>
      `;
    }).join('');

    container.querySelectorAll('[data-topic]').forEach(btn => {
      btn.addEventListener('click', () => {
        const k = btn.getAttribute('data-topic');
        openKey = (openKey === k) ? null : k;
        render();
      });
    });

    I18n.applyStaticTranslations();
  }

  return { render };
})();
