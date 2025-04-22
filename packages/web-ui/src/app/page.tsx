'use client';

import { Box, Container, Heading, VStack } from '@chakra-ui/react';
import { RequestBuilder } from '../components/RequestBuilder';

export default function Home() {
  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Heading as="h1" size="xl" textAlign="center">
          Sam's HTTP Client
        </Heading>
        <Box>
          <RequestBuilder />
        </Box>
      </VStack>
    </Container>
  );
}
