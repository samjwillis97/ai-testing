# Metrics Plugin

## Overview

The Metrics Plugin provides comprehensive request and response metrics collection for the SHC client. It captures timing, size, and status information for all HTTP requests, enabling performance monitoring and analysis.

## Features

- Request/response timing metrics
- Size measurements
- Status code tracking
- Custom metric collection
- Multiple reporter support
- Tagging and filtering

## Configuration

```typescript
interface MetricsConfig {
  enabled: boolean;
  reporters: {
    type: 'console' | 'prometheus' | 'statsd' | 'custom';
    options?: Record<string, any>;
  }[];
  tags: Record<string, string>;
  sampleRate: number;
  includeHosts: string[];
  excludeHosts: string[];
}
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | boolean | `true` | Enable/disable metrics collection |
| `reporters` | array | `[{ type: 'console' }]` | Metrics reporters configuration |
| `tags` | object | `{}` | Global tags to apply to all metrics |
| `sampleRate` | number | `1.0` | Sampling rate (0.0 to 1.0) |
| `includeHosts` | array | `[]` | Hosts to include (empty means all) |
| `excludeHosts` | array | `[]` | Hosts to exclude |

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

export class MetricsPlugin implements Plugin {
  private config: MetricsConfig;
  private reporters: MetricsReporter[] = [];
  private logger: any;
  
  constructor() {
    // Default configuration
    this.config = {
      enabled: true,
      reporters: [{ type: 'console' }],
      tags: {},
      sampleRate: 1.0,
      includeHosts: [],
      excludeHosts: [],
    };
  }
  
  /**
   * Initialize the plugin
   */
  async onInit(context: PluginContext): Promise<void> {
    this.logger = context.logger;
    
    // Initialize reporters
    await this.initReporters();
    
    this.logger?.info('Metrics plugin initialized');
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
    
    // Re-initialize reporters if configuration changed
    await this.initReporters();
    
    this.logger?.info('Metrics plugin configured');
  }
  
  /**
   * Process request before it is sent
   */
  async onRequest(request: RequestConfig): Promise<RequestConfig> {
    // Skip if metrics are disabled
    if (!this.config.enabled) {
      return request;
    }
    
    // Skip if request should not be sampled
    if (!this.shouldSample(request)) {
      return request;
    }
    
    // Add timing metadata
    request.meta = request.meta || {};
    request.meta.metrics = {
      startTime: Date.now(),
      requestSize: this.calculateRequestSize(request),
    };
    
    return request;
  }
  
  /**
   * Process response after it is received
   */
  async onResponse(response: Response<any>, request: RequestConfig): Promise<Response<any>> {
    // Skip if metrics are disabled
    if (!this.config.enabled) {
      return response;
    }
    
    // Skip if request was not sampled
    if (!request.meta?.metrics) {
      return response;
    }
    
    // Calculate metrics
    const endTime = Date.now();
    const startTime = request.meta.metrics.startTime;
    const duration = endTime - startTime;
    const requestSize = request.meta.metrics.requestSize;
    const responseSize = this.calculateResponseSize(response);
    
    // Create metric data
    const url = new URL(request.url || '');
    const host = url.hostname;
    const path = url.pathname;
    const method = request.method?.toUpperCase() || 'GET';
    const status = response.status;
    
    const metricData: MetricData = {
      type: 'http',
      name: 'request',
      timestamp: endTime,
      values: {
        duration,
        requestSize,
        responseSize,
      },
      tags: {
        ...this.config.tags,
        host,
        path,
        method,
        status: status.toString(),
      },
    };
    
    // Report metrics
    for (const reporter of this.reporters) {
      try {
        await reporter.report(metricData);
      } catch (error) {
        this.logger?.error(`Failed to report metrics to ${reporter.name}`, error);
      }
    }
    
    return response;
  }
  
  /**
   * Clean up when plugin is destroyed
   */
  async onDestroy(): Promise<void> {
    // Clean up reporters
    for (const reporter of this.reporters) {
      try {
        await reporter.close();
      } catch (error) {
        this.logger?.error(`Failed to close metrics reporter ${reporter.name}`, error);
      }
    }
    
    this.logger?.info('Metrics plugin destroyed');
  }
  
  /**
   * Initialize metrics reporters
   */
  private async initReporters(): Promise<void> {
    // Close existing reporters
    for (const reporter of this.reporters) {
      try {
        await reporter.close();
      } catch (error) {
        this.logger?.error(`Failed to close metrics reporter ${reporter.name}`, error);
      }
    }
    
    // Clear reporters
    this.reporters = [];
    
    // Create new reporters
    for (const reporterConfig of this.config.reporters) {
      try {
        const reporter = this.createReporter(reporterConfig);
        await reporter.init();
        this.reporters.push(reporter);
      } catch (error) {
        this.logger?.error(`Failed to initialize metrics reporter ${reporterConfig.type}`, error);
      }
    }
  }
  
  /**
   * Create a metrics reporter
   */
  private createReporter(config: { type: string; options?: Record<string, any> }): MetricsReporter {
    switch (config.type) {
      case 'console':
        return new ConsoleReporter(config.options);
      case 'prometheus':
        return new PrometheusReporter(config.options);
      case 'statsd':
        return new StatsdReporter(config.options);
      case 'custom':
        if (!config.options?.reporter) {
          throw new Error('Custom reporter instance is required');
        }
        return config.options.reporter;
      default:
        throw new Error(`Unsupported metrics reporter type: ${config.type}`);
    }
  }
  
  /**
   * Check if a request should be sampled
   */
  private shouldSample(request: RequestConfig): boolean {
    // Check sampling rate
    if (Math.random() > this.config.sampleRate) {
      return false;
    }
    
    // Check host filters
    const url = new URL(request.url || '');
    const host = url.hostname;
    
    // Check exclude list
    if (this.config.excludeHosts.includes(host)) {
      return false;
    }
    
    // Check include list (if empty, include all)
    if (this.config.includeHosts.length > 0 && !this.config.includeHosts.includes(host)) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Calculate request size in bytes
   */
  private calculateRequestSize(request: RequestConfig): number {
    let size = 0;
    
    // Method and URL
    size += (request.method?.length || 3) + (request.url?.length || 0);
    
    // Headers
    if (request.headers) {
      for (const [key, value] of Object.entries(request.headers)) {
        size += key.length + (value?.toString().length || 0);
      }
    }
    
    // Data
    if (request.data) {
      if (typeof request.data === 'string') {
        size += request.data.length;
      } else {
        try {
          size += JSON.stringify(request.data).length;
        } catch (error) {
          // Ignore
        }
      }
    }
    
    return size;
  }
  
  /**
   * Calculate response size in bytes
   */
  private calculateResponseSize(response: Response<any>): number {
    let size = 0;
    
    // Status
    size += response.status.toString().length;
    
    // Headers
    if (response.headers) {
      for (const [key, value] of Object.entries(response.headers)) {
        size += key.length + (value?.toString().length || 0);
      }
    }
    
    // Data
    if (response.data) {
      if (typeof response.data === 'string') {
        size += response.data.length;
      } else {
        try {
          size += JSON.stringify(response.data).length;
        } catch (error) {
          // Ignore
        }
      }
    }
    
    return size;
  }
}

/**
 * Metric data interface
 */
interface MetricData {
  type: string;
  name: string;
  timestamp: number;
  values: Record<string, number>;
  tags: Record<string, string>;
}

/**
 * Metrics reporter interface
 */
interface MetricsReporter {
  name: string;
  init(): Promise<void>;
  report(data: MetricData): Promise<void>;
  close(): Promise<void>;
}

/**
 * Console metrics reporter
 */
class ConsoleReporter implements MetricsReporter {
  name = 'console';
  private options: Record<string, any>;
  
  constructor(options?: Record<string, any>) {
    this.options = options || {};
  }
  
  async init(): Promise<void> {
    // No initialization needed
  }
  
  async report(data: MetricData): Promise<void> {
    if (this.options.pretty) {
      console.log(`[Metrics] ${data.type}.${data.name}`);
      console.log(`  Timestamp: ${new Date(data.timestamp).toISOString()}`);
      console.log('  Values:');
      for (const [key, value] of Object.entries(data.values)) {
        console.log(`    ${key}: ${value}`);
      }
      console.log('  Tags:');
      for (const [key, value] of Object.entries(data.tags)) {
        console.log(`    ${key}: ${value}`);
      }
    } else {
      console.log(JSON.stringify({
        metric: `${data.type}.${data.name}`,
        timestamp: data.timestamp,
        values: data.values,
        tags: data.tags,
      }));
    }
  }
  
  async close(): Promise<void> {
    // No cleanup needed
  }
}

/**
 * Prometheus metrics reporter
 */
class PrometheusReporter implements MetricsReporter {
  name = 'prometheus';
  private options: Record<string, any>;
  private registry: any;
  private metrics: Map<string, any> = new Map();
  
  constructor(options?: Record<string, any>) {
    this.options = options || {};
    
    // In a real implementation, this would use the actual Prometheus client
    this.registry = {
      // Mock implementation
    };
  }
  
  async init(): Promise<void> {
    // Initialize Prometheus client
    // In a real implementation, this would set up the HTTP server for scraping
  }
  
  async report(data: MetricData): Promise<void> {
    const metricName = `${data.type}_${data.name}`;
    
    // For each value, create or update a metric
    for (const [valueName, value] of Object.entries(data.values)) {
      const fullMetricName = `${metricName}_${valueName}`;
      
      // Get or create metric
      let metric = this.metrics.get(fullMetricName);
      
      if (!metric) {
        // In a real implementation, this would create the appropriate Prometheus metric
        metric = {
          name: fullMetricName,
          help: `${data.type} ${data.name} ${valueName}`,
          type: 'gauge',
          values: [],
        };
        
        this.metrics.set(fullMetricName, metric);
      }
      
      // Update metric value
      metric.values.push({
        value,
        labels: data.tags,
      });
    }
  }
  
  async close(): Promise<void> {
    // Clean up Prometheus client
    // In a real implementation, this would shut down the HTTP server
  }
}

/**
 * StatsD metrics reporter
 */
class StatsdReporter implements MetricsReporter {
  name = 'statsd';
  private options: Record<string, any>;
  private client: any;
  
  constructor(options?: Record<string, any>) {
    this.options = options || {};
    
    // In a real implementation, this would use the actual StatsD client
    this.client = {
      // Mock implementation
    };
  }
  
  async init(): Promise<void> {
    // Initialize StatsD client
    // In a real implementation, this would connect to the StatsD server
  }
  
  async report(data: MetricData): Promise<void> {
    const metricName = `${data.type}.${data.name}`;
    
    // For each value, send a metric
    for (const [valueName, value] of Object.entries(data.values)) {
      const fullMetricName = `${metricName}.${valueName}`;
      
      // In a real implementation, this would send the metric to StatsD
      console.log(`StatsD: ${fullMetricName} ${value} ${JSON.stringify(data.tags)}`);
    }
  }
  
  async close(): Promise<void> {
    // Clean up StatsD client
    // In a real implementation, this would close the connection
  }
}
```

## Usage Example

### Basic Usage

```typescript
import { createSHCClient } from '@shc/core';
import { MetricsPlugin } from '@shc/plugins/metrics';

// Create client with metrics plugin
const client = createSHCClient({
  plugins: [
    {
      plugin: new MetricsPlugin(),
      config: {
        enabled: true,
        reporters: [
          { 
            type: 'console',
            options: {
              pretty: true,
            },
          },
        ],
        tags: {
          service: 'my-service',
          environment: 'production',
        },
      },
    },
  ],
});

// Make request
client.get('https://api.example.com/users')
  .then(response => {
    console.log('Request succeeded');
  })
  .catch(error => {
    console.error('Request failed', error);
  });
```

### Multiple Reporters

```typescript
import { createSHCClient } from '@shc/core';
import { MetricsPlugin } from '@shc/plugins/metrics';

// Create client with metrics plugin
const client = createSHCClient({
  plugins: [
    {
      plugin: new MetricsPlugin(),
      config: {
        enabled: true,
        reporters: [
          { type: 'console' },
          { 
            type: 'prometheus',
            options: {
              port: 9090,
              path: '/metrics',
            },
          },
          {
            type: 'statsd',
            options: {
              host: 'localhost',
              port: 8125,
              prefix: 'shc.',
            },
          },
        ],
        sampleRate: 0.5, // Sample 50% of requests
      },
    },
  ],
});
```

### Host Filtering

```typescript
import { createSHCClient } from '@shc/core';
import { MetricsPlugin } from '@shc/plugins/metrics';

// Create client with metrics plugin
const client = createSHCClient({
  plugins: [
    {
      plugin: new MetricsPlugin(),
      config: {
        enabled: true,
        reporters: [{ type: 'console' }],
        includeHosts: [
          'api.example.com',
          'api.service.com',
        ],
        excludeHosts: [
          'analytics.example.com',
        ],
      },
    },
  ],
});
```

## Custom Metrics

The Metrics Plugin also supports custom metrics collection:

```typescript
import { createSHCClient } from '@shc/core';
import { MetricsPlugin } from '@shc/plugins/metrics';

// Create metrics plugin
const metricsPlugin = new MetricsPlugin();

// Create client with metrics plugin
const client = createSHCClient({
  plugins: [
    {
      plugin: metricsPlugin,
      config: {
        enabled: true,
        reporters: [{ type: 'console' }],
      },
    },
  ],
});

// Add custom metric reporting function
function reportCustomMetric(name: string, value: number, tags: Record<string, string> = {}) {
  const metricData = {
    type: 'custom',
    name,
    timestamp: Date.now(),
    values: { value },
    tags: {
      ...metricsPlugin.config.tags,
      ...tags,
    },
  };
  
  // Report to all reporters
  for (const reporter of metricsPlugin.reporters) {
    reporter.report(metricData).catch(error => {
      console.error(`Failed to report custom metric to ${reporter.name}`, error);
    });
  }
}

// Use custom metrics
async function fetchAndProcessUsers() {
  const startTime = Date.now();
  
  try {
    // Make request
    const response = await client.get('https://api.example.com/users');
    
    // Process users
    const users = response.data.users || [];
    
    // Report custom metrics
    reportCustomMetric('users.count', users.length, { source: 'api' });
    reportCustomMetric('users.process_time', Date.now() - startTime, { source: 'processing' });
    
    return users;
  } catch (error) {
    // Report error metric
    reportCustomMetric('users.error', 1, { 
      error_type: error.name,
      error_message: error.message,
    });
    
    throw error;
  }
}
```

## Custom Reporter

You can implement custom reporters for specific monitoring systems:

```typescript
import { createSHCClient } from '@shc/core';
import { MetricsPlugin } from '@shc/plugins/metrics';

// Create custom reporter
class DatadogReporter implements MetricsReporter {
  name = 'datadog';
  private options: Record<string, any>;
  private client: any;
  
  constructor(options?: Record<string, any>) {
    this.options = options || {};
    
    // In a real implementation, this would use the Datadog client
    this.client = {
      // Mock implementation
    };
  }
  
  async init(): Promise<void> {
    // Initialize Datadog client
    console.log('Initializing Datadog reporter');
  }
  
  async report(data: MetricData): Promise<void> {
    const metricName = `${data.type}.${data.name}`;
    
    // For each value, send a metric to Datadog
    for (const [valueName, value] of Object.entries(data.values)) {
      const fullMetricName = `${metricName}.${valueName}`;
      
      console.log(`Datadog: ${fullMetricName} ${value} ${JSON.stringify(data.tags)}`);
    }
  }
  
  async close(): Promise<void> {
    // Clean up Datadog client
    console.log('Closing Datadog reporter');
  }
}

// Create client with metrics plugin and custom reporter
const client = createSHCClient({
  plugins: [
    {
      plugin: new MetricsPlugin(),
      config: {
        enabled: true,
        reporters: [
          {
            type: 'custom',
            options: {
              reporter: new DatadogReporter({
                apiKey: 'your-datadog-api-key',
              }),
            },
          },
        ],
      },
    },
  ],
});
```

## Implementation Requirements

The Metrics Plugin implementation must follow these requirements:

1. **Performance**:
   - Minimal overhead for metrics collection
   - Efficient reporting mechanisms
   - Support for sampling to reduce load

2. **Flexibility**:
   - Support for multiple reporting backends
   - Customizable metric names and tags
   - Extensible reporter system

3. **Reliability**:
   - Graceful handling of reporter failures
   - Proper cleanup of resources
   - Non-blocking metric reporting

4. **Compatibility**:
   - Support for standard metrics formats
   - Integration with popular monitoring systems
   - Interoperability with other plugins

5. **Usability**:
   - Simple configuration options
   - Clear documentation of metrics
   - Helpful debugging information

The implementation should align with the TypeScript best practices specified in the project rules, ensuring proper typing, error handling, and test coverage with a minimum of 80% for statements, functions, and lines.
