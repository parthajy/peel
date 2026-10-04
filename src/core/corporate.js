/* Peel – "Remove Corporate Speak". Pure regex. Zero AI. Deeply petty. */
(function () {
  const Peel = (window.Peel = window.Peel || {});
  const FEEL = '(?:humbled|thrilled|excited|delighted|honou?red|proud|grateful|happy|pleased|overjoyed|ecstatic|beyond excited|super excited|incredibly (?:humbled|excited|proud|grateful))';
  const rules = [
    // "I'm humbled and thrilled to announce that I have joined X" → "I have joined X"
    [new RegExp(`\\b(?:I(?:'|’)?a?m|I am|We(?:'|’)re|We are)\\s+(?:so\\s+|truly\\s+|absolutely\\s+|incredibly\\s+)?${FEEL}(?:\\s*(?:,|and|&)\\s*${FEEL})*\\s+to\\s+(?:announce|share|say|let you (?:all )?know)\\s+that\\s+`, 'gi'), ''],
    [new RegExp(`\\b(?:I(?:'|’)?a?m|I am|We(?:'|’)re|We are)\\s+(?:so\\s+|truly\\s+|absolutely\\s+|incredibly\\s+)?${FEEL}(?:\\s*(?:,|and|&)\\s*${FEEL})*\\s+to\\s+(?:announce|share)\\s+`, 'gi'), ''],
    [new RegExp(`(^|[.!?]\\s+)(?:so\\s+|truly\\s+)?${FEEL}(?:\\s*(?:,|and|&)\\s*${FEEL})*\\s+to\\s+(?:announce|share)\\s+(?:that\\s+)?`, 'gi'), '$1'],
    [/\b(?:Big|Exciting|Some personal|Personal) news[:!]?\s*/gi, ''],
    [/\bI have joined\b/gi, 'Joined'], [/\bI(?:'|’)?ve joined\b/gi, 'Joined'],
    [/\bI will be joining\b/gi, 'Joining'], [/\bI(?:'|’)?ll be joining\b/gi, 'Joining'],
    [/\bI(?: have|(?:'|’)?ve) accepted (?:a|an|the) (?:new )?(?:position|role|offer) (?:as|of)\b/gi, 'New job:'],
    [/\bI(?: have|(?:'|’)?ve) accepted (?:a|an|the) (?:new )?(?:position|role|offer) (?:at|with)\b/gi, 'New job at'],
    [/\bI(?:'|’)?m (?:starting|beginning) a new (?:position|role|chapter|journey) as\b/gi, 'New job:'],
    [/\bI(?:'|’)?m (?:starting|beginning) a new (?:position|role) at\b/gi, 'New job at'],
    [/\bthis (?:new )?(?:chapter|journey|adventure)\b/gi, 'this job'],
    [/\bleverag(?:e|es|ed|ing)\b/gi, (m) => ({ leverage: 'use', leverages: 'uses', leveraged: 'used', leveraging: 'using' }[m.toLowerCase()] || 'use')],
    [/\butiliz(?:e|es|ed|ing)\b/gi, (m) => m.toLowerCase().replace('utiliz', 'us').replace('usee', 'use').replace(/^uses$/, 'uses')],
    [/\bsynerg(?:y|ies|ize|istic)\b/gi, 'teamwork'],
    [/\bcircle back\b/gi, 'follow up'], [/\btouch base\b/gi, 'talk'],
    [/\bmove the needle\b/gi, 'matter'], [/\blow[- ]hanging fruit\b/gi, 'easy wins'],
    [/\bgame[- ]?changer\b/gi, 'big deal'], [/\bgame[- ]?changing\b/gi, 'big'],
    [/\bparadigm shift\b/gi, 'change'], [/\bdisrupt(?:ive|ion)?\b/gi, 'change'],
    [/\bthought leader(?:ship)?\b/gi, 'expert'], [/\bbest[- ]in[- ]class\b/gi, 'good'],
    [/\bworld[- ]class\b/gi, 'good'], [/\bcutting[- ]edge\b/gi, 'new'], [/\bstate[- ]of[- ]the[- ]art\b/gi, 'new'],
    [/\bdeep[- ]dive\b/gi, 'look'], [/\bdouble[- ]click on\b/gi, 'look at'],
    [/\bgo(?:ing)? forward\b,?\s*/gi, ''], [/\bat the end of the day\b,?\s*/gi, ''],
    [/\bwith that (?:being )?said\b,?\s*/gi, ''], [/\bneedless to say\b,?\s*/gi, ''],
    [/\bI(?:'|’)?m (?:not )?(?:gonna|going to) lie\b,?\s*/gi, ''],
    [/\bHot take:?\s*/gi, ''], [/\bUnpopular opinion:?\s*/gi, 'Opinion: '],
    [/\bHere(?:'|’)?s (?:what|why|the thing)[^.:\n]*[.:]\s*/gi, ''],
    [/\bLet that sink in\.?/gi, ''], [/\bRead that again\.?/gi, ''],
    [/\b(?:Agree|Thoughts)\?\s*$/gim, ''],
    [/\b10x\b/gi, 'much better'], [/\brockstar|ninja|guru|wizard\b/gi, 'person'],
    [/\bbandwidth\b/gi, 'time'], [/\baction items?\b/gi, 'tasks'], [/\bdeliverables?\b/gi, 'work'],
    [/\bstakeholders?\b/gi, 'people'], [/\becosystem\b/gi, 'market'], [/\bnorth star\b/gi, 'goal'],
    [/\bmission[- ]critical\b/gi, 'important'], [/\bvalue[- ]add(?:ed)?\b/gi, 'useful'],
    [/\bI couldn(?:'|’)?t have done (?:this|it) without\b/gi, 'Thanks to'],
    [/\bA (?:huge|big|special|massive) (?:thank you|thanks|shout[- ]?out) to\b/gi, 'Thanks to'],
    [/\bI(?:'|’)?m (?:so )?(?:grateful|thankful) (?:to|for)\b/gi, 'Thanks to'],
    [/\bStay tuned[^.!\n]*[.!]?/gi, ''],
    [/(?:\s*#[\w\u00C0-\uFFFF]+){2,}\s*$/g, ''],   // trailing hashtag wall
    [/\s{2,}/g, ' '],
    [/([.!?]\s+)([a-z])/g, (m, a, b) => a + b.toUpperCase()],
  ];
  Peel.corporate = {
    strip(text) {
      let out = text;
      for (const [re, rep] of rules) out = out.replace(re, rep);
      out = out.trim();
      // Capitalise the new first letter if we chopped the opener
      return out ? out[0].toUpperCase() + out.slice(1) : out;
    },
  };
})();
