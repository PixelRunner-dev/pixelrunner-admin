import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';

import AppletImage from '@/components/Applet/AppletImage.vue';

describe('AppletImage', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-03T00:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('adds cache-busting timestamp for remote images', () => {
    const wrapper = mount(AppletImage, {
      props: {
        src: '/applets/weather.webp',
        alt: 'Weather applet',
        dateCreated: new Date('2026-01-01T00:00:00.000Z'),
        dateModified: new Date('2026-01-02T00:00:00.000Z')
      }
    });

    expect(wrapper.get('img').attributes('src')).toBe('/applets/weather.webp?v=17673120');
    expect(wrapper.get('img').attributes('alt')).toBe('Weather applet');
  });

  it('keeps base64 images unchanged and can render the frame wrapper', () => {
    const src = 'data:image/webp;base64,AAAA';
    const wrapper = mount(AppletImage, {
      props: {
        src,
        alt: 'Inline applet',
        showFrame: true,
        dateCreated: new Date('2026-01-01T00:00:00.000Z')
      }
    });

    expect(wrapper.classes()).toContain('is-showing-frame');
    expect(wrapper.find('.image-frame').exists()).toBe(true);
    expect(wrapper.get('img').attributes('src')).toBe(src);
  });

  it('shows the placeholder image when the WebP asset is still pending', async () => {
    const wrapper = mount(AppletImage, {
      props: {
        src: '/applets/pending.webp',
        alt: 'Pending applet',
        dateCreated: new Date('2026-01-01T00:00:00.000Z')
      }
    });
    const image = wrapper.get('img');

    await image.trigger('error');

    expect(wrapper.get('img').attributes('src')).toBe('/broken-image.webp');
  });

  it('refreshes timestamp without dateModified and resets error state when src changes', async () => {
    const wrapper = mount(AppletImage, {
      props: {
        src: '/applets/pending.webp',
        alt: 'Pending applet',
        dateCreated: new Date('2026-01-01T00:00:00.000Z')
      }
    });

    expect(wrapper.get('img').attributes('src')).toBe('/applets/pending.webp?v=17673984');

    await wrapper.get('img').trigger('error');
    expect(wrapper.get('img').attributes('src')).toBe('/broken-image.webp');

    await wrapper.setProps({ src: '/applets/ready.webp' });
    expect(wrapper.get('img').attributes('src')).toBe('/applets/ready.webp?v=17673984');

    vi.setSystemTime(new Date('2026-01-03T00:02:00.000Z'));
    vi.advanceTimersByTime(1000);
    await wrapper.vm.$nextTick();

    expect(wrapper.get('img').attributes('src')).toBe('/applets/ready.webp?v=17673985');
  });
});
