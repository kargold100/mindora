/* ====================================================
   MINDORA — resources.js
   Mental health crisis lines, organisations, and online
   support resources. Covers Australia and international.
   Data is hardcoded (no API needed) and kept current
   as of the last app update.
   ==================================================== */

const Resources = (function(){

  const DATA = {
    crisis: [
      { name:'Lifeline', country:'AU', phone:'13 11 14', hours:'24/7', desc:'Crisis support and suicide prevention', link:'https://www.lifeline.org.au', call:true },
      { name:'Beyond Blue', country:'AU', phone:'1300 22 4636', hours:'24/7', desc:'Anxiety, depression and suicide prevention', link:'https://www.beyondblue.org.au', call:true },
      { name:'Suicide Call Back Service', country:'AU', phone:'1300 659 467', hours:'24/7', desc:'Professional telephone and online counselling', link:'https://www.suicidecallbackservice.org.au', call:true },
      { name:'Kids Helpline', country:'AU', phone:'1800 55 1800', hours:'24/7', desc:'For people aged 5–25', link:'https://kidshelpline.com.au', call:true },
      { name:'MensLine Australia', country:'AU', phone:'1300 78 99 78', hours:'24/7', desc:'For men dealing with emotional issues', link:'https://mensline.org.au', call:true },
      { name:'1800RESPECT', country:'AU', phone:'1800 737 732', hours:'24/7', desc:'National domestic, family and sexual violence counselling', link:'https://www.1800respect.org.au', call:true },
      { name:'Emergency Services', country:'AU', phone:'000', hours:'24/7', desc:'Immediate danger — police, fire, ambulance', call:true, urgent:true },
    ],
    international: [
      { name:'International Association for Suicide Prevention', country:'Global', link:'https://www.iasp.info/resources/Crisis_Centres/', desc:'Crisis centre directory by country' },
      { name:'Crisis Text Line', country:'US/UK/CA/IE', phone:'Text HOME to 741741', desc:'Free text-based crisis support', link:'https://www.crisistextline.org' },
      { name:'Samaritans', country:'UK/IE', phone:'116 123', hours:'24/7', desc:'Emotional support for anyone in distress', link:'https://www.samaritans.org', call:true },
      { name:'NAMI Helpline', country:'US', phone:'1-800-950-6264', hours:'Mon–Fri', desc:'National Alliance on Mental Illness', link:'https://www.nami.org', call:true },
      { name:'iCall', country:'India', phone:'+91 9152987821', hours:'Mon–Sat', desc:'Psychosocial helpline', link:'https://icallhelpline.org', call:true },
    ],
    orgs: [
      { name:'Beyond Blue', country:'AU', desc:'Australia\'s most widely accessed mental health service. Articles, forums, advice.', link:'https://www.beyondblue.org.au' },
      { name:'Black Dog Institute', country:'AU', desc:'Research and resources on depression and bipolar disorder.', link:'https://www.blackdoginstitute.org.au' },
      { name:'SANE Australia', country:'AU', desc:'Support for people affected by complex mental health issues.', link:'https://www.sane.org' },
      { name:'Headspace', country:'AU', desc:'Mental health support for young people aged 12–25.', link:'https://www.headspace.org.au' },
      { name:'ReachOut', country:'AU', desc:'Online mental health service for young people and parents.', link:'https://au.reachout.com' },
      { name:'Mental Health First Aid Australia', country:'AU', desc:'Training and courses in mental health first aid.', link:'https://mhfa.com.au' },
      { name:'World Health Organisation — Mental Health', country:'Global', desc:'Global mental health resources and guidance.', link:'https://www.who.int/health-topics/mental-health' },
    ],
    online: [
      { name:'MindSpot', country:'AU', desc:'Free online assessment and treatment for anxiety and depression.', link:'https://mindspot.org.au' },
      { name:'This Way Up', country:'AU', desc:'Evidence-based online programs for anxiety and depression.', link:'https://thiswayup.org.au' },
      { name:'e-couch', country:'AU', desc:'Self-help programs for depression, anxiety, and loss.', link:'https://ecouch.com.au' },
      { name:'Open Arms', country:'AU', desc:'Support for veterans and their families.', link:'https://www.openarms.gov.au' },
      { name:'Psychology Today — Find a Therapist', country:'Global', desc:'International directory of therapists and counsellors.', link:'https://www.psychologytoday.com/intl/find-a-therapist' },
      { name:'APS Find a Psychologist', country:'AU', desc:'Australian Psychological Society therapist finder.', link:'https://www.psychology.org.au/Find-a-Psychologist' },
    ]
  };

  function render(){
    const container = document.getElementById('resourcesContent');
    if(!container) return;

    const esc = s => { const d=document.createElement('div'); d.textContent=s; return d.innerHTML; };

    const crisisHtml = DATA.crisis.map(r => `
      <div class="resource-card ${r.urgent ? 'urgent' : ''}">
        <div class="resource-card-head">
          <span class="resource-name">${esc(r.name)}</span>
          ${r.country ? `<span class="resource-country">${esc(r.country)}</span>` : ''}
        </div>
        ${r.desc ? `<p class="resource-desc">${esc(r.desc)}</p>` : ''}
        ${r.hours ? `<p class="resource-hours">${esc(r.hours)}</p>` : ''}
        <div class="resource-actions">
          ${r.phone && r.call ? `<a href="tel:${r.phone.replace(/[^0-9+]/g,'')}" class="resource-btn call-btn"><span>${I18n.t('resources_call_label')}</span> ${esc(r.phone)}</a>` : ''}
          ${r.phone && !r.call ? `<span class="resource-phone">${esc(r.phone)}</span>` : ''}
          ${r.link ? `<a href="${r.link}" target="_blank" rel="noopener" class="resource-btn link-btn">${I18n.t('resources_visit_label')}</a>` : ''}
        </div>
      </div>
    `).join('');

    const makeSection = (items, titleKey) => `
      <div class="resource-section">
        <h3 class="resource-section-title">${I18n.t(titleKey)}</h3>
        ${items.map(r => `
          <div class="resource-card">
            <div class="resource-card-head">
              <span class="resource-name">${esc(r.name)}</span>
              ${r.country ? `<span class="resource-country">${esc(r.country)}</span>` : ''}
            </div>
            ${r.desc ? `<p class="resource-desc">${esc(r.desc)}</p>` : ''}
            ${r.hours ? `<p class="resource-hours">⏰ ${esc(r.hours)}</p>` : ''}
            <div class="resource-actions">
              ${r.phone && r.call ? `<a href="tel:${r.phone.replace(/[^0-9+]/g,'')}" class="resource-btn call-btn">${I18n.t('resources_call_label')}: ${esc(r.phone)}</a>` : ''}
              ${r.phone && !r.call ? `<span class="resource-phone">${esc(r.phone)}</span>` : ''}
              ${r.link ? `<a href="${r.link}" target="_blank" rel="noopener" class="resource-btn link-btn">${I18n.t('resources_visit_label')}</a>` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    `;

    container.innerHTML = `
      <div class="resource-disclaimer-banner">
        <p>${I18n.t('resources_disclaimer')}</p>
      </div>

      <div class="resource-section crisis-section">
        <h3 class="resource-section-title crisis-title">${I18n.t('resources_crisis_title')}</h3>
        ${crisisHtml}
      </div>

      ${makeSection(DATA.orgs, 'resources_orgs_title')}
      ${makeSection(DATA.online, 'resources_online_title')}
      ${makeSection(DATA.international, 'resources_global_title')}
    `;
  }

  return { render };
})();
