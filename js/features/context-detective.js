// Analyzes text to determine role, preset, and task category
export function analyzeText(text) {
  const lower = (text || "").toLowerCase();
  let role = "expert assistant";
  let preset = "default";
  let label = "General";

  // Email detection
  if (/email|mail|send.*to|message.*to|follow[- ]up/i.test(lower)) {
    role = "expert email writer";
    preset = "default";
    label = "Email";
  } 
  // Code detection
  else if (/code|program|script|develop|software|function|python|javascript|typescript|java|c#|sql|api|bug fix|refactor/i.test(lower)) {
    role = "expert developer";
    preset = "chatgpt";
    label = "Code";
  } 
  // Analysis detection
  else if (/analyze|analysis|market|research|evaluate|assessment|review|trend|report|insight|metrics/i.test(lower)) {
    role = "expert analyst";
    preset = "detailed";
    label = "Analysis";
  } 
  // Writing detection
  else if (/blog|article|story|linkedin post|caption|copywriting|content/i.test(lower)) {
    role = "expert content writer";
    preset = "default";
    label = "Writing";
  } 
  // Fitness detection
  else if (/workout|exercise|fitness|gym|diet|meal plan|training plan/i.test(lower)) {
    role = "expert fitness trainer";
    preset = "detailed";
    label = "Workout";
  } 
  // Business detection
  else if (/strategy|business plan|roadmap|pitch deck|proposal|go[- ]to[- ]market|g2m/i.test(lower)) {
    role = "expert business consultant";
    preset = "detailed";
    label = "Business";
  } 
  // Education detection
  else if (/teach|explain|lesson|tutorial|guide|training material|curriculum/i.test(lower)) {
    role = "expert educator";
    preset = "detailed";
    label = "Education";
  }
  // Creative detection
  else if (/creative|design|logo|brand|marketing|ad|campaign/i.test(lower)) {
    role = "expert creative director";
    preset = "detailed";
    label = "Creative";
  }

  return { role, preset, label };
}
