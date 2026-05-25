import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';

import AppletImage from '@/components/Applet/AppletImage.vue';

describe('AppletImage', () => {
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
});
