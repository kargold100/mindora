/* ====================================================
   MINDORA — quotes.js
   Daily rotating inspirational quotes and affirmations.
   Two separate pools — one for quotes (with attribution),
   one for affirmations (first-person, present tense).
   Both rotate deterministically by date.
   ==================================================== */

const Quotes = (function(){

  const QUOTES = [
    { text:"You don't have to be positive all the time. It's perfectly okay to feel sad, angry, annoyed, frustrated, scared, or anxious. Having feelings doesn't make you a negative person. It makes you human.", author:"Lori Deschene" },
    { text:"Mental health is not a destination, but a process. It's about how you drive, not where you're going.", author:"Noam Shpancer" },
    { text:"You are allowed to be both a masterpiece and a work in progress simultaneously.", author:"Sophia Bush" },
    { text:"Self-care is not self-indulgence; it is self-preservation.", author:"Audre Lorde" },
    { text:"Be gentle with yourself. You are a child of the universe, no less than the trees and the stars.", author:"Max Ehrmann" },
    { text:"The greatest glory in living lies not in never falling, but in rising every time we fall.", author:"Nelson Mandela" },
    { text:"You are enough just as you are.", author:"Meghan Markle" },
    { text:"In the middle of difficulty lies opportunity.", author:"Albert Einstein" },
    { text:"What lies behind us and what lies before us are tiny matters compared to what lies within us.", author:"Ralph Waldo Emerson" },
    { text:"The only journey is the one within.", author:"Rainer Maria Rilke" },
    { text:"Almost everything will work again if you unplug it for a few minutes — including you.", author:"Anne Lamott" },
    { text:"Talk to yourself like you would to someone you love.", author:"Brené Brown" },
    { text:"Every small step forward is progress worth celebrating.", author:"Unknown" },
    { text:"You can't go back and change the beginning, but you can start where you are and change the ending.", author:"C. S. Lewis" },
    { text:"It's okay to not have it all figured out. You're a work in progress, and that's a beautiful thing.", author:"Unknown" },
    { text:"Rest is not laziness; it is wisdom.", author:"Unknown" },
    { text:"Rock bottom became the solid foundation on which I rebuilt my life.", author:"J.K. Rowling" },
    { text:"Healing is not linear.", author:"Unknown" },
    { text:"You are not your illness. You have an individual story to tell.", author:"Julian Seifter" },
    { text:"The first step toward change is awareness. The second step is acceptance.", author:"Nathaniel Branden" },
    { text:"Happiness is not something ready-made. It comes from your own actions.", author:"Dalai Lama" },
    { text:"To love oneself is the beginning of a lifelong romance.", author:"Oscar Wilde" },
    { text:"Strong people don't put others down. They lift them up.", author:"Micheal P. Watson" },
    { text:"Hope is being able to see that there is light despite all of the darkness.", author:"Desmond Tutu" },
    { text:"You are the hero of your own story.", author:"Mary McCarthy" },
    { text:"Progress, not perfection.", author:"Unknown" },
    { text:"Start where you are. Use what you have. Do what you can.", author:"Arthur Ashe" },
    { text:"Your current situation is not your final destination.", author:"Unknown" },
    { text:"The bravest thing I ever did was continuing my life when I wanted to die.", author:"Juliette Lewis" },
    { text:"We are all broken. That is how the light gets in.", author:"Ernest Hemingway" },
    { text:"You are worthy of taking up space.", author:"Unknown" },
    { text:"Sometimes the most important thing in a whole day is the rest we take between two deep breaths.", author:"Etty Hillesum" },
    { text:"Asking for help is a sign of strength, not weakness.", author:"Unknown" },
    { text:"Your story isn't over yet.", author:"Unknown" },
    { text:"It's okay to have a bad day. Tomorrow is a new chance.", author:"Unknown" },
    { text:"The most common form of despair is not being who you are.", author:"Søren Kierkegaard" },
    { text:"There is hope, even when your brain tells you there isn't.", author:"John Green" },
    { text:"Don't let the perfect be the enemy of the good.", author:"Voltaire" },
    { text:"Be the change you wish to see in the world.", author:"Mahatma Gandhi" },
    { text:"You have been assigned this mountain to show others it can be moved.", author:"Unknown" },
    { text:"Believe you can and you're halfway there.", author:"Theodore Roosevelt" },
    { text:"Not all storms come to disrupt your life. Some come to clear your path.", author:"Unknown" },
    { text:"The wound is the place where the light enters you.", author:"Rumi" },
    { text:"What you think, you become. What you feel, you attract. What you imagine, you create.", author:"Buddha" },
    { text:"You have survived 100% of your worst days so far.", author:"Unknown" },
    { text:"Breathe. You're going to be okay. Breathe and remember that you've been in this place before.", author:"Daniell Koepke" },
    { text:"Every day may not be good, but there is something good in every day.", author:"Alice Morse Earle" },
    { text:"A little progress each day adds up to big results.", author:"Satya Nani" },
    { text:"You are not alone in this.", author:"Unknown" },
    { text:"One day or day one. You decide.", author:"Unknown" },
    { text:"The greatest weapon against stress is our ability to choose one thought over another.", author:"William James" },
    { text:"You don't have to control your thoughts. You just have to stop letting them control you.", author:"Dan Millman" },
    { text:"In the middle of every difficulty lies opportunity.", author:"Albert Einstein" },
    { text:"Healing takes time, and asking for help is a courageous step.", author:"Mariska Hargitay" },
    { text:"Vulnerability is the birthplace of innovation, creativity, and change.", author:"Brené Brown" },
    { text:"The most powerful relationship you will ever have is the relationship with yourself.", author:"Steve Maraboli" },
  ];

  const AFFIRMATIONS = [
    "I am enough, just as I am today.",
    "I choose to treat myself with kindness and compassion.",
    "My feelings are valid and I am allowed to feel them.",
    "I am capable of handling whatever comes my way.",
    "I deserve care, rest, and peace.",
    "Small steps forward are still steps forward.",
    "I am not defined by my hardest moments.",
    "Today I will do my best, and that is enough.",
    "I am worthy of love and belonging.",
    "I give myself permission to rest without guilt.",
    "I am growing stronger with each challenge I face.",
    "I choose to focus on what I can control.",
    "I am resilient. I have overcome hard things before.",
    "My mental health matters and I will tend to it gently.",
    "I release what I cannot change and focus on right now.",
    "I am allowed to say no to things that drain me.",
    "I am proud of how far I have come.",
    "I notice my thoughts without being controlled by them.",
    "Today I will be gentle with myself.",
    "I am surrounded by people who care about me, even when it doesn't feel that way.",
    "My body is doing its best, and I appreciate it.",
    "I am learning and growing every single day.",
    "I breathe deeply and find calm within myself.",
    "I trust the process, even when I can't see the whole picture.",
    "I welcome this day with an open heart.",
    "My struggles do not make me weak — they make me human.",
    "I choose peace over perfection today.",
    "I have everything I need within me to get through this day.",
    "I release yesterday and welcome the fresh start of today.",
    "I am allowed to take up space and have needs.",
    "My feelings are messengers, not enemies.",
    "I am more than my anxiety, my sadness, my worries.",
    "I deserve joy and I am open to receiving it.",
    "I am building a life I am proud of, one day at a time.",
    "I honour my limits and ask for help when I need it.",
    "My value does not depend on my productivity.",
    "I am safe in this moment.",
    "I trust myself to make good decisions for my wellbeing.",
    "I am allowed to change my mind and try again.",
    "Every breath I take restores my sense of calm.",
    "I am grateful for the small things that bring me comfort.",
    "I choose compassion over criticism when I look at myself.",
    "The present moment is where my peace lives.",
    "I have the strength to face today's challenges.",
    "I celebrate the small wins — they all count.",
    "I am deserving of the energy I give to others.",
    "Today I will notice one thing that brings me joy.",
    "I am learning to sit with uncertainty without fear.",
    "My story is still being written. I have not reached the end.",
    "I am a work in progress, and that is a wonderful thing.",
    "I forgive myself for the things I did when I was struggling.",
    "Today I will nourish my mind, body, and spirit.",
    "I am not alone — help is always available to me.",
    "My best is good enough for today.",
    "I am allowed to feel hopeful about the future.",
  ];

  const JOURNAL_PROMPTS = [
    "What made you smile today, even briefly?",
    "What challenged you today, and how did you handle it?",
    "How are you honestly feeling right now — not how you think you should feel?",
    "What are you avoiding, and what might happen if you stopped avoiding it?",
    "What are you most proud of this week, however small?",
    "What do you need right now that you're not giving yourself?",
    "Who or what has supported you lately? How can you acknowledge them?",
    "Describe a moment in the past week when you felt at peace.",
    "What would you tell a good friend who was going through what you're going through?",
    "What thoughts keep returning to you? Are they helpful or just familiar?",
    "What are you grateful for today that you might usually overlook?",
    "What would making your own wellbeing a priority look like this week?",
    "If your body could speak right now, what would it say?",
    "What is one small thing you could do tomorrow that would feel kind to yourself?",
    "Describe one thing you're looking forward to, however small.",
    "What drains your energy? What restores it?",
    "What have you learned about yourself this month?",
    "What does 'enough' mean to you in this season of life?",
    "Is there something you need to forgive yourself for?",
    "What does rest look like for you? When did you last truly rest?",
  ];

  function getTodaysQuote(){
    const d = parseInt(Storage.todayStr().replace(/-/g,''), 10);
    return QUOTES[d % QUOTES.length];
  }

  function getTodaysAffirmation(){
    const d = parseInt(Storage.todayStr().replace(/-/g,''), 10);
    return AFFIRMATIONS[(d + 7) % AFFIRMATIONS.length]; // +7 so it differs from quote rotation
  }

  function getTodaysPrompt(){
    const d = parseInt(Storage.todayStr().replace(/-/g,''), 10);
    return JOURNAL_PROMPTS[(d + 3) % JOURNAL_PROMPTS.length];
  }

  function renderTodayCards(){
    // Quote card
    const qCard = document.getElementById('quoteCard');
    if(qCard){
      const q = getTodaysQuote();
      qCard.innerHTML = `
        <p class="quote-label">${I18n.t('quote_of_day_title')}</p>
        <p class="quote-text">"${q.text}"</p>
        ${q.author ? `<p class="quote-author">— ${q.author}</p>` : ''}
      `;
    }

    // Affirmation card
    const aCard = document.getElementById('affirmationCard');
    if(aCard){
      aCard.innerHTML = `
        <p class="quote-label">${I18n.t('affirmation_of_day_title')}</p>
        <p class="affirmation-text">${getTodaysAffirmation()}</p>
      `;
    }
  }

  function getTodaysPromptText(){ return getTodaysPrompt(); }

  return { renderTodayCards, getTodaysPromptText, QUOTES, AFFIRMATIONS, JOURNAL_PROMPTS };
})();
