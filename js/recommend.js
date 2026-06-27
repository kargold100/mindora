/* ====================================================
   MINDORA — recommend.js
   A small, transparent RULE-BASED engine. Nothing here is a
   diagnosis — every suggestion maps to a visible threshold, and
   the most serious tiers always route to real human help.

   Three tiers, in order of severity:
   1. crisis      — explicit crisis language detected -> top banner
   2. escalation  — a sharp mood drop or sustained very-low average,
                    without explicit crisis wording -> in-card nudge
                    with helpline buttons, still very visible
   3. routine     — everyday nudges (low day, high stress, low
                    sleep, missed movement/mindfulness, good days)
   ==================================================== */

const Recommend = (function(){

  // Deliberately short, common-language phrases for a basic safety
  // net — not exhaustive, not a clinical screen. False positives
  // are fine; missing something matters more than an unnecessary
  // banner. Covers a few languages since a journal entry might be
  // written in a different language than the current UI language.
  // This is a starting point only — please have it reviewed by a
  // fluent/native speaker per language before relying on it.
  const CRISIS_PHRASES = [
    // English
    'suicide','suicidal','kill myself','end my life','end it all',
    'want to die','better off dead','no reason to live','self-harm','self harm','hurting myself','can\'t go on',
    // Hindi
    'आत्महत्या','मरना चाहता','मरना चाहती','खुद को नुकसान','जीने की वजह नहीं',
    // Spanish
    'suicidio','quiero morir','no quiero vivir','hacerme daño',
    // French
    'suicide','je veux mourir','me faire du mal','plus envie de vivre',
    // German
    'selbstmord','ich will sterben','mir etwas antun','keinen grund mehr',
    // Chinese
    '自杀','想死','活不下去','伤害自己',
    // Arabic
    'انتحار','أريد أن أموت','أؤذي نفسي','لا أريد أن أعيش',
    // Japanese
    '自殺','死にたい','自分を傷つけ','生きる意味がない'
  ];

  function containsCrisisLanguage(text){
    if(!text) return false;
    const lower = text.toLowerCase();
    return CRISIS_PHRASES.some(phrase => lower.includes(phrase.toLowerCase()));
  }

  function average(nums){
    if(!nums.length) return null;
    return nums.reduce((a,b)=>a+b,0) / nums.length;
  }

  /**
   * Builds the full picture: crisis flag, escalation flag, and a
   * list of plain-language recommendations, each stating (in the
   * code, not just the UI) exactly what triggered it.
   */
  function evaluate(){
    const today = Storage.getTodayEntry();
    const last7 = Storage.getMoodEntriesInRange(7);
    const last3 = last7.slice(-3);
    const recentLogs = Storage.getLogsInRange(3);

    const result = { crisis: false, escalation: false, recommendations: [] };

    // ---- Tier 1: crisis language anywhere in last 3 days of journals ----
    const recentJournals = last3.map(e => e.journal).filter(Boolean);
    const todayJournal = today ? today.journal : '';
    if(containsCrisisLanguage(todayJournal) || recentJournals.some(containsCrisisLanguage)){
      result.crisis = true;
    }

    if(!today){
      return result; // nothing else to suggest until they've checked in
    }

    // ---- Tier 2a: sharp single-day drop vs recent average ----
    if(last7.length >= 4){
      const priorEntries = last7.slice(0, -1);
      const priorAvg = average(priorEntries.map(e => e.mood));
      if(priorAvg !== null && (priorAvg - today.mood) >= 4){
        result.escalation = true;
        result.recommendations.push({ urgent:true, text: I18n.t('rec_sharp_drop') });
      }
    }

    // ---- Tier 2b: two consecutive very low days ----
    if(last3.length >= 2){
      const lastTwo = last3.slice(-2);
      if(lastTwo.every(e => e.mood <= 2)){
        result.escalation = true;
        result.recommendations.push({ urgent:true, text: I18n.t('rec_two_very_low') });
      }
    }

    // ---- Tier 2c: sustained low mood (3+ days, avg <= 3.5) ----
    if(last3.length >= 3){
      const avg3 = average(last3.map(e=>e.mood));
      if(avg3 !== null && avg3 <= 3.5){
        result.escalation = true;
        result.recommendations.push({
          urgent:true,
          text: I18n.t('rec_sustained_low', { n: last3.length, avg: avg3.toFixed(1), phone: '1300 22 4636' })
        });
      }
    }

    // ---- Tier 2d: sustained low enjoyment (3+ days with data, avg <= 3.5) ----
    const enjoymentEntries = last3.filter(e => e.enjoyment !== null && e.enjoyment !== undefined);
    if(enjoymentEntries.length >= 3){
      const avgEnjoyment = average(enjoymentEntries.map(e => e.enjoyment));
      if(avgEnjoyment !== null && avgEnjoyment <= 3.5){
        result.escalation = true;
        result.recommendations.push({ urgent:true, text: I18n.t('rec_sustained_low_enjoyment') });
      }
    }

    // ---- Tier 3: routine nudges (only when no escalation message already covers today) ----
    if(!result.escalation){
      if(today.mood <= 4){
        result.recommendations.push({ text: I18n.t('rec_low_today', { mood: today.mood }) });
      }
      if(today.mood >= 8 && result.recommendations.length === 0){
        result.recommendations.push({ positive:true, text: I18n.t('rec_good_day', { mood: today.mood }) });
      }
    }

    if(today.stressLevel >= 8){
      result.recommendations.push({ text: I18n.t('rec_high_stress', { stress: today.stressLevel }) });
    }

    if(today.sleepHours !== null && today.sleepHours !== undefined && today.sleepHours < 6){
      result.recommendations.push({ text: I18n.t('rec_low_sleep', { hours: today.sleepHours }) });
    }

    const hasPhysical = recentLogs.some(l => l.category === 'physical');
    if(!hasPhysical){
      result.recommendations.push({ text: I18n.t('rec_no_movement') });
    }

    const hasMind = recentLogs.some(l => l.category === 'mind');
    if(!hasMind){
      result.recommendations.push({ text: I18n.t('rec_no_mind') });
    }

    if(today.energy !== null && today.energy !== undefined && today.energy <= 3){
      result.recommendations.push({ text: I18n.t('rec_low_energy') });
    }

    if(today.connection !== null && today.connection !== undefined && today.connection <= 3){
      result.recommendations.push({ text: I18n.t('rec_low_connection') });
    }

    return result;
  }

  return { evaluate, containsCrisisLanguage };
})();
