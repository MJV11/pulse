'use client';

import {
  Timeline as FlowbiteTimeline,
  type TimelineProps,
} from 'flowbite-react';

// ── Theme ─────────────────────────────────────────────────────────────────────
// Passed once to <Timeline theme={...}>; Flowbite propagates it via context
// to all Timeline.Item, Timeline.Point, Timeline.Content, etc. children.

const timelineTheme = {
  root: {
    direction: {
      vertical: 'relative border-s border-silicongray-700',
      horizontal: 'sm:flex',
    },
  },
  item: {
    root: {
      vertical: 'mb-6 ms-6',
      horizontal: 'relative mb-6 sm:mb-0',
    },
    content: {
      root: {
        base: 'flex flex-col gap-0.5',
        vertical: '',
        horizontal: 'mt-3 sm:pe-8',
      },
      time: {
        base: '',
      },
      title: {
        base: '',
      },
      body: {
        base: '',
      },
    },
    point: {
      vertical: '',
      horizontal: '',
      line: 'hidden h-0.5 w-full bg-silicongray-700 sm:flex',
      marker: {
        base: {
          vertical:
            'absolute -start-3 flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-[#0f0f0f] bg-silicongray-800 border border-silicongray-600',
          horizontal:
            'flex h-6 w-6 shrink-0 items-center justify-center rounded-full ring-4 ring-[#0f0f0f] bg-silicongray-800 border border-silicongray-600',
        },
        icon: {
          base: 'h-3 w-3 text-white',
          wrapper:
            'absolute -start-3 flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-[#0f0f0f] bg-silicongray-800 border border-silicongray-600',
        },
      },
    },
  },
};

// ── Timeline proxy ────────────────────────────────────────────────────────────
// Wraps the root component with our theme; all sub-components (Item, Point,
// Content, Time, Title, Body) are forwarded unchanged from Flowbite so they
// receive the theme through context automatically.

const TimelineRoot = ({ theme, ...props }: TimelineProps) => (
  <FlowbiteTimeline theme={{ ...timelineTheme, ...theme }} {...props} />
);

TimelineRoot.displayName = 'Timeline';
TimelineRoot.Item = FlowbiteTimeline.Item;
TimelineRoot.Point = FlowbiteTimeline.Point;
TimelineRoot.Content = FlowbiteTimeline.Content;
TimelineRoot.Time = FlowbiteTimeline.Time;
TimelineRoot.Title = FlowbiteTimeline.Title;
TimelineRoot.Body = FlowbiteTimeline.Body;

export const Timeline = TimelineRoot;
