'use client';
import { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  VStack,
  useToast,
} from '@chakra-ui/react';
import { HttpClient } from '@shc/core';
const httpClient = new HttpClient();
export function RequestBuilder() {
  const [method, setMethod] = useState('GET');
  const [url, setUrl] = useState('');
  const [body, setBody] = useState('');
  const [headers, setHeaders] = useState('');
  const toast = useToast();
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const parsedHeaders = headers
        ? Object.fromEntries(
            headers.split('\n').map((line) => {
              const [key, value] = line.split(':').map((s) => s.trim());
              return [key, value];
            })
          )
        : {};
      const response = await httpClient.request({
        method,
        url,
        headers: parsedHeaders,
        data: body ? JSON.parse(body) : undefined,
      });
      toast({
        title: 'Request successful',
        description: `Status: ${response.status}`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Request failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };
  return (
    <Box as="form" onSubmit={handleSubmit}>
      <VStack spacing={4} align="stretch">
        <FormControl>
          <FormLabel>Method</FormLabel>
          <Select value={method} onChange={(e) => setMethod(e.target.value)}>
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="DELETE">DELETE</option>
            <option value="PATCH">PATCH</option>
          </Select>
        </FormControl>

        <FormControl>
          <FormLabel>URL</FormLabel>
          <Input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://api.example.com/endpoint"
          />
        </FormControl>

        <FormControl>
          <FormLabel>Headers (one per line, key: value)</FormLabel>
          <Textarea
            value={headers}
            onChange={(e) => setHeaders(e.target.value)}
            placeholder="Content-Type: application/json"
          />
        </FormControl>

        <FormControl>
          <FormLabel>Body (JSON)</FormLabel>
          <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="{}" />
        </FormControl>

        <Button type="submit" colorScheme="blue">
          Send Request
        </Button>
      </VStack>
    </Box>
  );
}
