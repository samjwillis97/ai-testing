/**
 * Terminal User Interface (TUI) utilities
 */
import blessed from 'blessed';
import chalk from 'chalk';
import { SHCClient } from '@shc/core';
import { RequestOptions, OutputOptions, HttpMethod } from '../types.js';
import { formatResponse } from './output.js';

/**
 * TUI Screen interface
 */
export interface TUIScreen {
  screen: blessed.Widgets.Screen;
  start(): void;
  stop(): void;
}

/**
 * Create a full-screen TUI for interactive mode
 */
export function createInteractiveTUI(): TUIScreen {
  // Create a screen object
  const screen = blessed.screen({
    smartCSR: true,
    title: 'SHC Interactive Mode',
    fullUnicode: true,
    dockBorders: true,
    autoPadding: true,
  });

  // Create a box for the main menu
  const mainMenuBox = blessed.box({
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    content: chalk.bold('SHC Interactive Mode'),
    tags: true,
    border: {
      type: 'line',
    },
    style: {
      fg: 'white',
      border: {
        fg: 'blue',
      },
    },
  });

  // Create a list for the main menu options
  const mainMenu = blessed.list({
    top: 3,
    left: 'center',
    width: '50%',
    height: 10,
    items: [
      'Create a new request',
      'Execute a request',
      'Manage collections',
      'Exit',
    ],
    tags: true,
    border: {
      type: 'line',
    },
    style: {
      selected: {
        bg: 'blue',
        fg: 'white',
      },
      item: {
        fg: 'white',
      },
      border: {
        fg: 'blue',
      },
    },
  });

  // Create a box for status messages
  const statusBox = blessed.box({
    bottom: 0,
    left: 0,
    width: '100%',
    height: 3,
    content: 'Press q to exit, arrow keys to navigate, enter to select',
    tags: true,
    border: {
      type: 'line',
    },
    style: {
      fg: 'white',
      border: {
        fg: 'blue',
      },
    },
  });

  // Add the boxes to the screen
  screen.append(mainMenuBox);
  mainMenuBox.append(mainMenu);
  screen.append(statusBox);

  // Set key bindings
  screen.key(['escape', 'q', 'C-c'], () => {
    return process.exit(0);
  });

  // Add navigation key bindings
  screen.key(['up', 'k'], () => {
    // Type assertion for blessed list element
    const list = mainMenu as unknown as { up: (offset?: number) => void };
    list.up(1);
    screen.render();
  });

  screen.key(['down', 'j'], () => {
    // Type assertion for blessed list element
    const list = mainMenu as unknown as { down: (offset?: number) => void };
    list.down(1);
    screen.render();
  });

  screen.key(['enter', 'return'], () => {
    // Type assertion for blessed list element
    const list = mainMenu as unknown as { 
      selected: number; 
      items: { content: string }[];
      emit: (event: string, item: any, index: number) => void;
    };
    list.emit('select', list.items[list.selected], list.selected);
  });

  // Handle menu selection
  mainMenu.on('select', (item, index) => {
    switch (index) {
      case 0: // Create a new request
        statusBox.setContent('Creating a new request...');
        screen.render();
        // Create a new request form
        createRequestForm(screen, (requestOptions) => {
          // Here we would normally send the request, but for now just show a success message
          statusBox.setContent(`Request created: ${requestOptions.method} ${requestOptions.url}`);
          screen.render();
        });
        break;
      case 1: // Execute a request
        statusBox.setContent('Execute a request selected - Feature coming soon');
        screen.render();
        // TODO: Implement request execution
        break;
      case 2: // Manage collections
        statusBox.setContent('Manage collections selected - Feature coming soon');
        screen.render();
        // TODO: Implement collection management
        break;
      case 3: // Exit
        process.exit(0);
        break;
    }
  });

  // Focus on the main menu
  mainMenu.focus();

  return {
    screen,
    start: () => {
      // Clear the terminal and render the screen
      process.stdout.write('\x1b[2J\x1b[0f'); // Clear screen and move cursor to top-left
      screen.render();
    },
    stop: () => {
      // Destroy the screen
      screen.destroy();
    },
  };
}

/**
 * Create a form for request creation
 */
export function createRequestForm(screen: blessed.Widgets.Screen, callback: (request: RequestOptions) => void): void {
  // Create a form box
  const formBox = blessed.box({
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    content: chalk.bold('Create a New Request'),
    tags: true,
    border: {
      type: 'line',
    },
    style: {
      fg: 'white',
      border: {
        fg: 'green',
      },
    },
  });

  // Method dropdown
  const methodLabel = blessed.text({
    top: 3,
    left: 2,
    content: 'HTTP Method:',
    style: {
      fg: 'white',
    },
  });

  const methodDropdown = blessed.list({
    top: 4,
    left: 2,
    width: 20,
    height: 7,
    items: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'],
    tags: true,
    border: {
      type: 'line',
    },
    style: {
      selected: {
        bg: 'blue',
        fg: 'white',
      },
      item: {
        fg: 'white',
      },
      border: {
        fg: 'blue',
      },
    },
  });

  // URL input
  const urlLabel = blessed.text({
    top: 12,
    left: 2,
    content: 'URL:',
    style: {
      fg: 'white',
    },
  });

  const urlInput = blessed.textbox({
    top: 13,
    left: 2,
    width: '80%',
    height: 3,
    inputOnFocus: true,
    border: {
      type: 'line',
    },
    style: {
      fg: 'white',
      border: {
        fg: 'blue',
      },
    },
  });

  // Add navigation instructions
  const instructionsText = blessed.text({
    bottom: 3,
    left: 2,
    content: 'Tab: Next field | Shift+Tab: Previous field | Enter: Submit | Esc: Cancel',
    style: {
      fg: 'white',
    },
  });

  // Add the form elements to the screen
  screen.append(formBox);
  formBox.append(methodLabel);
  formBox.append(methodDropdown);
  formBox.append(urlLabel);
  formBox.append(urlInput);
  formBox.append(instructionsText);

  // Set key bindings for the form
  screen.key(['escape'], () => {
    formBox.destroy();
    screen.render();
  });

  // Add navigation key bindings for the method dropdown
  screen.key(['up', 'k'], () => {
    // Type assertion for blessed element with focused property
    const element = methodDropdown as unknown as { focus: () => void; hasFocus: boolean; up: (offset?: number) => void };
    if (element.hasFocus) {
      element.up(1);
      screen.render();
    }
  });

  screen.key(['down', 'j'], () => {
    // Type assertion for blessed element with focused property
    const element = methodDropdown as unknown as { focus: () => void; hasFocus: boolean; down: (offset?: number) => void };
    if (element.hasFocus) {
      element.down(1);
      screen.render();
    }
  });

  // Tab navigation between form elements
  screen.key(['tab'], () => {
    // Type assertions for blessed elements with hasFocus property
    const methodElement = methodDropdown as unknown as { focus: () => void; hasFocus: boolean };
    const urlElement = urlInput as unknown as { focus: () => void; hasFocus: boolean };
    
    if (methodElement.hasFocus) {
      urlElement.focus();
    } else if (urlElement.hasFocus) {
      methodElement.focus();
    }
    screen.render();
  });

  screen.key(['S-tab'], () => {
    // Type assertions for blessed elements with hasFocus property
    const methodElement = methodDropdown as unknown as { focus: () => void; hasFocus: boolean };
    const urlElement = urlInput as unknown as { focus: () => void; hasFocus: boolean };
    
    if (methodElement.hasFocus) {
      urlElement.focus();
    } else if (urlElement.hasFocus) {
      methodElement.focus();
    }
    screen.render();
  });

  // Handle form submission
  methodDropdown.on('select', (item) => {
    urlInput.focus();
    screen.render();
  });

  urlInput.key(['enter'], () => {
    // Type assertion for blessed list element
    const list = methodDropdown as unknown as { 
      selected: number; 
      items: { content: string }[];
    };
    const method = list.items[list.selected].content as HttpMethod;
    const url = urlInput.getValue() || '';

    if (url.trim() === '') {
      // Show error message
      const errorBox = blessed.message({
        top: 'center',
        left: 'center',
        width: 40,
        height: 5,
        content: 'URL is required',
        tags: true,
        border: {
          type: 'line',
        },
        style: {
          fg: 'red',
          border: {
            fg: 'red',
          },
        },
      });
      screen.append(errorBox);
      // Type assertion for blessed message element
      (errorBox as unknown as { display: (time: number, callback?: () => void) => void }).display(0);
      screen.render();
      return;
    }

    // Create request options
    const requestOptions: RequestOptions = {
      method,
      url,
      headers: {},
      params: {},
    };

    // Call the callback with the request options
    callback(requestOptions);

    // Remove the form
    formBox.destroy();
    screen.render();
  });

  // Focus on the method dropdown
  methodDropdown.focus();
  screen.render();
}

/**
 * Display response in TUI
 */
export function displayResponse(
  screen: blessed.Widgets.Screen, 
  response: any, 
  outputOptions: OutputOptions
): void {
  // Create a response box
  const responseBox = blessed.box({
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    content: chalk.bold('Response'),
    tags: true,
    border: {
      type: 'line',
    },
    style: {
      fg: 'white',
      border: {
        fg: 'green',
      },
    },
    scrollable: true,
    alwaysScroll: true,
    scrollbar: {
      style: {
        bg: 'blue',
      },
    },
  });

  // Format the response
  let formattedResponse = '';
  try {
    formattedResponse = formatResponse(response, outputOptions);
  } catch (error) {
    formattedResponse = `Error formatting response: ${error instanceof Error ? error.message : String(error)}`;
  }

  // Create a scrollable text box for the response
  const responseText = blessed.text({
    top: 2,
    left: 2,
    width: '95%',
    height: '90%',
    content: formattedResponse,
    tags: true,
    scrollable: true,
    alwaysScroll: true,
    scrollbar: {
      style: {
        bg: 'blue',
      },
    },
  });

  // Add the response elements to the screen
  screen.append(responseBox);
  responseBox.append(responseText);

  // Set key bindings
  screen.key(['escape', 'q'], () => {
    responseBox.destroy();
    screen.render();
  });

  // Focus on the response text
  responseText.focus();
  screen.render();
}
