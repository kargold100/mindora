/* ====================================================
   MINDORA — chat.js
   A supportive chat companion, calling the Anthropic API
   directly from the browser (same no-hardcoded-key pattern as
   StudySpark's AI Tutor: the key lives only in this browser's
   localStorage, never synced to a profile or backend).

   Chat history is intentionally NOT persisted — it resets on
   reload. That's a deliberate choice to avoid storing sensitive
   conversational text anywhere, given this app already handles
   mood/journal data carefully.

   Safety is layered: a deterministic phrase check runs on every
   outgoing message (same list used for journal entries) and, if
   triggered, shows real helpline numbers in the thread directly
   — this does not depend on the model's judgement. The system
   prompt also asks the model to route to real help, as a second
   layer, not the only one.
   ==================================================== */

const Chat = (function(){

  const API_KEY_STORAGE = 'mindora_apikey';
  let messages = []; // {role:'user'|'assistant', content:string}
  let sending = false;

  function getApiKey(){
    try{ return localStorage.getItem(API_KEY_STORAGE) || ''; }catch(e){ return ''; }
  }

  function setApiKey(key){
    try{ localStorage.setItem(API_KEY_STORAGE, (key || '').trim()); }catch(e){}
  }

  function hasApiKey(){
    return !!getApiKey();
  }

  function currentLangLabel(){
    const meta = LANG_META.find(l => l.code === I18n.getLang());
    return meta ? meta.label : 'English';
  }

  function buildSystemPrompt(){
    let prompt =
      "You are the supportive companion built into Mindora, a personal wellbeing app. " +
      "Be warm, validating, and conversational, like a thoughtful friend, not a clinician. " +
      "You are not a therapist, doctor, or crisis counsellor, and must never claim to be one. " +
      "Don't diagnose or name a mental health condition the person hasn't already named themselves. " +
      "Reflect and validate what they share without inventing causes or histories they haven't mentioned. " +
      "Keep replies short and conversational, a few sentences, not an essay, unless they ask for more. " +
      "You can gently suggest small, concrete things (a short walk, writing it down, a breathing exercise, " +
      "reaching out to someone) when it fits naturally, but don't lecture or push a checklist. " +
      "If they mention self-harm, suicide, or being in danger, stay calm and warm, and clearly point them to " +
      "immediate help: Lifeline (13 11 14), Beyond Blue (1300 22 4636), Suicide Call Back Service (1300 659 467), " +
      "or 000 in Australia for an emergency. If it sounds like an ongoing struggle rather than a single hard day, " +
      "gently encourage talking to a GP or psychologist rather than relying on this chat alone. " +
      "If they seem to be doing fine, there is no need to bring up crisis resources unprompted. " +
      "Respond in " + currentLangLabel() + ".";

    const settings = Storage.getSettings();
    if(settings.chatIncludeContext){
      const today = Storage.getTodayEntry();
      if(today){
        prompt += " Context from today's check-in, only reference naturally if relevant, don't just repeat it back: mood " +
          today.mood + "/10, stress " + today.stressLevel + "/10" +
          (today.tags && today.tags.length ? ", feeling: " + today.tags.join(', ') : '') + ".";
      }
    }
    return prompt;
  }

  function getMessages(){
    return messages;
  }

  function clearChat(){
    messages = [];
  }

  async function sendMessage(text, callbacks){
    text = (text || '').trim();
    if(!text || sending) return;

    const apiKey = getApiKey();
    if(!apiKey){
      if(callbacks && callbacks.onNeedsApiKey) callbacks.onNeedsApiKey();
      return;
    }

    messages.push({ role: 'user', content: text });
    if(callbacks && callbacks.onUpdate) callbacks.onUpdate();

    if(Recommend.containsCrisisLanguage(text)){
      if(typeof window.MindoraNotifyChatCrisis === 'function') window.MindoraNotifyChatCrisis();
      messages.push({ role: 'safety', content: 'crisis' });
      if(callbacks && callbacks.onUpdate) callbacks.onUpdate();
    }

    sending = true;
    if(callbacks && callbacks.onTyping) callbacks.onTyping(true);

    try{
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 500,
          system: buildSystemPrompt(),
          messages: messages
            .filter(m => m.role === 'user' || m.role === 'assistant')
            .map(m => ({ role: m.role, content: m.content }))
        })
      });
      const data = await res.json();
      if(data && data.error){
        messages.push({ role: 'assistant', content: '(' + (data.error.message || 'error') + ')' });
      } else {
        const replyText = ((data && data.content) || [])
          .filter(b => b.type === 'text')
          .map(b => b.text)
          .join('\n') || '…';
        messages.push({ role: 'assistant', content: replyText });
      }
    }catch(e){
      console.error('Mindora chat error:', e);
      messages.push({ role: 'assistant', content: I18n.t('chat_error') });
    }finally{
      sending = false;
      if(callbacks && callbacks.onTyping) callbacks.onTyping(false);
      if(callbacks && callbacks.onUpdate) callbacks.onUpdate();
    }
  }

  return { getApiKey, setApiKey, hasApiKey, getMessages, clearChat, sendMessage };
})();
