import type { Preview } from '@storybook/nextjs-vite'
import React, { useEffect } from 'react'
import '../src/app/(frontend)/globals.css'

const preview: Preview = {
  globalTypes: {
    drop: {
      description: 'Hallmark Lumen Foundry Drop',
      toolbar: {
        title: 'Lumen',
        icon: 'mirror',
        items: [
          { value: 'night', title: 'Night Foundry' },
          { value: 'day', title: 'Day Foundry' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    drop: 'night',
  },
  parameters: {
    nextjs: {
      appDirectory: true,
    },
    layout: 'fullscreen',
    backgrounds: { disable: true },
  },
  decorators: [
    (Story, context) => {
      const rawDrop = context.globals.drop ?? context.globals.lumenDrop ?? 'night'
      const drop: 'night' | 'day' = rawDrop === 'day' ? 'day' : 'night'

      useEffect(() => {
        document.documentElement.dataset.theme = 'lumen'
        document.documentElement.dataset.drop = drop
        document.documentElement.style.colorScheme = drop === 'day' ? 'light' : 'dark'
      }, [drop])

      return React.createElement(
        'div',
        {
          'data-theme': 'lumen',
          'data-drop': drop,
          className: 'min-h-screen bg-[var(--color-paper)] text-[var(--color-ink)]',
          style: {
            colorScheme: drop === 'day' ? 'light' : 'dark',
            ['--font-serif' as string]: '"Instrument Serif", Georgia, serif',
            ['--font-sans' as string]: '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif',
            ['--font-mono' as string]: '"JetBrains Mono", ui-monospace, SFMono-Regular, monospace',
          },
        },
        React.createElement(Story),
      )
    },
  ],
}

export default preview
