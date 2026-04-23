import { adaptationError } from './errors.mjs';

function splitSectionsFromMarkdown(text) {
  const lines = text.split(/\r?\n/);
  const sections = [];
  let current = { heading: 'summary', content: '' };

  for (const line of lines) {
    if (line.startsWith('#')) {
      if (current.content.trim()) {
        sections.push({ ...current, content: current.content.trim() });
      }
      current = { heading: line.replace(/^#+\s*/, '').trim() || 'section', content: '' };
      continue;
    }

    current.content += `${line}\n`;
  }

  if (current.content.trim()) {
    sections.push({ ...current, content: current.content.trim() });
  }

  return sections;
}

export function detectOutputFormat(rawOutput) {
  if (rawOutput === null || rawOutput === undefined) {
    throw adaptationError('missing_output', 'raw output is required');
  }

  if (typeof rawOutput === 'string') {
    const trimmed = rawOutput.trim();
    if (!trimmed) {
      throw adaptationError('empty_output', 'raw output is empty');
    }

    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        return {
          format: 'json_string',
          normalizedBody: JSON.parse(trimmed)
        };
      } catch {
        return {
          format: 'text',
          normalizedBody: trimmed,
          sections: splitSectionsFromMarkdown(trimmed)
        };
      }
    }

    return {
      format: trimmed.includes('\n#') || trimmed.startsWith('#') ? 'markdown' : 'text',
      normalizedBody: trimmed,
      sections: splitSectionsFromMarkdown(trimmed)
    };
  }

  if (typeof rawOutput === 'object') {
    return {
      format: 'object',
      normalizedBody: rawOutput,
      sections: Array.isArray(rawOutput.sections) ? rawOutput.sections : []
    };
  }

  throw adaptationError('unsupported_output_type', `unsupported output type: ${typeof rawOutput}`);
}
