// Simple YAML parser for basic Home Assistant card configurations
// This is a lightweight parser that handles the most common YAML patterns used in Lovelace cards

export class SimpleYamlParser {
  static parse(yamlString) {
    try {
      const lines = yamlString.split('\n');
      const result = {};
      let currentKey = null;
      let currentValue = '';
      let inMultilineString = false;
      let multilineKey = null;
      let indentLevel = 0;
      let currentObject = result;
      let objectStack = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmedLine = line.trim();
        
        // Skip empty lines and comments
        if (!trimmedLine || trimmedLine.startsWith('#')) {
          continue;
        }

        // Calculate indentation
        const lineIndent = line.length - line.trimStart().length;

        // Handle multiline strings
        if (inMultilineString) {
          if (lineIndent > indentLevel || trimmedLine === '') {
            currentValue += (currentValue ? '\n' : '') + line.substring(indentLevel + 2);
            continue;
          } else {
            // End of multiline string
            currentObject[multilineKey] = currentValue;
            inMultilineString = false;
            multilineKey = null;
            currentValue = '';
            // Continue processing this line
          }
        }

        // Handle object nesting
        while (objectStack.length > 0 && lineIndent <= objectStack[objectStack.length - 1].indent) {
          objectStack.pop();
          currentObject = objectStack.length > 0 ? objectStack[objectStack.length - 1].obj : result;
        }

        if (trimmedLine.includes(':')) {
          const colonIndex = trimmedLine.indexOf(':');
          const key = trimmedLine.substring(0, colonIndex).trim();
          const value = trimmedLine.substring(colonIndex + 1).trim();

          if (value === '') {
            // This is an object
            currentObject[key] = {};
            objectStack.push({ obj: currentObject, indent: lineIndent });
            currentObject = currentObject[key];
          } else if (value === '|' || value === '>') {
            // Multiline string
            inMultilineString = true;
            multilineKey = key;
            indentLevel = lineIndent;
            currentValue = '';
          } else if (value.startsWith('[') && value.endsWith(']')) {
            // Array notation
            currentObject[key] = this._parseArray(value);
          } else {
            // Simple key-value
            currentObject[key] = this._parseValue(value);
          }
        } else if (trimmedLine.startsWith('-')) {
          // Array item
          const arrayValue = trimmedLine.substring(1).trim();
          if (!Array.isArray(currentObject)) {
            // Convert current object to array if needed
            const parentKey = objectStack.length > 0 ? Object.keys(objectStack[objectStack.length - 1].obj).pop() : null;
            if (parentKey) {
              objectStack[objectStack.length - 1].obj[parentKey] = [];
              currentObject = objectStack[objectStack.length - 1].obj[parentKey];
            }
          }
          if (Array.isArray(currentObject)) {
            currentObject.push(this._parseValue(arrayValue));
          }
        }
      }

      // Handle final multiline string
      if (inMultilineString && multilineKey) {
        currentObject[multilineKey] = currentValue;
      }

      return result;
    } catch (error) {
      console.error('[SimpleYamlParser] Parse error:', error);
      throw new Error(`YAML parsing failed: ${error.message}`);
    }
  }

  static _parseArray(arrayString) {
    try {
      // Handle simple array notation like [item1, item2, item3]
      const content = arrayString.slice(1, -1).trim();
      if (!content) return [];
      
      return content.split(',').map(item => this._parseValue(item.trim()));
    } catch (error) {
      return [];
    }
  }

  static _parseValue(value) {
    const trimmed = value.trim();
    
    // Boolean values
    if (trimmed === 'true') return true;
    if (trimmed === 'false') return false;
    
    // Null/undefined
    if (trimmed === 'null' || trimmed === '~') return null;
    
    // Numbers
    if (/^-?\d+$/.test(trimmed)) return parseInt(trimmed, 10);
    if (/^-?\d*\.\d+$/.test(trimmed)) return parseFloat(trimmed);
    
    // Quoted strings
    if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
        (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
      return trimmed.slice(1, -1);
    }
    
    // Regular strings
    return trimmed;
  }

  // Extract entity IDs from parsed YAML for state management
  static extractEntityIds(yamlObject) {
    const entityIds = new Set();
    
    const traverse = (obj) => {
      if (typeof obj === 'string') {
        // Extract entity IDs from regular strings
        if (/^[a-z_]+\.[a-z0-9_]+$/.test(obj)) {
          entityIds.add(obj);
        }
        // Extract entity IDs from template strings like {{ states('sensor.temperature') }}
        const templateMatches = obj.match(/\{\{\s*states\(['"]([^'"]+)['"]\)\s*\}\}/g);
        if (templateMatches) {
          templateMatches.forEach(match => {
            const entityMatch = match.match(/\{\{\s*states\(['"]([^'"]+)['"]\)\s*\}\}/);
            if (entityMatch && entityMatch[1]) {
              entityIds.add(entityMatch[1]);
            }
          });
        }
      } else if (Array.isArray(obj)) {
        obj.forEach(traverse);
      } else if (obj && typeof obj === 'object') {
        Object.values(obj).forEach(traverse);
      }
    };
    
    traverse(yamlObject);
    return Array.from(entityIds);
  }
}