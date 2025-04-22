/// <reference types="jest" />
import { HttpClient } from '../src'
import axios from 'axios'

jest.mock('axios')

describe('HttpClient', () => {
  let client: HttpClient
  let mockAxiosInstance: jest.Mocked<typeof axios>

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Create a mock axios instance
    mockAxiosInstance = {
      request: jest.fn(),
      create: jest.fn(),
    } as any;
    
    (axios as jest.Mocked<typeof axios>).create.mockReturnValue(mockAxiosInstance)
    
    client = new HttpClient()
  })

  it('should make a successful request', async () => {
    const mockResponse = {
      data: { message: 'success' },
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
      config: {},
    }

    mockAxiosInstance.request.mockResolvedValueOnce(mockResponse)

    const response = await client.request({
      url: 'https://api.example.com/test',
      method: 'GET',
    })

    expect(response.status).toBe(200)
    expect(response.data).toEqual({ message: 'success' })
    expect(response.duration).toBeDefined()
    expect(response.timestamp).toBeDefined()
  })

  it('should handle request errors', async () => {
    const mockError = new Error('Network error')
    mockAxiosInstance.request.mockRejectedValueOnce(mockError)

    await expect(
      client.request({
        url: 'https://api.example.com/test',
        method: 'GET',
      })
    ).rejects.toThrow('Network error')
  })

  it('should apply environment variables', async () => {
    const mockResponse = { data: {}, status: 200, headers: {}, config: {} }
    mockAxiosInstance.request.mockResolvedValueOnce(mockResponse)

    client.setEnvironment({
      name: 'test',
      variables: {
        API_KEY: 'secret-key',
      },
      baseUrl: 'https://api.example.com',
    })

    await client.request({
      url: '/test',
      method: 'GET',
      environmentVariables: {
        Authorization: 'Bearer ${API_KEY}',
      },
    })

    expect(mockAxiosInstance.request).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/test',
        method: 'GET',
        headers: {
          Authorization: 'Bearer secret-key',
        },
      })
    )
  })

  it('should run plugins in order', async () => {
    const mockResponse = { data: {}, status: 200, headers: {}, config: {} }
    const operations: string[] = []

    mockAxiosInstance.request.mockResolvedValueOnce(mockResponse)

    client.use({
      name: 'plugin1',
      version: '1.0.0',
      onRequest: async (config) => {
        operations.push('plugin1-request')
        return config
      },
      onResponse: async (response) => {
        operations.push('plugin1-response')
        return response
      },
    })

    client.use({
      name: 'plugin2',
      version: '1.0.0',
      onRequest: async (config) => {
        operations.push('plugin2-request')
        return config
      },
      onResponse: async (response) => {
        operations.push('plugin2-response')
        return response
      },
    })

    await client.request({
      url: 'https://api.example.com/test',
      method: 'GET',
    })

    expect(operations).toEqual([
      'plugin1-request',
      'plugin2-request',
      'plugin1-response',
      'plugin2-response',
    ])
  })
}) 