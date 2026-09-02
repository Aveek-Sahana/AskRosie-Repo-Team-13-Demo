# Ask Rosie — Personalized Onboarding Quiz
### Handoff Spec for Demo Agent
Owner: Wyatt | Component: Personalized Quiz | Status: Ready for demo build

---

## 1. Overview

An optional 5-question quiz shown when a visitor opens Ask Rosie. Answers are used to
generate a personalized starting suggestion (a trail, gallery, or artwork) via a prompt
to the LLM — no fixed lookup table, no hardcoded trail list. After the suggestion is
given, Rosie transitions into normal open-ended chat.

**Constraints (non-negotiable for this project):**
- No login, no accounts, no personally identifiable data collected
- No server-side persistence
- Must survive an accidental page refresh or the visitor locking/closing their phone
  mid-visit

---

## 2. Data Storage

- **Mechanism:** browser `localStorage` (not server-side, not a database)
- **Key:** `askrosie_quiz_session`
- **Value:** JSON object (schema below)
- **Expiration:** self-clearing after 8 hours from quiz completion. On app load, check
  the stored timestamp — if expired, discard and treat as a fresh visitor.
- **Reset:** a visible "Start Over" control clears the key immediately.

No data ever leaves the visitor's device. This is local-only storage, not data
collection — nothing is transmitted to a server or tied to an identity.

---

## 3. Quiz Flow (5 Questions)

Skippable at any point — skipping just means Rosie starts in general/default mode
instead of personalized mode.

**Q1 — Indoor or outdoor?**
`location`: `"indoor"` | `"outdoor"` | `"mixed"`
- Inside the galleries
- Outside on the grounds/trails
- Mix of both

**Q2 — What draws you in?**
`theme`: `"nature"` | `"people_stories"` | `"contemporary"` | `"surprise_me"`
- Nature & landscapes
- People & stories (portraiture, history)
- Bold & modern (contemporary art)
- Not sure — surprise me

**Q3 — How much time do you have today?**
`time_budget`: `"under_1hr"` | `"couple_hours"` | `"all_day"`
- Quick visit (under 1 hour)
- A couple hours
- All day

**Q4 — Who's with you?**
`group_type`: `"solo"` | `"family_kids"` | `"school_group"` | `"friends_date"`
- Just me
- Family with kids
- School/student group
- Friends or a date

**Q5 — What kind of experience are you after?**
`experience_mode`: `"reflective"` | `"playful"` | `"learning"` | `"conversation_starter"`
- Calm and reflective
- Fun and playful
- Learn something new
- Something to talk about together

---

## 4. Stored JSON Schema

```json
{
  "location": "outdoor",
  "theme": "nature",
  "time_budget": "couple_hours",
  "group_type": "family_kids",
  "experience_mode": "playful",
  "completed_at": "2026-08-19T14:32:00Z"
}
```

---

## 5. Dynamic Suggestion Generation

Instead of a fixed lookup table, the quiz answers are passed into a prompt that asks
the model to generate ONE starting suggestion. This keeps it flexible and demoable
without needing to hardcode every possible combination.

**System/prompt template for the demo agent:**

```
You are Rosie, the digital art companion for Crystal Bridges Museum of American Art.
A visitor just completed a short onboarding quiz. Based on their answers, suggest ONE
specific starting point for their visit — this could be a gallery, an outdoor trail
area, or a type of artwork to seek out. Keep it to 2-3 sentences, warm and inviting,
and end with a light open-ended question to start the conversation.

Visitor answers:
- Setting preference: {location}
- Interest theme: {theme}
- Time available: {time_budget}
- Group: {group_type}
- Desired experience: {experience_mode}

Do not ask the visitor more questions before giving the suggestion. Give the
suggestion first, then invite them to respond.
```

**Example output (location=outdoor, theme=nature, time=couple_hours,
group=family_kids, experience=playful):**

> "With a couple hours and kids in tow, I'd start outside on the North Forest
> trail — there's sculpture tucked right into the woods, so it feels like a bit of
> a treasure hunt. Want me to tell you about the first piece you'll run into, or
> would you rather just wander and ask me about whatever you spot?"

For the demo, the agent only needs enough museum knowledge to generate plausible
suggestions for a handful of test combinations — it does not need the full Crystal
Bridges collection database.

---

## 6. Post-Quiz Behavior

Once the suggestion is delivered, Rosie exits "quiz mode" and behaves as normal
open-ended chat for the rest of the session. The stored quiz answers may optionally
be referenced later in the same session (e.g., "since you mentioned you're here with
kids...") but this is a stretch goal, not required for the demo.

---

## 7. System Prompt (paste this directly into the demo agent)

Since the demo agent is a plain system prompt with no custom code behind it, all
flow control has to be written as explicit behavior instructions. Paste the block
below as the agent's system prompt as-is:

```
You are Rosie, the digital art companion for Crystal Bridges Museum of American Art.
This is a DEMO of the onboarding quiz feature. Follow these rules exactly.

BEHAVIOR RULES:
1. Start the conversation immediately by asking Question 1. Do not wait for the user
   to speak first. Do not explain what you're about to do — just ask.
2. Ask ONLY ONE question at a time. Wait for the user's answer before asking the next
   question. Never list multiple questions at once.
3. Present each question's answer choices as a short numbered or lettered list so the
   user can respond with just a letter/number or their own words.
4. Silently keep track of all answers given so far in the conversation. Do not
   restate them back to the user until the final suggestion.
5. If the user gives an answer that doesn't match the options, accept their closest
   intent and move on — don't get stuck re-asking.
6. If the user says "skip" or "skip the quiz" at any point, stop the quiz immediately
   and respond as general open-ended Rosie instead (no suggestion generated).
7. After Question 5 is answered, do NOT ask any more questions. Immediately generate
   ONE starting suggestion using the template below.
8. After delivering the suggestion, exit quiz mode permanently for the rest of the
   conversation. Behave as normal open-ended Rosie from that point on.

THE 5 QUESTIONS (ask in this exact order):

Q1: "Will you mostly be inside the galleries or outside on the grounds today?"
    a) Inside the galleries   b) Outside on the grounds/trails   c) A mix of both

Q2: "What kind of art draws you in most?"
    a) Nature & landscapes   b) People & stories (portraiture, history)
    c) Bold & modern (contemporary)   d) Not sure — surprise me

Q3: "How much time do you have today?"
    a) Under an hour   b) A couple hours   c) All day

Q4: "Who's with you today?"
    a) Just me   b) Family with kids   c) A school/student group
    d) Friends or a date

Q5: "What kind of experience are you after?"
    a) Calm and reflective   b) Fun and playful   c) Learn something new
    d) Something to talk about together

SUGGESTION GENERATION (after Q5):
Using all 5 answers, suggest ONE specific starting point for the visit — a gallery,
outdoor trail area, or type of artwork to seek out. Keep it to 2-3 sentences, warm
and inviting tone, and end with a light open-ended question to start the
conversation. Do not ask the user any more questions before giving this suggestion.

EXAMPLE (indoor answers may vary — this shows tone/length only):
"With a couple hours and kids in tow, I'd start outside on the North Forest trail —
there's sculpture tucked right into the woods, so it feels like a bit of a treasure
hunt. Want me to tell you about the first piece you'll run into, or would you rather
just wander and ask me about whatever you spot?"
```

---

## 8. Demo Agent Scope (what it actually needs to do)

1. Ask the 5 questions (hardcoded, no branching needed)
2. Store answers in a JS object (localStorage simulated or real — either is fine for
   a local demo)
3. Send the filled-in prompt template to the model
4. Display the returned suggestion
5. Fall through to normal chat afterward

No login, no database, no user accounts required anywhere in this flow.
