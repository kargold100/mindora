/* ====================================================
   MINDORA — mood-boosters.js
   Quick evidence-backed activities for a mood lift.
   Each booster has a category and approximate time.
   Suggestions rotate randomly, user can skip or mark done.
   ==================================================== */

const MoodBoosters = (function(){

  const BOOSTERS = [
    // Movement
    { text:"Go for a 10-minute walk outside — even a short one.", time:"10 min", cat:"movement" },
    { text:"Do 10 jumping jacks or a quick stretch.", time:"2 min", cat:"movement" },
    { text:"Put on a favourite song and dance to it.", time:"3 min", cat:"movement" },
    { text:"Do a 5-minute yoga stretch or forward fold.", time:"5 min", cat:"movement" },
    { text:"Walk to the end of the street and back.", time:"5 min", cat:"movement" },
    // Nature
    { text:"Step outside for 5 minutes and look at the sky.", time:"5 min", cat:"nature" },
    { text:"Water a plant or tend to something living.", time:"5 min", cat:"nature" },
    { text:"Open a window and breathe fresh air.", time:"2 min", cat:"nature" },
    // Social
    { text:"Send a voice message to someone you care about.", time:"3 min", cat:"social" },
    { text:"Text one person and tell them something you appreciate about them.", time:"2 min", cat:"social" },
    { text:"Call a friend or family member, even just to say hello.", time:"10 min", cat:"social" },
    { text:"Write a short thank-you message to someone who helped you recently.", time:"3 min", cat:"social" },
    // Sensory
    { text:"Make yourself a warm drink — tea, coffee, or hot water with lemon.", time:"5 min", cat:"sensory" },
    { text:"Take a warm shower or wash your face with cold water.", time:"5 min", cat:"sensory" },
    { text:"Put on a piece of music that genuinely moves you.", time:"4 min", cat:"sensory" },
    { text:"Light a candle or notice a pleasant scent around you.", time:"2 min", cat:"sensory" },
    { text:"Eat something nourishing — a piece of fruit, nuts, or something you enjoy.", time:"5 min", cat:"sensory" },
    // Calm
    { text:"Do three slow, deep breaths right now — inhale 4s, exhale 6s.", time:"1 min", cat:"calm" },
    { text:"Sit quietly for 2 minutes with your phone face-down.", time:"2 min", cat:"calm" },
    { text:"Spend 5 minutes doing something creative — doodle, write, colour.", time:"5 min", cat:"calm" },
    { text:"Write down three things that went okay today, however small.", time:"3 min", cat:"calm" },
    { text:"Tidy one small surface — a desk, a shelf, a bag.", time:"5 min", cat:"calm" },
    // Laughter
    { text:"Watch one funny video that genuinely makes you laugh.", time:"5 min", cat:"laughter" },
    { text:"Read a few pages of something lighthearted.", time:"5 min", cat:"laughter" },
    { text:"Look at photos that make you smile — a holiday, a pet, a memory.", time:"3 min", cat:"laughter" },
    // Self-care
    { text:"Drink a full glass of water right now.", time:"1 min", cat:"selfcare" },
    { text:"Stretch your neck and shoulders — roll them gently back three times.", time:"2 min", cat:"selfcare" },
    { text:"Rest your eyes — look away from all screens for 5 minutes.", time:"5 min", cat:"selfcare" },
    { text:"Do one small thing you've been putting off — just one.", time:"10 min", cat:"selfcare" },
    { text:"Give yourself permission to do absolutely nothing for 5 minutes.", time:"5 min", cat:"selfcare" },
  ];

  let currentIndex = null;

  function getRandom(){
    const idx = Math.floor(Math.random() * BOOSTERS.length);
    currentIndex = idx;
    return BOOSTERS[idx];
  }

  function render(){
    const container = document.getElementById('moodBoostersContent');
    if(!container) return;

    const b = currentIndex !== null ? BOOSTERS[currentIndex] : getRandom();
    renderBooster(container, b);
  }

  function renderBooster(container, b){
    container.innerHTML = `
      <div class="booster-card">
        <div class="booster-body">
          <p class="booster-text">${b.text}</p>
          <span class="booster-time">⏱ ${b.time}</span>
        </div>
        <div class="booster-actions">
          <button class="btn-secondary" id="boosterSkipBtn">${I18n.t('boosters_skip_btn')}</button>
          <button class="btn-primary" id="boosterDoneBtn">${I18n.t('boosters_try_btn')}</button>
        </div>
      </div>
      <p class="muted" style="margin-top:14px; font-size:.8rem;">${I18n.t('boosters_subtitle')}</p>
    `;

    document.getElementById('boosterSkipBtn').addEventListener('click', () => {
      currentIndex = null;
      getRandom();
      render();
    });
    document.getElementById('boosterDoneBtn').addEventListener('click', () => {
      container.innerHTML = `
        <div class="booster-done-card">
          <p class="booster-done-emoji">🌟</p>
          <p class="booster-done-text">${I18n.t('boosters_done_btn')}</p>
          <button class="btn-secondary" id="boosterNextBtn" style="margin-top:12px;">${I18n.t('boosters_skip_btn')}</button>
        </div>
      `;
      document.getElementById('boosterNextBtn').addEventListener('click', () => {
        currentIndex = null;
        getRandom();
        render();
      });
    });
  }

  return { render };
})();
