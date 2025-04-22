import { HttpClient } from '@shc/core'
import ora from 'ora'
import chalk from 'chalk'

interface SendOptions {
  method?: string
  header?: string[]
  data?: string
}

export async function send(url: string, options: SendOptions) {
  const spinner = ora('Sending request...').start()
  const client = new HttpClient()

  try {
    const headers = options.header?.reduce((acc, header) => {
      const [key, value] = header.split(':').map((s) => s.trim())
      return { ...acc, [key]: value }
    }, {}) || {}

    const response = await client.request({
      url,
      method: options.method || 'GET',
      headers,
      data: options.data ? JSON.parse(options.data) : undefined,
    })

    spinner.succeed('Request successful')
    console.log('\nResponse:')
    console.log(chalk.blue('Status:'), response.status)
    console.log(chalk.blue('Headers:'))
    console.log(JSON.stringify(response.headers, null, 2))
    console.log(chalk.blue('\nBody:'))
    console.log(JSON.stringify(response.data, null, 2))
    console.log(chalk.blue('\nDuration:'), `${response.duration}ms`)
  } catch (error) {
    spinner.fail('Request failed')
    console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'))
    process.exit(1)
  }
} 