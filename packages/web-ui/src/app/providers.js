'use client';
import { ChakraProvider, ColorModeScript } from '@chakra-ui/react';
import { CacheProvider } from '@chakra-ui/next-js';
import { theme } from '../theme';
export function Providers({ children }) {
  return (
    <CacheProvider>
      <ChakraProvider theme={theme}>
        <ColorModeScript initialColorMode={theme.config.initialColorMode} />
        {children}
      </ChakraProvider>
    </CacheProvider>
  );
}
