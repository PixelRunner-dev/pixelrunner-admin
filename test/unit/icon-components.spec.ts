import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import IconImage from '@/components/Icon/IconImage.vue';
import IconSprite from '@/components/Icon/IconSprite.vue';

describe('IconImage', () => {
  it('renders default decorative SVG attributes and icon reference', () => {
    const wrapper = mount(IconImage, {
      props: {
        iconId: 'icon--search',
        alt: ''
      }
    });

    const svg = wrapper.find('svg');

    expect(svg.classes()).toEqual(['component--icon', 'icon', 'icon--search']);
    expect(svg.attributes('width')).toBe('16');
    expect(svg.attributes('height')).toBe('16');
    expect(svg.attributes('fill')).toBe('#000');
    expect(svg.attributes('stroke')).toBe('#fff');
    expect(svg.attributes('role')).toBe('img');
    expect(svg.attributes('aria-hidden')).toBe('true');
    expect(svg.find('title').exists()).toBe(false);
    expect(svg.find('use').attributes('href')).toBe('#icon--search');
  });

  it('renders accessible title and custom presentation props', () => {
    const wrapper = mount(IconImage, {
      props: {
        iconId: 'icon--check',
        alt: 'Selected',
        className: 'text-success',
        size: 24,
        isDecorative: false,
        fill: 'currentColor',
        stroke: 'none'
      }
    });

    const svg = wrapper.find('svg');

    expect(svg.classes()).toEqual(['component--icon', 'icon', 'icon--check', 'text-success']);
    expect(svg.attributes('width')).toBe('24');
    expect(svg.attributes('height')).toBe('24');
    expect(svg.attributes('fill')).toBe('currentColor');
    expect(svg.attributes('stroke')).toBe('none');
    expect(svg.attributes('aria-hidden')).toBe('false');
    expect(svg.find('title').text()).toBe('Selected');
    expect(svg.find('use').attributes('href')).toBe('#icon--check');
  });
});

describe('IconSprite', () => {
  it('injects the raw SVG sprite into a hidden container', () => {
    const wrapper = mount(IconSprite);

    expect(wrapper.attributes('aria-hidden')).toBe('true');
    expect(wrapper.attributes('style')).toContain('position: absolute');
    expect(wrapper.find('svg').exists()).toBe(true);
    expect(wrapper.find('symbol#icon--search').exists()).toBe(true);
    expect(wrapper.find('symbol#icon--check').exists()).toBe(true);
  });
});
