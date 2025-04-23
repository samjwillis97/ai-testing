import chalk from 'chalk';

export class Spinner {
  private text: string;
  private frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  private currentFrame = 0;
  private interval: NodeJS.Timeout | null = null;

  constructor(text: string) {
    this.text = text;
  }

  start() {
    process.stdout.write('\x1B[?25l'); // Hide cursor
    this.interval = setInterval(() => {
      process.stdout.write('\r' + chalk.blue(this.frames[this.currentFrame]) + ' ' + this.text);
      this.currentFrame = (this.currentFrame + 1) % this.frames.length;
    }, 80);
    return this;
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    process.stdout.write('\x1B[?25h'); // Show cursor
    process.stdout.write('\r\x1B[K'); // Clear line
    return this;
  }

  succeed(text?: string) {
    this.stop();
    console.log(chalk.green('✓') + ' ' + (text || this.text));
    return this;
  }

  fail(text?: string) {
    this.stop();
    console.log(chalk.red('✗') + ' ' + (text || this.text));
    return this;
  }
} 