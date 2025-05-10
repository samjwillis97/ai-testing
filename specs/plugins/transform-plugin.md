# Response Transform Plugin

## Overview

The Response Transform Plugin demonstrates response transformation capabilities within the SHC plugin system. This plugin allows for powerful manipulation of API responses, enabling data extraction, format conversion, and schema validation.

## Features

- JSON path transformations
- XML to JSON conversion
- Data extraction
- Response formatting
- Schema validation

## Configuration

```typescript
interface TransformConfig {
  rules: {
    contentType: string;
    transforms: {
      type: 'jsonPath' | 'xpath' | 'regex';
      expression: string;
      target: string;
    }[];
  }[];
  validation?: {
    schema: object;
    onError: 'throw' | 'warn' | 'ignore';
  };
}
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `rules` | array | `[]` | Array of transformation rules |
| `rules[].contentType` | string | | Content type to apply the rule to (e.g., 'application/json') |
| `rules[].transforms` | array | | Array of transformations to apply |
| `rules[].transforms[].type` | string | | Type of transformation ('jsonPath', 'xpath', or 'regex') |
| `rules[].transforms[].expression` | string | | Expression to evaluate |
| `rules[].transforms[].target` | string | | Target property to store the result |
| `validation` | object | | Schema validation configuration |
| `validation.schema` | object | | JSON schema for validation |
| `validation.onError` | string | `'warn'` | Behavior when validation fails ('throw', 'warn', or 'ignore') |

## Implementation

### Plugin Class

```typescript
import { 
  Plugin, 
  PluginConfig, 
  RequestConfig, 
  Response, 
  PluginContext 
} from '@shc/core';
import * as jsonpath from 'jsonpath';
import * as xpath from 'xpath';
import { DOMParser } from 'xmldom';
import Ajv from 'ajv';

export class TransformPlugin implements Plugin {
  private config: TransformConfig;
  private ajv: Ajv;
  private logger: any;
  
  constructor() {
    // Default configuration
    this.config = {
      rules: [],
      validation: {
        schema: {},
        onError: 'warn',
      },
    };
    
    // Initialize JSON schema validator
    this.ajv = new Ajv({ allErrors: true });
  }
  
  /**
   * Initialize the plugin
   */
  async onInit(context: PluginContext): Promise<void> {
    this.logger = context.logger;
    this.logger?.info('Transform plugin initialized');
  }
  
  /**
   * Configure the plugin
   */
  async onConfigure(config: PluginConfig): Promise<void> {
    // Merge configuration
    this.config = {
      ...this.config,
      ...config,
    };
    
    // Compile validation schema if provided
    if (this.config.validation?.schema) {
      try {
        this.ajv.compile(this.config.validation.schema);
      } catch (error) {
        this.logger?.error('Failed to compile validation schema', error);
      }
    }
    
    this.logger?.info('Transform plugin configured');
  }
  
  /**
   * Process response after it is received
   */
  async onResponse(response: Response<any>, request: RequestConfig): Promise<Response<any>> {
    // Skip transformation if no data
    if (!response.data) {
      return response;
    }
    
    // Find matching rule for the content type
    const contentType = response.headers['content-type'] || '';
    const rule = this.findMatchingRule(contentType);
    
    if (!rule) {
      // No rule matches, skip transformation
      return response;
    }
    
    // Apply transformations
    try {
      const transformedData = this.applyTransformations(response.data, rule.transforms, contentType);
      
      // Validate transformed data if schema is provided
      if (this.config.validation?.schema) {
        this.validateData(transformedData);
      }
      
      // Update response data
      response.data = transformedData;
      
      // Add metadata about transformation
      response.meta = response.meta || {};
      response.meta.transformed = true;
      response.meta.transformRule = rule;
    } catch (error) {
      this.logger?.error('Failed to transform response', error);
      
      // Add error metadata
      response.meta = response.meta || {};
      response.meta.transformError = error.message;
    }
    
    return response;
  }
  
  /**
   * Clean up when plugin is destroyed
   */
  async onDestroy(): Promise<void> {
    this.logger?.info('Transform plugin destroyed');
  }
  
  /**
   * Find matching rule for a content type
   */
  private findMatchingRule(contentType: string): TransformConfig['rules'][0] | null {
    for (const rule of this.config.rules) {
      if (contentType.includes(rule.contentType)) {
        return rule;
      }
    }
    
    return null;
  }
  
  /**
   * Apply transformations to response data
   */
  private applyTransformations(data: any, transforms: TransformConfig['rules'][0]['transforms'], contentType: string): any {
    // Create a copy of the data to avoid modifying the original
    let result = JSON.parse(JSON.stringify(data));
    
    // Convert XML to JSON if needed
    if (contentType.includes('xml') && typeof data === 'string') {
      result = this.convertXmlToJson(data);
    }
    
    // Apply each transformation
    for (const transform of transforms) {
      try {
        const value = this.evaluateExpression(result, transform.type, transform.expression);
        
        // Set the value at the target path
        result = this.setValueAtPath(result, transform.target, value);
      } catch (error) {
        this.logger?.error(`Failed to apply transformation: ${transform.type} ${transform.expression}`, error);
      }
    }
    
    return result;
  }
  
  /**
   * Evaluate an expression against data
   */
  private evaluateExpression(data: any, type: string, expression: string): any {
    switch (type) {
      case 'jsonPath':
        return this.evaluateJsonPath(data, expression);
      case 'xpath':
        return this.evaluateXPath(data, expression);
      case 'regex':
        return this.evaluateRegex(data, expression);
      default:
        throw new Error(`Unsupported expression type: ${type}`);
    }
  }
  
  /**
   * Evaluate a JSONPath expression
   */
  private evaluateJsonPath(data: any, expression: string): any {
    return jsonpath.query(data, expression);
  }
  
  /**
   * Evaluate an XPath expression
   */
  private evaluateXPath(data: any, expression: string): any {
    // If data is already a JSON object, convert it to XML
    if (typeof data !== 'string') {
      data = this.convertJsonToXml(data);
    }
    
    // Parse XML
    const doc = new DOMParser().parseFromString(data);
    
    // Evaluate XPath
    const nodes = xpath.select(expression, doc);
    
    // Convert result to JSON
    return this.convertXPathResultToJson(nodes);
  }
  
  /**
   * Evaluate a regex expression
   */
  private evaluateRegex(data: any, expression: string): any {
    // Convert data to string if needed
    const str = typeof data === 'string' ? data : JSON.stringify(data);
    
    // Parse regex
    const regex = new RegExp(expression, 'g');
    
    // Find all matches
    const matches = [];
    let match;
    
    while ((match = regex.exec(str)) !== null) {
      matches.push(match[0]);
    }
    
    return matches;
  }
  
  /**
   * Convert XML to JSON
   */
  private convertXmlToJson(xml: string): any {
    // Parse XML
    const doc = new DOMParser().parseFromString(xml);
    
    // Convert to JSON
    return this.xmlNodeToJson(doc.documentElement);
  }
  
  /**
   * Convert XML node to JSON
   */
  private xmlNodeToJson(node: any): any {
    // Create result object
    const obj: any = {};
    
    // Add attributes
    if (node.attributes) {
      for (let i = 0; i < node.attributes.length; i++) {
        const attr = node.attributes[i];
        obj[`@${attr.nodeName}`] = attr.nodeValue;
      }
    }
    
    // Add child nodes
    for (let i = 0; i < node.childNodes.length; i++) {
      const child = node.childNodes[i];
      
      // Skip text nodes with only whitespace
      if (child.nodeType === 3 && child.nodeValue.trim() === '') {
        continue;
      }
      
      // Handle text nodes
      if (child.nodeType === 3) {
        obj['#text'] = child.nodeValue;
        continue;
      }
      
      // Handle element nodes
      if (child.nodeType === 1) {
        const childJson = this.xmlNodeToJson(child);
        
        if (obj[child.nodeName]) {
          // If property already exists, convert to array
          if (!Array.isArray(obj[child.nodeName])) {
            obj[child.nodeName] = [obj[child.nodeName]];
          }
          
          obj[child.nodeName].push(childJson);
        } else {
          obj[child.nodeName] = childJson;
        }
      }
    }
    
    return obj;
  }
  
  /**
   * Convert JSON to XML
   */
  private convertJsonToXml(json: any, rootName: string = 'root'): string {
    // Create XML string
    let xml = `<${rootName}>`;
    
    // Add properties
    for (const [key, value] of Object.entries(json)) {
      if (key.startsWith('@')) {
        // Skip attributes for now
        continue;
      }
      
      if (key === '#text') {
        // Add text content
        xml += value;
      } else if (Array.isArray(value)) {
        // Add array items
        for (const item of value) {
          xml += this.convertJsonToXml(item, key);
        }
      } else if (typeof value === 'object' && value !== null) {
        // Add nested object
        xml += this.convertJsonToXml(value, key);
      } else {
        // Add simple property
        xml += `<${key}>${value}</${key}>`;
      }
    }
    
    // Add attributes
    let rootWithAttrs = rootName;
    for (const [key, value] of Object.entries(json)) {
      if (key.startsWith('@')) {
        rootWithAttrs += ` ${key.substring(1)}="${value}"`;
      }
    }
    
    // Replace opening tag with one that includes attributes
    xml = xml.replace(`<${rootName}>`, `<${rootWithAttrs}>`);
    
    // Close root tag
    xml += `</${rootName}>`;
    
    return xml;
  }
  
  /**
   * Convert XPath result to JSON
   */
  private convertXPathResultToJson(nodes: any): any {
    if (!nodes || nodes.length === 0) {
      return null;
    }
    
    if (nodes.length === 1) {
      // Single node
      const node = nodes[0];
      
      if (node.nodeType === 2) {
        // Attribute node
        return node.nodeValue;
      } else if (node.nodeType === 3) {
        // Text node
        return node.nodeValue;
      } else {
        // Element node
        return this.xmlNodeToJson(node);
      }
    } else {
      // Multiple nodes
      return nodes.map((node: any) => {
        if (node.nodeType === 2) {
          // Attribute node
          return node.nodeValue;
        } else if (node.nodeType === 3) {
          // Text node
          return node.nodeValue;
        } else {
          // Element node
          return this.xmlNodeToJson(node);
        }
      });
    }
  }
  
  /**
   * Set value at a specific path in an object
   */
  private setValueAtPath(obj: any, path: string, value: any): any {
    // Create a copy of the object
    const result = JSON.parse(JSON.stringify(obj));
    
    // Split path into parts
    const parts = path.split('.');
    
    // Traverse the object
    let current = result;
    
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      
      // Create nested object if it doesn't exist
      if (!current[part]) {
        current[part] = {};
      }
      
      current = current[part];
    }
    
    // Set the value at the final path
    current[parts[parts.length - 1]] = value;
    
    return result;
  }
  
  /**
   * Validate data against JSON schema
   */
  private validateData(data: any): void {
    if (!this.config.validation?.schema) {
      return;
    }
    
    // Get validator
    const validate = this.ajv.getSchema(JSON.stringify(this.config.validation.schema)) || 
      this.ajv.compile(this.config.validation.schema);
    
    // Validate data
    const valid = validate(data);
    
    if (!valid) {
      const errors = validate.errors || [];
      const errorMessage = `Validation failed: ${this.ajv.errorsText(errors)}`;
      
      switch (this.config.validation.onError) {
        case 'throw':
          throw new Error(errorMessage);
        case 'warn':
          this.logger?.warn(errorMessage);
          break;
        case 'ignore':
          // Do nothing
          break;
      }
    }
  }
}
```

## Usage Example

### JSON Path Transformations

```typescript
import { createSHCClient } from '@shc/core';
import { TransformPlugin } from '@shc/plugins/transform';

// Create client with transform plugin
const client = createSHCClient({
  plugins: [
    {
      plugin: new TransformPlugin(),
      config: {
        rules: [
          {
            contentType: 'application/json',
            transforms: [
              {
                type: 'jsonPath',
                expression: '$.items[*].name',
                target: 'names',
              },
              {
                type: 'jsonPath',
                expression: '$.items[*].id',
                target: 'ids',
              },
            ],
          },
        ],
      },
    },
  ],
});

// Make request
client.get('https://api.example.com/items')
  .then(response => {
    // Original response:
    // {
    //   "items": [
    //     { "id": 1, "name": "Item 1", "description": "..." },
    //     { "id": 2, "name": "Item 2", "description": "..." }
    //   ],
    //   "total": 2
    // }
    
    // Transformed response:
    // {
    //   "items": [...],
    //   "total": 2,
    //   "names": ["Item 1", "Item 2"],
    //   "ids": [1, 2]
    // }
    
    console.log('Transformed response:', response.data);
  })
  .catch(error => {
    console.error('Request failed', error);
  });
```

### XML to JSON Conversion

```typescript
import { createSHCClient } from '@shc/core';
import { TransformPlugin } from '@shc/plugins/transform';

// Create client with transform plugin
const client = createSHCClient({
  plugins: [
    {
      plugin: new TransformPlugin(),
      config: {
        rules: [
          {
            contentType: 'application/xml',
            transforms: [
              {
                type: 'xpath',
                expression: '//item',
                target: 'items',
              },
            ],
          },
        ],
      },
    },
  ],
});

// Make request
client.get('https://api.example.com/items', {
  headers: {
    'Accept': 'application/xml',
  },
})
  .then(response => {
    // Original XML response:
    // <response>
    //   <items>
    //     <item id="1">
    //       <name>Item 1</name>
    //       <description>...</description>
    //     </item>
    //     <item id="2">
    //       <name>Item 2</name>
    //       <description>...</description>
    //     </item>
    //   </items>
    //   <total>2</total>
    // </response>
    
    // Transformed JSON response:
    // {
    //   "response": {
    //     "items": {...},
    //     "total": "2"
    //   },
    //   "items": [
    //     { "@id": "1", "name": "Item 1", "description": "..." },
    //     { "@id": "2", "name": "Item 2", "description": "..." }
    //   ]
    // }
    
    console.log('Transformed response:', response.data);
  })
  .catch(error => {
    console.error('Request failed', error);
  });
```

### Schema Validation

```typescript
import { createSHCClient } from '@shc/core';
import { TransformPlugin } from '@shc/plugins/transform';

// Create client with transform plugin
const client = createSHCClient({
  plugins: [
    {
      plugin: new TransformPlugin(),
      config: {
        rules: [
          {
            contentType: 'application/json',
            transforms: [
              {
                type: 'jsonPath',
                expression: '$.items[*]',
                target: 'extractedItems',
              },
            ],
          },
        ],
        validation: {
          schema: {
            type: 'object',
            required: ['extractedItems'],
            properties: {
              extractedItems: {
                type: 'array',
                items: {
                  type: 'object',
                  required: ['id', 'name'],
                  properties: {
                    id: { type: 'number' },
                    name: { type: 'string' },
                  },
                },
              },
            },
          },
          onError: 'warn',
        },
      },
    },
  ],
});

// Make request
client.get('https://api.example.com/items')
  .then(response => {
    console.log('Validated response:', response.data);
  })
  .catch(error => {
    console.error('Request failed', error);
  });
```

## Advanced Usage

### Chained Transformations

You can chain multiple transformations to perform complex data manipulations:

```typescript
import { createSHCClient } from '@shc/core';
import { TransformPlugin } from '@shc/plugins/transform';

// Create client with transform plugin
const client = createSHCClient({
  plugins: [
    {
      plugin: new TransformPlugin(),
      config: {
        rules: [
          {
            contentType: 'application/json',
            transforms: [
              // Extract user IDs
              {
                type: 'jsonPath',
                expression: '$.users[*].id',
                target: 'userIds',
              },
              // Extract active users
              {
                type: 'jsonPath',
                expression: '$.users[?(@.status=="active")]',
                target: 'activeUsers',
              },
              // Count active users
              {
                type: 'jsonPath',
                expression: '$.users[?(@.status=="active")].length()',
                target: 'activeUserCount',
              },
              // Format user names
              {
                type: 'jsonPath',
                expression: '$.users[*]',
                target: 'formattedUsers',
              },
            ],
          },
        ],
      },
    },
  ],
});

// Make request
client.get('https://api.example.com/users')
  .then(response => {
    // Further transform the data
    response.data.formattedUsers = response.data.formattedUsers.map(user => ({
      displayName: `${user.firstName} ${user.lastName}`,
      email: user.email,
      isActive: user.status === 'active',
    }));
    
    console.log('Transformed response:', response.data);
  })
  .catch(error => {
    console.error('Request failed', error);
  });
```

### Custom Transformations

You can extend the TransformPlugin to support custom transformation types:

```typescript
import { TransformPlugin } from '@shc/plugins/transform';

class ExtendedTransformPlugin extends TransformPlugin {
  // Override evaluateExpression to add custom transformation types
  protected evaluateExpression(data: any, type: string, expression: string): any {
    // Handle custom transformation types
    if (type === 'csv') {
      return this.evaluateCsv(data, expression);
    } else if (type === 'template') {
      return this.evaluateTemplate(data, expression);
    }
    
    // Fall back to parent implementation for standard types
    return super.evaluateExpression(data, type, expression);
  }
  
  // Custom CSV transformation
  private evaluateCsv(data: any, expression: string): any {
    // Implementation for CSV transformation
    // ...
  }
  
  // Custom template transformation
  private evaluateTemplate(data: any, expression: string): any {
    // Implementation for template transformation
    // ...
  }
}
```

## Implementation Requirements

The Transform Plugin implementation must follow these requirements:

1. **Performance**:
   - Efficient transformation execution
   - Minimal memory overhead
   - Optimized parsing for large responses

2. **Correctness**:
   - Accurate expression evaluation
   - Proper handling of edge cases
   - Correct type conversions

3. **Flexibility**:
   - Support for various data formats
   - Extensible transformation system
   - Configurable validation rules

4. **Error Handling**:
   - Graceful handling of transformation errors
   - Clear error messages
   - Configurable error behavior

5. **Compatibility**:
   - Support for standard expression languages
   - Interoperability with other plugins
   - Backward compatibility with existing APIs

The implementation should align with the TypeScript best practices specified in the project rules, ensuring proper typing, error handling, and test coverage with a minimum of 80% for statements, functions, and lines.
