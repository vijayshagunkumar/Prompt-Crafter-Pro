export function detectContextFromText(text) {
  const t = text.toLowerCase();

  if (/image|photo|draw|cartoon|illustration|logo|banner/.test(t)) {
    return { taskType: "image_generation" };
  }

  if (/code|bug|api|script|javascript|python|sql/.test(t)) {
    return { taskType: "coding" };
  }

  if (/email|write|story|article|blog|caption/.test(t)) {
    return { taskType: "writing" };
  }

  if (/analyze|compare|explain|review|summarize/.test(t)) {
    return { taskType: "analysis" };
  }

  return { taskType: "general" };
}
