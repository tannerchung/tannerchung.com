import type { Preview } from '@storybook/nextjs-vite'
import React, { useEffect } from 'react'
import '../src/app/(frontend)/globals.css'

const preview: Preview = {
  globalTypes: {
    lumenDrop: {
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
    lumenDrop: 'night',
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
      const drop = (context.globals.lumenDrop as 'night' | 'day') || 'night'
      useEffect(() => {
        document.documentElement.dataset.theme = 'lumen'
        document.documentElement.dataset.drop = drop
      }, [drop])

      return React.createElement(
        'div',
        {
          'data-theme': 'lumen',
          'data-drop': drop,
          className: 'min-h-screen bg-[var(--color-paper)] text-[var(--color-ink)]',
          style: {
            fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
          },
        },
        React.createElement(Story),
      )
    },
  ],
}

export default preview
