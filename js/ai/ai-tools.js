// ai-tools.js - AI Tools Management and Dynamic Ordering (UPDATED)
// NOTE: Simplified tool card UI (only tool name + specialty/description)

import { getAppState, setAppState } from '../core/app-state.js';
import { AI_TOOLS } from '../core/constants.js';
import { showNotification, showSuccess, showError } from '../ui/notifications.js';

/**
 * Score a tool for a given task type
 * @param {object} tool
 * @param {string} taskType
 * @returns {number}
 */
function scoreTool(tool, taskType) {
  if (!tool || !taskType) return 0;
  if (Array.isArray(tool.bestFor) && tool.bestFor.includes(taskType)) return 10;
  if (Array.isArray(tool.tags) && tool.tags.includes(taskType)) return 7;
  return 3;
}

/**
 * Build tool card HTML (SIMPLIFIED)
 * @param {object} tool
 * @param {boolean} isConverted
 * @param {boolean} isBestMatch
 * @returns {string}
 */
function createToolCardHTML(tool, isConverted, isBestMatch) {
  const disabledClass = isConverted ? '' : 'disabled';
  const bestMatchClass = isBestMatch ? 'best-match' : '';
  const toolDescription = tool.description || 'Best for general tasks';

  return `
    <div class="ai-tool-card ${disabledClass} ${bestMatchClass}" data-tool="${tool.id}">
      <div class="ai-tool-header">
        <div class="ai-tool-icon" style="background: ${tool.color || 'var(--gradient-primary)'};">
          <i class="${tool.icon}"></i>
        </div>
        <div class="ai-tool-info">
          <h4>${tool.name}</h4>
          <p>${toolDescription}</p>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render AI tools grid
 * @param {string} taskType
 * @param {string} promptText
 * @param {boolean} isConverted
 */
export function renderAITools(taskType, promptText, isConverted) {
  const grid = document.getElementById('aiToolsGrid');
  const hint = document.getElementById('aiToolsHint');
  if (!grid) return;

  // When prompt not generated yet, keep grid empty and show hint
  if (!isConverted) {
    grid.innerHTML = '';
    if (hint) hint.style.display = 'block';
    return;
  }

  if (hint) hint.style.display = 'none';

  const tools = (AI_TOOLS || []).map((t) => {
    const rawScore = scoreTool(t, taskType);
    return {
      ...t,
      rawScore,
      formattedScore: rawScore.toFixed(1),
    };
  });

  tools.sort((a, b) => b.rawScore - a.rawScore);

  const bestTool = tools[0];
  const html = tools.map((tool) => createToolCardHTML(tool, true, tool.id === bestTool?.id)).join('');
  grid.innerHTML = html;

  // Click handler (open tool with prompt)
  grid.querySelectorAll('.ai-tool-card').forEach((card) => {
    card.addEventListener('click', () => {
      if (card.classList.contains('disabled')) {
        showNotification('Generate a prompt first to use AI tools.', 'info');
        return;
      }

      const toolId = card.getAttribute('data-tool');
      const tool = tools.find((t) => t.id === toolId);
      if (!tool) return;

      const encoded = encodeURIComponent(promptText || '');
      const url = (tool.url || '').replace('{prompt}', encoded);

      if (!url) {
        showError('Tool URL not configured.');
        return;
      }

      window.open(url, '_blank', 'noopener,noreferrer');
      showSuccess(`Opening ${tool.name}`);
    });
  });
}
