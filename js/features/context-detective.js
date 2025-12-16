// context-detective.js – Role & Preset Classification Logic

export function getRoleAndPreset(text = '') {
  const lower = text.toLowerCase();

  let role = 'expert assistant';
  let preset = 'default';
  let label = 'General';

  if (/email|mail|message|follow[- ]?up/i.test(lower)) {
    role = 'expert email writer';
    preset = 'default';
    label = 'Email';
  } else if (
    /code|program|script|developer|bug|api|python|javascript|sql|java|c#/i.test(lower)
  ) {
    role = 'expert developer';
    preset = 'chatgpt';
    label = 'Code';
  } else if (
    /analyze|analysis|research|report|evaluate|assessment|metrics|market/i.test(lower)
  ) {
    role = 'expert analyst';
    preset = 'detailed';
    label = 'Analysis';
  } else if (
    /blog|article|story|linkedin|content|caption|copywriting/i.test(lower)
  ) {
    role = 'expert content writer';
    preset = 'default';
    label = 'Writing';
  } else if (
    /workout|fitness|exercise|diet|meal plan|training plan/i.test(lower)
  ) {
    role = 'expert fitness trainer';
    preset = 'detailed';
    label = 'Workout';
  } else if (
    /strategy|business plan|roadmap|proposal|pitch|go[- ]?to[- ]?market/i.test(lower)
  ) {
    role = 'expert business consultant';
    preset = 'detailed';
    label = 'Business';
  } else if (
    /teach|explain|tutorial|guide|lesson|training material/i.test(lower)
  ) {
    role = 'expert educator';
    preset = 'detailed';
    label = 'Education';
  }

  return { role, preset, label };
}

/**
 * Optional helper used by UI (kept minimal)
 */
export function detectContextFromText(text = '') {
  const { role, preset, label } = getRoleAndPreset(text);
  return {
    role,
    preset,
    taskType: label
  };
}
