/* ====================================================
   MINDORA — tips-daily.js
   Three things on the Today screen:
   1. Tip of the Day — rotates through a curated library
      of evidence-based wellness tips, one per day
   2. Pattern insight — personalised observation derived
      from the user's own data (7+ entries needed)
   3. Weekly reflection prompt — Mondays only
   ==================================================== */

const TipsDaily = (function(){

  // ── Curated tip library ───────────────────────────
  // Each tip is a short, actionable, evidence-based statement.
  // Sources: CBT, ACT, positive psychology, sleep science, exercise physiology.

  const TIPS = [
    // Mental & Mood
    { text:"Even a 10-minute walk outside has been shown to improve mood within 30 minutes — it's one of the fastest-acting interventions we know of.", cat:'mood' },
    { text:"Naming an emotion tends to reduce its intensity. Simply thinking 'I notice I'm feeling anxious' engages the prefrontal cortex and quiets the amygdala.", cat:'mood' },
    { text:"Mood forecasting is notoriously inaccurate — we consistently overestimate how long bad feelings will last. Today's low mood is almost always temporary.", cat:'mood' },
    { text:"Small acts of kindness reliably lift the giver's mood as much as the receiver's, sometimes more. One small thing today counts.", cat:'mood' },
    { text:"Physical sensation grounds you in the present moment. If you're spiralling, hold something cold, feel your feet on the floor, or focus on 5 slow breaths.", cat:'mood' },
    { text:"The link between posture and mood runs both ways. Sitting upright for even 2 minutes can shift how you feel emotionally.", cat:'mood' },
    { text:"Anticipating something enjoyable activates similar brain circuits as the event itself. Scheduling one thing to look forward to this week has real value.", cat:'mood' },
    { text:"Avoidance keeps anxiety alive. Doing something small toward the thing you're avoiding often reduces its emotional weight more than thinking about it.", cat:'mood' },

    // Sleep
    { text:"Sleep quality matters as much as sleep duration. A consistent wake time (even on weekends) is the single most effective way to improve both.", cat:'sleep' },
    { text:"The blue light from screens suppresses melatonin for up to 3 hours. Dimming your screen or using night mode after 9pm is a genuine, not trivial, sleep aid.", cat:'sleep' },
    { text:"Your body temperature needs to drop slightly to fall asleep. A slightly cool room (around 18°C/65°F) supports this more than most sleep supplements.", cat:'sleep' },
    { text:"Light exposure within 30 minutes of waking helps anchor your circadian rhythm — it's more powerful than an alarm at helping your body know when morning is.", cat:'sleep' },
    { text:"Worry activates the brain in ways that conflict with sleep. Writing worries down before bed — a 'worry dump' — moves them from working memory onto paper.", cat:'sleep' },
    { text:"Sleep debt is partly recoverable. One or two nights of good sleep won't undo weeks of poor sleep, but they reliably improve how you function the next day.", cat:'sleep' },

    // Movement
    { text:"Resistance training (weights, bodyweight) has strong evidence for reducing symptoms of depression and anxiety, independent of cardiovascular fitness.", cat:'movement' },
    { text:"30 minutes of moderate exercise increases BDNF (brain-derived neurotrophic factor) — essentially a fertiliser for brain cells that supports learning and mood.", cat:'movement' },
    { text:"The 'exercise high' is real but delayed by 20–30 minutes. If you feel terrible at the start of a workout, pushing through the first 10 minutes almost always helps.", cat:'movement' },
    { text:"Sitting for long stretches has measurable negative effects on mood and energy. A 2-minute walk or stretch every hour counteracts most of this.", cat:'movement' },
    { text:"Nature exposure during exercise amplifies its mental health benefits compared to exercising indoors. Even a park counts.", cat:'movement' },

    // Stress & Anxiety
    { text:"Stress isn't inherently harmful — it's the belief that stress is harmful that correlates with poor outcomes. Viewing it as 'my body preparing me' has measurable benefits.", cat:'stress' },
    { text:"Chronic overthinking is exhausting. Scheduled 'worry time' (15 minutes, same time daily) constrains rumination and protects the rest of your day.", cat:'stress' },
    { text:"The physiological sigh (double inhale through nose, long exhale through mouth) is the fastest way to offload CO₂ and calm the nervous system — it takes 5 seconds.", cat:'stress' },
    { text:"Saying 'no' is a skill, not a character flaw. Overcommitment is one of the most common and most overlooked sources of chronic stress.", cat:'stress' },
    { text:"Perfectionism and procrastination are closely linked — both stem from fear of a gap between output and standard. 'Done and imperfect' reliably outperforms 'not started'.", cat:'stress' },
    { text:"Physical decluttering has a modest but real effect on mental load. Clearing one small space — a desk, a bag — can genuinely reduce cognitive noise.", cat:'stress' },

    // Connection & Relationships
    { text:"Loneliness has roughly the same health impact as smoking 15 cigarettes a day. Quantity of connections matters less than having at least a few where you feel understood.", cat:'connection' },
    { text:"'Active constructive responding' — responding to good news with genuine curiosity and enthusiasm — strengthens relationships more reliably than supporting people through bad times.", cat:'connection' },
    { text:"Spending time with people who have the habits you want is one of the most effective and most underused behaviour change tools available.", cat:'connection' },
    { text:"Loneliness often increases sensitivity to social threat. If you've been alone for a while, small social friction may feel bigger than it is — that's a normal neurological response.", cat:'connection' },

    // Nutrition & Hydration
    { text:"Even mild dehydration (1-2% body weight) measurably impairs concentration, mood, and energy — before you feel thirsty. Drinking water throughout the day beats waiting until you're dry.", cat:'physical' },
    { text:"The gut-brain axis is bidirectional. Eating a wide variety of plants (not just salad — legumes, wholegrains, nuts) supports the gut microbiome in ways that appear to influence mood.", cat:'physical' },
    { text:"Skipping meals increases cortisol. If stress is already high, regular eating — even small amounts — supports emotional regulation more than intermittent fasting.", cat:'physical' },
    { text:"Caffeine has a half-life of 5–7 hours. Coffee at 2pm still has half its effect at 7–9pm, which can fragment sleep even if you don't feel stimulated.", cat:'physical' },

    // Mindfulness & Presence
    { text:"You can't think your way out of a feeling, but you can feel your way through it. Allowing an emotion without fighting or analysing it usually shortens its duration.", cat:'mindfulness' },
    { text:"Gratitude doesn't require feeling grateful. The act of listing three specific things — however small — activates the neural circuits associated with positive emotion.", cat:'mindfulness' },
    { text:"Mindfulness meditation at any dose (even 5 minutes) has measurable effects on cortisol and inflammatory markers when practised regularly.", cat:'mindfulness' },
    { text:"Flow states — being fully absorbed in a challenging but doable task — are one of the most consistently reported sources of wellbeing. Finding where your skills meet a challenge worth having matters.", cat:'mindfulness' },
    { text:"The negativity bias is a feature, not a bug: the brain prioritises threats. Actively savouring something good for 20+ seconds helps encode it more strongly in memory.", cat:'mindfulness' },

    // Self-compassion
    { text:"Self-criticism activates the same threat systems as external criticism. Self-compassion (treating yourself as you'd treat a friend in the same situation) is associated with greater motivation, not less.", cat:'compassion' },
    { text:"Shame says 'I am bad'. Guilt says 'I did something bad'. Guilt tends to motivate change; shame tends to motivate hiding. Noticing the difference is worth doing.", cat:'compassion' },
    { text:"Comparing your inner life to other people's outer presentation is a particularly reliable way to feel worse. Most people's internal experience is messier than they show.", cat:'compassion' },
    { text:"Bad days don't define you. High-functioning people have low days; low-functioning people have high days. A single data point tells you almost nothing about the trend.", cat:'compassion' },

    // Professional & Purpose
    { text:"Progress on meaningful work — even small, almost invisible progress — is one of the most consistent predictors of daily wellbeing. Tiny forward movement counts.", cat:'purpose' },
    { text:"'Psychological safety' — being able to speak up without fear of punishment — is the strongest predictor of high-performing teams. It's created in small interactions, not formal policies.", cat:'purpose' },
    { text:"Autonomy, mastery, and purpose are more reliably motivating than external rewards for complex tasks. If any of those three is missing from your work, that's worth knowing.", cat:'purpose' },
  ];

  // ── Pick today's tip ──────────────────────────────
  // Deterministic daily rotation based on date string → index
  function getTodaysTip(){
    const today = Storage.todayStr();
    const dateNum = parseInt(today.replace(/-/g,''), 10);
    const idx = dateNum % TIPS.length;
    return TIPS[idx];
  }

  // ── Pattern insights from user data ──────────────
  function getPersonalisedInsight(){
    const entries = Storage.getMoodEntries();
    if(entries.length < 7) return null;

    const logs = Storage.getLogs();
    const insights = [];

    // Sleep → mood
    const withGoodSleep  = entries.filter(e => e.sleepHours !== null && Number(e.sleepHours) >= 7);
    const withPoorSleep  = entries.filter(e => e.sleepHours !== null && Number(e.sleepHours) < 6);
    if(withGoodSleep.length >= 3 && withPoorSleep.length >= 3){
      const avgGood = avg(withGoodSleep.map(e=>e.mood));
      const avgPoor = avg(withPoorSleep.map(e=>e.mood));
      if(avgGood - avgPoor >= 1){
        insights.push({ key:'insight_sleep_mood', diff: (avgGood-avgPoor).toFixed(1) });
      }
    }

    // Exercise → mood
    const exerciseDates = new Set(logs.filter(l=>l.category==='physical').map(l=>l.date));
    const withExercise    = entries.filter(e => exerciseDates.has(e.date));
    const withoutExercise = entries.filter(e => !exerciseDates.has(e.date));
    if(withExercise.length >= 3 && withoutExercise.length >= 3){
      const avgWith    = avg(withExercise.map(e=>e.mood));
      const avgWithout = avg(withoutExercise.map(e=>e.mood));
      if(avgWith - avgWithout >= 1){
        insights.push({ key:'insight_exercise_stress' });
      }
    }

    // Gratitude → mood
    const withGrat    = entries.filter(e => e.gratitude && e.gratitude.some(g=>g&&g.trim()));
    const withoutGrat = entries.filter(e => !e.gratitude || !e.gratitude.some(g=>g&&g.trim()));
    if(withGrat.length >= 3 && withoutGrat.length >= 3){
      const avgG  = avg(withGrat.map(e=>e.mood));
      const avgNG = avg(withoutGrat.map(e=>e.mood));
      if(avgG - avgNG >= 0.8){
        insights.push({ key:'insight_gratitude_mood' });
      }
    }

    // Water → energy
    const withGoodWater = entries.filter(e => e.water !== null && Number(e.water) >= 6 && e.energy !== null);
    const withLowWater  = entries.filter(e => e.water !== null && Number(e.water) < 4  && e.energy !== null);
    if(withGoodWater.length >= 3 && withLowWater.length >= 3){
      const avgHW = avg(withGoodWater.map(e=>e.energy));
      const avgLW = avg(withLowWater.map(e=>e.energy));
      if(avgHW - avgLW >= 1){
        insights.push({ key:'insight_water_energy' });
      }
    }

    // Screen time → mood
    const withHighScreen = entries.filter(e => e.screenTime !== null && Number(e.screenTime) >= 8);
    const withLowScreen  = entries.filter(e => e.screenTime !== null && Number(e.screenTime) <= 3);
    if(withHighScreen.length >= 3 && withLowScreen.length >= 3){
      const avgHS = avg(withHighScreen.map(e=>e.mood));
      const avgLS = avg(withLowScreen.map(e=>e.mood));
      if(avgLS - avgHS >= 1.2){
        insights.push({ key:'insight_screen_mood' });
      }
    }

    // Weekend vs weekday
    const weekendEntries = entries.filter(e => { const d=new Date(e.date+'T00:00:00').getDay(); return d===0||d===6; });
    const weekdayEntries = entries.filter(e => { const d=new Date(e.date+'T00:00:00').getDay(); return d>0&&d<6; });
    if(weekendEntries.length >= 4 && weekdayEntries.length >= 8){
      const avgWE = avg(weekendEntries.map(e=>e.mood));
      const avgWD = avg(weekdayEntries.map(e=>e.mood));
      if(avgWE - avgWD >= 1){
        insights.push({ key:'insight_weekend_mood' });
      }
    }

    if(!insights.length) return null;

    // Pick one insight deterministically per day
    const today = Storage.todayStr();
    const dateNum = parseInt(today.replace(/-/g,''), 10);
    const pick = insights[dateNum % insights.length];
    return I18n.t(pick.key);
  }

  // ── Weekly reflection prompt (Mondays only) ───────
  function getWeeklyPrompt(){
    const dow = new Date().getDay();
    if(dow !== 1) return null; // Only show on Mondays
    const today = Storage.todayStr();
    const dateNum = parseInt(today.replace(/-/g,''), 10);
    const prompts = [
      I18n.t('weekly_prompt_1'),
      I18n.t('weekly_prompt_2'),
      I18n.t('weekly_prompt_3')
    ];
    return prompts[dateNum % prompts.length];
  }

  // ── Render into #dailyTipCard ─────────────────────
  function render(){
    const container = document.getElementById('dailyTipCard');
    if(!container) return;

    const tip     = getTodaysTip();
    const insight = getPersonalisedInsight();
    const prompt  = getWeeklyPrompt();

    let html = `
      <div class="daily-tip-section">
        <p class="daily-tip-label">${I18n.t('tip_of_day_title')}</p>
        <p class="daily-tip-text">${tip.text}</p>
      </div>
    `;

    if(insight){
      html += `
        <div class="daily-tip-section insight">
          <p class="daily-tip-label">${I18n.t('pattern_insight_title')}</p>
          <p class="daily-tip-text">${insight}</p>
        </div>
      `;
    }

    if(prompt){
      html += `
        <div class="daily-tip-section prompt">
          <p class="daily-tip-label">${I18n.t('weekly_prompt_title')}</p>
          <p class="daily-tip-text">${prompt}</p>
        </div>
      `;
    }

    container.innerHTML = html;
  }

  function avg(arr){ return arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : 0; }

  return { render, getTodaysTip, getPersonalisedInsight };
})();
