---
name: "Ralph Loop"
description: "Ralph Wiggum loop - repeats task with AGGRESSIVE fresh reasoning until N consecutive 'nothing to do'. Trigger: /ralph"
alwaysApply: true
---

# Ralph Loop Protocol

When the user prompt contains `/ralph`, you MUST follow this STRICT protocol:

## Configuration Defaults
- LOOP_THRESHOLD = 6 (consecutive idle responses to stop)
- MAX_ITERATIONS = 20 (safety cap)

## Command Format
```
/ralph [--threshold=N] [--max=M] <task>
```

---

## CRITICAL: ITERATIVE IMPROVEMENT, NOT DUPLICATION

**Each iteration builds on the PREVIOUS iteration's work.**

- If iteration 1 creates a file → iteration 2 IMPROVES that file, does NOT create a new one
- If iteration 1 splits a file into two → iteration 2 works on those two files
- The goal is to REFINE and IMPROVE existing work, not duplicate it
- You are polishing the SAME output, not generating 20 parallel versions

**WRONG**: Creating `spec-v1.md`, `spec-v2.md`, `spec-v3.md`...
**RIGHT**: Improving `spec.md` across iterations

**BUT**: Still do AGGRESSIVE evaluation on those files! Look for:
- Missing sections to ADD to the existing file
- Gaps to FILL in the existing content
- Errors to FIX in what was written
- Details to EXPAND in the current document

Iterative ≠ passive. Each pass should aggressively hunt for improvements IN the existing work.

---

## CRITICAL: "NOTHING TO DO" IS RARE

**"Nothing to do" should be EXTREMELY RARE.** 

You MUST assume there IS more work to do. Your job each iteration is to ACTIVELY HUNT for:
- Gaps in the work
- Missing information
- Improvements possible
- Edge cases not covered
- Quality issues
- Incomplete sections
- Things that could be better explained
- Missing examples
- Inconsistencies

**DEFAULT ASSUMPTION: There is ALWAYS more work to find.**

Only declare "nothing to do" when you have EXHAUSTIVELY searched and found ZERO improvements.

---

## MANDATORY: Devil's Advocate Check

Before EVER saying "nothing to do", you MUST:

1. **ASK YOURSELF**: "If I were a fresh AI seeing this for the first time, what would I improve?"
2. **ASK YOURSELF**: "If this were a code review, what feedback would I give?"
3. **ASK YOURSELF**: "What would a perfectionist find wrong with this?"
4. **ASK YOURSELF**: "What questions would a user have after reading this?"
5. **SEARCH ACTIVELY** for gaps using tools (web_search, grep, read_file)

If ANY of these questions yield improvements → DO THE WORK, not "nothing to do"

---

## MANDATORY: Fresh Eyes Test (CRITICAL)

**WARNING: You have context bias. You remember what you did, so you think it's complete. A fresh chat would disagree.**

Before saying "nothing to do", FORCE yourself to:

1. **FORGET** what you did in previous iterations - pretend you never saw this task
2. **RE-READ** the output file(s) as if someone else wrote them
3. **CRITIQUE** the work as if reviewing a junior's output
4. **LIST 3 THINGS** that could be improved (if you can't, try harder)
5. **WEB SEARCH** for additional information you might have missed
6. **COMPARE** to industry standards or best practices

**If a fresh chat found more work, YOU SHOULD TOO.**

Your memory is your enemy here. Fight it. Assume you missed something.

---

## Execution Loop

```
iteration = 0
consecutive_idle = 0

LOOP:
    iteration++
    
    OUTPUT: "[Ralph #iteration] 🔄 Starting AGGRESSIVE evaluation..."
    
    === AGGRESSIVE EVALUATION ===
    1. RE-READ the current state using tools
    2. HUNT for gaps, improvements, missing info
    3. Apply Devil's Advocate checks (see above)
    4. If you find ANYTHING to improve → do it
    5. Only "nothing to do" if exhaustive search found ZERO issues
    === END EVALUATION ===
    
    IF you made ANY changes OR found ANY improvements to make:
        consecutive_idle = 0
        DO THE WORK
        OUTPUT: "[Ralph #iteration] ✓ Improvements made: <summary>. Hunting for more..."
    ELSE IF exhaustive search found genuinely NOTHING:
        consecutive_idle++
        OUTPUT: "[Ralph #iteration] ○ Exhaustive search found nothing. (consecutive_idle/threshold)"
    
    IF consecutive_idle >= threshold:
        OUTPUT: "[Ralph Complete] ✅ Task stabilized after iteration iterations."
        STOP
    
    IF iteration >= max_iterations:
        OUTPUT: "[Ralph Stopped] ⚠️ Max iterations reached."
        STOP
    
    GOTO LOOP
```

---

## WHAT TO HUNT FOR (non-exhaustive)

For documentation/specs:
- Missing sections
- Unclear explanations  
- Missing examples
- Undefined terms
- Edge cases not covered
- Inconsistent terminology
- Missing diagrams/visuals descriptions
- Incomplete requirements
- Ambiguous statements
- Missing acceptance criteria

For code:
- Bugs
- Missing error handling
- Missing logs
- Code style issues
- Missing tests
- Performance issues
- Security issues
- Missing documentation

For any task:
- What would make this 10% better?
- What did I miss?
- What would a senior reviewer flag?

---

## PROOF REQUIRED FOR "NOTHING TO DO"

Before outputting "nothing to do", you MUST have:

1. Used tools to re-read current state (MANDATORY - read the file again!)
2. Performed web searches for additional info (MANDATORY for docs/specs)
3. Applied all 5 Devil's Advocate questions
4. Applied Fresh Eyes Test (pretend you never saw this)
5. Listed 3 potential improvements and explained why each is NOT worth doing
6. Found ZERO actionable improvements after ALL checks

**If you cannot list 3 potential improvements to reject, you haven't looked hard enough.**

Output format when claiming "nothing to do":
```
[Ralph #N] Exhaustive check performed:
- Re-read files: <which files you read again>
- Web searches: <what you searched for>
- Fresh eyes critique: <what a fresh reviewer might say>
- Potential improvements considered and rejected:
  1. <improvement> - rejected because: <reason>
  2. <improvement> - rejected because: <reason>  
  3. <improvement> - rejected because: <reason>
- Conclusion: Genuinely nothing actionable remains
○ Nothing found. (X/threshold)
```

---

## Rules

1. **ASSUME** there is more work - prove otherwise
2. **HUNT** actively, don't passively check
3. **NEVER** say "nothing to do" without exhaustive proof
4. **NEVER** ask user for confirmation between iterations
5. **ALWAYS** use tools to verify state
6. **ALWAYS** apply Devil's Advocate checks
7. **BE PARANOID** - a fresh chat found more work, so can you
